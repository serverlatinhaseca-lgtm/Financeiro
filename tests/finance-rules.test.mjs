import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
const rules = await vite.ssrLoadModule("/app/lib/finance-rules.ts");
const { seedState } = await vite.ssrLoadModule("/app/lib/seed.ts");

after(async () => vite.close());

test("gera automaticamente todas as segundas do mês", () => {
  const rule = seedState.settings.closingRules.find(item => item.id === "closing-monday");
  assert.deepEqual(rules.datesForRule(2026, 7, rule), ["2026-08-03", "2026-08-10", "2026-08-17", "2026-08-24", "2026-08-31"]);
});

test("fechamento mensal é emitido no primeiro dia do mês seguinte", () => {
  const rule = seedState.settings.closingRules.find(item => item.id === "closing-month-end");
  assert.deepEqual(rules.datesForRule(2026, 7, rule), ["2026-09-01"]);
});

test("calcula quarta-feira da mesma semana para emissão de segunda", () => {
  const rule = seedState.settings.dueRules.find(item => item.id === "due-same-wednesday");
  assert.equal(rules.calculateDueDate("2026-08-24", rule), "2026-08-26");
});

test("políticas não são uma escala automática de quantidade", () => {
  const state = structuredClone(seedState);
  state.collections = [
    { id: "red-open", clientId: "c2", invoice: "1", dueDate: "2026-08-25", amount: 10, priority: "Vermelho", policyId: "color-red", status: "Pendente", responsible: "Natanael", nextContact: "", availableFrom: "2026-08-26", attempts: 0, history: [] },
  ];
  assert.match(rules.collectionGuidance(state, "c2", "2026-08-27").label, /Cobrança imediata/);
  assert.match(rules.collectionGuidance(state, "c4", "2026-08-27").label, /fornecimento mantido/);
});
