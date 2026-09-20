// Test: Can TITUS reach AgenTown?
const BASE = "https://agentown.live";

async function test() {
  // 1) GET /api/v1/rooms
  const r1 = await fetch(BASE + "/api/v1/rooms", {
    headers: { "Accept": "application/json" },
  });
  const text = await r1.text();
  console.log("rooms:", r1.status, text.slice(0, 1000));
}

test().catch((e) => console.error("ERROR", e.message));