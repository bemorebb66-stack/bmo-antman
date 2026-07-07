import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Moon,
  Search,
  ShieldAlert,
  Sun,
  Users,
} from "lucide-react";
import {
  INSIDER_TRADES,
  LOCKUP_EVENTS,
  dDay,
  type InsiderTrade,
  type LockupEvent,
} from "./data";

type Tab = "insider" | "lockup";
type Theme = "light" | "dark";
type TxFilter = "전체" | "매수" | "매도";

const fmtUSD = (n: number, digits = 0) =>
  "$" + n.toLocaleString("en-US", { maximumFractionDigits: digits });
const fmtNum = (n: number) => n.toLocaleString("en-US");

const companyKo: Record<string, string> = {
  ALAB: "아스테라 랩스",
  AIP: "아테리스",
  BRKF: "브룩퍼드 머티리얼즈",
  CORT: "코셉트 테라퓨틱스",
  DDOG: "데이터독",
  FYNL: "핀리프 테크놀로지스",
  HRZN: "호라이즌 바이오사이언스",
  IBRX: "이뮤너티바이오",
  MRAM: "에버스핀 테크놀로지스",
  NEBX: "네뷸라 로보틱스",
  NET: "클라우드플레어",
  NUVL: "누발렌트",
  ORBX: "오르빅스 에어로스페이스",
  PBF: "PBF 에너지",
  PLMR: "팔로마 홀딩스",
  PLSR: "펄서 데이터 시스템즈",
  QNTM: "퀀티스 헬스",
  RSKD: "리스크파이드",
  SARO: "스탠더드에어로",
  SLFY: "솔리파이 에너지",
  VLTR: "볼테라 시스템즈",
};

const companyName = (ticker: string, fallback: string) => companyKo[ticker] ?? fallback;
const normalizeTx = (txType: string): TxFilter | string =>
  txType.includes("매수") ? "매수" : txType.includes("매도") ? "매도" : txType;

function ThemeButton({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  return (
    <div className="inline-flex h-9 items-center border border-border bg-card p-0.5">
      <button
        className={`inline-flex h-8 w-8 items-center justify-center ${
          theme === "light" ? "bg-foreground text-background" : "text-muted-foreground"
        }`}
        onClick={() => setTheme("light")}
        title="라이트 모드"
      >
        <Sun size={15} />
      </button>
      <button
        className={`inline-flex h-8 w-8 items-center justify-center ${
          theme === "dark" ? "bg-foreground text-background" : "text-muted-foreground"
        }`}
        onClick={() => setTheme("dark")}
        title="다크 모드"
      >
        <Moon size={15} />
      </button>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-3.5 text-[13px] font-semibold transition-colors ${
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
    tone === "up"
      ? "text-positive"
      : tone === "down"
        ? "text-negative"
        : tone === "warn"
          ? "text-warning"
          : "";
  return (
    <div className="border border-border bg-card px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`num mt-2 text-[23px] font-bold leading-none ${color}`}>{value}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function SignalSummary({
  buyValue,
  sellValue,
  clusterCompanies,
  filedDate,
}: {
  buyValue: number;
  sellValue: number;
  clusterCompanies: number;
  filedDate: string;
}) {
  const sellHeavy = sellValue > buyValue;
  return (
    <section className="mb-4 border border-border bg-panel px-4 py-3.5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Today Signal</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight">
            {sellHeavy ? "공시 매도 우위, 클러스터 신호 확인 필요" : "공시 매수 우위, 내부자 관심 종목 확인"}
          </h2>
        </div>
        <div className="num text-sm text-muted-foreground">{filedDate}</div>
      </div>
      <p className="mt-2 max-w-4xl text-[13px] leading-relaxed text-muted-foreground">
        내부자 거래는 방향보다 맥락이 중요합니다. 거래대금, 보유 지분 변화, 같은 회사 안의 복수 신고 여부를
        함께 보면서 단독 매매와 집단 신호를 구분합니다. 현재 클러스터 신호는 {clusterCompanies}개 종목입니다.
      </p>
    </section>
  );
}

export interface InsiderMeta {
  filedDate: string;
  generatedAt: string;
  filingsScanned?: number;
}

function InsiderTab({ trades, meta }: { trades: InsiderTrade[]; meta: InsiderMeta | null }) {
  const [filter, setFilter] = useState<TxFilter>("전체");
  const normalized = useMemo(
    () => trades.map((trade) => ({ ...trade, txType: normalizeTx(trade.txType) })),
    [trades]
  );
  const rows = useMemo(
    () =>
      normalized
        .filter((trade) => filter === "전체" || trade.txType === filter)
        .sort((a, b) => b.value - a.value),
    [filter, normalized]
  );
  const buyValue = normalized
    .filter((trade) => trade.txType === "매수")
    .reduce((sum, trade) => sum + trade.value, 0);
  const sellValue = normalized
    .filter((trade) => trade.txType === "매도")
    .reduce((sum, trade) => sum + trade.value, 0);
  const clusterCompanies = new Set(
    normalized.filter((trade) => trade.clusterCount >= 2).map((trade) => trade.ticker)
  ).size;
  const subLabel = meta ? `${meta.filedDate} 신고분` : "샘플 데이터";

  return (
    <div>
      <div className="mb-3 inline-flex items-center gap-2 border border-border bg-card px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
        <CheckCircle2 size={13} className={meta ? "text-positive" : "text-warning"} />
        {meta
          ? `SEC EDGAR 실데이터 · ${meta.filedDate} 신고 ${trades.length}건 · 수집 ${meta.generatedAt.slice(0, 16).replace("T", " ")} UTC`
          : "샘플 데이터 · 파이프라인 연결 전"}
      </div>

      <SignalSummary
        buyValue={buyValue}
        sellValue={sellValue}
        clusterCompanies={clusterCompanies}
        filedDate={subLabel}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="매수 총액" value={fmtUSD(buyValue / 1e6, 1) + "M"} sub={subLabel} tone="up" />
        <Stat label="매도 총액" value={fmtUSD(sellValue / 1e6, 1) + "M"} sub={subLabel} tone="down" />
        <Stat label="클러스터 종목" value={`${clusterCompanies}종목`} sub="동일 방향 2인 이상 신고" tone="warn" />
        <Stat
          label="수집 건수"
          value={`${trades.length}건`}
          sub={meta?.filingsScanned ? `filing ${meta.filingsScanned}건 스캔` : "최근 2주 누적"}
        />
      </div>

      <div className="mt-4 flex border border-border bg-card p-0.5">
        {(["전체", "매수", "매도"] as const).map((option) => (
          <Pill key={option} active={filter === option} onClick={() => setFilter(option)}>
            {option}
          </Pill>
        ))}
      </div>

      <div className="mt-3 overflow-x-auto border border-border bg-card">
        <table className="w-full min-w-[920px] text-[12.5px]">
          <thead>
            <tr className="border-b border-border bg-secondary text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-semibold">신고일</th>
              <th className="px-3 py-2 font-semibold">종목</th>
              <th className="px-3 py-2 font-semibold">신고인</th>
              <th className="px-3 py-2 text-center font-semibold">구분</th>
              <th className="px-3 py-2 text-right font-semibold">수량</th>
              <th className="px-3 py-2 text-right font-semibold">단가</th>
              <th className="px-3 py-2 text-right font-semibold">거래대금</th>
              <th className="px-3 py-2 text-right font-semibold">지분변동</th>
              <th className="px-3 py-2 font-semibold">신호</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((trade) => (
              <tr key={trade.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/60">
                <td className="num whitespace-nowrap px-3 py-2.5 text-muted-foreground">{trade.filedDate.slice(5)}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <div className="num text-[13px] font-extrabold">{trade.ticker}</div>
                  <div className="text-[11px] text-muted-foreground">{companyName(trade.ticker, trade.company)}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <div className="font-semibold">{trade.filer}</div>
                  <div className="text-[11px] text-muted-foreground">{trade.role}</div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={`inline-flex h-6 items-center px-2 text-[11px] font-bold ${
                      trade.txType === "매수" ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
                    }`}
                  >
                    {trade.txType}
                  </span>
                </td>
                <td className="num px-3 py-2.5 text-right">{fmtNum(trade.shares)}</td>
                <td className="num px-3 py-2.5 text-right">{fmtUSD(trade.price, 2)}</td>
                <td className="num px-3 py-2.5 text-right font-semibold">{fmtUSD(trade.value / 1e6, 2)}M</td>
                <td
                  className={`num px-3 py-2.5 text-right font-semibold ${
                    trade.ownChangePct >= 0 ? "text-positive" : "text-negative"
                  }`}
                >
                  {trade.ownChangePct >= 0 ? "+" : ""}
                  {trade.ownChangePct.toFixed(1)}%
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {trade.clusterCount >= 2 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning">
                      <Users size={12} /> {trade.clusterCount}인 동시
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
    </div>
  );
}

export interface LockupMeta {
  generatedAt: string;
  candidatesChecked?: number;
}

function LockupTab({ events, meta }: { events: LockupEvent[]; meta: LockupMeta | null }) {
  const rows = useMemo(
    () => [...events].sort((a, b) => dDay(a.lockupDate) - dDay(b.lockupDate)),
    [events]
  );
  const within30 = events.filter((event) => dDay(event.lockupDate) <= 30 && dDay(event.lockupDate) >= 0).length;
  const within14 = events.filter((event) => dDay(event.lockupDate) <= 14 && dDay(event.lockupDate) >= 0).length;
  const avgDays = events.length ? events.reduce((sum, event) => sum + event.lockupDays, 0) / events.length : 0;
  const longLockup = events.filter((event) => event.lockupDays > 180).length;

  return (
    <div>
      <div className="mb-3 inline-flex items-center gap-2 border border-border bg-card px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
        <CalendarClock size={13} className={meta ? "text-positive" : "text-warning"} />
        {meta
          ? `SEC EDGAR 실데이터 · 424B4 증권신고서 ${events.length}건 · 수집 ${meta.generatedAt.slice(0, 16).replace("T", " ")} UTC`
          : "샘플 데이터 · 파이프라인 연결 전"}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="14일 내 락업 해제" value={`${within14}건`} sub="매도 압력 사전 확인" tone="warn" />
        <Stat label="30일 내 락업 해제" value={`${within30}건`} sub="유통물량 확대 가능" />
        <Stat label="평균 락업 기간" value={`${avgDays.toFixed(0)}일`} sub="공모일 기준" />
        <Stat label="장기 락업" value={`${longLockup}건`} sub="180일 초과" />
      </div>

      <div className="mt-4 grid gap-2.5">
        {rows.map((event) => {
          const dd = dDay(event.lockupDate);
          const urgent = dd <= 14 && dd >= 0;
          return (
            <div
              key={event.id}
              className={`grid grid-cols-1 gap-3 border px-4 py-3.5 md:grid-cols-[auto_1fr_auto_auto] md:items-center ${
                urgent ? "border-warning/60 bg-warning/10" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-3 md:w-44">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center text-[13px] font-bold ${
                    urgent ? "bg-warning text-warning-foreground" : "bg-secondary text-foreground"
                  }`}
                >
                  {dd >= 0 ? `D-${dd}` : "해제"}
                </div>
                <div>
                  <div className="num font-bold">{event.ticker}</div>
                  <div className="text-[11px] text-muted-foreground">{event.lockupDate}</div>
                </div>
              </div>
              <div>
                <div className="font-semibold">{companyName(event.ticker, event.company)}</div>
                <div className="text-[11px] text-muted-foreground">
                  공모 {event.ipoDate} · {fmtUSD(event.ipoPrice, 2)}
                  {event.underwriter ? ` · 주관 ${event.underwriter}` : ""}
                </div>
              </div>
              <div className="text-right md:text-center">
                <div className="text-[11px] text-muted-foreground">락업 기간</div>
                <div className="num font-bold">{event.lockupDays}일</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-muted-foreground">일정</div>
                <div className="num text-[12px] font-semibold text-muted-foreground">
                  {event.ipoDate} → {event.lockupDate}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("insider");
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return new URLSearchParams(window.location.search).get("theme") === "dark" ? "dark" : "light";
  });
  const [insiderTrades, setInsiderTrades] = useState<InsiderTrade[]>(INSIDER_TRADES);
  const [insiderMeta, setInsiderMeta] = useState<InsiderMeta | null>(null);
  const [lockupEvents, setLockupEvents] = useState<LockupEvent[]>(LOCKUP_EVENTS);
  const [lockupMeta, setLockupMeta] = useState<LockupMeta | null>(null);

  useEffect(() => {
    fetch("data/insider.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload && Array.isArray(payload.trades) && payload.trades.length > 0) {
          setInsiderTrades(payload.trades);
          setInsiderMeta(payload.meta ?? null);
        }
      })
      .catch(() => {});
    fetch("data/lockup.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload && Array.isArray(payload.events) && payload.events.length > 0) {
          setLockupEvents(payload.events);
          setLockupMeta(payload.meta ?? null);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className={theme}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-shell">
          <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-foreground text-background">
                <BarChart3 size={22} strokeWidth={2.3} />
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent-strong">
                  <span className="inline-block h-px w-3 bg-accent-strong" /> BMO VALUE TALKS
                </p>
                <h1 className="text-[26px] font-extrabold leading-none tracking-tight">BMO Signal Flow</h1>
                <p className="mt-1 flex items-center gap-1 text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
                  <Building2 size={11} /> Overseas Equity Disclosure Signals
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:justify-end">
              <a
                href="https://www.bvtmoneyflow.xyz/"
                className="inline-flex h-9 items-center gap-1.5 border border-border bg-card px-3 text-[12px] font-semibold text-muted-foreground hover:text-foreground"
              >
                Money Flow <ExternalLink size={13} />
              </a>
              <ThemeButton theme={theme} setTheme={setTheme} />
            </div>
          </div>
          <div className="mx-auto flex max-w-[1180px] gap-1 overflow-x-auto px-5 pb-3">
            <Pill active={tab === "insider"} onClick={() => setTab("insider")}>
              내부자 매매
            </Pill>
            <Pill active={tab === "lockup"} onClick={() => setTab("lockup")}>
              IPO 락업
            </Pill>
          </div>
        </header>

        <main className="mx-auto max-w-[1180px] px-5 py-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Signal Dashboard</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
                미국 공시 기반 신호를 한 화면에서 추적합니다
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
              <Search size={14} />
              기준일 {new Date().toISOString().slice(0, 10)}
            </div>
          </div>

          {tab === "insider" && <InsiderTab trades={insiderTrades} meta={insiderMeta} />}
          {tab === "lockup" && <LockupTab events={lockupEvents} meta={lockupMeta} />}

          <footer className="mt-10 flex gap-2 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldAlert size={14} className="mt-0.5 shrink-0" />
            <span>
              내부자 매매와 IPO 락업 데이터는 SEC EDGAR 공시를 기반으로 수집합니다. 본 화면은 투자 판단의
              근거가 아니라 공시 신호를 빠르게 확인하기 위한 보조 도구입니다.
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
