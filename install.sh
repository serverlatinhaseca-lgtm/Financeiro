#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

REGENERATE_ENV=false
if [[ "${1:-}" == "--regenerate-env" ]]; then
  REGENERATE_ENV=true
elif [[ -n "${1:-}" ]]; then
  echo "Uso: ./install.sh [--regenerate-env]" >&2
  exit 64
fi

info() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
ok() { printf '\033[1;32m✔ %s\033[0m\n' "$1"; }
fail() { printf '\033[1;31m✖ %s\033[0m\n' "$1" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || fail "Docker não encontrado. Instale Docker Engine e execute novamente."
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 não encontrado. Instale o plugin docker-compose-plugin."
docker info >/dev/null 2>&1 || fail "O Docker não está em execução ou seu usuário não possui permissão."
[[ -f docker-compose.yml ]] || fail "Execute o instalador na pasta raiz do projeto."
[[ -f Dockerfile ]] || fail "Dockerfile do frontend não encontrado."

ensure_frontend_build_tools() {
  local marker='RUN apk add --no-cache bash coreutils'
  local base='FROM node:22-alpine AS build'
  local temporary

  if grep -Fqx "$marker" Dockerfile; then
    ok "Dependências do frontend já configuradas"
    return
  fi

  grep -Fqx "$base" Dockerfile || fail "Não foi possível reconhecer a etapa de build do frontend."
  temporary="$(mktemp "${PROJECT_DIR}/Dockerfile.install.XXXXXX")"
  awk -v base="$base" -v marker="$marker" '{ print; if ($0 == base) print marker }' Dockerfile > "$temporary"
  mv "$temporary" Dockerfile
  chmod 644 Dockerfile
  ok "Dockerfile preparado automaticamente para Alpine"
}

ensure_frontend_build_tools

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

info "Construindo e iniciando banco, API, frontend e Nginx"
if ! docker compose up -d --build --remove-orphans; then
  docker compose logs --tail=120 || true
  fail "A construção falhou. As últimas linhas dos serviços foram exibidas acima."
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

if command -v curl >/dev/null 2>&1; then
  curl --fail --silent --show-error http://localhost/api/health >/dev/null || fail "A API iniciou, mas não respondeu pelo Nginx."
fi

server_ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
[[ -n "$server_ip" ]] || server_ip="IP_DO_SERVIDOR"

printf '\n\033[1;32mInstalação concluída com sucesso.\033[0m\n'
printf 'Endereço: http://%s\n' "$server_ip"
printf 'Usuário:  %s\n' "$ADMIN_EMAIL_VALUE"
if [[ -n "$GENERATED_ADMIN_PASSWORD" ]]; then
  printf 'Senha:    %s\n' "$GENERATED_ADMIN_PASSWORD"
else
  printf 'Senha:    valor de ADMIN_PASSWORD no arquivo .env\n'
fi
printf '\nGuarde a senha em local seguro. Para acompanhar: docker compose logs -f --tail=100\n'
