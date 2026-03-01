// Ejemplo: Conectar tu app JS/TS al ecosistema Antigravity
// Importar con: import { runAgent, listAgents } from './.antigravity/sdk/antigravity.js'

import { runAgent, listAgents, healthCheck } from "./.antigravity/sdk/antigravity.js";

async function main() {
  // 1. Verificar estado
  const health = await healthCheck();
  console.log("Estado:", health);

  // 2. Listar agentes
  const agents = await listAgents();
  console.log(`Agentes disponibles: ${agents.length}`);

  // 3. Ejecutar un agente
  const result = await runAgent("explorer", "analiza la estructura de este proyecto");
  console.log("Resultado:", result);
}

main().catch(console.error);
