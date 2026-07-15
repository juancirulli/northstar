"use client";

import { useState, useEffect, useRef } from "react";

/*
  NORTHSTAR — Personal OS
  ------------------------------------------------------------------
  Estética: blanco pleno, texto negro, un único acento azul (#0A84FF).
  Una sola tipografía (Helvetica Neue), sin negritas dispersas, sin emojis.

  INTEGRACIONES REALES (sin API key):
    • Clima  → Open-Meteo
    • BTC    → CoinGecko  (punto "en vivo": verde sube / rojo baja vs 24h)
    • Dólar  → dolarapi.com (CCL/MEP)

  Módulos ("Tu vida") → menú hamburguesa arriba a la derecha.
  El día y Pendientes → editar, arrastrar y reordenar.
  ------------------------------------------------------------------
*/

const LAT = -34.61;
const LON = -58.38;

const WEATHER_DESC = {
  0: "despejado", 1: "mayormente despejado", 2: "parcialmente nublado", 3: "nublado",
  45: "niebla", 48: "niebla", 51: "llovizna", 53: "llovizna", 55: "llovizna",
  61: "lluvia", 63: "lluvia", 65: "lluvia fuerte", 71: "nieve", 73: "nieve", 75: "nieve fuerte",
  80: "chaparrones", 81: "chaparrones", 82: "chaparrones fuertes", 95: "tormenta", 96: "tormenta", 99: "tormenta",
};

// NOTA: los cumpleaños ahora se leen de Google Calendar (ver useBirthdayEvent
// y BirthdaysView), no de esta lista. La dejamos solo como referencia/fallback.
const BIRTHDAYS = [
  { name: "Mamá", day: 13, month: 7 },
  { name: "Martín", day: 22, month: 7 },
  { name: "Sofía", day: 3, month: 8 },
];

// Relojes editables. El tz es una zona IANA real (respeta horario de verano).
const INITIAL_CLOCKS = [
  { id: "ba", label: "Buenos Aires", country: "Argentina", tz: "America/Argentina/Buenos_Aires" },
  { id: "va", label: "Vancouver", country: "Canadá", tz: "America/Vancouver" },
  { id: "ma", label: "Madrid", country: "España", tz: "Europe/Madrid" },
];

// Opciones de zona para el editor (podés sumar más)
const TZ_OPTIONS = [
  { label: "Buenos Aires", country: "Argentina", tz: "America/Argentina/Buenos_Aires" },
  { label: "Vancouver", country: "Canadá", tz: "America/Vancouver" },
  { label: "Madrid", country: "España", tz: "Europe/Madrid" },
  { label: "Nueva York", country: "EE. UU.", tz: "America/New_York" },
  { label: "Londres", country: "Reino Unido", tz: "Europe/London" },
  { label: "Tokio", country: "Japón", tz: "Asia/Tokyo" },
  { label: "Oslo", country: "Noruega", tz: "Europe/Oslo" },
  { label: "Ciudad de México", country: "México", tz: "America/Mexico_City" },
  { label: "San Pablo", country: "Brasil", tz: "America/Sao_Paulo" },
  { label: "Los Ángeles", country: "EE. UU.", tz: "America/Los_Angeles" },
];

const MODULES = [
  { id: "car", name: "Jeep Renegade", hint: "Service en 480 km" },
  { id: "dog", name: "Yukon", hint: "Comida ~5 días" },
  { id: "travel", name: "Oslo Plan", hint: "En 43 días" },
  { id: "research", name: "Research", hint: "7 guardados" },
  { id: "capital", name: "Capital", hint: "USD 84.200 · +1,4% hoy" },
];

/*
  Ideas parafraseadas de cada referente (no son citas textuales).
  Presentadas como la idea central de cada pensador, con mis palabras.
  Rotan de a una por día, de forma determinística.
*/
const VOICES = [
  { idea: "Aprender es dejar que la máquina descubra sola los patrones que nosotros no sabríamos programar.", name: "Geoffrey Hinton", field: "Inteligencia Artificial" },
  { idea: "La inteligencia más útil es la que resuelve problemas que la ciencia todavía no pudo.", name: "Demis Hassabis", field: "IA · AGI" },
  { idea: "La atención lo es todo: enfocar en lo que importa es lo que vuelve poderoso a un sistema, y a una persona.", name: "Aidan Gomez", field: "IA · LLMs" },
  { idea: "La investigación solo cambia el mundo cuando se convierte en algo que la gente puede usar.", name: "Nick Frosst", field: "IA aplicada" },
  { idea: "Observá antes de opinar: la naturaleza ya resolvió casi todo si sabés mirar.", name: "Leonardo da Vinci", field: "Ciencia y Arte" },
  { idea: "Toda causa tiene su efecto; entender esa mecánica es entender el mundo.", name: "Isaac Newton", field: "Física" },
  { idea: "Si no lo podés explicar de forma simple, todavía no lo entendiste del todo.", name: "Richard Feynman", field: "Física" },
  { idea: "La imaginación es más importante que el conocimiento, porque abre las puertas que la lógica todavía no ve.", name: "Albert Einstein", field: "Física" },
  { idea: "La simplicidad no es quitar por quitar: es llegar a lo esencial y defenderlo.", name: "Jony Ive", field: "Diseño" },
  { idea: "Todo se mueve en ciclos; el que los entiende deja de reaccionar y empieza a anticipar.", name: "Ray Dalio", field: "Economía" },
  { idea: "Buscá lo que no solo resiste el desorden, sino que se fortalece con él.", name: "Nassim Taleb", field: "Riesgo" },
  { idea: "Ser dueño de tus claves es ser dueño de tu libertad.", name: "Andreas Antonopoulos", field: "Bitcoin" },
  { idea: "La liquidez mueve al mundo; seguí el flujo del dinero antes que las noticias.", name: "Raoul Pal", field: "Mercados" },
  { idea: "Los mejores sistemas coordinan a la gente sin necesidad de un jefe en el centro.", name: "Vitalik Buterin", field: "Blockchain" },
  { idea: "Las historias que compartimos son lo que nos permite cooperar a gran escala.", name: "Yuval Noah Harari", field: "Historia" },
  { idea: "Dudá de todo hasta encontrar algo que no puedas dudar; ahí empieza el conocimiento.", name: "René Descartes", field: "Filosofía" },
  { idea: "Actuá solo de un modo que quisieras ver convertido en regla para todos.", name: "Immanuel Kant", field: "Filosofía · Ética" },
  { idea: "No controlás lo que pasa, pero sí cómo respondés; ahí está toda tu fuerza.", name: "Marco Aurelio", field: "Estoicismo" },
  { idea: "No es que tengamos poco tiempo, es que perdemos mucho; cuidá tus horas.", name: "Séneca", field: "Estoicismo" },
  { idea: "Dejá de perseguir el momento perfecto: el único que existe es este.", name: "Alan Watts", field: "Filosofía oriental" },
  { idea: "El sufrimiento nace del aferrarse; la calma, de soltar con atención.", name: "Buda", field: "Budismo" },
  { idea: "Lo que negás en vos mismo termina gobernándote desde la sombra.", name: "Carl Jung", field: "Psicología" },
  { idea: "Pensamos rápido casi siempre; las mejores decisiones piden que vayamos despacio.", name: "Daniel Kahneman", field: "Economía conductual" },
  { idea: "Detrás de casi toda conducta difícil hay una historia de dolor sin resolver.", name: "Gabor Maté", field: "Trauma y apego" },
  { idea: "Hacé lo correcto por el planeta y el negocio sano vendrá como consecuencia.", name: "Yvon Chouinard", field: "Empresa" },
  { idea: "Mirá quién produce y quién se queda con el valor: ahí se explica casi todo.", name: "Karl Marx", field: "Economía política" },
  { idea: "El poder no solo prohíbe: define qué contamos como verdad y como normal.", name: "Michel Foucault", field: "Filosofía · Poder" },
  { idea: "No sobrevive el más fuerte, sino el que mejor se adapta al cambio.", name: "Charles Darwin", field: "Biología" },
  { idea: "El talento abre la puerta, pero es la constancia diaria la que gana los partidos largos.", name: "Novak Djokovic", field: "Tenis" },
  { idea: "La montaña no se conquista; se sube con humildad y se vuelve con respeto.", name: "Reinhold Messner", field: "Alpinismo" },
  { idea: "Los límites casi siempre están más lejos de lo que la cabeza te dice.", name: "Kilian Jornet", field: "Montañismo · Ultra" },
  { idea: "Lo imposible es solo una opinión, hasta que alguien decide intentarlo igual.", name: "Nirmal \"Nims\" Purja", field: "Montañismo" },
];

// ================================================================
export default function Northstar() {
  const [view, setView] = useState("home");
  const [trip, setTrip] = useState("no");
  const [menu, setMenu] = useState(false);

  const go = (v) => {
    setView(v);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ns">
        <TopBar go={go} menu={menu} setMenu={setMenu} />
        {view === "home" && <Home go={go} />}
        {view === "capital" && <Capital go={go} />}
        {view === "travel" && <Travel go={go} trip={trip} setTrip={setTrip} />}
        {view === "car" && <Car go={go} />}
        {view === "dog" && <Dog go={go} />}
        {view === "research" && <Research go={go} />}
        {view === "weather" && <WeatherView go={go} />}
        {view === "sleep" && <SleepView go={go} />}
        {view === "btc" && <BtcView go={go} />}
        {view === "birthdays" && <BirthdaysView go={go} />}
      </div>
    </>
  );
}

// ---------------- Top bar + menú ----------------
function TopBar({ go, menu, setMenu }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <div className={`topbar${scrolled ? " scrolled" : ""}`}>
        <div className="topbar-inner">
          <div className="mark" onClick={() => go("home")}>Northstar</div>
          <button className="burger" aria-label="Menú" onClick={() => setMenu((m) => !m)}>
            <span /><span /><span />
          </button>
        </div>
      </div>

      {menu && <div className="menu-scrim" onClick={() => setMenu(false)} />}
      <aside className={`menu${menu ? " open" : ""}`}>
        <div className="menu-head">Tu vida</div>
        <button className="menu-item" onClick={() => go("home")}>
          <span className="mi-name">Inicio</span>
        </button>
        {MODULES.map((m) => (
          <button className="menu-item" key={m.id} onClick={() => go(m.id)}>
            <span className="mi-name">{m.name}</span>
            <span className="mi-hint">{m.hint}</span>
          </button>
        ))}
      </aside>
    </>
  );
}

// ---------------- HOME ----------------
function Home({ go }) {
  const now = useNow();
  const weather = useWeather();
  const market = useMarket();
  const bday = useBirthdayEvent();
  const voice = useDailyVoice();
  const { loading: eventsLoading, events } = useCalendarEvents();
  const alerts = useBriefingAlerts(weather);

  // Ojo con la hidratación: mientras `now` es null (mismo estado inicial en
  // servidor y cliente), NO calculamos un saludo "de respaldo" — eso causaba
  // un mismatch (servidor decía "Buen día", cliente lo cambiaba a "Buenas
  // noches" un instante después). Mostramos un saludo neutro hasta tener la
  // hora real, y recién ahí calculamos el definitivo.
  const hour = now ? now.getHours() : null;
  const greeting = hour === null ? "Hola, Juan." : greetingByHour(hour);

  // Solo pedimos el briefing cuando ya tenemos algo de clima y sabemos si
  // terminó de cargar la agenda (para no mandar un contexto vacío de arranque).
  const briefingReady = !!weather && !eventsLoading;
  const briefingText = useBriefingText({
    weather,
    events,
    birthday: bday.today ? cleanBirthdayName(bday.today.title) : null,
    alerts,
    hour: hour ?? new Date().getHours(), // fallback solo para el envío al backend, nunca para el render
    ready: briefingReady,
  });

  const eyebrow = now
    ? `${cap(now.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }))} · ${now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}`
    : "";

  return (
    <div className="shell">
      <header className="hero">
        <div className="hero-top">
          <div className="hero-left">
            <div className="eyebrow">{eyebrow}</div>
            <h1 className="briefing">{greeting}</h1>
            {briefingText && <p className="briefing-lines">{briefingText}</p>}

            <div className="chips">
              <div className="chip chip-tap" onClick={() => go("weather")}>
                <span className="chip-k">Clima</span>
                <span className="chip-v">{weather ? `${weather.temp}°` : "—"}</span>
                <span className="chip-x">{weather ? weather.desc : ""}</span>
              </div>
              <SleepChip onOpen={() => go("sleep")} />
              <div className="chip chip-tap" onClick={() => go("btc")}>
                <span className="chip-k">
                  BTC
                  <span
                    className={`live ${market.dir === "up" ? "up" : market.dir === "down" ? "down" : ""}`}
                    title={market.dir === "up" ? "Subió vs. ayer" : market.dir === "down" ? "Bajó vs. ayer" : "En vivo"}
                  />
                </span>
                <span className="chip-v">{market.btc ? `US$${market.btc.toLocaleString("en-US")}` : "—"}</span>
                {market.pct != null && (
                  <span className={`chip-x ${market.dir}`}>
                    {market.dir === "up" ? "▲" : "▼"} {Math.abs(market.pct).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className={`chip chip-tap${bday.today ? " chip-on" : ""}`} onClick={() => go("birthdays")}>
                <span className="chip-k">{bday.today ? "Cumpleaños" : "Próximo cumpleaños"}</span>
                <span className="chip-v">
                  {bday.today
                    ? cleanBirthdayName(bday.today.title)
                    : bday.next
                    ? cleanBirthdayName(bday.next.title)
                    : "—"}
                </span>
                {!bday.today && bday.next && (
                  <span className="chip-x">
                    {cap(new Date(bday.next.start).toLocaleDateString("es-AR", { day: "numeric", month: "short" }))}
                  </span>
                )}
              </div>
            </div>
          </div>
          {voice && (
            <aside className="voice">
              <div className="voice-label">Para pensar hoy</div>
              <p className="voice-idea">{voice.idea}</p>
              <div className="voice-by">
                <span className="voice-name">{voice.name}</span>
                <span className="voice-field">{voice.field}</span>
              </div>
              <WorldClocks />
            </aside>
          )}
        </div>
      </header>

      <section>
        <div className="split">
          <div className="split-col">
            <div className="sec-label">El día</div>
            <Agenda />
          </div>
          <div className="split-col">
            <div className="sec-label">Pendientes</div>
            <Reorderable
              initial={[
                { id: "p1", txt: "Revisar lista de precios del proveedor", done: false },
                { id: "p2", txt: "Aprobar las tapas del catálogo", done: false },
                { id: "p3", txt: "Llamar al contador", done: true },
              ]}
              kind="tasks"
              placeholder="Agregar un pendiente…"
              storeKey="tasks"
            />
          </div>
        </div>
      </section>

      <Foot />
    </div>
  );
}

// ---------------- Sleep chip (editable + abre vista) ----------------
function SleepChip({ onOpen }) {
  const [sleep, setSleep] = useStored("sleep", "7:12");
  const [editing, setEditing] = useState(false);
  return (
    <div className="chip chip-tap" onClick={() => !editing && onOpen && onOpen()}>
      <span className="chip-k">
        Sueño
        <span className="chip-edit-ico" onClick={(e) => { e.stopPropagation(); setEditing(true); }} title="Editar">✎</span>
      </span>
      {editing ? (
        <input
          className="chip-edit"
          autoFocus
          value={sleep}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setSleep(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
        />
      ) : (
        <span className="chip-v">{sleep}</span>
      )}
    </div>
  );
}

// ---------------- World clocks (texto, editables) ----------------
function WorldClocks() {
  const now = useNow();
  const [clocks, setClocks] = useState(INITIAL_CLOCKS);
  const [editing, setEditing] = useState(null);

  const fmt = (tz) => {
    if (!now) return "—";
    try {
      return new Intl.DateTimeFormat("es-AR", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
    } catch { return "—"; }
  };
  const setClock = (id, patch) => setClocks((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  return (
    <div className="clocks">
      {clocks.map((c) => (
        <div className="clock-line" key={c.id}>
          {editing === c.id ? (
            <select
              className="clock-select"
              autoFocus
              value={c.tz}
              onChange={(e) => {
                const opt = TZ_OPTIONS.find((o) => o.tz === e.target.value);
                if (opt) setClock(c.id, { tz: opt.tz, label: opt.label, country: opt.country });
                setEditing(null);
              }}
              onBlur={() => setEditing(null)}
            >
              {TZ_OPTIONS.map((o) => <option key={o.tz} value={o.tz}>{o.label}, {o.country}</option>)}
            </select>
          ) : (
            <>
              <span className="clock-time">{fmt(c.tz)}</span>
              <span className="clock-place" onClick={() => setEditing(c.id)}>
                {c.label}<span className="clock-country">, {c.country}</span>
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------- Agenda real (Google Calendar, solo lectura) ----------------
function Agenda() {
  const { loading, events, error } = useCalendarEvents();

  if (loading) {
    return <div className="agenda-empty">Cargando tu agenda…</div>;
  }
  if (error === "no_config") {
    return <div className="agenda-empty">Conectá tu Google Calendar para ver tu semana acá.</div>;
  }
  if (error) {
    return <div className="agenda-empty">No se pudo cargar el calendario ahora.</div>;
  }
  if (events.length === 0) {
    return <div className="agenda-empty">Nada agendado en los próximos 7 días.</div>;
  }

  // Agrupar por día
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const groups = [];
  const byDay = {};
  events.forEach((e) => {
    const d = new Date(e.start);
    const dayKey = d.toDateString();
    if (!byDay[dayKey]) {
      byDay[dayKey] = { date: d, items: [] };
      groups.push(byDay[dayKey]);
    }
    byDay[dayKey].items.push(e);
  });

  const dayLabel = (d) => {
    const diff = Math.round((d - today) / 86400000);
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Mañana";
    return cap(d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short" }));
  };

  return (
    <div className="agenda-real">
      {groups.map((g, gi) => (
        <div className="agenda-group" key={gi}>
          <div className="agenda-day">{dayLabel(g.date)}</div>
          {g.items.map((e, i) => (
            <div className="moment" key={i}>
              <div className="time">{e.allDay ? "Todo el día" : new Date(e.start).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}</div>
              <div>
                <div className="what">{e.title}</div>
                {e.location && <div className="where">{e.location}</div>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------- Reorderable (drag, edit, add, delete) ----------------
function Reorderable({ initial, kind, placeholder, storeKey }) {
  const [items, setItems] = useStored(storeKey, initial);
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const dragIndex = useRef(null);
  const [overIndex, setOverIndex] = useState(null);

  const add = (e) => {
    if (e.key === "Enter" && input.trim()) {
      setItems((it) => [...it, { id: uid(), txt: input.trim(), done: false, meta: "" }]);
      setInput("");
    }
  };
  const remove = (id) => setItems((it) => it.filter((x) => x.id !== id));
  const toggle = (id) => setItems((it) => it.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const startEdit = (item) => { setEditing(item.id); setEditText(item.txt); };
  const commitEdit = (id) => {
    setItems((it) => it.map((x) => (x.id === id ? { ...x, txt: editText.trim() || x.txt } : x)));
    setEditing(null);
  };

  const onDragStart = (i) => (dragIndex.current = i);
  const onDragOver = (i) => (e) => { e.preventDefault(); setOverIndex(i); };
  const onDrop = (i) => () => {
    const from = dragIndex.current;
    if (from == null || from === i) { setOverIndex(null); return; }
    setItems((it) => {
      const next = [...it];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      return next;
    });
    dragIndex.current = null;
    setOverIndex(null);
  };

  return (
    <>
      <div className="list">
        {items.map((item, i) => (
          <div
            key={item.id}
            className={`row${item.done ? " done" : ""}${overIndex === i ? " over" : ""}`}
            draggable={editing !== item.id}
            onDragStart={() => onDragStart(i)}
            onDragOver={onDragOver(i)}
            onDrop={onDrop(i)}
            onDragEnd={() => setOverIndex(null)}
          >
            <span className="grip" aria-hidden>
              <span /><span /><span /><span /><span /><span />
            </span>

            {kind === "tasks" && (
              <button className={`box${item.done ? " on" : ""}`} onClick={() => toggle(item.id)} aria-label="Completar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
              </button>
            )}

            <div className="row-body">
              {editing === item.id ? (
                <input
                  className="row-edit"
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commitEdit(item.id)}
                  onBlur={() => commitEdit(item.id)}
                />
              ) : (
                <span className="row-txt" onClick={() => startEdit(item)}>{item.txt}</span>
              )}
              {item.meta && editing !== item.id && <span className="row-meta">{item.meta}</span>}
            </div>

            <button className="row-del" onClick={() => remove(item.id)} aria-label="Eliminar">×</button>
          </div>
        ))}
      </div>
      <div className="add">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={add} placeholder={placeholder} />
      </div>
    </>
  );
}

// ---------------- CAPITAL ----------------
function Capital({ go }) {
  const market = useMarket();
  return (
    <div className="shell">
      <DetailHead go={go} title="Capital" sub="Tu patrimonio, de un vistazo" />
      <p className="lead">
        Tu patrimonio subió <em>+1,4% hoy</em>, empujado por Bitcoin. El dólar CCL
        cerró en {market.dolar || "1.485"}, estable frente a ayer.
      </p>

      <div className="block">
        <div className="block-label">Patrimonio total</div>
        <div className="cap-hero">USD 84.200 <small>≈ $125 M ARS</small></div>
        <div className="cap-delta up">+ USD 1.160 hoy · +1,4%</div>
      </div>

      <div className="block">
        <div className="block-label">Composición</div>
        <div className="cap-split">
          <CapLine name="Bitcoin" sub="0,42 BTC · 58% del total"
            amt={market.btc ? `USD ${(0.42 * market.btc).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "USD 48.900"}
            chg="+2,1% hoy" chgCls="up" />
          <CapLine name="Dólares · líquido" sub="MEP / CCL · 24% del total" amt="USD 20.100" chg="estable" />
          <CapLine name="STRC · acciones" sub="Strategy preferred · 12% del total" amt="USD 10.400" chg="+0,6% hoy" chgCls="up" />
          <CapLine name="Pesos · caja" sub="Operativo · 6% del total" amt="USD 4.800" chg="−0,3% (inflación)" chgCls="down" />
        </div>
      </div>

      <div className="block">
        <div className="block-label">Tipo de cambio</div>
        <div className="cap-split">
          <CapLine name="Dólar CCL" amt={market.dolar ? `$${market.dolar}` : "$1.485"} />
          <CapLine name="Dólar MEP" amt={market.mep ? `$${market.mep}` : "$1.472"} />
          <CapLine name="Bitcoin" amt={market.btc ? `USD ${market.btc.toLocaleString("en-US")}` : "USD 116.400"} />
        </div>
      </div>

      <div className="block">
        <div className="block-label">Este mes</div>
        <div className="cap-split">
          <CapLine name="Ahorro en dólares" sub="Meta: USD 1.500" amt="USD 1.200" />
          <CapLine name="Gastos" sub="$480k de $650k presupuestado" amt="74%" />
        </div>
      </div>
      <Foot />
    </div>
  );
}
function CapLine({ name, sub, amt, chg, chgCls }) {
  return (
    <div className="cap-line">
      <div className="cl-name">{name}{sub && <div className="cl-sub">{sub}</div>}</div>
      <div>
        <div className="cl-amt">{amt}</div>
        {chg && <div className={`cl-chg ${chgCls || ""}`}>{chg}</div>}
      </div>
    </div>
  );
}

// ---------------- TRAVEL ----------------
const TRIPS = {
  no: { name: "Oslo Plan", when: "12–24 septiembre · 12 días", status: "En curso",
    lead: <>Casi todo listo. Los vuelos y hoteles están confirmados; solo falta <em>armar el equipaje</em> y el permiso de conducir.</>,
    budget: ["3.200", "5.000", "USD", 64],
    book: [["Vuelo EZE → Oslo", "Scandinavian · 14 sep", "$1.180"], ["Bergen · Waterfront", "3 noches", "$540"], ["Flåm · Fretheim", "2 noches", "$420"], ["Oslo · The Thief", "2 noches", "$680"]],
    tl: [["15 sep", "Bergen", "Bryggen y funicular Fløyen"], ["17 sep", "Flåm", "Tren panorámico y crucero por el fiordo"], ["19 sep", "Nærøyfjord", "Kayak · Patrimonio UNESCO"], ["21 sep", "Oslo", "Museo Munch"], ["23 sep", "Aurora boreal", "Excursión nocturna"]],
    pack: ["Campera impermeable", "Botas de trekking", "Capas térmicas", "Adaptador tipo F", "Cámara", "Power bank"],
    docs: [["Pasaporte", "vigente hasta 2029", "ok"], ["Seguro de viaje", "confirmado", "ok"], ["Permiso intl. de conducir", "tramitar", "warn"]],
    cur: "8° / 2° · lluvia ocasional · 1 NOK ≈ 143 ARS" },
  pa: { name: "Patagonia", when: "Noviembre · 8 días", status: "Planeando",
    lead: <>El plan está tomando forma. Vuelos reservados; falta <em>cerrar el seguro de trekking</em>.</>,
    budget: ["180", "900", "mil ARS", 20],
    book: [["Vuelo AEP → El Calafate", "Aerolíneas", "$210.000"], ["El Chaltén · Hostería", "4 noches", "$320.000"], ["El Calafate", "3 noches", "$280.000"]],
    tl: [["9 nov", "El Chaltén", "Laguna de los Tres · Fitz Roy"], ["11 nov", "Laguna Torre", ""], ["13 nov", "Perito Moreno", "El glaciar"], ["15 nov", "Navegación", "Glaciar Upsala"]],
    pack: ["Campera rompeviento", "Bastones de trekking", "Botas", "Termo y mate", "Capas"],
    docs: [["DNI", "vigente", "ok"], ["Reserva de parques", "Los Glaciares", "ok"], ["Seguro de trekking", "contratar", "warn"]],
    cur: "Viento fuerte · 12° / 3° · moneda local" },
  ca: { name: "Canadá", when: "2027 · por definir", status: "Idea",
    lead: <>Todavía una idea. Lo primero será <em>elegir fechas y cotizar vuelos</em>.</>,
    budget: ["400", "6.000", "USD", 7],
    book: [["Vuelo EZE → Vancouver", "a cotizar", "~$1.400"], ["Banff · Fairmont", "idea", "—"]],
    tl: [["Día 1", "Vancouver", ""], ["Día 4", "Banff", "Montañas Rocosas"], ["Día 8", "Jasper", ""]],
    pack: ["Ropa de nieve", "Crampones", "Bufanda térmica"],
    docs: [["eTA Canadá", "tramitar", "warn"], ["Pasaporte", "vigente", "ok"]],
    cur: "Variable según temporada · 1 CAD ≈ 1.100 ARS" },
  jp: { name: "Japón", when: "2027 · por definir", status: "Idea",
    lead: <>Una idea que vuelve. El <em>JR Pass conviene comprarlo antes</em> de viajar.</>,
    budget: ["200", "7.000", "USD", 3],
    book: [["Vuelo EZE → Tokio", "vía escala", "~$1.900"], ["Tokio · Shinjuku", "idea", "—"], ["Kyoto · ryokan", "idea", "—"]],
    tl: [["Día 1", "Tokio", "Shibuya y Asakusa"], ["Día 5", "Kyoto", "Templos y Arashiyama"], ["Día 8", "Osaka", "Dotonbori"], ["Día 10", "Monte Fuji", ""]],
    pack: ["Zapatos cómodos", "JR Pass", "Efectivo en yen", "Wifi de bolsillo"],
    docs: [["Visa", "no requiere <90 días", "ok"], ["JR Pass", "comprar antes", "warn"], ["Pasaporte", "vigente", "ok"]],
    cur: "Depende de estación · sakura en abril · 1000 JPY ≈ 9.900 ARS" },
};

function Travel({ go, trip, setTrip }) {
  const t = TRIPS[trip];
  const pct = t.budget[3];
  const [pack, setPack] = useState({});
  return (
    <div className="shell">
      <DetailHead go={go} title="Viajes" sub="Cuatro lugares en la cabeza" />
      <div className="trips">
        {Object.entries(TRIPS).map(([k, v]) => (
          <div className={`trip${k === trip ? " active" : ""}`} key={k} onClick={() => { setTrip(k); setPack({}); }}>
            <div className="t-info"><div className="t-nm">{v.name}</div><div className="t-wh">{v.when}</div></div>
            <span className="t-st">{v.status}</span>
          </div>
        ))}
      </div>

      <p className="lead" style={{ marginTop: 8 }}>{t.lead}</p>

      <div className="block">
        <div className="block-label">Presupuesto</div>
        <div className="metrics-inline">
          <div className="mi">
            <div className="mi-num">{t.budget[0]}<small> / {t.budget[1]}</small></div>
            <div className="mi-lbl">{t.budget[2]} · {pct}% comprometido</div>
          </div>
        </div>
        <div className="thin-bar"><span style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="block">
        <div className="block-label">Vuelos y hoteles</div>
        <div className="rows">
          {t.book.map((b, i) => (
            <div className="r" key={i}>
              <div className="r-main">{b[0]}{b[1] && <div className="r-sub">{b[1]}</div>}</div>
              {b[2] && <span className="r-val">{b[2]}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <div className="block-label">Itinerario</div>
        <div className="timeline">
          {t.tl.map((x, i) => (
            <div className="tl" key={i}>
              <div className="tl-d">{x[0]}</div>
              <div className="tl-w">{x[1]}</div>
              {x[2] && <div className="tl-n">{x[2]}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <div className="block-label">Equipaje</div>
        <div className="pack">
          {t.pack.map((p, i) => (
            <div className={`pk${pack[i] ? " done" : ""}`} key={i} onClick={() => setPack((s) => ({ ...s, [i]: !s[i] }))}>
              <span className="box2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
              </span>
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <div className="block-label">Documentos</div>
        <div className="rows">
          {t.docs.map((d, i) => (
            <div className="r" key={i}>
              <div className="r-main">{d[0]}<div className="r-sub">{d[1]}</div></div>
              <span className={`r-val ${d[2] === "ok" ? "ok" : "warn"}`}>{d[2] === "ok" ? "listo" : "pendiente"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <div className="block-label">Clima y moneda</div>
        <p className="lead" style={{ fontSize: 17 }}>{t.cur}</p>
      </div>
      <Foot />
    </div>
  );
}

// ---------------- EditableModule (bloques y filas totalmente editables) ----------------
/*
  Estructura de datos:
  blocks: [{ id, label, rows: [{ id, main, sub, val, due(YYYY-MM-DD|""), cls }] }]
  - due: si tiene fecha, se muestra "faltan X días" y pinta alerta según proximidad.
  - cls manual ("ok"/"warn") solo si no hay due.
*/
function EditableModule({ initialBlocks, storeKey }) {
  const [blocks, setBlocks] = useStored(storeKey, initialBlocks);
  const dragRef = useRef(null);
  const [over, setOver] = useState({ block: null, row: null });

  const patchBlock = (bid, patch) => setBlocks((bs) => bs.map((b) => (b.id === bid ? { ...b, ...patch } : b)));
  const patchRow = (bid, rid, patch) =>
    setBlocks((bs) => bs.map((b) => b.id === bid ? { ...b, rows: b.rows.map((r) => (r.id === rid ? { ...r, ...patch } : r)) } : b));
  const addRow = (bid) =>
    setBlocks((bs) => bs.map((b) => b.id === bid ? { ...b, rows: [...b.rows, { id: uid(), main: "", sub: "", val: "", due: "", cls: "" }] } : b));
  const delRow = (bid, rid) =>
    setBlocks((bs) => bs.map((b) => b.id === bid ? { ...b, rows: b.rows.filter((r) => r.id !== rid) } : b));
  const addBlock = () => setBlocks((bs) => [...bs, { id: uid(), label: "Nuevo bloque", rows: [] }]);
  const delBlock = (bid) => setBlocks((bs) => bs.filter((b) => b.id !== bid));

  const onDrop = (bid, ri) => () => {
    const d = dragRef.current;
    if (!d || d.block !== bid) { setOver({ block: null, row: null }); return; }
    setBlocks((bs) => bs.map((b) => {
      if (b.id !== bid) return b;
      const rows = [...b.rows];
      const [moved] = rows.splice(d.row, 1);
      rows.splice(ri, 0, moved);
      return { ...b, rows };
    }));
    dragRef.current = null;
    setOver({ block: null, row: null });
  };

  return (
    <>
      {blocks.map((b) => (
        <div className="block eb" key={b.id}>
          <div className="eb-head">
            <EditText className="block-label" value={b.label} onChange={(v) => patchBlock(b.id, { label: v })} placeholder="Título…" />
            <button className="eb-delblock" onClick={() => delBlock(b.id)} title="Eliminar bloque">×</button>
          </div>
          <div className="rows">
            {b.rows.map((r, ri) => (
              <div
                key={r.id}
                className={`erow${over.block === b.id && over.row === ri ? " over" : ""}`}
                draggable
                onDragStart={() => (dragRef.current = { block: b.id, row: ri })}
                onDragOver={(e) => { e.preventDefault(); setOver({ block: b.id, row: ri }); }}
                onDrop={onDrop(b.id, ri)}
                onDragEnd={() => setOver({ block: null, row: null })}
              >
                <span className="grip" aria-hidden><span /><span /><span /><span /><span /><span /></span>
                <div className="erow-body">
                  <EditText className="erow-main" value={r.main} onChange={(v) => patchRow(b.id, r.id, { main: v })} placeholder="Ítem…" />
                  <EditText className="erow-sub" value={r.sub} onChange={(v) => patchRow(b.id, r.id, { sub: v })} placeholder="detalle (opcional)" />
                </div>
                <div className="erow-right">
                  <Deadline
                    due={r.due}
                    val={r.val}
                    cls={r.cls}
                    onDue={(v) => patchRow(b.id, r.id, { due: v })}
                    onVal={(v) => patchRow(b.id, r.id, { val: v })}
                  />
                </div>
                <button className="erow-del" onClick={() => delRow(b.id, r.id)} aria-label="Eliminar fila">×</button>
              </div>
            ))}
          </div>
          <button className="eb-addrow" onClick={() => addRow(b.id)}>+ Agregar ítem</button>
        </div>
      ))}
      <button className="eb-addblock" onClick={addBlock}>+ Agregar bloque</button>
    </>
  );
}

// Texto editable inline (clic para editar)
function EditText({ value, onChange, className, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  if (editing) {
    return (
      <input
        className={`et-input ${className || ""}`}
        autoFocus
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") { onChange(draft); setEditing(false); } }}
      />
    );
  }
  return (
    <span className={`et-view ${className || ""}${!value ? " empty" : ""}`} onClick={() => setEditing(true)}>
      {value || placeholder}
    </span>
  );
}

// Deadline: fecha límite con cuenta regresiva y alerta, o valor libre
function Deadline({ due, val, cls, onDue, onVal }) {
  const [open, setOpen] = useState(false);
  const info = deadlineInfo(due);

  if (open) {
    return (
      <div className="dl-edit">
        <input
          type="date"
          className="dl-date"
          value={due || ""}
          onChange={(e) => onDue(e.target.value)}
        />
        <input
          className="dl-val"
          value={val || ""}
          placeholder="o estado (ej: al día)"
          onChange={(e) => onVal(e.target.value)}
        />
        <button className="dl-done" onClick={() => setOpen(false)}>Listo</button>
      </div>
    );
  }

  // Si hay fecha, mostramos la cuenta regresiva con su alerta.
  if (due && info) {
    return (
      <span className={`erow-val ${info.level}`} onClick={() => setOpen(true)} title={due}>
        {info.text}
      </span>
    );
  }
  // Si no hay fecha, mostramos el valor libre (con cls manual si tiene).
  return (
    <span className={`erow-val ${cls || ""}`} onClick={() => setOpen(true)}>
      {val || <span className="erow-val-add">+ fecha / estado</span>}
    </span>
  );
}

// Calcula texto y nivel de alerta a partir de una fecha límite
function deadlineInfo(due) {
  if (!due) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(due + "T00:00:00");
  if (isNaN(target)) return null;
  const days = Math.round((target - today) / 86400000);
  let text, level;
  if (days < 0) { text = `vencido hace ${Math.abs(days)} d`; level = "over"; }
  else if (days === 0) { text = "hoy"; level = "warn"; }
  else if (days === 1) { text = "mañana"; level = "warn"; }
  else if (days <= 7) { text = `en ${days} días`; level = "warn"; }
  else { text = `en ${days} días`; level = ""; }
  return { text, level, days };
}

// ---------------- CAR ----------------
function Car({ go }) {
  return (
    <div className="shell">
      <DetailHead go={go} title="Jeep Renegade" sub="Longitude 1.6 · 2021 · 68.520 km" />
      <p className="lead">Mantenimiento, seguro y viajes. Todo editable: tocá un texto para cambiarlo, arrastrá para reordenar, poné fechas límite.</p>
      <EditableModule initialBlocks={[
        { id: "b1", label: "Mantenimiento", rows: [
          { id: uid(), main: "Aceite y filtro", sub: "Cada 10.000 km", val: "", due: isoIn(9), cls: "" },
          { id: uid(), main: "Rotación de neumáticos", sub: "Cada 12.000 km", val: "", due: isoIn(40), cls: "" },
          { id: uid(), main: "Filtro de aire", sub: "Cada 20.000 km", val: "", due: isoIn(-3), cls: "" },
          { id: uid(), main: "Frenos y batería", sub: "", val: "al día", due: "", cls: "ok" },
        ]},
        { id: "b2", label: "Seguro y costos", rows: [
          { id: uid(), main: "Seguro · La Segunda", sub: "Todo riesgo · póliza 4471-88", val: "", due: isoIn(63), cls: "" },
          { id: uid(), main: "Cuota mensual", sub: "", val: "$48.500", due: "", cls: "" },
          { id: uid(), main: "Combustible (mes)", sub: "", val: "$142.000", due: "", cls: "" },
          { id: uid(), main: "Mantenimiento (año)", sub: "", val: "$890.000", due: "", cls: "" },
        ]},
        { id: "b3", label: "Estado", rows: [
          { id: uid(), main: "Presión promedio", sub: "", val: "32 psi", due: "", cls: "" },
          { id: uid(), main: "Consumo", sub: "cada 100 km", val: "9,8 L", due: "", cls: "" },
          { id: uid(), main: "Kilómetros", sub: "", val: "68.520", due: "", cls: "" },
        ]},
        { id: "b4", label: "Dónde estuvo", rows: [
          { id: uid(), main: "Ruta de los 7 lagos", sub: "Enero · off-road ligero", val: "1.640 km", due: "", cls: "" },
          { id: uid(), main: "Costa Atlántica", sub: "Diciembre", val: "820 km", due: "", cls: "" },
          { id: uid(), main: "Sierras de Córdoba", sub: "Octubre", val: "1.380 km", due: "", cls: "" },
        ]},
      ]} storeKey="car" />
      <Foot />
    </div>
  );
}

// ---------------- DOG ----------------
function Dog({ go }) {
  return (
    <div className="shell">
      <DetailHead go={go} title="Yukon" sub="Husky siberiano · 4 años" />
      <p className="lead">Salud, comida y entrenamiento. Todo editable: tocá para cambiar, arrastrá para reordenar, poné fechas de vacunas y turnos.</p>
      <EditableModule initialBlocks={[
        { id: "d1", label: "Salud", rows: [
          { id: uid(), main: "Antirrábica", sub: "Vacuna anual", val: "", due: isoIn(12), cls: "" },
          { id: uid(), main: "Séxtuple (DHPP)", sub: "", val: "al día", due: "", cls: "ok" },
          { id: uid(), main: "Antiparasitaria", sub: "Cada 3 meses", val: "al día", due: "", cls: "ok" },
          { id: uid(), main: "Turno con el vet", sub: "Control general", val: "", due: isoIn(12), cls: "" },
          { id: uid(), main: "Antipulgas · NexGard", sub: "Mensual", val: "", due: isoIn(19), cls: "" },
        ]},
        { id: "d2", label: "Comida", rows: [
          { id: uid(), main: "Royal Canin Maxi Adult 15kg", sub: "300 g/día · dos tomas", val: "", due: isoIn(5), cls: "" },
          { id: uid(), main: "Última compra", sub: "28 junio", val: "$62.000", due: "", cls: "" },
        ]},
        { id: "d3", label: "Cómo está", rows: [
          { id: uid(), main: "Peso", sub: "estable", val: "28,4 kg", due: "", cls: "" },
          { id: uid(), main: "Paseo promedio", sub: "", val: "2,6 km", due: "", cls: "" },
          { id: uid(), main: "Paseos hoy", sub: "", val: "1 / 2", due: "", cls: "" },
        ]},
        { id: "d4", label: "Entrenamiento", rows: [
          { id: uid(), main: '"Quieto" a distancia', sub: "", val: "dominado", due: "", cls: "ok" },
          { id: uid(), main: "Recall sin correa", sub: "", val: "70%", due: "", cls: "" },
          { id: uid(), main: "No tirar de la correa", sub: "", val: "practicando", due: "", cls: "" },
          { id: uid(), main: "Nota", sub: "Ansioso con tormentas · más ejercicio ayuda", val: "", due: "", cls: "" },
        ]},
      ]} storeKey="dog" />
      <Foot />
    </div>
  );
}

// ---------------- RESEARCH ----------------
function Research({ go }) {
  const [items, setItems] = useStored("research", [
    { kind: "paper", title: "Scaling Laws for Neural Language Models", src: "arxiv.org · Kaplan et al.", url: "#", read: false },
    { kind: "link", title: "Cómo optimizar tiendas para búsqueda con IA (GEO)", src: "searchengineland.com", url: "#", read: false },
    { kind: "video", title: "The Economics of Argentina 2026 — explicación", src: "youtube.com · 24 min", url: "#", read: false },
    { kind: "paper", title: "A Survey of Retrieval-Augmented Generation", src: "arxiv.org", url: "#", read: false },
    { kind: "link", title: "Vibia — sistema de iluminación arquitectónica", src: "vibia.com", url: "#", read: true },
    { kind: "video", title: "Charlie Munger on mental models", src: "youtube.com · 18 min", url: "#", read: false },
    { kind: "paper", title: "Constitutional AI: Harmlessness from AI Feedback", src: "anthropic.com", url: "#", read: true },
  ]);
  const [filter, setFilter] = useState("all");
  const [input, setInput] = useState("");
  const kindLabel = { paper: "Paper", video: "Video", link: "Link" };
  const toggle = (idx) => setItems((it) => it.map((r, i) => (i === idx ? { ...r, read: !r.read } : r)));
  const detectKind = (t) => {
    t = t.toLowerCase();
    if (t.includes("arxiv") || t.includes(".pdf") || t.includes("paper")) return "paper";
    if (t.includes("youtu") || t.includes("vimeo") || t.includes("video")) return "video";
    return "link";
  };
  const add = (e) => {
    if (e.key === "Enter" && input.trim()) {
      const raw = input.trim();
      const kind = detectKind(raw);
      let title = raw, src = "Guardado hoy", url = "#";
      if (/^https?:\/\//i.test(raw)) {
        try { const u = new URL(raw); src = u.hostname.replace("www.", ""); title = u.hostname.replace("www.", "") + u.pathname; url = raw; } catch {}
      }
      setItems((it) => [{ kind, title, src, url, read: false }, ...it]);
      setInput("");
    }
  };
  const shown = items.filter((r) => filter === "all" ? true : filter === "read" ? r.read : r.kind === filter);

  return (
    <div className="shell">
      <DetailHead go={go} title="Research" sub="Para leer o ver cuando puedas" />
      <div className="res-add">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={add} placeholder="Pegá un link o escribí un título…" />
      </div>
      <div className="res-filter">
        {[["all", "Todo"], ["paper", "Papers"], ["video", "Videos"], ["link", "Links"], ["read", "Leídos"]].map(([f, label]) => (
          <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{label}</button>
        ))}
      </div>
      <div className="res-list">
        {shown.length === 0 ? (
          <div className="res-empty">Nada por acá todavía. Pegá tu primer link arriba.</div>
        ) : shown.map((r) => {
          const idx = items.indexOf(r);
          const isLink = r.url && r.url !== "#";
          return (
            <div className={`res-item${r.read ? " read" : ""}`} key={idx}>
              <button className="box" onClick={() => toggle(idx)} aria-label="Marcar leído">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
              </button>
              <div className="r-content">
                <div className="r-kind">{kindLabel[r.kind] || "Link"}</div>
                <div className="r-title">{r.title}</div>
                <div className="r-src">{r.src}</div>
              </div>
              {isLink && <a className="r-open" href={r.url} target="_blank" rel="noopener noreferrer">↗</a>}
            </div>
          );
        })}
      </div>
      <Foot />
    </div>
  );
}

// ================================================================
// GRÁFICO DE LÍNEA SVG (minimalista, sin librerías)
// ================================================================
function LineChart({ data, format, height = 160, up = true }) {
  if (!data || data.length < 2) return <div className="chart-empty">Sin datos suficientes.</div>;
  const w = 640, h = height, pad = 8;
  const values = data.map((d) => d.v);
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const x = (i) => pad + (i / (data.length - 1)) * (w - pad * 2);
  const y = (v) => pad + (1 - (v - min) / range) * (h - pad * 2);
  const pts = data.map((d, i) => `${x(i)},${y(d.v)}`).join(" ");
  const area = `${pts} ${x(data.length - 1)},${h} ${x(0)},${h}`;
  const stroke = up ? "var(--up)" : "var(--down)";
  const last = data[data.length - 1], first = data[0];
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="chart-svg">
        <polyline points={area} fill={stroke} opacity="0.06" stroke="none" />
        <polyline points={pts} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(data.length - 1)} cy={y(last.v)} r="3.5" fill={stroke} />
      </svg>
      <div className="chart-ends">
        <span>{first.label}</span>
        <span>{last.label}</span>
      </div>
    </div>
  );
}

function RangeTabs({ value, onChange, options }) {
  return (
    <div className="range-tabs">
      {options.map((o) => (
        <button key={o} className={value === o ? "on" : ""} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );
}

// ---------------- WEATHER VIEW (7 días, real) ----------------
function WeatherView({ go }) {
  const [days, setDays] = useState(null);
  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`)
      .then((r) => r.json())
      .then((d) => {
        const list = (d.daily?.time || []).map((t, i) => ({
          date: new Date(t + "T00:00:00"),
          code: d.daily.weather_code[i],
          max: Math.round(d.daily.temperature_2m_max[i]),
          min: Math.round(d.daily.temperature_2m_min[i]),
          pop: d.daily.precipitation_probability_max?.[i] ?? null,
        }));
        setDays(list);
      })
      .catch(() => setDays([]));
  }, []);

  const allMax = days && days.length ? Math.max(...days.map((d) => d.max)) : 0;
  const allMin = days && days.length ? Math.min(...days.map((d) => d.min)) : 0;
  const span = allMax - allMin || 1;

  return (
    <div className="shell">
      <DetailHead go={go} title="Clima" sub="Buenos Aires · próximos 7 días" />
      {!days ? (
        <p className="lead">Cargando el pronóstico…</p>
      ) : days.length === 0 ? (
        <p className="lead">No se pudo cargar el pronóstico ahora.</p>
      ) : (
        <div className="wx-list">
          {days.map((d, i) => {
            const [, desc] = weatherOfCode(d.code);
            const l = ((d.min - allMin) / span) * 100;
            const r = ((allMax - d.max) / span) * 100;
            return (
              <div className="wx-day" key={i}>
                <span className="wx-name">{i === 0 ? "Hoy" : cap(d.date.toLocaleDateString("es-AR", { weekday: "short" }))}</span>
                <span className="wx-desc">{desc}{d.pop != null && d.pop > 20 ? ` · ${d.pop}%` : ""}</span>
                <span className="wx-min">{d.min}°</span>
                <span className="wx-track"><span className="wx-fill" style={{ left: `${l}%`, right: `${r}%` }} /></span>
                <span className="wx-max">{d.max}°</span>
              </div>
            );
          })}
        </div>
      )}
      <Foot />
    </div>
  );
}

// ---------------- SLEEP VIEW (histórico manual/simulado) ----------------
function SleepView({ go }) {
  const [range, setRange] = useState("1S");
  // Serie simulada base (horas de sueño). En producción vendría de Garmin o input diario.
  const [log] = useStored("sleepLog", genSleepSeed());
  const ranges = { "1S": 7, "1M": 30, "3M": 90, "6M": 180 };
  const n = ranges[range];
  const slice = log.slice(-n);
  const step = Math.max(1, Math.floor(slice.length / 30));
  const data = slice.filter((_, i) => i % step === 0).map((d) => ({
    v: d.h,
    label: new Date(d.date).toLocaleDateString("es-AR", { day: "numeric", month: "short" }),
  }));
  const avg = slice.length ? (slice.reduce((a, b) => a + b.h, 0) / slice.length) : 0;
  const best = slice.length ? Math.max(...slice.map((d) => d.h)) : 0;

  return (
    <div className="shell">
      <DetailHead go={go} title="Sueño" sub="Tu descanso en el tiempo" />
      <p className="lead">Promedio de <em>{fmtHours(avg)}</em> en este período. Tu mejor noche fue de {fmtHours(best)}.</p>
      <RangeTabs value={range} onChange={setRange} options={["1S", "1M", "3M", "6M"]} />
      <LineChart data={data} up={avg >= 7} />
      <div className="block">
        <div className="block-label">Resumen</div>
        <div className="cap-split">
          <div className="cap-line"><div className="cl-name">Promedio</div><div className="cl-amt">{fmtHours(avg)}</div></div>
          <div className="cap-line"><div className="cl-name">Mejor noche</div><div className="cl-amt">{fmtHours(best)}</div></div>
          <div className="cap-line"><div className="cl-name">Noches registradas</div><div className="cl-amt">{slice.length}</div></div>
        </div>
      </div>
      <p className="note">Datos de ejemplo. Cuando conectes Garmin o cargues tu sueño a diario, este gráfico será real.</p>
      <Foot />
    </div>
  );
}

// ---------------- BTC VIEW (histórico real) ----------------
function BtcView({ go }) {
  const [range, setRange] = useState("1S");
  const [series, setSeries] = useState(null);
  const daysByRange = { "1S": 7, "1M": 30, "3M": 90, "6M": 180 };
  useEffect(() => {
    setSeries(null);
    const days = daysByRange[range];
    fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        const prices = d.prices || [];
        const step = Math.max(1, Math.floor(prices.length / 40));
        const pts = prices.filter((_, i) => i % step === 0).map(([t, v]) => ({
          v,
          label: new Date(t).toLocaleDateString("es-AR", { day: "numeric", month: "short" }),
        }));
        setSeries(pts);
      })
      .catch(() => setSeries([]));
  }, [range]);

  const first = series && series.length ? series[0].v : 0;
  const last = series && series.length ? series[series.length - 1].v : 0;
  const change = first ? ((last - first) / first) * 100 : 0;

  return (
    <div className="shell">
      <DetailHead go={go} title="Bitcoin" sub="Precio en dólares" />
      {series && series.length > 0 && (
        <p className="lead">
          Ahora en <em>US${Math.round(last).toLocaleString("en-US")}</em>.{" "}
          <span className={change >= 0 ? "brief-ok" : "brief-over"}>
            {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}% en {range === "1S" ? "la semana" : range === "1M" ? "el mes" : range === "3M" ? "3 meses" : "6 meses"}
          </span>
        </p>
      )}
      <RangeTabs value={range} onChange={setRange} options={["1S", "1M", "3M", "6M"]} />
      {!series ? (
        <div className="chart-empty">Cargando histórico…</div>
      ) : series.length === 0 ? (
        <div className="chart-empty">No se pudo cargar el histórico.</div>
      ) : (
        <LineChart data={series} up={change >= 0} format={(v) => `US$${Math.round(v)}`} />
      )}
      <Foot />
    </div>
  );
}

// ---------------- BIRTHDAYS VIEW (próximos, ordenados) ----------------
function BirthdaysView({ go }) {
  const [state, setState] = useState({ loading: true, list: [] });

  useEffect(() => {
    fetch("/api/calendar?days=400")
      .then((r) => r.json())
      .then((d) => {
        if (d.error || !d.events) { setState({ loading: false, list: [] }); return; }
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const list = d.events
          .filter((e) => /cumple|birthday/i.test(e.title))
          .map((e) => {
            const dateObj = new Date(e.start);
            const days = Math.round((dateObj - now) / 86400000);
            return { name: cleanBirthdayName(e.title), dateObj, days };
          })
          .sort((a, b) => a.days - b.days);
        setState({ loading: false, list });
      })
      .catch(() => setState({ loading: false, list: [] }));
  }, []);

  return (
    <div className="shell">
      <DetailHead go={go} title="Cumpleaños" sub="Desde tu Google Calendar, ordenados por cercanía" />
      {state.loading ? (
        <p className="lead">Cargando cumpleaños…</p>
      ) : state.list.length === 0 ? (
        <p className="lead">No encontramos cumpleaños en tu calendario. Se detectan eventos cuyo título contiene "cumple" o "birthday".</p>
      ) : (
        <div className="rows">
          {state.list.map((b, i) => (
            <div className="r bday-row" key={i}>
              <div className="r-main">
                {b.name}
                <div className="r-sub">{b.dateObj.getDate()} de {MONTHS[b.dateObj.getMonth()]}</div>
              </div>
              <span className={`r-val ${b.days <= 7 ? "warn" : ""}`}>
                {b.days === 0 ? "¡hoy!" : b.days === 1 ? "mañana" : `en ${b.days} días`}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="note">Se leen de tu calendario principal. Para agregar o editar un cumpleaños, hacelo directamente en Google Calendar con "cumple" o "birthday" en el título.</p>
      <Foot />
    </div>
  );
}

// helpers de estas vistas
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const WEATHER_CODE = {
  0: ["", "despejado"], 1: ["", "mayormente despejado"], 2: ["", "parcialmente nublado"], 3: ["", "nublado"],
  45: ["", "niebla"], 48: ["", "niebla"], 51: ["", "llovizna"], 53: ["", "llovizna"], 55: ["", "llovizna"],
  61: ["", "lluvia"], 63: ["", "lluvia"], 65: ["", "lluvia fuerte"], 71: ["", "nieve"], 73: ["", "nieve"], 75: ["", "nieve fuerte"],
  80: ["", "chaparrones"], 81: ["", "chaparrones"], 82: ["", "chaparrones fuertes"], 95: ["", "tormenta"], 96: ["", "tormenta"], 99: ["", "tormenta"],
};
const weatherOfCode = (code) => WEATHER_CODE[code] || ["", "—"];
const fmtHours = (h) => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh}:${String(mm).padStart(2, "0")} h`;
};
// Serie de sueño de ejemplo (180 días), con variación realista alrededor de 7h
function genSleepSeed() {
  const out = [];
  const today = new Date();
  for (let i = 179; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const base = 7 + Math.sin(i / 9) * 0.6 + (Math.random() - 0.5) * 0.8;
    out.push({ date: d.toISOString().slice(0, 10), h: Math.max(4.5, Math.min(9, base)) });
  }
  return out;
}

// ---------------- Shared ----------------
function DetailHead({ go, title, sub }) {
  return (
    <div className="detail-head">
      <button className="back" onClick={() => go("home")}>←</button>
      <div><div className="detail-title">{title}</div><div className="detail-sub">{sub}</div></div>
    </div>
  );
}
function Row({ main, sub, val, cls }) {
  return (
    <div className="r">
      <div className="r-main">{main}{sub && <div className="r-sub">{sub}</div>}</div>
      {val && <span className={`r-val ${cls || ""}`}>{val}</span>}
    </div>
  );
}
function Mi({ num, unit, lbl }) {
  return (
    <div className="mi">
      <div className="mi-num">{num}<small>{unit}</small></div>
      <div className="mi-lbl">{lbl}</div>
    </div>
  );
}
function Foot() { return <footer><div className="f-mark">Northstar</div></footer>; }

// ================================================================
// HOOKS
// ================================================================
function useNow() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useWeather() {
  const [w, setW] = useState(null);
  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`)
      .then((r) => r.json())
      .then((d) => {
        const code = d.current?.weather_code ?? 0;
        setW({
          temp: Math.round(d.current?.temperature_2m ?? 0),
          max: Math.round(d.daily?.temperature_2m_max?.[0] ?? 0),
          min: Math.round(d.daily?.temperature_2m_min?.[0] ?? 0),
          desc: WEATHER_DESC[code] || "—",
        });
      })
      .catch(() => setW(null));
  }, []);
  return w;
}

// Agenda real — llama a nuestra propia API route (/api/calendar), que en el
// servidor lee la URL secreta de Google Calendar y devuelve los eventos
// de los próximos 7 días. Nunca vemos la URL secreta desde el navegador.
function useCalendarEvents() {
  const [state, setState] = useState({ loading: true, events: [], error: null });
  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setState({ loading: false, events: [], error: d.error });
        } else {
          setState({ loading: false, events: d.events || [], error: null });
        }
      })
      .catch((err) => setState({ loading: false, events: [], error: String(err) }));
  }, []);
  return state;
}

// BTC + dirección (sube/baja vs 24h) + dólar CCL/MEP
function useMarket() {
  const [m, setM] = useState({ btc: null, pct: null, dir: null, dolar: null, mep: null });
  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true")
      .then((r) => r.json())
      .then((d) => {
        const price = Math.round(d.bitcoin?.usd ?? 0);
        const pct = d.bitcoin?.usd_24h_change ?? 0;
        setM((prev) => ({ ...prev, btc: price, pct, dir: pct >= 0 ? "up" : "down" }));
      })
      .catch(() => {});
    fetch("https://api.dolarapi.com/v1/dolares/contadoconliqui")
      .then((r) => r.json())
      .then((d) => setM((prev) => ({ ...prev, dolar: Math.round(d.venta ?? 0).toLocaleString("es-AR") })))
      .catch(() => {});
    fetch("https://api.dolarapi.com/v1/dolares/bolsa")
      .then((r) => r.json())
      .then((d) => setM((prev) => ({ ...prev, mep: Math.round(d.venta ?? 0).toLocaleString("es-AR") })))
      .catch(() => {});
  }, []);
  return m;
}

// Cumpleaños desde Google Calendar: pide una ventana amplia (400 días) para
// poder encontrar el próximo cumpleaños aunque falten meses, y se queda con
// los eventos cuyo título contiene "cumple" o "birthday".
function useBirthdayEvent() {
  const [state, setState] = useState({ loading: true, today: null, next: null });
  useEffect(() => {
    fetch("/api/calendar?days=400")
      .then((r) => r.json())
      .then((d) => {
        if (d.error || !d.events) { setState({ loading: false, today: null, next: null }); return; }
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const bdays = d.events
          .filter((e) => /cumple|birthday/i.test(e.title))
          .map((e) => ({ ...e, dateObj: new Date(e.start) }))
          .sort((a, b) => a.dateObj - b.dateObj);

        const today = bdays.find((b) => {
          const bd = new Date(b.dateObj); bd.setHours(0, 0, 0, 0);
          return bd.getTime() === now.getTime();
        });
        // "Próximo cumpleaños" solo cuenta si cae dentro de los próximos 30 días.
        // Más lejos que eso, mostramos "—" en vez de una fecha lejana sin sentido.
        const next = bdays.find((b) => {
          if (b.dateObj <= now) return false;
          const days = Math.round((b.dateObj - now) / 86400000);
          return days <= 30;
        });
        setState({ loading: false, today: today || null, next: next || null });
      })
      .catch(() => setState({ loading: false, today: null, next: null }));
  }, []);
  return state;
}

// Limpia el título del evento para mostrar solo el nombre
// (quita palabras como "cumple", "cumpleaños", "birthday", signos sueltos)
function cleanBirthdayName(title) {
  return title
    .replace(/cumple(años)?/gi, "")
    .replace(/birthday/gi, "")
    .replace(/^de\s+/i, "")
    .replace(/[:\-–—]+/g, " ")
    .trim() || title;
}

// Voz del día: determinística por fecha (misma todo el día, cambia mañana)
function useDailyVoice() {
  const [voice, setVoice] = useState(null);
  useEffect(() => {
    const now = new Date();
    // día del año (1..366) como índice estable
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    setVoice(VOICES[dayOfYear % VOICES.length]);
  }, []);
  return voice;
}

/*
  Briefing inteligente (por reglas, sin IA).
  Lee los deadlines guardados de Jeep y Yukon y detecta lo urgente (≤7 días).
  Cuando conectes tu API key de Claude en Vercel, podés reemplazar la lógica
  interna por una llamada al modelo sin tocar el resto del componente.
*/
function useBriefingAlerts(weather) {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    const out = [];
    const scan = (key, label) => {
      try {
        const raw = localStorage.getItem("northstar:" + key);
        if (!raw) return;
        const blocks = JSON.parse(raw);
        blocks.forEach((b) =>
          (b.rows || []).forEach((r) => {
            if (!r.due) return;
            const info = deadlineInfo(r.due);
            if (info && info.days <= 7) {
              out.push({ main: r.main, text: info.text, level: info.level, from: label, days: info.days });
            }
          })
        );
      } catch {}
    };
    scan("car", "Jeep");
    scan("dog", "Yukon");
    out.sort((a, b) => a.days - b.days);
    setAlerts(out.slice(0, 3));
  }, [weather]);
  return alerts;
}

function greetingByHour(h) {
  if (h < 6) return "Buenas noches, Juan.";
  if (h < 13) return "Buen día, Juan.";
  if (h < 20) return "Buenas tardes, Juan.";
  return "Buenas noches, Juan.";
}

/*
  Briefing con IA (Claude). Junta clima + agenda de hoy + cumpleaños + alertas
  urgentes de Jeep/Yukon, y le pide al backend (/api/briefing) que Claude lo
  sintetice en una frase natural. Si algo falla (sin API key configurada,
  error de red, etc.) se degrada con silencio: el saludo simplemente no
  muestra un párrafo debajo, en vez de mostrar un error feo.
*/
function useBriefingText({ weather, events, birthday, alerts, hour, ready }) {
  const [text, setText] = useState(null);
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    fetch("/api/briefing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weather, events, birthday, alerts, hour }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setText(d.text || null);
      })
      .catch(() => { if (!cancelled) setText(null); });
    return () => { cancelled = true; };
    // Se recalcula si cambian los datos de entrada (clima recién cargado, etc.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, JSON.stringify(events), weather?.temp, birthday, JSON.stringify(alerts)]);
  return text;
}

// utils
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
let _id = 0;
const uid = () => `i${Date.now()}_${_id++}`;
// fecha ISO (YYYY-MM-DD) a X días de hoy — para seedear deadlines de ejemplo
const isoIn = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// ---------------- Persistencia (localStorage) ----------------
// Igual que useState, pero guarda y restaura solo bajo una clave.
function useStored(key, initial) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem("northstar:" + key);
      return raw != null ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("northstar:" + key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
}

// ================================================================
// ESTILOS — blanco pleno, negro, un solo azul
// ================================================================
const CSS = `
:root{
  --bg:#FFFFFF;
  --ink:#000000;
  --ink-2:#3A3A3A;
  --ink-3:#767676;
  --ink-4:#AEAEAE;
  --line:#ECECEC;
  --line-2:#E0E0E0;
  --accent:#0A84FF;
  --accent-soft:#EAF3FF;
  --up:#1DB954;
  --down:#FF3B30;
  --radius:16px;
  --ease:cubic-bezier(.22,.61,.36,1);
  --sans:"Helvetica Neue","HelveticaNeue",Helvetica,Arial,sans-serif;
}
.ns *{box-sizing:border-box;margin:0;padding:0}
.ns{background:var(--bg);color:var(--ink);font-family:var(--sans);
  line-height:1.5;-webkit-font-smoothing:antialiased;min-height:100vh;font-weight:400}
.ns ::selection{background:var(--accent-soft)}
.shell{max-width:720px;margin:0 auto;padding:0 28px}

.topbar{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.85);
  backdrop-filter:saturate(180%) blur(20px);-webkit-backdrop-filter:saturate(180%) blur(20px);
  border-bottom:1px solid transparent;transition:border-color .3s var(--ease)}
.topbar.scrolled{border-bottom-color:var(--line)}
.topbar-inner{max-width:720px;margin:0 auto;padding:16px 28px;display:flex;align-items:center;justify-content:space-between}
.mark{font-size:15px;cursor:pointer;letter-spacing:-.01em}
.burger{background:none;border:none;cursor:pointer;padding:8px;display:flex;flex-direction:column;gap:4px;width:34px}
.burger span{display:block;height:1.5px;background:var(--ink);border-radius:2px;transition:.25s var(--ease)}

.menu-scrim{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.08)}
.menu{position:fixed;top:0;right:0;bottom:0;z-index:70;width:290px;max-width:82vw;
  background:var(--bg);border-left:1px solid var(--line);padding:24px 20px;
  transform:translateX(100%);transition:transform .3s var(--ease);display:flex;flex-direction:column;gap:2px}
.menu.open{transform:none;box-shadow:-20px 0 60px -20px rgba(0,0,0,.15)}
.menu-head{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-4);padding:6px 12px 14px}
.menu-item{background:none;border:none;text-align:left;padding:13px 12px;border-radius:10px;cursor:pointer;
  font-family:inherit;display:flex;flex-direction:column;gap:2px;transition:.2s var(--ease)}
.menu-item:hover{background:var(--accent-soft)}
.menu-item .mi-name{font-size:16px;color:var(--ink);letter-spacing:-.01em}
.menu-item .mi-hint{font-size:12.5px;color:var(--ink-3)}

.hero{padding:12vh 0 8vh}
.hero-top{display:flex;gap:40px;align-items:flex-start}
.hero-left{flex:1;min-width:0;max-width:600px}
.eyebrow{font-size:13px;color:var(--ink-3);margin-bottom:20px}
.briefing{font-size:clamp(26px,4.4vw,36px);line-height:1.26;letter-spacing:-.02em;color:var(--ink);max-width:18ch;font-weight:400}
.briefing .soft{color:var(--ink-3)}
.briefing em{font-style:normal;color:var(--accent)}
.briefing-lines{margin-top:14px;font-size:clamp(16px,2.2vw,18px);line-height:1.55;color:var(--ink-2);max-width:46ch}
.briefing-lines b{color:var(--ink);font-weight:500}
.brief-warn{color:#C77800}
.brief-over{color:var(--down)}

/* voz del día */
.voice{flex:none;width:246px;border-left:1px solid var(--line);padding:2px 0 2px 22px;margin-top:34px}
.voice-label{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-4);margin-bottom:12px}
.voice-idea{font-size:16px;line-height:1.5;color:var(--ink);letter-spacing:-.01em}
.voice-by{margin-top:14px;display:flex;flex-direction:column;gap:1px}
.voice-name{font-size:13.5px;color:var(--ink-2)}
.voice-field{font-size:12px;color:var(--ink-4)}

.chips{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:26px;max-width:400px}
.chip{border:1px solid var(--line);border-radius:12px;padding:12px 15px;
  display:flex;flex-direction:column;gap:2px;transition:.2s var(--ease)}
.chip-k{font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-3);display:flex;align-items:center;gap:6px}
.chip-v{font-size:19px;letter-spacing:-.02em;color:var(--ink)}
.chip-x{font-size:12px;color:var(--ink-3)}
.chip-x.up{color:var(--up)}
.chip-x.down{color:var(--down)}
.chip-on{border-color:var(--accent)}
.chip-on .chip-v{color:var(--accent)}
.chip-edit{font-family:inherit;font-size:19px;letter-spacing:-.02em;color:var(--ink);border:none;outline:none;background:none;border-bottom:1px solid var(--accent);width:100%;padding:0}
.chip-tap{cursor:pointer}
.chip-tap:hover{border-color:var(--line-2)}
.chip-edit-ico{font-size:11px;color:var(--ink-4);cursor:pointer;margin-left:2px}
.chip-edit-ico:hover{color:var(--accent)}

/* range tabs */
.range-tabs{display:flex;gap:6px;margin:24px 0 20px}
.range-tabs button{background:none;border:1px solid var(--line);color:var(--ink-3);padding:6px 15px;border-radius:100px;font-size:13px;font-family:inherit;cursor:pointer;transition:.2s var(--ease)}
.range-tabs button:hover{border-color:var(--line-2)}
.range-tabs button.on{background:var(--ink);border-color:var(--ink);color:#fff}

/* line chart */
.chart{margin:8px 0 4px}
.chart-svg{width:100%;height:180px;display:block;overflow:visible}
.chart-ends{display:flex;justify-content:space-between;font-size:12px;color:var(--ink-4);margin-top:10px}
.chart-empty{padding:48px 0;text-align:center;color:var(--ink-4);font-size:14px}
.brief-ok{color:var(--up)}

/* weather 7 days */
.wx-list{display:flex;flex-direction:column}
.wx-day{display:grid;grid-template-columns:52px 1fr 34px 1fr 34px;align-items:center;gap:14px;padding:15px 0;border-bottom:1px solid var(--line);font-size:15px}
.wx-day:last-child{border-bottom:none}
.wx-name{color:var(--ink);text-transform:capitalize}
.wx-desc{color:var(--ink-3);font-size:13.5px}
.wx-min{color:var(--ink-3);text-align:right;font-variant-numeric:tabular-nums}
.wx-max{color:var(--ink);text-align:right;font-variant-numeric:tabular-nums}
.wx-track{position:relative;height:4px;border-radius:2px;background:var(--line)}
.wx-fill{position:absolute;top:0;bottom:0;border-radius:2px;background:linear-gradient(90deg,var(--accent),#7DB9FF)}

/* birthdays */
.bday-row{align-items:center}
.bday-add{display:flex;gap:8px;flex-wrap:wrap}
.bday-add input{flex:1;min-width:120px;font-family:inherit;font-size:14px;border:1px solid var(--line);border-radius:10px;padding:9px 12px;color:var(--ink);background:var(--bg);outline:none}
.bday-add input:focus{border-color:var(--accent)}
.bday-add button{background:var(--accent);color:#fff;border:none;border-radius:10px;padding:9px 18px;font-size:14px;font-family:inherit;cursor:pointer}

/* nota honesta */
.note{font-size:13px;color:var(--ink-4);margin-top:28px;padding-top:20px;border-top:1px solid var(--line)}

.live{width:7px;height:7px;border-radius:50%;background:var(--ink-4);display:inline-block;position:relative}
.live.up{background:var(--up)}
.live.down{background:var(--down)}
.live::after{content:"";position:absolute;inset:0;border-radius:50%;background:inherit;animation:ping 1.8s var(--ease) infinite}
@keyframes ping{0%{transform:scale(1);opacity:.7}70%{transform:scale(2.6);opacity:0}100%{opacity:0}}

.clocks{margin-top:24px;padding-top:20px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:9px}
.clock-line{display:flex;align-items:baseline;gap:10px;font-size:14px}
.clock-time{font-variant-numeric:tabular-nums;color:var(--ink);letter-spacing:-.01em;min-width:44px}
.clock-place{color:var(--ink-3);cursor:pointer;transition:color .2s}
.clock-place:hover{color:var(--accent)}
.clock-country{color:var(--ink-4)}
.clock-select{font-family:inherit;font-size:13px;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:4px 8px;cursor:pointer;width:100%}

section{padding:56px 0;border-top:1px solid var(--line)}
.sec-label{font-size:12px;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-4);margin-bottom:22px}
.split{display:grid;grid-template-columns:1fr 1fr;gap:44px}

/* agenda real (Google Calendar) */
.agenda-empty{color:var(--ink-4);font-size:14.5px;padding:8px 0}
.agenda-real{display:flex;flex-direction:column;gap:4px}
.agenda-group{margin-bottom:4px}
.agenda-day{font-size:12px;color:var(--accent);letter-spacing:.02em;padding:14px 0 4px;text-transform:capitalize}
.agenda-group:first-child .agenda-day{padding-top:0}
.moment{display:flex;align-items:baseline;gap:14px;padding:9px 0;border-bottom:1px solid var(--line)}
.moment:last-child{border-bottom:none}
.moment .time{flex:none;width:78px;font-size:13px;color:var(--ink-3);font-variant-numeric:tabular-nums}
.moment .what{font-size:15px;color:var(--ink);letter-spacing:-.01em}
.moment .where{font-size:12.5px;color:var(--ink-3);margin-top:1px}
.split-col{min-width:0}

.list{display:flex;flex-direction:column}
.row{display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1px solid var(--line);
  background:var(--bg);transition:background .15s}
.row:last-child{border-bottom:none}
.row.over{background:var(--accent-soft)}
.row .grip{display:grid;grid-template-columns:repeat(2,2px);gap:2px;flex:none;cursor:grab;opacity:0;transition:.2s}
.row:hover .grip{opacity:.5}
.row .grip span{width:2px;height:2px;border-radius:50%;background:var(--ink-3)}
.row .box{width:19px;height:19px;border-radius:50%;border:1.5px solid var(--line-2);flex:none;
  display:grid;place-items:center;cursor:pointer;background:none;transition:.2s var(--ease)}
.row .box svg{width:11px;height:11px;color:#fff;opacity:0}
.row.done .box{background:var(--accent);border-color:var(--accent)}
.row.done .box svg{opacity:1}
.row-body{flex:1;min-width:0;display:flex;flex-direction:column}
.row-txt{font-size:15.5px;color:var(--ink);cursor:text;letter-spacing:-.01em}
.row.done .row-txt{color:var(--ink-4);text-decoration:line-through;text-decoration-color:var(--line-2)}
.row-meta{font-size:12.5px;color:var(--ink-3);margin-top:1px}
.row-edit{font-size:15.5px;font-family:inherit;border:none;outline:none;background:none;color:var(--ink);
  border-bottom:1px solid var(--accent);padding:1px 0}
.row-del{background:none;border:none;color:var(--ink-4);font-size:18px;cursor:pointer;opacity:0;
  transition:.2s;padding:0 2px;line-height:1;flex:none}
.row:hover .row-del{opacity:1}
.row-del:hover{color:var(--down)}
.add{margin-top:12px}
.add input{width:100%;background:none;border:none;outline:none;font-size:15.5px;font-family:inherit;
  color:var(--ink);padding:8px 0;border-bottom:1px solid transparent;transition:.2s}
.add input:focus{border-bottom-color:var(--line-2)}
.add input::placeholder{color:var(--ink-4)}

.detail-head{display:flex;align-items:center;gap:16px;padding:12vh 0 40px}
.back{background:none;border:1px solid var(--line);color:var(--ink-2);width:40px;height:40px;
  border-radius:12px;cursor:pointer;font-size:17px;display:grid;place-items:center;transition:.2s var(--ease);flex:none}
.back:hover{border-color:var(--accent);color:var(--accent)}
.detail-title{font-size:clamp(26px,4vw,34px);letter-spacing:-.025em}
.detail-sub{font-size:14px;color:var(--ink-3);margin-top:3px}

.lead{font-size:clamp(18px,2.4vw,21px);line-height:1.5;color:var(--ink-2);max-width:42ch;margin-bottom:8px;letter-spacing:-.01em}
.lead em{font-style:normal;color:var(--accent)}

.block{padding:40px 0;border-top:1px solid var(--line)}
.block:first-of-type{border-top:none;padding-top:8px}
.block-label{font-size:12px;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-4);margin-bottom:20px}

/* editable module */
.eb-head{display:flex;align-items:center;gap:8px;margin-bottom:16px}
.eb-head .block-label{margin-bottom:0}
.eb-delblock{background:none;border:none;color:var(--ink-4);font-size:16px;cursor:pointer;opacity:0;transition:.2s;line-height:1}
.eb:hover .eb-delblock{opacity:.6}
.eb-delblock:hover{color:var(--down);opacity:1}
.erow{display:flex;align-items:flex-start;gap:11px;padding:12px 0;border-bottom:1px solid var(--line);background:var(--bg);transition:background .15s}
.erow:last-child{border-bottom:none}
.erow.over{background:var(--accent-soft)}
.erow .grip{display:grid;grid-template-columns:repeat(2,2px);gap:2px;flex:none;cursor:grab;opacity:0;transition:.2s;margin-top:5px}
.erow:hover .grip{opacity:.5}
.erow .grip span{width:2px;height:2px;border-radius:50%;background:var(--ink-3)}
.erow-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.erow-right{flex:none;display:flex;align-items:flex-start}
.erow-del{background:none;border:none;color:var(--ink-4);font-size:16px;cursor:pointer;opacity:0;transition:.2s;padding:0 2px;line-height:1;flex:none;margin-top:2px}
.erow:hover .erow-del{opacity:1}
.erow-del:hover{color:var(--down)}
.erow-val{color:var(--ink-2);font-variant-numeric:tabular-nums;text-align:right;font-size:14.5px;cursor:pointer;white-space:nowrap}
.erow-val.ok{color:var(--accent)}
.erow-val.warn{color:#C77800}
.erow-val.over{color:var(--down)}
.erow-val-add{color:var(--ink-4);font-size:13px}
.eb-addrow{background:none;border:none;color:var(--ink-3);font-size:13.5px;font-family:inherit;cursor:pointer;padding:12px 0 0;transition:.2s}
.eb-addrow:hover{color:var(--accent)}
.eb-addblock{background:none;border:1px dashed var(--line-2);color:var(--ink-3);font-size:14px;font-family:inherit;cursor:pointer;padding:14px;border-radius:12px;width:100%;margin-top:24px;transition:.2s}
.eb-addblock:hover{border-color:var(--accent);color:var(--accent)}

/* inline edit text */
.et-view{cursor:text}
.et-view.empty{color:var(--ink-4)}
.erow-main.et-view{font-size:15px;color:var(--ink)}
.erow-sub.et-view{font-size:13px;color:var(--ink-3)}
.erow-sub.et-view.empty{font-size:13px}
.et-input{font-family:inherit;border:none;outline:none;background:none;color:var(--ink);border-bottom:1px solid var(--accent);padding:1px 0;width:100%}
.et-input.erow-main{font-size:15px}
.et-input.erow-sub{font-size:13px;color:var(--ink-3)}
.et-input.block-label{font-size:12px;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-3);width:auto;min-width:120px}

/* deadline editor */
.dl-edit{display:flex;flex-direction:column;gap:6px;align-items:flex-end}
.dl-date,.dl-val{font-family:inherit;font-size:13px;border:1px solid var(--line);border-radius:8px;padding:5px 8px;color:var(--ink);background:var(--bg);outline:none}
.dl-date:focus,.dl-val:focus{border-color:var(--accent)}
.dl-done{background:var(--accent);color:#fff;border:none;border-radius:8px;padding:5px 12px;font-size:12px;font-family:inherit;cursor:pointer}

.rows{display:flex;flex-direction:column}
.r{display:flex;align-items:baseline;gap:16px;padding:13px 0;border-bottom:1px solid var(--line);font-size:15px}
.r:last-child{border-bottom:none}
.r .r-main{flex:1}
.r .r-sub{font-size:13px;color:var(--ink-3);margin-top:1px}
.r .r-val{color:var(--ink-2);font-variant-numeric:tabular-nums;text-align:right;font-size:14.5px}
.r .r-val.ok{color:var(--accent)}
.r .r-val.warn{color:var(--down)}

.trips{display:flex;flex-direction:column;gap:1px;margin-bottom:8px}
.trip{display:flex;align-items:center;gap:18px;padding:16px 4px;cursor:pointer;border-bottom:1px solid var(--line);transition:.25s var(--ease)}
.trip:hover,.trip.active{padding-left:10px}
.trip .t-info{flex:1}
.trip .t-nm{font-size:16px;letter-spacing:-.02em}
.trip .t-wh{font-size:13px;color:var(--ink-3);margin-top:1px}
.trip .t-st{font-size:12px;color:var(--ink-4)}
.trip.active .t-st{color:var(--accent)}

.metrics-inline{display:flex;gap:36px;flex-wrap:wrap;margin-bottom:8px}
.mi{display:flex;flex-direction:column}
.mi .mi-num{font-size:29px;letter-spacing:-.03em}
.mi .mi-num small{font-size:15px;color:var(--ink-3)}
.mi .mi-lbl{font-size:13px;color:var(--ink-3);margin-top:2px}
.thin-bar{height:3px;border-radius:2px;background:var(--line-2);overflow:hidden;margin-top:14px;max-width:280px}
.thin-bar span{display:block;height:100%;background:var(--accent);border-radius:2px}

.pack{display:flex;flex-direction:column}
.pk{display:flex;align-items:center;gap:13px;padding:9px 0;cursor:pointer;font-size:15px;color:var(--ink)}
.pk .box2{width:17px;height:17px;border-radius:5px;border:1.5px solid var(--line-2);flex:none;display:grid;place-items:center;transition:.2s}
.pk .box2 svg{width:10px;height:10px;color:#fff;opacity:0}
.pk.done .box2{background:var(--accent);border-color:var(--accent)}
.pk.done .box2 svg{opacity:1}
.pk.done span{color:var(--ink-4);text-decoration:line-through;text-decoration-color:var(--line-2)}

.timeline{position:relative;padding-left:22px}
.timeline::before{content:"";position:absolute;left:4px;top:6px;bottom:6px;width:1.5px;background:var(--line-2)}
.tl{position:relative;padding:0 0 22px}
.tl:last-child{padding-bottom:0}
.tl::before{content:"";position:absolute;left:-22px;top:5px;width:9px;height:9px;border-radius:50%;background:var(--accent);border:2px solid var(--bg)}
.tl .tl-d{font-size:12.5px;color:var(--accent)}
.tl .tl-w{font-size:15.5px;color:var(--ink);margin-top:3px}
.tl .tl-n{font-size:13px;color:var(--ink-3);margin-top:1px}

.cap-hero{font-size:clamp(38px,6.5vw,54px);letter-spacing:-.04em;line-height:1;display:flex;align-items:baseline;gap:10px;margin-bottom:6px}
.cap-hero small{font-size:18px;color:var(--ink-3)}
.cap-delta{font-size:15px;margin-bottom:4px}
.cap-delta.up{color:var(--up)}
.cap-split{display:flex;flex-direction:column}
.cap-line{display:flex;align-items:baseline;gap:16px;padding:16px 0;border-bottom:1px solid var(--line)}
.cap-line:last-child{border-bottom:none}
.cap-line .cl-name{flex:1;font-size:15.5px}
.cap-line .cl-sub{font-size:13px;color:var(--ink-3);margin-top:1px}
.cap-line .cl-amt{font-variant-numeric:tabular-nums;text-align:right;font-size:16px}
.cap-line .cl-chg{font-size:12.5px;color:var(--ink-3);margin-top:1px;text-align:right}
.cap-line .cl-chg.up{color:var(--up)}
.cap-line .cl-chg.down{color:var(--down)}

.res-add{margin-bottom:8px;padding:15px 18px;border:1px solid var(--line);border-radius:14px}
.res-add input{width:100%;background:none;border:none;outline:none;font-size:15px;font-family:inherit;color:var(--ink)}
.res-add input::placeholder{color:var(--ink-4)}
.res-filter{display:flex;gap:6px;margin:20px 0 8px;flex-wrap:wrap}
.res-filter button{background:none;border:1px solid var(--line);color:var(--ink-3);padding:6px 13px;border-radius:100px;font-size:13px;font-family:inherit;cursor:pointer;transition:.2s var(--ease)}
.res-filter button:hover{border-color:var(--line-2)}
.res-filter button.on{background:var(--ink);border-color:var(--ink);color:#fff}
.res-list{display:flex;flex-direction:column}
.res-item{display:flex;align-items:flex-start;gap:15px;padding:16px 0;border-bottom:1px solid var(--line)}
.res-item:last-child{border-bottom:none}
.res-item .box{width:19px;height:19px;border-radius:50%;border:1.5px solid var(--line-2);flex:none;display:grid;place-items:center;cursor:pointer;background:none;margin-top:2px;transition:.2s}
.res-item .box svg{width:11px;height:11px;color:#fff;opacity:0}
.res-item.read .box{background:var(--accent);border-color:var(--accent)}
.res-item.read .box svg{opacity:1}
.res-item .r-content{flex:1;min-width:0}
.res-item .r-kind{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);margin-bottom:3px}
.res-item .r-title{font-size:15.5px;color:var(--ink);line-height:1.35;letter-spacing:-.01em}
.res-item .r-src{font-size:13px;color:var(--ink-3);margin-top:3px}
.res-item.read .r-title,.res-item.read .r-kind{color:var(--ink-4)}
.res-item .r-open{color:var(--ink-4);flex:none;text-decoration:none;font-size:15px;padding:2px;transition:.2s}
.res-item:hover .r-open{color:var(--ink-2)}
.res-empty{padding:40px 0;text-align:center;color:var(--ink-4);font-size:15px}

footer{padding:72px 0 56px;text-align:center;border-top:1px solid var(--line)}
footer .f-mark{font-size:13px;color:var(--ink-4)}

@media(max-width:760px){
  .hero-top{flex-direction:column;gap:0}
  .hero-left{max-width:none}
  .voice{width:100%;border-left:none;border-top:1px solid var(--line);padding:22px 0 0;margin-top:28px}
}
@media(max-width:640px){.split{grid-template-columns:1fr;gap:34px}}
@media(max-width:520px){.metrics-inline{gap:24px}.chips{max-width:none}}
@media(prefers-reduced-motion:reduce){.ns *{animation:none!important;transition:none!important}}
.ns :focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}
`;
