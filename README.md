# 서학 레이더 (SeohakRadar)

해외주식 신호 대시보드 — 미국 내부자 매매(Form 4) · IPO 락업 해제 · 서학개미 보관금액.

## 구조

```
SeohakRadar/
├── tools/node-v20.18.1-win-x64/   # 포터블 Node (시스템 설치 아님)
├── pipeline/
│   ├── fetch_form4.mjs            # SEC EDGAR Form 4 수집기 → out/insider.json
│   ├── fetch_lockup.mjs           # SEC EDGAR 424B4 락업 수집기 → out/lockup.json
│   └── out/                       # 수집 결과 보관
├── site/                          # React + Vite + Tailwind 프론트엔드
│   ├── src/App.tsx                # 3탭 대시보드
│   ├── src/data.ts                # 샘플 데이터 + 타입 (실데이터 없을 때 폴백)
│   ├── public/data/insider.json   # 파이프라인이 갱신하는 실데이터
│   ├── public/data/lockup.json    # 파이프라인이 갱신하는 실데이터
│   └── dist/                      # 빌드 결과 (배포 대상)
└── run_daily.sh                   # 일일 갱신: 수집 + 빌드
```

## 일일 갱신

```bash
bash C:/Users/ssoni/SeohakRadar/run_daily.sh
```

## 로컬 미리보기

```bash
export PATH="/c/Users/ssoni/SeohakRadar/tools/node-v20.18.1-win-x64:$PATH"
cd /c/Users/ssoni/SeohakRadar/site && npx vite preview --port 4173
```

## 데이터 소스 및 상태

| 탭 | 소스 | 상태 |
|---|---|---|
| 내부자 매매 | SEC EDGAR daily form index + Form 4 XML (무료, 공식) | ✅ 실데이터 연동 완료 |
| IPO 락업 해제 | SEC EDGAR full-text search + 424B4 본문 파싱 (무료, 공식) | ✅ 실데이터 연동 완료 |
| 서학개미 보관금액 | 한국예탁결제원 증권정보포털 Open API | ⬜ 보류 — 종목별(TOP50) 데이터는 공식 오픈API가 아니라 SEIBRO 웹페이지에만 있음. 국가별 집계는 `금융위원회_국제거래외화증권예탁결제정보`(data.go.kr publicDataPk=15043445)로 가능하나 종목 단위가 아님. 진행 방식(집계로 축소 vs SEIBRO 스크래핑) 결정 필요 |

## SEC 요청 규칙 (두 fetch 스크립트 공통)

- User-Agent에 연락처 명시 필수
- 초당 10요청 이하 (요청당 130ms 대기)
- Form 4: daily index는 회사명 알파벳순이라 전체 구간 균등 샘플링으로 수집
- 락업: `efts.sec.gov` full-text search로 최근 424B4 중 "lock-up period" 문구 포함 건을 찾은 뒤,
  해당 CIK의 424B4 신고 이력에서 가장 이른 건인지 확인해 후속 유상증자(secondary offering)를 걸러냄
  (진짜 IPO만 채택)

## 알려진 한계 / 다음 작업

- [ ] 지분변동률: 직접/간접 보유가 섞인 신고(신탁 경유 등)는 라인별 전/후 보유주식수를 합산해 계산하도록
      2026-07-07 수정함(예: Cloudflare CEO 매도 건 -99.9% → -22.1%로 정상화). 완전히 예외 케이스가
      없다고 보장할 수는 없음
- [ ] 락업 파서: 발행 구조가 회사마다 달라 공모가/락업일수만 추출하고 발행주식수·유통물량 비율은
      신뢰성 문제로 제외함. 드물게 락업 조항이 아닌 다른 "N일" 문구를 오탐지하는 사례 존재
      (예: BXDC 25일 — 통상적인 90/180일보다 훨씬 짧아 오탐 의심, 수동 검증 필요)
  - 검증: 2026-07-07 파이프라인이 실제로 SpaceX(SPCX) IPO를 정확히 잡아냄 — 공모가 $135,
    상장일 2026-06-12, 두 값 모두 언론 보도와 일치. 파서 자체의 신뢰도는 높은 편
- [ ] 예탁결제원 API 연동 방식 결정 (위 표 참고)
- [ ] 호스팅 결정 및 배포 자동화
- [ ] 클러스터 탐지를 당일 스냅샷이 아닌 최근 7일 누적으로 확장
