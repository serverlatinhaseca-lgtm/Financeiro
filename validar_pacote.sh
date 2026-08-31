#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
EXPECTED='2026.08.31-R3-FULLSTACK'
pass=0
check(){ "$@"; pass=$((pass+1)); }
check python3 -m py_compile backend/app/main.py backend/app/reset_admin.py
check bash -n install.sh
check bash -n verificar_servidor.sh
check node --check frontend/runtime-server.mjs
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
unzip -q frontend/CODIGO_FONTE_COMPLETO.zip -d "$TMP/src"
check node --test "$TMP/src/tests/latest-requirements.test.mjs" "$TMP/src/tests/release-contract.test.mjs"
grep -q "$EXPECTED" VERSAO.txt
pass=$((pass+1))
grep -q "$EXPECTED" backend/app/main.py
pass=$((pass+1))
grep -q "$EXPECTED" "$TMP/src/app/page.tsx"
pass=$((pass+1))
! grep -q 'fallbackCoordinate' "$TMP/src/app/components/route-map.tsx"
pass=$((pass+1))
grep -q 'build --no-cache' install.sh
pass=$((pass+1))
echo "VALIDAÇÃO ESTÁTICA APROVADA: $pass etapas"
