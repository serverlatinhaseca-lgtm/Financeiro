import routeData from "@/app/data/route-data.json";

export type Priority = "Verde" | "Amarelo" | "Vermelho";
export type TaskNature = "Emissão" | "Verificação" | "Execução" | "Lembrete";

export type Client = {
  id: string;
  name: string;
  document: string;
  email: string;
  whatsapp: string;
  company: string;
  closing: string;
  dueRule: string;
  priority: Priority;
  payment: string;
  sending: string;
  issuer: string;
  collectors: string[];
  billing: string;
  reminders: boolean;
  cancellationDays: number;
  active: boolean;
  tags: string[];
  notes: string;
};

export type Emission = {
  id: string;
  clientId: string;
  scheduledDate: string;
  originalDate: string;
  company: string;
  category: string;
  priority: "Alta" | "Média" | "Baixa";
  responsible: string;
  status: "Pendente" | "Emitida" | "Sem pedido" | "Cancelada";
  invoiceNumbers: string[];
  dueDate: string;
  observation: string;
  amount: number;
};

export type Collection = {
  id: string;
  clientId: string;
  invoice: string;
  dueDate: string;
  amount: number;
  priority: Priority;
  status: "Pendente" | "Em andamento" | "Paga" | "Baixada" | "Reagendada" | "Cancelamento pendente" | "Arquivada";
  responsible: string;
  nextContact: string;
  attempts: number;
  history: { at: string; user: string; channel: string; summary: string }[];
};

export type Task = {
  id: string;
  title: string;
  category: string;
  nature: TaskNature;
  days: string[];
  responsible: string;
  time: string;
  priority: "Alta" | "Média" | "Baixa";
  notes: string;
  subitems: string[];
  completed: boolean;
};

export type RouteRecord = {
  id: string;
  base: string;
  source: string;
  driver: string;
  batch: string;
  time: string;
  client: string;
  french: string;
  milk: string;
  notes: string;
  rule: "fixo" | "programado" | "sob-demanda";
  registered: boolean;
  checked: boolean;
};

export type GeneratedDocument = {
  id: string;
  type: string;
  company: string;
  client: string;
  date: string;
  total: number;
  status: string;
};

export type Notice = {
  id: string;
  text: string;
  sender: string;
  recipients: string[];
  priority: "Alta" | "Média" | "Baixa";
  status: "Pendente" | "Em andamento" | "Concluído" | "Arquivado";
  clientId?: string;
  createdAt: string;
  createTask: boolean;
};

export type Settings = {
  companies: { name: string; document: string; email: string; phone: string; address: string; primary: string; logo: string }[];
  users: { name: string; email: string; role: string; active: boolean }[];
  profiles: { name: string; permissions: string[] }[];
  paymentMethods: string[];
  sendingMethods: string[];
  closingTypes: string[];
  dueRules: { name: string; type: string; days: number; adjustment: string }[];
  colorRules: { name: Priority; color: string; action: string; priority: number }[];
  holidays: { date: string; name: string; type: string; driverRule: string }[];
  customFields: { entity: string; label: string; type: string; required: boolean }[];
};

export type AppState = {
  clients: Client[];
  emissions: Emission[];
  collections: Collection[];
  tasks: Task[];
  routes: RouteRecord[];
  documents: GeneratedDocument[];
  notices: Notice[];
  settings: Settings;
  audit: { at: string; user: string; action: string }[];
};

const today = "2026-08-26";

export const seedState: AppState = {
  clients: [
    { id: "c1", name: "SESI SJC", document: "03.774.819/0001-02", email: "financeiro@sesisjc.local", whatsapp: "(12) 99999-1101", company: "Indústria de Pães Nova Esperança", closing: "Semanal", dueRule: "SESI - 15 dias + próximo 10/20/30", priority: "Amarelo", payment: "Boleto", sending: "WhatsApp", issuer: "Yerardo", collectors: ["Natanael", "Willians"], billing: "Nota Fiscal + Comprovante", reminders: true, cancellationDays: 5, active: true, tags: ["educação", "grande"], notes: "Verificar pedidos diários antes da emissão." },
    { id: "c2", name: "Hospital Regional", document: "12.345.678/0001-90", email: "contas@hospitalregional.local", whatsapp: "(12) 99999-2202", company: "Indústria de Pães Nova Esperança", closing: "Diário", dueRule: "30 dias", priority: "Vermelho", payment: "Transferência", sending: "E-mail", issuer: "Yerardo", collectors: ["Natanael"], billing: "Nota Fiscal", reminders: true, cancellationDays: 1, active: true, tags: ["hospital", "crítico"], notes: "Cobrança imediata em caso de atraso." },
    { id: "c3", name: "Sodexo", document: "08.123.222/0001-10", email: "faturamento@sodexo.local", whatsapp: "(11) 99999-3303", company: "Excelência do Pão", closing: "Mensal", dueRule: "Tabela Sodexo", priority: "Amarelo", payment: "Boleto", sending: "Portal", issuer: "Natanael", collectors: ["Natanael", "Jessica"], billing: "Nota Fiscal", reminders: false, cancellationDays: 5, active: true, tags: ["alimentação", "grupo"], notes: "Tabela de vencimento própria." },
    { id: "c4", name: "Johnson", document: "61.074.175/0001-38", email: "suprimentos@johnson.local", whatsapp: "(12) 99999-4404", company: "Excelência do Pão", closing: "Semanal", dueRule: "28 dias", priority: "Verde", payment: "Depósito", sending: "E-mail", issuer: "Willians", collectors: ["Natanael"], billing: "Nota Fiscal + Comprovante", reminders: true, cancellationDays: 7, active: true, tags: ["indústria", "johnson"], notes: "Separar pães, lanches, extras e congelados." },
    { id: "c5", name: "Santa Casa SJC", document: "45.186.053/0001-87", email: "fiscal@santacasasjc.local", whatsapp: "(12) 99999-5505", company: "Indústria de Pães Nova Esperança", closing: "Diário", dueRule: "30 dias", priority: "Verde", payment: "Boleto", sending: "E-mail", issuer: "Willians", collectors: ["Natanael"], billing: "Nota Fiscal", reminders: true, cancellationDays: 5, active: true, tags: ["hospital"], notes: "Emissões de domingo e segunda preparadas no domingo." },
    { id: "c6", name: "Fadel Transportes", document: "07.260.364/0002-30", email: "compras@fadel.local", whatsapp: "(12) 99999-6606", company: "Excelência do Pão", closing: "Data específica", dueRule: "30 dias", priority: "Verde", payment: "Pix", sending: "E-mail", issuer: "Natanael", collectors: ["Natanael"], billing: "Nota Fiscal", reminders: true, cancellationDays: 5, active: true, tags: ["logística"], notes: "Cliente usado no modelo atual de cotação." },
  ],
  emissions: [
    { id: "e1", clientId: "c1", scheduledDate: today, originalDate: today, company: "Indústria de Pães Nova Esperança", category: "Semanal", priority: "Alta", responsible: "Yerardo", status: "Pendente", invoiceNumbers: [], dueDate: "2026-09-10", observation: "Verificar quais unidades SESI já foram emitidas.", amount: 4850 },
    { id: "e2", clientId: "c2", scheduledDate: today, originalDate: today, company: "Indústria de Pães Nova Esperança", category: "Diário", priority: "Alta", responsible: "Yerardo", status: "Pendente", invoiceNumbers: [], dueDate: "2026-09-25", observation: "", amount: 5432.1 },
    { id: "e3", clientId: "c4", scheduledDate: "2026-08-27", originalDate: "2026-08-27", company: "Excelência do Pão", category: "Semanal", priority: "Média", responsible: "Willians", status: "Pendente", invoiceNumbers: [], dueDate: "2026-09-24", observation: "Johnson, extras, congelados e pães.", amount: 7120 },
    { id: "e4", clientId: "c5", scheduledDate: "2026-08-30", originalDate: "2026-08-30", company: "Indústria de Pães Nova Esperança", category: "Diário", priority: "Média", responsible: "Willians", status: "Pendente", invoiceNumbers: [], dueDate: "2026-09-29", observation: "Preparar também a emissão de segunda-feira.", amount: 3280 },
    { id: "e5", clientId: "c3", scheduledDate: "2026-08-24", originalDate: "2026-08-25", company: "Excelência do Pão", category: "Mensal", priority: "Média", responsible: "Natanael", status: "Emitida", invoiceNumbers: ["38754", "38755"], dueDate: "2026-09-30", observation: "Emissão adiantada a pedido do cliente.", amount: 9100 },
  ],
  collections: [
    { id: "b1", clientId: "c2", invoice: "38190", dueDate: "2026-08-24", amount: 5432.1, priority: "Vermelho", status: "Em andamento", responsible: "Natanael", nextContact: "2026-08-26T17:00", attempts: 3, history: [{ at: "2026-08-26T09:15", user: "Natanael", channel: "WhatsApp", summary: "Cliente visualizou; aguardando confirmação do pagamento." }] },
    { id: "b2", clientId: "c1", invoice: "38177", dueDate: today, amount: 4850, priority: "Amarelo", status: "Pendente", responsible: "Natanael", nextContact: today + "T14:00", attempts: 0, history: [] },
    { id: "b3", clientId: "c3", invoice: "37902", dueDate: "2026-08-22", amount: 9100, priority: "Amarelo", status: "Reagendada", responsible: "Natanael", nextContact: today + "T10:30", attempts: 2, history: [{ at: "2026-08-25T16:30", user: "Natanael", channel: "Telefone", summary: "Promessa de pagamento para 26/08." }] },
    { id: "b4", clientId: "c4", invoice: "38011", dueDate: "2026-08-20", amount: 7120, priority: "Verde", status: "Paga", responsible: "Natanael", nextContact: "", attempts: 1, history: [{ at: "2026-08-25T12:00", user: "Willians", channel: "Sistema", summary: "Pagamento registrado; aguardando baixa da diretoria." }] },
    { id: "b5", clientId: "c5", invoice: "37880", dueDate: "2026-08-19", amount: 3280, priority: "Vermelho", status: "Cancelamento pendente", responsible: "Willians", nextContact: today + "T18:00", attempts: 4, history: [{ at: "2026-08-25T18:00", user: "Natanael", channel: "Telefone", summary: "Sem pagamento após prazo final; encaminhado para cancelamento." }] },
  ],
  tasks: [
    { id: "t1", title: "Emitir notas JOHNSON", category: "Notas Fiscais", nature: "Emissão", days: ["Quinta", "Domingo"], responsible: "Willians", time: "07:00", priority: "Alta", notes: "Separar Johnson, extras, lanches, congelados e pães franceses.", subitems: ["Johnson", "Johnson extras", "Johnson congelados", "Johnson pães com margarina", "Johnson lanches", "Johnson pão francês"], completed: false },
    { id: "t2", title: "Verificar notas SESI", category: "Notas Fiscais", nature: "Verificação", days: ["Quinta", "Domingo"], responsible: "Willians", time: "08:00", priority: "Alta", notes: "Verificar quais notas já foram emitidas por terceiros.", subitems: ["Jacareí", "SJC", "Caçapava", "Pinda", "Taubaté", "Cruzeiro", "Lorena", "Guarulhos"], completed: false },
    { id: "t3", title: "Emitir notas de quinta-feira", category: "Notas Fiscais", nature: "Emissão", days: ["Quinta"], responsible: "Willians", time: "08:30", priority: "Alta", notes: "Tarefas recorrentes exclusivas de quinta.", subitems: ["Toder", "Plastic", "Alojamento", "César", "Gerdau", "Brazul", "Iramec", "Santa Casa SJC", "Embraer / Gláucia / Marinela", "Etec"], completed: false },
    { id: "t4", title: "Produção de pão francês", category: "Produção", nature: "Execução", days: ["Quinta", "Sábado", "Domingo"], responsible: "Willians", time: "10:00", priority: "Média", notes: "No sábado produzir para domingo; no domingo, para segunda.", subitems: ["Francês", "Mini", "Baguete 70g", "Baguete 120g", "Baguete 400g", "Integral", "Mini integral"], completed: false },
    { id: "t5", title: "Produção de pão doce, bolos e confeitaria", category: "Produção", nature: "Execução", days: ["Quinta", "Domingo"], responsible: "Willians", time: "11:00", priority: "Média", notes: "Produção de domingo destinada à segunda-feira.", subitems: ["Pães doces", "Bolos", "Confeitaria"], completed: false },
    { id: "t6", title: "Romaneios de entregas", category: "Romaneios", nature: "Lembrete", days: ["Quinta", "Domingo"], responsible: "Willians", time: "14:00", priority: "Alta", notes: "Emitir via sistema externo. No domingo preparar domingo e segunda.", subitems: ["Entregas de domingo", "Entregas de segunda"], completed: false },
    { id: "t7", title: "Conferir etiquetas e folhas", category: "Etiquetas e Folhas", nature: "Verificação", days: ["Quinta", "Sábado", "Domingo"], responsible: "Willians", time: "15:00", priority: "Alta", notes: "Checklist antes da liberação.", subitems: ["Johnson", "Igaratá", "Paraibuna + conferência motorista", "Santa Branca", "Merendas SJC", "Tremembé", "Jaguariúna"], completed: false },
    { id: "t8", title: "Relatórios de produtos - líderes", category: "Relatórios", nature: "Execução", days: ["Sábado"], responsible: "Willians", time: "14:00", priority: "Média", notes: "Elaborar relatórios dos líderes para 14h e 21h, incluindo FDS.", subitems: ["Relatório 14h", "Relatório 21h", "Relatório FDS"], completed: false },
    { id: "t9", title: "Relatórios de compras", category: "Relatórios", nature: "Execução", days: ["Quinta"], responsible: "Willians", time: "17:00", priority: "Média", notes: "Emitir relatórios nos dois horários.", subitems: ["Relatório 17h00", "Relatório 20h30"], completed: false },
    { id: "t10", title: "Conferir pedidos com alteração", category: "Conferência", nature: "Verificação", days: ["Sábado", "Domingo"], responsible: "Willians", time: "16:00", priority: "Alta", notes: "Usar planilhas e conferir quadro de OK para cadastros.", subitems: ["Hospital São José", "Vivalle", "Pró Infância", "Santa Casa SJC", "Hospital Santos Dumont", "Francisca Júlia"], completed: false },
    { id: "t11", title: "Emitir notas de domingo e segunda", category: "Notas Fiscais", nature: "Emissão", days: ["Domingo"], responsible: "Willians", time: "06:30", priority: "Alta", notes: "As notas de segunda são preparadas no domingo com vencimento/competência de segunda.", subitems: ["Oxiteno", "Jarinu", "Santa Casa SJC - domingo", "Santa Casa SJC - segunda", "Vivalle - domingo", "Vivalle - segunda"], completed: false },
  ],
  routes: routeData.records as RouteRecord[],
  documents: [
    { id: "d1", type: "Cotação", company: "Indústria de Pães Nova Esperança", client: "SESI Taubaté", date: "2026-07-29", total: 256, status: "Finalizado" },
    { id: "d2", type: "Cotação", company: "Excelência do Pão", client: "Fadel Transportes", date: "2025-02-28", total: 285, status: "Finalizado" },
    { id: "d3", type: "Comprovante de Entrega", company: "Indústria de Pães Nova Esperança", client: "São José dos Campos", date: "2026-08-27", total: 0, status: "Gerado" },
  ],
  notices: [
    { id: "n1", text: "Cliente Sodexo solicitou renegociação. Aguardar análise da diretoria.", sender: "Natanael", recipients: ["Jessica", "Marcelo"], priority: "Alta", status: "Pendente", clientId: "c3", createdAt: "2026-08-26T08:30", createTask: false },
    { id: "n2", text: "Conferir alterações do Hospital São José antes de cadastrar o fim de semana.", sender: "Jessica", recipients: ["Willians"], priority: "Alta", status: "Em andamento", clientId: "c5", createdAt: "2026-08-25T17:10", createTask: true },
  ],
  settings: {
    companies: [
      { name: "Indústria de Pães Nova Esperança", document: "73.066.045/0001-32", email: "contato@paesnovaesperanca.com.br", phone: "(12) 3903-6462", address: "Avenida Dois, 181, Eldorado, São José dos Campos - SP, 12238-580", primary: "#c96520", logo: "/brand/nova-esperanca.jpg" },
      { name: "Excelência do Pão", document: "07.260.364/0001-50", email: "excelenciadopao@hotmail.com", phone: "(12) 3204-7902", address: "Avenida Leonor de Almeida Ribeiro Souto, 227, Residencial União, São José dos Campos - SP", primary: "#b6862e", logo: "/brand/excelencia-do-pao.png" },
    ],
    users: [
      { name: "Administrador", email: "admin@gestao.local", role: "Administrador", active: true },
      { name: "Yerardo", email: "yerardo@gestao.local", role: "Financeiro principal", active: true },
      { name: "Natanael", email: "natanael@gestao.local", role: "Cobranças", active: true },
      { name: "Willians", email: "willians@gestao.local", role: "Operações", active: true },
      { name: "Jessica", email: "jessica@gestao.local", role: "Diretoria", active: true },
      { name: "Marcelo", email: "marcelo@gestao.local", role: "Diretoria", active: true },
    ],
    profiles: [
      { name: "Administrador", permissions: ["todos"] },
      { name: "Financeiro principal", permissions: ["cliente:ler", "nota:criar", "nota:atualizar", "relatorio:ler"] },
      { name: "Cobranças", permissions: ["cobranca:criar", "cobranca:atualizar", "pagamento:registrar", "relatorio:ler"] },
      { name: "Operações", permissions: ["tarefa:atualizar", "rota:atualizar", "cancelamento:confirmar", "documento:criar"] },
      { name: "Diretoria", permissions: ["todos:ler", "pagamento:baixar", "cancelamento:aprovar", "relatorio:ler"] },
    ],
    paymentMethods: ["Boleto", "Pix", "Depósito", "Transferência", "Dinheiro", "Cartão"],
    sendingMethods: ["E-mail", "WhatsApp", "Mensagem", "Portal", "Outro"],
    closingTypes: ["Diário", "Semanal", "Quinzenal", "Mensal", "Data específica"],
    dueRules: [
      { name: "15 dias", type: "Dias corridos", days: 15, adjustment: "Nenhum" },
      { name: "28 dias", type: "Dias corridos", days: 28, adjustment: "Nenhum" },
      { name: "30 dias", type: "Dias corridos", days: 30, adjustment: "Nenhum" },
      { name: "SESI - 15 dias + próximo 10/20/30", type: "Personalizada", days: 15, adjustment: "Próximo dia 10, 20 ou 30" },
      { name: "Tabela Sodexo", type: "Mensal", days: 0, adjustment: "Datas cadastradas por mês" },
    ],
    colorRules: [
      { name: "Vermelho", color: "#dc2626", action: "Cobrança imediata e cancelamento", priority: 1 },
      { name: "Amarelo", color: "#d97706", action: "Cobrança prioritária", priority: 2 },
      { name: "Verde", color: "#15803d", action: "Cobrança normal; sem cancelamento", priority: 3 },
    ],
    holidays: [
      { date: "2026-09-07", name: "Independência do Brasil", type: "Nacional", driverRule: "Base de domingo" },
      { date: "2026-11-19", name: "Aniversário de São José dos Campos", type: "Municipal", driverRule: "Antecipar publicação" },
    ],
    customFields: [
      { entity: "Cliente", label: "Setor", type: "Texto", required: false },
      { entity: "Rota", label: "Viagem", type: "Seleção", required: true },
    ],
  },
  audit: [
    { at: "2026-08-26T09:15", user: "Natanael", action: "Registrou cobrança da NF 38190" },
    { at: "2026-08-26T08:30", user: "Sistema", action: "Gerou tarefas recorrentes de quarta-feira" },
    { at: "2026-08-25T18:02", user: "Willians", action: "Atualizou base de rotas do fim de semana" },
  ],
};

export const dayNames = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

