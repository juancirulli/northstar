// ============================================================
// API ROUTE — Briefing inteligente (Claude / Anthropic)
// ============================================================
// Corre en el SERVIDOR de Vercel, no en el navegador.
// Recibe un resumen compacto de datos YA REALES (clima, agenda de hoy,
// próximo cumpleaños, alertas de Jeep/Yukon) desde el frontend, y le pide
// a Claude que los sintetice en una frase natural para el saludo de Northstar.
//
// La API key vive en la variable de entorno ANTHROPIC_API_KEY (secreto).
// NUNCA se expone al navegador.

export const dynamic = "force-dynamic";

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "no_config", message: "Falta configurar ANTHROPIC_API_KEY en Vercel." },
      { status: 200 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 200 });
  }

  const { weather, events, birthday, alerts, hour } = body || {};

  // Armamos el contexto en texto plano y simple para el modelo.
  const lines = [];
  if (weather) lines.push(`Clima: ${weather.desc}, ${weather.temp}° (máx ${weather.max}° / mín ${weather.min}°).`);
  if (Array.isArray(events) && events.length > 0) {
    const items = events
      .slice(0, 6)
      .map((e) => `- ${e.allDay ? "Todo el día" : new Date(e.start).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}: ${e.title}${e.location ? ` (${e.location})` : ""}`)
      .join("\n");
    lines.push(`Agenda de hoy:\n${items}`);
  } else {
    lines.push("Agenda de hoy: sin eventos.");
  }
  if (birthday) lines.push(`Cumpleaños: hoy es el cumpleaños de ${birthday}.`);
  if (Array.isArray(alerts) && alerts.length > 0) {
    lines.push(`Pendientes urgentes: ${alerts.map((a) => `${a.main} ${a.text}`).join("; ")}.`);
  }

  const context = lines.join("\n\n");

  const systemPrompt = `Sos la voz de Northstar, el sistema operativo personal de Juan. Tu única tarea es escribir UNA frase breve (máximo 30 palabras), en español rioplatense, cálida pero directa, que sintetice su día a partir de los datos que te paso. No uses comillas, no uses emojis, no saludes (el saludo ya existe aparte). Priorizá lo más urgente o relevante si hay varias cosas. Si no hay nada urgente, transmití calma. Respondé SOLO con la frase, sin explicaciones ni texto adicional.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 120,
        system: systemPrompt,
        messages: [{ role: "user", content: context || "No hay datos disponibles todavía." }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: "api_error", status: res.status, message: errText }, { status: 200 });
    }

    const data = await res.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim();

    return Response.json({ text: text || null });
  } catch (err) {
    return Response.json({ error: "exception", message: String(err) }, { status: 200 });
  }
}
