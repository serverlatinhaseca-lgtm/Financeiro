"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  ClipboardCheck,
  Copy,
  Download,
  FileClock,
  Filter,
  History,
  MapPinned,
  Plus,
  RefreshCw,
  Route,
  Save,
  Search,
  Settings2,
  Truck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  AppState,
  OperationalHoliday,
  RouteDivergence,
  RouteDriver,
  RoutePlan,
  RouteRecord,
  dayNames,
} from "@/app/lib/seed";
import {
  PlannerCalendar,
  PlannerEvent,
} from "@/app/components/planner-calendar";
import { RouteMap } from "@/app/components/route-map";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Commit = (action: string, recipe: (draft: AppState) => void) => void;
const uid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const pct = (value: number, total: number) =>
  total ? Math.round((value / total) * 100) : 0;

function Status({ children }: { children: React.ReactNode }) {
  const value = String(children).toLowerCase();
  const tone = /diverg|aberta|crítica|suspensa|cancel/.test(value)
    ? "danger"
    : /pendente|preparação|revisão|aguardando|parcial/.test(value)
      ? "warning"
      : /conclu|verific|public|ativo|corrigid|cadastrad/.test(value)
        ? "success"
        : "neutral";
  return <span className={`status status-${tone}`}>{children}</span>;
}

function Stat({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Route;
}) {
  return (
    <Card className="route-stat">
      <CardContent>
        <Icon />
        <span>
          <small>{label}</small>
          <strong>{value}</strong>
          <em>{detail}</em>
        </span>
      </CardContent>
    </Card>
  );
}

const blankDriver: RouteDriver = {
  id: "",
  name: "",
  shortName: "",
  status: "Ativo",
  phone: "",
  company: "Nova Esperança",
  availability: "05:00 às 15:00",
  shifts: ["Manhã"],
  days: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
  linkedRoutes: [],
  substituteId: "",
  notes: "",
};

const blankPlan: RoutePlan = {
  id: "",
  name: "",
  code: "",
  status: "Ativa",
  type: "Semana",
  days: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
  driverId: "",
  substituteId: "",
  shift: "Manhã",
  trips: ["1ª Viagem"],
  departure: "05:30",
  departurePoint: "Panificadora",
  returnTime: "11:30",
  validityStart: new Date().toISOString().slice(0, 10),
  validityEnd: "",
  permanent: true,
  notes: "",
  color: "#f97316",
};

const blankHoliday: OperationalHoliday = {
  id: "",
  name: "",
  date: new Date().toISOString().slice(0, 10),
  annual: false,
  type: "Nacional",
  locality: "Brasil",
  status: "Em preparação",
  routeBase: "Semana",
  operationalRule: "Antecipar para o dia útil anterior",
  notifications: [30, 15, 7, 3, 1],
  notes: "",
};

const blankDivergence: RouteDivergence = {
  id: "",
  routeId: "",
  client: "",
  date: new Date().toISOString().slice(0, 10),
  type: "Quantidade",
  expected: "",
  found: "",
  description: "",
  responsible: "Cadastro",
  priority: "Alta",
  status: "Aberta",
};

export function RouteOperationsCenter({
  state,
  commit,
  user,
}: {
  state: AppState;
  commit: Commit;
  user: string;
}) {
  const [tab, setTab] = useState("overview");
  const [competencyId, setCompetencyId] = useState(
    state.routeCompetencies.find((item) => item.official)?.id ||
      state.routeCompetencies[0]?.id,
  );
  const [search, setSearch] = useState("");
  const [driverFilter, setDriverFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selected, setSelected] = useState<string[]>([]);
  const [moveTarget, setMoveTarget] = useState("");
  const [registerRouteFilter, setRegisterRouteFilter] = useState("Todas");
  const [registerOnlyPending, setRegisterOnlyPending] = useState(true);
  const [editingDriver, setEditingDriver] = useState<RouteDriver | null>(null);
  const [editingPlan, setEditingPlan] = useState<RoutePlan | null>(null);
  const [editingHoliday, setEditingHoliday] =
    useState<OperationalHoliday | null>(null);
  const [editingDivergence, setEditingDivergence] =
    useState<RouteDivergence | null>(null);
  const competency =
    state.routeCompetencies.find((item) => item.id === competencyId) ||
    state.routeCompetencies[0];
  const registered = state.routes.filter((item) => item.registered).length;
  const checked = state.routes.filter((item) => item.checked).length;
  const pending = state.routes.filter((item) => !item.registered);
  const routeName = (row: RouteRecord, index = 0) =>
    row.routeName ||
    state.routePlans[index % Math.max(1, state.routePlans.length)]?.name ||
    row.base;
  const filtered = state.routes.filter((row, index) => {
    const name = routeName(row, index);
    return (
      (driverFilter === "Todos" || row.driver === driverFilter) &&
      (statusFilter === "Todos" ||
        (statusFilter === "Cadastrado" && row.registered) ||
        (statusFilter === "Não cadastrado" && !row.registered) ||
        (statusFilter === "Conferido" && row.checked) ||
        (statusFilter === "Divergente" && row.registered && !row.checked)) &&
      [row.client, row.driver, row.notes, row.time, name]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });
  const registrationRows = useMemo(
    () =>
      state.routes.filter((row, index) => {
        const name = routeName(row, index);
        return (
          (!registerOnlyPending || !row.registered) &&
          (registerRouteFilter === "Todas" || name === registerRouteFilter) &&
          [row.client, row.driver, row.notes, row.time, name]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())
        );
      }),
    [
      registerOnlyPending,
      registerRouteFilter,
      search,
      state.routes,
      state.routePlans,
    ],
  );
  const plannerEvents: PlannerEvent[] = [
    ...state.routeHolidays.map((holiday) => ({
      id: holiday.id,
      title: `${holiday.name} · ${holiday.routeBase}`,
      date: holiday.date,
      start: "08:00",
      end: "09:00",
      color: "#dc2626",
      category: "Feriados",
      status: holiday.status,
      meta: holiday.notes,
    })),
    ...state.routePlans.slice(0, 12).map((plan, index) => ({
      id: plan.id,
      title: `${plan.name} · ${plan.departure}`,
      date: `2026-09-${String((index % 20) + 1).padStart(2, "0")}`,
      start: plan.departure,
      end: plan.returnTime,
      color: plan.type === "Feriado" ? "#dc2626" : "#2563eb",
      category: "Rotas",
      status: plan.status,
      meta: `${plan.shift} · ${plan.trips.join(", ")}`,
    })),
  ];

  function editRouteField(
    id: string,
    field: keyof RouteRecord,
    value: unknown,
  ) {
    commit(`Alterou ${String(field)} da parada ${id}`, (draft) => {
      const row = draft.routes.find((item) => item.id === id);
      if (row) (row as unknown as Record<string, unknown>)[field] = value;
    });
  }

  function bulkMove() {
    if (!selected.length || !moveTarget)
      return toast.error("Selecione paradas e a rota de destino");
    const target = state.routePlans.find((item) => item.id === moveTarget);
    commit(
      `Realocou ${selected.length} paradas para ${target?.name}`,
      (draft) => {
        draft.routes
          .filter((item) => selected.includes(item.id))
          .forEach((item) => {
            item.routeName = target?.name;
            item.driver =
              draft.routeDrivers.find(
                (driver) => driver.id === target?.driverId,
              )?.shortName || item.driver;
            item.shift = target?.shift;
            item.alert = "REALOCADO - nova conferência necessária";
            item.checked = false;
          });
      },
    );
    setSelected([]);
    toast.success("Paradas realocadas e conferência reaberta");
  }

  function exportCsv(rows = filtered) {
    const header = [
      "ordem",
      "horario",
      "cliente",
      "ponto",
      "motorista",
      "rota",
      "turno",
      "viagem",
      "produto",
      "quantidade",
      "regra",
      "cadastrado",
      "conferido",
      "observacoes",
    ];
    const body = rows.map((row, index) =>
      [
        row.order || index + 1,
        row.time,
        row.client,
        row.point || "Principal",
        row.driver,
        routeName(row, index),
        row.shift || "Manhã",
        row.trip || row.batch,
        row.product || "Pães",
        row.quantity || `${row.french || 0}/${row.milk || 0}`,
        row.rule,
        row.registered ? "Sim" : "Não",
        row.checked ? "Sim" : "Não",
        row.notes,
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(";"),
    );
    const blob = new Blob([[header.join(";"), ...body].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BASE_ROTAS_${competency?.label.replace("/", "_")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function saveDriver(event: FormEvent) {
    event.preventDefault();
    if (!editingDriver?.name.trim()) return;
    const item = { ...editingDriver, id: editingDriver.id || uid("driver") };
    commit(
      `${editingDriver.id ? "Editou" : "Cadastrou"} motorista ${item.name}`,
      (draft) => {
        const index = draft.routeDrivers.findIndex(
          (entry) => entry.id === item.id,
        );
        if (index >= 0) draft.routeDrivers[index] = item;
        else draft.routeDrivers.unshift(item);
      },
    );
    setEditingDriver(null);
  }

  function savePlan(event: FormEvent) {
    event.preventDefault();
    if (!editingPlan?.name.trim()) return;
    const item = { ...editingPlan, id: editingPlan.id || uid("route") };
    commit(
      `${editingPlan.id ? "Editou" : "Criou"} rota ${item.name}`,
      (draft) => {
        const index = draft.routePlans.findIndex(
          (entry) => entry.id === item.id,
        );
        if (index >= 0) draft.routePlans[index] = item;
        else draft.routePlans.unshift(item);
      },
    );
    setEditingPlan(null);
  }

  function saveHoliday(event: FormEvent) {
    event.preventDefault();
    if (!editingHoliday?.name.trim()) return;
    const item = { ...editingHoliday, id: editingHoliday.id || uid("holiday") };
    commit(
      `${editingHoliday.id ? "Editou" : "Criou"} feriado ${item.name}`,
      (draft) => {
        const index = draft.routeHolidays.findIndex(
          (entry) => entry.id === item.id,
        );
        if (index >= 0) draft.routeHolidays[index] = item;
        else draft.routeHolidays.unshift(item);
      },
    );
    setEditingHoliday(null);
  }

  function saveDivergence(event: FormEvent) {
    event.preventDefault();
    if (!editingDivergence?.client.trim()) return;
    const item = {
      ...editingDivergence,
      id: editingDivergence.id || uid("divergence"),
    };
    commit("Registrou divergência", (draft) => {
      const index = draft.routeDivergences.findIndex(
        (entry) => entry.id === item.id,
      );
      if (index >= 0) draft.routeDivergences[index] = item;
      else draft.routeDivergences.unshift(item);
    });
    setEditingDivergence(null);
  }

  const tabs = [
    ["overview", "Visão geral"],
    ["planner", "Planner"],
    ["base", "Base mensal"],
    ["register", "Consulta para cadastro"],
    ["next", "Próximo mês"],
    ["routes", "Rotas"],
    ["map", "Mapa"],
    ["stops", "Clientes e paradas"],
    ["drivers", "Motoristas"],
    ["rules", "Regras"],
    ["holidays", "Feriados"],
    ["conference", "Conferência"],
    ["pending", "Pendências"],
    ["history", "Histórico e versões"],
    ["indicators", "Indicadores"],
    ["reports", "Relatórios"],
    ["settings", "Configurações"],
  ];

  return (
    <>
      <div className="route-command-head">
        <div>
          <p>Central de planejamento operacional</p>
          <h1>Rotas, entregas e competências</h1>
          <span>
            Base oficial para preparar e conferir o sistema externo de pedidos.
          </span>
        </div>
        <div className="competency-selector">
          <Button variant="ghost" size="icon">
            <ChevronLeft />
          </Button>
          <NativeSelect
            value={competencyId}
            onChange={(event) => setCompetencyId(event.target.value)}
          >
            {state.routeCompetencies.map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button variant="ghost" size="icon">
            <ChevronRight />
          </Button>
          <Status>{competency?.status}</Status>
        </div>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="route-center-tabs">
        <TabsList className="route-center-tablist">
          {tabs.map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <div className="route-stats-grid">
            <Stat
              label="Entregas previstas"
              value={state.routes.length}
              detail={`${state.routePlans.length} rotas`}
              icon={Route}
            />
            <Stat
              label="Cadastradas"
              value={registered}
              detail={`${pct(registered, state.routes.length)}% da competência`}
              icon={ClipboardCheck}
            />
            <Stat
              label="Verificadas"
              value={checked}
              detail={`${pct(checked, state.routes.length)}% conferido`}
              icon={CheckCircle2}
            />
            <Stat
              label="Divergências abertas"
              value={
                state.routeDivergences.filter(
                  (item) => item.status !== "Fechada",
                ).length
              }
              detail="exigem correção"
              icon={AlertTriangle}
            />
            <Stat
              label="Feriado próximo"
              value={
                state.routeHolidays[0]?.date
                  .slice(5)
                  .split("-")
                  .reverse()
                  .join("/") || "-"
              }
              detail={state.routeHolidays[0]?.name || "nenhum"}
              icon={CalendarDays}
            />
            <Stat
              label="Motoristas ativos"
              value={
                state.routeDrivers.filter((item) => item.status === "Ativo")
                  .length
              }
              detail="cadastro operacional"
              icon={Truck}
            />
          </div>
          <div className="route-overview-grid">
            <Card>
              <CardHeader>
                <CardTitle>Progresso da competência</CardTitle>
                <CardDescription>
                  {competency?.label} · versão {competency?.version}
                </CardDescription>
              </CardHeader>
              <CardContent className="progress-stack">
                {[
                  ["Preparação", competency?.preparation],
                  ["Confirmações", competency?.confirmations],
                  ["Cadastro", competency?.registration],
                  ["Conferência", competency?.conference],
                  ["Correção", competency?.correction],
                  ["Publicação", competency?.publication],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <span>
                      <strong>{label}</strong>
                      <em>{Number(value)}%</em>
                    </span>
                    <Progress value={Number(value)} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>O que precisa ser feito primeiro</CardTitle>
                <CardDescription>
                  Prioridades da próxima competência
                </CardDescription>
              </CardHeader>
              <CardContent className="priority-stack">
                {[
                  "Preparar sábado do primeiro fim de semana.",
                  "Confirmar rota especial do feriado 07/09.",
                  `Cadastrar ${pending.length} entregas pendentes.`,
                  "Corrigir divergência do Cliente ABC.",
                  "Rever alterações realizadas após conferência.",
                ].map((item, index) => (
                  <button
                    key={item}
                    onClick={() =>
                      setTab(
                        index === 1
                          ? "holidays"
                          : index === 2
                            ? "register"
                            : "conference",
                      )
                    }
                  >
                    <b>{index + 1}</b>
                    <span>{item}</span>
                    <ChevronRight />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="planner">
          <PlannerCalendar
            title="Planner operacional"
            events={plannerEvents}
            onCreate={() => setEditingHoliday({ ...blankHoliday })}
            onSelect={(event) =>
              toast.info(`${event.title} · ${event.meta || "Sem observações"}`)
            }
          />
        </TabsContent>

        <TabsContent value="base">
          <Card>
            <CardHeader className="route-table-head">
              <div>
                <CardTitle>Base mensal operacional</CardTitle>
                <CardDescription>
                  Edição direta, filtros, seleção e realocação em lote.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => exportCsv()}>
                <Download /> CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="route-filterbar">
                <div>
                  <Search />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cliente, rota, motorista ou observação"
                  />
                </div>
                <NativeSelect
                  value={driverFilter}
                  onChange={(event) => setDriverFilter(event.target.value)}
                >
                  <NativeSelectOption>Todos</NativeSelectOption>
                  {state.routeDrivers.map((item) => (
                    <NativeSelectOption key={item.id}>
                      {item.shortName}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <NativeSelect
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  {[
                    "Todos",
                    "Cadastrado",
                    "Não cadastrado",
                    "Conferido",
                    "Divergente",
                  ].map((value) => (
                    <NativeSelectOption key={value}>{value}</NativeSelectOption>
                  ))}
                </NativeSelect>
                <span>{filtered.length} paradas</span>
              </div>
              {selected.length > 0 && (
                <div className="bulk-route-actions">
                  <strong>{selected.length} selecionadas</strong>
                  <NativeSelect
                    value={moveTarget}
                    onChange={(event) => setMoveTarget(event.target.value)}
                  >
                    <NativeSelectOption value="">
                      Mover para rota...
                    </NativeSelectOption>
                    {state.routePlans.map((plan) => (
                      <NativeSelectOption key={plan.id} value={plan.id}>
                        {plan.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <Button onClick={bulkMove}>
                    <ArrowLeftRight /> Realocar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      commit(
                        `Marcou ${selected.length} entregas como cadastradas`,
                        (draft) =>
                          draft.routes
                            .filter((item) => selected.includes(item.id))
                            .forEach((item) => (item.registered = true)),
                      )
                    }
                  >
                    Marcar cadastradas
                  </Button>
                </div>
              )}
              <div className="table-shell route-master-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Checkbox
                          checked={
                            selected.length === filtered.slice(0, 80).length &&
                            filtered.length > 0
                          }
                          onCheckedChange={(checked) =>
                            setSelected(
                              checked
                                ? filtered.slice(0, 80).map((item) => item.id)
                                : [],
                            )
                          }
                        />
                      </TableHead>
                      <TableHead>Ordem</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Cliente / ponto</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Rota</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead>Viagem</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice(0, 80).map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Checkbox
                            checked={selected.includes(row.id)}
                            onCheckedChange={(checked) =>
                              setSelected(
                                checked
                                  ? [...selected, row.id]
                                  : selected.filter((id) => id !== row.id),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.order || index + 1}
                            onChange={(event) =>
                              editRouteField(
                                row.id,
                                "order",
                                Number(event.target.value),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            value={row.time}
                            onChange={(event) =>
                              editRouteField(row.id, "time", event.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <strong>{row.client}</strong>
                          <small>{row.point || "Ponto principal"}</small>
                          {row.alert && <em>{row.alert}</em>}
                        </TableCell>
                        <TableCell>
                          <NativeSelect
                            value={row.driver}
                            onChange={(event) =>
                              editRouteField(
                                row.id,
                                "driver",
                                event.target.value,
                              )
                            }
                          >
                            {state.routeDrivers.map((item) => (
                              <NativeSelectOption key={item.id}>
                                {item.shortName}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </TableCell>
                        <TableCell>
                          <NativeSelect
                            value={routeName(row, index)}
                            onChange={(event) =>
                              editRouteField(
                                row.id,
                                "routeName",
                                event.target.value,
                              )
                            }
                          >
                            {state.routePlans.map((item) => (
                              <NativeSelectOption key={item.id}>
                                {item.name}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </TableCell>
                        <TableCell>
                          <NativeSelect
                            value={row.shift || "Manhã"}
                            onChange={(event) =>
                              editRouteField(
                                row.id,
                                "shift",
                                event.target.value,
                              )
                            }
                          >
                            {["Manhã", "Tarde", "Noite", "Retirada"].map(
                              (value) => (
                                <NativeSelectOption key={value}>
                                  {value}
                                </NativeSelectOption>
                              ),
                            )}
                          </NativeSelect>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.trip || row.batch}
                            onChange={(event) =>
                              editRouteField(row.id, "trip", event.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={
                              row.quantity ||
                              Number(row.french || row.milk || 0)
                            }
                            onChange={(event) =>
                              editRouteField(
                                row.id,
                                "quantity",
                                Number(event.target.value),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="dual-check">
                            <label>
                              <Checkbox
                                checked={row.registered}
                                onCheckedChange={(checked) =>
                                  editRouteField(
                                    row.id,
                                    "registered",
                                    Boolean(checked),
                                  )
                                }
                              />{" "}
                              Cad.
                            </label>
                            <label>
                              <Checkbox
                                checked={row.checked}
                                onCheckedChange={(checked) => {
                                  editRouteField(
                                    row.id,
                                    "checked",
                                    Boolean(checked),
                                  );
                                  if (checked)
                                    editRouteField(row.id, "registered", true);
                                }}
                              />{" "}
                              Conf.
                            </label>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="register">
          <Card>
            <CardHeader className="route-table-head">
              <div>
                <CardTitle>O que preciso cadastrar?</CardTitle>
                <CardDescription>
                  Fila operacional limpa, agrupada e pronta para usar ao lado do
                  sistema externo de pedidos.
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  const ids = registrationRows
                    .slice(0, 25)
                    .map((item) => item.id);
                  commit("Marcou lote como cadastrado", (draft) =>
                    draft.routes
                      .filter((item) => ids.includes(item.id))
                      .forEach((item) => (item.registered = true)),
                  );
                  toast.success("Lote marcado como cadastrado");
                }}
              >
                <CheckCircle2 /> Marcar lote visível
              </Button>
            </CardHeader>
            <CardContent>
              <div className="registration-summary">
                <div>
                  <ClipboardCheck />
                  <span>
                    <small>Pendentes</small>
                    <strong>
                      {state.routes.filter((item) => !item.registered).length}
                    </strong>
                  </span>
                </div>
                <div>
                  <CheckCircle2 />
                  <span>
                    <small>Cadastradas</small>
                    <strong>{registered}</strong>
                  </span>
                </div>
                <div>
                  <AlertTriangle />
                  <span>
                    <small>Sob demanda</small>
                    <strong>
                      {
                        state.routes.filter(
                          (item) =>
                            item.rule === "sob-demanda" && !item.registered,
                        ).length
                      }
                    </strong>
                  </span>
                </div>
              </div>
              <div className="registration-toolbar">
                <div>
                  <Search />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar cliente, rota, motorista ou observação"
                  />
                </div>
                <NativeSelect
                  value={registerRouteFilter}
                  onChange={(event) =>
                    setRegisterRouteFilter(event.target.value)
                  }
                >
                  <NativeSelectOption>Todas</NativeSelectOption>
                  {state.routePlans.map((plan) => (
                    <NativeSelectOption key={plan.id}>
                      {plan.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <label>
                  <Switch
                    checked={registerOnlyPending}
                    onCheckedChange={setRegisterOnlyPending}
                  />
                  <span>Somente pendentes</span>
                </label>
                <strong>{registrationRows.length} resultados</strong>
              </div>
              <div className="registration-board">
                {registrationRows.slice(0, 60).map((row, index) => (
                  <article
                    key={row.id}
                    className={row.rule === "sob-demanda" ? "is-demand" : ""}
                  >
                    <div className="registration-order">
                      <b>{row.order || index + 1}</b>
                      <small>{row.time}</small>
                    </div>
                    <div className="registration-main">
                      <span>
                        <strong>{row.client}</strong>
                        <Status>
                          {row.rule === "sob-demanda"
                            ? "Confirmar antes"
                            : row.registered
                              ? "Cadastrado"
                              : "Pendente"}
                        </Status>
                      </span>
                      <p>
                        {routeName(row, index)} · {row.driver} ·{" "}
                        {row.trip || row.batch}
                      </p>
                      <small>{row.notes || "Sem observação importante"}</small>
                    </div>
                    <div className="registration-actions">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          editRouteField(row.id, "checked", !row.checked)
                        }
                      >
                        {row.checked ? "Conferido" : "Conferir"}
                      </Button>
                      <Button
                        size="sm"
                        disabled={row.registered}
                        onClick={() =>
                          editRouteField(row.id, "registered", true)
                        }
                      >
                        {row.registered ? (
                          <>
                            <CheckCircle2 /> Feito
                          </>
                        ) : (
                          "Marcar cadastrado"
                        )}
                      </Button>
                    </div>
                  </article>
                ))}
                {!registrationRows.length && (
                  <div className="empty-state">
                    <CheckCircle2 />
                    <strong>Nenhuma entrega nesta seleção</strong>
                    <small>
                      Altere os filtros ou desative “Somente pendentes”.
                    </small>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="next">
          <div className="route-overview-grid">
            <Card>
              <CardHeader>
                <CardTitle>Preparação automática</CardTitle>
                <CardDescription>
                  Próxima competência abre {state.settings.routePreparationDays}{" "}
                  dias antes do fim do mês.
                </CardDescription>
              </CardHeader>
              <CardContent className="stack">
                <p>
                  A cópia inteligente considera vigência, clientes ativos,
                  regras válidas, motoristas e feriados. Exceções temporárias
                  vencidas não são copiadas.
                </p>
                <Button
                  onClick={() =>
                    commit("Criou próxima competência", (draft) => {
                      const last = draft.routeCompetencies[0];
                      const month = last.month === 12 ? 1 : last.month + 1;
                      const year =
                        last.month === 12 ? last.year + 1 : last.year;
                      draft.routeCompetencies.unshift({
                        ...last,
                        id: uid("competency"),
                        label: `${String(month).padStart(2, "0")}/${year}`,
                        month,
                        year,
                        status: "Em preparação",
                        preparation: 10,
                        confirmations: 0,
                        registration: 0,
                        conference: 0,
                        correction: 0,
                        publication: 0,
                        version: 1,
                        official: false,
                      });
                    })
                  }
                >
                  <RefreshCw /> Gerar próxima competência
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Comparação com o mês anterior</CardTitle>
              </CardHeader>
              <CardContent className="comparison-list">
                {[
                  ["Novos", 4],
                  ["Removidos", 2],
                  ["Motorista alterado", 3],
                  ["Horário alterado", 11],
                  ["Quantidade alterada", 7],
                  ["Nova rota", 1],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <Button variant="ghost" size="sm">
                      Ver antes/depois
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="routes">
          <Card>
            <CardHeader className="route-table-head">
              <div>
                <CardTitle>Rotas administráveis</CardTitle>
                <CardDescription>
                  Crie do zero, duplique, edite, desative ou arquive.
                </CardDescription>
              </div>
              <Button onClick={() => setEditingPlan({ ...blankPlan })}>
                <Plus /> Nova rota
              </Button>
            </CardHeader>
            <CardContent className="route-plan-grid">
              {state.routePlans.map((plan) => (
                <article key={plan.id}>
                  <div>
                    <Route style={{ color: plan.color || "#f97316" }} />
                    <Status>{plan.status}</Status>
                  </div>
                  <h3>{plan.name}</h3>
                  <p>
                    {plan.code} · {plan.type} · {plan.shift}
                  </p>
                  <small>
                    {plan.days.join(", ")} · saída {plan.departure}
                  </small>
                  <span>
                    Motorista:{" "}
                    {state.routeDrivers.find(
                      (item) => item.id === plan.driverId,
                    )?.shortName || "Não definido"}
                  </span>
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingPlan({ ...plan })}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        commit(`Duplicou ${plan.name}`, (draft) =>
                          draft.routePlans.unshift({
                            ...plan,
                            id: uid("route"),
                            name: `${plan.name} - Cópia`,
                            code: `${plan.code}-C`,
                          }),
                        )
                      }
                    >
                      <Copy /> Duplicar
                    </Button>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map">
          <RouteMap state={state} />
        </TabsContent>

        <TabsContent value="stops">
          <Card>
            <CardHeader>
              <CardTitle>Clientes e pontos de entrega</CardTitle>
              <CardDescription>
                O mesmo cliente pode ter vários pontos, sem duplicar o cadastro
                principal.
              </CardDescription>
            </CardHeader>
            <CardContent className="stop-directory">
              {state.clients.slice(0, 30).map((client, index) => (
                <article key={client.id}>
                  <UsersRound />
                  <span>
                    <strong>{client.name}</strong>
                    <small>{client.address || "Endereço a completar"}</small>
                    <em>
                      {state.routes.filter((row) =>
                        row.client
                          .toLowerCase()
                          .includes(client.name.split(" ")[0].toLowerCase()),
                      ).length || 1}{" "}
                      ponto(s) · janela{" "}
                      {index % 2 ? "07:00-10:00" : "05:30-08:30"}
                    </em>
                  </span>
                  <Button variant="outline" size="sm">
                    Gerenciar pontos
                  </Button>
                </article>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers">
          <Card>
            <CardHeader className="route-table-head">
              <div>
                <CardTitle>Cadastro completo de motoristas</CardTitle>
                <CardDescription>
                  Disponibilidade, status, substitutos, turnos e rotas
                  vinculadas.
                </CardDescription>
              </div>
              <Button onClick={() => setEditingDriver({ ...blankDriver })}>
                <Plus /> Novo motorista
              </Button>
            </CardHeader>
            <CardContent className="driver-grid">
              {state.routeDrivers.map((driver) => (
                <article key={driver.id}>
                  <div className="driver-avatar">
                    {driver.shortName.slice(0, 2).toUpperCase()}
                  </div>
                  <span>
                    <h3>{driver.name}</h3>
                    <Status>{driver.status}</Status>
                    <p>
                      {driver.phone} · {driver.availability}
                    </p>
                    <small>
                      {driver.shifts.join(", ")} · {driver.linkedRoutes.length}{" "}
                      rota(s)
                    </small>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDriver({ ...driver })}
                  >
                    Editar
                  </Button>
                </article>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <div className="settings-cards">
            {[
              {
                title: "Pedidos",
                items: [
                  "Fixo",
                  "Variável",
                  "Sob demanda",
                  "Extraordinário",
                  "Suspenso",
                  "Cancelado",
                ],
              },
              {
                title: "Vigências",
                items: [
                  "Somente esta entrega",
                  "Nesta data",
                  "Nesta competência",
                  "Período personalizado",
                  "A partir desta data",
                  "Permanentemente",
                ],
              },
              {
                title: "Reorganização",
                items: [
                  "Trocar motorista",
                  "Mudar turno",
                  "Mover viagem",
                  "Realocar parada",
                  "Dividir rota",
                  "Unir rotas",
                ],
              },
              {
                title: "Automação",
                items: [
                  "Reabrir após alteração",
                  "Notificar revisor",
                  "Antecipar feriado",
                  "Bloquear publicação",
                  "Exigir justificativa",
                ],
              },
            ].map((group) => (
              <Card key={group.title}>
                <CardHeader>
                  <CardTitle>{group.title}</CardTitle>
                </CardHeader>
                <CardContent className="editable-rule-list">
                  {group.items.map((item) => (
                    <label key={item}>
                      <Switch defaultChecked />
                      <span>{item}</span>
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </label>
                  ))}
                  <Button variant="outline">
                    <Plus /> Nova regra
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="holidays">
          <Card>
            <CardHeader className="route-table-head">
              <div>
                <CardTitle>Feriados e notificações antecipadas</CardTitle>
                <CardDescription>
                  CRUD, rota própria e múltiplos alertas como no Google
                  Calendar.
                </CardDescription>
              </div>
              <Button onClick={() => setEditingHoliday({ ...blankHoliday })}>
                <Plus /> Novo feriado
              </Button>
            </CardHeader>
            <CardContent className="holiday-list">
              {state.routeHolidays.map((holiday) => (
                <article key={holiday.id}>
                  <div className="holiday-date">
                    <strong>{holiday.date.slice(8)}</strong>
                    <span>{holiday.date.slice(5, 7)}</span>
                  </div>
                  <span>
                    <h3>{holiday.name}</h3>
                    <p>
                      {holiday.type} · {holiday.locality} · base{" "}
                      {holiday.routeBase}
                    </p>
                    <small>
                      Alertas:{" "}
                      {holiday.notifications.map((day) => `${day}d`).join(", ")}{" "}
                      · {holiday.notes}
                    </small>
                  </span>
                  <Status>{holiday.status}</Status>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingHoliday({ ...holiday })}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        commit(`Duplicou feriado ${holiday.name}`, (draft) =>
                          draft.routeHolidays.unshift({
                            ...holiday,
                            id: uid("holiday"),
                            name: `${holiday.name} - Cópia`,
                          }),
                        )
                      }
                    >
                      <Copy /> Duplicar
                    </Button>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conference">
          <div className="route-overview-grid">
            <Card>
              <CardHeader className="route-table-head">
                <div>
                  <CardTitle>Divergências</CardTitle>
                  <CardDescription>
                    Aberta → Em correção → Corrigida → Conferida → Fechada
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setEditingDivergence({ ...blankDivergence })}
                >
                  <Plus /> Registrar divergência
                </Button>
              </CardHeader>
              <CardContent className="divergence-list">
                {state.routeDivergences.map((item) => (
                  <article key={item.id}>
                    <AlertTriangle />
                    <span>
                      <strong>
                        {item.client} · {item.type}
                      </strong>
                      <p>
                        Esperado: {item.expected} · Encontrado: {item.found}
                      </p>
                      <small>{item.description}</small>
                    </span>
                    <Status>{item.status}</Status>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingDivergence({ ...item })}
                    >
                      Atualizar
                    </Button>
                  </article>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Validação da competência</CardTitle>
              </CardHeader>
              <CardContent className="validation-list">
                {[
                  ["Entregas não cadastradas", pending.length],
                  [
                    "Sem horário",
                    state.routes.filter((item) => !item.time).length,
                  ],
                  [
                    "Sem motorista",
                    state.routes.filter((item) => !item.driver).length,
                  ],
                  [
                    "Aguardando confirmação",
                    state.routes.filter(
                      (item) => item.rule === "sob-demanda" && !item.registered,
                    ).length,
                  ],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
                <Button
                  onClick={() =>
                    pending.length
                      ? toast.warning(
                          "Existem entregas pendentes; conclusão bloqueada",
                        )
                      : toast.success(
                          "Rota concluída e enviada para verificação",
                        )
                  }
                >
                  Concluir competência
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Central de pendências</CardTitle>
              <CardDescription>
                Bloqueios de conclusão, verificação e publicação.
              </CardDescription>
            </CardHeader>
            <CardContent className="pending-board">
              {[
                {
                  title: "Cadastro faltante",
                  count: pending.length,
                  priority: "Crítica",
                },
                {
                  title: "Cliente sem confirmação",
                  count: state.routes.filter(
                    (item) => item.rule === "sob-demanda" && !item.registered,
                  ).length,
                  priority: "Alta",
                },
                {
                  title: "Divergência",
                  count: state.routeDivergences.filter(
                    (item) => item.status !== "Fechada",
                  ).length,
                  priority: "Alta",
                },
                {
                  title: "Conferência faltante",
                  count: state.routes.filter(
                    (item) => item.registered && !item.checked,
                  ).length,
                  priority: "Média",
                },
                {
                  title: "Feriado",
                  count: state.routeHolidays.length,
                  priority: "Alta",
                },
              ].map((item) => (
                <article key={item.title}>
                  <AlertTriangle />
                  <span>
                    <strong>{item.title}</strong>
                    <small>Bloqueia publicação conforme regra do ADM</small>
                  </span>
                  <b>{item.count}</b>
                  <Status>{item.priority}</Status>
                </article>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <div className="route-overview-grid">
            <Card>
              <CardHeader>
                <CardTitle>Versões da competência</CardTitle>
                <CardDescription>
                  Uma única versão oficial; restaurar sempre cria nova versão.
                </CardDescription>
              </CardHeader>
              <CardContent className="version-list">
                {state.routeVersions
                  .filter((item) => item.competencyId === competencyId)
                  .map((version) => (
                    <article key={version.id}>
                      <FileClock />
                      <span>
                        <strong>
                          Versão {version.version}{" "}
                          {version.official && "· OFICIAL"}
                        </strong>
                        <small>
                          {new Date(version.createdAt).toLocaleString("pt-BR")}{" "}
                          · {version.createdBy}
                        </small>
                        <p>{version.summary}</p>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          commit(
                            `Restaurou versão ${version.version}`,
                            (draft) => {
                              const current = draft.routeCompetencies.find(
                                (item) => item.id === competencyId,
                              );
                              const nextVersion =
                                Math.max(
                                  ...draft.routeVersions.map(
                                    (item) => item.version,
                                  ),
                                ) + 1;
                              draft.routeVersions.unshift({
                                ...version,
                                id: uid("version"),
                                version: nextVersion,
                                createdAt: new Date().toISOString(),
                                createdBy: user,
                                official: false,
                                summary: `Restauração da versão ${version.version}`,
                              });
                              if (current) current.version = nextVersion;
                            },
                          )
                        }
                      >
                        Restaurar como nova
                      </Button>
                    </article>
                  ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Histórico completo de atividades</CardTitle>
              </CardHeader>
              <CardContent className="audit-list">
                {state.audit.slice(0, 40).map((entry, index) => (
                  <div key={`${entry.at}-${index}`}>
                    <History />
                    <span>
                      <strong>{entry.user}</strong>
                      <small>{entry.action}</small>
                    </span>
                    <time>{new Date(entry.at).toLocaleString("pt-BR")}</time>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="indicators">
          <div className="route-stats-grid">
            <Stat
              label="Tempo médio por rota"
              value="1h 42m"
              detail="-12% versus agosto"
              icon={CircleGauge}
            />
            <Stat
              label="Tempo por parada"
              value="2m 18s"
              detail="cadastro e conferência"
              icon={FileClock}
            />
            <Stat
              label="Taxa de divergência"
              value={`${pct(state.routeDivergences.length, state.routes.length)}%`}
              detail="qualidade do cadastro"
              icon={AlertTriangle}
            />
            <Stat
              label="Retrabalho"
              value={
                state.routeDivergences.filter(
                  (item) => item.status === "Em correção",
                ).length
              }
              detail="itens em correção"
              icon={RefreshCw}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Indicadores por rota</CardTitle>
            </CardHeader>
            <CardContent className="route-indicator-bars">
              {state.routePlans.map((plan, index) => {
                const value = 64 + ((index * 11) % 35);
                return (
                  <div key={plan.id}>
                    <span>
                      <strong>{plan.name}</strong>
                      <small>
                        {8 + index * 3} paradas · {index} divergência(s)
                      </small>
                    </span>
                    <Progress value={value} />
                    <b>{value}%</b>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios e exportações</CardTitle>
              <CardDescription>
                PDF, Excel/XLSX, CSV e modo limpo para impressão.
              </CardDescription>
            </CardHeader>
            <CardContent className="report-action-grid">
              {[
                "Base mensal",
                "Rota diária",
                "Rota por motorista",
                "Rota por feriado",
                "Divergências",
                "Pendências",
                "Alterações",
                "Histórico",
                "Conclusões",
                "Verificações",
                "Indicadores",
                "Comparação entre meses",
              ].map((name) => (
                <article key={name}>
                  <Download />
                  <span>
                    <strong>{name}</strong>
                    <small>{competency?.label}</small>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      name === "Base mensal" ? exportCsv() : window.print()
                    }
                  >
                    Emitir
                  </Button>
                </article>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="settings-cards">
            <Card>
              <CardHeader>
                <CardTitle>Competência</CardTitle>
              </CardHeader>
              <CardContent className="stack">
                <Label>Antecedência para abrir o próximo mês</Label>
                <Input
                  type="number"
                  value={state.settings.routePreparationDays}
                  onChange={(event) =>
                    commit("Alterou antecedência da competência", (draft) => {
                      draft.settings.routePreparationDays = Number(
                        event.target.value,
                      );
                    })
                  }
                />
                <Label>Status disponíveis</Label>
                <Textarea
                  value={state.settings.competencyStatuses.join("\n")}
                  onChange={(event) =>
                    commit("Alterou status de competência", (draft) => {
                      draft.settings.competencyStatuses = event.target.value
                        .split("\n")
                        .filter(Boolean);
                    })
                  }
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Conferência</CardTitle>
              </CardHeader>
              <CardContent className="stack">
                <label className="switch-line">
                  <span>Permitir auto-verificação</span>
                  <Switch
                    checked={state.settings.allowSelfVerification}
                    onCheckedChange={(checked) =>
                      commit("Alterou auto-verificação", (draft) => {
                        draft.settings.allowSelfVerification = checked;
                      })
                    }
                  />
                </label>
                <p>
                  Quando desativado, quem concluiu não pode verificar a própria
                  rota.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tipos e status</CardTitle>
              </CardHeader>
              <CardContent className="stack">
                <Label>Status de rota</Label>
                <Textarea
                  value={state.settings.routeStatuses.join("\n")}
                  onChange={(event) =>
                    commit("Alterou status de rota", (draft) => {
                      draft.settings.routeStatuses = event.target.value
                        .split("\n")
                        .filter(Boolean);
                    })
                  }
                />
                <Label>Status de motorista</Label>
                <Textarea
                  value={state.settings.driverStatuses.join("\n")}
                  onChange={(event) =>
                    commit("Alterou status de motorista", (draft) => {
                      draft.settings.driverStatuses = event.target.value
                        .split("\n")
                        .filter(Boolean);
                    })
                  }
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(editingDriver)}
        onOpenChange={(open) => !open && setEditingDriver(null)}
      >
        <DialogContent className="dialog-wide">
          {editingDriver && (
            <form onSubmit={saveDriver}>
              <DialogHeader>
                <DialogTitle>
                  {editingDriver.id ? "Editar motorista" : "Novo motorista"}
                </DialogTitle>
                <DialogDescription>
                  Dados, disponibilidade, substituto e vínculos operacionais.
                </DialogDescription>
              </DialogHeader>
              <div className="form-grid">
                {[
                  ["Nome completo", "name"],
                  ["Nome curto", "shortName"],
                  ["Telefone", "phone"],
                  ["Empresa/unidade", "company"],
                  ["Disponibilidade", "availability"],
                ].map(([label, key]) => (
                  <div className="field" key={key}>
                    <Label>{label}</Label>
                    <Input
                      value={String(
                        editingDriver[key as keyof RouteDriver] || "",
                      )}
                      onChange={(event) =>
                        setEditingDriver({
                          ...editingDriver,
                          [key]: event.target.value,
                        })
                      }
                    />
                  </div>
                ))}
                <div className="field">
                  <Label>Status</Label>
                  <NativeSelect
                    value={editingDriver.status}
                    onChange={(event) =>
                      setEditingDriver({
                        ...editingDriver,
                        status: event.target.value,
                      })
                    }
                  >
                    {state.settings.driverStatuses.map((value) => (
                      <NativeSelectOption key={value}>
                        {value}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="field">
                  <Label>Substituto padrão</Label>
                  <NativeSelect
                    value={editingDriver.substituteId}
                    onChange={(event) =>
                      setEditingDriver({
                        ...editingDriver,
                        substituteId: event.target.value,
                      })
                    }
                  >
                    <NativeSelectOption value="">Nenhum</NativeSelectOption>
                    {state.routeDrivers
                      .filter((item) => item.id !== editingDriver.id)
                      .map((item) => (
                        <NativeSelectOption key={item.id} value={item.id}>
                          {item.name}
                        </NativeSelectOption>
                      ))}
                  </NativeSelect>
                </div>
                <div className="field full">
                  <Label>Dias de operação</Label>
                  <div className="selector-grid">
                    {dayNames.map((day) => (
                      <label key={day}>
                        <Checkbox
                          checked={editingDriver.days.includes(day)}
                          onCheckedChange={(checked) =>
                            setEditingDriver({
                              ...editingDriver,
                              days: checked
                                ? [...editingDriver.days, day]
                                : editingDriver.days.filter(
                                    (item) => item !== day,
                                  ),
                            })
                          }
                        />{" "}
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="field full">
                  <Label>Observações</Label>
                  <Textarea
                    value={editingDriver.notes}
                    onChange={(event) =>
                      setEditingDriver({
                        ...editingDriver,
                        notes: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingDriver(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save /> Salvar motorista
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingPlan)}
        onOpenChange={(open) => !open && setEditingPlan(null)}
      >
        <DialogContent className="dialog-wide">
          {editingPlan && (
            <form onSubmit={savePlan}>
              <DialogHeader>
                <DialogTitle>
                  {editingPlan.id ? "Editar rota" : "Nova rota"}
                </DialogTitle>
                <DialogDescription>
                  Crie do zero ou ajuste toda a estrutura, vigência e
                  responsáveis.
                </DialogDescription>
              </DialogHeader>
              <div className="form-grid">
                {[
                  ["Nome", "name"],
                  ["Código", "code"],
                  ["Tipo", "type"],
                  ["Turno", "shift"],
                  ["Saída", "departure"],
                  ["Ponto de saída", "departurePoint"],
                  ["Retorno previsto", "returnTime"],
                  ["Início da vigência", "validityStart"],
                  ["Fim da vigência", "validityEnd"],
                ].map(([label, key]) => (
                  <div className="field" key={key}>
                    <Label>{label}</Label>
                    <Input
                      type={
                        key.includes("validity")
                          ? "date"
                          : key === "departure" || key === "returnTime"
                            ? "time"
                            : "text"
                      }
                      value={String(editingPlan[key as keyof RoutePlan] || "")}
                      onChange={(event) =>
                        setEditingPlan({
                          ...editingPlan,
                          [key]: event.target.value,
                        })
                      }
                    />
                  </div>
                ))}
                <div className="field">
                  <Label>Status</Label>
                  <NativeSelect
                    value={editingPlan.status}
                    onChange={(event) =>
                      setEditingPlan({
                        ...editingPlan,
                        status: event.target.value,
                      })
                    }
                  >
                    {state.settings.routeStatuses.map((value) => (
                      <NativeSelectOption key={value}>
                        {value}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="field">
                  <Label>Motorista padrão</Label>
                  <NativeSelect
                    value={editingPlan.driverId}
                    onChange={(event) =>
                      setEditingPlan({
                        ...editingPlan,
                        driverId: event.target.value,
                      })
                    }
                  >
                    <NativeSelectOption value="">Selecione</NativeSelectOption>
                    {state.routeDrivers.map((item) => (
                      <NativeSelectOption key={item.id} value={item.id}>
                        {item.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="field">
                  <Label>Cor da rota no mapa</Label>
                  <div className="route-color-field">
                    <Input
                      type="color"
                      value={editingPlan.color || "#f97316"}
                      onChange={(event) =>
                        setEditingPlan({
                          ...editingPlan,
                          color: event.target.value,
                        })
                      }
                    />
                    <Input
                      value={editingPlan.color || "#f97316"}
                      onChange={(event) =>
                        setEditingPlan({
                          ...editingPlan,
                          color: event.target.value,
                        })
                      }
                      aria-label="Código hexadecimal da cor"
                    />
                  </div>
                </div>
                <div className="field full">
                  <Label>Viagens (uma por linha)</Label>
                  <Textarea
                    value={editingPlan.trips.join("\n")}
                    onChange={(event) =>
                      setEditingPlan({
                        ...editingPlan,
                        trips: event.target.value.split("\n").filter(Boolean),
                      })
                    }
                  />
                </div>
                <div className="field full">
                  <Label>Observações</Label>
                  <Textarea
                    value={editingPlan.notes}
                    onChange={(event) =>
                      setEditingPlan({
                        ...editingPlan,
                        notes: event.target.value,
                      })
                    }
                  />
                </div>
                <label className="switch-line">
                  <span>Rota permanente</span>
                  <Switch
                    checked={editingPlan.permanent}
                    onCheckedChange={(checked) =>
                      setEditingPlan({ ...editingPlan, permanent: checked })
                    }
                  />
                </label>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPlan(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save /> Salvar rota
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingHoliday)}
        onOpenChange={(open) => !open && setEditingHoliday(null)}
      >
        <DialogContent>
          {editingHoliday && (
            <form onSubmit={saveHoliday}>
              <DialogHeader>
                <DialogTitle>
                  {editingHoliday.id ? "Editar feriado" : "Novo feriado"}
                </DialogTitle>
                <DialogDescription>
                  Defina rota, regra operacional e várias notificações.
                </DialogDescription>
              </DialogHeader>
              <div className="form-grid">
                <div className="field">
                  <Label>Nome</Label>
                  <Input
                    value={editingHoliday.name}
                    onChange={(event) =>
                      setEditingHoliday({
                        ...editingHoliday,
                        name: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="field">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={editingHoliday.date}
                    onChange={(event) =>
                      setEditingHoliday({
                        ...editingHoliday,
                        date: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="field">
                  <Label>Tipo</Label>
                  <NativeSelect
                    value={editingHoliday.type}
                    onChange={(event) =>
                      setEditingHoliday({
                        ...editingHoliday,
                        type: event.target.value,
                      })
                    }
                  >
                    {state.settings.holidayTypes.map((value) => (
                      <NativeSelectOption key={value}>
                        {value}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="field">
                  <Label>Localidade</Label>
                  <Input
                    value={editingHoliday.locality}
                    onChange={(event) =>
                      setEditingHoliday({
                        ...editingHoliday,
                        locality: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="field">
                  <Label>Rota de referência</Label>
                  <NativeSelect
                    value={editingHoliday.routeBase}
                    onChange={(event) =>
                      setEditingHoliday({
                        ...editingHoliday,
                        routeBase: event.target.value,
                      })
                    }
                  >
                    {[
                      "Semana",
                      "Sábado",
                      "Domingo",
                      "Personalizada",
                      "Sem entrega",
                    ].map((value) => (
                      <NativeSelectOption key={value}>
                        {value}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="field">
                  <Label>Alertas em dias</Label>
                  <Input
                    value={editingHoliday.notifications.join(", ")}
                    onChange={(event) =>
                      setEditingHoliday({
                        ...editingHoliday,
                        notifications: event.target.value
                          .split(",")
                          .map(Number)
                          .filter((value) => !Number.isNaN(value)),
                      })
                    }
                  />
                </div>
                <div className="field full">
                  <Label>Regra operacional</Label>
                  <Textarea
                    value={editingHoliday.operationalRule}
                    onChange={(event) =>
                      setEditingHoliday({
                        ...editingHoliday,
                        operationalRule: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="field full">
                  <Label>Observações</Label>
                  <Textarea
                    value={editingHoliday.notes}
                    onChange={(event) =>
                      setEditingHoliday({
                        ...editingHoliday,
                        notes: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingHoliday(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save /> Salvar feriado
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingDivergence)}
        onOpenChange={(open) => !open && setEditingDivergence(null)}
      >
        <DialogContent>
          {editingDivergence && (
            <form onSubmit={saveDivergence}>
              <DialogHeader>
                <DialogTitle>Registrar divergência</DialogTitle>
                <DialogDescription>
                  Registre esperado, encontrado, responsável e andamento.
                </DialogDescription>
              </DialogHeader>
              <div className="form-grid">
                {[
                  ["Cliente", "client"],
                  ["Data", "date"],
                  ["Tipo", "type"],
                  ["Esperado", "expected"],
                  ["Encontrado", "found"],
                  ["Responsável", "responsible"],
                  ["Prioridade", "priority"],
                  ["Status", "status"],
                ].map(([label, key]) => (
                  <div className="field" key={key}>
                    <Label>{label}</Label>
                    <Input
                      type={key === "date" ? "date" : "text"}
                      value={String(
                        editingDivergence[key as keyof RouteDivergence] || "",
                      )}
                      onChange={(event) =>
                        setEditingDivergence({
                          ...editingDivergence,
                          [key]: event.target.value,
                        })
                      }
                    />
                  </div>
                ))}
                <div className="field full">
                  <Label>Descrição</Label>
                  <Textarea
                    value={editingDivergence.description}
                    onChange={(event) =>
                      setEditingDivergence({
                        ...editingDivergence,
                        description: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingDivergence(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save /> Salvar divergência
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
