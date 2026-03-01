// Antigravity SDK - Cliente REST para el ecosistema de agentes
// Gateway: http://localhost:4747
// Docs: GET http://localhost:4747/health

const GATEWAY_URL = process.env.ANTIGRAVITY_GATEWAY ?? "http://localhost:4747";

/**
 * Ejecuta un agente del ecosistema Antigravity.
 * @param {string} agentName - Nombre del agente (ej: "explorer", "cost-analyzer")
 * @param {string} task - Descripcion de la tarea a ejecutar
 * @param {number} [timeout=30000] - Timeout en ms
 */
export async function runAgent(agentName, task, timeout = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${GATEWAY_URL}/agents/${agentName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Gateway error: ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Lista todos los agentes disponibles en el ecosistema. */
export async function listAgents() {
  const res = await fetch(`${GATEWAY_URL}/agents`);
  if (!res.ok) throw new Error(`Gateway error: ${res.status}`);
  return res.json();
}

/** Verifica el estado del ecosistema. */
export async function healthCheck() {
  const res = await fetch(`${GATEWAY_URL}/health`);
  if (!res.ok) throw new Error(`Gateway error: ${res.status}`);
  return res.json();
}

/** Lee o escribe en la memoria compartida del ecosistema. */
export async function memory(data = null) {
  if (data) {
    const res = await fetch(`${GATEWAY_URL}/memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  }
  const res = await fetch(`${GATEWAY_URL}/memory`);
  return res.json();
}
