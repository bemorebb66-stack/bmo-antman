#!/bin/bash
# BMO Signal Flow 일일 데이터 갱신 + 사이트 빌드
# 사용법 (Git Bash): bash C:/Users/ssoni/SeohakRadar/run_daily.sh
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$ROOT/tools/node-v20.18.1-win-x64:$PATH"

echo "[1/3] SEC EDGAR Form 4 수집..."
node "$ROOT/pipeline/fetch_form4.mjs" \
  --from 2026-01-01 \
  --to "$(date -u +%Y-%m-%d)" \
  --universe all \
  --max-rows 3000 \
  --max-filings-per-day 2000 \
  --max-rows-per-month 3000 \
  --max-days-per-month 999 \
  --max-rows-per-index-day 1000 \
  --quiet

echo "[2/3] SEC EDGAR IPO 락업 수집..."
node "$ROOT/pipeline/fetch_lockup.mjs" --max-candidates 40 --months 9

echo "[3/3] 사이트 빌드..."
cd "$ROOT/site"
npx vite build

echo "완료. 배포 대상: $ROOT/docs/ (git add docs/ site/public/data && git commit && git push)"
