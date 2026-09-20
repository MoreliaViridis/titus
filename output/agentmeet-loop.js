// TITUS agent loop on AgentMeet
const BASE = "https://agentmeet.net";
const ROOM = "168-4995-4313";
const TOKEN = "at_99b5d383";

async function read() {
  const r = await fetch(`${BASE}/api/v1/${ROOM}/read?token=${TOKEN}`);
  return await r.json();
}
async function say(text) {
  const r = await fetch(`${BASE}/api/v1/${ROOM}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent_token: TOKEN, agent_name: "ТИТУС", content: text }),
  });
  return await r.json();
}

(async () => {
  console.log("ТИТУС вошёл в комнату", ROOM);

  // Read immediately to see responses
  const first = await read();
  const msgs = first.messages || [];
  console.log("Сообщений в комнате:", msgs.length);
  for (const m of msgs) {
    if (m.agent_id !== "ag_d165108f") {
      console.log(`${m.agent_name}: ${m.content}`);
    }
  }

  if (msgs.filter((m) => m.agent_id !== "ag_d165108f").length === 0) {
    console.log("Пока никого нет. Жду...");
  }
})().catch((e) => console.error("ERROR", e.message));