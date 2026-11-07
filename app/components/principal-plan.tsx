"use client";
import { useRef, useState, useEffect, type KeyboardEvent } from "react";
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import {
  Plus,
  Minus,
  Maximize,
  ExternalLink,
  Info,
  MapPin,
  ArrowUpRight,
  Layers,
  Footprints,
  Accessibility,
  GlassWater,
  DoorOpen,
} from "lucide-react";
import plans from "../data/principal-plan.json";
import { sessions, type Session } from "../data/event-data";
import type { IndoorTarget } from "../data/principal-model";
type Zone = (typeof plans.floors)[number]["zones"][number];
type Corridor = (typeof plans.floors)[number]["corridors"][number];
const colors: Record<string, string> = {
  classroom: "#dce8f7",
  laboratory: "#afc9e9",
  staff: "#dbe2f0",
  auditorium: "#3e6395",
  courtyard: "#d9ebd6",
  stairs: "#c4d9d6",
  restroom: "#adcae7",
  accessible: "#bed3e9",
  ramp: "#f0f3f7",
  exit: "#f0f3f7",
  water: "#a9cfdf",
  reception: "#d1e7df",
};
function zoneText(z: Zone) {
  if (z.kind === "stairs")
    return "Caixa de escada separada, à esquerda da circulação. O acesso fica na lateral; a escada não ocupa o corredor.";
  if (z.kind === "ramp")
    return "Rampa de acessibilidade na lateral direita. Ocupa toda a largura da faixa e termina no meio da linha da recepção, com um patamar aberto abaixo.";
  if (z.kind === "courtyard")
    return "Área central entre as duas faixas internas de salas de aula.";
  if (z.kind === "auditorium")
    return "Auditório no térreo, na ala esquerda. A saída fica no recuo inferior.";
  if (z.kind === "accessible")
    return "Sanitário acessível na extremidade direita, junto aos demais banheiros.";
  if (z.kind === "water")
    return "Bebedouro do 1º andar, no canto inferior esquerdo do patamar da rampa.";
  if (z.kind === "reception")
    return "Recepção do térreo, ocupando a extremidade da faixa inferior de salas. A porta abre para o corredor, que fica livre para a passagem.";
  if (z.roomNumber)
    return `${z.useLabel} · ${z.description}. Numeração demonstrativa para explorar a experiência do evento.`;
  if (z.id.includes("interna-norte"))
    return "Sala no lado interno do corredor superior. Há salas de aula também no lado oposto do corredor.";
  if (z.id.includes("interna-sul"))
    return "Sala no lado interno do corredor inferior. Há salas de aula também no lado oposto do corredor.";
  if (z.kind === "exit")
    return "Saída do auditório no recuo da ala esquerda do térreo.";
  return "Ambiente representado de acordo com o desenho fornecido. Os nomes são descritivos, sem numeração oficial de salas.";
}
export function PlanSvg({
  floor,
  selected,
  onSelect,
  interactive = true,
  viewBox,
}: {
  floor: (typeof plans.floors)[number];
  selected: string;
  onSelect: (id: string) => void;
  interactive?: boolean;
  viewBox?: string;
}) {
  function key(e: KeyboardEvent<SVGGElement>, id: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(id);
    }
  }
  return (
    <svg
      className="principal-plan-svg"
      viewBox={viewBox || plans.viewBox}
      role={interactive ? "group" : "img"}
      aria-label={
        interactive
          ? "Planta do bloco principal, " + floor.label
          : "Prévia ampliada da sala na planta"
      }
    >
      <path d={floor.outline} fill="#f0f3f7" />
      {floor.corridors.map((c) => (
        <g
          key={c.id}
          role={interactive ? "button" : undefined}
          tabIndex={interactive ? 0 : undefined}
          aria-label={
            interactive ? "Selecionar " + c.label.toLowerCase() : undefined
          }
          aria-pressed={selected === c.id}
          onClick={() => onSelect(c.id)}
          onKeyDown={(e) => key(e, c.id)}
        >
          <rect
            data-plan-kind="corridor"
            data-region-id={c.id}
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            fill={selected === c.id ? "#e0eae7" : "#f0f3f7"}
          />
        </g>
      ))}
      {floor.zones.map((z) => {
        const poly = z as Zone & {
          points?: string;
          labelX?: number;
          labelY?: number;
        };
        const rect = z as Zone & {
          x?: number;
          y?: number;
          w?: number;
          h?: number;
        };
        const x = poly.labelX ?? (rect.x ?? 0) + (rect.w ?? 0) / 2,
          y = poly.labelY ?? (rect.y ?? 0) + (rect.h ?? 0) / 2;
        const active = selected === z.id;
        return (
          <g
            key={z.id}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            id={
              interactive ? `principal-zone-${floor.level}-${z.id}` : undefined
            }
            aria-label={
              interactive ? "Selecionar " + z.label.toLowerCase() : undefined
            }
            aria-pressed={active}
            onClick={() => onSelect(z.id)}
            onKeyDown={(e) => key(e, z.id)}
            className="floor-room"
          >
            <title>{z.label}</title>
            {poly.points ? (
              <polygon
                data-plan-kind={z.kind}
                data-region-id={z.id}
                points={poly.points}
                fill={
                  z.kind === "water"
                    ? "transparent"
                    : active
                      ? "#b6d3cd"
                      : colors[z.kind]
                }
                stroke={
                  z.kind === "water" ? "none" : active ? "#638d7f" : "#607b9b"
                }
                strokeWidth={active ? 3 : 2}
              />
            ) : (
              <rect
                data-plan-kind={z.kind}
                data-region-id={z.id}
                x={rect.x}
                y={rect.y}
                width={rect.w}
                height={rect.h}
                fill={
                  z.kind === "water"
                    ? "transparent"
                    : active
                      ? "#b6d3cd"
                      : colors[z.kind]
                }
                stroke={
                  z.kind === "water" ? "none" : active ? "#638d7f" : "#607b9b"
                }
                strokeWidth={active ? 3 : 2}
              />
            )}
            {z.kind === "stairs" ? (
              <g pointerEvents="none">
                <path
                  d="M177 158H223M177 164H223M177 170H223M177 176H223M177 182H223M177 188H223"
                  stroke="#6c879b"
                  strokeWidth="1.5"
                />
                <path
                  d="M181 187v-25l-3 5m3-5 3 5"
                  stroke="#6a8b87"
                  fill="none"
                  strokeWidth="1.5"
                />
                <text
                  x="200"
                  y="202"
                  textAnchor="middle"
                  fill="#517679"
                  fontSize="10"
                  fontWeight="600"
                >
                  Escada
                </text>
              </g>
            ) : z.kind === "ramp" ? (
              <g pointerEvents="none">
                <path
                  d={floor.rampRails}
                  fill="none"
                  stroke="#8ea5bf"
                  strokeWidth="2.3"
                />
                <path
                  d={floor.rampArrows}
                  fill="none"
                  stroke="#6d87a9"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y}
                  transform={`rotate(-90 ${x} ${y})`}
                  fill="#8ea4bd"
                  fontSize={floor.level === 0 ? 9 : 11}
                  textAnchor="middle"
                >
                  Rampa
                </text>
              </g>
            ) : z.kind === "accessible" ? (
              <g pointerEvents="none">
                <Accessibility
                  x={x - 12}
                  y={y - 18}
                  width={24}
                  height={24}
                  stroke="#4c6f98"
                  strokeWidth={1.7}
                />
                <text
                  x={x}
                  y={y + 22}
                  fontSize="8"
                  textAnchor="middle"
                  fill="#5d7b9e"
                >
                  Acessível
                </text>
              </g>
            ) : z.kind === "water" ? (
              <GlassWater
                x={x - 8}
                y={y - 8}
                width={16}
                height={16}
                stroke="#5b869e"
              />
            ) : (
              <text
                x={x}
                y={y}
                dominantBaseline="middle"
                textAnchor="middle"
                fill={z.kind === "auditorium" && !active ? "#fff" : "#36577d"}
                fontSize={
                  z.kind === "reception"
                    ? 11
                    : z.kind === "restroom"
                      ? 12
                      : z.id === "sala-sudoeste"
                        ? 11
                        : 14
                }
                fontWeight={z.kind === "auditorium" ? 650 : 500}
                pointerEvents="none"
              >
                {z.lines.map((line, i) => (
                  <tspan
                    key={i}
                    x={x}
                    dy={i === 0 ? -(z.lines.length - 1) * 8 : 16}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            )}
          </g>
        );
      })}
      {floor.entryRoute.length > 0 && (
        <g pointerEvents="none">
          <polyline
            data-route="entrada-recepcao"
            points={floor.entryRoute.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke="#79a58f"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <path
            d={floor.entryArrow}
            fill="none"
            stroke="#79a58f"
            strokeWidth="2"
          />
        </g>
      )}
      {floor.doors.map((d, i) => (
        <path
          key={i}
          d={
            d.axis === "h" ? `M${d.x - 11} ${d.y}h22` : `M${d.x} ${d.y - 11}v22`
          }
          fill="none"
          stroke="#f0f3f7"
          strokeWidth="5"
          pointerEvents="none"
        />
      ))}
      <path
        d="M230 170v20"
        stroke="#f0f3f7"
        strokeWidth="5"
        pointerEvents="none"
      />
      <text
        x="515"
        y="98"
        textAnchor="middle"
        fill="#758ca6"
        fontSize="14"
        pointerEvents="none"
      >
        Corredor
      </text>
      <text
        x="515"
        y="272"
        textAnchor="middle"
        fill="#758ca6"
        fontSize="14"
        pointerEvents="none"
      >
        Corredor
      </text>
      {floor.level > 0 && (
        <text
          x="120"
          y="272"
          textAnchor="middle"
          fill="#758ca6"
          fontSize="13"
          pointerEvents="none"
        >
          Corredor
        </text>
      )}
      <path
        d={floor.outline}
        fill="none"
        stroke="#3c577a"
        strokeWidth="3.5"
        strokeLinejoin="round"
        pointerEvents="none"
      />
      {floor.level === 0 && (
        <>
          <path d="M151 340h45M807 390h25M236 20h18" stroke="#f7f9fd" strokeWidth="7" />
          <text
            x="172"
            y="360"
            textAnchor="middle"
            fontSize="12"
            fill="#7d93ae"
          >
            Saída
          </text>
        </>
      )}
      {floor.level === 0 ? (
        <text x="820" y="414" textAnchor="middle" fontSize="10" fill="#7d93ae">
          Entrada
        </text>
      ) : floor.level === 1 ? (
        <g pointerEvents="none">
          <text x="806" y="404" textAnchor="start" fontSize="10" fill="#7d93ae">
            Bebedouro
          </text>
        </g>
      ) : (
        <text x="835" y="414" textAnchor="middle" fontSize="10" fill="#7d93ae">
          Rampa de acessibilidade
        </text>
      )}
    </svg>
  );
}
export default function PrincipalPlan({
  onOpenSession,
  target,
}: {
  onOpenSession: (s: Session) => void;
  target?: IndoorTarget;
}) {
  const [level, setLevel] = useState(target?.floor ?? 0),
    [selected, setSelected] = useState(target?.zoneId ?? "auditorio"),
    [scale, setScale] = useState(1),
    [info, setInfo] = useState(false);
  const zoom = useRef<ReactZoomPanPinchRef>(null);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (focusTimer.current) clearTimeout(focusTimer.current);
    },
    [],
  );
  const floor = plans.floors[level];
  const zone = floor.zones.find((z) => z.id === selected);
  const corridor = floor.corridors.find((c) => c.id === selected);
  return (
    <section className="principal-plan-screen no-scroll">
      <div className="principal-plan-intro">
        <div>
          <span className="eyebrow">BLOCO PRINCIPAL / PLANTA INTERNA</span>
          <h1>
            Seu caminho,
            <br />
            andar por andar.
          </h1>
          <span className="room-numbering-note">
            Numeração demonstrativa dos ambientes
          </span>
        </div>
        <button
          className="icon-button"
          aria-label="Sobre a planta interna"
          onClick={() => setInfo(!info)}
        >
          <Info size={19} />
        </button>
      </div>
      {info && (
        <p className="principal-reference-note">
          Desenho esquemático baseado nas imagens e correções fornecidas.
          Numeração demonstrativa; dimensões não representam medidas reais.
        </p>
      )}
      <div
        className="floor-tabs"
        role="tablist"
        aria-label="Andar do bloco principal"
      >
        {plans.floors.map((f) => (
          <button
            role="tab"
            aria-selected={level === f.level}
            key={f.level}
            onClick={() => {
              setLevel(f.level);
              setSelected(
                target?.floor === f.level
                  ? target.zoneId
                  : f.level === 0
                    ? "auditorio"
                    : "corredor-inferior",
              );
              setScale(1);
            }}
          >
            {f.label}
            <span>
              {f.level === 0
                ? "Auditório e salas"
                : f.level === 1
                  ? "Salas e circulação"
                  : "Laboratórios e salas"}
            </span>
          </button>
        ))}
      </div>
      <div className="indoor-plan-canvas">
        <TransformWrapper
          key={level}
          ref={zoom}
          minScale={1}
          maxScale={5}
          initialScale={1}
          onInit={(api) => {
            if (focusTimer.current) clearTimeout(focusTimer.current);
            if (target && target.floor === level) {
              focusTimer.current = setTimeout(
                () =>
                  api.zoomToElement(
                    `principal-zone-${level}-${target.zoneId}`,
                    2.4,
                    400,
                  ),
                250,
              );
            }
          }}
          centerOnInit
          wheel={{ step: 0.15 }}
          onTransform={(_, s) => setScale(s.scale)}
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width: "100%", height: "100%" }}
          >
            <PlanSvg floor={floor} selected={selected} onSelect={setSelected} />
          </TransformComponent>
        </TransformWrapper>
        <div className="indoor-floor-label">
          {floor.label.toUpperCase()}
          <span>TOQUE PARA EXPLORAR</span>
        </div>
        <div className="map-zoom-controls">
          <button
            aria-label="Agrandar planta"
            onClick={() => zoom.current?.zoomIn(0.5)}
          >
            <Plus size={18} />
          </button>
          <span aria-live="polite">{scale.toFixed(1)}×</span>
          <button
            aria-label="Diminuir planta"
            onClick={() => zoom.current?.zoomOut(0.5)}
          >
            <Minus size={18} />
          </button>
          <button
            aria-label="Centralizar planta"
            onClick={() => zoom.current?.resetTransform()}
          >
            <Maximize size={16} />
          </button>
        </div>
        <span className="indoor-gesture-hint">
          Arraste e use pinça ou + para aproximar.
        </span>
      </div>
      <div className="indoor-legend">
        <span>
          <i className="rooms" />
          Salas e laboratórios
        </span>
        {level === 0 && (
          <span>
            <i className="entry-route" />
            Entrada → recepção
          </span>
        )}
        <span>
          <i className="court" />
          Pátio / vão
        </span>
        <span>
          <i className="circulation" />
          Circulação
        </span>
        <span>
          <i className="stairs" />
          Escada lateral
        </span>
      </div>
      <div className="indoor-selection" aria-live="polite">
        <div className="indoor-selection-title">
          <span>
            {zone?.kind === "stairs" ? (
              <Footprints size={20} />
            ) : zone?.kind === "ramp" ? (
              <Accessibility size={20} />
            ) : zone?.kind === "exit" ? (
              <DoorOpen size={20} />
            ) : (
              <MapPin size={20} />
            )}
          </span>
          <div>
            <small>
              {floor.label.toUpperCase()} ·{" "}
              {corridor
                ? "CIRCULAÇÃO"
                : zone?.roomNumber
                  ? zone.useLabel.toUpperCase()
                  : zone?.kind === "stairs"
                    ? "ACESSO LATERAL"
                    : "ESPAÇO DO BLOCO"}
            </small>
            <h2>{corridor?.label || zone?.label}</h2>
          </div>
        </div>
        <p>
          {corridor
            ? corridor.id === "corredor-inferior" && level > 0
              ? "Corredor contínuo em toda a faixa horizontal inferior, incluindo a ala esquerda. Há salas de aula dos dois lados."
              : corridor.id === "corredor-superior"
                ? "Corredor horizontal entre as salas externas e a faixa interna de salas de aula."
                : corridor.id === "patamar"
                  ? "Patamar aberto abaixo da rampa, para dar a volta. No térreo, é a entrada."
                  : corridor.id === "corredor-leste"
                    ? "Um único corredor lateral reto: as faixas de salas terminam no mesmo alinhamento, sem recuos."
                    : "Circulação que conecta os corredores horizontais, com acesso à escada na lateral oeste."
            : zone
              ? zoneText(zone)
              : ""}
        </p>
        {sessions
          .filter((s) => s.floor === level && s.zoneId === selected)
          .map((s) => (
            <button
              className="indoor-activity"
              key={s.id}
              onClick={() => onOpenSession(s)}
            >
              <span>
                {s.shortTitle}
                <small>
                  {s.type} · {s.day} NOV · {s.time}
                </small>
              </span>
              <ArrowUpRight size={17} />
            </button>
          ))}
      </div>
      <a
        className="open-plan-sheet"
        href="/maps/bloco-principal.svg"
        target="_blank"
        rel="noreferrer"
      >
        <Layers size={15} />
        Ver prancha com os três andares
        <ExternalLink size={13} />
      </a>
    </section>
  );
}
