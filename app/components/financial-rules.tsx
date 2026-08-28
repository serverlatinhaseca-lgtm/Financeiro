"use client";

import { useState } from "react";
import { CalendarDays, Copy, Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { AppState, ClosingRule, ColorRule, CustomerGroup, DueRule } from "@/app/lib/seed";
import { weekdayLabels } from "@/app/lib/finance-rules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";

type Commit = (action: string, recipe: (draft: AppState) => void) => void;
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const blankClosing = (): ClosingRule => ({ id: "", name: "", frequency: "weekday", weekdays: [1], daysOfMonth: [], requiresOrderCheck: false, active: true });
const blankDue = (): DueRule => ({ id: "", name: "", mode: "days_after", days: 30, weekday: 3, paymentDays: [], active: true });
const blankColor = (): ColorRule => ({ id: "", name: "Nova regra", color: "#2563eb", maxOpenPending: null, allowSupply: true, collectionDelayDays: 1, cancelAfterUnpaid: false, action: "", priority: 4 });
const blankGroup = (): CustomerGroup => ({ id: "", name: "", payerName: "", units: [], inheritRules: true });

function saveItem<T extends { id: string }>(items: T[], item: T) {
  const index = items.findIndex(current => current.id === item.id);
  if (index >= 0) items[index] = item;
  else items.push(item);
}

function ruleSummary(rule: ClosingRule) {
  if (rule.frequency === "daily") return "Todos os dias do mês, gerados automaticamente";
  if (rule.frequency === "weekday") return rule.weekdays.map(day => weekdayLabels[day]).join(", ");
  if (rule.frequency === "fortnightly") return "Dia 15 e último dia do mês";
  if (rule.frequency === "month_end_next_day") return "Fechamento mensal; emissão no primeiro dia do próximo mês";
  return `Dias ${rule.daysOfMonth.join(", ") || "não definidos"}`;
}

function dueSummary(rule: DueRule) {
  if (rule.mode === "days_after") return `${rule.days} dias após a emissão`;
  if (rule.mode === "weekday_same_week") return `${weekdayLabels[rule.weekday]} da mesma semana (ou próxima ocorrência)`;
  if (rule.mode === "next_payment_day") return `${rule.days} dias e ajuste para o próximo dia ${rule.paymentDays.join(", ")}`;
  if (rule.mode === "fortnight_window") return "1–15 vence dia 30; 16–fim vence dia 15 do mês seguinte";
  return "Data escolhida na tabela/calendário do cliente";
}

export function FinancialRuleSettings({ state, commit }: { state: AppState; commit: Commit }) {
  const [closing, setClosing] = useState<ClosingRule | null>(null);
  const [due, setDue] = useState<DueRule | null>(null);
  const [color, setColor] = useState<ColorRule | null>(null);
  const [group, setGroup] = useState<CustomerGroup | null>(null);
  const [unit, setUnit] = useState("");

  function persistClosing() {
    if (!closing?.name.trim()) return toast.error("Informe o nome da regra");
    if (closing.frequency === "weekday" && !closing.weekdays.length) return toast.error("Selecione ao menos um dia da semana");
    if (closing.frequency === "fixed_days" && !closing.daysOfMonth.length) return toast.error("Selecione ao menos um dia do mês");
    const item = { ...closing, id: closing.id || id("closing") };
    commit(`${closing.id ? "Editou" : "Criou"} regra de fechamento ${item.name}`, draft => saveItem(draft.settings.closingRules, item));
    setClosing(null); toast.success("Regra de fechamento salva");
  }

  function persistDue() {
    if (!due?.name.trim()) return toast.error("Informe o nome da regra");
    if (due.mode === "next_payment_day" && !due.paymentDays.length) return toast.error("Selecione os dias de pagamento");
    const item = { ...due, id: due.id || id("due") };
    commit(`${due.id ? "Editou" : "Criou"} regra de vencimento ${item.name}`, draft => saveItem(draft.settings.dueRules, item));
    setDue(null); toast.success("Regra de vencimento salva");
  }

  function persistColor() {
    if (!color?.name.trim()) return toast.error("Informe o nome da política");
    const item = { ...color, id: color.id || id("policy") };
    item.action = item.maxOpenPending === null
      ? "Pendências ilimitadas; cobrança normal e fornecimento mantido."
      : item.maxOpenPending === 0
        ? `Nenhuma pendência vencida permitida; cobrar após ${item.collectionDelayDays} dia(s) e ${item.cancelAfterUnpaid ? "encaminhar cancelamento se não pagar" : "manter acompanhamento"}.`
        : `Até ${item.maxOpenPending} pendência(s); cobrar após ${item.collectionDelayDays} dia(s) e ${item.allowSupply ? "manter fornecimento dentro do limite" : "bloquear fornecimento"}.`;
    commit(`${color.id ? "Editou" : "Criou"} política ${item.name}`, draft => saveItem(draft.settings.colorRules, item));
    setColor(null); toast.success("Política de cobrança salva");
  }

  function persistGroup() {
    if (!group?.name.trim() || !group.payerName.trim()) return toast.error("Informe o grupo e o pagador");
    const item = { ...group, id: group.id || id("group") };
    commit(`${group.id ? "Editou" : "Criou"} grupo ${item.name}`, draft => saveItem(draft.settings.customerGroups, item));
    setGroup(null); toast.success("Grupo de faturamento salvo");
  }

  function removeRule(kind: "closingRules" | "dueRules" | "colorRules", ruleId: string) {
    const used = state.clients.some(client => kind === "closingRules" ? client.closingRuleId === ruleId : kind === "dueRules" ? client.dueRuleId === ruleId : client.colorRuleId === ruleId);
    if (used) return toast.error("A regra está vinculada a clientes e não pode ser apagada");
    commit("Apagou regra financeira", draft => { draft.settings[kind] = draft.settings[kind].filter(item => item.id !== ruleId) as never; });
  }

  return <div className="financial-rules">
    <Card><CardHeader className="row"><div><CardTitle>Regras de fechamento e emissão</CardTitle><CardDescription>O calendário mensal é calculado automaticamente. Não é preciso recriar datas.</CardDescription></div><Button size="sm" onClick={() => setClosing(blankClosing())}><Plus /> Nova regra</Button></CardHeader><CardContent className="rules-list">{state.settings.closingRules.map(rule => <div key={rule.id}><CalendarDays /><span><strong>{rule.name}</strong><small>{ruleSummary(rule)}{rule.requiresOrderCheck ? " · exige verificar pedido" : ""}</small></span><div className="rule-actions"><Button variant="ghost" size="icon" onClick={() => setClosing({ ...rule, id: "", name: `${rule.name} (cópia)` })}><Copy /></Button><Button variant="ghost" size="icon" onClick={() => setClosing(structuredClone(rule))}><Pencil /></Button><Button variant="ghost" size="icon" onClick={() => removeRule("closingRules", rule.id)}><Trash2 /></Button></div></div>)}</CardContent></Card>

    <Card><CardHeader className="row"><div><CardTitle>Regras de vencimento</CardTitle><CardDescription>Seletores calculam o vencimento a partir da emissão.</CardDescription></div><Button size="sm" onClick={() => setDue(blankDue())}><Plus /> Nova regra</Button></CardHeader><CardContent className="rules-list">{state.settings.dueRules.map(rule => <div key={rule.id}><CalendarDays /><span><strong>{rule.name}</strong><small>{dueSummary(rule)}</small></span><div className="rule-actions"><Button variant="ghost" size="icon" onClick={() => setDue({ ...rule, id: "", name: `${rule.name} (cópia)` })}><Copy /></Button><Button variant="ghost" size="icon" onClick={() => setDue(structuredClone(rule))}><Pencil /></Button><Button variant="ghost" size="icon" onClick={() => removeRule("dueRules", rule.id)}><Trash2 /></Button></div></div>)}</CardContent></Card>

    <Card><CardHeader className="row"><div><CardTitle>Políticas por cor</CardTitle><CardDescription>A cor é uma regra escolhida para o cliente; não é um score automático por quantidade.</CardDescription></div><Button size="sm" onClick={() => setColor(blankColor())}><Plus /> Nova política</Button></CardHeader><CardContent className="rules-list color-policy-list">{[...state.settings.colorRules].sort((a, b) => a.priority - b.priority).map(rule => <div key={rule.id}><i className="rule-color" style={{ background: rule.color }} /><span><strong>{rule.name}</strong><small>{rule.action}</small></span><div className="rule-actions"><Button variant="ghost" size="icon" onClick={() => setColor({ ...rule, id: "", name: `${rule.name} (cópia)` })}><Copy /></Button><Button variant="ghost" size="icon" onClick={() => setColor(structuredClone(rule))}><Pencil /></Button><Button variant="ghost" size="icon" onClick={() => removeRule("colorRules", rule.id)}><Trash2 /></Button></div></div>)}</CardContent></Card>

    <Card><CardHeader className="row"><div><CardTitle>Grupos e empresas associadas</CardTitle><CardDescription>Unidades entregues separadamente e faturadas para um único pagador.</CardDescription></div><Button size="sm" onClick={() => { setGroup(blankGroup()); setUnit(""); }}><Plus /> Novo grupo</Button></CardHeader><CardContent className="rules-list">{state.settings.customerGroups.map(item => <div key={item.id}><UsersRound /><span><strong>{item.name} · pagador: {item.payerName}</strong><small>{item.units.length} unidades: {item.units.join(", ")}</small></span><Button variant="ghost" size="icon" onClick={() => { setGroup(structuredClone(item)); setUnit(""); }}><Pencil /></Button></div>)}</CardContent></Card>

    <Dialog open={Boolean(closing)} onOpenChange={open => !open && setClosing(null)}><DialogContent>{closing && <><DialogHeader><DialogTitle>Regra de fechamento</DialogTitle><DialogDescription>Monte a recorrência com seletores. O sistema gera as datas de cada mês.</DialogDescription></DialogHeader><div className="stack"><Label>Nome da regra</Label><Input value={closing.name} onChange={event => setClosing({ ...closing, name: event.target.value })} placeholder="Ex.: Toda segunda-feira" /><Label>Frequência</Label><NativeSelect value={closing.frequency} onChange={event => setClosing({ ...closing, frequency: event.target.value as ClosingRule["frequency"], weekdays: [], daysOfMonth: [] })}><NativeSelectOption value="daily">Todos os dias</NativeSelectOption><NativeSelectOption value="weekday">Dias da semana</NativeSelectOption><NativeSelectOption value="fortnightly">Dia 15 e último dia</NativeSelectOption><NativeSelectOption value="fixed_days">Dias fixos do mês</NativeSelectOption><NativeSelectOption value="month_end_next_day">Mês anterior / emitir no dia 1</NativeSelectOption></NativeSelect>{closing.frequency === "weekday" && <div className="selector-grid weekdays">{weekdayLabels.map((label, day) => <label key={label}><Checkbox checked={closing.weekdays.includes(day)} onCheckedChange={checked => setClosing({ ...closing, weekdays: checked ? [...closing.weekdays, day] : closing.weekdays.filter(item => item !== day) })} />{label}</label>)}</div>}{closing.frequency === "fixed_days" && <div className="day-picker-grid">{Array.from({ length: 31 }, (_, index) => index + 1).map(day => <Button key={day} type="button" size="sm" variant={closing.daysOfMonth.includes(day) ? "default" : "outline"} onClick={() => setClosing({ ...closing, daysOfMonth: closing.daysOfMonth.includes(day) ? closing.daysOfMonth.filter(item => item !== day) : [...closing.daysOfMonth, day].sort((a, b) => a - b) })}>{day}</Button>)}</div>}<label className="switch-row"><Switch checked={closing.requiresOrderCheck} onCheckedChange={value => setClosing({ ...closing, requiresOrderCheck: value })} /><span><strong>Exigir verificação de pedido</strong><small>Exibe Tem pedido / Sem pedido antes da emissão</small></span></label><label className="switch-row"><Switch checked={closing.active} onCheckedChange={value => setClosing({ ...closing, active: value })} /><span><strong>Regra ativa</strong></span></label></div><DialogFooter><Button variant="outline" onClick={() => setClosing(null)}>Cancelar</Button><Button onClick={persistClosing}>Salvar regra</Button></DialogFooter></>}</DialogContent></Dialog>

    <Dialog open={Boolean(due)} onOpenChange={open => !open && setDue(null)}><DialogContent>{due && <><DialogHeader><DialogTitle>Regra de vencimento</DialogTitle><DialogDescription>Defina o cálculo com campos controlados.</DialogDescription></DialogHeader><div className="stack"><Label>Nome da regra</Label><Input value={due.name} onChange={event => setDue({ ...due, name: event.target.value })} /><Label>Cálculo</Label><NativeSelect value={due.mode} onChange={event => setDue({ ...due, mode: event.target.value as DueRule["mode"] })}><NativeSelectOption value="days_after">Dias após a emissão</NativeSelectOption><NativeSelectOption value="weekday_same_week">Dia da semana</NativeSelectOption><NativeSelectOption value="next_payment_day">Dias + próximo dia de pagamento</NativeSelectOption><NativeSelectOption value="fortnight_window">Regra das quinzenas</NativeSelectOption><NativeSelectOption value="manual_table">Tabela/calendário mensal</NativeSelectOption></NativeSelect>{["days_after", "next_payment_day"].includes(due.mode) && <><Label>Dias após a emissão</Label><Input type="number" min={0} value={due.days} onChange={event => setDue({ ...due, days: Number(event.target.value) })} /></>}{due.mode === "weekday_same_week" && <><Label>Dia do vencimento</Label><NativeSelect value={String(due.weekday)} onChange={event => setDue({ ...due, weekday: Number(event.target.value) })}>{weekdayLabels.map((label, day) => <NativeSelectOption value={String(day)} key={label}>{label}</NativeSelectOption>)}</NativeSelect></>}{due.mode === "next_payment_day" && <><Label>Dias aceitos para pagamento</Label><div className="day-picker-grid compact">{Array.from({ length: 31 }, (_, index) => index + 1).map(day => <Button key={day} type="button" size="sm" variant={due.paymentDays.includes(day) ? "default" : "outline"} onClick={() => setDue({ ...due, paymentDays: due.paymentDays.includes(day) ? due.paymentDays.filter(item => item !== day) : [...due.paymentDays, day].sort((a, b) => a - b) })}>{day}</Button>)}</div></>}<label className="switch-row"><Switch checked={due.active} onCheckedChange={value => setDue({ ...due, active: value })} /><span><strong>Regra ativa</strong></span></label></div><DialogFooter><Button variant="outline" onClick={() => setDue(null)}>Cancelar</Button><Button onClick={persistDue}>Salvar regra</Button></DialogFooter></>}</DialogContent></Dialog>

    <Dialog open={Boolean(color)} onOpenChange={open => !open && setColor(null)}><DialogContent>{color && <><DialogHeader><DialogTitle>Política de cobrança</DialogTitle><DialogDescription>Configure o comportamento por seletores; o texto explicativo é gerado automaticamente.</DialogDescription></DialogHeader><div className="stack"><Label>Nome / cor</Label><div className="inline"><Input value={color.name} onChange={event => setColor({ ...color, name: event.target.value })} /><Input type="color" value={color.color} onChange={event => setColor({ ...color, color: event.target.value })} /></div><Label>Máximo de pendências vencidas permitidas</Label><NativeSelect value={color.maxOpenPending === null ? "unlimited" : String(color.maxOpenPending)} onChange={event => setColor({ ...color, maxOpenPending: event.target.value === "unlimited" ? null : Number(event.target.value) })}><NativeSelectOption value="0">Nenhuma</NativeSelectOption><NativeSelectOption value="1">Até 1</NativeSelectOption><NativeSelectOption value="2">Até 2</NativeSelectOption><NativeSelectOption value="3">Até 3</NativeSelectOption><NativeSelectOption value="unlimited">Sem limite</NativeSelectOption></NativeSelect><Label>Iniciar cobrança</Label><NativeSelect value={String(color.collectionDelayDays)} onChange={event => setColor({ ...color, collectionDelayDays: Number(event.target.value) })}><NativeSelectOption value="0">No vencimento (lembrete + cobrança)</NativeSelectOption><NativeSelectOption value="1">No dia seguinte ao vencimento</NativeSelectOption><NativeSelectOption value="2">Dois dias após o vencimento</NativeSelectOption></NativeSelect><label className="switch-row"><Switch checked={color.allowSupply} onCheckedChange={value => setColor({ ...color, allowSupply: value })} /><span><strong>Manter fornecimento</strong><small>Enquanto estiver dentro da política</small></span></label><label className="switch-row"><Switch checked={color.cancelAfterUnpaid} onCheckedChange={value => setColor({ ...color, cancelAfterUnpaid: value })} /><span><strong>Encaminhar cancelamento se não pagar</strong></span></label></div><DialogFooter><Button variant="outline" onClick={() => setColor(null)}>Cancelar</Button><Button onClick={persistColor}>Salvar política</Button></DialogFooter></>}</DialogContent></Dialog>

    <Dialog open={Boolean(group)} onOpenChange={open => !open && setGroup(null)}><DialogContent>{group && <><DialogHeader><DialogTitle>Grupo de faturamento</DialogTitle><DialogDescription>As unidades aparecem separadas na operação, mas faturam para o pagador informado.</DialogDescription></DialogHeader><div className="stack"><Label>Nome do grupo</Label><Input value={group.name} onChange={event => setGroup({ ...group, name: event.target.value })} /><Label>Pagador central</Label><Input value={group.payerName} onChange={event => setGroup({ ...group, payerName: event.target.value })} /><Label>Adicionar unidade</Label><div className="inline"><Input value={unit} onChange={event => setUnit(event.target.value)} placeholder="Nome da unidade" /><Button type="button" onClick={() => { if (!unit.trim()) return; setGroup({ ...group, units: [...group.units, unit.trim()] }); setUnit(""); }}><Plus /></Button></div><div className="unit-editor">{group.units.map((item, index) => <span key={`${item}-${index}`}>{item}<button type="button" onClick={() => setGroup({ ...group, units: group.units.filter((_, current) => current !== index) })}>×</button></span>)}</div><label className="switch-row"><Switch checked={group.inheritRules} onCheckedChange={value => setGroup({ ...group, inheritRules: value })} /><span><strong>Compartilhar regras do pagador</strong><small>Fechamento, vencimento e cobrança</small></span></label></div><DialogFooter><Button variant="outline" onClick={() => setGroup(null)}>Cancelar</Button><Button onClick={persistGroup}>Salvar grupo</Button></DialogFooter></>}</DialogContent></Dialog>
  </div>;
}
