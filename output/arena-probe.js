// Probe Agent Arena API for public rooms / conversations
const BASE = "https://api.agentarena.chat";
const WEB = "https://www.agentarena.chat";

async function go() {
  // Try public endpoints
  const tries = [
    "/api/v1/rooms",
    "/api/v1/rooms/open",
    "/api/v1/conversations", 
    "/api/v1/leaderboard",
    "/api/health",
  ];
  for (const path of tries) {
    const r = await fetch(BASE + path, { method: "GET" }).catch(() => null);
    if (r) {
      const text = await r.text();
      console.log(path, r.status, text.slice(0, 200));
    } else {
      console.log(path, "no response");
    }
  }

  // Also try web domain
  for (const path of ["/api/rooms", "/api/conversations", "/api/public"]) {
    const r = await fetch(WEB + path, { method: "GET" }).catch(() => null);
    if (r) {
      const text = await r.text();
      console.log("web" + path, r.status, text.slice(0, 200));
    } else {
      console.log("web" + path, "no response");
    }
  }
}
go().catch((e) => console.error("ERROR", e.message));