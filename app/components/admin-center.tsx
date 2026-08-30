"use client";

import { FormEvent, useState } from "react";
import {
  Building2,
  Download,
  Eye,
  FileImage,
  History,
  LayoutGrid,
  LockKeyhole,
  Palette,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  UserCog,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  AppState,
  ModuleId,
  PermissionAction,
  PermissionProfile,
  UserAccount,
} from "@/app/lib/seed";
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
const actions: PermissionAction[] = [
  "visualizar",
  "criar",
  "editar",
  "excluir",
  "aprovar",
  "exportar",
  "configurar",
];
const uid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

function AssetPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  function upload(file?: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024)
      return toast.error("A imagem deve ter no máximo 2 MB");
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  }
  return (
    <div className="asset-picker">
      <div className="asset-preview">
        {value ? <img src={value} alt={label} /> : <FileImage />}
      </div>
      <div>
        <Label>{label}</Label>
        <Input
          value={value.startsWith("data:") ? "Imagem enviada" : value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="URL ou caminho da imagem"
        />
        <Label className="upload-button small">
          <Upload /> Enviar imagem
          <Input
            type="file"
            accept="image/*"
            onChange={(event) => upload(event.target.files?.[0])}
          />
        </Label>
      </div>
    </div>
  );
}

export function AdminCenter({
  state,
  commit,
  token,
}: {
  state: AppState;
  commit: Commit;
  token: string;
}) {
  const [tab, setTab] = useState("identidade");
  const [editingProfile, setEditingProfile] =
    useState<PermissionProfile | null>(null);
  const [editingUser, setEditingUser] = useState<
    (UserAccount & { password?: string }) | null
  >(null);
  const [listValue, setListValue] = useState("");
  const appearance = state.settings.appearance;
  const blankProfile: PermissionProfile = {
    id: "",
    name: "",
    description: "",
    permissions: [],
    moduleAccess: { dashboard: ["visualizar"] },
  };
  const blankUser: UserAccount & { password?: string } = {
    id: "",
    name: "",
    username: "",
    email: "",
    role: state.settings.profiles[0]?.name || "Administrador",
    profileId: state.settings.profiles[0]?.id || "profile-admin",
    active: true,
    companies: ["*"],
    password: "",
  };

  function saveProfile() {
    if (!editingProfile?.name.trim())
      return toast.error("Informe o nome do perfil");
    const item = { ...editingProfile, id: editingProfile.id || uid("perfil") };
    commit(
      `${editingProfile.id ? "Editou" : "Criou"} perfil ${item.name}`,
      (draft) => {
        const index = draft.settings.profiles.findIndex(
          (profile) => profile.id === item.id,
        );
        if (index >= 0) draft.settings.profiles[index] = item;
        else draft.settings.profiles.push(item);
        draft.settings.users
          .filter((user) => user.profileId === item.id)
          .forEach((user) => (user.role = item.name));
      },
    );
    setEditingProfile(null);
    toast.success("Perfil salvo");
  }
  async function saveUser(event: FormEvent) {
    event.preventDefault();
    if (
      !editingUser?.name.trim() ||
      !editingUser.username?.trim() ||
      !editingUser.email.trim()
    )
      return toast.error("Informe nome, nome de usuário e e-mail");
    const profile = state.settings.profiles.find(
      (item) => item.id === editingUser.profileId,
    );
    const item: UserAccount = {
      id: editingUser.id || uid("usuario"),
      name: editingUser.name,
      username: editingUser.username,
      email: editingUser.email,
      role: profile?.name || editingUser.role,
      companies: editingUser.companies.length ? editingUser.companies : ["*"],
      active: editingUser.active,
      profileId: editingUser.profileId,
      localPassword:
        editingUser.password || editingUser.localPassword || "Acesso@123",
    };
    if (token !== "local-demo") {
      try {
        const response = await fetch(
          editingUser.id
            ? `/api/admin/users/${editingUser.id}`
            : "/api/admin/users",
          {
            method: editingUser.id ? "PUT" : "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ...item, password: editingUser.password }),
          },
        );
        if (!response.ok) throw new Error(await response.text());
      } catch {
        return toast.error("Não foi possível sincronizar o usuário de acesso");
      }
    }
    commit(
      `${editingUser.id ? "Editou" : "Criou"} usuário ${item.name}`,
      (draft) => {
        const index = draft.settings.users.findIndex(
          (user) => user.id === item.id || user.email === item.email,
        );
        if (index >= 0) draft.settings.users[index] = item;
        else draft.settings.users.push(item);
      },
    );
    setEditingUser(null);
    toast.success("Usuário salvo");
  }
  async function deleteUser(account: UserAccount) {
    if (token !== "local-demo") {
      const response = await fetch(
        `/api/admin/users/by-email/${encodeURIComponent(account.email)}`,
        { method: "DELETE", headers: { authorization: `Bearer ${token}` } },
      );
      if (!response.ok && response.status !== 404)
        return toast.error("Não foi possível apagar o usuário de acesso");
    }
    commit(`Excluiu usuário ${account.name}`, (draft) => {
      draft.settings.users = draft.settings.users.filter(
        (user) => user.id !== account.id,
      );
    });
    toast.success("Usuário excluído");
  }
  function backup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BACKUP_GESTAO_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p>Administração do sistema</p>
          <h1>Configurações e personalização</h1>
          <span>
            O administrador controla identidade, usuários, perfis, módulos,
            regras e todos os elementos editáveis.
          </span>
        </div>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="module-tabs">
        <TabsList className="module-tabs-list">
          <TabsTrigger value="identidade">
            <Palette /> Identidade
          </TabsTrigger>
          <TabsTrigger value="empresas">
            <Building2 /> Empresas
          </TabsTrigger>
          <TabsTrigger value="usuarios">
            <UsersRound /> Usuários
          </TabsTrigger>
          <TabsTrigger value="perfis">
            <ShieldCheck /> Perfis e permissões
          </TabsTrigger>
          <TabsTrigger value="modulos">
            <LayoutGrid /> Módulos
          </TabsTrigger>
          <TabsTrigger value="campos">
            <UserCog /> Campos e listas
          </TabsTrigger>
          <TabsTrigger value="seguranca">
            <LockKeyhole /> Segurança
          </TabsTrigger>
        </TabsList>
        <TabsContent value="identidade">
          <div className="settings-columns">
            <Card>
              <CardHeader>
                <CardTitle>Marca do sistema</CardTitle>
                <CardDescription>
                  Nome, textos, logos, fundos e miniaturas são substituíveis.
                </CardDescription>
              </CardHeader>
              <CardContent className="form-grid">
                <div className="field full">
                  <Label>Nome do sistema</Label>
                  <Input
                    value={appearance.appName}
                    onChange={(event) =>
                      commit("Alterou nome do sistema", (draft) => {
                        draft.settings.appearance.appName = event.target.value;
                      })
                    }
                  />
                </div>
                <div className="field full">
                  <Label>Título do menu</Label>
                  <Input
                    value={appearance.sidebarTitle}
                    onChange={(event) =>
                      commit("Alterou título do menu", (draft) => {
                        draft.settings.appearance.sidebarTitle =
                          event.target.value;
                      })
                    }
                  />
                </div>
                <div className="field full">
                  <Label>Frase da tela de login</Label>
                  <Textarea
                    value={appearance.tagline}
                    onChange={(event) =>
                      commit("Alterou frase institucional", (draft) => {
                        draft.settings.appearance.tagline = event.target.value;
                      })
                    }
                  />
                </div>
                <div className="field full">
                  <AssetPicker
                    label="Logo principal"
                    value={appearance.logo}
                    onChange={(value) =>
                      commit("Alterou logo principal", (draft) => {
                        draft.settings.appearance.logo = value;
                      })
                    }
                  />
                </div>
                <div className="field full">
                  <AssetPicker
                    label="Fundo da tela de login"
                    value={appearance.loginBackground}
                    onChange={(value) =>
                      commit("Alterou fundo de login", (draft) => {
                        draft.settings.appearance.loginBackground = value;
                      })
                    }
                  />
                </div>
                <div className="field full">
                  <AssetPicker
                    label="Miniatura do sistema"
                    value={appearance.thumbnail}
                    onChange={(value) =>
                      commit("Alterou miniatura", (draft) => {
                        draft.settings.appearance.thumbnail = value;
                      })
                    }
                  />
                </div>
                <div className="field full">
                  <AssetPicker
                    label="Ícone do navegador (favicon)"
                    value={appearance.favicon}
                    onChange={(value) =>
                      commit("Alterou ícone do navegador", (draft) => {
                        draft.settings.appearance.favicon = value;
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>
                  Cores, fundo, superfícies, cantos e densidade.
                </CardDescription>
              </CardHeader>
              <CardContent className="appearance-grid">
                {[
                  ["Primária", "primary"],
                  ["Secundária", "secondary"],
                  ["Fundo", "background"],
                  ["Superfície", "surface"],
                  ["Texto", "text"],
                ].map(([label, key]) => (
                  <label key={key}>
                    <span>{label}</span>
                    <input
                      type="color"
                      value={String(appearance[key as keyof typeof appearance])}
                      onChange={(event) =>
                        commit(`Alterou cor ${label}`, (draft) => {
                          (
                            draft.settings.appearance as unknown as Record<
                              string,
                              string
                            >
                          )[key] = event.target.value;
                        })
                      }
                    />
                  </label>
                ))}
                <div className="field full appearance-explainer">
                  <strong>Prévia e tema claro</strong>
                  <small>
                    As cores acima controlam menu, botões, fundo, cartões e
                    textos do tema claro em todo o sistema.
                  </small>
                </div>
                {[
                  ["Escuro · Primária", "darkPrimary"],
                  ["Escuro · Secundária", "darkSecondary"],
                  ["Escuro · Fundo", "darkBackground"],
                  ["Escuro · Superfície", "darkSurface"],
                  ["Escuro · Texto", "darkText"],
                ].map(([label, key]) => (
                  <label key={key}>
                    <span>{label}</span>
                    <input
                      type="color"
                      value={String(appearance[key as keyof typeof appearance])}
                      onChange={(event) =>
                        commit(`Alterou cor ${label}`, (draft) => {
                          (
                            draft.settings.appearance as unknown as Record<
                              string,
                              string
                            >
                          )[key] = event.target.value;
                        })
                      }
                    />
                  </label>
                ))}
                <Label>Arredondamento: {appearance.radius}px</Label>
                <Input
                  type="range"
                  min="0"
                  max="28"
                  value={appearance.radius}
                  onChange={(event) =>
                    commit("Alterou arredondamento", (draft) => {
                      draft.settings.appearance.radius = Number(
                        event.target.value,
                      );
                    })
                  }
                />
                <Label>Densidade</Label>
                <NativeSelect
                  value={appearance.density}
                  onChange={(event) =>
                    commit("Alterou densidade", (draft) => {
                      draft.settings.appearance.density = event.target.value as
                        "Compacta" | "Confortável";
                    })
                  }
                >
                  <NativeSelectOption>Compacta</NativeSelectOption>
                  <NativeSelectOption>Confortável</NativeSelectOption>
                </NativeSelect>
                <div
                  className="brand-live-preview"
                  style={{
                    background: appearance.background,
                    color: appearance.text,
                    borderRadius: appearance.radius,
                  }}
                >
                  <img src={appearance.logo} alt="Prévia" />
                  <strong>{appearance.appName}</strong>
                  <Button style={{ background: appearance.primary }}>
                    Ação principal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="empresas">
          <div className="settings-cards">
            {state.settings.companies.map((company, index) => (
              <Card key={company.name}>
                <CardHeader>
                  <CardTitle>{company.name}</CardTitle>
                </CardHeader>
                <CardContent className="stack">
                  <AssetPicker
                    label="Logo da empresa"
                    value={company.logo}
                    onChange={(value) =>
                      commit(`Alterou logo de ${company.name}`, (draft) => {
                        draft.settings.companies[index].logo = value;
                      })
                    }
                  />
                  <AssetPicker
                    label="Assinatura"
                    value={company.signature}
                    onChange={(value) =>
                      commit(
                        `Alterou assinatura de ${company.name}`,
                        (draft) => {
                          draft.settings.companies[index].signature = value;
                        },
                      )
                    }
                  />
                  <AssetPicker
                    label="Carimbo"
                    value={company.stamp}
                    onChange={(value) =>
                      commit(`Alterou carimbo de ${company.name}`, (draft) => {
                        draft.settings.companies[index].stamp = value;
                      })
                    }
                  />
                  {[
                    ["Razão social", "name"],
                    ["CNPJ", "document"],
                    ["E-mail", "email"],
                    ["Telefone", "phone"],
                    ["Endereço", "address"],
                    ["Banco", "bankName"],
                    ["Agência", "agency"],
                    ["Conta", "account"],
                    ["Favorecido", "beneficiary"],
                  ].map(([label, key]) => (
                    <div className="field" key={key}>
                      <Label>{label}</Label>
                      <Input
                        value={String(company[key as keyof typeof company])}
                        onChange={(event) =>
                          commit(`Alterou ${label}`, (draft) => {
                            (
                              draft.settings.companies[
                                index
                              ] as unknown as Record<string, string>
                            )[key] = event.target.value;
                          })
                        }
                      />
                    </div>
                  ))}
                  <label className="color-line">
                    <span>Cor da empresa</span>
                    <input
                      type="color"
                      value={company.primary}
                      onChange={(event) =>
                        commit("Alterou cor da empresa", (draft) => {
                          draft.settings.companies[index].primary =
                            event.target.value;
                        })
                      }
                    />
                  </label>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="usuarios">
          <Card>
            <CardHeader className="row">
              <div>
                <CardTitle>Usuários do sistema</CardTitle>
                <CardDescription>
                  Cadastre, edite, desative ou exclua contas e associe um
                  perfil.
                </CardDescription>
              </div>
              <Button onClick={() => setEditingUser(blankUser)}>
                <Plus /> Novo usuário
              </Button>
            </CardHeader>
            <CardContent className="table-shell">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Empresas</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.settings.users.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <strong>{account.name}</strong>
                      </TableCell>
                      <TableCell>
                        <strong>@{account.username}</strong>
                      </TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>{account.role}</TableCell>
                      <TableCell>
                        {account.companies.includes("*")
                          ? "Todas"
                          : account.companies.join(", ")}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={account.active}
                          onCheckedChange={(checked) =>
                            commit(
                              `${checked ? "Ativou" : "Desativou"} ${account.name}`,
                              (draft) => {
                                const found = draft.settings.users.find(
                                  (user) => user.id === account.id,
                                );
                                if (found) found.active = checked;
                              },
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="table-actions">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEditingUser({ ...account, password: "" })
                            }
                          >
                            Editar
                          </Button>
                          {account.email !== "admin@gestao.local" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteUser(account)}
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="perfis">
          <div className="profile-admin-grid">
            <Card>
              <CardHeader className="row">
                <div>
                  <CardTitle>Perfis cadastrados</CardTitle>
                  <CardDescription>
                    Os módulos aparecem conforme as permissões deste perfil.
                  </CardDescription>
                </div>
                <Button onClick={() => setEditingProfile(blankProfile)}>
                  <Plus /> Novo perfil
                </Button>
              </CardHeader>
              <CardContent className="profile-list">
                {state.settings.profiles.map((profile) => (
                  <article key={profile.id}>
                    <ShieldCheck />
                    <div>
                      <strong>{profile.name}</strong>
                      <p>{profile.description}</p>
                      <small>
                        {Object.keys(profile.moduleAccess).length} módulos
                        liberados
                      </small>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditingProfile(structuredClone(profile))
                      }
                    >
                      Gerenciar
                    </Button>
                    {profile.id !== "profile-admin" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (
                            state.settings.users.some(
                              (user) => user.profileId === profile.id,
                            )
                          )
                            return toast.error(
                              "Reatribua os usuários antes de apagar o perfil",
                            );
                          commit(`Excluiu perfil ${profile.name}`, (draft) => {
                            draft.settings.profiles =
                              draft.settings.profiles.filter(
                                (item) => item.id !== profile.id,
                              );
                          });
                        }}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </article>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Como o acesso funciona</CardTitle>
              </CardHeader>
              <CardContent className="permission-help">
                <Eye />
                <p>
                  O ADM escolhe quais módulos cada perfil enxerga e quais ações
                  pode executar: visualizar, criar, editar, excluir, aprovar,
                  exportar e configurar.
                </p>
                <p>
                  Usuários diferentes podem usar o mesmo perfil. Alterar um
                  perfil atualiza todos os usuários vinculados.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="modulos">
          <Card>
            <CardHeader>
              <CardTitle>Estrutura dos módulos</CardTitle>
              <CardDescription>
                Cada módulo possui suas próprias abas e pode ser desligado
                globalmente.
              </CardDescription>
            </CardHeader>
            <CardContent className="module-config-list">
              {state.settings.modules.map((module, index) => (
                <article key={module.id}>
                  <Switch
                    checked={module.enabled}
                    disabled={module.id === "configuracoes"}
                    onCheckedChange={(checked) =>
                      commit(
                        `${checked ? "Ativou" : "Desativou"} módulo ${module.name}`,
                        (draft) => {
                          draft.settings.modules[index].enabled = checked;
                        },
                      )
                    }
                  />
                  <div>
                    <Input
                      value={module.name}
                      onChange={(event) =>
                        commit("Renomeou módulo", (draft) => {
                          draft.settings.modules[index].name =
                            event.target.value;
                        })
                      }
                    />
                    <Textarea
                      value={module.description}
                      onChange={(event) =>
                        commit("Alterou descrição do módulo", (draft) => {
                          draft.settings.modules[index].description =
                            event.target.value;
                        })
                      }
                    />
                    <Label>Abas (uma por linha)</Label>
                    <Textarea
                      value={module.tabs.join("\n")}
                      onChange={(event) =>
                        commit("Alterou abas do módulo", (draft) => {
                          draft.settings.modules[index].tabs =
                            event.target.value
                              .split("\n")
                              .map((value) => value.trim())
                              .filter(Boolean);
                        })
                      }
                    />
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="campos">
          <div className="settings-columns">
            <Card>
              <CardHeader>
                <CardTitle>Campos personalizados</CardTitle>
                <CardDescription>
                  Crie campos adicionais sem alterar o código.
                </CardDescription>
              </CardHeader>
              <CardContent className="custom-field-list">
                {state.settings.customFields.map((field, index) => (
                  <article key={`${field.entity}-${index}`}>
                    <Input
                      value={field.entity}
                      onChange={(event) =>
                        commit("Alterou entidade do campo", (draft) => {
                          draft.settings.customFields[index].entity =
                            event.target.value;
                        })
                      }
                    />
                    <Input
                      value={field.label}
                      onChange={(event) =>
                        commit("Alterou campo", (draft) => {
                          draft.settings.customFields[index].label =
                            event.target.value;
                        })
                      }
                    />
                    <NativeSelect
                      value={field.type}
                      onChange={(event) =>
                        commit("Alterou tipo de campo", (draft) => {
                          draft.settings.customFields[index].type =
                            event.target.value;
                        })
                      }
                    >
                      {[
                        "Texto",
                        "Número",
                        "Data",
                        "Seleção",
                        "Sim/Não",
                        "Arquivo",
                      ].map((value) => (
                        <NativeSelectOption key={value}>
                          {value}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <Switch
                      checked={field.required}
                      onCheckedChange={(checked) =>
                        commit("Alterou obrigatoriedade", (draft) => {
                          draft.settings.customFields[index].required = checked;
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        commit("Excluiu campo personalizado", (draft) => {
                          draft.settings.customFields.splice(index, 1);
                        })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </article>
                ))}
                <Button
                  variant="outline"
                  onClick={() =>
                    commit("Criou campo personalizado", (draft) => {
                      draft.settings.customFields.push({
                        entity: "Cliente",
                        label: "Novo campo",
                        type: "Texto",
                        required: false,
                      });
                    })
                  }
                >
                  <Plus /> Novo campo
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Formas de pagamento</CardTitle>
              </CardHeader>
              <CardContent className="stack">
                <div className="inline">
                  <Input
                    value={listValue}
                    onChange={(event) => setListValue(event.target.value)}
                    placeholder="Nova opção"
                  />
                  <Button
                    onClick={() => {
                      if (!listValue.trim()) return;
                      commit(`Adicionou ${listValue}`, (draft) =>
                        draft.settings.paymentMethods.push(listValue.trim()),
                      );
                      setListValue("");
                    }}
                  >
                    <Plus />
                  </Button>
                </div>
                <div className="editable-chips">
                  {state.settings.paymentMethods.map((value, index) => (
                    <span key={`${value}-${index}`}>
                      {value}
                      <button
                        onClick={() =>
                          commit(`Removeu ${value}`, (draft) => {
                            draft.settings.paymentMethods.splice(index, 1);
                          })
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="seguranca">
          <div className="settings-columns">
            <Card>
              <CardHeader>
                <CardTitle>Backup e restauração</CardTitle>
              </CardHeader>
              <CardContent className="stack">
                <Button onClick={backup}>
                  <Download /> Baixar backup completo
                </Button>
                <Label className="upload-button">
                  <Upload /> Restaurar arquivo JSON
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        try {
                          const data = JSON.parse(String(reader.result));
                          commit("Restaurou backup", (draft) =>
                            Object.assign(draft, data),
                          );
                          toast.success("Backup restaurado");
                        } catch {
                          toast.error("Backup inválido");
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                </Label>
                <small>
                  O banco e os uploads do servidor permanecem protegidos pelos
                  volumes Docker.
                </small>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Auditoria</CardTitle>
                <CardDescription>
                  Últimas alterações registradas com usuário e horário.
                </CardDescription>
              </CardHeader>
              <CardContent className="audit-list">
                {state.audit.slice(0, 20).map((entry, index) => (
                  <div key={index}>
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
      </Tabs>
      <Dialog
        open={Boolean(editingUser)}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent>
          {editingUser && (
            <form onSubmit={saveUser}>
              <DialogHeader>
                <DialogTitle>
                  {editingUser.id ? "Editar usuário" : "Novo usuário"}
                </DialogTitle>
                <DialogDescription>
                  Defina o perfil e as empresas às quais a pessoa terá acesso.
                </DialogDescription>
              </DialogHeader>
              <div className="form-grid">
                <div className="field">
                  <Label>Nome</Label>
                  <Input
                    value={editingUser.name}
                    onChange={(event) =>
                      setEditingUser({
                        ...editingUser,
                        name: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="field">
                  <Label>Nome de usuário</Label>
                  <Input
                    value={editingUser.username || ""}
                    onChange={(event) =>
                      setEditingUser({
                        ...editingUser,
                        username: event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9._-]/g, ""),
                      })
                    }
                    placeholder="ex.: willians"
                    required
                  />
                </div>
                <div className="field">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={editingUser.email}
                    onChange={(event) =>
                      setEditingUser({
                        ...editingUser,
                        email: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="field">
                  <Label>Perfil</Label>
                  <NativeSelect
                    value={editingUser.profileId}
                    onChange={(event) => {
                      const profile = state.settings.profiles.find(
                        (item) => item.id === event.target.value,
                      );
                      setEditingUser({
                        ...editingUser,
                        profileId: event.target.value,
                        role: profile?.name || editingUser.role,
                      });
                    }}
                  >
                    {state.settings.profiles.map((profile) => (
                      <NativeSelectOption key={profile.id} value={profile.id}>
                        {profile.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="field">
                  <Label>
                    {editingUser.id ? "Nova senha (opcional)" : "Senha inicial"}
                  </Label>
                  <Input
                    type="password"
                    value={editingUser.password || ""}
                    onChange={(event) =>
                      setEditingUser({
                        ...editingUser,
                        password: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="field full">
                  <Label>Empresas permitidas</Label>
                  <div className="weekday-picker">
                    <label>
                      <Checkbox
                        checked={editingUser.companies.includes("*")}
                        onCheckedChange={(checked) =>
                          setEditingUser({
                            ...editingUser,
                            companies: checked ? ["*"] : [],
                          })
                        }
                      />{" "}
                      Todas
                    </label>
                    {state.settings.companies.map((company) => (
                      <label key={company.name}>
                        <Checkbox
                          disabled={editingUser.companies.includes("*")}
                          checked={editingUser.companies.includes(company.name)}
                          onCheckedChange={(checked) =>
                            setEditingUser({
                              ...editingUser,
                              companies: checked
                                ? [...editingUser.companies, company.name]
                                : editingUser.companies.filter(
                                    (value) => value !== company.name,
                                  ),
                            })
                          }
                        />{" "}
                        {company.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save /> Salvar usuário
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(editingProfile)}
        onOpenChange={(open) => !open && setEditingProfile(null)}
      >
        <DialogContent className="dialog-xl">
          {editingProfile && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {editingProfile.id ? "Editar perfil" : "Novo perfil"}
                </DialogTitle>
                <DialogDescription>
                  Marque os módulos e as ações que este perfil poderá utilizar.
                </DialogDescription>
              </DialogHeader>
              <div className="form-grid">
                <div className="field">
                  <Label>Nome</Label>
                  <Input
                    value={editingProfile.name}
                    onChange={(event) =>
                      setEditingProfile({
                        ...editingProfile,
                        name: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="field full">
                  <Label>Descrição</Label>
                  <Textarea
                    value={editingProfile.description}
                    onChange={(event) =>
                      setEditingProfile({
                        ...editingProfile,
                        description: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="permission-matrix">
                <div className="permission-head">
                  <strong>Módulo</strong>
                  {actions.map((action) => (
                    <span key={action}>{action}</span>
                  ))}
                </div>
                {state.settings.modules.map((module) => (
                  <div className="permission-row" key={module.id}>
                    <strong>{module.name}</strong>
                    {actions.map((action) => {
                      const allowed =
                        editingProfile.moduleAccess[module.id]?.includes(
                          action,
                        ) || false;
                      return (
                        <Checkbox
                          key={action}
                          checked={allowed}
                          onCheckedChange={(checked) => {
                            const current =
                              editingProfile.moduleAccess[module.id] || [];
                            const next = checked
                              ? [...current, action]
                              : current.filter((item) => item !== action);
                            setEditingProfile({
                              ...editingProfile,
                              moduleAccess: {
                                ...editingProfile.moduleAccess,
                                [module.id as ModuleId]: next,
                              },
                            });
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditingProfile(null)}
                >
                  Cancelar
                </Button>
                <Button onClick={saveProfile}>
                  <Save /> Salvar perfil
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
