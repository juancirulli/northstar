// app/api/calendar/route.js
// Lee tu calendario iCal secreto (en el servidor) y devuelve los eventos de la semana.

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.CALENDAR_ICAL_URL;

  if (!url) {
    return Response.json({ error: "no_config", events: [] }, { status: 200 });
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return Response.json({ error: "fetch_failed", status: res.status, events: [] }, { status: 200 });
    }
    const ics = await res.text();
    const events = parseICS(ics);

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const upcoming = events
      .filter((e) => e.start && e.start >= start && e.start < end)
      .sort((a, b) => a.start - b.start)
      .map((e) => ({
        title: e.title || "(sin título)",
        location: e.location || "",
        start: e.start.toISOString(),
        allDay: e.allDay || false,
      }));

    return Response.json({ events: upcoming });
  } catch (err) {
    return Response.json({ error: "exception", message: String(err), events: [] }, { status: 200 });
  }
}

function parseICS(text) {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);
  const events = [];
  let cur = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") cur = {};
    else if (line === "END:VEVENT") { if (cur) events.push(cur); cur = null; }
    else if (cur) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const rawKey = line.slice(0, idx);
      const value = line.slice(idx + 1);
      const key = rawKey.split(";")[0];
      if (key === "SUMMARY") cur.title = unescapeICS(value);
      else if (key === "LOCATION") cur.location = unescapeICS(value);
      else if (key === "DTSTART") {
        const p = parseICSDate(rawKey, value);
        cur.start = p.date; cur.allDay = p.allDay;
      }
    }
  }
  return events;
}

function parseICSDate(rawKey, value) {
  if (/VALUE=DATE/.test(rawKey) || /^\d{8}$/.test(value)) {
    return { date: new Date(+value.slice(0,4), +value.slice(4,6)-1, +value.slice(6,8)), allDay: true };
  }
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (m) {
    const [, y, mo, d, h, mi, s, z] = m;
    if (z === "Z") return { date: new Date(Date.UTC(+y, +mo-1, +d, +h, +mi, +s)), allDay: false };
    return { date: new Date(+y, +mo-1, +d, +h, +mi, +s), allDay: false };
  }
  return { date: null, allDay: false };
}

function unescapeICS(s) {
  return s.replace(/\\n/gi, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}
