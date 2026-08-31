#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
EXPECTED='2026.08.31-R4-FULLSTACK'
pass=0
ok(){ echo "✔ $1"; pass=$((pass+1)); }
fail(){ echo "✖ $1" >&2; exit 1; }

command -v python3 >/dev/null 2>&1 || fail "Python 3 não encontrado no servidor."
[[ -f backend/app/main.py ]] || fail "backend/app/main.py ausente"
[[ -f frontend/CODIGO_FONTE_COMPLETO.zip ]] || fail "frontend/CODIGO_FONTE_COMPLETO.zip ausente"
[[ -f frontend/Dockerfile ]] || fail "frontend/Dockerfile ausente"
[[ -f docker-compose.yml ]] || fail "docker-compose.yml ausente"

python3 -m py_compile backend/app/main.py backend/app/reset_admin.py
ok "Backend Python sem erro de sintaxe"
bash -n install.sh verificar_servidor.sh validar_pacote.sh
ok "Scripts SSH sem erro de sintaxe"

python3 - <<'PY'
from zipfile import ZipFile
from pathlib import Path
EXPECTED='2026.08.31-R4-FULLSTACK'
zp=Path('frontend/CODIGO_FONTE_COMPLETO.zip')
with ZipFile(zp) as z:
    names=set(z.namelist())
    required=['app/page.tsx','app/components/route-map.tsx','app/components/planner-calendar.tsx','tests/latest-requirements.test.mjs','tests/release-contract.test.mjs','package.json','package-lock.json']
    missing=[x for x in required if x not in names]
    if missing: raise SystemExit('Arquivos ausentes no frontend: '+', '.join(missing))
    page=z.read('app/page.tsx').decode('utf-8','replace')
    route=z.read('app/components/route-map.tsx').decode('utf-8','replace')
    planner=z.read('app/components/planner-calendar.tsx').decode('utf-8','replace')
    routeops=z.read('app/components/route-operations-center.tsx').decode('utf-8','replace')
    if EXPECTED not in page: raise SystemExit('Assinatura R4 ausente no frontend')
    if 'fallbackCoordinate' in route: raise SystemExit('Mapa ainda contém fallbackCoordinate')
    checks=[
      ('score 1000','1000' in page),
      ('mapa CEP/endereço','geocode' in route.lower() or 'cep' in route.lower()),
      ('linha animada','route-animated-line' in route or 'route-flow' in route),
      ('planner modal','selectedPlannerEvent' in routeops and 'DialogContent' in routeops),
    ]
    failed=[name for name,ok in checks if not ok]
    if failed: raise SystemExit('Contratos ausentes: '+', '.join(failed))
print('Frontend fonte: estrutura e contratos principais OK')
PY
ok "Fonte do frontend verificada sem exigir Node no host"

grep -q "$EXPECTED" VERSAO.txt || fail "VERSAO.txt não contém $EXPECTED"
grep -q "$EXPECTED" backend/app/main.py || fail "Backend não contém assinatura $EXPECTED"
ok "Assinatura de versão consistente"

grep -q 'DOCKER_BUILDKIT=0' install.sh || fail "Instalador não está configurado para funcionar sem Buildx"
ok "Instalador preparado para Docker sem Buildx"

echo "VALIDAÇÃO ESTÁTICA APROVADA: $pass etapas"
