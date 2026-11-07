"use client";
import { useState, useRef, type KeyboardEvent } from "react";
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import {
  Plus,
  Minus,
  Maximize,
  MapPin,
  ArrowUpRight,
  Layers,
  Trees,
  Compass,
  ChevronRight,
  Info,
  Gamepad2,
} from "lucide-react";
import {
  places,
  placeById,
  campusElements,
  coreView,
  wholeView,
  points,
  footprintArea,
  type PlaceId,
} from "../data/campus-model";
import { sessions, type Session } from "../data/event-data";
import { tournaments, type Tournament } from "../data/tournaments";
function MapDrawing({
  active = "laboratorios",
  onSelect,
  events = true,
  vegetation = true,
  whole = false,
  mini = false,
}: {
  active?: PlaceId;
  onSelect?: (id: PlaceId) => void;
  events?: boolean;
  vegetation?: boolean;
  whole?: boolean;
  mini?: boolean;
}) {
  function selectKey(e: KeyboardEvent<SVGGElement>, id: PlaceId) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(id);
    }
  }
  return (
    <svg
      className={"survey-map " + (mini ? "is-mini" : "")}
      viewBox={whole ? wholeView : coreView}
      role={mini ? "img" : "group"}
      aria-label={
        mini
          ? "Localização do espaço no campus"
          : "Planta interativa do IFRN Pau dos Ferros, baseada nas 35 marcações do KML"
      }
    >
      <defs>
        <pattern
          id={mini ? "mini-map-grid" : "survey-grid"}
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r=".25" fill="#bac9c4" />
        </pattern>
        <pattern
          id={mini ? "mini-trees" : "survey-trees"}
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2.5" cy="2.5" r="1.6" fill="#b5ceb8" />
          <circle cx="2.5" cy="2.5" r=".8" fill="#c7d9bf" />
        </pattern>
        <filter
          id="building-shadow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx=".5"
            dy="1"
            stdDeviation=".6"
            floodColor="#788ba1"
            floodOpacity=".13"
          />
        </filter>
      </defs>
      <rect x="-220" y="-330" width="350" height="480" fill="#eef2ec" />
      <polygon
        points={points(22)}
        fill="#f8faf4"
        stroke="#b4c4b5"
        strokeWidth=".8"
        strokeDasharray="2 1"
      />
      <rect
        x="-220"
        y="-330"
        width="350"
        height="480"
        fill={"url(#" + (mini ? "mini-map-grid" : "survey-grid") + ")"}
      />
      <path d="M-120 64H65" stroke="#e0e6df" strokeWidth="9" />
      <path
        d="M-120 64H65"
        stroke="#fff"
        strokeWidth=".5"
        strokeDasharray="3 3"
      />
      <polygon
        points={points(9)}
        fill="#e4daca"
        stroke="#d5c9b7"
        strokeWidth=".35"
      />
      <polyline
        points={points(2)}
        fill="none"
        stroke="#ded7c9"
        strokeWidth="2"
      />
      {vegetation &&
        campusElements.map((e, i) => {
          if (e.nome.includes("arvore") && e.tipo === "Point")
            return (
              <g key={i}>
                <circle
                  cx={e.pontos[0][0]}
                  cy={e.pontos[0][1]}
                  r={e.nome.includes("grande") ? 2.7 : 1.9}
                  fill="#b4cdb2"
                  stroke="#8caa8b"
                  strokeWidth=".3"
                />
                <circle
                  cx={e.pontos[0][0] - 0.5}
                  cy={e.pontos[0][1] - 0.5}
                  r=".8"
                  fill="#d5e5c9"
                />
              </g>
            );
          if (e.nome.includes("arvores"))
            return (
              <polygon
                key={i}
                points={points(i)}
                fill={"url(#" + (mini ? "mini-trees" : "survey-trees") + ")"}
                stroke="#adc2a9"
                strokeWidth=".3"
              />
            );
          if (
            e.nome.includes("jardim") ||
            e.nome === "arbustos" ||
            e.nome === "meio fio"
          )
            return (
              <polygon
                key={i}
                points={points(i)}
                fill="#d8e4cd"
                stroke="#b9cbb0"
                strokeWidth=".3"
              />
            );
          return null;
        })}
      <polygon
        points={points(18)}
        fill="#ddc9b1"
        stroke="#c6af94"
        strokeWidth=".4"
      />
      {whole &&
        [23, 24].map((i) => (
          <polygon
            key={i}
            points={points(i)}
            fill="#e9ebe5"
            stroke="#bec7ba"
            strokeWidth=".5"
            strokeDasharray="2 1"
          />
        ))}
      {places.map((p) => (
        <g
          key={p.id}
          role={onSelect ? "button" : undefined}
          tabIndex={onSelect ? 0 : undefined}
          aria-label={onSelect ? "Selecionar " + p.label : undefined}
          aria-pressed={onSelect ? active === p.id : undefined}
          onClick={() => onSelect?.(p.id)}
          onKeyDown={(e) => selectKey(e, p.id)}
          className={"map-building " + (active === p.id ? "selected" : "")}
        >
          <title>{p.label}</title>
          <polygon
            points={points(p.element)}
            fill={
              active === p.id
                ? "#405f8e"
                : p.id === "patio"
                  ? "#e9dfca"
                  : "#dbe3ef"
            }
            stroke={active === p.id ? "#2e4b77" : "#a9bcd5"}
            strokeWidth={active === p.id ? 1 : 0.5}
            strokeLinejoin="round"
            filter={mini ? undefined : "url(#building-shadow)"}
          />
          {!mini && (
            <text
              x={p.labelAt[0]}
              y={p.labelAt[1]}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={active === p.id ? "#eff7ff" : "#7c94b5"}
              fontSize={
                p.id === "portaria"
                  ? 2.7
                  : p.id === "cantina" || p.id === "diretoria"
                    ? 2.4
                    : 4.2
              }
              fontWeight="600"
              style={{ pointerEvents: "none" }}
              transform={
                p.id === "laboratorios"
                  ? `rotate(65 ${p.labelAt[0]} ${p.labelAt[1]})`
                  : undefined
              }
            >
              {p.short.toUpperCase()}
            </text>
          )}
          {events &&
            !mini &&
            ["principal", "laboratorios", "patio"].includes(p.id) && (
              <g
                transform={`translate(${p.labelAt[0] + (p.id === "laboratorios" ? 7 : 0)},${p.labelAt[1] - 10})`}
                style={{ pointerEvents: "none" }}
              >
                <path
                  d="M0 6 -2 3H-4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H2Z"
                  fill={p.id === active ? "#bce9d9" : "#fff"}
                  stroke="#d0dced"
                  strokeWidth=".35"
                />
                <text
                  x="0"
                  y="-.8"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#45678d"
                  fontSize="4"
                  fontWeight="700"
                >
                  {p.id === "patio"
                    ? 2
                    : sessions.filter((s) => s.placeId === p.id).length}
                </text>
              </g>
            )}
        </g>
      ))}
      {!mini && (
        <>
          <text x="-99" y="59" fontSize="2.3" letterSpacing=".5" fill="#91a28e">
            ACESSO AO CAMPUS
          </text>
          <g transform="translate(-99 47)">
            <path
              d="M0-2v2h20v-2M10 0v-1"
              fill="none"
              stroke="#829985"
              strokeWidth=".5"
            />
            <text
              x="10"
              y="4"
              textAnchor="middle"
              fontSize="2.6"
              fill="#829985"
            >
              20 m
            </text>
          </g>
          {whole && (
            <text
              x="-85"
              y="-230"
              textAnchor="middle"
              fontSize="6"
              fill="#a6b69d"
              letterSpacing="1"
            >
              PERÍMETRO DO CAMPUS
            </text>
          )}
        </>
      )}
    </svg>
  );
}
export function CampusMiniMap({
  placeId,
  onClick,
}: {
  placeId: PlaceId;
  onClick: () => void;
}) {
  const p = placeById(placeId);
  return (
    <button
      className="campus-mini-button"
      onClick={onClick}
      aria-label={"Ver " + p.label + " no mapa"}
    >
      <span className="campus-mini-art">
        <MapDrawing active={placeId} mini events={false} />
        <span className="mini-map-pin">
          <MapPin size={12} />
        </span>
      </span>
      <span>
        <strong>{p.label}</strong>
        <small>Local proposto · Ver no mapa</small>
      </span>
      <ArrowUpRight size={16} />
    </button>
  );
}
export default function CampusMap({
  placeId,
  onSelect,
  onOpenSession,
  onOpenTournament,
  onOpenPrincipal,
}: {
  placeId: PlaceId;
  onSelect: (id: PlaceId) => void;
  onOpenSession: (s: Session) => void;
  onOpenTournament: (t: Tournament) => void;
  onOpenPrincipal: () => void;
}) {
  const [whole, setWhole] = useState(false),
    [events, setEvents] = useState(true),
    [vegetation, setVegetation] = useState(true),
    [scale, setScale] = useState(1),
    [about, setAbout] = useState(false);
  const zoom = useRef<ReactZoomPanPinchRef>(null);
  const p = placeById(placeId);
  const activities = sessions.filter((s) => s.placeId === placeId);
  return (
    <section className="campus-map-screen no-scroll">
      <div className="campus-map-heading">
        <div>
          <span className="eyebrow">O CAMPUS, DO SEU JEITO.</span>
          <h1>Encontre seu lugar.</h1>
        </div>
        <button
          className="icon-button"
          aria-label="Sobre a base do mapa"
          onClick={() => setAbout(!about)}
        >
          <Info size={18} />
        </button>
      </div>
      {about && (
        <div className="map-source-note" role="status">
          35 marcações do seu KML de outubro/2026. Contornos preservados; locais
          das atividades são propostas. Arraste, aproxime ou selecione um
          prédio.
        </div>
      )}
      <div className="map-place-chips" aria-label="Espaços do campus">
        {places.map((p) => (
          <button
            key={p.id}
            className={placeId === p.id ? "active" : ""}
            onClick={() => {
              onSelect(p.id);
              if (whole) setWhole(false);
              zoom.current?.resetTransform();
            }}
          >
            {p.short}
          </button>
        ))}
      </div>
      <div className="interactive-map">
        <TransformWrapper
          key={whole ? "whole" : "core"}
          ref={zoom}
          minScale={1}
          maxScale={4.5}
          initialScale={1}
          centerOnInit
          wheel={{ step: 0.12 }}
          doubleClick={{ mode: "zoomIn", step: 0.7 }}
          onTransform={(_, state) => setScale(state.scale)}
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width: "100%", height: "100%" }}
          >
            <MapDrawing
              active={placeId}
              onSelect={onSelect}
              whole={whole}
              events={events}
              vegetation={vegetation}
            />
          </TransformComponent>
        </TransformWrapper>
        <div className="map-zoom-controls">
          <button
            aria-label="Agrandar mapa"
            onClick={() => zoom.current?.zoomIn(0.4)}
          >
            <Plus size={18} />
          </button>
          <span aria-live="polite">{scale.toFixed(1)}×</span>
          <button
            aria-label="Diminuir mapa"
            onClick={() => zoom.current?.zoomOut(0.4)}
          >
            <Minus size={18} />
          </button>
          <button
            aria-label="Centralizar mapa"
            onClick={() => zoom.current?.resetTransform()}
          >
            <Maximize size={16} />
          </button>
        </div>
        <div className="map-extent-controls">
          <button
            onClick={() => {
              setWhole(!whole);
              setScale(1);
            }}
          >
            <Compass size={13} />
            {whole ? "Ver prédios" : "Campus inteiro"}
          </button>
        </div>
        <div className="map-layer-controls">
          <button
            className={events ? "active" : ""}
            onClick={() => setEvents(!events)}
            aria-pressed={events}
          >
            <Layers size={12} />
            Atividades
          </button>
          <button
            className={vegetation ? "active" : ""}
            onClick={() => setVegetation(!vegetation)}
            aria-pressed={vegetation}
          >
            <Trees size={12} />
            Verde
          </button>
        </div>
        <span className="map-survey-label">BASE DO SEU KML · 35 MARCAÇÕES</span>
      </div>
      <div className="map-place-details">
        <div className="map-place-title">
          <span className="map-place-symbol">
            <MapPin size={21} />
          </span>
          <div>
            <span>{p.category.toUpperCase()}</span>
            <h2>{p.label}</h2>
          </div>
          <small>
            ≈ {Math.round(footprintArea(p.element)).toLocaleString("pt-BR")} m²
            <em>contorno</em>
          </small>
        </div>
        <p>{p.description}</p>
        {placeId === "principal" && (
          <button className="open-principal-plan" onClick={onOpenPrincipal}>
            <Layers size={16} />
            <span>
              Explorar planta interna<small>Térreo, 1º e 2º andar</small>
            </span>
            <ArrowUpRight size={17} />
          </button>
        )}
        <span className="map-activity-count">
          {activities.length + (placeId === "patio" ? tournaments.length : 0)}{" "}
          atividades propostas neste espaço
        </span>
        <div className="map-activities">
          {activities.map((s) => (
            <button key={s.id} onClick={() => onOpenSession(s)}>
              <span className={s.color}>
                <s.icon size={16} />
              </span>
              <span>
                <strong>{s.shortTitle}</strong>
                <small>
                  {s.day} NOV · {s.time} · {s.room}
                </small>
              </span>
              <ArrowUpRight size={17} />
            </button>
          ))}
          {placeId === "patio" &&
            tournaments.map((t) => (
              <button key={t.id} onClick={() => onOpenTournament(t)}>
                <span className="peach">
                  <Gamepad2 size={17} />
                </span>
                <span>
                  <strong>Campeonato de {t.name}</strong>
                  <small>
                    {t.day} NOV · {t.time} · Arena proposta
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </button>
            ))}
          {!activities.length && placeId !== "patio" && (
            <div className="map-no-activity">
              Um ponto de referência para se localizar no campus.
            </div>
          )}
        </div>
        <span className="map-assignment-note">
          Atividades em locais propostos para o mockup.
        </span>
      </div>
    </section>
  );
}
