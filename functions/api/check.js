export async function onRequestPost({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ status: "unknown", message: "La solicitud llegó incompleta." }, 400);
  }

  const username = String(body.username || "").trim().toLowerCase();
  if (!/^[a-z0-9]{3}$/.test(username)) {
    return json({ status: "invalid", message: "Escribe exactamente 3 letras o números." }, 400);
  }

  // Roblox's public signup username validator. Keep this request server-side
  // so the browser does not run into cross-origin restrictions.
  const endpoint = "https://auth.roblox.com/v1/usernames/validate";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "OG-Name-Finder/1.0"
      },
      body: JSON.stringify({
        username,
        birthday: "2000-01-01",
        context: "Signup"
      })
    });

    if (response.status === 429) {
      return json({ status: "rate_limited", message: "Roblox está recibiendo demasiadas consultas. Espera un momento y vuelve a probar." }, 200);
    }

    if (!response.ok) {
      // Return a useful, safe diagnostic instead of marking every result as a generic error.
      const detail = response.status === 403
        ? "Roblox rechazó la consulta (403). Puede ser un bloqueo temporal."
        : response.status === 404
          ? "Roblox no encontró el servicio de validación (404)."
          : `Roblox respondió con el código ${response.status}.`;
      return json({ status: "unknown", message: detail, upstreamStatus: response.status }, 200);
    }

    const data = await response.json();
    if (data.code === 0) return json({ status: "available", message: "Roblox lo considera válido y disponible." });
    if (data.code === 1) return json({ status: "taken", message: "El nombre ya está ocupado." });
    if (data.code === 2) return json({ status: "invalid", message: "Roblox no permite este nombre." });

    return json({ status: "unknown", message: `Roblox devolvió una respuesta no reconocida (${String(data.code)}).` });
  } catch (error) {
    return json({ status: "unknown", message: "Cloudflare no pudo conectar con Roblox. Inténtalo otra vez." }, 200);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
