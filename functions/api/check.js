export async function onRequestGet() {
  return json({
    ok: true,
    service: "OG NAME FINDER API",
    message: "La función de Cloudflare está activa."
  });
}

export async function onRequestPost({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ status: "unknown", message: "Solicitud no válida" }, 400);
  }

  const username = String(body.username || "").toLowerCase();

  if (!/^[a-z0-9]{3,4}$/.test(username)) {
    return json({
      status: "invalid",
      message: "Debe tener exactamente 3 o 4 caracteres alfanuméricos"
    }, 400);
  }

  try {
    const url = "https://auth.roblox.com/v1/usernames/validate";
    const payload = JSON.stringify({
      username,
      birthday: "2000-01-01T00:00:00.000Z",
      context: "Signup"
    });
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    let response = await fetch(url, {
      method: "POST",
      headers,
      body: payload
    });

    if (response.status === 403) {
      const token = response.headers.get("x-csrf-token");
      if (token) {
        response = await fetch(url, {
          method: "POST",
          headers: { ...headers, "x-csrf-token": token },
          body: payload
        });
      }
    }

    if (response.status === 429) {
      return json({
        status: "rate_limited",
        message: "Roblox limitó temporalmente las consultas"
      }, 429);
    }

    if (!response.ok) {
      return json({
        status: "unknown",
        message: `Roblox respondió HTTP ${response.status}`,
        upstreamStatus: response.status
      }, 502);
    }

    const data = await response.json();

    if (data.code === 0) {
      return json({ status: "available", message: "Roblox lo considera válido y disponible" });
    }
    if (data.code === 1) {
      return json({ status: "taken", message: "El nombre ya está ocupado" });
    }
    if (data.code === 2) {
      return json({ status: "invalid", message: "Roblox no permite este nombre" });
    }

    return json({
      status: "unknown",
      message: `Respuesta no concluyente (${String(data.code)})`
    });
  } catch {
    return json({
      status: "unknown",
      message: "No se pudo contactar con Roblox desde Cloudflare"
    }, 502);
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
