import { AppState, Client, ClosingRule, DueRule, Emission, Priority, seedState } from "@/app/lib/seed";

const DAY_MS = 86_400_000;

export function isoToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().slice(0, 10);
}

function dateFromIso(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number) {
  const date = dateFromIso(value);
  date.setUTCDate(date.getUTCDate() + days);
  return iso(date);
}

function monthLastDay(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function calculateDueDate(issueDate: string, rule?: DueRule) {
  if (!rule || rule.mode === "manual_table") return issueDate;
  if (rule.mode === "days_after") return addDays(issueDate, rule.days);
  if (rule.mode === "weekday_same_week") {
    const date = dateFromIso(issueDate);
    const delta = (rule.weekday - date.getUTCDay() + 7) % 7;
    return addDays(issueDate, delta);
  }
  if (rule.mode === "fortnight_window") {
    const date = dateFromIso(issueDate);
    if (date.getUTCDate() <= 15) {
      const day = Math.min(30, monthLastDay(date.getUTCFullYear(), date.getUTCMonth()));
      return iso(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), day)));
    }
    return iso(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 15)));
  }
  const base = dateFromIso(addDays(issueDate, rule.days));
  const paymentDays = [...rule.paymentDays].sort((a, b) => a - b);
  for (let offset = 0; offset < 18; offset++) {
    const year = base.getUTCFullYear();
    const month = base.getUTCMonth() + offset;
    const candidateYear = year + Math.floor(month / 12);
    const candidateMonth = month % 12;
    for (const day of paymentDays) {
      const validDay = Math.min(day, monthLastDay(candidateYear, candidateMonth));
      const candidate = new Date(Date.UTC(candidateYear, candidateMonth, validDay));
      if (candidate >= base) return iso(candidate);
    }
  }
  return iso(base);
}

export function datesForRule(year: number, month: number, rule: ClosingRule) {
  const dates: string[] = [];
  const last = monthLastDay(year, month);
  if (rule.frequency === "month_end_next_day") return [iso(new Date(Date.UTC(year, month + 1, 1)))];
  if (rule.frequency === "fortnightly") return [iso(new Date(Date.UTC(year, month, 15))), iso(new Date(Date.UTC(year, month, last)))];
  if (rule.frequency === "fixed_days") {
    return [...new Set(rule.daysOfMonth)].sort((a, b) => a - b).map(day => iso(new Date(Date.UTC(year, month, Math.min(Math.max(day, 1), last)))));
  }
  for (let day = 1; day <= last; day++) {
    const date = new Date(Date.UTC(year, month, day));
    if (rule.frequency === "daily" || rule.weekdays.includes(date.getUTCDay())) dates.push(iso(date));
  }
  return dates;
}

function legacyClosingId(value = "") {
  const name = value.toLowerCase();
  if (name.includes("segunda")) return "closing-monday";
  if (name.includes("quarta")) return "closing-wednesday";
  if (name.includes("sexta")) return "closing-friday";
  if (name.includes("quinz")) return "closing-fortnight";
  if (name.includes("25")) return "closing-day-25";
  if (name.includes("20")) return "closing-day-20";
  if (name.includes("mensal")) return "closing-month-end";
  return name.includes("diár") || name.includes("diar") ? "closing-daily" : "closing-day-25";
}

function legacyDueId(value = "") {
  const name = value.toLowerCase();
  if (name.includes("sesi") || name.includes("10/20/30")) return "due-sesi";
  if (name.includes("sodexo") || name.includes("tabela")) return "due-table";
  if (name.includes("quarta")) return "due-same-wednesday";
  if (name.includes("28")) return "due-28";
  if (name.includes("15")) return "due-15";
  return "due-30";
}

function legacyColorId(priority: Priority) {
  return priority === "Vermelho" ? "color-red" : priority === "Amarelo" ? "color-yellow" : "color-green";
}

function migrateClient(client: Partial<Client>): Client {
  const closingRuleId = client.closingRuleId || legacyClosingId(client.closing);
  const dueRuleId = client.dueRuleId || legacyDueId(client.dueRule);
  const priority = client.priority || "Verde";
  return {
    id: client.id || `cliente-${Date.now()}`,
    name: client.name || "Cliente sem nome",
    document: client.document || "",
    email: client.email || "",
    whatsapp: client.whatsapp || "",
    company: client.company || seedState.settings.companies[0].name,
    closing: client.closing || seedState.settings.closingRules.find(rule => rule.id === closingRuleId)?.name || "Diário",
    closingRuleId,
    dueRule: client.dueRule || seedState.settings.dueRules.find(rule => rule.id === dueRuleId)?.name || "30 dias",
    dueRuleId,
    priority,
    colorRuleId: client.colorRuleId || legacyColorId(priority),
    groupId: client.groupId || "",
    requiresOrderCheck: client.requiresOrderCheck ?? closingRuleId === "closing-daily-check",
    payment: client.payment || "Boleto",
    sending: client.sending || "E-mail",
    issuer: client.issuer || "Yerardo",
    collectors: client.collectors?.length ? client.collectors : ["Natanael"],
    billing: client.billing || "Nota Fiscal",
    reminders: client.reminders ?? true,
    cancellationDays: client.cancellationDays ?? (priority === "Vermelho" ? 1 : 5),
    active: client.active ?? true,
    tags: client.tags || [],
    notes: client.notes || "",
  };
}

export function normalizeFinancialState(raw: Partial<AppState> | null | undefined): AppState {
  const source = raw || seedState;
  const settings = {
    ...structuredClone(seedState.settings),
    ...(source.settings || {}),
    closingRules: source.settings?.closingRules?.length ? source.settings.closingRules : structuredClone(seedState.settings.closingRules),
    dueRules: source.settings?.dueRules?.length && "id" in source.settings.dueRules[0] ? source.settings.dueRules : structuredClone(seedState.settings.dueRules),
    colorRules: source.settings?.colorRules?.length && "id" in source.settings.colorRules[0] ? source.settings.colorRules : structuredClone(seedState.settings.colorRules),
    customerGroups: source.settings?.customerGroups?.length ? source.settings.customerGroups : structuredClone(seedState.settings.customerGroups),
  };
  const clients = (source.clients?.length ? source.clients : seedState.clients).map(migrateClient);
  const next: AppState = {
    ...structuredClone(seedState),
    ...source,
    settings,
    clients,
    emissions: (source.emissions || []).map(emission => ({
      ...emission,
      orderCheck: emission.orderCheck || (clients.find(client => client.id === emission.clientId)?.requiresOrderCheck ? "A verificar" : "Não necessário"),
      autoGenerated: emission.autoGenerated ?? false,
    })),
    collections: (source.collections || []).map(collection => ({
      ...collection,
      availableFrom: collection.availableFrom || addDays(collection.dueDate, 1),
      policyId: collection.policyId || clients.find(client => client.id === collection.clientId)?.colorRuleId || legacyColorId(collection.priority),
    })),
  };
  return ensureFinancialSchedule(next);
}

export function ensureFinancialSchedule(state: AppState, reference = isoToday()) {
  const next = structuredClone(state);
  const base = dateFromIso(reference);
  const months = [0, 1];
  const keys = new Set(next.emissions.map(emission => `${emission.clientId}|${emission.scheduledDate}`));
  for (const client of next.clients.filter(item => item.active)) {
    const closingRule = next.settings.closingRules.find(rule => rule.id === client.closingRuleId && rule.active);
    const dueRule = next.settings.dueRules.find(rule => rule.id === client.dueRuleId && rule.active);
    if (!closingRule) continue;
    for (const offset of months) {
      const monthDate = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offset, 1));
      for (const scheduledDate of datesForRule(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), closingRule)) {
        const key = `${client.id}|${scheduledDate}`;
        if (keys.has(key)) continue;
        const emission: Emission = {
          id: `auto-${client.id}-${scheduledDate}`,
          clientId: client.id,
          scheduledDate,
          originalDate: scheduledDate,
          company: client.company,
          category: closingRule.name,
          priority: scheduledDate < reference ? "Alta" : "Média",
          responsible: client.issuer,
          status: "Pendente",
          invoiceNumbers: [],
          dueDate: calculateDueDate(scheduledDate, dueRule),
          observation: closingRule.requiresOrderCheck || client.requiresOrderCheck ? "Verificar no sistema se existe pedido antes de emitir." : "",
          amount: 0,
          orderCheck: closingRule.requiresOrderCheck || client.requiresOrderCheck ? "A verificar" : "Não necessário",
          autoGenerated: true,
        };
        next.emissions.push(emission);
        keys.add(key);
      }
    }
  }
  next.emissions.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.clientId.localeCompare(b.clientId));
  return next;
}

export function openPendingCount(state: AppState, clientId: string, reference = isoToday()) {
  return state.collections.filter(item => item.clientId === clientId && item.dueDate < reference && !["Paga", "Baixada", "Arquivada"].includes(item.status)).length;
}

export function collectionGuidance(state: AppState, clientId: string, reference = isoToday()) {
  const client = state.clients.find(item => item.id === clientId);
  const policy = state.settings.colorRules.find(item => item.id === client?.colorRuleId);
  const open = openPendingCount(state, clientId, reference);
  if (!policy) return { open, label: "Regra não definida", tone: "neutral", policy: undefined };
  if (policy.maxOpenPending === null) return { open, label: "Cobrar normalmente · fornecimento mantido", tone: "success", policy };
  if (policy.maxOpenPending === 0 && open > 0) return { open, label: "Cobrança imediata · encaminhar cancelamento se não pagar", tone: "danger", policy };
  if (open >= policy.maxOpenPending) return { open, label: `Limite de ${policy.maxOpenPending} pendências atingido`, tone: "warning", policy };
  return { open, label: `${open} de ${policy.maxOpenPending} pendências permitidas`, tone: "warning", policy };
}

export const weekdayLabels = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function daysBetween(from: string, to: string) {
  return Math.floor((dateFromIso(to).getTime() - dateFromIso(from).getTime()) / DAY_MS);
}
