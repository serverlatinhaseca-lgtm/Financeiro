#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

REGENERATE_ENV=false
RESET_ADMIN_PASSWORD=false
for argument in "$@"; do
  case "$argument" in
    --regenerate-env) REGENERATE_ENV=true ;;
    --reset-admin-password) RESET_ADMIN_PASSWORD=true ;;
    *)
      echo "Uso: ./install.sh [--regenerate-env] [--reset-admin-password]" >&2
      exit 64
      ;;
  esac
done

info() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
ok() { printf '\033[1;32m✔ %s\033[0m\n' "$1"; }
fail() { printf '\033[1;31m✖ %s\033[0m\n' "$1" >&2; exit 1; }

run_as_root() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    fail "A instalação do Buildx exige root ou sudo. Instale docker-buildx-plugin e execute novamente."
  fi
}

command -v docker >/dev/null 2>&1 || fail "Docker não encontrado. Instale Docker Engine e execute novamente."
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 não encontrado. Instale o plugin docker-compose-plugin."
docker info >/dev/null 2>&1 || fail "O Docker não está em execução ou seu usuário não possui permissão."
[[ -f docker-compose.yml ]] || fail "Execute o instalador na pasta raiz do projeto."
[[ -f Dockerfile ]] || fail "Dockerfile do frontend não encontrado."

ensure_buildx() {
  if docker buildx version >/dev/null 2>&1; then
    ok "Docker Buildx disponível"
    return
  fi

  info "Instalando o componente Docker Buildx necessário"
  if command -v dnf >/dev/null 2>&1; then
    run_as_root dnf install -y docker-buildx-plugin
  elif command -v apt-get >/dev/null 2>&1; then
    run_as_root apt-get update
    run_as_root apt-get install -y docker-buildx-plugin
  else
    fail "Buildx ausente. Instale docker-buildx-plugin e execute novamente."
  fi
  docker buildx version >/dev/null 2>&1 || fail "Buildx não ficou disponível após a instalação."
  ok "Docker Buildx instalado"
}

ensure_buildx
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

ensure_frontend_build_tools() {
  local marker='RUN apk add --no-cache bash coreutils'
  local base
  local temporary

  if grep -Fqx "$marker" Dockerfile; then
    ok "Dependências do frontend já configuradas"
    return
  fi

  base="$(grep -Em1 '^FROM node:22-alpine( AS build)?$' Dockerfile || true)"
  [[ -n "$base" ]] || fail "Não foi possível reconhecer a etapa de build do frontend."
  temporary="$(mktemp "${PROJECT_DIR}/Dockerfile.install.XXXXXX")"
  awk -v base="$base" -v marker="$marker" '{ print; if ($0 == base) print marker }' Dockerfile > "$temporary"
  mv "$temporary" Dockerfile
  chmod 644 Dockerfile
  ok "Dockerfile preparado automaticamente para Alpine"
}

ensure_frontend_build_tools

[[ -d scripts ]] || fail "Pasta scripts não encontrada."
find scripts -type f -name '*.sh' -exec chmod 755 {} +
ok "Permissões dos scripts internos corrigidas"

ensure_local_hosting_config() {
  if [[ -f .openai/hosting.json ]]; then
    ok "Configuração local de build já existente"
    return
  fi

  mkdir -p .openai
  {
    printf '{\n'
    printf '  "d1": null,\n'
    printf '  "project_id": "local-docker",\n'
    printf '  "r2": null\n'
    printf '}\n'
  } > .openai/hosting.json
  ok "Configuração local de build criada"
}

ensure_local_hosting_config

ensure_dockerignore() {
  local pattern
  local patterns=(node_modules dist .next .git .sites-runtime .wrangler '*.zip' upload .env '.env.backup.*' '.build-*.log' __pycache__ '*.pyc')
  touch .dockerignore
  for pattern in "${patterns[@]}"; do
    grep -Fqx "$pattern" .dockerignore || printf '%s\n' "$pattern" >> .dockerignore
  done
  ok "Arquivos locais e credenciais protegidos do contexto Docker"
}

ensure_dockerignore

random_hex() {
  local bytes="$1"
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "$bytes"
  else
    od -An -N "$bytes" -tx1 /dev/urandom | tr -d ' \n'
  fi
}

ADMIN_EMAIL_VALUE="admin@gestao.local"
GENERATED_ADMIN_PASSWORD=""

create_env() {
  local db_password jwt_secret admin_password
  db_password="$(random_hex 24)"
  jwt_secret="$(random_hex 64)"
  admin_password="Admin@$(random_hex 8)"
  GENERATED_ADMIN_PASSWORD="$admin_password"

  umask 077
  {
    printf 'POSTGRES_DB=gestao\n'
    printf 'POSTGRES_USER=gestao\n'
    printf 'POSTGRES_PASSWORD=%s\n' "$db_password"
    printf 'JWT_SECRET=%s\n' "$jwt_secret"
    printf 'ADMIN_EMAIL=%s\n' "$ADMIN_EMAIL_VALUE"
    printf 'ADMIN_PASSWORD=%s\n' "$admin_password"
    printf 'CORS_ORIGINS=http://localhost\n'
  } > .env
  chmod 600 .env
}

if [[ "$REGENERATE_ENV" == true && -f .env ]]; then
  backup_name=".env.backup.$(date +%Y%m%d-%H%M%S)"
  cp .env "$backup_name"
  rm .env
  info "Configuração anterior preservada em $backup_name"
fi

if [[ ! -f .env ]]; then
  info "Gerando configuração segura da primeira instalação"
  create_env
  RESET_ADMIN_PASSWORD=true
  ok "Arquivo .env criado com permissões restritas"
else
  ok "Arquivo .env existente preservado"
fi

required_keys=(POSTGRES_PASSWORD JWT_SECRET ADMIN_PASSWORD)
for key in "${required_keys[@]}"; do
  value="$(sed -n "s/^${key}=//p" .env | tail -n 1)"
  [[ -n "$value" ]] || fail "$key está vazio no arquivo .env."
  [[ "$value" != troque-* ]] || fail "$key ainda contém o valor de exemplo."
done

info "Validando a configuração"
docker compose config >/dev/null
ok "Configuração válida"

build_service() {
  local service="$1"
  local log_file="${PROJECT_DIR}/.build-${service}.log"
  info "Construindo ${service}"
  if docker compose --progress plain build "$service" 2>&1 | tee "$log_file"; then
    ok "Imagem ${service} construída"
    return
  fi

  info "Recuperando cache de construção e repetindo ${service}"
  if grep -Eqi 'invalid tar header|invalid checksum|failed to apply diff|failed to unpack image' "$log_file"; then
    if command -v systemctl >/dev/null 2>&1; then
      run_as_root systemctl restart docker || true
      for _ in $(seq 1 30); do
        docker info >/dev/null 2>&1 && break
        sleep 1
      done
    fi
  fi
  docker builder prune -af >/dev/null 2>&1 || true
  docker image prune -f >/dev/null 2>&1 || true
  if docker compose --progress plain build --no-cache "$service" 2>&1 | tee "$log_file"; then
    ok "Imagem ${service} construída após recuperação"
    return
  fi

  tail -n 100 "$log_file" >&2 || true
  fail "Falha ao construir ${service}. O erro real foi salvo em ${log_file}."
}

build_service backend
build_service frontend

info "Iniciando e validando o PostgreSQL"
docker compose up -d database
database_ready=false
for _ in $(seq 1 45); do
  database_id="$(docker compose ps -q database)"
  if [[ -n "$database_id" ]]; then
    database_health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$database_id" 2>/dev/null || true)"
    if [[ "$database_health" == "healthy" ]]; then
      database_ready=true
      break
    fi
  fi
  sleep 2
done
[[ "$database_ready" == true ]] || fail "O PostgreSQL não ficou saudável dentro do tempo esperado."

# Um volume PostgreSQL preserva a senha definida na primeira inicialização. Esta
# sincronização permite substituir/recriar o .env sem apagar dados existentes.
db_user="$(sed -n 's/^POSTGRES_USER=//p' .env | tail -n 1)"
db_name="$(sed -n 's/^POSTGRES_DB=//p' .env | tail -n 1)"
db_password="$(sed -n 's/^POSTGRES_PASSWORD=//p' .env | tail -n 1)"
db_user="${db_user:-gestao}"
db_name="${db_name:-gestao}"
[[ "$db_user" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || fail "POSTGRES_USER possui caracteres inválidos."
[[ "$db_name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || fail "POSTGRES_DB possui caracteres inválidos."
[[ "$db_password" != *$'\n'* && "$db_password" != *$'\r'* ]] || fail "POSTGRES_PASSWORD não pode conter quebra de linha."
escaped_db_password="${db_password//\'/\'\'}"
if ! docker compose exec -T database psql -v ON_ERROR_STOP=1 -U "$db_user" -d "$db_name" \
  -c "ALTER ROLE \"$db_user\" WITH PASSWORD '$escaped_db_password';" >/dev/null; then
  fail "Não foi possível sincronizar a senha com o volume PostgreSQL existente."
fi
ok "Credencial do banco sincronizada sem apagar dados"

info "Iniciando API, frontend e Nginx"
if ! docker compose up -d --remove-orphans backend frontend nginx; then
  docker compose logs --tail=120 || true
  fail "Os serviços não iniciaram. As últimas linhas foram exibidas acima."
fi

info "Aguardando os serviços ficarem saudáveis"
ready=false
for _ in $(seq 1 60); do
  backend_id="$(docker compose ps -q backend)"
  nginx_id="$(docker compose ps -q nginx)"
  if [[ -n "$backend_id" && -n "$nginx_id" ]]; then
    backend_health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$backend_id" 2>/dev/null || true)"
    nginx_status="$(docker inspect -f '{{.State.Status}}' "$nginx_id" 2>/dev/null || true)"
    if [[ "$backend_health" == "healthy" && "$nginx_status" == "running" ]]; then
      ready=true
      break
    fi
  fi
  sleep 2
done

if [[ "$ready" != true ]]; then
  docker compose ps
  docker compose logs --tail=120 backend frontend nginx || true
  fail "Os serviços não ficaram prontos dentro do tempo esperado."
fi

if [[ "$RESET_ADMIN_PASSWORD" == true ]]; then
  info "Sincronizando acesso do administrador"
  docker compose exec -T backend python -m app.reset_admin || fail "Não foi possível redefinir o acesso administrativo."
  ok "Administrador sincronizado com ADMIN_PASSWORD"
fi

if command -v curl >/dev/null 2>&1; then
  curl --fail --silent --show-error http://localhost/api/health >/dev/null || fail "A API iniciou, mas não respondeu pelo Nginx."
fi

server_ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
[[ -n "$server_ip" ]] || server_ip="IP_DO_SERVIDOR"
ADMIN_EMAIL_VALUE="$(sed -n 's/^ADMIN_EMAIL=//p' .env | tail -n 1)"
ADMIN_EMAIL_VALUE="${ADMIN_EMAIL_VALUE:-admin@gestao.local}"

printf '\n\033[1;32mInstalação concluída com sucesso.\033[0m\n'
printf 'Endereço: http://%s\n' "$server_ip"
printf 'Usuário:  %s\n' "$ADMIN_EMAIL_VALUE"
if [[ -n "$GENERATED_ADMIN_PASSWORD" ]]; then
  printf 'Senha:    %s\n' "$GENERATED_ADMIN_PASSWORD"
else
  printf 'Senha:    valor de ADMIN_PASSWORD no arquivo .env\n'
fi
printf '\nGuarde a senha em local seguro. Para acompanhar: docker compose logs -f --tail=100\n'
