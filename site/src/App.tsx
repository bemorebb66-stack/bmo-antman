import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Globe2,
  Minus,
  Radar,
  TriangleAlert,
  Users,
} from "lucide-react";
import {
  HOLDINGS,
  INSIDER_TRADES,
  LOCKUP_EVENTS,
  dDay,
  type HoldingRow,
  type InsiderTrade,
  type LockupEvent,
} from "./data";

const fmtUSD = (n: number, digits = 0) =>
  "$" + n.toLocaleString("en-US", { maximumFractionDigits: digits });
const fmtNum = (n: number) => n.toLocaleString("en-US");

type Tab = "insider" | "lockup" | "holdings";

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 text-[13px] font-semibold transition-colors ${
        active
          ? "bg-[#DC6B52] text-[#150F09]"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "up" | "down" | "warn";
}) {
  const color =
    tone === "up" ? "text-[#DC6B52]" : tone === "down" ? "text-[#76A8BC]" : tone === "warn" ? "text-[#C8A45E]" : "";
  return (
    <div className="border border-border bg-card px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`num mt-1.5 text-[22px] font-bold leading-none ${color}`}>{value}</p>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

// ── Insider tab ────────────────────────────────────────────
export interface InsiderMeta {
  filedDate: string;
  generatedAt: string;
  filingsScanned?: number;
}

function InsiderTab({ trades, meta }: { trades: InsiderTrade[]; meta: InsiderMeta | null }) {
  const [filter, setFilter] = useState<"전체" | "매수" | "매도">("전체");
  const rows = useMemo(
    () =>
      trades.filter((t) => filter === "전체" || t.txType === filter).sort(
        (a, b) => b.value - a.value
      ),
    [filter, trades]
  );
  const buyValue = trades.filter((t) => t.txType === "매수").reduce((s, t) => s + t.value, 0);
  const sellValue = trades.filter((t) => t.txType === "매도").reduce((s, t) => s + t.value, 0);
  const clusterCompanies = new Set(
    trades.filter((t) => t.clusterCount >= 2).map((t) => t.ticker)
  ).size;
  const subLabel = meta ? `${meta.filedDate} 신고분` : "샘플 데이터";

  return (
    <div>
      <div
        className={`mb-3 inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-bold ${
          meta ? "bg-[#DC6B52]/10 text-[#DC6B52]" : "bg-[#C8A45E]/10 text-[#C8A45E]"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${meta ? "bg-[#DC6B52]" : "bg-[#C8A45E]"}`} />
        {meta
          ? `SEC EDGAR 실데이터 — ${meta.filedDate} 신고분 ${trades.length}건 · 수집 ${meta.generatedAt.slice(0, 16).replace("T", " ")} UTC`
          : "샘플 데이터 — 파이프라인 연결 전"}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="매수 총액" value={fmtUSD(buyValue / 1e6, 1) + "M"} sub={subLabel} tone="up" />
        <Stat label="매도 총액" value={fmtUSD(sellValue / 1e6, 1) + "M"} sub={subLabel} tone="down" />
        <Stat label="클러스터 매매 종목" value={`${clusterCompanies}종목`} sub="동일 방향 2인 이상 신고" tone="warn" />
        <Stat
          label="수집 건수"
          value={`${trades.length}건`}
          sub={meta?.filingsScanned ? `filing ${meta.filingsScanned}건 스캔` : "최근 2주 누적"}
        />
      </div>

      <div className="mt-4 flex border border-border">
        {(["전체", "매수", "매도"] as const).map((f) => (
          <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f}
          </Pill>
        ))}
      </div>

      <div className="mt-3 overflow-x-auto border border-border">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-border bg-secondary text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-semibold">신고일</th>
              <th className="px-3 py-2 font-semibold">종목</th>
              <th className="px-3 py-2 font-semibold">신고인 · 직위</th>
              <th className="px-3 py-2 text-center font-semibold">구분</th>
              <th className="px-3 py-2 text-right font-semibold">수량</th>
              <th className="px-3 py-2 text-right font-semibold">단가</th>
              <th className="px-3 py-2 text-right font-semibold">거래대금</th>
              <th className="px-3 py-2 text-right font-semibold">지분변동</th>
              <th className="px-3 py-2 font-semibold">신호</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t: InsiderTrade) => (
              <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/50">
                <td className="num whitespace-nowrap px-3 py-2.5 text-muted-foreground">{t.filedDate.slice(5)}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <div className="num font-bold">{t.ticker}</div>
                  <div className="text-[11px] text-muted-foreground">{t.company}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {t.filer}
                  <span className="ml-1.5 text-[11px] text-muted-foreground">{t.role}</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 text-[11px] font-bold ${
                      t.txType === "매수" ? "bg-[#DC6B52]/15 text-[#DC6B52]" : "bg-[#76A8BC]/15 text-[#76A8BC]"
                    }`}
                  >
                    {t.txType}
                  </span>
                </td>
                <td className="num px-3 py-2.5 text-right">{fmtNum(t.shares)}</td>
                <td className="num px-3 py-2.5 text-right">{fmtUSD(t.price, 2)}</td>
                <td className="num px-3 py-2.5 text-right font-semibold">{fmtUSD(t.value / 1e6, 2)}M</td>
                <td
                  className={`num px-3 py-2.5 text-right font-semibold ${
                    t.ownChangePct >= 0 ? "text-[#DC6B52]" : "text-[#76A8BC]"
                  }`}
                >
                  {t.ownChangePct >= 0 ? "+" : ""}
                  {t.ownChangePct.toFixed(1)}%
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {t.clusterCount >= 2 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C8A45E]">
                      <Users size={12} /> {t.clusterCount}인 동시
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">단독</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        클러스터 매매 = 같은 회사에서 최근 7일 내 2인 이상의 임원·대주주가 동일 방향(매수 또는 매도)으로
        Form 4를 신고한 경우. 경영진의 집단적 판단이 반영된 신호로 단독 거래보다 신뢰도가 높다고 봄.
      </p>
    </div>
  );
}

// ── Lockup tab ─────────────────────────────────────────────
export interface LockupMeta {
  generatedAt: string;
  candidatesChecked?: number;
}

function LockupTab({ events, meta }: { events: LockupEvent[]; meta: LockupMeta | null }) {
  const rows = useMemo(() => [...events].sort((a, b) => dDay(a.lockupDate) - dDay(b.lockupDate)), [events]);
  const within30 = events.filter((e) => dDay(e.lockupDate) <= 30 && dDay(e.lockupDate) >= 0).length;
  const within14 = events.filter((e) => dDay(e.lockupDate) <= 14 && dDay(e.lockupDate) >= 0).length;
  const avgDays = events.length ? events.reduce((s, e) => s + e.lockupDays, 0) / events.length : 0;
  const longLockup = events.filter((e) => e.lockupDays > 180).length;

  return (
    <div>
      <div
        className={`mb-3 inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-bold ${
          meta ? "bg-[#DC6B52]/10 text-[#DC6B52]" : "bg-[#C8A45E]/10 text-[#C8A45E]"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${meta ? "bg-[#DC6B52]" : "bg-[#C8A45E]"}`} />
        {meta
          ? `SEC EDGAR 실데이터 — 424B4 증권신고서 ${events.length}건 · 수집 ${meta.generatedAt.slice(0, 16).replace("T", " ")} UTC`
          : "샘플 데이터 — 파이프라인 연결 전"}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="14일 내 락업 해제" value={`${within14}건`} sub="매도 압력 임박" tone="warn" />
        <Stat label="30일 내 락업 해제" value={`${within30}건`} sub="유통물량 확대 예정" />
        <Stat label="평균 락업 기간" value={`${avgDays.toFixed(0)}일`} sub="공모일 기준" />
        <Stat label="락업 180일↑ 종목" value={`${longLockup}건`} sub="장기 락업 (대형 IPO에 흔함)" />
      </div>

      <div className="mt-4 space-y-2.5">
        {rows.map((e: LockupEvent) => {
          const dd = dDay(e.lockupDate);
          const urgent = dd <= 14 && dd >= 0;
          return (
            <div
              key={e.id}
              className={`grid grid-cols-1 gap-3 border px-4 py-3.5 md:grid-cols-[auto_1fr_auto_auto] md:items-center ${
                urgent ? "border-[#C8A45E]/60 bg-[#C8A45E]/[0.06]" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-3 md:w-40">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center text-[13px] font-bold ${
                    urgent ? "bg-[#C8A45E] text-[#1A1305]" : "bg-secondary text-foreground"
                  }`}
                >
                  {dd >= 0 ? `D-${dd}` : "해제됨"}
                </div>
                <div>
                  <div className="num font-bold">{e.ticker}</div>
                  <div className="text-[11px] text-muted-foreground">{e.lockupDate}</div>
                </div>
              </div>
              <div>
                <div className="font-semibold">{e.company}</div>
                <div className="text-[11px] text-muted-foreground">
                  공모 {e.ipoDate} · {fmtUSD(e.ipoPrice, 2)}
                  {e.underwriter ? ` · 주관 ${e.underwriter}` : ""}
                </div>
              </div>
              <div className="text-right md:text-center">
                <div className="text-[11px] text-muted-foreground">락업 기간</div>
                <div className="num font-bold">{e.lockupDays}일</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-muted-foreground">공모일 → 해제일</div>
                <div className="num text-[12px] font-semibold text-muted-foreground">
                  {e.ipoDate} → {e.lockupDate}
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="border border-border bg-card px-4 py-8 text-center text-[12px] text-muted-foreground">
            표시할 락업 이벤트가 없습니다.
          </p>
        )}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        락업 기간 = SEC 증권신고서(424B4)에 명시된, 상장 후 내부자·기존 주주의 매도가 제한되는 기간.
        해제 시점에 대량의 잠재 매도 물량이 시장에 풀릴 수 있어 주가 하락 압력의 원인이 되곤 함. 발행
        구조에 따라 실제 해제 물량·유통주식 대비 비율은 회사마다 달라 이 표에는 포함하지 않음.
      </p>
    </div>
  );
}

// ── Holdings tab ───────────────────────────────────────────
function HoldingsTab() {
  const rows = useMemo(() => [...HOLDINGS].sort((a, b) => a.rank - b.rank), []);
  const totalCustody = HOLDINGS.reduce((s, h) => s + h.custodyUSD, 0);
  const netBuyTotal = HOLDINGS.reduce((s, h) => s + h.weeklyNetBuyUSD, 0);
  const riserCount = HOLDINGS.filter((h) => h.rank < h.prevRank).length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Top10 보관금액 합계" value={fmtUSD(totalCustody / 1000, 1) + "B"} sub="예탁결제원 집계 기준(가상)" />
        <Stat
          label="이번 주 순매수 합계"
          value={`${netBuyTotal >= 0 ? "+" : ""}${fmtUSD(netBuyTotal, 0)}M`}
          sub="Top10 종목 합산"
          tone={netBuyTotal >= 0 ? "up" : "down"}
        />
        <Stat label="순위 상승 종목" value={`${riserCount}종목`} sub="전주 대비 랭킹 상승" tone="up" />
        <Stat label="1위 종목" value={rows[0].ticker} sub={rows[0].company} />
      </div>

      <div className="mt-4 overflow-x-auto border border-border">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-border bg-secondary text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-semibold">순위</th>
              <th className="px-3 py-2 font-semibold">종목</th>
              <th className="px-3 py-2 text-right font-semibold">보관금액</th>
              <th className="px-3 py-2 text-right font-semibold">전주대비</th>
              <th className="px-3 py-2 text-right font-semibold">이번주 순매수</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h: HoldingRow) => {
              const rankDelta = h.prevRank - h.rank;
              return (
                <tr key={h.ticker} className="border-b border-border/60 last:border-0 hover:bg-secondary/50">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="num text-[14px] font-extrabold">{h.rank}</span>
                      {rankDelta > 0 && (
                        <span className="inline-flex items-center text-[11px] font-semibold text-[#DC6B52]">
                          <ArrowUpRight size={12} />
                          {rankDelta}
                        </span>
                      )}
                      {rankDelta < 0 && (
                        <span className="inline-flex items-center text-[11px] font-semibold text-[#76A8BC]">
                          <ArrowDownRight size={12} />
                          {-rankDelta}
                        </span>
                      )}
                      {rankDelta === 0 && <Minus size={12} className="text-muted-foreground" />}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="num font-bold">{h.ticker}</span>
                    <span className="ml-1.5 text-[11px] text-muted-foreground">{h.company}</span>
                  </td>
                  <td className="num px-3 py-2.5 text-right font-semibold">{fmtUSD(h.custodyUSD)}M</td>
                  <td
                    className={`num px-3 py-2.5 text-right ${
                      h.custodyChangePct >= 0 ? "text-[#DC6B52]" : "text-[#76A8BC]"
                    }`}
                  >
                    {h.custodyChangePct >= 0 ? "+" : ""}
                    {h.custodyChangePct.toFixed(1)}%
                  </td>
                  <td
                    className={`num px-3 py-2.5 text-right font-semibold ${
                      h.weeklyNetBuyUSD >= 0 ? "text-[#DC6B52]" : "text-[#76A8BC]"
                    }`}
                  >
                    {h.weeklyNetBuyUSD >= 0 ? "+" : ""}
                    {fmtUSD(h.weeklyNetBuyUSD)}M
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        보관금액 = 국내 투자자가 보유 중인 해당 종목의 총 평가금액(예탁결제원 증권정보포털 집계 기준).
        순매수는 매수 결제금액에서 매도 결제금액을 차감한 값.
      </p>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("insider");
  const [insiderTrades, setInsiderTrades] = useState<InsiderTrade[]>(INSIDER_TRADES);
  const [insiderMeta, setInsiderMeta] = useState<InsiderMeta | null>(null);
  const [lockupEvents, setLockupEvents] = useState<LockupEvent[]>(LOCKUP_EVENTS);
  const [lockupMeta, setLockupMeta] = useState<LockupMeta | null>(null);

  useEffect(() => {
    fetch("data/insider.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && Array.isArray(j.trades) && j.trades.length > 0) {
          setInsiderTrades(j.trades);
          setInsiderMeta(j.meta ?? null);
        }
      })
      .catch(() => {
        /* 파일 없으면 샘플 데이터 유지 */
      });
    fetch("data/lockup.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && Array.isArray(j.events) && j.events.length > 0) {
          setLockupEvents(j.events);
          setLockupMeta(j.meta ?? null);
        }
      })
      .catch(() => {
        /* 파일 없으면 샘플 데이터 유지 */
      });
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#DC6B52] text-[#150F09]">
              <Radar size={22} strokeWidth={2.3} />
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#DC6B52]">
                <span className="inline-block h-px w-3 bg-[#DC6B52]" /> BMO VALUE TALKS
              </p>
              <h1 className="text-[26px] font-extrabold leading-none tracking-tight">
                서학<span className="font-display font-semibold not-italic">·</span>
                <span className="font-display italic font-semibold text-[#DC6B52]">레이더</span>
              </h1>
              <p className="mt-1 flex items-center gap-1 text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
                <Globe2 size={11} /> Overseas Equity Signal Dashboard
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block border border-[#DC6B52] px-2 py-0.5 text-[10px] font-bold tracking-widest text-[#DC6B52]">
              베타
            </span>
            <p className="mt-1 text-[11px] text-muted-foreground">
              기준일 {new Date().toISOString().slice(0, 10)}
            </p>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1180px] gap-1 px-5">
          <Pill active={tab === "insider"} onClick={() => setTab("insider")}>
            내부자 매매 (Form 4)
          </Pill>
          <Pill active={tab === "lockup"} onClick={() => setTab("lockup")}>
            IPO 락업 해제
          </Pill>
          <Pill active={tab === "holdings"} onClick={() => setTab("holdings")}>
            서학개미 보관금액
          </Pill>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-5 py-5">
        {tab === "insider" && <InsiderTab trades={insiderTrades} meta={insiderMeta} />}
        {tab === "lockup" && <LockupTab events={lockupEvents} meta={lockupMeta} />}
        {tab === "holdings" && <HoldingsTab />}

        <footer className="mt-10 flex gap-2 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" />
          <span>
            내부자 매매·IPO 락업 해제 탭은 SEC EDGAR 공시(Form 4, 424B4)에서 수집한 실데이터입니다
            (탭 상단에 수집 시각 표시). 서학개미 보관금액 탭은 아직 가상의 샘플 데이터이며, 한국예탁
            결제원 증권정보포털 데이터로 연동 예정입니다. 본 사이트의 정보는 투자 판단의 근거로 사용될
            수 없습니다.
          </span>
        </footer>
      </main>
    </div>
  );
}
