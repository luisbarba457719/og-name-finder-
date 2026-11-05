export async function onRequestPost({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ status: "unknown", message: "Solicitud no válida" }, 400); }
  const username = String(body.username || "").toLowerCase();
  if (!/^[a-z0-9]{3}$/.test(username)) return json({ status: "invalid", message: "Debe tener exactamente 3 caracteres alfanuméricos" }, 400);

  try {
    const response = await fetch("https://auth.roblox.com/v1/usernames/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        username,
        birthday: "2000-01-01T00:00:00.000Z",
        context: "Signup"
      })
    });

    if (response.status === 429) {
      return json({ status: "rate_limited", message: "Roblox limitó temporalmente las consultas" }, 429);
    }
    if (!response.ok) {
      return json({ status: "unknown", message: `Roblox respondió ${response.status}` }, 502);
    }

    const data = await response.json();
    // Roblox's signup validator: code 0 = valid/available, 1 = taken, 2 = invalid.
    if (data.code === 0) return json({ status: "available", message: "Roblox lo considera válido y disponible" });
    if (data.code === 1) return json({ status: "taken", message: "El nombre ya está ocupado" });
    if (data.code === 2) return json({ status: "invalid", message: "Roblox no permite este nombre" });
    return json({ status: "unknown", message: `Respuesta no concluyente (${String(data.code)})` });
  } catch {
    return json({ status: "unknown", message: "No se pudo contactar con Roblox" }, 502);
  }
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}