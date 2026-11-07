"use client";
import { useState } from "react";
import {
  Gamepad2,
  Trophy,
  Users,
  ArrowUpRight,
  MapPin,
  Clock3,
  ChevronRight,
  Check,
  Layers,
} from "lucide-react";
import { tournaments, type Tournament } from "../data/tournaments";
export default function Championships({
  onOpen,
  onMap,
}: {
  onOpen: (t: Tournament) => void;
  onMap: () => void;
}) {
  return (
    <section className="content-scroll championships-screen">
      <div className="games-heading">
        <span className="eyebrow">APRENDA. CONECTE. DÊ O PLAY.</span>
        <h1>
          O próximo round
          <br />é <em>seu.</em>
        </h1>
        <Gamepad2 size={70} strokeWidth={1} />
        <p>
          Uma pausa no código.
          <br />
          Um encontro com a comunidade.
        </p>
      </div>
      <div className="games-demo">
        <span />
        MODALIDADES E PARTICIPANTES FICTÍCIOS
      </div>
      {tournaments.map((t) => (
        <button
          key={t.id}
          className={"tournament-card " + t.color}
          onClick={() => onOpen(t)}
        >
          <div className="tournament-art">
            <span>ARENA ETAL / 0{t.id === "fifa" ? 2 : 1}</span>
            <strong>{t.short}</strong>
            <Gamepad2 size={100} strokeWidth={0.7} />
            <span className="tournament-round">
              READY TO PLAY
              <ArrowUpRight size={20} />
            </span>
          </div>
          <div className="tournament-card-copy">
            <div>
              <h2>{t.name}</h2>
              <span>{t.players.length} jogadores</span>
            </div>
            <p>{t.subtitle}</p>
            <div className="tournament-meta">
              <span>
                <Clock3 size={12} />
                {t.day} NOV · {t.time}
              </span>
              <span>
                <Users size={12} />
                {t.format.split(" · ")[0]}
              </span>
              <ArrowUpRight size={17} />
            </div>
          </div>
        </button>
      ))}
      <button className="arena-location" onClick={onMap}>
        <MapPin size={22} />
        <span>
          <strong>Arena proposta · Pátio</strong>
          <small>Veja onde a comunidade se encontra</small>
        </span>
        <ChevronRight size={18} />
      </button>
      <p className="screen-caption">
        Proposta de campeonatos para o mockup.
        <br />
        Datas, regras e participantes são ilustrativos.
      </p>
    </section>
  );
}
export function TournamentDetail({
  t,
  onMap,
}: {
  t: Tournament;
  onMap: () => void;
}) {
  const [tab, setTab] = useState("Participantes");
  return (
    <section className="content-scroll tournament-detail">
      <div className={"tournament-detail-hero " + t.color}>
        <span>ARENA ETAL · CAMPEONATO</span>
        <h1>{t.name}</h1>
        <p>{t.subtitle}</p>
        <Trophy size={64} strokeWidth={0.9} />
      </div>
      <div className="tournament-detail-body">
        <div className="tournament-info">
          <span>
            <Clock3 size={14} />
            {t.day} NOV · {t.time}
          </span>
          <button onClick={onMap}>
            <MapPin size={14} />
            Pátio · arena proposta
            <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="format-strip">
          <Gamepad2 size={20} />
          <span>
            {t.format}
            <small>
              {t.players.length} participantes · Formato de demonstração
            </small>
          </span>
        </div>
        <h2>Como vai funcionar?</h2>
        <p className="tournament-rules">{t.rules}</p>
        <div className="games-demo roster-demo">
          <span />
          LISTA DE PARTICIPANTES FICTÍCIOS
        </div>
        <div className="roster-tabs">
          {["Participantes", "Confrontos"].map((x) => (
            <button
              key={x}
              className={tab === x ? "active" : ""}
              onClick={() => setTab(x)}
            >
              {x}
              {x === "Participantes" && <small>{t.players.length}</small>}
            </button>
          ))}
        </div>
        {tab === "Participantes" ? (
          <div className="player-list">
            {t.players.map((p, i) => (
              <div className="player-row" key={p.nick}>
                <span className="player-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={"player-avatar " + t.color}>{p.initials}</span>
                <span>
                  <strong>{p.nick}</strong>
                  <small>{p.name}</small>
                </span>
                <span className="player-ready">
                  <Check size={10} />
                  Confirmado
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="match-list">
            <span className="eyebrow">QUARTAS DE FINAL · SIMULAÇÃO</span>
            {t.players.slice(0, 4).map((p, i) => (
              <div className="match-card" key={p.nick}>
                <span>JOGO {i + 1}</span>
                <div>
                  <strong>{p.nick}</strong>
                  <span>VS</span>
                  <strong>{t.players[7 - i].nick}</strong>
                </div>
                <small>Aguardando partida</small>
              </div>
            ))}
          </div>
        )}
        <div className="prize-note">
          <Trophy size={22} />
          <span>{t.prize}</span>
        </div>
        <p className="screen-caption">
          Todos os nomes e resultados desta área são fictícios.
          <br />
          Não há inscrição real nem competição em andamento.
        </p>
      </div>
    </section>
  );
}
