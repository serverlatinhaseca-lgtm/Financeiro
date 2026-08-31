"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability, @next/next/no-img-element */

import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
  Activity,
  Archive,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Copy,
  Download,
  FilePenLine,
  FileText,
  Gauge,
  History,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  PackageCheck,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Route,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Trash2,
  TriangleAlert,
  Upload,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AppState,
  Client,
  Collection,
  CustomerGroup,
  Emission,
  ModuleId,
  RouteRecord,
  Task,
  TaskNature,
  dayNames,
  seedState,
} from "@/app/lib/seed";
import {
  addDays,
  calculateDueDate,
  collectionGuidance,
  daysBetween,
  ensureFinancialSchedule,
  isoToday,
  normalizeFinancialState,
} from "@/app/lib/finance-rules";
import { FinancialRuleSettings } from "@/app/components/financial-rules";
import { AdminCenter } from "@/app/components/admin-center";
import { RouteOperationsCenter } from "@/app/components/route-operations-center";
import {
  PlannerCalendar,
  PlannerEvent,
} from "@/app/components/planner-calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
import { Toaster } from "@/components/ui/sonner";

type View = ModuleId;
type Commit = (action: string, recipe: (draft: AppState) => void) => void;
const nav: { id: View; label: string; icon: typeof Gauge }[] = [
  { id: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: UsersRound },
  { id: "financeiro", label: "Financeiro", icon: ReceiptText },
  { id: "cobrancas", label: "Cobranças", icon: WalletCards },
  { id: "tarefas", label: "Tarefas da equipe", icon: ListChecks },
  { id: "operacional", label: "Operacional", icon: PackageCheck },
  { id: "rotas", label: "Planejamento de rotas", icon: Route },
  { id: "documentos", label: "Documentos", icon: FileText },
  { id: "recados", label: "Recados", icon: MessageSquareText },
  { id: "relatorios", label: "Relatórios", icon: Activity },
  { id: "configuracoes", label: "Configurações", icon: Settings },
];
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const dateBR = (value: string) =>
  value
    ? new Date(
        value.length === 10 ? value + "T12:00:00" : value,
      ).toLocaleDateString("pt-BR")
    : "-";
const uid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const today = isoToday();

function statusTone(value: string) {
  const t = value.toLowerCase();
  if (t.includes("vermelho") || t.includes("cancel") || t.includes("atras"))
    return "danger";
  if (
    t.includes("amarelo") ||
    t.includes("andamento") ||
    t.includes("reagend") ||
    t.includes("pendente")
  )
    return "warning";
  if (
    t.includes("verde") ||
    t.includes("paga") ||
    t.includes("emitida") ||
    t.includes("conclu") ||
    t.includes("ativo")
  )
    return "success";
  return "neutral";
}
function Status({ children }: { children: ReactNode }) {
  return (
    <span className={`status status-${statusTone(String(children))}`}>
      {children}
    </span>
  );
}
function PageTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <span>{description}</span>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
function Metric({
  label,
  value,
  detail,
  icon: Icon,
  tone = "copper",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Gauge;
  tone?: string;
}) {
  return (
    <Card className={`metric metric-${tone}`}>
      <CardContent>
        <div className="metric-icon">
          <Icon />
        </div>
        <div>
          <span>{label}</span>
          <strong>{value}</strong>
          <small>{detail}</small>
        </div>
      </CardContent>
    </Card>
  );
}
function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`field ${full ? "full" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

type SessionUser = { name: string; email: string; role: string };
function Login({
  onSuccess,
  state,
}: {
  onSuccess: (user: SessionUser, token: string) => void;
  state: AppState;
}) {
  const [username, setUsername] = useState("admin"),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    let allowLocalFallback = false;
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (r.ok) {
        const data = await r.json();
        onSuccess(
          {
            name: data.user?.name ?? "Administrador",
            email: data.user?.email ?? `${username}@gestao.local`,
            role: data.user?.role ?? "Administrador",
          },
          data.token,
        );
        toast.success("Acesso liberado");
        return;
      }
      allowLocalFallback = [404, 502, 503, 504].includes(r.status);
      if (!allowLocalFallback) {
        toast.error("Usuário ou senha inválidos");
        setBusy(false);
        return;
      }
    } catch {
      allowLocalFallback = true;
    }
    if (!allowLocalFallback) return;
    const localAccount = state.settings.users.find(
      (account) =>
        account.active &&
        account.username?.toLowerCase() === username.toLowerCase() &&
        account.localPassword === password,
    );
    if (localAccount) {
      onSuccess(
        {
          name: localAccount.name,
          email: localAccount.email,
          role: localAccount.role,
        },
        "local-demo",
      );
      toast.success("Modo local iniciado");
    } else toast.error("Credenciais inválidas");
    setBusy(false);
  }
  const appearance = state.settings.appearance;
  return (
    <main
      className="login-shell"
      style={
        appearance.loginBackground
          ? {
              backgroundImage: `linear-gradient(90deg, rgba(21,34,48,.94), rgba(21,34,48,.74)), url(${appearance.loginBackground})`,
            }
          : undefined
      }
    >
      <section className="login-brand">
        <div className="login-logo">
          <img src={appearance.logo} alt={appearance.appName} />
        </div>
        <p>PLATAFORMA INTERNA · NOVA ESPERANÇA</p>
        <h1>{appearance.tagline}</h1>
        <div className="login-list">
          <span>
            <CheckCircle2 /> Módulos completos com abas e fluxos próprios
          </span>
          <span>
            <CheckCircle2 /> Perfis e permissões personalizados pelo ADM
          </span>
          <span>
            <CheckCircle2 /> Identidade, regras e campos editáveis
          </span>
        </div>
        <div className="login-partners">
          <span>Operação integrada com</span>
          <img
            src="/brand/excelencia-do-pao-nova.png"
            alt="Excelência do Pão"
          />
        </div>
      </section>
      <section className="login-panel">
        <form onSubmit={submit}>
          <div className="login-mark">
            <ShieldCheck />
            <span>Acesso seguro</span>
          </div>
          <h2>Entrar no sistema</h2>
          <p>Use seu acesso corporativo para continuar.</p>
          <Label htmlFor="username">Nome de usuário</Label>
          <Input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Entrando..." : "Entrar"}
          </Button>
          <small>
            Servidor: use a senha exibida pelo install.sh · Demonstração:
            Admin@123
          </small>
        </form>
      </section>
    </main>
  );
}

export default function Home() {
  const [logged, setLogged] = useState(false),
    [session, setSession] = useState<SessionUser>({
      name: "Administrador",
      email: "admin@gestao.local",
      role: "Administrador",
    }),
    [token, setToken] = useState(""),
    [view, setView] = useState<View>("dashboard"),
    [state, setState] = useState<AppState>(() =>
      ensureFinancialSchedule(seedState),
    ),
    [hydrated, setHydrated] = useState(false),
    [darkMode, setDarkMode] = useState(false),
    [notificationsOpen, setNotificationsOpen] = useState(false);
  useEffect(() => {
    const t = localStorage.getItem("gestao-token") ?? "",
      stored = localStorage.getItem("gestao-session"),
      s = localStorage.getItem("gestao-state");
    if (t) {
      setToken(t);
      if (stored)
        try {
          setSession(JSON.parse(stored));
        } catch {}
      setLogged(true);
    }
    if (s)
      try {
        setState(normalizeFinancialState(JSON.parse(s)));
      } catch {
        localStorage.removeItem("gestao-state");
      }
    setDarkMode(localStorage.getItem("gestao-dark") === "1");
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("gestao-state", JSON.stringify(state));
    if (token && token !== "local-demo")
      fetch("/api/state", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(state),
      }).catch(() => undefined);
  }, [state, hydrated, token]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("gestao-dark", darkMode ? "1" : "0");
  }, [darkMode, hydrated]);
  useEffect(() => {
    const appearance = state.settings.appearance;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = appearance.favicon || appearance.thumbnail || appearance.logo;
    document.title = appearance.appName;
  }, [state.settings.appearance]);
  const commit: Commit = (action, recipe) =>
    setState((previous) => {
      const next = structuredClone(previous);
      recipe(next);
      next.audit.unshift({
        at: new Date().toISOString(),
        user: session.name,
        action,
      });
      next.audit = next.audit.slice(0, 250);
      return next;
    });
  async function signIn(account: SessionUser, nextToken: string) {
    localStorage.setItem("gestao-token", nextToken);
    localStorage.setItem("gestao-session", JSON.stringify(account));
    if (nextToken !== "local-demo") {
      try {
        const response = await fetch("/api/state", {
          headers: { authorization: `Bearer ${nextToken}` },
        });
        if (response.ok) {
          const remote = await response.json();
          if (remote.payload && Object.keys(remote.payload).length > 0)
            setState(normalizeFinancialState(remote.payload));
        }
      } catch {
        /* A interface continua disponível com a base local. */
      }
    }
    setSession(account);
    setToken(nextToken);
    setLogged(true);
  }
  function logout() {
    localStorage.removeItem("gestao-token");
    setLogged(false);
    setToken("");
  }
  if (!hydrated)
    return (
      <div className="loading">
        <RefreshCw className="animate-spin" /> Preparando o sistema...
      </div>
    );
  if (!logged) return <Login onSuccess={signIn} state={state} />;
  const account =
    state.settings.users.find((item) => item.email === session.email) ||
    state.settings.users.find((item) => item.role === session.role);
  const profile =
    state.settings.profiles.find((item) => item.id === account?.profileId) ||
    state.settings.profiles.find((item) => item.name === session.role) ||
    state.settings.profiles[0];
  const allowedNav = nav.filter(
    (item) =>
      state.settings.modules.find((module) => module.id === item.id)?.enabled &&
      (profile?.permissions.includes("todos") ||
        profile?.moduleAccess[item.id]?.includes("visualizar")),
  );
  const effectiveView = allowedNav.some((item) => item.id === view)
    ? view
    : allowedNav[0]?.id || "dashboard";
  const page = {
    dashboard: (
      <Dashboard
        state={state}
        onNavigate={setView}
        commit={commit}
        userName={session.name}
        profileName={profile?.name || session.role}
      />
    ),
    clientes: <Clients state={state} commit={commit} token={token} />,
    financeiro: <Finance state={state} commit={commit} />,
    cobrancas: (
      <Collections
        state={state}
        commit={commit}
        user={session.name}
        token={token}
      />
    ),
    tarefas: <Tasks state={state} commit={commit} />,
    operacional: <OperationalModule state={state} commit={commit} />,
    rotas: (
      <RouteOperationsCenter
        state={state}
        commit={commit}
        user={session.name}
      />
    ),
    documentos: <Documents state={state} commit={commit} />,
    recados: <Notices state={state} commit={commit} user={session.name} />,
    relatorios: <Reports state={state} />,
    configuracoes: <AdminCenter state={state} commit={commit} token={token} />,
  }[effectiveView];
  const appearance = state.settings.appearance;
  const themeStyle = {
    ["--brand" as string]: darkMode
      ? appearance.darkPrimary
      : appearance.primary,
    ["--brand-dark" as string]: darkMode
      ? appearance.darkSecondary
      : appearance.secondary,
    ["--surface" as string]: darkMode
      ? appearance.darkSurface
      : appearance.surface,
    ["--page" as string]: darkMode
      ? appearance.darkBackground
      : appearance.background,
    ["--ink" as string]: darkMode ? appearance.darkText : appearance.text,
    ["--radius" as string]: `${appearance.radius}px`,
  };
  return (
    <div
      className={`custom-theme ${darkMode ? "dark-mode" : ""} density-${appearance.density.toLowerCase().replace("á", "a")}`}
      style={themeStyle}
    >
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="app-brand">
              <img src={appearance.logo} alt={appearance.appName} />
              <div>
                <strong>{appearance.sidebarTitle}</strong>
                <small>Sistema integrado</small>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Módulos autorizados</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {allowedNav.map((item) => {
                    const moduleDefinition = state.settings.modules.find(
                      (entry) => entry.id === item.id,
                    );
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={effectiveView === item.id}
                          tooltip={moduleDefinition?.name || item.label}
                          onClick={() => setView(item.id)}
                        >
                          <item.icon />
                          <span>{moduleDefinition?.name || item.label}</span>
                          {item.id === "recados" && (
                            <em>
                              {
                                state.notices.filter(
                                  (n) => n.status === "Pendente",
                                ).length
                              }
                            </em>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="sidebar-user">
              <div>{session.name.slice(0, 1)}</div>
              <span>
                <strong>{session.name}</strong>
                <small>{profile?.name}</small>
              </span>
              <Button variant="ghost" size="icon" onClick={logout} title="Sair">
                <LogOut />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="topbar">
            <SidebarTrigger>
              <Menu />
            </SidebarTrigger>
            <div className="top-search">
              <Search />
              <input
                aria-label="Pesquisa global"
                placeholder="Pesquisar cliente, tarefa, NF..."
              />
            </div>
            <div className="top-actions">
              <span className="active-profile">
                <ShieldCheck /> {profile?.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView("tarefas")}
              >
                <Plus /> Nova tarefa
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode((value) => !value)}
                title={darkMode ? "Ativar tema claro" : "Ativar tema escuro"}
              >
                {darkMode ? <Sun /> : <Moon />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bell"
                onClick={() => setNotificationsOpen(true)}
              >
                <Bell />
                <span>
                  {state.notices.filter((n) => n.status === "Pendente").length}
                </span>
              </Button>
            </div>
          </header>
          <main className="workspace">{page}</main>
        </SidebarInset>
        <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <SheetContent className="notification-center">
            <SheetHeader>
              <SheetTitle>Central de notificações</SheetTitle>
              <SheetDescription>
                Lembretes, avisos e pendências com acesso direto à origem.
              </SheetDescription>
            </SheetHeader>
            <div className="notification-list">
              {state.notices
                .filter((item) => item.status === "Pendente")
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setView("recados");
                      setNotificationsOpen(false);
                    }}
                  >
                    <MessageSquareText />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>
                    <ChevronRight />
                  </button>
                ))}
              {state.emissions
                .filter(
                  (item) =>
                    item.status === "Pendente" && item.scheduledDate <= today,
                )
                .slice(0, 8)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setView("financeiro");
                      setNotificationsOpen(false);
                    }}
                  >
                    <ReceiptText />
                    <span>
                      <strong>Emissão pendente</strong>
                      <small>
                        {
                          state.clients.find(
                            (client) => client.id === item.clientId,
                          )?.name
                        }{" "}
                        · {dateBR(item.scheduledDate)}
                      </small>
                    </span>
                    <ChevronRight />
                  </button>
                ))}
              {state.routeHolidays.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setView("rotas");
                    setNotificationsOpen(false);
                  }}
                >
                  <CalendarDays />
                  <span>
                    <strong>{item.name}</strong>
                    <small>Rota de feriado · {dateBR(item.date)}</small>
                  </span>
                  <ChevronRight />
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        <Toaster richColors position="top-right" />
      </SidebarProvider>
    </div>
  );
}

function Dashboard({
  state,
  onNavigate,
  commit,
  userName,
  profileName,
}: {
  state: AppState;
  onNavigate: (view: View) => void;
  commit: Commit;
  userName: string;
  profileName: string;
}) {
  const pending = state.emissions.filter((e) => e.status === "Pendente"),
    urgent = state.collections.filter(
      (c) =>
        c.priority === "Vermelho" &&
        !["Baixada", "Arquivada"].includes(c.status),
    ),
    tasks = state.tasks
      .filter((t) => t.days.includes("Quarta") || t.days.includes("Quinta"))
      .slice(0, 5),
    routeDone = state.routes.filter((r) => r.registered && r.checked).length;
  const role = profileName.toLowerCase();
  const isFinance = role.includes("financeiro");
  const isCollections = role.includes("cobran");
  const isOperations = role.includes("opera");
  const isExecutive =
    role.includes("diretor") || role.includes("administrador");
  const profileTasks = state.tasks.filter(
    (task) =>
      task.responsible.toLowerCase() === userName.toLowerCase() ||
      task.responsible.toLowerCase().includes(profileName.toLowerCase()),
  );
  const dashboardMetrics = isFinance
    ? [
        {
          label: "Emitir hoje",
          value: pending.filter((item) => item.scheduledDate === today).length,
          detail: "fechamentos programados",
          icon: ReceiptText,
          tone: "copper",
        },
        {
          label: "Emissões atrasadas",
          value: pending.filter((item) => item.scheduledDate < today).length,
          detail: "exigem ação imediata",
          icon: TriangleAlert,
          tone: "red",
        },
        {
          label: "Emitidas no período",
          value: state.emissions.filter((item) => item.status === "Emitida")
            .length,
          detail: "notas concluídas",
          icon: CheckCircle2,
          tone: "green",
        },
        {
          label: "Total em acompanhamento",
          value: money.format(
            state.emissions.reduce((sum, item) => sum + item.amount, 0),
          ),
          detail: "agenda financeira",
          icon: CircleDollarSign,
          tone: "blue",
        },
      ]
    : isCollections
      ? [
          {
            label: "Fila de cobrança",
            value: state.collections.filter(
              (item) => !["Paga", "Baixada", "Arquivada"].includes(item.status),
            ).length,
            detail: "clientes para acompanhar",
            icon: WalletCards,
            tone: "copper",
          },
          {
            label: "Casos críticos",
            value: urgent.length,
            detail: "prioridade vermelha",
            icon: TriangleAlert,
            tone: "red",
          },
          {
            label: "Recebidas",
            value: state.collections.filter((item) =>
              ["Paga", "Baixada"].includes(item.status),
            ).length,
            detail: "baixas registradas",
            icon: CheckCircle2,
            tone: "green",
          },
          {
            label: "Contatos realizados",
            value: state.collections.reduce(
              (sum, item) => sum + item.attempts,
              0,
            ),
            detail: "histórico de tentativas",
            icon: MessageSquareText,
            tone: "blue",
          },
        ]
      : isOperations
        ? [
            {
              label: "Minhas tarefas",
              value: profileTasks.length || tasks.length,
              detail: "checklist do perfil",
              icon: ClipboardCheck,
              tone: "copper",
            },
            {
              label: "A cadastrar",
              value: state.routes.filter((item) => !item.registered).length,
              detail: "entregas pendentes",
              icon: Route,
              tone: "red",
            },
            {
              label: "Rotas conferidas",
              value: `${Math.round((routeDone / Math.max(1, state.routes.length)) * 100)}%`,
              detail: `${routeDone} de ${state.routes.length}`,
              icon: CheckCircle2,
              tone: "green",
            },
            {
              label: "Divergências",
              value: state.routeDivergences.filter(
                (item) => item.status !== "Fechada",
              ).length,
              detail: "itens em tratamento",
              icon: TriangleAlert,
              tone: "blue",
            },
          ]
        : [
            {
              label: "Emissões pendentes",
              value: pending.length,
              detail: "visão financeira consolidada",
              icon: ReceiptText,
              tone: "copper",
            },
            {
              label: "Cobranças críticas",
              value: urgent.length,
              detail: "ação necessária",
              icon: TriangleAlert,
              tone: "red",
            },
            {
              label: "Tarefas concluídas",
              value: `${Math.round((state.tasks.filter((item) => item.completed).length / Math.max(1, state.tasks.length)) * 100)}%`,
              detail: "desempenho da equipe",
              icon: ClipboardCheck,
              tone: "blue",
            },
            {
              label: "Rotas conferidas",
              value: `${Math.round((routeDone / Math.max(1, state.routes.length)) * 100)}%`,
              detail: "qualidade operacional",
              icon: Route,
              tone: "green",
            },
          ];
  const focusView: View = isFinance
    ? "financeiro"
    : isCollections
      ? "cobrancas"
      : isOperations
        ? "rotas"
        : "relatorios";
  return (
    <>
      <section className="dashboard-welcome">
        <div>
          <span>
            {isExecutive ? "Visão executiva" : `Painel ${profileName}`}
          </span>
          <h1>Olá, {userName}.</h1>
          <p>
            {isFinance
              ? "Sua agenda prioriza emissões, fechamentos e vencimentos."
              : isCollections
                ? "Sua visão mostra cobranças, contatos e casos críticos."
                : isOperations
                  ? "Sua operação reúne tarefas, cadastros, rotas e conferências."
                  : "Acompanhe resultados, riscos e prioridades de todas as áreas."}
          </p>
        </div>
        <Button onClick={() => onNavigate(focusView)}>
          Abrir área principal <ChevronRight />
        </Button>
      </section>
      <div className="metrics-grid dashboard-metrics">
        {dashboardMetrics.map((metric) => (
          <Metric key={metric.label} {...metric} />
        ))}
      </div>
      <div className="dashboard-grid">
        <Card className="span-2">
          <CardHeader className="row">
            <div>
              <CardTitle>Prioridades de hoje</CardTitle>
              <CardDescription>
                Itens ordenados por impacto operacional
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("financeiro")}
            >
              Ver calendário <ChevronRight />
            </Button>
          </CardHeader>
          <CardContent className="agenda-list">
            {pending.slice(0, 3).map((e, i) => (
              <button
                key={e.id}
                onClick={() => onNavigate("financeiro")}
                className="agenda-row"
              >
                <span className={`agenda-time tone-${i ? "copper" : "red"}`}>
                  {e.scheduledDate === today ? "Hoje" : dateBR(e.scheduledDate)}
                </span>
                <span>
                  <strong>
                    {state.clients.find((c) => c.id === e.clientId)?.name}
                  </strong>
                  <small>
                    Emitir NF · {e.responsible} · {money.format(e.amount)}
                  </small>
                </span>
                <Status>{e.priority}</Status>
                <ChevronRight />
              </button>
            ))}
            {urgent.slice(0, 2).map((c) => (
              <button
                key={c.id}
                onClick={() => onNavigate("cobrancas")}
                className="agenda-row"
              >
                <span className="agenda-time tone-red">Cobrar</span>
                <span>
                  <strong>
                    {state.clients.find((x) => x.id === c.clientId)?.name}
                  </strong>
                  <small>
                    NF {c.invoice} · {money.format(c.amount)} · {c.attempts}{" "}
                    tentativas
                  </small>
                </span>
                <Status>{c.status}</Status>
                <ChevronRight />
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Checklist operacional</CardTitle>
            <CardDescription>Ações recorrentes próximas</CardDescription>
          </CardHeader>
          <CardContent className="check-list">
            {tasks.map((task) => (
              <label key={task.id}>
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(v) =>
                    commit(
                      `${v ? "Concluiu" : "Reabriu"} ${task.title}`,
                      (draft) => {
                        const found = draft.tasks.find((t) => t.id === task.id);
                        if (found) found.completed = Boolean(v);
                      },
                    )
                  }
                />
                <span>
                  <strong>{task.title}</strong>
                  <small>
                    {task.time} · {task.nature}
                  </small>
                </span>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="dashboard-grid lower">
        <Card>
          <CardHeader>
            <CardTitle>Saúde das cobranças</CardTitle>
          </CardHeader>
          <CardContent>
            <Donut
              values={[
                state.collections.filter((c) =>
                  ["Paga", "Baixada"].includes(c.status),
                ).length,
                state.collections.filter((c) =>
                  ["Em andamento", "Reagendada"].includes(c.status),
                ).length,
                state.collections.filter((c) =>
                  c.status.includes("Cancelamento"),
                ).length,
              ]}
              labels={["Pagas", "Em tratamento", "Cancelamento"]}
            />
          </CardContent>
        </Card>
        <Card className="span-2">
          <CardHeader className="row">
            <div>
              <CardTitle>Rotas do fim de semana</CardTitle>
              <CardDescription>
                Base importada das planilhas operacionais
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("rotas")}
            >
              Abrir base
            </Button>
          </CardHeader>
          <CardContent className="route-summary">
            {["sabado", "domingo"].map((base) => {
              const rows = state.routes.filter((r) => r.base === base),
                done = rows.filter((r) => r.registered && r.checked).length;
              return (
                <div key={base}>
                  <div>
                    <span>{base === "sabado" ? "Sábado" : "Domingo"}</span>
                    <strong>
                      {done}/{rows.length}
                    </strong>
                  </div>
                  <Progress value={(done / rows.length) * 100} />
                  <small>
                    {new Set(rows.map((r) => r.driver)).size} entregadores ·{" "}
                    {rows.filter((r) => r.rule === "sob-demanda").length} sob
                    demanda
                  </small>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
function Donut({ values, labels }: { values: number[]; labels: string[] }) {
  const total = values.reduce((a, b) => a + b, 0) || 1,
    colors = ["#198754", "#d18a35", "#b84036"];
  let start = 0;
  const gradient = values
    .map((v, i) => {
      const from = start;
      start += (v / total) * 360;
      return `${colors[i]} ${from}deg ${start}deg`;
    })
    .join(",");
  return (
    <div className="donut-wrap">
      <div
        className="donut"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <span>
          <strong>{total}</strong>
          <small>registros</small>
        </span>
      </div>
      <div className="donut-legend">
        {labels.map((label, i) => (
          <div key={label}>
            <i style={{ background: colors[i] }} />
            <span>{label}</span>
            <strong>{values[i]}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

const blankClient: Client = {
  id: "",
  name: "",
  legalName: "",
  document: "",
  stateRegistration: "",
  cep: "",
  address: "",
  priceTable: "TABELA EMPRESAS (E)",
  score: 700,
  requiresManifest: false,
  email: "",
  whatsapp: "",
  company: "Indústria de Pães Nova Esperança",
  closing: "Mensal - emitir no 1º dia do próximo mês",
  closingRuleId: "closing-month-end",
  dueRule: "30 dias",
  dueRuleId: "due-30",
  priority: "Verde",
  colorRuleId: "color-green",
  groupId: "",
  requiresOrderCheck: false,
  payment: "Boleto",
  sending: "E-mail",
  issuer: "Yerardo",
  collectors: ["Natanael"],
  billing: "Nota Fiscal",
  reminders: true,
  cancellationDays: 5,
  active: true,
  tags: [],
  notes: "",
};
function ClientDirectory({
  state,
  commit,
  token,
}: {
  state: AppState;
  commit: Commit;
  token: string;
}) {
  const [search, setSearch] = useState(""),
    [company, setCompany] = useState("Todas");
  const [editing, setEditing] = useState<Client | null>(null),
    [profile, setProfile] = useState<Client | null>(null),
    [removing, setRemoving] = useState<Client | null>(null),
    [selected, setSelected] = useState<string[]>([]);
  const filtered = state.clients.filter(
    (c) =>
      (company === "Todas" || c.company === company) &&
      [c.name, c.document, c.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const item = { ...editing, id: editing.id || uid("cliente") };
    commit(`${editing.id ? "Editou" : "Cadastrou"} ${item.name}`, (draft) => {
      const i = draft.clients.findIndex((c) => c.id === item.id);
      if (i >= 0) draft.clients[i] = item;
      else draft.clients.unshift(item);
    });
    setEditing(null);
    toast.success("Cliente salvo");
  }
  function exportClients(template = false) {
    const rows = template
      ? []
      : state.clients.filter(
          (client) => !selected.length || selected.includes(client.id),
        );
    const header = [
      "nome_interno",
      "razao_social",
      "cnpj_cpf",
      "inscricao_estadual",
      "cep",
      "endereco",
      "email",
      "whatsapp",
      "empresa",
      "tabela_preco",
      "score",
      "exige_romaneio",
    ];
    const values = rows.map((client) => [
      client.name,
      client.legalName,
      client.document,
      client.stateRegistration,
      client.cep,
      client.address,
      client.email,
      client.whatsapp,
      client.company,
      client.priceTable,
      client.score,
      client.requiresManifest ? "sim" : "não",
    ]);
    const csv = [header, ...values]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(";"),
      )
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
    );
    link.download = template
      ? "MODELO_IMPORTACAO_CLIENTES.csv"
      : "CLIENTES_SELECIONADOS.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }
  async function lookupCep() {
    if (!editing?.cep) return toast.error("Informe o CEP");
    const cep = editing.cep.replace(/\D/g, "");
    if (cep.length !== 8) return toast.error("O CEP deve ter 8 números");
    try {
      let response = await fetch(`/api/lookup/cep/${cep}`);
      if (!response.ok)
        response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!response.ok || data.erro) throw new Error();
      setEditing({
        ...editing,
        cep: data.cep || editing.cep,
        address: [data.logradouro, data.bairro, data.localidade, data.uf]
          .filter(Boolean)
          .join(", "),
      });
      toast.success("Endereço localizado");
    } catch {
      toast.error("CEP não encontrado");
    }
  }
  async function lookupCnpj() {
    if (!editing?.document) return toast.error("Informe o CNPJ");
    const cnpj = editing.document.replace(/\D/g, "");
    if (cnpj.length !== 14)
      return toast.error("A consulta automática exige um CNPJ com 14 números");
    const loading = toast.loading("Consultando Receita Federal...");
    try {
      let response = await fetch(`/api/lookup/cnpj/${cnpj}`);
      if (!response.ok)
        response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      const data = await response.json();
      if (!response.ok || data.message) throw new Error(data.message);
      const ie = Array.isArray(data.inscricoes_estaduais)
        ? data.inscricoes_estaduais.find(
            (item: { ativo?: boolean }) => item.ativo !== false,
          )?.inscricao_estadual
        : "";
      setEditing({
        ...editing,
        document: data.cnpj || editing.document,
        legalName: data.razao_social || editing.legalName,
        name: data.nome_fantasia || data.razao_social || editing.name,
        email: data.email || editing.email,
        whatsapp: data.ddd_telefone_1 || editing.whatsapp,
        cep: data.cep || editing.cep,
        stateRegistration: ie || editing.stateRegistration,
        address: [
          data.descricao_tipo_de_logradouro,
          data.logradouro,
          data.numero,
          data.complemento,
          data.bairro,
          data.municipio,
          data.uf,
        ]
          .filter(Boolean)
          .join(", "),
      });
      toast.success("Dados cadastrais preenchidos automaticamente", {
        id: loading,
      });
    } catch {
      toast.error("Não foi possível consultar o CNPJ. Tente novamente.", {
        id: loading,
      });
    }
  }
  async function importClients(file?: File) {
    if (!file) return;
    try {
      let rows: Record<string, unknown>[] = [];
      if (token !== "local-demo") {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/import/clients", {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
          body: form,
        });
        if (!response.ok) throw new Error("Falha na importação");
        rows = (await response.json()).rows ?? [];
      } else if (file.name.toLowerCase().endsWith(".csv")) {
        const [header, ...body] = (await file.text())
          .split(/\r?\n/)
          .filter(Boolean)
          .map((line) => line.split(";"));
        rows = body.map((values) =>
          Object.fromEntries(
            header.map((key, index) => [
              key.trim().toLowerCase(),
              values[index]?.trim() ?? "",
            ]),
          ),
        );
      } else
        return toast.error(
          "No modo local, importe CSV. No servidor, XLSX e CSV são aceitos.",
        );
      const imported = rows.map((row, index) => {
        const closingRuleId = String(
            row.closing_rule_id || "closing-month-end",
          ),
          dueRuleId = String(row.due_rule_id || "due-30"),
          colorRuleId = String(row.color_rule_id || "color-green");
        const colorName = state.settings.colorRules.find(
          (rule) => rule.id === colorRuleId,
        )?.name;
        return {
          ...blankClient,
          id: uid(`import-${index}`),
          name: String(
            row.name || row.cliente || row.nome || "Cliente sem nome",
          ),
          document: String(row.document || row.cnpj || ""),
          email: String(row.email || ""),
          whatsapp: String(row.whatsapp || row.telefone || ""),
          company: String(row.company || row.empresa || blankClient.company),
          closingRuleId,
          closing:
            state.settings.closingRules.find(
              (rule) => rule.id === closingRuleId,
            )?.name || String(row.closing || "Importado"),
          dueRuleId,
          dueRule:
            state.settings.dueRules.find((rule) => rule.id === dueRuleId)
              ?.name || String(row.due_rule || "30 dias"),
          colorRuleId,
          priority: (["Verde", "Amarelo", "Vermelho"].includes(
            String(colorName),
          )
            ? colorName
            : "Verde") as Client["priority"],
          payment: String(row.payment || row.forma_pagamento || "Boleto"),
          notes: String(row.notes || row.observacoes || ""),
          requiresOrderCheck: Boolean(row.requires_order_check),
          tags: ["importado"],
        };
      });
      if (!imported.length)
        return toast.error("Nenhum cliente reconhecido na planilha");
      commit(`Importou ${imported.length} clientes`, (draft) => {
        imported.forEach((item) => {
          const current = draft.clients.findIndex(
            (client) => client.document && client.document === item.document,
          );
          if (current >= 0)
            draft.clients[current] = {
              ...draft.clients[current],
              ...item,
              id: draft.clients[current].id,
            };
          else draft.clients.push(item);
        });
      });
      toast.success(`${imported.length} clientes importados`);
    } catch {
      toast.error("Não foi possível ler a planilha. Confira os cabeçalhos.");
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="Base unificada"
        title="Clientes"
        description={`${state.clients.length} clientes compartilhados entre todos os módulos.`}
        actions={
          <>
            <Label className="upload-button">
              <Upload /> Importar Excel/CSV
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => importClients(e.target.files?.[0])}
              />
            </Label>
            <Button variant="outline" onClick={() => exportClients(true)}>
              <Download /> Baixar modelo
            </Button>
            <Button variant="outline" onClick={() => exportClients(false)}>
              <Download /> Exportar{" "}
              {selected.length ? `(${selected.length})` : "todos"}
            </Button>
            <Button onClick={() => setEditing({ ...blankClient })}>
              <Plus /> Novo cliente
            </Button>
          </>
        }
      />
      <Card>
        <CardHeader>
          <div className="toolbar">
            <div className="searchbox">
              <Search />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, CNPJ ou tag"
              />
            </div>
            <NativeSelect
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            >
              <NativeSelectOption>Todas</NativeSelectOption>
              {state.settings.companies.map((c) => (
                <NativeSelectOption key={c.name}>{c.name}</NativeSelectOption>
              ))}
            </NativeSelect>
            <span className="result-count">{filtered.length} resultados</span>
          </div>
        </CardHeader>
        <CardContent className="table-shell">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox
                    checked={
                      selected.length === filtered.length && filtered.length > 0
                    }
                    onCheckedChange={(checked) =>
                      setSelected(
                        checked ? filtered.map((item) => item.id) : [],
                      )
                    }
                  />
                </TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Fechamento</TableHead>
                <TableHead>Política</TableHead>
                <TableHead>Responsáveis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(c.id)}
                      onCheckedChange={(checked) =>
                        setSelected((current) =>
                          checked
                            ? [...new Set([...current, c.id])]
                            : current.filter((id) => id !== c.id),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      className="client-name"
                      onClick={() => setProfile(c)}
                    >
                      <span>{c.name.slice(0, 2).toUpperCase()}</span>
                      <div>
                        <strong>{c.name}</strong>
                        <small>{c.document}</small>
                      </div>
                    </button>
                  </TableCell>
                  <TableCell>
                    {c.company.replace("Indústria de Pães ", "")}
                  </TableCell>
                  <TableCell>
                    {state.settings.closingRules.find(
                      (rule) => rule.id === c.closingRuleId,
                    )?.name || c.closing}
                  </TableCell>
                  <TableCell>
                    <Status>
                      {state.settings.colorRules.find(
                        (rule) => rule.id === c.colorRuleId,
                      )?.name || c.priority}
                    </Status>
                  </TableCell>
                  <TableCell>
                    {c.issuer} · {c.collectors.join(", ")}
                  </TableCell>
                  <TableCell>
                    <Status>{c.active ? "Ativo" : "Inativo"}</Status>
                  </TableCell>
                  <TableCell className="right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setProfile(c)}
                    >
                      <UserRound />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing({ ...c })}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRemoving(c)}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="dialog-wide">
          {editing && (
            <form onSubmit={save}>
              <DialogHeader>
                <DialogTitle>
                  {editing.id ? "Editar cliente" : "Novo cliente"}
                </DialogTitle>
                <DialogDescription>
                  Cadastro financeiro compartilhado, com regras automáticas e
                  responsáveis.
                </DialogDescription>
              </DialogHeader>
              <div className="form-grid">
                <Field label="Nome interno / fantasia">
                  <Input
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                    required
                  />
                </Field>
                <Field label="Razão social">
                  <Input
                    value={editing.legalName}
                    onChange={(e) =>
                      setEditing({ ...editing, legalName: e.target.value })
                    }
                  />
                </Field>
                <Field label="CNPJ / CPF">
                  <div className="input-action">
                    <Input
                      value={editing.document}
                      onChange={(e) =>
                        setEditing({ ...editing, document: e.target.value })
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={lookupCnpj}
                    >
                      Consultar
                    </Button>
                  </div>
                </Field>
                <Field label="Inscrição estadual">
                  <Input
                    value={editing.stateRegistration}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        stateRegistration: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="CEP">
                  <div className="input-action">
                    <Input
                      value={editing.cep}
                      onChange={(e) =>
                        setEditing({ ...editing, cep: e.target.value })
                      }
                    />
                    <Button type="button" variant="outline" onClick={lookupCep}>
                      Buscar
                    </Button>
                  </div>
                </Field>
                <Field label="Endereço">
                  <Input
                    value={editing.address}
                    onChange={(e) =>
                      setEditing({ ...editing, address: e.target.value })
                    }
                  />
                </Field>
                <Field label="Tabela de preço">
                  <NativeSelect
                    value={editing.priceTable}
                    onChange={(e) =>
                      setEditing({ ...editing, priceTable: e.target.value })
                    }
                  >
                    {state.settings.priceTables.map((table) => (
                      <NativeSelectOption key={table}>
                        {table}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Score do cliente (0 a 1000)">
                  <Input
                    type="number"
                    min="0"
                    max="1000"
                    value={editing.score}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        score: Math.max(
                          0,
                          Math.min(1000, Number(e.target.value)),
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="E-mail">
                  <Input
                    type="email"
                    value={editing.email}
                    onChange={(e) =>
                      setEditing({ ...editing, email: e.target.value })
                    }
                    required
                  />
                </Field>
                <Field label="WhatsApp">
                  <Input
                    value={editing.whatsapp}
                    onChange={(e) =>
                      setEditing({ ...editing, whatsapp: e.target.value })
                    }
                    required
                  />
                </Field>
                <Field label="Empresa">
                  <NativeSelect
                    value={editing.company}
                    onChange={(e) =>
                      setEditing({ ...editing, company: e.target.value })
                    }
                  >
                    {state.settings.companies.map((x) => (
                      <NativeSelectOption key={x.name}>
                        {x.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Fechamento / emissão">
                  <NativeSelect
                    value={editing.closingRuleId}
                    onChange={(e) => {
                      const rule = state.settings.closingRules.find(
                        (x) => x.id === e.target.value,
                      );
                      setEditing({
                        ...editing,
                        closingRuleId: e.target.value,
                        closing: rule?.name || editing.closing,
                        requiresOrderCheck:
                          rule?.requiresOrderCheck ??
                          editing.requiresOrderCheck,
                      });
                    }}
                  >
                    {state.settings.closingRules
                      .filter((x) => x.active)
                      .map((x) => (
                        <NativeSelectOption value={x.id} key={x.id}>
                          {x.name}
                        </NativeSelectOption>
                      ))}
                  </NativeSelect>
                </Field>
                <Field label="Regra de vencimento">
                  <NativeSelect
                    value={editing.dueRuleId}
                    onChange={(e) => {
                      const rule = state.settings.dueRules.find(
                        (x) => x.id === e.target.value,
                      );
                      setEditing({
                        ...editing,
                        dueRuleId: e.target.value,
                        dueRule: rule?.name || editing.dueRule,
                      });
                    }}
                  >
                    {state.settings.dueRules
                      .filter((x) => x.active)
                      .map((x) => (
                        <NativeSelectOption value={x.id} key={x.id}>
                          {x.name}
                        </NativeSelectOption>
                      ))}
                  </NativeSelect>
                </Field>
                <Field label="Política de cobrança">
                  <NativeSelect
                    value={editing.colorRuleId}
                    onChange={(e) => {
                      const rule = state.settings.colorRules.find(
                        (x) => x.id === e.target.value,
                      );
                      const legacy = (
                        ["Verde", "Amarelo", "Vermelho"].includes(
                          rule?.name || "",
                        )
                          ? rule?.name
                          : editing.priority
                      ) as Client["priority"];
                      setEditing({
                        ...editing,
                        colorRuleId: e.target.value,
                        priority: legacy,
                      });
                    }}
                  >
                    {state.settings.colorRules.map((x) => (
                      <NativeSelectOption value={x.id} key={x.id}>
                        {x.name} ·{" "}
                        {x.maxOpenPending === null
                          ? "sem limite"
                          : `máx. ${x.maxOpenPending}`}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Grupo / pagador central">
                  <NativeSelect
                    value={editing.groupId}
                    onChange={(e) =>
                      setEditing({ ...editing, groupId: e.target.value })
                    }
                  >
                    <NativeSelectOption value="">
                      Sem grupo associado
                    </NativeSelectOption>
                    {state.settings.customerGroups.map((x) => (
                      <NativeSelectOption value={x.id} key={x.id}>
                        {x.name} → {x.payerName}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Pagamento">
                  <NativeSelect
                    value={editing.payment}
                    onChange={(e) =>
                      setEditing({ ...editing, payment: e.target.value })
                    }
                  >
                    {state.settings.paymentMethods.map((x) => (
                      <NativeSelectOption key={x}>{x}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Envio">
                  <NativeSelect
                    value={editing.sending}
                    onChange={(e) =>
                      setEditing({ ...editing, sending: e.target.value })
                    }
                  >
                    {state.settings.sendingMethods.map((x) => (
                      <NativeSelectOption key={x}>{x}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Responsável pela emissão">
                  <NativeSelect
                    value={editing.issuer}
                    onChange={(e) =>
                      setEditing({ ...editing, issuer: e.target.value })
                    }
                  >
                    {state.settings.users.map((x) => (
                      <NativeSelectOption key={x.name}>
                        {x.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Dias para cancelamento">
                  <Input
                    type="number"
                    value={editing.cancellationDays}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        cancellationDays: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Tags">
                  <Input
                    value={editing.tags.join(", ")}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        tags: e.target.value
                          .split(",")
                          .map((x) => x.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </Field>
                <Field label="Faturamento">
                  <NativeSelect
                    value={editing.billing}
                    onChange={(e) =>
                      setEditing({ ...editing, billing: e.target.value })
                    }
                  >
                    <NativeSelectOption>Nota Fiscal</NativeSelectOption>
                    <NativeSelectOption>
                      Nota Fiscal + Comprovante
                    </NativeSelectOption>
                  </NativeSelect>
                </Field>
                <Field label="Observações" full>
                  <Textarea
                    value={editing.notes}
                    onChange={(e) =>
                      setEditing({ ...editing, notes: e.target.value })
                    }
                  />
                </Field>
                <div className="switch-row">
                  <Switch
                    checked={editing.requiresManifest}
                    onCheckedChange={(v) =>
                      setEditing({ ...editing, requiresManifest: v })
                    }
                  />
                  <span>
                    <strong>Exige romaneio antes do fechamento</strong>
                    <small>Cria bloqueio e filtro no módulo financeiro</small>
                  </span>
                </div>
                <div className="switch-row">
                  <Switch
                    checked={editing.requiresOrderCheck}
                    onCheckedChange={(v) =>
                      setEditing({ ...editing, requiresOrderCheck: v })
                    }
                  />
                  <span>
                    <strong>Verificar se existe pedido</strong>
                    <small>
                      Exibe Tem pedido / Sem pedido antes da emissão
                    </small>
                  </span>
                </div>
                <div className="switch-row">
                  <Switch
                    checked={editing.reminders}
                    onCheckedChange={(v) =>
                      setEditing({ ...editing, reminders: v })
                    }
                  />
                  <span>
                    <strong>Gerar lembrete</strong>
                    <small>No vencimento, para o cobrador responsável</small>
                  </span>
                </div>
                <div className="switch-row">
                  <Switch
                    checked={editing.active}
                    onCheckedChange={(v) =>
                      setEditing({ ...editing, active: v })
                    }
                  />
                  <span>
                    <strong>Cliente ativo</strong>
                    <small>Visível nos módulos</small>
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar cliente</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <ClientProfile
        client={profile}
        state={state}
        onClose={() => setProfile(null)}
      />
      <AlertDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove “{removing?.name}” da base. O evento será
              auditado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!removing) return;
                commit(`Apagou ${removing.name}`, (d) => {
                  d.clients = d.clients.filter((c) => c.id !== removing.id);
                });
                setRemoving(null);
              }}
            >
              Confirmar exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Clients({
  state,
  commit,
  token,
}: {
  state: AppState;
  commit: Commit;
  token: string;
}) {
  const [tab, setTab] = useState("lista");
  const [selectedTag, setSelectedTag] = useState("Todas");
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);
  const [removingGroup, setRemovingGroup] = useState<CustomerGroup | null>(
    null,
  );
  const tags = [...new Set(state.clients.flatMap((client) => client.tags))];
  const targetClients = state.clients.filter(
    (client) => selectedTag === "Todas" || client.tags.includes(selectedTag),
  );
  const blankGroup: CustomerGroup = {
    id: "",
    name: "",
    payerName: "",
    payerClientId: "",
    units: [],
    inheritRules: true,
  };
  function saveGroup(event: FormEvent) {
    event.preventDefault();
    if (!editingGroup?.name.trim())
      return toast.error("Informe o nome do grupo");
    const payer = state.clients.find(
      (item) => item.id === editingGroup.payerClientId,
    );
    const item = {
      ...editingGroup,
      id: editingGroup.id || uid("grupo"),
      payerName: payer?.name || editingGroup.payerName || "Não definido",
    };
    commit(
      `${editingGroup.id ? "Editou" : "Criou"} grupo ${item.name}`,
      (draft) => {
        const index = draft.settings.customerGroups.findIndex(
          (group) => group.id === item.id,
        );
        if (index >= 0) draft.settings.customerGroups[index] = item;
        else draft.settings.customerGroups.unshift(item);
      },
    );
    setEditingGroup(null);
    toast.success("Grupo e unidades salvos");
  }
  return (
    <>
      <PageTitle
        eyebrow="Cadastro compartilhado"
        title="Clientes e grupos"
        description="Dados, regras, responsáveis, empresas associadas, importação e configurações em massa."
      />
      <Tabs value={tab} onValueChange={setTab} className="module-tabs">
        <TabsList className="module-tabs-list">
          <TabsTrigger value="lista">Lista e cadastro</TabsTrigger>
          <TabsTrigger value="grupos">Grupos e unidades</TabsTrigger>
          <TabsTrigger value="lembretes">Alertas de cobrança</TabsTrigger>
        </TabsList>
        <TabsContent value="lista">
          <ClientDirectory state={state} commit={commit} token={token} />
        </TabsContent>
        <TabsContent value="grupos">
          <div className="section-actionbar">
            <div>
              <strong>Grupos e unidades</strong>
              <small>
                Defina o pagador central, unidades e herança de regras.
              </small>
            </div>
            <Button onClick={() => setEditingGroup({ ...blankGroup })}>
              <Plus /> Novo grupo
            </Button>
          </div>
          <div className="settings-cards">
            {state.settings.customerGroups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>
                    Pagador central: {group.payerName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="stack">
                  <div className="chips">
                    {group.units.map((unit) => (
                      <span key={unit}>{unit}</span>
                    ))}
                  </div>
                  <strong>
                    {group.units.length} unidades faturadas em conjunto
                  </strong>
                  <small>
                    {group.inheritRules
                      ? "As unidades herdam fechamento, vencimento e cobrança do grupo."
                      : "Cada unidade mantém regras próprias."}
                  </small>
                  <div className="card-actions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingGroup(structuredClone(group))}
                    >
                      <Pencil /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemovingGroup(group)}
                    >
                      <Trash2 /> Apagar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="lembretes">
          <Card>
            <CardHeader>
              <CardTitle>Alertas automáticos de cobrança</CardTitle>
              <CardDescription>
                Escolha quem recebe aviso no vencimento. Desativar o alerta não
                apaga nem impede a geração da cobrança.
              </CardDescription>
            </CardHeader>
            <CardContent className="bulk-reminder">
              <NativeSelect
                value={selectedTag}
                onChange={(event) => setSelectedTag(event.target.value)}
              >
                <NativeSelectOption>Todas</NativeSelectOption>
                {tags.map((tag) => (
                  <NativeSelectOption key={tag}>{tag}</NativeSelectOption>
                ))}
              </NativeSelect>
              <span>{targetClients.length} clientes selecionados</span>
              <Button
                variant="outline"
                onClick={() =>
                  commit(`Desativou lembretes para ${selectedTag}`, (draft) =>
                    draft.clients
                      .filter(
                        (client) =>
                          selectedTag === "Todas" ||
                          client.tags.includes(selectedTag),
                      )
                      .forEach((client) => (client.reminders = false)),
                  )
                }
              >
                <Bell /> Retirar lembrete
              </Button>
              <Button
                onClick={() =>
                  commit(`Ativou lembretes para ${selectedTag}`, (draft) =>
                    draft.clients
                      .filter(
                        (client) =>
                          selectedTag === "Todas" ||
                          client.tags.includes(selectedTag),
                      )
                      .forEach((client) => (client.reminders = true)),
                  )
                }
              >
                <Bell /> Ativar lembrete
              </Button>
              <div className="selection-list">
                {targetClients.map((client) => (
                  <label key={client.id}>
                    <Switch
                      checked={client.reminders}
                      onCheckedChange={(checked) =>
                        commit(
                          `Alterou lembrete de ${client.name}`,
                          (draft) => {
                            const found = draft.clients.find(
                              (item) => item.id === client.id,
                            );
                            if (found) found.reminders = checked;
                          },
                        )
                      }
                    />
                    <span>
                      <strong>{client.name}</strong>
                      <small>{client.tags.join(", ") || "Sem tags"}</small>
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog
        open={Boolean(editingGroup)}
        onOpenChange={(open) => !open && setEditingGroup(null)}
      >
        <DialogContent>
          {editingGroup && (
            <form onSubmit={saveGroup}>
              <DialogHeader>
                <DialogTitle>
                  {editingGroup.id ? "Editar grupo" : "Novo grupo"}
                </DialogTitle>
                <DialogDescription>
                  Cadastre o pagador e todas as unidades relacionadas.
                </DialogDescription>
              </DialogHeader>
              <div className="form-grid">
                <Field label="Nome do grupo" full>
                  <Input
                    value={editingGroup.name}
                    onChange={(event) =>
                      setEditingGroup({
                        ...editingGroup,
                        name: event.target.value,
                      })
                    }
                    required
                  />
                </Field>
                <Field label="Cliente pagador" full>
                  <NativeSelect
                    value={editingGroup.payerClientId || ""}
                    onChange={(event) =>
                      setEditingGroup({
                        ...editingGroup,
                        payerClientId: event.target.value,
                      })
                    }
                  >
                    <NativeSelectOption value="">
                      Selecione na base de clientes
                    </NativeSelectOption>
                    {state.clients.map((client) => (
                      <NativeSelectOption key={client.id} value={client.id}>
                        {client.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Unidades (uma por linha)" full>
                  <Textarea
                    rows={7}
                    value={editingGroup.units.join("\n")}
                    onChange={(event) =>
                      setEditingGroup({
                        ...editingGroup,
                        units: event.target.value
                          .split("\n")
                          .map((value) => value.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </Field>
                <div className="switch-row full">
                  <Switch
                    checked={editingGroup.inheritRules}
                    onCheckedChange={(checked) =>
                      setEditingGroup({
                        ...editingGroup,
                        inheritRules: checked,
                      })
                    }
                  />
                  <span>
                    <strong>Herdar regras do pagador</strong>
                    <small>
                      Fechamento, vencimento e cobrança serão aplicados às
                      unidades.
                    </small>
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingGroup(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save /> Salvar grupo
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(removingGroup)}
        onOpenChange={(open) => !open && setRemovingGroup(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              As unidades deixarão de herdar as regras de “{removingGroup?.name}
              ”. Os clientes não serão apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!removingGroup) return;
                commit(`Apagou grupo ${removingGroup.name}`, (draft) => {
                  draft.settings.customerGroups =
                    draft.settings.customerGroups.filter(
                      (group) => group.id !== removingGroup.id,
                    );
                  draft.clients
                    .filter((client) => client.groupId === removingGroup.id)
                    .forEach((client) => {
                      client.groupId = "";
                    });
                });
                setRemovingGroup(null);
                toast.success("Grupo apagado");
              }}
            >
              Apagar grupo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ScoreMeter({ score }: { score: number }) {
  const normalized = Math.max(0, Math.min(1000, score));
  const label =
    normalized >= 850
      ? "Excelente"
      : normalized >= 700
        ? "Muito bom"
        : normalized >= 500
          ? "Regular"
          : normalized >= 300
            ? "Baixo"
            : "Muito baixo";
  const color =
    normalized >= 850
      ? "#16a34a"
      : normalized >= 700
        ? "#65a30d"
        : normalized >= 500
          ? "#eab308"
          : normalized >= 300
            ? "#f97316"
            : "#ef4444";
  return (
    <div className="serasa-score">
      <div className="score-arc">
        <svg viewBox="0 0 240 142" aria-label={`Score ${normalized} de 1000`}>
          <defs>
            <linearGradient id="score-spectrum" x1="0" x2="1">
              <stop offset="0" stopColor="#ef4444" />
              <stop offset=".35" stopColor="#f97316" />
              <stop offset=".58" stopColor="#eab308" />
              <stop offset=".78" stopColor="#84cc16" />
              <stop offset="1" stopColor="#16a34a" />
            </linearGradient>
          </defs>
          <path
            d="M 22 122 A 98 98 0 0 1 218 122"
            pathLength="100"
            className="score-track"
          />
          <path
            d="M 22 122 A 98 98 0 0 1 218 122"
            pathLength="100"
            className="score-value"
            strokeDasharray={`${normalized / 10} 100`}
          />
        </svg>
        <div>
          <strong>{normalized}</strong>
          <span>de 1000</span>
        </div>
      </div>
      <div className="score-copy">
        <span style={{ color }}>SCORE DO CLIENTE</span>
        <h3>O score está {label.toLowerCase()}</h3>
        <p>
          Indicador calculado pelo histórico de pagamentos, atrasos,
          reagendamentos e pendências.
        </p>
      </div>
      <div className="score-scale">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

function ClientProfile({
  client,
  state,
  onClose,
}: {
  client: Client | null;
  state: AppState;
  onClose: () => void;
}) {
  if (!client) return null;
  const cols = state.collections.filter((c) => c.clientId === client.id);
  const paid = cols
    .filter((c) => ["Paga", "Baixada"].includes(c.status))
    .reduce((a, c) => a + c.amount, 0);
  const openAmount = cols
    .filter((c) => !["Paga", "Baixada", "Arquivada"].includes(c.status))
    .reduce((a, c) => a + c.amount, 0);
  const guidance = collectionGuidance(state, client.id);
  const policy = state.settings.colorRules.find(
    (rule) => rule.id === client.colorRuleId,
  );
  const group = state.settings.customerGroups.find(
    (item) => item.id === client.groupId,
  );
  const calculatedScore = Math.max(
    0,
    Math.min(
      1000,
      (client.score ?? 700) -
        guidance.open * 85 -
        cols.filter((item) => item.status === "Reagendada").length * 25,
    ),
  );
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="profile-sheet">
        <SheetHeader>
          <SheetTitle>{client.name}</SheetTitle>
          <SheetDescription>
            {client.company} · {client.document}
          </SheetDescription>
        </SheetHeader>
        <ScoreMeter score={calculatedScore} />
        <div className={`policy-guidance tone-${guidance.tone}`}>
          <TriangleAlert />
          <span>
            <strong>{guidance.label}</strong>
            <small>{policy?.action}</small>
          </span>
        </div>
        <div className="mini-metrics">
          <div>
            <small>Total faturado</small>
            <strong>{money.format(paid + openAmount)}</strong>
          </div>
          <div>
            <small>Em aberto</small>
            <strong>{money.format(openAmount)}</strong>
          </div>
          <div>
            <small>Notas</small>
            <strong>
              {state.emissions
                .filter(
                  (e) => e.clientId === client.id && e.status === "Emitida",
                )
                .reduce((a, e) => a + e.invoiceNumbers.length, 0)}
            </strong>
          </div>
          <div>
            <small>Pendências vencidas</small>
            <strong>{guidance.open}</strong>
          </div>
        </div>
        <Tabs defaultValue="dados">
          <TabsList>
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="faturas">Faturas</TabsTrigger>
            <TabsTrigger value="cobrancas">Cobranças</TabsTrigger>
          </TabsList>
          <TabsContent value="dados" className="profile-data">
            <Info
              label="Razão social"
              value={client.legalName || client.name}
            />
            <Info
              label="Inscrição estadual"
              value={client.stateRegistration || "Não informada"}
            />
            <Info
              label="Endereço / CEP"
              value={
                [client.address, client.cep].filter(Boolean).join(" · ") ||
                "Não informado"
              }
            />
            <Info
              label="Tabela de preço"
              value={client.priceTable || "Não informada"}
            />
            <Info label="E-mail" value={client.email} />
            <Info label="WhatsApp" value={client.whatsapp} />
            <Info
              label="Fechamento"
              value={
                state.settings.closingRules.find(
                  (rule) => rule.id === client.closingRuleId,
                )?.name || client.closing
              }
            />
            <Info
              label="Vencimento"
              value={
                state.settings.dueRules.find(
                  (rule) => rule.id === client.dueRuleId,
                )?.name || client.dueRule
              }
            />
            <Info
              label="Grupo / pagador"
              value={group ? `${group.name} → ${group.payerName}` : "Sem grupo"}
            />
            <Info
              label="Verificar pedido"
              value={client.requiresOrderCheck ? "Sim" : "Não"}
            />
            <Info label="Pagamento" value={client.payment} />
            <Info label="Envio" value={client.sending} />
            <Info label="Emissor" value={client.issuer} />
            <Info label="Cobradores" value={client.collectors.join(", ")} />
            <Info label="Observações" value={client.notes || "Nenhuma"} />
          </TabsContent>
          <TabsContent value="faturas" className="timeline">
            {state.emissions
              .filter((e) => e.clientId === client.id)
              .map((e) => (
                <div key={e.id}>
                  <i />
                  <span>
                    <strong>
                      {e.invoiceNumbers.length
                        ? `NF ${e.invoiceNumbers.join(",")}`
                        : "Programada"}
                    </strong>
                    <small>
                      {dateBR(e.scheduledDate)} · {money.format(e.amount)} ·{" "}
                      {e.orderCheck}
                    </small>
                  </span>
                  <Status>{e.status}</Status>
                </div>
              ))}
          </TabsContent>
          <TabsContent value="cobrancas" className="timeline">
            {cols.map((c) => (
              <div key={c.id}>
                <i />
                <span>
                  <strong>NF {c.invoice}</strong>
                  <small>
                    {dateBR(c.dueDate)} · {money.format(c.amount)}
                  </small>
                </span>
                <Status>{c.status}</Status>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function FinanceOperations({
  state,
  commit,
}: {
  state: AppState;
  commit: Commit;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [scope, setScope] = useState("Hoje");
  const [company, setCompany] = useState("Todas");
  const [dialog, setDialog] = useState<Emission | null>(null);
  const [manual, setManual] = useState(false);
  const [nfs, setNfs] = useState<string[]>([""]);
  const [due, setDue] = useState("");
  const [observation, setObservation] = useState("");
  const filtered = state.emissions
    .filter((e) => {
      const client = state.clients.find((c) => c.id === e.clientId);
      const inScope =
        scope === "Todas" ||
        (scope === "Hoje" && e.scheduledDate === today) ||
        (scope === "Atrasadas" &&
          e.scheduledDate < today &&
          e.status === "Pendente") ||
        (scope === "Próximas" && e.scheduledDate > today);
      return (
        inScope &&
        (status === "Todos" || e.status === status) &&
        (company === "Todas" || e.company === company) &&
        (client?.name ?? "").toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  function openComplete(emission: Emission) {
    if (emission.orderCheck === "A verificar")
      return toast.error("Confirme se existe pedido ou marque Sem pedido");
    const client = state.clients.find((item) => item.id === emission.clientId);
    const dueRule = state.settings.dueRules.find(
      (rule) => rule.id === client?.dueRuleId,
    );
    setDialog(emission);
    setNfs(emission.invoiceNumbers.length ? emission.invoiceNumbers : [""]);
    setDue(calculateDueDate(emission.scheduledDate, dueRule));
    setObservation(emission.observation);
  }

  function complete() {
    if (!dialog || nfs.some((n) => !n.trim()) || !due)
      return toast.error("Informe NFs e vencimento");
    commit(`Concluiu emissão ${dialog.id}`, (draft) => {
      const emission = draft.emissions.find((item) => item.id === dialog.id);
      if (!emission) return;
      const client = draft.clients.find(
        (item) => item.id === emission.clientId,
      );
      const policy = draft.settings.colorRules.find(
        (item) => item.id === client?.colorRuleId,
      );
      emission.status = "Emitida";
      emission.invoiceNumbers = nfs.map((n) => n.trim());
      emission.dueDate = due;
      emission.observation = observation;
      emission.invoiceNumbers.forEach((invoice) =>
        draft.collections.unshift({
          id: uid("cobranca"),
          clientId: emission.clientId,
          invoice,
          dueDate: due,
          amount: emission.amount / emission.invoiceNumbers.length,
          priority: client?.priority ?? "Verde",
          policyId: client?.colorRuleId ?? "color-green",
          status: "Pendente",
          responsible: client?.collectors[0] ?? "Natanael",
          nextContact: due + "T08:00",
          availableFrom: addDays(due, policy?.collectionDelayDays ?? 1),
          attempts: 0,
          history: [
            {
              at: new Date().toISOString(),
              user: "Sistema",
              channel: "Sistema",
              summary: `${client?.reminders ? "Lembrete programado para o vencimento. " : "Lembrete desativado para este cliente. "}Cobrança disponível em ${dateBR(addDays(due, policy?.collectionDelayDays ?? 1))}.`,
            },
          ],
        }),
      );
    });
    setDialog(null);
    toast.success("Emissão concluída. Lembrete e cobrança programados.");
  }

  const todayPending = state.emissions.filter(
    (e) => e.scheduledDate === today && e.status === "Pendente",
  ).length;
  const overdue = state.emissions.filter(
    (e) => e.scheduledDate < today && e.status === "Pendente",
  ).length;
  const needsOrderCheck = state.emissions.filter(
    (e) =>
      e.scheduledDate === today &&
      e.status === "Pendente" &&
      e.orderCheck === "A verificar",
  ).length;
  return (
    <>
      <PageTitle
        eyebrow="Módulo Financeiro"
        title="Contas a emitir"
        description="Agenda automática de fechamentos, notas de hoje, atrasadas e verificação de pedidos."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                commit("Atualizou agenda automática", (draft) =>
                  Object.assign(draft, ensureFinancialSchedule(draft)),
                )
              }
            >
              <RefreshCw /> Atualizar agenda
            </Button>
            <Button onClick={() => setManual(true)}>
              <Plus /> Emissão manual
            </Button>
          </>
        }
      />
      <div className="metrics-grid compact">
        <Metric
          label="Emitir hoje"
          value={todayPending}
          detail="visível sem abrir planilha"
          icon={CalendarDays}
        />
        <Metric
          label="Atrasadas"
          value={overdue}
          detail="datas de emissão vencidas"
          icon={Clock3}
          tone="red"
        />
        <Metric
          label="Verificar pedido"
          value={needsOrderCheck}
          detail="marcar Tem pedido ou Sem pedido"
          icon={Search}
          tone="blue"
        />
        <Metric
          label="Emitidas"
          value={state.emissions.filter((e) => e.status === "Emitida").length}
          detail="histórico registrado"
          icon={CheckCircle2}
          tone="green"
        />
      </div>
      <Card>
        <CardHeader>
          <div className="finance-scope">
            {["Hoje", "Atrasadas", "Próximas", "Todas"].map((value) => (
              <Button
                size="sm"
                key={value}
                variant={scope === value ? "default" : "outline"}
                onClick={() => setScope(value)}
              >
                {value}
                {value === "Hoje"
                  ? ` (${todayPending})`
                  : value === "Atrasadas"
                    ? ` (${overdue})`
                    : ""}
              </Button>
            ))}
          </div>
          <div className="toolbar">
            <div className="searchbox">
              <Search />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente"
              />
            </div>
            <NativeSelect
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            >
              <NativeSelectOption>Todas</NativeSelectOption>
              {state.settings.companies.map((item) => (
                <NativeSelectOption key={item.name}>
                  {item.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <NativeSelectOption>Todos</NativeSelectOption>
              {["Pendente", "Emitida", "Sem pedido", "Cancelada"].map(
                (value) => (
                  <NativeSelectOption key={value}>{value}</NativeSelectOption>
                ),
              )}
            </NativeSelect>
          </div>
        </CardHeader>
        <CardContent className="table-shell">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emissão</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Regra</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((emission) => {
                const client = state.clients.find(
                  (item) => item.id === emission.clientId,
                );
                const late =
                  emission.scheduledDate < today &&
                  emission.status === "Pendente";
                return (
                  <TableRow
                    key={emission.id}
                    className={late ? "late-row" : ""}
                  >
                    <TableCell>
                      <strong>{dateBR(emission.scheduledDate)}</strong>
                      {late && (
                        <small className="cell-note danger-text">
                          {daysBetween(emission.scheduledDate, today)} dia(s)
                          atrasada
                        </small>
                      )}
                      {emission.scheduledDate !== emission.originalDate && (
                        <small className="cell-note">Adiantada</small>
                      )}
                    </TableCell>
                    <TableCell>
                      <strong>{client?.name}</strong>
                      <small className="cell-note">
                        {emission.company.replace("Indústria de Pães ", "")}
                      </small>
                    </TableCell>
                    <TableCell>{emission.category}</TableCell>
                    <TableCell>
                      <Status>{emission.orderCheck}</Status>
                    </TableCell>
                    <TableCell>{emission.responsible}</TableCell>
                    <TableCell>{dateBR(emission.dueDate)}</TableCell>
                    <TableCell>
                      <Status>{emission.status}</Status>
                    </TableCell>
                    <TableCell className="right">
                      {emission.status === "Pendente" && (
                        <>
                          {emission.orderCheck === "A verificar" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                commit(
                                  `Confirmou pedido ${emission.id}`,
                                  (draft) => {
                                    const item = draft.emissions.find(
                                      (current) => current.id === emission.id,
                                    );
                                    if (item) item.orderCheck = "Tem pedido";
                                  },
                                )
                              }
                            >
                              <Check /> Tem pedido
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={emission.orderCheck === "A verificar"}
                            onClick={() => openComplete(emission)}
                          >
                            <ReceiptText /> Emitir NF
                          </Button>
                          {emission.orderCheck !== "Não necessário" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                commit(
                                  `Marcou ${emission.id} sem pedido`,
                                  (draft) => {
                                    const item = draft.emissions.find(
                                      (current) => current.id === emission.id,
                                    );
                                    if (item) {
                                      item.status = "Sem pedido";
                                      item.orderCheck = "Sem pedido";
                                      item.observation =
                                        "Sem pedido confirmado; não gerou cobrança.";
                                    }
                                  },
                                )
                              }
                            >
                              Sem pedido
                            </Button>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog
        open={Boolean(dialog)}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          {dialog && (
            <>
              <DialogHeader>
                <DialogTitle>Concluir emissão</DialogTitle>
                <DialogDescription>
                  {state.clients.find((c) => c.id === dialog.clientId)?.name} ·{" "}
                  {dateBR(dialog.scheduledDate)}
                </DialogDescription>
              </DialogHeader>
              <div className="stack">
                <Label>Número(s) da NF</Label>
                {nfs.map((nf, index) => (
                  <div className="inline" key={index}>
                    <Input
                      value={nf}
                      onChange={(event) =>
                        setNfs(
                          nfs.map((item, current) =>
                            current === index ? event.target.value : item,
                          ),
                        )
                      }
                    />
                    {nfs.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setNfs(nfs.filter((_, current) => current !== index))
                        }
                      >
                        <X />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNfs([...nfs, ""])}
                >
                  <Plus /> Adicionar NF
                </Button>
                <Field label="Vencimento calculado">
                  <Input
                    type="date"
                    value={due}
                    onChange={(event) => setDue(event.target.value)}
                  />
                </Field>
                <Field label="Observação">
                  <Textarea
                    value={observation}
                    onChange={(event) => setObservation(event.target.value)}
                  />
                </Field>
                <div className="callout">
                  <CircleDollarSign />
                  <span>
                    No vencimento, o cobrador recebe um lembrete. A cobrança
                    entra na fila conforme a política do cliente.
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>
                  Cancelar
                </Button>
                <Button onClick={complete}>Concluir emissão</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <ManualEmission
        open={manual}
        onClose={() => setManual(false)}
        state={state}
        commit={commit}
      />
    </>
  );
}
function ManualEmission({
  open,
  onClose,
  state,
  commit,
}: {
  open: boolean;
  onClose: () => void;
  state: AppState;
  commit: Commit;
}) {
  const [clientId, setClientId] = useState(state.clients[0]?.id ?? ""),
    [date, setDate] = useState(today),
    [amount, setAmount] = useState(0);
  function save() {
    const c = state.clients.find((x) => x.id === clientId);
    if (!c) return;
    const closing = state.settings.closingRules.find(
        (rule) => rule.id === c.closingRuleId,
      ),
      dueRule = state.settings.dueRules.find((rule) => rule.id === c.dueRuleId);
    commit(`Criou emissão manual para ${c.name}`, (d) =>
      d.emissions.unshift({
        id: uid("emissao"),
        clientId,
        scheduledDate: date,
        originalDate: date,
        company: c.company,
        category: "Emissão manual",
        priority: "Média",
        responsible: c.issuer,
        status: "Pendente",
        invoiceNumbers: [],
        dueDate: calculateDueDate(date, dueRule),
        observation: "Emissão manual; não altera o cronograma automático.",
        amount,
        orderCheck:
          c.requiresOrderCheck || closing?.requiresOrderCheck
            ? "A verificar"
            : "Não necessário",
        autoGenerated: false,
      }),
    );
    onClose();
    toast.success("Emissão criada");
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova emissão manual</DialogTitle>
          <DialogDescription>
            Não altera o cronograma futuro do cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="stack">
          <Field label="Cliente">
            <NativeSelect
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              {state.clients.map((c) => (
                <NativeSelectOption value={c.id} key={c.id}>
                  {c.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Data">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Valor estimado">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CollectionQueue({
  state,
  commit,
  user,
  token,
}: {
  state: AppState;
  commit: Commit;
  user: string;
  token: string;
}) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("Todos"),
    [scope, setScope] = useState("Cobrar hoje"),
    [selected, setSelected] = useState<string[]>([]),
    [acting, setActing] = useState<Collection | null>(null),
    [mode, setMode] = useState<"contact" | "payment" | "reschedule" | "cancel">(
      "contact",
    ),
    [summary, setSummary] = useState(""),
    [nextContact, setNextContact] = useState(""),
    [proof, setProof] = useState<File | null>(null),
    [manual, setManual] = useState(false),
    [manualClient, setManualClient] = useState(state.clients[0]?.id || ""),
    [manualInvoice, setManualInvoice] = useState(""),
    [manualDue, setManualDue] = useState(today),
    [manualAmount, setManualAmount] = useState(0);
  const active = (item: Collection) =>
    !["Paga", "Baixada", "Arquivada"].includes(item.status);
  const remindersToday = state.collections.filter(
    (item) =>
      active(item) &&
      item.dueDate === today &&
      state.clients.find((client) => client.id === item.clientId)?.reminders,
  );
  const chargeableToday = state.collections.filter(
    (item) => active(item) && item.availableFrom <= today,
  );
  const filtered = state.collections.filter((item) => {
    const clientName =
      state.clients.find((client) => client.id === item.clientId)?.name || "";
    const inScope =
      scope === "Todas" ||
      (scope === "Vencem hoje" && item.dueDate === today && active(item)) ||
      (scope === "Cobrar hoje" && item.availableFrom <= today && active(item));
    return (
      inScope &&
      (filter === "Todos" ||
        item.status === filter ||
        item.priority === filter) &&
      clientName.toLowerCase().includes(search.toLowerCase())
    );
  });
  const counts = (statusName: Collection["status"]) =>
    state.collections.filter((item) => item.status === statusName).length;
  function start(item: Collection, m: typeof mode) {
    setActing(item);
    setMode(m);
    setSummary("");
    setNextContact(item.nextContact.slice(0, 16));
    setProof(null);
  }
  async function apply() {
    if (!acting) return;
    const chosenProof =
      proof ??
      document.querySelector<HTMLInputElement>(
        'input[accept=".pdf,.jpg,.jpeg,.png"]',
      )?.files?.[0] ??
      null;
    if (mode === "contact" && !summary.trim())
      return toast.error("Resumo obrigatório");
    if (mode === "payment" && !chosenProof)
      return toast.error("Anexe o comprovante de pagamento");
    if (mode === "payment" && chosenProof && chosenProof.size > 5 * 1024 * 1024)
      return toast.error("O comprovante deve ter no máximo 5 MB");
    if (mode === "payment" && chosenProof && token !== "local-demo") {
      const form = new FormData();
      form.append("file", chosenProof);
      const uploaded = await fetch("/api/files", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: form,
      });
      if (!uploaded.ok)
        return toast.error("Não foi possível salvar o comprovante");
    }
    commit(`Atualizou cobrança NF ${acting.invoice}`, (d) => {
      const x = d.collections.find((c) => c.id === acting.id);
      if (!x) return;
      if (mode === "contact") {
        x.status = "Em andamento";
        x.attempts++;
        x.history.unshift({
          at: new Date().toISOString(),
          user,
          channel: "WhatsApp",
          summary,
        });
      }
      if (mode === "payment") {
        x.status = "Paga";
        x.paidAt = new Date().toISOString();
        x.proofName = chosenProof?.name;
        x.history.unshift({
          at: new Date().toISOString(),
          user,
          channel: "Sistema",
          summary: `${summary || "Pagamento registrado; aguardando baixa de Marcelo ou Jessica."} Comprovante: ${chosenProof?.name}.`,
        });
      }
      if (mode === "reschedule") {
        x.status = "Reagendada";
        x.nextContact = nextContact;
        x.history.unshift({
          at: new Date().toISOString(),
          user,
          channel: "Sistema",
          summary: summary || "Cobrança reagendada.",
        });
      }
      if (mode === "cancel") {
        x.status = "Cancelamento pendente";
        x.history.unshift({
          at: new Date().toISOString(),
          user,
          channel: "Sistema",
          summary:
            summary ||
            "Não pagamento após cobrança imediata; fornecimento encaminhado para cancelamento.",
        });
      }
    });
    setActing(null);
    toast.success("Cobrança atualizada");
  }
  function createManual() {
    const client = state.clients.find((item) => item.id === manualClient);
    if (!client || !manualInvoice.trim())
      return toast.error("Informe cliente e NF");
    const policy = state.settings.colorRules.find(
      (item) => item.id === client.colorRuleId,
    );
    commit(`Criou cobrança manual NF ${manualInvoice}`, (draft) =>
      draft.collections.unshift({
        id: uid("cobranca"),
        clientId: client.id,
        invoice: manualInvoice.trim(),
        dueDate: manualDue,
        amount: manualAmount,
        priority: client.priority,
        policyId: client.colorRuleId,
        status: "Pendente",
        responsible: client.collectors[0] || "Natanael",
        nextContact: `${manualDue}T08:00`,
        availableFrom: addDays(manualDue, policy?.collectionDelayDays ?? 1),
        attempts: 0,
        history: [
          {
            at: new Date().toISOString(),
            user,
            channel: "Sistema",
            summary: "Cobrança criada manualmente.",
          },
        ],
      }),
    );
    setManual(false);
    setManualInvoice("");
    toast.success("Cobrança criada");
  }
  return (
    <>
      <PageTitle
        eyebrow="Ciclo financeiro"
        title="Cobranças"
        description="No vencimento há lembrete; a fila de cobrança começa depois, conforme a política escolhida para o cliente."
        actions={
          <Button onClick={() => setManual(true)}>
            <Plus /> Nova cobrança
          </Button>
        }
      />
      <div className="policy-banner">
        <div className="green">
          <strong>Verde</strong>
          <span>
            Várias pendências; cobrar normalmente; não cancelar entregas.
          </span>
        </div>
        <div className="yellow">
          <strong>Amarelo</strong>
          <span>No máximo duas pendências em aberto.</span>
        </div>
        <div className="red">
          <strong>Vermelho</strong>
          <span>
            Nenhuma pendência vencida; cobrar no dia seguinte e cancelar se não
            pagar.
          </span>
        </div>
      </div>
      <div className="metrics-grid compact">
        <Metric
          label="Vencem hoje"
          value={remindersToday.length}
          detail="lembretes aos cobradores"
          icon={Bell}
        />
        <Metric
          label="Cobrar hoje"
          value={chargeableToday.length}
          detail="após o vencimento"
          icon={WalletCards}
          tone="red"
        />
        <Metric
          label="Em andamento"
          value={counts("Em andamento") + counts("Reagendada")}
          detail="inclui reagendadas"
          icon={RefreshCw}
          tone="blue"
        />
        <Metric
          label="Pagas"
          value={counts("Paga")}
          detail="aguardando baixa"
          icon={CheckCircle2}
          tone="green"
        />
      </div>
      <Card>
        <CardHeader>
          <div className="finance-scope">
            {["Cobrar hoje", "Vencem hoje", "Todas"].map((value) => (
              <Button
                size="sm"
                key={value}
                variant={scope === value ? "default" : "outline"}
                onClick={() => setScope(value)}
              >
                {value}
              </Button>
            ))}
          </div>
          <div className="toolbar">
            <div className="searchbox">
              <Search />
              <Input
                placeholder="Buscar cliente"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <NativeSelect
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <NativeSelectOption>Todos</NativeSelectOption>
              {[
                "Pendente",
                "Em andamento",
                "Reagendada",
                "Paga",
                "Baixada",
                "Cancelamento pendente",
                "Vermelho",
                "Amarelo",
                "Verde",
              ].map((x) => (
                <NativeSelectOption key={x}>{x}</NativeSelectOption>
              ))}
            </NativeSelect>
            {selected.length > 0 && (
              <div className="bulk">
                <strong>{selected.length} selecionadas</strong>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    commit("Arquivou cobranças em massa", (d) =>
                      d.collections.forEach((c) => {
                        if (selected.includes(c.id)) c.status = "Arquivada";
                      }),
                    );
                    setSelected([]);
                  }}
                >
                  <Archive /> Arquivar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="table-shell">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox
                    checked={
                      filtered.length > 0 && selected.length === filtered.length
                    }
                    onCheckedChange={(v) =>
                      setSelected(v ? filtered.map((c) => c.id) : [])
                    }
                  />
                </TableHead>
                <TableHead>Cliente / NF</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Política e limite</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="right">Registrar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const guidance = collectionGuidance(state, item.clientId),
                  client = state.clients.find(
                    (current) => current.id === item.clientId,
                  ),
                  canCharge = item.availableFrom <= today,
                  overdueDays = Math.max(0, daysBetween(item.dueDate, today)),
                  canCancel =
                    guidance.policy?.cancelAfterUnpaid &&
                    overdueDays >= (client?.cancellationDays || 1) &&
                    item.attempts > 0;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(item.id)}
                        onCheckedChange={(v) =>
                          setSelected(
                            v
                              ? [...selected, item.id]
                              : selected.filter((id) => id !== item.id),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <strong>{client?.name}</strong>
                      <small className="cell-note">
                        NF {item.invoice} · {money.format(item.amount)}
                      </small>
                    </TableCell>
                    <TableCell>
                      <strong>{dateBR(item.dueDate)}</strong>
                      <small
                        className={`cell-note ${overdueDays ? "danger-text" : ""}`}
                      >
                        {item.dueDate === today
                          ? "Vence hoje · lembrete"
                          : overdueDays
                            ? `${overdueDays} dia(s) de atraso`
                            : `Cobrar a partir de ${dateBR(item.availableFrom)}`}
                      </small>
                    </TableCell>
                    <TableCell>
                      <Status>{guidance.policy?.name || item.priority}</Status>
                      <small className="cell-note">{guidance.label}</small>
                    </TableCell>
                    <TableCell>
                      {item.responsible}
                      <small className="cell-note">
                        {item.attempts} tentativa(s)
                      </small>
                    </TableCell>
                    <TableCell>
                      <Status>{item.status}</Status>
                    </TableCell>
                    <TableCell className="right">
                      {canCharge ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => start(item, "contact")}
                        >
                          Cobrar
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          <Bell /> Lembrete
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => start(item, "payment")}
                      >
                        <Check /> Pago
                      </Button>
                      {canCancel ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => start(item, "cancel")}
                        >
                          <TriangleAlert /> Cancelar
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => start(item, "reschedule")}
                        >
                          <CalendarDays />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog
        open={Boolean(acting)}
        onOpenChange={(o) => !o && setActing(null)}
      >
        <DialogContent>
          {acting && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {
                    {
                      contact: "Registrar cobrança",
                      payment: "Registrar pagamento",
                      reschedule: "Reagendar cobrança",
                      cancel: "Encaminhar cancelamento",
                    }[mode]
                  }
                </DialogTitle>
                <DialogDescription>
                  {state.clients.find((c) => c.id === acting.clientId)?.name} ·
                  NF {acting.invoice} · {money.format(acting.amount)}
                </DialogDescription>
              </DialogHeader>
              <div className="stack">
                {mode === "contact" && (
                  <Field label="Meio">
                    <NativeSelect>
                      <NativeSelectOption>WhatsApp</NativeSelectOption>
                      <NativeSelectOption>E-mail</NativeSelectOption>
                      <NativeSelectOption>Telefone</NativeSelectOption>
                      <NativeSelectOption>Presencial</NativeSelectOption>
                    </NativeSelect>
                  </Field>
                )}
                {mode === "payment" && (
                  <>
                    <Field label="Pagamento">
                      <NativeSelect>
                        {state.settings.paymentMethods.map((x) => (
                          <NativeSelectOption key={x}>{x}</NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label="Comprovante">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setProof(e.target.files?.[0] || null)}
                      />
                    </Field>
                  </>
                )}
                {mode === "reschedule" && (
                  <Field label="Próximo contato">
                    <Input
                      type="datetime-local"
                      value={nextContact}
                      onChange={(e) => setNextContact(e.target.value)}
                    />
                  </Field>
                )}
                <Field
                  label={
                    mode === "contact"
                      ? "Resumo (obrigatório)"
                      : "Observações / justificativa"
                  }
                >
                  <Textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </Field>
                {mode === "cancel" && (
                  <div className="callout danger">
                    <TriangleAlert />
                    <span>
                      O fornecimento será encaminhado para cancelamento por
                      falta de pagamento.
                    </span>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setActing(null)}>
                  Cancelar
                </Button>
                <Button onClick={apply}>Confirmar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={manual} onOpenChange={setManual}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova cobrança manual</DialogTitle>
            <DialogDescription>
              Use para cobranças que não vieram de uma emissão registrada.
            </DialogDescription>
          </DialogHeader>
          <div className="stack">
            <Field label="Cliente">
              <NativeSelect
                value={manualClient}
                onChange={(e) => setManualClient(e.target.value)}
              >
                {state.clients.map((client) => (
                  <NativeSelectOption value={client.id} key={client.id}>
                    {client.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field label="NF / referência">
              <Input
                value={manualInvoice}
                onChange={(e) => setManualInvoice(e.target.value)}
              />
            </Field>
            <Field label="Vencimento">
              <Input
                type="date"
                value={manualDue}
                onChange={(e) => setManualDue(e.target.value)}
              />
            </Field>
            <Field label="Valor">
              <Input
                type="number"
                value={manualAmount}
                onChange={(e) => setManualAmount(Number(e.target.value))}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManual(false)}>
              Cancelar
            </Button>
            <Button onClick={createManual}>Criar cobrança</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TaskCatalog({ state, commit }: { state: AppState; commit: Commit }) {
  const [day, setDay] = useState("Quinta"),
    [nature, setNature] = useState("Todas");
  const [editing, setEditing] = useState<Task | null>(null);
  const shown = state.tasks.filter(
      (t) =>
        t.days.includes(day) && (nature === "Todas" || t.nature === nature),
    ),
    done = shown.filter((t) => t.completed).length;
  const blank: Task = {
    id: "",
    title: "",
    category: "Notas Fiscais",
    nature: "Execução",
    days: [day],
    responsible: "Willians",
    time: "08:00",
    priority: "Média",
    notes: "",
    subitems: [],
    completed: false,
  };
  function save() {
    if (!editing?.title.trim()) return toast.error("Informe o nome");
    const item = { ...editing, id: editing.id || uid("tarefa") };
    commit(`${editing.id ? "Editou" : "Criou"} ${item.title}`, (d) => {
      const i = d.tasks.findIndex((t) => t.id === item.id);
      if (i >= 0) d.tasks[i] = item;
      else d.tasks.unshift(item);
    });
    setEditing(null);
    toast.success("Tarefa salva");
  }
  return (
    <>
      <PageTitle
        eyebrow="Checklist diário"
        title="Tarefas da equipe"
        description="Recorrências flexíveis, naturezas obrigatórias, subitens e tarefas avulsas."
        actions={
          <Button onClick={() => setEditing(blank)}>
            <Plus /> Nova tarefa
          </Button>
        }
      />
      <div className="day-strip">
        {dayNames.map((name) => (
          <button
            key={name}
            className={day === name ? "active" : ""}
            onClick={() => setDay(name)}
          >
            <span>{name.slice(0, 3)}</span>
            <strong>
              {state.tasks.filter((t) => t.days.includes(name)).length}
            </strong>
          </button>
        ))}
      </div>
      <div className="task-layout">
        <Card>
          <CardHeader>
            <div className="row">
              <div>
                <CardTitle>{day}</CardTitle>
                <CardDescription>
                  {done} de {shown.length} concluídas
                </CardDescription>
              </div>
              <NativeSelect
                value={nature}
                onChange={(e) => setNature(e.target.value)}
              >
                <NativeSelectOption>Todas</NativeSelectOption>
                {["Emissão", "Verificação", "Execução", "Lembrete"].map((x) => (
                  <NativeSelectOption key={x}>{x}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <Progress value={shown.length ? (done / shown.length) * 100 : 0} />
          </CardHeader>
          <CardContent className="task-list">
            {shown.map((task) => (
              <article key={task.id} className={task.completed ? "done" : ""}>
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(v) =>
                    commit(
                      `${v ? "Concluiu" : "Reabriu"} ${task.title}`,
                      (d) => {
                        const x = d.tasks.find((t) => t.id === task.id);
                        if (x) x.completed = Boolean(v);
                      },
                    )
                  }
                />
                <div
                  className={`nature nature-${task.nature
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")}`}
                >
                  {task.nature.slice(0, 1)}
                </div>
                <div className="task-copy">
                  <div>
                    <strong>{task.title}</strong>
                    <Status>{task.priority}</Status>
                  </div>
                  <p>{task.notes}</p>
                  {task.subitems.length > 0 && (
                    <div className="chips">
                      {task.subitems.map((x) => (
                        <span key={x}>{x}</span>
                      ))}
                    </div>
                  )}
                  <small>
                    <Clock3 /> {task.time} · {task.responsible} ·{" "}
                    {task.days.join(", ")}
                  </small>
                </div>
                <div className="task-actions">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      commit(`Duplicou ${task.title}`, (d) =>
                        d.tasks.unshift({
                          ...task,
                          id: uid("tarefa"),
                          title: `${task.title} (cópia)`,
                          completed: false,
                        }),
                      );
                      toast.success("Duplicada");
                    }}
                  >
                    <Copy />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing({ ...task })}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Excluir tarefa"
                    onClick={() =>
                      commit(`Excluiu ${task.title}`, (draft) => {
                        draft.tasks = draft.tasks.filter(
                          (item) => item.id !== task.id,
                        );
                      })
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>
        <aside className="task-aside">
          <Card>
            <CardHeader>
              <CardTitle>Legenda</CardTitle>
            </CardHeader>
            <CardContent className="legend">
              {[
                ["E", "Emissão", "Gera item no Financeiro"],
                ["V", "Verificação", "Exige OK ou divergente"],
                ["X", "Execução", "Ação operacional"],
                ["L", "Lembrete", "Notificação no horário"],
              ].map(([a, b, c]) => (
                <div key={b}>
                  <i>{a}</i>
                  <span>
                    <strong>{b}</strong>
                    <small>{c}</small>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="note-card">
            <CardHeader>
              <CardTitle>Recados importantes</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Conferir planilhas, pedidos com alteração e quadro de OK antes
                dos cadastros.
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  setEditing({
                    ...blank,
                    title: "Conferência de entregas",
                    category: "Conferência",
                    nature: "Verificação",
                    priority: "Alta",
                    notes:
                      "Conferir pedidos com alterações usando planilhas e quadro de OK.",
                  })
                }
              >
                <Plus /> Transformar em tarefa
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <DialogContent className="dialog-wide">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {editing.id ? "Editar tarefa" : "Nova tarefa"}
                </DialogTitle>
                <DialogDescription>
                  A natureza define o comportamento da tarefa.
                </DialogDescription>
              </DialogHeader>
              <div className="form-grid">
                <Field label="Nome" full>
                  <Input
                    value={editing.title}
                    onChange={(e) =>
                      setEditing({ ...editing, title: e.target.value })
                    }
                  />
                </Field>
                <Field label="Categoria">
                  <Input
                    value={editing.category}
                    onChange={(e) =>
                      setEditing({ ...editing, category: e.target.value })
                    }
                  />
                </Field>
                <Field label="Natureza">
                  <NativeSelect
                    value={editing.nature}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        nature: e.target.value as TaskNature,
                      })
                    }
                  >
                    {["Emissão", "Verificação", "Execução", "Lembrete"].map(
                      (x) => (
                        <NativeSelectOption key={x}>{x}</NativeSelectOption>
                      ),
                    )}
                  </NativeSelect>
                </Field>
                <Field label="Responsável">
                  <NativeSelect
                    value={editing.responsible}
                    onChange={(e) =>
                      setEditing({ ...editing, responsible: e.target.value })
                    }
                  >
                    {state.settings.users.map((x) => (
                      <NativeSelectOption key={x.name}>
                        {x.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Horário">
                  <Input
                    type="time"
                    value={editing.time}
                    onChange={(e) =>
                      setEditing({ ...editing, time: e.target.value })
                    }
                  />
                </Field>
                <Field label="Prioridade">
                  <NativeSelect
                    value={editing.priority}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        priority: e.target.value as Task["priority"],
                      })
                    }
                  >
                    {["Alta", "Média", "Baixa"].map((x) => (
                      <NativeSelectOption key={x}>{x}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Dias" full>
                  <div className="weekday-picker">
                    {dayNames.map((name) => (
                      <label key={name}>
                        <Checkbox
                          checked={editing.days.includes(name)}
                          onCheckedChange={(v) =>
                            setEditing({
                              ...editing,
                              days: v
                                ? [...editing.days, name]
                                : editing.days.filter((x) => x !== name),
                            })
                          }
                        />{" "}
                        {name}
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Subitens (um por linha)" full>
                  <Textarea
                    value={editing.subitems.join("\n")}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        subitems: e.target.value.split("\n").filter(Boolean),
                      })
                    }
                  />
                </Field>
                <Field label="Observações" full>
                  <Textarea
                    value={editing.notes}
                    onChange={(e) =>
                      setEditing({ ...editing, notes: e.target.value })
                    }
                  />
                </Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
                <Button onClick={save}>Salvar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function RouteBase({ state, commit }: { state: AppState; commit: Commit }) {
  const [base, setBase] = useState("dias-uteis"),
    [driver, setDriver] = useState("Todos"),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(0),
    [adding, setAdding] = useState(false),
    [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [newRoute, setNewRoute] = useState({
    driver: "Retirado",
    time: "03:00",
    client: "",
    french: "",
    milk: "",
    notes: "",
    rule: "programado" as RouteRecord["rule"],
  });
  const baseRows = state.routes.filter((r) => r.base === base),
    drivers = [...new Set(baseRows.map((r) => r.driver))],
    filtered = baseRows.filter(
      (r) =>
        (driver === "Todos" || r.driver === driver) &&
        [r.client, r.notes]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
    ),
    rows = filtered.slice(page * 25, page * 25 + 25),
    registered = baseRows.filter((r) => r.registered).length,
    checked = baseRows.filter((r) => r.checked).length;
  useEffect(() => setPage(0), [base, driver, search]);
  function toggle(id: string, field: "registered" | "checked", value: boolean) {
    commit(`${value ? "Marcou" : "Desmarcou"} rota`, (d) => {
      const x = d.routes.find((r) => r.id === id);
      if (x) {
        x[field] = value;
        if (field === "registered" && !value) x.checked = false;
        if (field === "checked" && value) x.registered = true;
      }
    });
  }
  function publish() {
    const missing = baseRows.filter((r) => !r.time || !r.client || !r.driver);
    if (missing.length)
      return toast.error(`${missing.length} registros incompletos`);
    const pending = baseRows.filter((r) => !r.checked).length;
    if (pending) return toast.warning(`${pending} registros sem conferência`);
    toast.success("Base publicada e versão oficial criada");
  }
  return (
    <>
      <PageTitle
        eyebrow="Planejamento mensal"
        title="Base de rotas e pedidos"
        description="As 685 linhas das planilhas foram estruturadas por entregador, horário, regra e conferência."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setEditingRouteId(null);
                setNewRoute({
                  driver: "Retirado",
                  time: "03:00",
                  client: "",
                  french: "",
                  milk: "",
                  notes: "",
                  rule: "programado",
                });
                setAdding(true);
              }}
            >
              <Plus /> Nova parada
            </Button>
            <Button onClick={publish}>
              <PackageCheck /> Publicar base
            </Button>
          </>
        }
      />
      <div className="route-tabs">
        {[
          ["dias-uteis", "Dias úteis"],
          ["sabado", "Sábado"],
          ["domingo", "Domingo"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => {
              setBase(id);
              setDriver("Todos");
            }}
            className={base === id ? "active" : ""}
          >
            <span>{label}</span>
            <strong>{state.routes.filter((r) => r.base === id).length}</strong>
          </button>
        ))}
      </div>
      <div className="route-progress">
        <div>
          <span>
            <strong>{registered}</strong> cadastrados
          </span>
          <span>
            <strong>{checked}</strong> conferidos
          </span>
          <span>
            <strong>
              {baseRows.filter((r) => r.rule === "sob-demanda").length}
            </strong>{" "}
            sob demanda
          </span>
        </div>
        <Progress value={(checked / baseRows.length) * 100} />
        <small>
          Publicação bloqueada enquanto houver campos obrigatórios vazios ou
          itens sem conferência.
        </small>
      </div>
      <Card>
        <CardHeader>
          <div className="toolbar">
            <div className="searchbox">
              <Search />
              <Input
                placeholder="Cliente ou observação"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <NativeSelect
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
            >
              <NativeSelectOption>Todos</NativeSelectOption>
              {drivers.map((x) => (
                <NativeSelectOption key={x}>{x}</NativeSelectOption>
              ))}
            </NativeSelect>
            <span className="result-count">{filtered.length} paradas</span>
          </div>
        </CardHeader>
        <CardContent className="table-shell">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horário</TableHead>
                <TableHead>Entregador / Viagem</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Francês</TableHead>
                <TableHead>Leite</TableHead>
                <TableHead>Regra e observações</TableHead>
                <TableHead>Cadastrado</TableHead>
                <TableHead>Conferido</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <strong>{r.time}</strong>
                  </TableCell>
                  <TableCell>
                    {r.driver}
                    <small className="cell-note">{r.batch}</small>
                  </TableCell>
                  <TableCell>
                    <strong>{r.client}</strong>
                  </TableCell>
                  <TableCell>{r.french || "-"}</TableCell>
                  <TableCell>{r.milk || "-"}</TableCell>
                  <TableCell>
                    <Status>
                      {r.rule === "sob-demanda"
                        ? "Sob demanda"
                        : r.rule === "fixo"
                          ? "Fixo"
                          : "Programado"}
                    </Status>
                    <small className="route-note">{r.notes}</small>
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={r.registered}
                      onCheckedChange={(v) =>
                        toggle(r.id, "registered", Boolean(v))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={r.checked}
                      onCheckedChange={(v) =>
                        toggle(r.id, "checked", Boolean(v))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="table-actions">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingRouteId(r.id);
                          setNewRoute({
                            driver: r.driver,
                            time: r.time,
                            client: r.client,
                            french: r.french,
                            milk: r.milk,
                            notes: r.notes,
                            rule: r.rule,
                          });
                          setAdding(true);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          commit(`Excluiu parada ${r.client}`, (draft) => {
                            draft.routes = draft.routes.filter(
                              (item) => item.id !== r.id,
                            );
                          })
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="pagination">
            <Button
              variant="outline"
              size="sm"
              disabled={!page}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft /> Anterior
            </Button>
            <span>
              Página {page + 1} de{" "}
              {Math.max(1, Math.ceil(filtered.length / 25))}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={(page + 1) * 25 >= filtered.length}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima <ChevronRight />
            </Button>
          </div>
        </CardContent>
      </Card>
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRouteId ? "Editar parada" : "Nova parada"}
            </DialogTitle>
            <DialogDescription>
              Adicione uma exceção ou novo cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="stack">
            <Field label="Entregador">
              <NativeSelect
                value={newRoute.driver}
                onChange={(e) =>
                  setNewRoute({ ...newRoute, driver: e.target.value })
                }
              >
                {drivers.map((x) => (
                  <NativeSelectOption key={x}>{x}</NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Horário">
              <Input
                type="time"
                value={newRoute.time}
                onChange={(e) =>
                  setNewRoute({ ...newRoute, time: e.target.value })
                }
              />
            </Field>
            <Field label="Cliente">
              <Input
                value={newRoute.client}
                onChange={(e) =>
                  setNewRoute({ ...newRoute, client: e.target.value })
                }
              />
            </Field>
            <div className="inline">
              <Field label="Francês">
                <Input
                  value={newRoute.french}
                  onChange={(e) =>
                    setNewRoute({ ...newRoute, french: e.target.value })
                  }
                />
              </Field>
              <Field label="Leite">
                <Input
                  value={newRoute.milk}
                  onChange={(e) =>
                    setNewRoute({ ...newRoute, milk: e.target.value })
                  }
                />
              </Field>
            </div>
            <Field label="Regra">
              <NativeSelect
                value={newRoute.rule}
                onChange={(e) =>
                  setNewRoute({
                    ...newRoute,
                    rule: e.target.value as RouteRecord["rule"],
                  })
                }
              >
                <NativeSelectOption value="fixo">Fixo</NativeSelectOption>
                <NativeSelectOption value="programado">
                  Programado
                </NativeSelectOption>
                <NativeSelectOption value="sob-demanda">
                  Sob demanda
                </NativeSelectOption>
              </NativeSelect>
            </Field>
            <Field label="Observações">
              <Textarea
                value={newRoute.notes}
                onChange={(e) =>
                  setNewRoute({ ...newRoute, notes: e.target.value })
                }
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!newRoute.client) return toast.error("Informe o cliente");
                commit(
                  `${editingRouteId ? "Editou" : "Adicionou"} ${newRoute.client} na rota`,
                  (d) => {
                    const existing = d.routes.find(
                      (item) => item.id === editingRouteId,
                    );
                    if (existing) Object.assign(existing, newRoute);
                    else
                      d.routes.unshift({
                        id: uid("rota"),
                        base,
                        source: "Cadastro manual",
                        driver: newRoute.driver,
                        batch: "1ª entrega",
                        time: newRoute.time,
                        client: newRoute.client,
                        french: newRoute.french,
                        milk: newRoute.milk,
                        notes: newRoute.notes,
                        rule: newRoute.rule,
                        registered: false,
                        checked: false,
                      });
                  },
                );
                setAdding(false);
                setEditingRouteId(null);
              }}
            >
              {editingRouteId ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DocumentGenerator({
  state,
  commit,
}: {
  state: AppState;
  commit: Commit;
}) {
  const [open, setOpen] = useState(false),
    [type, setType] = useState("Cotação"),
    [company, setCompany] = useState(state.settings.companies[0].name),
    [client, setClient] = useState("SESI Taubaté"),
    [date, setDate] = useState(today),
    [invoice, setInvoice] = useState("38.754"),
    [amount, setAmount] = useState(300),
    [items, setItems] = useState([
      {
        description: "Lanche de Metro Salpicão de Frango",
        qty: 2,
        unit: "Und",
        price: 90,
      },
    ]),
    [preview, setPreview] = useState(false);
  const companyData =
      state.settings.companies.find((c) => c.name === company) ??
      state.settings.companies[0],
    template =
      state.settings.documentTemplates.find((item) => item.id === type) ||
      state.settings.documentTemplates[0],
    total = items.reduce((s, i) => s + i.qty * i.price, 0);
  function generate() {
    commit(`Gerou ${type} para ${client}`, (d) =>
      d.documents.unshift({
        id: uid("doc"),
        type,
        company,
        client,
        date,
        total: type === "Declaração Bancária" ? amount : total,
        status: "Gerado",
      }),
    );
    setPreview(true);
    toast.success("Documento salvo no histórico");
  }
  return (
    <>
      <PageTitle
        eyebrow="Modelos corporativos"
        title="Documentos"
        description="Cotações, comprovantes e declarações com identidade e assinaturas configuráveis."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Gerar documento
          </Button>
        }
      />
      <div className="template-grid">
        {state.settings.documentTemplates
          .filter((item) => item.active)
          .map((item) => {
            const TemplateIcon =
              item.id === "Cotação"
                ? FilePenLine
                : item.id === "Comprovante de Entrega"
                  ? PackageCheck
                  : Building2;
            return (
              <Card key={item.id} className="template-card">
                <CardContent>
                  <TemplateIcon />
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.introduction}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setType(item.id);
                        setOpen(true);
                      }}
                    >
                      Usar modelo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>
            Versões geradas e prontas para reimpressão.
          </CardDescription>
        </CardHeader>
        <CardContent className="table-shell">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.documents.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <strong>{d.type}</strong>
                    <small className="cell-note">{d.id}</small>
                  </TableCell>
                  <TableCell>
                    {d.company.replace("Indústria de Pães ", "")}
                  </TableCell>
                  <TableCell>{d.client}</TableCell>
                  <TableCell>{dateBR(d.date)}</TableCell>
                  <TableCell>{d.total ? money.format(d.total) : "-"}</TableCell>
                  <TableCell>
                    <Status>{d.status}</Status>
                  </TableCell>
                  <TableCell className="right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.print()}
                    >
                      <Printer />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        commit(`Duplicou ${d.type}`, (x) =>
                          x.documents.unshift({
                            ...d,
                            id: uid("doc"),
                            date: today,
                            status: "Rascunho",
                          }),
                        )
                      }
                    >
                      <Copy />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="dialog-xl">
          <DialogHeader>
            <DialogTitle>Gerar documento</DialogTitle>
            <DialogDescription>
              Logo, dados, cores e assinatura mudam conforme a empresa.
            </DialogDescription>
          </DialogHeader>
          <div className="document-builder">
            <div className="document-form">
              <Field label="Tipo">
                <NativeSelect
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {state.settings.documentTemplates
                    .filter((item) => item.active)
                    .map((item) => (
                      <NativeSelectOption key={item.id} value={item.id}>
                        {item.name}
                      </NativeSelectOption>
                    ))}
                </NativeSelect>
              </Field>
              <Field label="Empresa">
                <NativeSelect
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                >
                  {state.settings.companies.map((c) => (
                    <NativeSelectOption key={c.name}>
                      {c.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Cliente / destinatário">
                <Input
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                />
              </Field>
              <Field label="Data">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
              {type === "Declaração Bancária" ? (
                <>
                  <Field label="NF">
                    <Input
                      value={invoice}
                      onChange={(e) => setInvoice(e.target.value)}
                    />
                  </Field>
                  <Field label="Valor">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Label>Itens</Label>
                  {items.map((item, i) => (
                    <div className="item-editor" key={i}>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          setItems(
                            items.map((x, j) =>
                              j === i
                                ? { ...x, description: e.target.value }
                                : x,
                            ),
                          )
                        }
                      />
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) =>
                          setItems(
                            items.map((x, j) =>
                              j === i
                                ? { ...x, qty: Number(e.target.value) }
                                : x,
                            ),
                          )
                        }
                      />
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          setItems(
                            items.map((x, j) =>
                              j === i
                                ? { ...x, price: Number(e.target.value) }
                                : x,
                            ),
                          )
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setItems(items.filter((_, j) => j !== i))
                        }
                      >
                        <X />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setItems([
                        ...items,
                        { description: "", qty: 1, unit: "Und", price: 0 },
                      ])
                    }
                  >
                    <Plus /> Adicionar item
                  </Button>
                </>
              )}
            </div>
            <DocumentPaper
              type={type}
              company={companyData}
              client={client}
              date={date}
              invoice={invoice}
              amount={amount}
              items={items}
              template={template}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={generate}>
              <Printer /> Gerar e salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="dialog-xl">
          <DialogHeader>
            <DialogTitle>Documento pronto</DialogTitle>
            <DialogDescription>
              Use a impressão do navegador para salvar em PDF A4.
            </DialogDescription>
          </DialogHeader>
          <DocumentPaper
            type={type}
            company={companyData}
            client={client}
            date={date}
            invoice={invoice}
            amount={amount}
            items={items}
            template={template}
            print
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(false)}>
              Fechar
            </Button>
            <Button onClick={() => window.print()}>
              <Printer /> Imprimir / Salvar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
function DocumentPaper({
  type,
  company,
  client,
  date,
  invoice,
  amount,
  items,
  template,
  print = false,
}: {
  type: string;
  company: AppState["settings"]["companies"][number];
  client: string;
  date: string;
  invoice: string;
  amount: number;
  items: { description: string; qty: number; unit: string; price: number }[];
  template: AppState["settings"]["documentTemplates"][number];
  print?: boolean;
}) {
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  return (
    <article
      className={`paper ${print ? "print-area" : ""}`}
      style={{ ["--paper-accent" as string]: company.primary }}
    >
      <img className="paper-logo" src={company.logo} alt={company.name} />
      {type === "Cotação" && (
        <>
          <h2>{template.title}</h2>
          <p className="recipient">
            A/C
            <br />
            <strong>{client.toUpperCase()}</strong>
          </p>
          <p>
            A empresa <strong>{company.name}</strong>, inscrita no CNPJ{" "}
            {company.document}, com sede em {company.address},{" "}
            {template.introduction}
          </p>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Descrição</th>
                <th>QTD</th>
                <th>Unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{item.description}</td>
                  <td>{item.qty}</td>
                  <td>{money.format(item.price)}</td>
                  <td>{money.format(item.qty * item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <strong className="paper-total">
            Valor total: {money.format(total)}
          </strong>
          <p>{template.notes}</p>
        </>
      )}
      {type === "Comprovante de Entrega" && (
        <>
          <h2>{template.title}</h2>
          <p>{template.introduction}</p>
          <p>
            <strong>Local de entrega:</strong> {client}
          </p>
          <p>
            <strong>Data de entrega:</strong> {dateBR(date)}
          </p>
          <table>
            <thead>
              <tr>
                <th>Qtd</th>
                <th>Und</th>
                <th>Itens</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>{item.qty}</td>
                  <td>{item.unit}</td>
                  <td>{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>{template.notes}</p>
        </>
      )}
      {type === "Declaração Bancária" && (
        <>
          <h2>{template.title}</h2>
          <p>{template.introduction}</p>
          <p>
            Referente à <strong>Nota Fiscal Nº {invoice}</strong>, declaramos
            que receberemos de <strong>{client}</strong> o valor de{" "}
            <strong>{money.format(amount)}</strong>.
          </p>
          <p>Por meio de crédito bancário na conta abaixo:</p>
          <div className="bank-data">
            <span>
              Banco: <strong>{company.bankName}</strong>
            </span>
            <span>
              Agência: <strong>Nº {company.agency}</strong>
            </span>
            <span>
              Conta: <strong>Nº {company.account}</strong>
            </span>
            <span>
              Favorecido: <strong>{company.beneficiary}</strong>
            </span>
            <span>
              CNPJ: <strong>{company.document}</strong>
            </span>
          </div>
          <p>{template.notes}</p>
        </>
      )}
      <div className="paper-sign">
        <span>São José dos Campos, {dateBR(date)}.</span>
        <p>Atenciosamente,</p>
        {company.signature && <img src={company.signature} alt="Assinatura" />}
        {company.stamp && <img src={company.stamp} alt="Carimbo" />}
        <strong>{nova ? "Yerardo Vargas" : company.name}</strong>
      </div>
      <footer>
        {company.name} · CNPJ {company.document}
        <br />
        {company.address}
        <br />
        {company.phone} · {company.email}
      </footer>
    </article>
  );
}

function Finance({ state, commit }: { state: AppState; commit: Commit }) {
  const [tab, setTab] = useState("painel");
  const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const financeEvents: PlannerEvent[] = state.emissions.flatMap((emission) => {
    const client = state.clients.find((item) => item.id === emission.clientId);
    const issue: PlannerEvent = {
      id: `issue-${emission.id}`,
      title: `${client?.name || "Cliente"} · ${Math.max(1, emission.invoiceNumbers.length)} nota(s)`,
      date: emission.scheduledDate,
      start: "08:00",
      end: "09:00",
      color:
        emission.status === "Pendente" && emission.scheduledDate < today
          ? "#dc2626"
          : emission.status === "Emitida"
            ? "#16a34a"
            : "#2563eb",
      category: "Emissões",
      status: emission.status,
      meta: `${emission.category} · ${emission.responsible}`,
    };
    const reminder: PlannerEvent | null =
      emission.status === "Emitida" && client?.reminders
        ? {
            id: `due-${emission.id}`,
            title: `Vence · ${client.name}`,
            date: emission.dueDate,
            start: "10:00",
            end: "10:30",
            color: "#e67e22",
            category: "Vencimentos",
            status: "Lembrete",
            meta: emission.invoiceNumbers.join(", "),
          }
        : null;
    return reminder ? [issue, reminder] : [issue];
  });
  const pending = state.emissions.filter((item) => item.status === "Pendente"),
    issued = state.emissions.filter((item) => item.status === "Emitida");
  return (
    <>
      <PageTitle
        eyebrow="Módulo completo"
        title="Financeiro"
        description="Painel, calendário planner, contas a emitir, histórico, relatórios e regras próprias do módulo."
      />
      <Tabs value={tab} onValueChange={setTab} className="module-tabs">
        <TabsList className="module-tabs-list">
          <TabsTrigger value="painel">Painel</TabsTrigger>
          <TabsTrigger value="calendario">Calendário</TabsTrigger>
          <TabsTrigger value="emissoes">Contas a emitir</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="regras">Regras</TabsTrigger>
        </TabsList>
        <TabsContent value="painel">
          <div className="metrics-grid">
            <Metric
              label="Emitir hoje"
              value={
                pending.filter((item) => item.scheduledDate === today).length
              }
              detail="fechamentos programados"
              icon={ReceiptText}
            />
            <Metric
              label="Emissões atrasadas"
              value={
                pending.filter((item) => item.scheduledDate < today).length
              }
              detail="precisam de ação"
              icon={TriangleAlert}
              tone="red"
            />
            <Metric
              label="A vencer"
              value={issued.filter((item) => item.dueDate >= today).length}
              detail="faturas acompanhadas"
              icon={CalendarDays}
              tone="blue"
            />
            <Metric
              label="Sem pedido"
              value={
                state.emissions.filter((item) => item.status === "Sem pedido")
                  .length
              }
              detail="não geraram cobrança"
              icon={CheckCircle2}
              tone="green"
            />
          </div>
          <div className="dashboard-grid">
            <Card className="span-2">
              <CardHeader>
                <CardTitle>Agenda financeira imediata</CardTitle>
                <CardDescription>
                  Notas de hoje e atrasadas, ordenadas por data.
                </CardDescription>
              </CardHeader>
              <CardContent className="agenda-list">
                {pending
                  .sort((a, b) =>
                    a.scheduledDate.localeCompare(b.scheduledDate),
                  )
                  .slice(0, 8)
                  .map((item) => (
                    <button
                      className="agenda-row"
                      key={item.id}
                      onClick={() => setTab("emissoes")}
                    >
                      <span
                        className={`agenda-time ${item.scheduledDate < today ? "tone-red" : "tone-copper"}`}
                      >
                        {item.scheduledDate === today
                          ? "Hoje"
                          : dateBR(item.scheduledDate)}
                      </span>
                      <span>
                        <strong>
                          {
                            state.clients.find(
                              (client) => client.id === item.clientId,
                            )?.name
                          }
                        </strong>
                        <small>
                          {item.category} · {item.orderCheck}
                        </small>
                      </span>
                      <Status>{item.status}</Status>
                      <ChevronRight />
                    </button>
                  ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Automação do fechamento</CardTitle>
              </CardHeader>
              <CardContent className="stack">
                <p>
                  O calendário calcula automaticamente dias úteis, segundas,
                  quartas de congelados, sextas, quinzenas, dias fixos e
                  fechamento mensal.
                </p>
                <Button
                  variant="outline"
                  onClick={() =>
                    commit("Atualizou agenda automática", (draft) =>
                      Object.assign(draft, ensureFinancialSchedule(draft)),
                    )
                  }
                >
                  <RefreshCw /> Recalcular agenda
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="calendario">
          <PlannerCalendar
            title="Planner financeiro"
            events={financeEvents}
            compact
            onCreate={() => setTab("emissoes")}
            onSelect={setSelectedEvent}
          />
        </TabsContent>
        <TabsContent value="emissoes">
          <FinanceOperations state={state} commit={commit} />
        </TabsContent>
        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de emissões e faturas</CardTitle>
              <CardDescription>
                Registro completo de emissão, vencimento, pedido e responsável.
              </CardDescription>
              <div className="searchbox">
                <Search />
                <Input
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="Buscar cliente, NF, responsável ou status"
                />
              </div>
            </CardHeader>
            <CardContent className="table-shell">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>NF</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.emissions
                    .filter((item) => item.status !== "Pendente")
                    .filter((item) => {
                      const client =
                        state.clients.find(
                          (entry) => entry.id === item.clientId,
                        )?.name || "";
                      return [
                        client,
                        item.invoiceNumbers.join(" "),
                        item.responsible,
                        item.status,
                      ]
                        .join(" ")
                        .toLowerCase()
                        .includes(historySearch.toLowerCase());
                    })
                    .slice()
                    .reverse()
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{dateBR(item.scheduledDate)}</TableCell>
                        <TableCell>
                          <strong>
                            {
                              state.clients.find(
                                (client) => client.id === item.clientId,
                              )?.name
                            }
                          </strong>
                        </TableCell>
                        <TableCell>
                          {item.invoiceNumbers.join(", ") || "—"}
                        </TableCell>
                        <TableCell>{dateBR(item.dueDate)}</TableCell>
                        <TableCell>{money.format(item.amount)}</TableCell>
                        <TableCell>{item.responsible}</TableCell>
                        <TableCell>
                          <Status>{item.status}</Status>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="relatorios">
          <div className="reports-grid">
            <Card>
              <CardHeader>
                <CardTitle>Emissões por empresa</CardTitle>
              </CardHeader>
              <CardContent className="ranking">
                {state.settings.companies.map((company, index) => (
                  <div key={company.name}>
                    <em>{index + 1}</em>
                    <span>
                      <strong>{company.name}</strong>
                      <small>
                        {
                          state.emissions.filter(
                            (item) =>
                              item.company === company.name &&
                              item.status === "Emitida",
                          ).length
                        }{" "}
                        emitidas
                      </small>
                    </span>
                    <strong>
                      {money.format(
                        state.emissions
                          .filter((item) => item.company === company.name)
                          .reduce((sum, item) => sum + item.amount, 0),
                      )}
                    </strong>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Responsáveis pela emissão</CardTitle>
              </CardHeader>
              <CardContent className="bars">
                {state.settings.users
                  .filter((account) =>
                    state.emissions.some(
                      (item) => item.responsible === account.name,
                    ),
                  )
                  .map((account) => (
                    <div key={account.id}>
                      <span>{account.name}</span>
                      <div>
                        <i
                          style={{
                            width: `${Math.min(100, state.emissions.filter((item) => item.responsible === account.name).length * 8)}%`,
                          }}
                        />
                      </div>
                      <strong>
                        {
                          state.emissions.filter(
                            (item) => item.responsible === account.name,
                          ).length
                        }
                      </strong>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="regras">
          <FinancialRuleSettings state={state} commit={commit} />
        </TabsContent>
      </Tabs>
      <Dialog
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="dialog-wide">
          {selectedEvent &&
            (() => {
              const emissionId = selectedEvent.id.replace(/^issue-|^due-/, "");
              const emission = state.emissions.find(
                (item) => item.id === emissionId,
              );
              const client = state.clients.find(
                (item) => item.id === emission?.clientId,
              );
              if (!emission)
                return <p>Evento de calendário sem lançamento associado.</p>;
              return (
                <>
                  <DialogHeader>
                    <DialogTitle>
                      {client?.name} ·{" "}
                      {Math.max(1, emission.invoiceNumbers.length)} nota(s)
                    </DialogTitle>
                    <DialogDescription>
                      {emission.category} · {dateBR(emission.scheduledDate)} ·
                      vencimento {dateBR(emission.dueDate)}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="planner-detail-grid">
                    <Info label="Status" value={emission.status} />
                    <Info label="Responsável" value={emission.responsible} />
                    <Info
                      label="Notas fiscais"
                      value={
                        emission.invoiceNumbers.join(", ") ||
                        "Ainda não informadas"
                      }
                    />
                    <Info label="Valor" value={money.format(emission.amount)} />
                    <Field label="Reagendar para">
                      <Input
                        type="date"
                        value={emission.scheduledDate}
                        onChange={(event) =>
                          commit(
                            `Reagendou emissão de ${client?.name}`,
                            (draft) => {
                              const found = draft.emissions.find(
                                (item) => item.id === emission.id,
                              );
                              if (found)
                                found.scheduledDate = event.target.value;
                            },
                          )
                        }
                      />
                    </Field>
                    <Field label="Observações" full>
                      <Textarea
                        value={emission.observation}
                        onChange={(event) =>
                          commit(
                            `Editou observação de ${client?.name}`,
                            (draft) => {
                              const found = draft.emissions.find(
                                (item) => item.id === emission.id,
                              );
                              if (found) found.observation = event.target.value;
                            },
                          )
                        }
                      />
                    </Field>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedEvent(null);
                        setTab("emissoes");
                      }}
                    >
                      <Pencil /> Abrir lançamento
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        toast.info(
                          `Perfil de ${client?.name} disponível no módulo Clientes`,
                        )
                      }
                    >
                      <UserRound /> Perfil do cliente
                    </Button>
                    <Button
                      onClick={() => {
                        commit(
                          `Concluiu emissão de ${client?.name}`,
                          (draft) => {
                            const found = draft.emissions.find(
                              (item) => item.id === emission.id,
                            );
                            if (found) found.status = "Emitida";
                          },
                        );
                        setSelectedEvent(null);
                      }}
                    >
                      <Check /> Concluir
                    </Button>
                  </DialogFooter>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Collections({
  state,
  commit,
  user,
  token,
}: {
  state: AppState;
  commit: Commit;
  user: string;
  token: string;
}) {
  const [tab, setTab] = useState("painel");
  const active = state.collections.filter(
    (item) => !["Baixada", "Arquivada"].includes(item.status),
  );
  const collectionEvents: PlannerEvent[] = active.flatMap((item) => {
    const client = state.clients.find((entry) => entry.id === item.clientId);
    const events: PlannerEvent[] = [];
    if (client?.reminders)
      events.push({
        id: `reminder-${item.id}`,
        title: `Vence · ${client.name}`,
        date: item.dueDate,
        start: "08:00",
        end: "08:30",
        color: "#e67e22",
        category: "Lembretes",
        status: item.status,
        meta: `NF ${item.invoice}`,
      });
    events.push({
      id: `charge-${item.id}`,
      title: `Cobrar · ${client?.name || "Cliente"}`,
      date: item.availableFrom,
      start: "09:00",
      end: "10:00",
      color:
        item.priority === "Vermelho"
          ? "#dc2626"
          : item.priority === "Amarelo"
            ? "#d97706"
            : "#15803d",
      category: "Cobranças",
      status: item.status,
      meta: `${item.priority} · ${money.format(item.amount)}`,
    });
    if (item.status === "Reagendada" && item.nextContact)
      events.push({
        id: `return-${item.id}`,
        title: `Retorno · ${client?.name}`,
        date: item.nextContact.slice(0, 10),
        start: item.nextContact.slice(11, 16) || "09:00",
        end: "10:00",
        color: "#8b5cf6",
        category: "Reagendamentos",
        status: item.status,
        meta: `NF ${item.invoice}`,
      });
    return events;
  });
  const paidWaiting = state.collections.filter(
      (item) => item.status === "Paga",
    ),
    cancellations = state.collections.filter(
      (item) =>
        item.status === "Cancelamento pendente" || item.status === "Cancelado",
    );
  return (
    <>
      <PageTitle
        eyebrow="Módulo completo"
        title="Cobranças"
        description="Painel, planner, fila automática, contatos, comprovantes, baixa, reagendamentos e cancelamentos."
      />
      <Tabs value={tab} onValueChange={setTab} className="module-tabs">
        <TabsList className="module-tabs-list">
          <TabsTrigger value="painel">Painel</TabsTrigger>
          <TabsTrigger value="calendario">Calendário</TabsTrigger>
          <TabsTrigger value="fila">Fila de cobrança</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="cancelamentos">
            Pagamentos e cancelamentos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="painel">
          <div className="metrics-grid">
            <Metric
              label="Cobrar hoje"
              value={
                active.filter((item) => item.availableFrom <= today).length
              }
              detail="fila automática"
              icon={WalletCards}
            />
            <Metric
              label="Em andamento"
              value={
                active.filter((item) => item.status === "Em andamento").length
              }
              detail="aguardando retorno"
              icon={Clock3}
              tone="blue"
            />
            <Metric
              label="Reagendadas"
              value={
                active.filter((item) => item.status === "Reagendada").length
              }
              detail="visíveis no planner"
              icon={CalendarDays}
            />
            <Metric
              label="Aguardando baixa"
              value={paidWaiting.length}
              detail="Marcelo ou Jessica"
              icon={CheckCircle2}
              tone="green"
            />
          </div>
          <div className="policy-banner">
            <div className="green">
              <strong>Verde</strong>
              <span>
                Pode ter várias pendências; cobrança normal; nunca cancelar
                entregas.
              </span>
            </div>
            <div className="yellow">
              <strong>Amarelo</strong>
              <span>
                No máximo duas pendências em aberto; prioridade de cobrança.
              </span>
            </div>
            <div className="red">
              <strong>Vermelho</strong>
              <span>
                Nenhuma pendência permitida; cobrar no dia seguinte e cancelar
                se não pagar.
              </span>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Prioridades do cobrador</CardTitle>
              <CardDescription>
                Natanael vê a operação completa; diretoria acompanha sem
                necessidade de relatórios manuais.
              </CardDescription>
            </CardHeader>
            <CardContent className="agenda-list">
              {active
                .filter((item) => item.availableFrom <= today)
                .sort(
                  (a, b) =>
                    state.settings.colorRules.find(
                      (rule) => rule.id === a.policyId,
                    )!.priority -
                    state.settings.colorRules.find(
                      (rule) => rule.id === b.policyId,
                    )!.priority,
                )
                .slice(0, 10)
                .map((item) => (
                  <button
                    className="agenda-row"
                    key={item.id}
                    onClick={() => setTab("fila")}
                  >
                    <span
                      className={`agenda-time tone-${item.priority.toLowerCase() === "vermelho" ? "red" : "copper"}`}
                    >
                      {item.priority}
                    </span>
                    <span>
                      <strong>
                        {
                          state.clients.find(
                            (client) => client.id === item.clientId,
                          )?.name
                        }
                      </strong>
                      <small>
                        NF {item.invoice} · {money.format(item.amount)} ·{" "}
                        {item.attempts} tentativa(s)
                      </small>
                    </span>
                    <Status>{item.status}</Status>
                    <ChevronRight />
                  </button>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calendario">
          <PlannerCalendar
            title="Planner de cobranças"
            events={collectionEvents}
            onCreate={() => setTab("fila")}
            onSelect={(event) => toast.info(`${event.title} · ${event.meta}`)}
          />
        </TabsContent>
        <TabsContent value="fila">
          <CollectionQueue
            state={state}
            commit={commit}
            user={user}
            token={token}
          />
        </TabsContent>
        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico completo de contatos</CardTitle>
              <CardDescription>
                Mensagem, resposta, promessa, meio, tempo e tentativas.
              </CardDescription>
            </CardHeader>
            <CardContent className="collection-history">
              {state.collections
                .flatMap((item) =>
                  item.history.map((entry) => ({ item, entry })),
                )
                .sort((a, b) => b.entry.at.localeCompare(a.entry.at))
                .map(({ item, entry }, index) => (
                  <article key={`${item.id}-${index}`}>
                    <div className="timeline-icon">
                      <History />
                    </div>
                    <div>
                      <strong>
                        {
                          state.clients.find(
                            (client) => client.id === item.clientId,
                          )?.name
                        }{" "}
                        · NF {item.invoice}
                      </strong>
                      <p>{entry.summary}</p>
                      <small>
                        {new Date(entry.at).toLocaleString("pt-BR")} ·{" "}
                        {entry.user} · {entry.channel}
                      </small>
                    </div>
                    <Status>{item.status}</Status>
                  </article>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cancelamentos">
          <div className="settings-columns">
            <Card>
              <CardHeader>
                <CardTitle>Pagamentos aguardando baixa</CardTitle>
                <CardDescription>
                  Natanael registra pago e anexa comprovante; Marcelo ou Jessica
                  encerram o ciclo.
                </CardDescription>
              </CardHeader>
              <CardContent className="approval-list">
                {paidWaiting.map((item) => (
                  <article key={item.id}>
                    <CheckCircle2 />
                    <div>
                      <strong>
                        {
                          state.clients.find(
                            (client) => client.id === item.clientId,
                          )?.name
                        }
                      </strong>
                      <small>
                        NF {item.invoice} · {money.format(item.amount)} ·{" "}
                        {item.proofName || "comprovante anexado"}
                      </small>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        commit(`Deu baixa na NF ${item.invoice}`, (draft) => {
                          const found = draft.collections.find(
                            (entry) => entry.id === item.id,
                          );
                          if (found) {
                            found.status = "Baixada";
                            found.approvedBy = user;
                            found.history.unshift({
                              at: new Date().toISOString(),
                              user,
                              channel: "Sistema",
                              summary:
                                "Pagamento conferido e baixa final realizada.",
                            });
                          }
                        })
                      }
                    >
                      Dar baixa
                    </Button>
                  </article>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cancelamentos e negociações</CardTitle>
                <CardDescription>
                  Negociações aguardam decisão da diretoria antes de cancelar.
                </CardDescription>
              </CardHeader>
              <CardContent className="approval-list">
                {cancellations.map((item) => (
                  <article key={item.id}>
                    <TriangleAlert />
                    <div>
                      <strong>
                        {
                          state.clients.find(
                            (client) => client.id === item.clientId,
                          )?.name
                        }
                      </strong>
                      <small>
                        NF {item.invoice} · {item.status} · volta para Natanael
                        após o cancelamento
                      </small>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        commit(
                          `Manteve negociação NF ${item.invoice}`,
                          (draft) => {
                            const found = draft.collections.find(
                              (entry) => entry.id === item.id,
                            );
                            if (found) found.status = "Reagendada";
                          },
                        )
                      }
                    >
                      Negociar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        commit(
                          `Confirmou cancelamento NF ${item.invoice}`,
                          (draft) => {
                            const found = draft.collections.find(
                              (entry) => entry.id === item.id,
                            );
                            if (found) {
                              found.status = "Cancelado";
                              found.nextContact = `${today}T08:00`;
                              found.history.unshift({
                                at: new Date().toISOString(),
                                user,
                                channel: "Sistema",
                                summary:
                                  "Entregas canceladas; cobrança devolvida para novo contato de Natanael.",
                              });
                            }
                          },
                        )
                      }
                    >
                      Confirmar
                    </Button>
                  </article>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Tasks({ state, commit }: { state: AppState; commit: Commit }) {
  const [tab, setTab] = useState("dia");
  const jsDay = new Date().getDay();
  const currentDay = dayNames[(jsDay + 6) % 7];
  const taskEvents: PlannerEvent[] = state.tasks.flatMap((task) =>
    task.days.map((day, index) => {
      const target =
        (dayNames.indexOf(day) - dayNames.indexOf(currentDay) + 7) % 7;
      const date = addDays(today, target);
      return {
        id: `${task.id}-${index}`,
        title: task.title,
        date,
        start: task.time,
        end:
          addDays(date, 0) &&
          `${String(Math.min(23, Number(task.time.slice(0, 2)) + 1)).padStart(2, "0")}:${task.time.slice(3, 5)}`,
        color:
          task.priority === "Alta"
            ? "#dc2626"
            : task.priority === "Média"
              ? "#e67e22"
              : "#2563eb",
        category: task.nature,
        status: task.completed ? "Concluída" : "Pendente",
        meta: `${task.responsible} · ${task.category}`,
      };
    }),
  );
  const todayTasks = state.tasks.filter((task) =>
    task.days.includes(currentDay),
  );
  return (
    <>
      <PageTitle
        eyebrow="Módulo completo"
        title="Tarefas da equipe"
        description="Meu dia, planner, catálogo editável, recorrências e indicadores por perfil e responsável."
      />
      <Tabs value={tab} onValueChange={setTab} className="module-tabs">
        <TabsList className="module-tabs-list">
          <TabsTrigger value="dia">Meu dia</TabsTrigger>
          <TabsTrigger value="planner">Planner</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="recorrencias">Recorrências</TabsTrigger>
          <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
        </TabsList>
        <TabsContent value="dia">
          <div className="metrics-grid compact">
            <Metric
              label={currentDay}
              value={todayTasks.length}
              detail="tarefas programadas"
              icon={ListChecks}
            />
            <Metric
              label="Concluídas"
              value={todayTasks.filter((task) => task.completed).length}
              detail="no checklist atual"
              icon={CheckCircle2}
              tone="green"
            />
            <Metric
              label="Verificações"
              value={
                todayTasks.filter((task) => task.nature === "Verificação")
                  .length
              }
              detail="exigem conferência"
              icon={Search}
              tone="blue"
            />
            <Metric
              label="Alta prioridade"
              value={
                todayTasks.filter((task) => task.priority === "Alta").length
              }
              detail="executar primeiro"
              icon={TriangleAlert}
              tone="red"
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Checklist de hoje</CardTitle>
              <CardDescription>
                Notas a emitir, notas a verificar, romaneios, produção,
                etiquetas, folhas e relatórios.
              </CardDescription>
            </CardHeader>
            <CardContent className="task-list">
              {todayTasks.map((task) => (
                <article key={task.id} className={task.completed ? "done" : ""}>
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) =>
                      commit(
                        `${checked ? "Concluiu" : "Reabriu"} ${task.title}`,
                        (draft) => {
                          const found = draft.tasks.find(
                            (item) => item.id === task.id,
                          );
                          if (found) found.completed = Boolean(checked);
                        },
                      )
                    }
                  />
                  <div className="task-copy">
                    <div>
                      <strong>
                        {task.time} · {task.title}
                      </strong>
                      <Status>{task.nature}</Status>
                    </div>
                    <p>{task.notes}</p>
                    <div className="chips">
                      {task.subitems.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="planner">
          <PlannerCalendar
            title="Planner de tarefas"
            events={taskEvents}
            onCreate={() => setTab("catalogo")}
          />
        </TabsContent>
        <TabsContent value="catalogo">
          <TaskCatalog state={state} commit={commit} />
        </TabsContent>
        <TabsContent value="recorrencias">
          <Card>
            <CardHeader>
              <CardTitle>Regras de recorrência</CardTitle>
              <CardDescription>
                Todas podem ser duplicadas, editadas, apagadas ou transformadas
                em tarefa avulsa.
              </CardDescription>
            </CardHeader>
            <CardContent className="table-shell">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarefa</TableHead>
                    <TableHead>Natureza</TableHead>
                    <TableHead>Dias</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Prioridade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <strong>{task.title}</strong>
                      </TableCell>
                      <TableCell>{task.nature}</TableCell>
                      <TableCell>{task.days.join(", ")}</TableCell>
                      <TableCell>{task.time}</TableCell>
                      <TableCell>{task.responsible}</TableCell>
                      <TableCell>
                        <Status>{task.priority}</Status>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="indicadores">
          <div className="reports-grid">
            <Card>
              <CardHeader>
                <CardTitle>Conclusão por natureza</CardTitle>
              </CardHeader>
              <CardContent className="bars">
                {["Emissão", "Verificação", "Execução", "Lembrete"].map(
                  (nature) => {
                    const total = state.tasks.filter(
                        (task) => task.nature === nature,
                      ).length,
                      done = state.tasks.filter(
                        (task) => task.nature === nature && task.completed,
                      ).length;
                    return (
                      <div key={nature}>
                        <span>{nature}</span>
                        <div>
                          <i
                            style={{
                              width: `${total ? (done / total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <strong>
                          {done}/{total}
                        </strong>
                      </div>
                    );
                  },
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Carga semanal</CardTitle>
              </CardHeader>
              <CardContent className="bars">
                {dayNames.map((day) => (
                  <div key={day}>
                    <span>{day}</span>
                    <div>
                      <i
                        style={{
                          width: `${(state.tasks.filter((task) => task.days.includes(day)).length / Math.max(...dayNames.map((name) => state.tasks.filter((task) => task.days.includes(name)).length), 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>
                      {
                        state.tasks.filter((task) => task.days.includes(day))
                          .length
                      }
                    </strong>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function OperationalModule({
  state,
  commit,
}: {
  state: AppState;
  commit: Commit;
}) {
  const [tab, setTab] = useState("calculadora");
  const [category, setCategory] = useState("Pão francês");
  const [product, setProduct] = useState("Francês 50g");
  const [quantity, setQuantity] = useState(1000);
  const [capacity, setCapacity] = useState(300);
  const [rows, setRows] = useState([
    {
      id: "calc-frances",
      category: "Pão francês",
      product: "Francês 50g",
      quantity: 1000,
      capacity: 300,
    },
    {
      id: "calc-mini",
      category: "Pão francês",
      product: "Mini francês",
      quantity: 720,
      capacity: 480,
    },
  ]);
  const carts = Math.ceil(quantity / Math.max(1, capacity));
  const operationalTasks = state.tasks.filter((task) =>
    /produção|romaneio|etiqueta|folha|relatorio|relatório/i.test(
      `${task.title} ${task.category}`,
    ),
  );
  function addCalculation() {
    setRows((current) => [
      { id: uid("calculo"), category, product, quantity, capacity },
      ...current,
    ]);
    toast.success("Cálculo adicionado ao plano de produção");
  }
  return (
    <>
      <PageTitle
        eyebrow="Módulo operacional"
        title="Central operacional de produção"
        description="Ferramentas de produção, romaneios, etiquetas e relatórios separadas das tarefas pessoais."
      />
      <Tabs value={tab} onValueChange={setTab} className="module-tabs">
        <TabsList className="module-tabs-list">
          <TabsTrigger value="calculadora">Calculadora de produção</TabsTrigger>
          <TabsTrigger value="producao">Produção do dia</TabsTrigger>
          <TabsTrigger value="romaneios">Romaneios</TabsTrigger>
          <TabsTrigger value="etiquetas">Etiquetas e folhas</TabsTrigger>
        </TabsList>
        <TabsContent value="calculadora">
          <div className="operational-calculator">
            <Card>
              <CardHeader>
                <CardTitle>Novo cálculo</CardTitle>
                <CardDescription>
                  Capacidade independente para produto normal, mini ou qualquer
                  tipo cadastrado.
                </CardDescription>
              </CardHeader>
              <CardContent className="form-grid">
                <Field label="Categoria">
                  <Input
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  />
                </Field>
                <Field label="Produto / tipo">
                  <Input
                    value={product}
                    onChange={(event) => setProduct(event.target.value)}
                  />
                </Field>
                <Field label="Quantidade de unidades">
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(Number(event.target.value))
                    }
                  />
                </Field>
                <Field label="Capacidade por carrinho">
                  <Input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(event) =>
                      setCapacity(Number(event.target.value))
                    }
                  />
                </Field>
                <div className="calculator-result full">
                  <PackageCheck />
                  <span>
                    <small>Necessidade calculada</small>
                    <strong>{carts} carrinho(s)</strong>
                    <em>
                      {quantity} unidades · {capacity} por carrinho
                    </em>
                  </span>
                </div>
                <Button type="button" onClick={addCalculation}>
                  <Plus /> Adicionar ao plano
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Plano calculado</CardTitle>
                <CardDescription>
                  Edite quantidades e capacidades diretamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="table-shell">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Qtd.</TableHead>
                      <TableHead>Capacidade</TableHead>
                      <TableHead>Carrinhos</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>
                          <strong>{row.product}</strong>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.quantity}
                            onChange={(event) =>
                              setRows((current) =>
                                current.map((item) =>
                                  item.id === row.id
                                    ? {
                                        ...item,
                                        quantity: Number(event.target.value),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.capacity}
                            onChange={(event) =>
                              setRows((current) =>
                                current.map((item) =>
                                  item.id === row.id
                                    ? {
                                        ...item,
                                        capacity: Number(event.target.value),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Status>
                            {Math.ceil(
                              row.quantity / Math.max(1, row.capacity),
                            )}{" "}
                            carrinhos
                          </Status>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setRows((current) =>
                                current.filter((item) => item.id !== row.id),
                              )
                            }
                          >
                            <Trash2 />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {[
          ["producao", "Produção do dia", /produção/i],
          ["romaneios", "Romaneios de entrega", /romaneio/i],
          [
            "etiquetas",
            "Etiquetas, folhas e relatórios",
            /etiqueta|folha|relatorio|relatório/i,
          ],
        ].map(([value, title, matcher]) => (
          <TabsContent value={String(value)} key={String(value)}>
            <Card>
              <CardHeader>
                <CardTitle>{String(title)}</CardTitle>
                <CardDescription>
                  Checklist operacional vinculado à base de tarefas e ao
                  responsável.
                </CardDescription>
              </CardHeader>
              <CardContent className="agenda-list">
                {operationalTasks
                  .filter((task) =>
                    (matcher as RegExp).test(`${task.title} ${task.category}`),
                  )
                  .map((task) => (
                    <button
                      className="agenda-row"
                      key={task.id}
                      onClick={() =>
                        commit(
                          `Alternou tarefa operacional ${task.title}`,
                          (draft) => {
                            const found = draft.tasks.find(
                              (item) => item.id === task.id,
                            );
                            if (found) found.completed = !found.completed;
                          },
                        )
                      }
                    >
                      <span className="agenda-time tone-copper">
                        {task.time}
                      </span>
                      <span>
                        <strong>{task.title}</strong>
                        <small>
                          {task.days.join(", ")} · {task.responsible} ·{" "}
                          {task.notes}
                        </small>
                      </span>
                      <Status>
                        {task.completed ? "Concluída" : task.nature}
                      </Status>
                      <CheckCircle2 />
                    </button>
                  ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

function Routes({ state, commit }: { state: AppState; commit: Commit }) {
  const [tab, setTab] = useState("hoje");
  const pending = state.routes.filter((route) => !route.checked);
  const divergences = state.routes.filter(
    (route) =>
      (route.registered && !route.checked) ||
      /alter|pendente|verificar|diverg/i.test(route.notes),
  );
  return (
    <>
      <PageTitle
        eyebrow="Módulo 5"
        title="Base de rotas e regras de pedido"
        description="Base oficial para organizar o cadastro no sistema de pedidos — não substitui o sistema de pedidos."
      />
      <Tabs value={tab} onValueChange={setTab} className="module-tabs">
        <TabsList className="module-tabs-list">
          <TabsTrigger value="hoje">O que cadastrar hoje?</TabsTrigger>
          <TabsTrigger value="bases">Bases mensais</TabsTrigger>
          <TabsTrigger value="regras">Regras</TabsTrigger>
          <TabsTrigger value="divergencias">Divergências</TabsTrigger>
          <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
        </TabsList>
        <TabsContent value="hoje">
          <div className="metrics-grid compact">
            <Metric
              label="A cadastrar"
              value={state.routes.filter((route) => !route.registered).length}
              detail="pedidos ainda não marcados"
              icon={Route}
            />
            <Metric
              label="A conferir"
              value={
                state.routes.filter(
                  (route) => route.registered && !route.checked,
                ).length
              }
              detail="cadastro feito"
              icon={Search}
              tone="blue"
            />
            <Metric
              label="Sob demanda"
              value={
                state.routes.filter((route) => route.rule === "sob-demanda")
                  .length
              }
              detail="confirmar antes de cadastrar"
              icon={Bell}
            />
            <Metric
              label="Divergências"
              value={divergences.length}
              detail="precisam de correção"
              icon={TriangleAlert}
              tone="red"
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Fila de cadastro e conferência</CardTitle>
              <CardDescription>
                Prioriza sob demanda, alterações e registros ainda não
                conferidos.
              </CardDescription>
            </CardHeader>
            <CardContent className="agenda-list">
              {pending.slice(0, 15).map((route) => (
                <button
                  className="agenda-row"
                  key={route.id}
                  onClick={() => setTab("bases")}
                >
                  <span
                    className={`agenda-time ${route.rule === "sob-demanda" ? "tone-red" : "tone-copper"}`}
                  >
                    {route.time}
                  </span>
                  <span>
                    <strong>{route.client}</strong>
                    <small>
                      {route.driver} · {route.batch} · {route.notes}
                    </small>
                  </span>
                  <Status>{route.rule}</Status>
                  <ChevronRight />
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bases">
          <RouteBase state={state} commit={commit} />
        </TabsContent>
        <TabsContent value="regras">
          <div className="settings-columns">
            <Card>
              <CardHeader>
                <CardTitle>Regras operacionais</CardTitle>
              </CardHeader>
              <CardContent className="rules-list">
                {["Fixo", "Programado", "Sob demanda"].map((rule) => (
                  <div key={rule}>
                    <Route />
                    <span>
                      <strong>{rule}</strong>
                      <small>
                        {rule === "Fixo"
                          ? "Cadastrar em todas as vigências configuradas."
                          : rule === "Programado"
                            ? "Cadastrar nos dias e períodos definidos."
                            : "Confirmar se existe pedido antes de cadastrar."}
                      </small>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Vigência e preparação</CardTitle>
              </CardHeader>
              <CardContent className="stack">
                <p>
                  As bases do próximo mês devem ser geradas, revisadas e
                  publicadas no final do mês atual.
                </p>
                <p>
                  Alterações ficam versionadas e a publicação é bloqueada
                  enquanto houver registro incompleto ou sem conferência.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="divergencias">
          <Card>
            <CardHeader>
              <CardTitle>Registro de divergências e correções</CardTitle>
              <CardDescription>
                Erros do cadastro, causa, responsável e situação da correção.
              </CardDescription>
            </CardHeader>
            <CardContent className="table-shell">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Regra</TableHead>
                    <TableHead>Ocorrência</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {divergences.slice(0, 100).map((route) => (
                    <TableRow key={route.id}>
                      <TableCell>
                        <strong>{route.client}</strong>
                      </TableCell>
                      <TableCell>
                        {route.driver} · {route.time}
                      </TableCell>
                      <TableCell>{route.rule}</TableCell>
                      <TableCell>
                        {route.notes || "Aguardando conferência"}
                      </TableCell>
                      <TableCell>
                        <Status>
                          {route.checked ? "Corrigida" : "Divergente"}
                        </Status>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="indicadores">
          <div className="metrics-grid">
            <Metric
              label="Total da base"
              value={state.routes.length}
              detail="paradas estruturadas"
              icon={Route}
            />
            <Metric
              label="Cadastradas"
              value={state.routes.filter((route) => route.registered).length}
              detail="marcadas no sistema atual"
              icon={PackageCheck}
              tone="blue"
            />
            <Metric
              label="Conferidas"
              value={state.routes.filter((route) => route.checked).length}
              detail="sem divergência aberta"
              icon={CheckCircle2}
              tone="green"
            />
            <Metric
              label="Retrabalho"
              value={divergences.length}
              detail="indicador operacional"
              icon={RefreshCw}
              tone="red"
            />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Documents({ state, commit }: { state: AppState; commit: Commit }) {
  const [tab, setTab] = useState("biblioteca");
  return (
    <>
      <PageTitle
        eyebrow="Módulo completo"
        title="Documentos"
        description="Biblioteca, geradores, modelos editáveis e histórico por empresa."
      />
      <Tabs value={tab} onValueChange={setTab} className="module-tabs">
        <TabsList className="module-tabs-list">
          <TabsTrigger value="biblioteca">Biblioteca</TabsTrigger>
          <TabsTrigger value="geradores">Geradores</TabsTrigger>
          <TabsTrigger value="modelos">Modelos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="biblioteca">
          <div className="library-models">
            <div className="section-heading">
              <div>
                <strong>Modelos disponíveis</strong>
                <small>
                  Selecione o modelo que deseja usar para abrir o gerador.
                </small>
              </div>
            </div>
            <div className="template-grid">
              {state.settings.documentTemplates
                .filter((template) => template.active)
                .map((template) => (
                  <Card className="template-card selectable" key={template.id}>
                    <CardContent>
                      <FilePenLine />
                      <div>
                        <strong>{template.name}</strong>
                        <p>{template.title}</p>
                        <Button size="sm" onClick={() => setTab("geradores")}>
                          Usar modelo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
          <div className="section-heading">
            <div>
              <strong>Documentos gerados</strong>
              <small>Histórico recente da biblioteca.</small>
            </div>
          </div>
          <div className="template-grid">
            {state.documents.map((document) => (
              <Card className="template-card" key={document.id}>
                <CardContent>
                  <FileText />
                  <div>
                    <strong>{document.type}</strong>
                    <p>
                      {document.client} · {dateBR(document.date)}
                    </p>
                    <Status>{document.status}</Status>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="geradores">
          <DocumentGenerator state={state} commit={commit} />
        </TabsContent>
        <TabsContent value="modelos">
          <div className="settings-cards">
            {state.settings.documentTemplates.map((template, index) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>
                    Textos e disponibilidade totalmente editáveis
                  </CardDescription>
                </CardHeader>
                <CardContent className="stack">
                  <Field label="Nome do modelo">
                    <Input
                      value={template.name}
                      onChange={(event) =>
                        commit("Alterou nome de modelo", (draft) => {
                          draft.settings.documentTemplates[index].name =
                            event.target.value;
                        })
                      }
                    />
                  </Field>
                  <Field label="Título impresso">
                    <Input
                      value={template.title}
                      onChange={(event) =>
                        commit("Alterou título de modelo", (draft) => {
                          draft.settings.documentTemplates[index].title =
                            event.target.value;
                        })
                      }
                    />
                  </Field>
                  <Field label="Texto de abertura">
                    <Textarea
                      value={template.introduction}
                      onChange={(event) =>
                        commit("Alterou abertura de modelo", (draft) => {
                          draft.settings.documentTemplates[index].introduction =
                            event.target.value;
                        })
                      }
                    />
                  </Field>
                  <Field label="Observações e regras">
                    <Textarea
                      value={template.notes}
                      onChange={(event) =>
                        commit("Alterou observações de modelo", (draft) => {
                          draft.settings.documentTemplates[index].notes =
                            event.target.value;
                        })
                      }
                    />
                  </Field>
                  <label className="switch-line">
                    <span>Modelo disponível nos geradores</span>
                    <Switch
                      checked={template.active}
                      onCheckedChange={(checked) =>
                        commit("Alterou disponibilidade de modelo", (draft) => {
                          draft.settings.documentTemplates[index].active =
                            checked;
                        })
                      }
                    />
                  </label>
                  <Button variant="outline" onClick={() => setTab("geradores")}>
                    Visualizar no gerador
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Versões geradas</CardTitle>
            </CardHeader>
            <CardContent className="table-shell">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <strong>{document.type}</strong>
                      </TableCell>
                      <TableCell>{document.company}</TableCell>
                      <TableCell>{document.client}</TableCell>
                      <TableCell>{dateBR(document.date)}</TableCell>
                      <TableCell>
                        {document.total ? money.format(document.total) : "—"}
                      </TableCell>
                      <TableCell>
                        <Status>{document.status}</Status>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Notices({
  state,
  commit,
  user,
}: {
  state: AppState;
  commit: Commit;
  user: string;
}) {
  const [text, setText] = useState(""),
    [recipient, setRecipient] = useState("Willians"),
    [priority, setPriority] = useState<"Alta" | "Média" | "Baixa">("Média"),
    [createTask, setCreateTask] = useState(false);
  function add() {
    if (!text.trim()) return toast.error("Escreva o recado");
    commit("Criou recado", (d) => {
      d.notices.unshift({
        id: uid("recado"),
        text,
        sender: user,
        recipients: [recipient],
        priority,
        status: "Pendente",
        createdAt: new Date().toISOString(),
        createTask,
      });
      if (createTask)
        d.tasks.unshift({
          id: uid("tarefa"),
          title: text.slice(0, 80),
          category: "Recado",
          nature: "Lembrete",
          days: ["Quarta"],
          responsible: recipient,
          time: "08:00",
          priority,
          notes: text,
          subitems: [],
          completed: false,
        });
    });
    setText("");
    toast.success(createTask ? "Recado e tarefa criados" : "Recado enviado");
  }
  return (
    <>
      <PageTitle
        eyebrow="Comunicação interna"
        title="Recados"
        description="Mensagens gerais ou vinculadas a clientes, cobranças e fechamentos."
      />
      <div className="messages-grid">
        <Card>
          <CardHeader>
            <CardTitle>Novo recado</CardTitle>
            <CardDescription>O destinatário será avisado.</CardDescription>
          </CardHeader>
          <CardContent className="stack">
            <Field label="Mensagem">
              <Textarea
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </Field>
            <Field label="Destinatário">
              <NativeSelect
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              >
                {state.settings.users.map((x) => (
                  <NativeSelectOption key={x.name}>{x.name}</NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Prioridade">
              <NativeSelect
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
              >
                {["Alta", "Média", "Baixa"].map((x) => (
                  <NativeSelectOption key={x}>{x}</NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <label className="switch-row">
              <Switch checked={createTask} onCheckedChange={setCreateTask} />
              <span>
                <strong>Gerar tarefa</strong>
                <small>Cria lembrete para o destinatário</small>
              </span>
            </label>
            <Button onClick={add}>
              <MessageSquareText /> Enviar recado
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Caixa de entrada</CardTitle>
            <CardDescription>
              {state.notices.filter((n) => n.status === "Pendente").length}{" "}
              pendentes
            </CardDescription>
          </CardHeader>
          <CardContent className="notice-list">
            {state.notices.map((n) => (
              <article key={n.id}>
                <div className="notice-avatar">{n.sender.slice(0, 1)}</div>
                <div>
                  <div>
                    <strong>{n.sender}</strong>
                    <Status>{n.priority}</Status>
                  </div>
                  <p>{n.text}</p>
                  <small>
                    Para {n.recipients.join(", ")} · {dateBR(n.createdAt)}
                  </small>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    commit(`Concluiu recado de ${n.sender}`, (d) => {
                      const x = d.notices.find((y) => y.id === n.id);
                      if (x)
                        x.status =
                          x.status === "Concluído" ? "Pendente" : "Concluído";
                    })
                  }
                >
                  {n.status === "Concluído" ? <RotateCcw /> : <Check />}
                </Button>
              </article>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Reports({ state }: { state: AppState }) {
  const paid = state.collections
      .filter((c) => ["Paga", "Baixada"].includes(c.status))
      .reduce((a, c) => a + c.amount, 0),
    overdue = state.collections
      .filter(
        (c) =>
          c.dueDate < today &&
          !["Paga", "Baixada", "Arquivada"].includes(c.status),
      )
      .reduce((a, c) => a + c.amount, 0),
    statuses = [
      "Pendente",
      "Em andamento",
      "Reagendada",
      "Paga",
      "Cancelamento pendente",
    ].map((name) => ({
      name,
      count: state.collections.filter((c) => c.status === name).length,
    })),
    max = Math.max(...statuses.map((x) => x.count), 1);
  return (
    <>
      <PageTitle
        eyebrow="Indicadores gerenciais"
        title="Relatórios"
        description="Visões para supervisão financeira, operacional e diretoria."
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer /> Imprimir
          </Button>
        }
      />
      <div className="metrics-grid compact">
        <Metric
          label="Recebido"
          value={money.format(paid)}
          detail="pagamentos registrados"
          icon={CheckCircle2}
          tone="green"
        />
        <Metric
          label="Vencido"
          value={money.format(overdue)}
          detail="saldo em atraso"
          icon={TriangleAlert}
          tone="red"
        />
        <Metric
          label="Conclusão"
          value={`${Math.round((state.tasks.filter((t) => t.completed).length / state.tasks.length) * 100)}%`}
          detail="tarefas recorrentes"
          icon={ClipboardCheck}
          tone="blue"
        />
        <Metric
          label="Clientes ativos"
          value={state.clients.filter((c) => c.active).length}
          detail="base unificada"
          icon={UsersRound}
        />
      </div>
      <div className="reports-grid">
        <Card>
          <CardHeader>
            <CardTitle>Pizza · situação das cobranças</CardTitle>
          </CardHeader>
          <CardContent className="chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statuses}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={92}
                  paddingAngle={3}
                >
                  {statuses.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={
                        ["#c2783b", "#e4a854", "#2563eb", "#198754", "#b84036"][
                          index
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Radar · saúde operacional</CardTitle>
          </CardHeader>
          <CardContent className="chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart
                data={[
                  {
                    subject: "Financeiro",
                    value: Math.min(
                      100,
                      state.emissions.filter(
                        (item) => item.status === "Emitida",
                      ).length * 4,
                    ),
                  },
                  {
                    subject: "Cobranças",
                    value: Math.min(
                      100,
                      state.collections.filter((item) =>
                        ["Paga", "Baixada"].includes(item.status),
                      ).length * 10,
                    ),
                  },
                  {
                    subject: "Tarefas",
                    value: Math.round(
                      (state.tasks.filter((item) => item.completed).length /
                        Math.max(1, state.tasks.length)) *
                        100,
                    ),
                  },
                  {
                    subject: "Rotas",
                    value: Math.round(
                      (state.routes.filter((item) => item.checked).length /
                        Math.max(1, state.routes.length)) *
                        100,
                    ),
                  },
                  {
                    subject: "Clientes",
                    value: Math.round(
                      (state.clients.filter((item) => item.active).length /
                        Math.max(1, state.clients.length)) *
                        100,
                    ),
                  },
                ]}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <Radar
                  dataKey="value"
                  stroke="#c2783b"
                  fill="#c2783b"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="span-2">
          <CardHeader>
            <CardTitle>Colunas · volume por módulo</CardTitle>
          </CardHeader>
          <CardContent className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={[
                  { name: "Clientes", total: state.clients.length },
                  { name: "Emissões", total: state.emissions.length },
                  { name: "Cobranças", total: state.collections.length },
                  { name: "Tarefas", total: state.tasks.length },
                  { name: "Rotas", total: state.routes.length },
                ]}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#29445b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cobranças por status</CardTitle>
          </CardHeader>
          <CardContent className="bars">
            {statuses.map((s) => (
              <div key={s.name}>
                <span>{s.name}</span>
                <div>
                  <i style={{ width: `${(s.count / max) * 100}%` }} />
                </div>
                <strong>{s.count}</strong>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inadimplência por cliente</CardTitle>
          </CardHeader>
          <CardContent className="ranking">
            {state.clients
              .map((c) => ({
                c,
                amount: state.collections
                  .filter(
                    (x) =>
                      x.clientId === c.id &&
                      !["Paga", "Baixada", "Arquivada"].includes(x.status),
                  )
                  .reduce((a, x) => a + x.amount, 0),
              }))
              .filter((x) => x.amount)
              .sort((a, b) => b.amount - a.amount)
              .map((x, i) => (
                <div key={x.c.id}>
                  <em>{i + 1}</em>
                  <span>
                    <strong>{x.c.name}</strong>
                    <small>
                      {x.c.priority} · {x.c.collectors.join(", ")}
                    </small>
                  </span>
                  <strong>{money.format(x.amount)}</strong>
                </div>
              ))}
          </CardContent>
        </Card>
        <Card className="span-2">
          <CardHeader>
            <CardTitle>Performance da operação</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Emissões</TableHead>
                  <TableHead>Cobranças</TableHead>
                  <TableHead>Tarefas</TableHead>
                  <TableHead>Índice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {["Yerardo", "Natanael", "Willians"].map((name) => {
                  const a = state.emissions.filter(
                      (e) => e.responsible === name,
                    ).length,
                    b = state.collections.filter(
                      (c) => c.responsible === name,
                    ).length,
                    c = state.tasks.filter(
                      (t) => t.responsible === name,
                    ).length;
                  return (
                    <TableRow key={name}>
                      <TableCell>
                        <strong>{name}</strong>
                      </TableCell>
                      <TableCell>{a}</TableCell>
                      <TableCell>{b}</TableCell>
                      <TableCell>{c}</TableCell>
                      <TableCell>
                        <Progress value={Math.min(100, (a + b + c) * 7)} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Mantido para compatibilidade com backups anteriores; a interface atual usa AdminCenter.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FinancialConfiguration({
  state,
  commit,
}: {
  state: AppState;
  commit: Commit;
}) {
  const [tab, setTab] = useState("regras");
  const [newValue, setNewValue] = useState("");
  function backup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `BACKUP_GESTAO_${today}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Backup gerado");
  }
  function restore(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = normalizeFinancialState(JSON.parse(String(reader.result)));
        commit("Restaurou backup", (draft) => Object.assign(draft, data));
        toast.success("Backup restaurado");
      } catch {
        toast.error("Backup inválido");
      }
    };
    reader.readAsText(file);
  }
  return (
    <>
      <PageTitle
        eyebrow="Administração financeira"
        title="Configurações"
        description="Crie e edite fechamentos, vencimentos, políticas por cor e grupos usando seletores."
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="settings-tabs">
          <TabsTrigger value="regras">Regras financeiras</TabsTrigger>
          <TabsTrigger value="empresas">Empresas</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários e perfis</TabsTrigger>
          <TabsTrigger value="listas">Formas e listas</TabsTrigger>
          <TabsTrigger value="backup">Backup e auditoria</TabsTrigger>
        </TabsList>
        <TabsContent value="regras">
          <FinancialRuleSettings state={state} commit={commit} />
        </TabsContent>
        <TabsContent value="empresas">
          <div className="settings-cards">
            {state.settings.companies.map((company) => (
              <Card key={company.name}>
                <CardContent className="company-card">
                  <img src={company.logo} alt={company.name} />
                  <div>
                    <strong>{company.name}</strong>
                    <small>{company.document}</small>
                    <span>
                      {company.email}
                      <br />
                      {company.phone}
                    </span>
                  </div>
                  <input
                    type="color"
                    value={company.primary}
                    aria-label={`Cor de ${company.name}`}
                    onChange={(event) =>
                      commit(`Alterou cor de ${company.name}`, (draft) => {
                        const current = draft.settings.companies.find(
                          (item) => item.name === company.name,
                        );
                        if (current) current.primary = event.target.value;
                      })
                    }
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <CardTitle>Usuários e perfis</CardTitle>
              <CardDescription>
                O cliente pode ser vinculado ao responsável pela emissão e aos
                cobradores.
              </CardDescription>
            </CardHeader>
            <CardContent className="table-shell">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Ativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.settings.users.map((account) => (
                    <TableRow key={account.email}>
                      <TableCell>
                        <strong>{account.name}</strong>
                      </TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>{account.role}</TableCell>
                      <TableCell>
                        <Switch
                          checked={account.active}
                          onCheckedChange={(value) =>
                            commit(
                              `${value ? "Ativou" : "Desativou"} ${account.name}`,
                              (draft) => {
                                const current = draft.settings.users.find(
                                  (item) => item.email === account.email,
                                );
                                if (current) current.active = value;
                              },
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="listas">
          <div className="settings-columns">
            <Card>
              <CardHeader>
                <CardTitle>Formas de pagamento</CardTitle>
              </CardHeader>
              <CardContent className="stack">
                <div className="inline">
                  <Input
                    value={newValue}
                    onChange={(event) => setNewValue(event.target.value)}
                    placeholder="Nova forma de pagamento"
                  />
                  <Button
                    onClick={() => {
                      if (!newValue.trim()) return;
                      commit(`Adicionou ${newValue}`, (draft) =>
                        draft.settings.paymentMethods.push(newValue.trim()),
                      );
                      setNewValue("");
                    }}
                  >
                    <Plus />
                  </Button>
                </div>
                <div className="chips">
                  {state.settings.paymentMethods.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Datas já automatizadas</CardTitle>
              </CardHeader>
              <CardContent className="stack">
                <p>
                  Diário, segundas, quarta de congelados, sextas, quinzenal,
                  dias 20/25 e mensal no primeiro dia do mês seguinte.
                </p>
                <Button variant="outline" onClick={() => setTab("regras")}>
                  <CalendarDays /> Gerenciar regras
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="backup">
          <div className="settings-columns">
            <Card>
              <CardHeader>
                <CardTitle>Backup</CardTitle>
              </CardHeader>
              <CardContent className="stack">
                <Button onClick={backup}>
                  <Download /> Baixar backup completo
                </Button>
                <Label className="upload-button">
                  <Upload /> Restaurar backup
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(event) => restore(event.target.files?.[0])}
                  />
                </Label>
                <small>
                  A restauração substitui o estado atual e aplica a migração das
                  regras financeiras.
                </small>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Auditoria recente</CardTitle>
              </CardHeader>
              <CardContent className="audit-list">
                {state.audit.slice(0, 12).map((item, index) => (
                  <div key={index}>
                    <History />
                    <span>
                      <strong>{item.user}</strong>
                      <small>{item.action}</small>
                    </span>
                    <time>{dateBR(item.at)}</time>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

// Mantido apenas para compatibilidade de versões antigas do estado.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Configuration({ state, commit }: { state: AppState; commit: Commit }) {
  const [tab, setTab] = useState("empresas"),
    [newValue, setNewValue] = useState("");
  function backup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `BACKUP_GESTAO_${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup gerado");
  }
  function restore(file?: File) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(String(r.result));
        commit("Restaurou backup", (d) => Object.assign(d, data));
        toast.success("Backup restaurado");
      } catch {
        toast.error("Backup inválido");
      }
    };
    r.readAsText(file);
  }
  return (
    <>
      <PageTitle
        eyebrow="Administração"
        title="Configurações"
        description="Empresas, perfis, regras, campos, identidade, calendário e backups sem alterar código."
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="settings-tabs">
          <TabsTrigger value="empresas">Empresas</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários e perfis</TabsTrigger>
          <TabsTrigger value="regras">Regras</TabsTrigger>
          <TabsTrigger value="campos">Campos</TabsTrigger>
          <TabsTrigger value="feriados">Feriados</TabsTrigger>
          <TabsTrigger value="backup">Backup e auditoria</TabsTrigger>
        </TabsList>
        <TabsContent value="empresas">
          <div className="settings-cards">
            {state.settings.companies.map((c) => (
              <Card key={c.name}>
                <CardContent className="company-card">
                  <img src={c.logo} alt={c.name} />
                  <div>
                    <strong>{c.name}</strong>
                    <small>{c.document}</small>
                    <span>
                      {c.email}
                      <br />
                      {c.phone}
                    </span>
                  </div>
                  <input
                    type="color"
                    value={c.primary}
                    aria-label="Cor"
                    onChange={(e) =>
                      commit(`Alterou cor de ${c.name}`, (d) => {
                        const x = d.settings.companies.find(
                          (y) => y.name === c.name,
                        );
                        if (x) x.primary = e.target.value;
                      })
                    }
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <CardTitle>Usuários e perfis</CardTitle>
              <CardDescription>Permissões por recurso e ação.</CardDescription>
            </CardHeader>
            <CardContent className="table-shell">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Ativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.settings.users.map((u) => (
                    <TableRow key={u.email}>
                      <TableCell>
                        <strong>{u.name}</strong>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>
                        <div className="chips">
                          {(
                            state.settings.profiles.find(
                              (p) => p.name === u.role,
                            )?.permissions ?? ["configurável"]
                          )
                            .slice(0, 3)
                            .map((x) => (
                              <span key={x}>{x}</span>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={u.active}
                          onCheckedChange={(v) =>
                            commit(
                              `${v ? "Ativou" : "Desativou"} ${u.name}`,
                              (d) => {
                                const x = d.settings.users.find(
                                  (y) => y.email === u.email,
                                );
                                if (x) x.active = v;
                              },
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="regras">
          <div className="settings-columns">
            <Card>
              <CardHeader>
                <CardTitle>Regras de cobrança</CardTitle>
              </CardHeader>
              <CardContent className="rules-list">
                {state.settings.colorRules.map((r) => (
                  <div key={r.name}>
                    <input
                      type="color"
                      value={r.color}
                      onChange={(e) =>
                        commit(`Alterou cor ${r.name}`, (d) => {
                          const x = d.settings.colorRules.find(
                            (y) => y.name === r.name,
                          );
                          if (x) x.color = e.target.value;
                        })
                      }
                    />
                    <span>
                      <strong>{r.name}</strong>
                      <small>{r.action}</small>
                    </span>
                    <em>Prioridade {r.priority}</em>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tabelas de vencimento</CardTitle>
              </CardHeader>
              <CardContent className="rules-list">
                {state.settings.dueRules.map((r) => (
                  <div key={r.name}>
                    <CalendarDays />
                    <span>
                      <strong>{r.name}</strong>
                      <small>
                        {r.type} · {r.days} dias · {r.adjustment}
                      </small>
                    </span>
                    <Button variant="ghost" size="icon">
                      <Pencil />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Listas rápidas</CardTitle>
              </CardHeader>
              <CardContent className="stack">
                <div className="inline">
                  <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Nova forma de pagamento"
                  />
                  <Button
                    onClick={() => {
                      if (!newValue.trim()) return;
                      commit(`Adicionou ${newValue}`, (d) =>
                        d.settings.paymentMethods.push(newValue),
                      );
                      setNewValue("");
                    }}
                  >
                    <Plus />
                  </Button>
                </div>
                <div className="chips">
                  {state.settings.paymentMethods.map((x) => (
                    <span key={x}>{x}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="campos">
          <Card>
            <CardHeader>
              <CardTitle>Campos personalizados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Rótulo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Obrigatório</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.settings.customFields.map((f, i) => (
                    <TableRow key={i}>
                      <TableCell>{f.entity}</TableCell>
                      <TableCell>
                        <strong>{f.label}</strong>
                      </TableCell>
                      <TableCell>{f.type}</TableCell>
                      <TableCell>
                        <Switch
                          checked={f.required}
                          onCheckedChange={(v) =>
                            commit(`Alterou ${f.label}`, (d) => {
                              d.settings.customFields[i].required = v;
                            })
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="feriados">
          <Card>
            <CardHeader>
              <CardTitle>Feriados e regras</CardTitle>
            </CardHeader>
            <CardContent className="holiday-list">
              {state.settings.holidays.map((h) => (
                <div key={h.date}>
                  <CalendarDays />
                  <span>
                    <strong>
                      {dateBR(h.date)} · {h.name}
                    </strong>
                    <small>
                      {h.type} · {h.driverRule}
                    </small>
                  </span>
                  <Button variant="ghost" size="icon">
                    <Pencil />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="backup">
          <div className="settings-columns">
            <Card>
              <CardHeader>
                <CardTitle>Backup</CardTitle>
              </CardHeader>
              <CardContent className="stack">
                <Button onClick={backup}>
                  <Download /> Baixar backup completo
                </Button>
                <Label className="upload-button">
                  <Upload /> Restaurar backup
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(e) => restore(e.target.files?.[0])}
                  />
                </Label>
                <small>A restauração substitui o estado atual.</small>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Auditoria recente</CardTitle>
              </CardHeader>
              <CardContent className="audit-list">
                {state.audit.slice(0, 12).map((a, i) => (
                  <div key={i}>
                    <History />
                    <span>
                      <strong>{a.user}</strong>
                      <small>{a.action}</small>
                    </span>
                    <time>{dateBR(a.at)}</time>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
