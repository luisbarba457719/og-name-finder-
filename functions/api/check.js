export async function onRequestPost({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ status: "unknown", message: "La solicitud llegó incompleta." }, 400);
  }

  const username = String(body.username || "").trim();
  if (!/^[a-zA-Z0-9]{3}$/.test(username)) {
    return json({ status: "invalid", message: "Escribe exactamente 3 letras o números." }, 400);
  }

  // Use Roblox's documented GET variant of the username validation endpoint.
  const endpoint = new URL("https://auth.roblox.com/v1/usernames/validate");
  endpoint.searchParams.set("request.username", username);
  endpoint.searchParams.set("request.birthday", "2000-01-01T00:00:00.000Z");
  endpoint.searchParams.set("request.context", "Signup");

  try {
    const response = await fetch(endpoint.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (response.status === 429) {
      return json({ status: "rate_limited", message: "Roblox limitó temporalmente las consultas. Espera antes de volver a probar." });
    }

    if (response.status === 403) {
      return json({ status: "unknown", message: "Roblox está bloqueando las solicitudes que llegan desde el servidor de Cloudflare (403). No es posible confirmar disponibilidad desde esta conexión.", upstreamStatus: 403 });
    }

    if (!response.ok) {
      return json({ status: "unknown", message: `Roblox respondió con HTTP ${response.status}. No se marcó el nombre como disponible ni ocupado.`, upstreamStatus: response.status });
    }

    const data = await response.json();
    if (data.code === 0) return json({ status: "available", message: "Roblox lo considera disponible." });
    if (data.code === 1) return json({ status: "taken", message: "El nombre ya está ocupado." });
    if (data.code === 2) return json({ status: "invalid", message: "Roblox no permite este nombre." });

    return json({ status: "unknown", message: `Respuesta de Roblox no reconocida (${String(data.code)}).` });
  } catch {
    return json({ status: "unknown", message: "Cloudflare no pudo conectar con Roblox. Inténtalo más tarde." });
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
