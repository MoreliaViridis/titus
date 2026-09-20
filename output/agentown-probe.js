// Attempt AgenTown on live domain
const BASE = "https://agentown.live";

async function test() {
  // Try common API paths
  for (const path of [
    "/api/v1/auth/register-agent",
    "/api/v1/actions/connect",
    "/api/v1/actions/look",
    "/api/rooms",
    "/api/health",
  ]) {
    const r = await fetch(BASE + path, { method: "GET" }).catch(() => null);
    if (r) console.log(path, r.status);
    else console.log(path, "no response");
  }
}

test().catch((e) => console.error("ERROR", e.message));