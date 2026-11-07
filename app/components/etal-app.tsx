"use client";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "./native";
import { Controller, useForm } from "react-hook-form";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Clock3,
  CalendarDays,
  ScanLine,
  QrCode,
  Home,
  Bookmark,
  UserRound,
  Bell,
  Search,
  Code2,
  FileText,
  Download,
  Check,
  Wifi,
  BatteryFull,
  Signal,
  Navigation,
  Mic2,
  Layers,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
  Sparkles,
  Eye,
  EyeOff,
  LockKeyhole,
  RotateCcw,
  LogOut,
  X,
  Info,
  Gamepad2,
  Trophy,
} from "lucide-react";
import { NativeButton } from "./native-ui";
import CampusMap from "./campus-map";
import PrincipalPlan from "./principal-plan";
import RoomPreview from "./room-preview";
import type { IndoorTarget } from "../data/principal-model";
import { sessions, type Session } from "../data/event-data";
import { places, type PlaceId } from "../data/campus-model";
import Championships, { TournamentDetail } from "./championships";
import { tournaments } from "../data/tournaments";
type Route =
  | "credenciamento"
  | "login"
  | "inicio"
  | "programacao"
  | "agenda"
  | "atividade"
  | "materiais"
  | "mapa"
  | "credencial"
  | "qr"
  | "confirmacao"
  | "palestrantes"
  | "perfil"
  | "avisos"
  | "campeonatos"
  | "torneio"
  | "planta-principal";
const eventCode = "ETAL:EVENT:DEMO";
function identifyCode(code: string) {
  if (code === eventCode) return { kind: "event" as const };
  const session = sessions.find((s) => "ETAL:SESSION:" + s.id === code);
  return session ? { kind: "session" as const, session } : null;
}
function Avatar({
  session,
  large = false,
}: {
  session?: Session;
  large?: boolean;
}) {
  return (
    <span
      className={
        "avatar " + (session?.color || "blue") + (large ? " large" : "")
      }
    >
      {session?.initials || "AC"}
    </span>
  );
}
function EventArt() {
  return (
    <svg viewBox="0 0 240 230" fill="none" aria-hidden="true">
      <g stroke="currentColor">
        <path d="m120 5 102 59v118l-102 59-102-59V64Z" />
        <path d="m120 31 80 46v92l-80 46-80-46V77Z" />
        <path d="m120 58 56 32v65l-56 32-56-32V90Z" />
      </g>
      <path
        d="m112 91-27 31 27 31m19-62 27 31-27 31"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="120" cy="58" r="4" fill="currentColor" />
    </svg>
  );
}
function Header({
  title,
  back,
  onBack,
  onProfile,
  extra,
}: {
  title?: string;
  back?: boolean;
  onBack?: () => void;
  onProfile?: () => void;
  extra?: ReactNode;
}) {
  return (
    <header className="app-header">
      {back ? (
        <button className="icon-button" aria-label="Voltar" onClick={onBack}>
          <ChevronLeft size={23} />
        </button>
      ) : (
        <span className="wordmark">
          etal<span>connect</span>
          <i />
        </span>
      )}
      {title && <h1>{title}</h1>}
      {extra ||
        (onProfile ? (
          <button
            className="header-avatar"
            aria-label="Meu perfil"
            onClick={onProfile}
          >
            AC
          </button>
        ) : (
          <span className="header-spacer" />
        ))}
    </header>
  );
}
function Nav({ route, go }: { route: Route; go: (r: Route) => void }) {
  const active = ["atividade", "materiais", "palestrantes", "agenda"].includes(
    route,
  )
    ? "programacao"
    : ["confirmacao", "credenciamento"].includes(route)
      ? "qr"
      : route === "planta-principal"
        ? "mapa"
        : route === "credencial"
          ? "perfil"
          : route;
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {[
        { id: "inicio", icon: Home, text: "Início" },
        { id: "programacao", icon: CalendarDays, text: "Agenda" },
        { id: "qr", icon: ScanLine, text: "QR Code" },
        { id: "mapa", icon: MapPin, text: "Mapa" },
        { id: "perfil", icon: UserRound, text: "Eu" },
      ].map((n) => (
        <Pressable
          key={n.id}
          accessibilityRole="button"
          accessibilityLabel={n.text}
          accessibilityState={{ selected: active === n.id }}
          onPress={() => go(n.id as Route)}
          style={({ pressed }) => ({
            alignItems: "center",
            justifyContent: "center",
            minWidth: 46,
            gap: 5,
            opacity: pressed ? 0.55 : 1,
          })}
        >
          <span
            className={
              "nav-icon " +
              (active === n.id ? "active" : "") +
              (n.id === "qr" ? " qr-nav" : "")
            }
          >
            <n.icon size={21} strokeWidth={active === n.id ? 2.1 : 1.6} />
          </span>
          <Text
            style={{
              fontFamily: "DM Sans",
              fontSize: 10,
              color: active === n.id ? "#355589" : "#9ba8bb",
              fontWeight: active === n.id ? "600" : "400",
            }}
          >
            {n.text}
          </Text>
          {active === n.id && <i className="nav-dot" />}
        </Pressable>
      ))}
    </nav>
  );
}
function DemoScan({
  done,
  compact = false,
}: {
  done: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={
        "scan-visual " + (done ? "done " : "") + (compact ? "compact" : "")
      }
    >
      <span className="scan-corner tl" />
      <span className="scan-corner tr" />
      <span className="scan-corner bl" />
      <span className="scan-corner br" />
      {done ? (
        <motion.div
          initial={{ scale: 0.65, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 16 }}
          className="scan-check"
        >
          <Check size={46} strokeWidth={1.7} />
        </motion.div>
      ) : (
        <>
          <img
            src="/event-qr.svg"
            alt="QR Code ilustrativo para demonstração de leitura"
          />
          <span className="scan-line" />
        </>
      )}
      <span className="scan-visual-label">
        {done ? "QR CODE RECONHECIDO" : "LEITURA DE DEMONSTRAÇÃO"}
      </span>
    </div>
  );
}
function EventRegistration({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="onboarding no-scroll event-registration">
      <div className="onboarding-brand">
        <span className="wordmark">
          etal<span>connect.</span>
        </span>
        <span>CREDENCIAMENTO CONCLUÍDO</span>
      </div>
      <div className="entry-heading">
        <span className="eyebrow">QUE BOM TER VOCÊ AQUI.</span>
        <h1>
          Agora você
          <br />
          faz <em>parte.</em>
        </h1>
        <p>
          Seu QR confirmou a participação no ETAL.
          <br />O campus está pronto para receber suas ideias.
        </p>
      </div>
      <DemoScan done />
      <div className="event-found visible">
        <div>
          <ShieldCheck size={22} />
        </div>
        <span>
          <small>PARTICIPAÇÃO CONFIRMADA</small>
          <strong>
            Encontro de Tecnologia
            <br />
            do Alto Oeste Potiguar
          </strong>
          <span>Alex Costa · Perfil SUAP demonstrativo</span>
        </span>
        <CheckCircle2 size={18} />
      </div>
      <div className="entry-actions">
        <NativeButton variant="mint" onPress={onContinue} arrow>
          Explorar o evento
        </NativeButton>
        <p className="demo-caption">
          Confirmação de demonstração, sem registro oficial.
        </p>
      </div>
      <img className="entry-nadic" src="/brand/nadic.png" alt="NADIC" />
    </section>
  );
}
function Login({
  onLogin,
  onBack,
}: {
  onLogin: () => void;
  onBack?: () => void;
}) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors },
    resetField,
  } = useForm({
    defaultValues: { matricula: "20260000000", senha: "demonstracao" },
  });
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function submit() {
    setLoading(true);
    timer.current = setTimeout(() => {
      resetField("senha", { defaultValue: "" });
      onLogin();
    }, 650);
  }
  return (
    <section className="login-screen no-scroll">
      <Header back={!!onBack} onBack={onBack} title="Seu acesso ao evento" />
      <div className="login-content">
        <div className="login-symbol">
          <LockKeyhole size={29} strokeWidth={1.4} />
          <span>
            <Check size={10} />
          </span>
        </div>
        <span className="eyebrow">SUA IDENTIDADE, CONECTADA.</span>
        <h1>
          Você já faz
          <br />
          parte dessa história.
        </h1>
        <p className="login-description">
          Entre com a <strong>matrícula e a senha do SUAP</strong>, as mesmas
          que você usa no IFRN.
        </p>
        <form onSubmit={handleSubmit(submit)} autoComplete="off">
          <label className="field-label" htmlFor="matricula">
            Matrícula do SUAP
          </label>
          <Controller
            name="matricula"
            control={control}
            rules={{
              required: "Informe a matrícula de demonstração.",
              pattern: {
                value: /^\d{5,20}$/,
                message: "Use uma matrícula numérica, como 20260000000.",
              },
            }}
            render={({ field }) => (
              <View style={nativeStyles.inputWrap}>
                <UserRound size={17} color="#8b9db8" />
                <TextInput
                  nativeID="matricula"
                  accessibilityLabel="Matrícula do SUAP"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  keyboardType="numeric"
                  autoComplete="off"
                  placeholder="Sua matrícula no IFRN"
                  style={nativeStyles.input}
                />
              </View>
            )}
          />
          {errors.matricula && (
            <span className="field-error" role="alert">
              {errors.matricula.message}
            </span>
          )}
          <label className="field-label password-label" htmlFor="senha">
            Senha do SUAP<span>Mesma senha institucional</span>
          </label>
          <Controller
            name="senha"
            control={control}
            rules={{
              required: "Informe uma senha fictícia para continuar.",
              minLength: {
                value: 4,
                message: "Use pelo menos 4 caracteres fictícios.",
              },
            }}
            render={({ field }) => (
              <View style={nativeStyles.inputWrap}>
                <LockKeyhole size={17} color="#8b9db8" />
                <TextInput
                  nativeID="senha"
                  accessibilityLabel="Senha do SUAP"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry={!show}
                  autoComplete="off"
                  placeholder="Sua senha do SUAP"
                  style={nativeStyles.input}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={show ? "Ocultar senha" : "Mostrar senha"}
                  onPress={() => setShow(!show)}
                >
                  {show ? (
                    <EyeOff size={17} color="#8b9db8" />
                  ) : (
                    <Eye size={17} color="#8b9db8" />
                  )}
                </Pressable>
              </View>
            )}
          />
          {errors.senha && (
            <span className="field-error" role="alert">
              {errors.senha.message}
            </span>
          )}
          <div className="login-notice">
            <Info size={16} />
            <p>
              <strong>Você está em uma demonstração.</strong> Use os dados
              fictícios preenchidos. Nenhuma senha é enviada ou salva.
            </p>
          </div>
          <NativeButton
            label="Entrar na demonstração"
            onPress={() => void handleSubmit(submit)()}
            disabled={loading}
            arrow
          >
            {loading ? "Preparando seu encontro…" : "Entrar na demonstração"}
          </NativeButton>
          <button
            className="hidden-submit"
            type="submit"
            tabIndex={-1}
            aria-hidden="true"
          >
            Entrar
          </button>
        </form>
        <a
          className="suap-link"
          href="https://suap.ifrn.edu.br/"
          target="_blank"
          rel="noreferrer"
        >
          Abrir SUAP do IFRN
          <ExternalLink size={13} />
        </a>
        <div className="login-footer">
          <img src="/brand/nadic.png" alt="NADIC" />
          <span>
            Uma experiência pensada
            <br />
            para conectar o nosso campus.
          </span>
        </div>
      </div>
    </section>
  );
}
function ActivityCard({
  s,
  onOpen,
  saved,
  onSave,
  onMap,
}: {
  s: Session;
  onOpen: () => void;
  saved: boolean;
  onSave: () => void;
  onMap: () => void;
}) {
  return (
    <article className={"activity-card " + s.color}>
      <div className="card-kind">
        <span>
          {s.type.toUpperCase()} · {s.duration}
        </span>
        <button
          aria-label={
            (saved ? "Remover da agenda: " : "Salvar na agenda: ") +
            s.shortTitle
          }
          onClick={onSave}
        >
          <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <button className="activity-title" onClick={onOpen}>
        {s.title}
      </button>
      <span className="card-place">
        <MapPin size={12} />
        {s.room}
      </span>
      <RoomPreview
        target={{ floor: s.floor, zoneId: s.zoneId }}
        onClick={onMap}
      />
      <div className="card-person">
        <Avatar session={s} />
        <span>{s.shortSpeaker}</span>
        <button onClick={onOpen} aria-label={"Abrir " + s.shortTitle}>
          <ArrowUpRight size={18} />
        </button>
      </div>
    </article>
  );
}
function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className="app-sheet"
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet-top">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="Fechar" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
const nativeStyles = StyleSheet.create({
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderWidth: 1,
    borderColor: "#dfe6f1",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    borderRadius: 12,
    minHeight: 52,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: "DM Sans, sans-serif",
    fontSize: 15,
    color: "#35517e",
    paddingVertical: 14,
    outlineWidth: 0,
  },
});
export default function EtalApp() {
  const [route, setRoute] = useState<Route>("login"),
    [authed, setAuthed] = useState(false),
    [participating, setParticipating] = useState(false),
    [mapPlaceId, setMapPlaceId] = useState<PlaceId>("principal"),
    [indoorTarget, setIndoorTarget] = useState<IndoorTarget | undefined>(
      undefined,
    ),
    [indoorBack, setIndoorBack] = useState<Route>("mapa"),
    [tournament, setTournament] = useState(tournaments[0]),
    [selected, setSelected] = useState(sessions[0]),
    [saved, setSaved] = useState<string[]>(["react-native"]),
    [attended, setAttended] = useState<string[]>([]),
    [day, setDay] = useState(26),
    [category, setCategory] = useState("Tudo"),
    [query, setQuery] = useState(""),
    [reading, setReading] = useState(false),
    [duplicate, setDuplicate] = useState(false),
    [sheet, setSheet] = useState(""),
    [material, setMaterial] = useState(0),
    [toast, setToast] = useState(""),
    [speaker, setSpeaker] = useState(sessions[0]);
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      const cached = JSON.parse(
        sessionStorage.getItem("etal-demo-session-v4") || "null",
      );
      if (cached?.authenticated) {
        setAuthed(true);
        setParticipating(!!cached.participating);
        setAttended(
          Array.isArray(cached.attended)
            ? cached.attended.filter((id: string) =>
                sessions.some((s) => s.id === id),
              )
            : [],
        );
        if (Array.isArray(cached.saved))
          setSaved(
            cached.saved.filter((id: string) =>
              sessions.some((s) => s.id === id),
            ),
          );
        setRoute("inicio");
      }
    } catch {
      sessionStorage.removeItem("etal-demo-session-v4");
    }
    const pop = () => {
      let signed = false;
      try {
        signed = !!JSON.parse(
          sessionStorage.getItem("etal-demo-session-v4") || "null",
        )?.authenticated;
      } catch {}
      const params = new URLSearchParams(location.search);
      const r = params.get("tela") as Route;
      const allowed: Route[] = [
        "inicio",
        "programacao",
        "agenda",
        "atividade",
        "materiais",
        "mapa",
        "credencial",
        "qr",
        "confirmacao",
        "credenciamento",
        "palestrantes",
        "perfil",
        "avisos",
        "campeonatos",
        "torneio",
        "planta-principal",
      ];
      if (signed && allowed.includes(r)) {
        setRoute(r);
        const session = sessions.find((s) => s.id === params.get("atividade"));
        if (session) {
          setSelected(session);
          setMapPlaceId(session.placeId as PlaceId);
          if (r === "planta-principal")
            setIndoorTarget({ floor: session.floor, zoneId: session.zoneId });
        }
        const competition = tournaments.find(
          (t) => t.id === params.get("torneio"),
        );
        if (competition) setTournament(competition);
      } else setRoute(signed ? "inicio" : "login");
    };
    window.addEventListener("popstate", pop);
    return () => {
      window.removeEventListener("popstate", pop);
      if (scanTimer.current) clearTimeout(scanTimer.current);
    };
  }, []);
  useEffect(() => {
    if (authed)
      sessionStorage.setItem(
        "etal-demo-session-v4",
        JSON.stringify({ authenticated: true, participating, attended, saved }),
      );
  }, [authed, participating, attended, saved]);
  useEffect(() => {
    if (route !== "qr") {
      if (scanTimer.current) clearTimeout(scanTimer.current);
      setReading(false);
    }
    focusRef.current?.focus({ preventScroll: true });
  }, [route]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);
  function go(r: Route, s?: Session) {
    if (s) {
      setSelected(s);
      if (r === "mapa") setMapPlaceId(s.placeId as PlaceId);
    }
    setRoute(r);
    history.pushState(
      {},
      "",
      r === "credenciamento"
        ? location.pathname
        : "?tela=" + r + (s ? "&atividade=" + s.id : ""),
    );
  }
  function login() {
    setAuthed(true);
    go("inicio");
  }
  function reset() {
    setAuthed(false);
    setParticipating(false);
    sessionStorage.removeItem("etal-demo-session-v4");
    sessionStorage.removeItem("etal-demo-signed");
    setAttended([]);
    setSaved(["react-native"]);
    setSheet("");
    setQuery("");
    setReading(false);
    setMapPlaceId("principal");
    setIndoorTarget(undefined);
    setIndoorBack("mapa");
    setSelected(sessions[0]);
    setDay(26);
    setCategory("Tudo");
    go("login");
  }
  function openRoom(s: Session) {
    setIndoorTarget({ floor: s.floor, zoneId: s.zoneId });
    setIndoorBack(route === "planta-principal" ? "programacao" : route);
    setMapPlaceId("principal");
    go("planta-principal", s);
  }
  function openMap(place: PlaceId, s?: Session) {
    setMapPlaceId(place);
    if (s) setSelected(s);
    go("mapa");
  }
  function openTournament(t: (typeof tournaments)[number]) {
    setTournament(t);
    go("torneio");
    history.replaceState({}, "", "?tela=torneio&torneio=" + t.id);
  }
  function bookmark(s: Session) {
    setSaved((old) =>
      old.includes(s.id) ? old.filter((id) => id !== s.id) : [...old, s.id],
    );
    setToast(
      saved.includes(s.id)
        ? "Removido da sua agenda."
        : "Encontro salvo na sua agenda.",
    );
  }
  function scan(code: string) {
    if (reading) return;
    setReading(true);
    scanTimer.current = setTimeout(() => {
      const result = identifyCode(code);
      if (!result) {
        setReading(false);
        setToast("QR não reconhecido nesta demonstração.");
        return;
      }
      setParticipating(true);
      if (result.kind === "event") {
        setReading(false);
        go("credenciamento");
        return;
      }
      setSelected(result.session);
      setDuplicate(attended.includes(result.session.id));
      setAttended((old) => Array.from(new Set([...old, result.session.id])));
      setReading(false);
      go("confirmacao", result.session);
    }, 2100);
  }
  function openResources(s: Session) {
    if (!attended.includes(s.id)) {
      setSelected(s);
      setSheet("locked");
      return;
    }
    go("materiais", s);
  }
  const header = (title: string, back: () => void = () => go("inicio")) => (
    <Header title={title} back onBack={back} onProfile={() => go("perfil")} />
  );
  const activeSession = selected;
  const listed = sessions.filter(
    (s) =>
      (route === "agenda" ? saved.includes(s.id) : s.day === day) &&
      (category === "Tudo" || s.type === category) &&
      `${s.title} ${s.speaker}`.toLowerCase().includes(query.toLowerCase()),
  );
  function content() {
    switch (route) {
      case "credenciamento":
        return <EventRegistration onContinue={() => go("inicio")} />;
      case "login":
        return <Login onLogin={login} />;
      case "inicio":
        return (
          <>
            <Header
              onProfile={() => go("perfil")}
              extra={
                <button
                  className="icon-button notification"
                  aria-label="Avisos do evento"
                  onClick={() => go("avisos")}
                >
                  <Bell size={21} />
                  <i />
                </button>
              }
            />
            <section className="home-screen no-scroll">
              <div className="greeting">
                <span>QUE BOM TER VOCÊ AQUI,</span>
                <h1>
                  Olá, Alex <em>✳</em>
                </h1>
                <span className="campus-location">
                  <MapPin size={11} />
                  IFRN · Pau dos Ferros
                </span>
              </div>
              <button
                className={
                  "participation-banner " +
                  (participating ? "confirmed" : "pending")
                }
                onClick={() => go(participating ? "credencial" : "qr")}
                aria-label={
                  participating
                    ? "Participação confirmada no evento"
                    : "Ainda não participante. Ler QR do evento"
                }
              >
                <span>
                  {participating ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <ScanLine size={17} />
                  )}
                </span>
                <span>
                  <strong>
                    {participating
                      ? "Você já faz parte do ETAL"
                      : "Você ainda não é participante"}
                  </strong>
                  <small>
                    {participating
                      ? "Credenciamento confirmado · Ver credencial"
                      : "Chegou ao campus? Leia um QR para participar."}
                  </small>
                </span>
                <ChevronRight size={16} />
              </button>
              <button className="event-hero" onClick={() => go("programacao")}>
                <EventArt />
                <span className="hero-kicker">
                  ENCONTRO DE TECNOLOGIA
                  <br />
                  DO ALTO OESTE POTIGUAR
                </span>
                <strong>
                  Ideias que
                  <br />
                  viram <em>futuro.</em>
                </strong>
                <span className="hero-end">
                  <span>
                    26—28 NOV<small>REFERÊNCIA · VII ETAL 2025</small>
                  </span>
                  <ArrowUpRight size={24} />
                </span>
              </button>
              <div className="shortcut-grid">
                {[
                  {
                    icon: CalendarDays,
                    text: "Programação",
                    r: "programacao",
                    color: "blue",
                  },
                  { icon: MapPin, text: "Mapa", r: "mapa", color: "mint" },
                  {
                    icon: Gamepad2,
                    text: "Campeonatos",
                    r: "campeonatos",
                    color: "games",
                  },
                  {
                    icon: Mic2,
                    text: "Palestrantes",
                    r: "palestrantes",
                    color: "lavender",
                  },
                  {
                    icon: QrCode,
                    text: "Credencial",
                    r: "credencial",
                    color: "peach",
                  },
                ].map((n) => (
                  <button key={n.text} onClick={() => go(n.r as Route)}>
                    <span className={n.color}>
                      <n.icon size={22} strokeWidth={1.6} />
                    </span>
                    {n.text}
                  </button>
                ))}
              </div>
              <div className="section-title">
                <h2>Seu próximo encontro</h2>
                <button
                  onClick={() => {
                    setCategory("Tudo");
                    setQuery("");
                    go("agenda");
                  }}
                >
                  Minha agenda
                  <ChevronRight size={13} />
                </button>
              </div>
              <button
                className="next-session"
                onClick={() => go("atividade", sessions[0])}
              >
                <div className="next-top">
                  <span>
                    <i />
                    {attended.includes("react-native")
                      ? "VOCÊ PARTICIPOU"
                      : "MINICURSO · NA SUA AGENDA"}
                  </span>
                  <Bookmark size={15} fill="currentColor" />
                </div>
                <strong>
                  Introdução ao React Native
                  <br />
                  com Expo
                </strong>
                <div className="next-speaker">
                  <Avatar session={sessions[0]} />
                  <span>Jonhy Everton</span>
                  <ArrowUpRight size={17} />
                </div>
                <div className="next-info">
                  <span>
                    <Clock3 size={12} />
                    14:00 — 18:00
                  </span>
                  <span>
                    <MapPin size={12} />
                    {sessions[0].room} · 2º andar
                  </span>
                </div>
              </button>
              <div className="home-signature">
                <img src="/brand/nadic.png" alt="NADIC" />
                <span>TECNOLOGIA QUE APROXIMA.</span>
                <span className="demo-tag">DEMO</span>
              </div>
            </section>
          </>
        );
      case "programacao":
      case "agenda":
        return (
          <>
            {header("Programação")}
            <section className="content-scroll schedule-screen">
              <div className="segmented">
                <button
                  className={route === "programacao" ? "active" : ""}
                  onClick={() => go("programacao")}
                >
                  Programação
                </button>
                <button
                  className={route === "agenda" ? "active" : ""}
                  onClick={() => go("agenda")}
                >
                  Minha agenda <small>{saved.length}</small>
                </button>
              </div>
              <label className="search-field">
                <Search size={17} />
                <input
                  aria-label="Buscar atividade"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="O que você quer aprender?"
                />
              </label>
              {route === "programacao" && (
                <>
                  <div className="date-heading">
                    <strong>Novembro, 2025</strong>
                    <span>EDIÇÃO DE REFERÊNCIA</span>
                  </div>
                  <div className="date-strip">
                    {[
                      { day: 26, d: "QUA" },
                      { day: 27, d: "QUI" },
                      { day: 28, d: "SEX" },
                    ].map((d) => (
                      <button
                        key={d.day}
                        className={day === d.day ? "active" : ""}
                        onClick={() => setDay(d.day)}
                        aria-label={`${d.day} de novembro`}
                      >
                        <span>{d.d}</span>
                        <strong>{d.day}</strong>
                        <i />
                      </button>
                    ))}
                    <div>
                      <CalendarDays size={24} />
                      <span>
                        3 dias de
                        <br />
                        novas ideias.
                      </span>
                    </div>
                  </div>
                </>
              )}
              <div className="category-strip">
                {["Tudo", "Minicurso", "Palestra"].map((c) => (
                  <button
                    className={category === c ? "active" : ""}
                    key={c}
                    onClick={() => setCategory(c)}
                  >
                    {c === "Tudo" ? c : c + "s"}
                  </button>
                ))}
              </div>
              <div className="list-heading">
                <span>
                  {route === "agenda"
                    ? "OS ENCONTROS QUE VOCÊ ESCOLHEU"
                    : `${day} DE NOVEMBRO`}
                </span>
                <span>{listed.length} atividades</span>
              </div>
              <div className="activity-list">
                {listed.map((s) => (
                  <div className="timeline-row" key={s.id}>
                    <div className="timeline-time">
                      <strong>{s.time}</strong>
                      <span>{s.end}</span>
                      {route === "agenda" && <small>{s.day} NOV</small>}
                      <i />
                    </div>
                    <ActivityCard
                      s={s}
                      onOpen={() => go("atividade", s)}
                      saved={saved.includes(s.id)}
                      onSave={() => bookmark(s)}
                      onMap={() => openRoom(s)}
                    />
                  </div>
                ))}
              </div>
              {!listed.length && (
                <div className="empty">
                  <CalendarDays size={32} />
                  <h3>Espaço para uma nova descoberta.</h3>
                  <p>Explore outro dia ou salve um encontro na programação.</p>
                  <NativeButton
                    onPress={() => {
                      setQuery("");
                      setCategory("Tudo");
                      setDay(26);
                      go("programacao");
                    }}
                    variant="secondary"
                  >
                    Explorar programação
                  </NativeButton>
                </div>
              )}
              <p className="screen-caption">
                Programação de referência do VII ETAL, em 2025.
                <br />
                Salas e conteúdos complementares ilustrativos.
              </p>
            </section>
          </>
        );
      case "atividade":
        return (
          <>
            {header(
              activeSession.type === "Palestra"
                ? "Sua próxima conversa"
                : "Seu próximo aprendizado",
              () => go("programacao"),
            )}
            <section className="content-scroll activity-detail">
              <div className={"activity-cover " + activeSession.color}>
                <span>
                  {activeSession.type.toUpperCase()} /{" "}
                  {activeSession.theme.toUpperCase()}
                </span>
                <activeSession.icon size={90} strokeWidth={0.9} />
                <span className="cover-code">
                  {activeSession.type === "Minicurso"
                    ? "<hello, world />"
                    : "IDEIAS QUE ABREM CONVERSAS."}
                </span>
              </div>
              <div className="detail-content">
                <div className="detail-eyebrow">
                  <span>{activeSession.type.toUpperCase()}</span>
                  <button
                    onClick={() => bookmark(activeSession)}
                    aria-label={
                      saved.includes(activeSession.id)
                        ? "Remover esta atividade da agenda"
                        : "Salvar esta atividade na agenda"
                    }
                  >
                    <Bookmark
                      size={16}
                      fill={
                        saved.includes(activeSession.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                    {saved.includes(activeSession.id)
                      ? "Na sua agenda"
                      : "Salvar"}
                  </button>
                </div>
                <h1>{activeSession.title}</h1>
                <div className="activity-meta">
                  <span>
                    <CalendarDays size={14} />
                    {activeSession.day} nov.
                  </span>
                  <span>
                    <Clock3 size={14} />
                    {activeSession.time} — {activeSession.end}
                  </span>
                  <button onClick={() => openRoom(activeSession)}>
                    <MapPin size={14} />
                    {activeSession.room.replace("Laboratório ", "Lab. ")}
                  </button>
                </div>
                <button
                  className="speaker-strip"
                  onClick={() => {
                    setSpeaker(activeSession);
                    setSheet("speaker");
                  }}
                >
                  <Avatar session={activeSession} />
                  <span>
                    <small>QUEM VAI GUIAR VOCÊ</small>
                    <strong>{activeSession.shortSpeaker}</strong>
                    <span>
                      {activeSession.speaker
                        .replace(activeSession.shortSpeaker, "")
                        .trim()}
                    </span>
                  </span>
                  <ArrowUpRight size={19} />
                </button>
                <RoomPreview
                  target={{
                    floor: activeSession.floor,
                    zoneId: activeSession.zoneId,
                  }}
                  onClick={() => openRoom(activeSession)}
                />
                <h2>
                  {activeSession.type === "Minicurso"
                    ? "Aprender fazendo."
                    : "Uma ideia puxa outra."}
                </h2>
                <p>{activeSession.description}</p>
                <div className="requirements">
                  <Code2 size={20} />
                  <div>
                    <h3>
                      {activeSession.type === "Minicurso"
                        ? "O que preparar?"
                        : "Para aproveitar o encontro"}
                    </h3>
                    <p>{activeSession.requirements}</p>
                  </div>
                </div>
                <button
                  className="resource-link"
                  onClick={() => openResources(activeSession)}
                >
                  <BookOpen size={20} />
                  <span>
                    Materiais{" "}
                    {activeSession.type === "Minicurso"
                      ? "do minicurso"
                      : "da palestra"}
                    <small>
                      {attended.includes(activeSession.id)
                        ? "Conteúdo liberado para você"
                        : "Disponíveis após a leitura do QR"}
                    </small>
                  </span>
                  <ChevronRight size={19} />
                </button>
                <NativeButton onPress={() => go("qr", activeSession)} arrow>
                  {attended.includes(activeSession.id)
                    ? "Ler QR da atividade novamente"
                    : "Cheguei! Ler QR da atividade"}
                </NativeButton>
                <p className="screen-caption">
                  Presença e materiais de demonstração.
                </p>
              </div>
            </section>
          </>
        );
      case "qr":
        return (
          <section className="reader-screen no-scroll">
            <div className="reader-header">
              <button
                className="icon-button"
                aria-label="Voltar"
                onClick={() => go("inicio")}
              >
                <ChevronLeft size={23} />
              </button>
              <h1>QR Code</h1>
              <span>DEMO</span>
            </div>
            <div className="reader-heading">
              <span className="eyebrow">APONTE. CONECTE. PARTICIPE.</span>
              <h2>
                O próximo encontro
                <br />
                está <em>aqui.</em>
              </h2>
              <p>
                Leia o QR do evento ou de uma atividade.
                <br />A primeira leitura confirma sua participação.
              </p>
            </div>
            <div className={"reader-frame " + (reading ? "reading" : "")}>
              <div className="reader-grid" />
              <ScanLine size={65} strokeWidth={1} />
              <span className="scan-corner tl" />
              <span className="scan-corner tr" />
              <span className="scan-corner bl" />
              <span className="scan-corner br" />
              {reading && <span className="scan-line" />}
              <span>
                {reading
                  ? "Identificando a atividade…"
                  : "Aguardando o QR da sala"}
              </span>
            </div>
            <div className="reader-info">
              <ShieldCheck size={18} />
              <span>
                Evento, minicurso ou palestra.
                <br />
                <strong>Um QR. Seu lugar no ETAL.</strong>
              </span>
            </div>
            <div className="reader-demo">
              <span>EXPERIMENTE UMA LEITURA</span>
              <div>
                <NativeButton
                  label="Simular QR do evento"
                  onPress={() => scan(eventCode)}
                  disabled={reading}
                  variant="secondary"
                >
                  Evento
                </NativeButton>
                <NativeButton
                  label="Simular QR de minicurso"
                  onPress={() =>
                    scan(
                      "ETAL:SESSION:" +
                        (selected.type === "Minicurso"
                          ? selected.id
                          : "react-native"),
                    )
                  }
                  disabled={reading}
                  variant="secondary"
                >
                  Minicurso
                </NativeButton>
                <NativeButton
                  label="Simular QR de palestra"
                  onPress={() =>
                    scan(
                      "ETAL:SESSION:" +
                        (selected.type === "Palestra"
                          ? selected.id
                          : "saude-mental"),
                    )
                  }
                  disabled={reading}
                  variant="secondary"
                >
                  Palestra
                </NativeButton>
              </div>
              <p>Simulação visual. Nenhum acesso à câmera.</p>
            </div>
          </section>
        );
      case "confirmacao":
        return (
          <section className="confirmation no-scroll">
            <div className="confirmation-top">
              <button
                className="icon-button"
                aria-label="Voltar ao início"
                onClick={() => go("inicio")}
              >
                <ChevronLeft size={23} />
              </button>
              <span>{activeSession.type.toUpperCase()} IDENTIFICADO</span>
              <ShieldCheck size={20} />
            </div>
            <div className="confirmation-hero">
              <motion.div
                className="confirmed-icon"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
              >
                <Check size={53} strokeWidth={1.5} />
              </motion.div>
              <span className="eyebrow">
                {duplicate
                  ? "VOCÊ JÁ ESTAVA COM A GENTE"
                  : "PRESENÇA CONFIRMADA"}
              </span>
              <h1>
                {activeSession.type === "Palestra" ? (
                  <>
                    Sua presença
                    <br />
                    faz a <em>conversa.</em>
                  </>
                ) : (
                  <>
                    Você está
                    <br />
                    <em>dentro.</em>
                  </>
                )}
              </h1>
              <p>
                {duplicate
                  ? "Sua presença já estava registrada. Sem duplicidade."
                  : activeSession.type === "Palestra"
                    ? "Boas ideias começam com uma boa escuta."
                    : "Agora é com você. Vamos criar?"}
              </p>
            </div>
            <div className="confirmed-session">
              <span className={"confirmed-type " + activeSession.color}>
                <activeSession.icon size={23} />
              </span>
              <span>
                <small>
                  {activeSession.type.toUpperCase()} ·{" "}
                  {activeSession.room.toUpperCase()}
                </small>
                <strong>{activeSession.shortTitle}</strong>
                <span>
                  {activeSession.shortSpeaker} · {activeSession.time}
                </span>
              </span>
            </div>
            <div className="confirmation-actions">
              <NativeButton
                onPress={() => go("materiais", activeSession)}
                variant="mint"
                arrow
              >
                Acessar materiais{" "}
                {activeSession.type === "Palestra"
                  ? "da palestra"
                  : "do minicurso"}
              </NativeButton>
              <NativeButton
                onPress={() => go("atividade", activeSession)}
                variant="ghost"
              >
                Ver detalhes da atividade
              </NativeButton>
            </div>
            <div className="confirmation-caption">
              <BookOpen size={16} />
              <span>
                Seu próximo passo está liberado.
                <br />
                Slides, referências e conteúdo de apoio.
              </span>
            </div>
          </section>
        );
      case "materiais":
        return (
          <>
            {header(
              activeSession.type === "Palestra"
                ? "Materiais da palestra"
                : "Materiais do minicurso",
              () => go("atividade", activeSession),
            )}
            <section className="content-scroll materials-screen">
              <div className="materials-hero">
                <span className="eyebrow">O ENCONTRO CONTINUA.</span>
                <h1>
                  Leve a ideia.
                  <br />
                  <em>Vá além.</em>
                </h1>
                <div className="paper-stack">
                  <FileText size={60} />
                  <BookOpen size={60} />
                </div>
              </div>
              <div className="materials-course">
                <activeSession.icon size={23} />
                <span>
                  <strong>{activeSession.shortTitle}</strong>
                  <small>Com {activeSession.shortSpeaker}</small>
                </span>
              </div>
              <div className="unlocked">
                <ShieldCheck size={15} />
                {attended.includes(activeSession.id)
                  ? "Presença confirmada. Conteúdo liberado."
                  : "Prévia ilustrativa dos materiais."}
              </div>
              <div className="section-title">
                <h2>Para continuar aprendendo</h2>
                <span>03 itens</span>
              </div>
              {[
                {
                  icon: FileText,
                  name: "Apresentação do encontro",
                  desc: "Slides e ideias principais",
                  type: "SLIDES",
                  color: "peach",
                },
                {
                  icon: Code2,
                  name:
                    activeSession.type === "Palestra"
                      ? "Ideias para refletir"
                      : "Seu ponto de partida",
                  desc:
                    activeSession.type === "Palestra"
                      ? "Anotações e perguntas"
                      : "Código e exercícios guiados",
                  type: activeSession.type === "Palestra" ? "NOTAS" : "CÓDIGO",
                  color: "blue",
                },
                {
                  icon: BookOpen,
                  name: "Para explorar depois",
                  desc: "Referências e próximos passos",
                  type: "GUIA",
                  color: "lavender",
                },
              ].map((m, i) => (
                <button
                  className="material-file"
                  key={m.name}
                  onClick={() => {
                    setMaterial(i);
                    setSheet("material");
                  }}
                >
                  <span className={m.color}>
                    <m.icon size={24} />
                  </span>
                  <span>
                    <strong>{m.name}</strong>
                    <small>{m.desc}</small>
                    <em>{m.type} · PRÉVIA DEMONSTRATIVA</em>
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))}
              <div className="learning-note">
                <Sparkles size={23} />
                <h3>
                  Conhecimento cresce
                  <br />
                  quando é compartilhado.
                </h3>
                <p>Experimente. Pergunte. Construa.</p>
              </div>
            </section>
          </>
        );
      case "mapa":
        return (
          <>
            {header("Mapa do campus")}
            <CampusMap
              placeId={mapPlaceId}
              onSelect={setMapPlaceId}
              onOpenPrincipal={() => {
                setIndoorTarget(undefined);
                setIndoorBack("mapa");
                go("planta-principal");
              }}
              onOpenSession={(s) => go("atividade", s)}
              onOpenTournament={openTournament}
            />
          </>
        );
      case "planta-principal":
        return (
          <>
            {header("Bloco principal", () => go(indoorBack))}
            <PrincipalPlan
              key={
                indoorTarget
                  ? indoorTarget.floor + indoorTarget.zoneId
                  : "overview"
              }
              target={indoorTarget}
              onOpenSession={(s) => go("atividade", s)}
            />
          </>
        );
      case "campeonatos":
        return (
          <>
            {header("Campeonatos de jogos")}
            <Championships
              onOpen={openTournament}
              onMap={() => openMap("patio")}
            />
          </>
        );
      case "torneio":
        return (
          <>
            {header(tournament.name, () => go("campeonatos"))}
            <TournamentDetail
              key={tournament.id}
              t={tournament}
              onMap={() => openMap("patio")}
            />
          </>
        );
      case "credencial":
        if (!participating)
          return (
            <>
              {header("Minha credencial", () => go("perfil"))}
              <section className="pending-credential no-scroll">
                <div className="pending-credential-art">
                  <QrCode size={65} strokeWidth={1} />
                  <LockKeyhole size={22} />
                </div>
                <span className="eyebrow">SEU PERFIL JÁ ESTÁ CONECTADO.</span>
                <h1>
                  Falta só
                  <br />o primeiro encontro.
                </h1>
                <p>
                  Você ainda não é participante do ETAL. Ao chegar, leia o QR do
                  credenciamento ou de qualquer atividade do evento para ativar
                  sua participação.
                </p>
                <NativeButton onPress={() => go("qr")} arrow>
                  Ler QR para participar
                </NativeButton>
                <span className="screen-caption">
                  Login SUAP e participação no evento
                  <br />
                  são etapas diferentes nesta demonstração.
                </span>
              </section>
            </>
          );
        return (
          <>
            {header("Minha credencial", () => go("perfil"))}
            <section className="credential-screen no-scroll">
              <div className="credential-intro">
                <span className="eyebrow">VOCÊ FAZ PARTE.</span>
                <h1>Seu acesso ao encontro.</h1>
              </div>
              <div className="digital-ticket">
                <div className="ticket-top">
                  <span className="wordmark">
                    etal<span>connect.</span>
                  </span>
                  <span>
                    PARTICIPANTE<small>DEMONSTRAÇÃO</small>
                  </span>
                </div>
                <div className="ticket-body">
                  <Avatar large />
                  <h2>Alex Costa</h2>
                  <p>Análise e Desenvolvimento de Sistemas</p>
                  <span className="ticket-institution">
                    <ShieldCheck size={12} />
                    SUAP · Perfil demonstrativo
                  </span>
                  <img
                    src="/demo-qr.svg"
                    alt="QR Code da credencial de demonstração de Alex Costa"
                  />
                  <code>ETAL · ALEX · DEMO 2026</code>
                  <p>Apresente seu QR na entrada.</p>
                </div>
                <div className="ticket-footer">
                  <CheckCircle2 size={16} />
                  Tudo pronto para novas conexões.
                </div>
              </div>
              <p className="screen-caption">
                Credencial ilustrativa, sem validade oficial.
              </p>
            </section>
          </>
        );
      case "palestrantes":
        return (
          <>
            {header("Quem faz acontecer")}
            <section className="content-scroll speakers-screen">
              <div className="speakers-intro">
                <span className="eyebrow">GENTE QUE INSPIRA GENTE.</span>
                <h1>
                  Aprender é<br />
                  uma troca.
                </h1>
                <Mic2 size={65} strokeWidth={1} />
              </div>
              {sessions.map((s) => (
                <button
                  className="speaker-card"
                  key={s.id}
                  onClick={() => {
                    setSpeaker(s);
                    setSheet("speaker");
                  }}
                >
                  <span className={"speaker-art " + s.color}>
                    <Avatar session={s} large />
                  </span>
                  <span className="speaker-content">
                    <small>{s.type.toUpperCase()}</small>
                    <strong>{s.speaker}</strong>
                    <span>{s.shortTitle}</span>
                    <span>
                      {s.day} NOV · {s.time}
                      <ArrowUpRight size={16} />
                    </span>
                  </span>
                </button>
              ))}
            </section>
          </>
        );
      case "perfil":
        return (
          <>
            {header("Seu espaço")}
            <section className="profile-screen no-scroll">
              <div className="profile-head">
                <Avatar large />
                <h1>Alex Costa</h1>
                <p>Estudante de ADS · IFRN Pau dos Ferros</p>
                <span>
                  <ShieldCheck size={12} />
                  {participating
                    ? "Participante do ETAL · Demonstração"
                    : "Perfil SUAP · Ainda não participante"}
                </span>
              </div>
              <div className="profile-menu">
                {[
                  {
                    icon: QrCode,
                    title: "Minha credencial",
                    sub: participating
                      ? "Seu QR de participante"
                      : "Leia um QR para ativar",
                    r: "credencial",
                  },
                  {
                    icon: Bookmark,
                    title: "Minha agenda",
                    sub: `${saved.length} encontros salvos`,
                    r: "agenda",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Minhas participações",
                    sub: `${attended.length} presenças demonstrativas`,
                    r: "history",
                  },
                  {
                    icon: Bell,
                    title: "Avisos do evento",
                    sub: "Acompanhe o que acontece",
                    r: "avisos",
                  },
                ].map((n) => (
                  <button
                    key={n.title}
                    onClick={() =>
                      n.r === "history" ? setSheet("history") : go(n.r as Route)
                    }
                  >
                    <n.icon size={20} />
                    <span>
                      <strong>{n.title}</strong>
                      <small>{n.sub}</small>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                ))}
              </div>
              <button className="restart" onClick={reset}>
                <RotateCcw size={16} />
                Recomeçar demonstração
              </button>
              <div className="profile-signature">
                <img src="/brand/nadic.png" alt="NADIC" />
                <p>
                  Conceito independente · ETAL Connect
                  <br />
                  Sem integração real com o SUAP.
                </p>
              </div>
            </section>
          </>
        );
      case "avisos":
        return (
          <>
            {header("Avisos do evento")}
            <section className="content-scroll notices-screen">
              <h1>
                O encontro
                <br />
                está acontecendo.
              </h1>
              <div className="notice">
                <CalendarDays size={24} />
                <span>
                  <small>LEMBRETE ILUSTRATIVO</small>
                  <h2>Seu próximo minicurso</h2>
                  <p>
                    React Native com Expo, às 14h, na Sala 201 do 2º andar.
                    Separe seu notebook e venha criar.
                  </p>
                  <button onClick={() => go("atividade", sessions[0])}>
                    Ver minicurso
                    <ArrowRight size={15} />
                  </button>
                </span>
              </div>
              <div className="notice">
                <Sparkles size={24} />
                <span>
                  <small>BEM-VINDO AO ETAL</small>
                  <h2>Um campus de possibilidades.</h2>
                  <p>
                    Explore a programação, encontre sua sala e use o QR Code
                    para registrar sua participação na demonstração.
                  </p>
                </span>
              </div>
            </section>
          </>
        );
    }
  }
  return (
    <MotionConfig reducedMotion="user">
      <main className="app-stage">
        <div className="phone">
          <span className="hardware-button one" />
          <span className="hardware-button two" />
          <div className="phone-display">
            <div
              className={
                "status-bar " +
                (["credenciamento", "qr", "confirmacao"].includes(route)
                  ? "dark"
                  : "")
              }
            >
              <span>9:41</span>
              <i className="dynamic-island" />
              <span>
                <Signal size={13} />
                <Wifi size={13} />
                <BatteryFull size={19} />
              </span>
            </div>
            <div className="app-viewport">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  ref={focusRef}
                  tabIndex={-1}
                  key={
                    route +
                    (route === "atividade" ||
                    route === "materiais" ||
                    route === "confirmacao"
                      ? selected.id
                      : "")
                  }
                  className="app-route"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.17, ease: "easeOut" }}
                >
                  {content()}
                </motion.div>
              </AnimatePresence>
            </div>
            {authed && route !== "login" && <Nav route={route} go={go} />}
            <div
              className={
                "home-indicator " +
                (["credenciamento", "qr", "confirmacao"].includes(route)
                  ? "light"
                  : "")
              }
            />
            {toast && (
              <div className="app-toast" role="status">
                <CheckCircle2 size={16} />
                {toast}
                <button
                  aria-label="Dispensar aviso"
                  onClick={() => setToast("")}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      {sheet && (
        <Sheet
          title={
            sheet === "speaker"
              ? "Quem guia este encontro"
              : sheet === "locked"
                ? "O conteúdo vem com a experiência"
                : sheet === "history"
                  ? "Minhas participações"
                  : sheet === "directions"
                    ? "Seu caminho pelo campus"
                    : "Material de apoio · Demonstração"
          }
          onClose={() => setSheet("")}
        >
          <div className="sheet-content">
            {sheet === "speaker" ? (
              <>
                <Avatar session={speaker} large />
                <h3>{speaker.speaker}</h3>
                <span className="sheet-category">
                  {speaker.type} · {speaker.theme}
                </span>
                <p>
                  Apresentador na programação de referência do VII ETAL, em
                  2025.
                </p>
                <NativeButton
                  onPress={() => {
                    setSheet("");
                    go("atividade", speaker);
                  }}
                  arrow
                >
                  Conhecer a atividade
                </NativeButton>
              </>
            ) : sheet === "locked" ? (
              <>
                <BookOpen size={37} />
                <h3>Primeiro, viva o encontro.</h3>
                <p>
                  Leia o QR da sala para confirmar sua presença e liberar os
                  materiais{" "}
                  {selected.type === "Palestra"
                    ? "da palestra"
                    : "do minicurso"}
                  .
                </p>
                <NativeButton
                  onPress={() => {
                    setSheet("");
                    go("qr", selected);
                  }}
                  arrow
                >
                  Abrir leitor de QR
                </NativeButton>
              </>
            ) : sheet === "history" ? (
              <>
                {attended.length ? (
                  sessions
                    .filter((s) => attended.includes(s.id))
                    .map((s) => (
                      <button
                        className="history-row"
                        key={s.id}
                        onClick={() => {
                          setSheet("");
                          go("atividade", s);
                        }}
                      >
                        <CheckCircle2 size={23} />
                        <span>
                          <strong>{s.shortTitle}</strong>
                          <small>
                            {s.type} · {s.duration} ilustrativas
                          </small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                    ))
                ) : (
                  <p>
                    Suas participações aparecerão aqui após a leitura do QR de
                    uma atividade.
                  </p>
                )}
                <p className="fineprint">
                  Presenças demonstrativas. Certificados oficiais dependem da
                  organização e não são emitidos aqui.
                </p>
              </>
            ) : sheet === "directions" ? (
              <>
                <Navigation size={35} />
                <h3>{selected.room}</h3>
                <p>
                  {selected.type === "Minicurso"
                    ? "Partindo da entrada, siga pelo corredor principal até o bloco de informática. Procure a identificação do laboratório no térreo."
                    : "Siga pelo corredor principal até o auditório, próximo ao espaço de convivência."}
                </p>
                <p className="fineprint">
                  Orientação ilustrativa. O trajeto real deve ser validado com o
                  campus.
                </p>
                <NativeButton onPress={() => setSheet("")} variant="secondary">
                  Entendi, vamos lá
                </NativeButton>
              </>
            ) : (
              <>
                <span className="sheet-category">{selected.shortTitle}</span>
                <h3>
                  {material === 0
                    ? "Ideias para levar com você"
                    : material === 1
                      ? selected.type === "Minicurso"
                        ? "Vamos colocar em prática?"
                        : "Para pensar depois do encontro"
                      : "Seu próximo aprendizado"}
                </h3>
                {material === 0 ? (
                  <ul>
                    <li>O tema do encontro: {selected.theme.toLowerCase()}.</li>
                    <li>
                      Observe como a tecnologia se conecta a problemas do
                      cotidiano.
                    </li>
                    <li>
                      Compartilhe uma ideia e uma pergunta com a comunidade.
                    </li>
                  </ul>
                ) : material === 1 && selected.id === "react-native" ? (
                  <pre>
                    {
                      'import { View, Text } from "react-native";\n\nexport default function App() {\n  return (\n    <View>\n      <Text>Olá, ETAL!</Text>\n    </View>\n  );\n}'
                    }
                  </pre>
                ) : (
                  <ul>
                    <li>Registre uma descoberta do encontro.</li>
                    <li>
                      Experimente aplicar essa ideia em um pequeno projeto.
                    </li>
                    <li>Converse com quem está aprendendo com você.</li>
                  </ul>
                )}
                <p className="fineprint">
                  Prévia de conteúdo criada para o mockup. Não é material
                  oficial do apresentador.
                </p>
                <NativeButton onPress={() => setSheet("")} variant="secondary">
                  Voltar aos materiais
                </NativeButton>
              </>
            )}
          </div>
        </Sheet>
      )}
    </MotionConfig>
  );
}
