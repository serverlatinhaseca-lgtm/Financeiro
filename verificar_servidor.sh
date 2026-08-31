#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
EXPECTED="2026.08.31-R5-FULLSTACK"
fail(){ echo "✖ $*" >&2; exit 1; }
ok(){ echo "✔ $*"; }
command -v curl >/dev/null || fail "curl não instalado"
[[ -f .env ]] || fail ".env não encontrado"
health="$(curl -fsS -H 'Cache-Control: no-cache' http://localhost/api/health)" || fail "API não respondeu"
[[ "$health" == *"$EXPECTED"* ]] || fail "API não está na versão $EXPECTED: $health"
ok "API $EXPECTED"
home="$(curl -fsS -H 'Cache-Control: no-cache' "http://localhost/?verify=$EXPECTED")" || fail "Frontend não respondeu"
[[ "$home" == *"$EXPECTED"* ]] || fail "Frontend servido não contém $EXPECTED"
ok "Frontend $EXPECTED"
user="admin"
pass="$(sed -n 's/^ADMIN_PASSWORD=//p' .env | tail -n1)"
[[ -n "$pass" ]] || fail "ADMIN_PASSWORD vazio"
payload="$(python3 -c 'import json,sys; print(json.dumps({"username":sys.argv[1],"password":sys.argv[2]}))' "$user" "$pass")"
login="$(curl -fsS -H 'Content-Type: application/json' -d "$payload" http://localhost/api/auth/login)" || fail "Login do admin falhou"
token="$(printf '%s' "$login" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("token", ""))')"
[[ -n "$token" ]] || fail "Login sem token"
curl -fsS -H "Authorization: Bearer $token" http://localhost/api/state >/dev/null || fail "Estado autenticado falhou"
ok "Login e estado autenticado"
if cep="$(curl -fsS http://localhost/api/lookup/cep/01001000 2>/dev/null)"; then
  [[ "$cep" == *'São Paulo'* || "$cep" == *'S\u00e3o Paulo'* ]] && ok "Consulta CEP" || echo "⚠ CEP respondeu, mas o conteúdo foi inesperado"
else
  echo "⚠ Consulta CEP externa indisponível neste momento; o restante do sistema continua validado"
fi
docker compose ps
printf '\nTudo validado. Versão ativa: %s\n' "$EXPECTED"
