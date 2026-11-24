export async function onRequestGet({ env }) {
  try {
    if (!env.APPS_SCRIPT_URL) {
      return Response.json(
        { success: false, message: "Missing APPS_SCRIPT_URL environment variable." },
        { status: 500 }
      );
    }

    const apiUrl = new URL(env.APPS_SCRIPT_URL);
    apiUrl.searchParams.set("action", "products");

    const upstream = await fetch(apiUrl.toString(), {
      method: "GET",
      redirect: "follow",
      headers: { Accept: "application/json" }
    });

    if (!upstream.ok) {
      throw new Error(`Google Apps Script returned HTTP ${upstream.status}`);
    }

    const payload = await upstream.json();
    if (!payload || payload.success !== true || !Array.isArray(payload.data)) {
      throw new Error(payload?.message || "Invalid Google Apps Script response.");
    }

    return Response.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=60",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error?.message || "Unable to load products." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
