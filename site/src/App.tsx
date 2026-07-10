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
type PeriodFilter = "7D" | "30D" | "90D" | "전체";
type FilingSort = "default" | "latest" | "oldest";
type CoverageFilter = "major" | "russell" | "all";

const fmtUSD = (n: number, digits = 0) =>
  "$" + n.toLocaleString("en-US", { maximumFractionDigits: digits });
const fmtNum = (n: number) => n.toLocaleString("en-US");

const majorUniverseTickers = new Set(
  [
    "AAPL",
    "ABNB",
    "ADBE",
    "ADI",
    "AEP",
    "AFL",
    "AMAT",
    "AMD",
    "AMGN",
    "AMZN",
    "ANET",
    "AON",
    "AVGO",
    "AZO",
    "BALL",
    "BX",
    "BXP",
    "CARR",
    "CASY",
    "CCL",
    "CHRW",
    "CME",
    "CMS",
    "COF",
    "COHR",
    "COST",
    "CRL",
    "CRWD",
    "CSGP",
    "CTSH",
    "CVX",
    "DASH",
    "DDOG",
    "DELL",
    "DVA",
    "ED",
    "EIX",
    "EOG",
    "EVRG",
    "EW",
    "FANG",
    "FSLR",
    "GEHC",
    "GILD",
    "GL",
    "GLW",
    "GM",
    "GOOG",
    "GOOGL",
    "HAL",
    "HAS",
    "HOOD",
    "HST",
    "HSY",
    "IDXX",
    "INTU",
    "IP",
    "JBHT",
    "JBL",
    "JPM",
    "KEY",
    "KEYS",
    "KMB",
    "L",
    "LGN",
    "LULU",
    "MCD",
    "MPWR",
    "MRVL",
    "MSFT",
    "NET",
    "NOW",
    "NVDA",
    "O",
    "OKLO",
    "PANW",
    "PCAR",
    "PFG",
    "PPG",
    "PSX",
    "QCOM",
    "RMD",
    "SCHW",
    "SLB",
    "SMR",
    "SPG",
    "SPGI",
    "SRE",
    "STX",
    "TDG",
    "TGT",
    "TSLA",
    "TT",
    "TTD",
    "TTWO",
    "TXN",
    "TXT",
    "URI",
    "UTHR",
    "VRSK",
    "WDAY",
    "WM",
    "WRB",
    "YUM",
  ].map((ticker) => ticker.toUpperCase())
);

const companyKo: Record<string, string> = {
  AAPL: "애플",
  ABNB: "에어비앤비",
  ACT: "이낵트 홀딩스",
  ADBE: "어도비",
  ADI: "아날로그 디바이시스",
  AEP: "아메리칸 일렉트릭 파워",
  AFL: "애플랙",
  AMKR: "앰코 테크놀로지",
  AMZN: "아마존",
  ANET: "아리스타 네트웍스",
  AKAM: "아카마이 테크놀로지스",
  ALAB: "아스테라 랩스",
  ALH: "얼라이언스 런드리 홀딩스",
  ALMR: "알라마 바이오사이언시스",
  AIP: "아테리스",
  AMAT: "어플라이드 머티어리얼즈",
  AMD: "어드밴스드 마이크로 디바이시스",
  AMGN: "암젠",
  AON: "에이온",
  AADX: "어플라이드 에어로스페이스 앤 디펜스",
  ARXS: "아르시스",
  AVEX: "에이벡스",
  AVGO: "브로드컴",
  AZO: "오토존",
  BANC: "뱅크 오브 캘리포니아",
  BALL: "볼 코퍼레이션",
  BMBL: "범블",
  BGIN: "BGIN 블록체인",
  BIXI: "비트코인 인프라스트럭처 애퀴지션",
  BRKF: "브룩퍼드 머티리얼즈",
  BSP: "벤딩 스푼스",
  BTGO: "비트고 홀딩스",
  BTSG: "브라이트스프링 헬스 서비스",
  BX: "블랙스톤",
  BXDC: "블랙스톤 디지털 인프라스트럭처 트러스트",
  BXP: "BXP",
  CBRS: "세레브라스 시스템즈",
  CASY: "케이시스 제너럴 스토어스",
  CCL: "카니발",
  CHRW: "C.H. 로빈슨 월드와이드",
  CME: "CME 그룹",
  CMS: "CMS 에너지",
  COHR: "코히런트",
  COF: "캐피털 원 파이낸셜",
  COAG: "헤맙 테라퓨틱스",
  COGT: "코전트 바이오사이언시스",
  CORT: "코셉트 테라퓨틱스",
  COST: "코스트코",
  CPT: "캠든 프로퍼티 트러스트",
  CRWV: "코어위브",
  CRL: "찰스 리버 래버러토리스",
  CRWD: "크라우드스트라이크",
  CSGP: "코스타 그룹",
  CTSH: "코그니전트 테크놀로지 솔루션스",
  CVNA: "카바나",
  CVX: "셰브론",
  DASH: "도어대시",
  DBD: "디볼드 닉스도프",
  DELL: "델 테크놀로지스",
  DDOG: "데이터독",
  DVA: "다비타",
  ED: "콘솔리데이티드 에디슨",
  EIX: "에디슨 인터내셔널",
  EIKN: "아이콘 테라퓨틱스",
  EQPT: "이큅먼트셰어",
  EOG: "EOG 리소시스",
  EVRG: "에버지",
  EW: "에드워즈 라이프사이언시스",
  FANG: "다이아몬드백 에너지",
  FOA: "파이낸스 오브 아메리카",
  FIX: "컴포트 시스템즈 USA",
  FSLR: "퍼스트 솔라",
  FRBT: "포브라이트",
  FYNL: "핀리프 테크놀로지스",
  GEHC: "GE 헬스케어",
  GIX: "긱캐피탈9",
  GILD: "길리어드 사이언스",
  GL: "글로브 라이프",
  GLW: "코닝",
  GM: "제너럴 모터스",
  GOOG: "알파벳",
  GOOGL: "알파벳",
  HAL: "할리버튼",
  HAWK: "호크아이 360",
  HAS: "해즈브로",
  HOOD: "로빈후드 마켓츠",
  HRZN: "호라이즌 바이오사이언스",
  HST: "호스트 호텔스 앤 리조츠",
  HSY: "허쉬",
  IBRX: "이뮤너티바이오",
  IDXX: "아이덱스 래버러토리스",
  INTU: "인튜이트",
  IP: "인터내셔널 페이퍼",
  JAGU: "재규어 우라늄",
  JBHT: "J.B. 헌트 트랜스포트 서비스",
  JBL: "자빌",
  JPM: "JP모건 체이스",
  KEY: "키코프",
  KEYS: "키사이트 테크놀로지스",
  KMB: "킴벌리클라크",
  L: "로우스",
  LCLN: "링컨 인터내셔널",
  LIFE: "에토스 테크놀로지스",
  LIME: "라임",
  LMRI: "루멕사 이미징 홀딩스",
  LITE: "루멘텀 홀딩스",
  LULU: "룰루레몬 애슬레티카",
  LGN: "레전스",
  MCD: "맥도날드",
  MAIR: "매디슨 에어 솔루션스",
  MDLN: "메드라인",
  MOBI: "모비아 메디컬",
  MPWR: "모놀리식 파워 시스템즈",
  MSFT: "마이크로소프트",
  MRAM: "에버스핀 테크놀로지스",
  MRVL: "마벨 테크놀로지",
  NAD: "누빈 퀄리티 뮤니시펄 인컴 펀드",
  NAVN: "나반",
  NEBX: "네뷸라 로보틱스",
  NET: "클라우드플레어",
  NOW: "서비스나우",
  NVDA: "엔비디아",
  NUVL: "누발렌트",
  O: "리얼티 인컴",
  ODTX: "오디세이 테라퓨틱스",
  OFRM: "원스 어폰 어 팜",
  OKLO: "오클로",
  ORBX: "오르빅스 에어로스페이스",
  OTH: "오프 더 훅 YS",
  PANW: "팔로알토 네트웍스",
  PCAR: "팩카",
  PBF: "PBF 에너지",
  PFG: "프린시펄 파이낸셜 그룹",
  PLMR: "팔로마 홀딩스",
  PLSR: "펄서 데이터 시스템즈",
  PPG: "PPG 인더스트리즈",
  PSX: "필립스 66",
  QCOM: "퀄컴",
  QNTM: "퀀티스 헬스",
  RDW: "레드와이어",
  REEMF: "레어 엘리먼트 리소시스",
  RMD: "레스메드",
  ROIV: "로이반트 사이언시스",
  RSKD: "리스크파이드",
  RVI: "로빈후드 벤처스 펀드 I",
  SARO: "스탠더드에어로",
  SBLK: "스타 벌크 캐리어스",
  SGP: "스파이글래스 파마",
  SIND: "신다",
  SCHW: "찰스 슈왑",
  SHCO: "소호 하우스",
  SHC: "소테라 헬스",
  SMR: "뉴스케일 파워",
  SLFY: "솔리파이 에너지",
  SLB: "SLB",
  SSMR: "선샤인 실버 마이닝 앤 리파이닝",
  SPTX: "시포트 테라퓨틱스",
  SPCX: "스페이스X",
  SPG: "사이먼 프로퍼티 그룹",
  SPGI: "S&P 글로벌",
  SRE: "셈프라",
  STX: "씨게이트 테크놀로지",
  TGT: "타깃",
  TSLA: "테슬라",
  TDG: "트랜스다임 그룹",
  TT: "트레인 테크놀로지스",
  TTD: "트레이드 데스크",
  TTWO: "테이크투 인터랙티브",
  TXN: "텍사스 인스트루먼츠",
  TXT: "텍스트론",
  URI: "유나이티드 렌털스",
  UTHR: "유나이티드 테라퓨틱스",
  VIDA: "비다 글로벌",
  VKI: "인베스코 어드밴티지 뮤니시펄 인컴 트러스트 II",
  VLTR: "볼테라 시스템즈",
  VRSK: "베리스크 애널리틱스",
  WDAY: "워크데이",
  WM: "웨이스트 매니지먼트",
  WLTH: "웰스프론트",
  WRB: "W.R. 버클리",
  XE: "엑스에너지",
  YUM: "얌! 브랜즈",
};

const sectorKo: Record<string, string> = {
  AAPL: "정보기술",
  ADBE: "정보기술",
  AMAT: "정보기술",
  AMD: "정보기술",
  AMKR: "정보기술",
  ANET: "정보기술",
  AVGO: "정보기술",
  COHR: "정보기술",
  CRWD: "정보기술",
  CRWV: "정보기술",
  DELL: "정보기술",
  DDOG: "정보기술",
  GLW: "정보기술",
  GOOGL: "커뮤니케이션",
  GOOG: "커뮤니케이션",
  INTU: "정보기술",
  KEYS: "정보기술",
  MPWR: "정보기술",
  MSFT: "정보기술",
  MRVL: "정보기술",
  NET: "정보기술",
  NVDA: "정보기술",
  PANW: "정보기술",
  QCOM: "정보기술",
  STX: "정보기술",
  TXN: "정보기술",
  WDAY: "정보기술",
  AMZN: "소비재",
  AZO: "소비재",
  COST: "소비재",
  CVNA: "소비재",
  DASH: "소비재",
  LULU: "소비재",
  MCD: "소비재",
  TGT: "소비재",
  TSLA: "소비재",
  YUM: "소비재",
  AEP: "유틸리티",
  CMS: "유틸리티",
  ED: "유틸리티",
  EIX: "유틸리티",
  EVRG: "유틸리티",
  SRE: "유틸리티",
  CCL: "경기소비재",
  ABNB: "경기소비재",
  AFL: "금융",
  AON: "금융",
  BX: "금융",
  CME: "금융",
  COF: "금융",
  JPM: "금융",
  SCHW: "금융",
  WRB: "금융",
  BXP: "부동산",
  CPT: "부동산",
  O: "부동산",
  SPG: "부동산",
  AMGN: "헬스케어",
  CRL: "헬스케어",
  DVA: "헬스케어",
  GILD: "헬스케어",
  IDXX: "헬스케어",
  RMD: "헬스케어",
  UTHR: "헬스케어",
  CVX: "에너지",
  EOG: "에너지",
  FANG: "에너지",
  HAL: "에너지",
  PBF: "에너지",
  PSX: "에너지",
  SLB: "에너지",
  BALL: "소재",
  IP: "소재",
  PPG: "소재",
  CHRW: "산업재",
  FIX: "산업재",
  JBHT: "산업재",
  PCAR: "산업재",
  SARO: "산업재",
  TDG: "산업재",
  TT: "산업재",
  TXT: "산업재",
  URI: "산업재",
};

const companyName = (ticker: string, fallback: string) =>
  companyKo[ticker] ?? fallback.replace(/&amp;/g, "&").replace(/\s+(INC|CORP|CO|LTD|PLC)\.?$/i, "");
const coverageLabel = (ticker: string) =>
  majorUniverseTickers.has(ticker.toUpperCase()) ? "Mega/Large" : "Russell 2000";
const coverageMatches = (ticker: string, coverage: CoverageFilter) => {
  if (coverage === "all") return true;
  const isMajor = majorUniverseTickers.has(ticker.toUpperCase());
  return coverage === "major" ? isMajor : !isMajor;
};
const coverageName = (coverage: CoverageFilter) =>
  coverage === "major" ? "S&P500 · NASDAQ100" : coverage === "russell" ? "Russell 2000" : "전체";
const inferSector = (ticker: string, company: string, fallback?: string) => {
  if (fallback) return fallback;
  if (sectorKo[ticker]) return sectorKo[ticker];
  const name = company.toLowerCase();
  if (/bank|banc|financial|capital|insurance|asset|fund|trust|reit/.test(name)) return "금융/리츠";
  if (/therapeutics|health|bio|medical|pharma|science|laborator/.test(name)) return "헬스케어";
  if (/energy|oil|gas|power|natural|resources|mining|water/.test(name)) return "에너지/자원";
  if (/tech|software|semiconductor|cloud|data|systems|micro|logic/.test(name)) return "정보기술";
  if (/aero|aviation|carrier|maritime|industrial|transport|solutions/.test(name)) return "산업재";
  if (/market|retail|restaurant|consumer|apparel|house|living/.test(name)) return "소비재";
  return "기타";
};
const normalizeTx = (txType: string): TxFilter | string =>
  txType.includes("매수") ? "매수" : txType.includes("매도") ? "매도" : txType;
const daysBetween = (to: string, from: string) =>
  Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);

const eventImportanceScore = (trade: Pick<NormalizedTrade, "value" | "role" | "clusterCount" | "ownChangePct" | "txType">) => {
  const tx = normalizeTx(trade.txType);
  let score = tx === "매수" ? 45 : 32;
  if (/CEO|CFO|COO/i.test(trade.role)) score += 12;
  if (trade.clusterCount >= 2) score += 15;
  if (trade.value >= 10_000_000) score += 18;
  if (Math.abs(trade.ownChangePct) >= 10 && Math.abs(trade.ownChangePct) <= 1000) score += 10;
  return Math.min(99, score);
};
const nextFilingSort = (sort: FilingSort): FilingSort =>
  sort === "default" ? "latest" : sort === "latest" ? "oldest" : "default";
const filingSortLabel = (sort: FilingSort) =>
  sort === "latest" ? "신고일 ↓" : sort === "oldest" ? "신고일 ↑" : "신고일";
const filingDelayLabel = (trade: Pick<NormalizedTrade, "filedDate" | "txDate">) => {
  const delay = daysBetween(trade.filedDate, trade.txDate);
  if (delay < 0) return "일자 확인";
  if (delay === 0) return "당일 신고";
  return `거래 후 ${delay}일 신고`;
};
const transactionLabel = (trade: Pick<NormalizedTrade, "txType">) =>
  normalizeTx(trade.txType) === "매수" ? "공시 매수" : "공시 매도";
const ownChangeLabel = (trade: Pick<NormalizedTrade, "ownChangePct">) => {
  if (!Number.isFinite(trade.ownChangePct)) return "-";
  if (Math.abs(trade.ownChangePct) > 1000) return "확인 필요";
  const prefix = trade.ownChangePct >= 0 ? "+" : "";
  return `${prefix}${trade.ownChangePct.toFixed(1)}%`;
};
const ownChangeClass = (trade: Pick<NormalizedTrade, "ownChangePct">) => {
  if (!Number.isFinite(trade.ownChangePct) || Math.abs(trade.ownChangePct) > 1000) return "text-warning";
  return trade.ownChangePct >= 0 ? "text-positive" : "text-negative";
};

function ThemeButton({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  return (
    <div className="inline-flex h-9 items-center rounded-full border border-border bg-card p-0.5 shadow-sm">
      <button
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          theme === "light" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={() => setTheme("light")}
        title="라이트 모드"
      >
        <Sun size={15} />
      </button>
      <button
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          theme === "dark" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
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
      className={`h-9 rounded-lg px-3.5 text-[13px] font-semibold transition-colors ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
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
    <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`num mt-2 text-[23px] font-bold leading-none ${color}`}>{value}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

type NormalizedTrade = Omit<InsiderTrade, "txType"> & { txType: string };

function formatUpdateTime(_meta: InsiderMeta | null, _lockupMeta: LockupMeta | null) {
  return new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }) + " 기준";
}

function marketSnapshot(trades: InsiderTrade[], lockups: LockupEvent[]) {
  const normalized = trades.map((trade) => ({ ...trade, txType: normalizeTx(trade.txType) }));
  const latestFiling = [...normalized].sort((a, b) => b.filedDate.localeCompare(a.filedDate))[0]?.filedDate ?? "";
  const rows7d = latestFiling
    ? normalized.filter((trade) => daysBetween(latestFiling, trade.filedDate) <= 7)
    : normalized;
  const rows30d = latestFiling
    ? normalized.filter((trade) => daysBetween(latestFiling, trade.filedDate) <= 30)
    : normalized;
  const rareInsider = rows30d.filter((trade) => trade.txType === "매수" || trade.clusterCount >= 2);
  const sectorCount = new Map<string, number>();
  for (const trade of rows30d) {
    const sector = inferSector(trade.ticker, trade.company, trade.sector);
    sectorCount.set(sector, (sectorCount.get(sector) ?? 0) + 1);
  }
  const topSector = [...sectorCount.entries()].sort((a, b) => b[1] - a[1])[0];
  const watchlist = [...normalized]
    .sort((a, b) => {
      const aScore = a.value * (a.clusterCount >= 2 ? 1.3 : 1);
      const bScore = b.value * (b.clusterCount >= 2 ? 1.3 : 1);
      return bScore - aScore;
    })
    .slice(0, 4);

  return {
    latestFiling,
    rows7d,
    rows30d,
    rareInsider,
    lockupSoon: lockups.filter((event) => dDay(event.lockupDate) <= 30 && dDay(event.lockupDate) >= 0).length,
    topSector: topSector ? `${topSector[0]} ${topSector[1]}건` : "-",
    watchlist,
  };
}

function SummaryBar({
  trades,
  lockups,
  meta,
  lockupMeta,
}: {
  trades: InsiderTrade[];
  lockups: LockupEvent[];
  meta: InsiderMeta | null;
  lockupMeta: LockupMeta | null;
}) {
  const snapshot = useMemo(() => marketSnapshot(trades, lockups), [trades, lockups]);
  const trackedCompanies = new Set(trades.map((trade) => trade.ticker)).size;
  const items: Array<{ label: string; value: string; sub: string; tone?: "up" | "down" | "warn" }> = [
    { label: "Tracked Companies", value: `${trackedCompanies}종목`, sub: "대형주 + Russell 2000 확장" },
    { label: "Latest Filing", value: snapshot.latestFiling ? snapshot.latestFiling.slice(5) : "-", sub: "최근 감지된 Form 4" },
    { label: "7D Event Count", value: `${snapshot.rows7d.length}건`, sub: "최근 7일 기준" },
    { label: "Rare Insider Activity", value: `${snapshot.rareInsider.length}건`, sub: "30일 내부자 매수·클러스터", tone: "warn" as const },
    { label: "Event Density", value: snapshot.topSector, sub: "30일 섹터 공시 밀도" },
    { label: "Coverage", value: "Multi Index", sub: `업데이트 ${formatUpdateTime(meta, lockupMeta)}` },
  ];

  return (
    <section className="grid gap-3 rounded-xl border border-border bg-card/90 p-3 shadow-sm md:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border/70 bg-background px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{item.label}</p>
          <p
            className={`num mt-1 text-[18px] font-extrabold ${
              item.tone === "up" ? "text-positive" : item.tone === "down" ? "text-negative" : item.tone === "warn" ? "text-warning" : ""
            }`}
          >
            {item.value}
          </p>
          <p className="mt-1 truncate text-[10.5px] text-muted-foreground">{item.sub}</p>
        </div>
      ))}
    </section>
  );
}

function SectorSummary({ rows }: { rows: NormalizedTrade[] }) {
  const sectorRows = useMemo(() => {
    const bucket = new Map<
      string,
      { sector: string; buy: number; sell: number; count: number; tickers: Set<string> }
    >();

    for (const trade of rows) {
      const sector = inferSector(trade.ticker, trade.company, trade.sector);
      const current = bucket.get(sector) ?? {
        sector,
        buy: 0,
        sell: 0,
        count: 0,
        tickers: new Set<string>(),
      };
      if (trade.txType === "매수") current.buy += trade.value;
      if (trade.txType === "매도") current.sell += trade.value;
      current.count += 1;
      current.tickers.add(trade.ticker);
      bucket.set(sector, current);
    }

    return [...bucket.values()]
      .map((row) => ({
        ...row,
        companies: row.tickers.size,
        net: row.buy - row.sell,
        total: row.buy + row.sell,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 7);
  }, [rows]);

  const topCompanies = useMemo(() => {
    const bucket = new Map<string, { ticker: string; company: string; buy: number; sell: number; total: number }>();
    for (const trade of rows) {
      const current = bucket.get(trade.ticker) ?? {
        ticker: trade.ticker,
        company: companyName(trade.ticker, trade.company),
        buy: 0,
        sell: 0,
        total: 0,
      };
      if (trade.txType === "매수") current.buy += trade.value;
      if (trade.txType === "매도") current.sell += trade.value;
      current.total += trade.value;
      bucket.set(trade.ticker, current);
    }
    return [...bucket.values()].sort((a, b) => b.total - a.total).slice(0, 5);
  }, [rows]);

  const maxBar = Math.max(1, ...sectorRows.flatMap((row) => [row.buy, row.sell]));

  return (
    <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-extrabold">Sector Filing Activity</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">현재 필터 기준 공시 이벤트 밀도</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 bg-positive" /> Insider Buy
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 bg-negative" /> Insider Sell
            </span>
          </div>
        </div>
        <div className="grid gap-3">
          {sectorRows.map((row) => (
            <div key={row.sector} className="grid gap-1.5">
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <span className="font-bold">{row.sector}</span>
                <span className="num text-[11px] text-muted-foreground">
                  {row.companies}종목 · 이벤트 {row.count}건
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-positive"
                    style={{ width: `${Math.max(2, (row.buy / maxBar) * 100)}%` }}
                  />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-negative"
                    style={{ width: `${Math.max(2, (row.sell / maxBar) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {sectorRows.length === 0 && (
            <div className="py-6 text-center text-[12px] font-semibold text-muted-foreground">
              표시할 섹터 요약이 없습니다.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-[14px] font-extrabold">Top Event Importance</h3>
        <div className="mt-3 grid gap-2">
          {topCompanies.map((row, index) => (
            <div
              key={row.ticker}
              className="grid grid-cols-[1.4rem_1fr_auto] items-center gap-2 border-b border-border/70 pb-2 last:border-0 last:pb-0"
            >
              <span className="num text-[11px] font-bold text-muted-foreground">{index + 1}</span>
              <div className="min-w-0">
                <div className="num text-[12px] font-extrabold">{row.ticker}</div>
                <div className="truncate text-[11px] text-muted-foreground">{row.company}</div>
              </div>
              <div className="text-right">
                <div className="num text-[12px] font-bold">{fmtUSD(row.total / 1e6, 1)}M</div>
                <div className="num text-[10px] text-muted-foreground">
                  B {fmtUSD(row.buy / 1e6, 0)}M / S {fmtUSD(row.sell / 1e6, 0)}M
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export interface InsiderMeta {
  filedDate: string;
  generatedAt: string;
  filingsScanned?: number;
  dateRange?: {
    from: string;
    to: string;
  } | null;
}

function InsiderTab({ trades, meta }: { trades: InsiderTrade[]; meta: InsiderMeta | null }) {
  const [filter, setFilter] = useState<TxFilter>("전체");
  const [period, setPeriod] = useState<PeriodFilter>("30D");
  const [coverage, setCoverage] = useState<CoverageFilter>("major");
  const [query, setQuery] = useState("");
  const [filingSort, setFilingSort] = useState<FilingSort>("default");
  const normalized = useMemo(
    () => trades.map((trade) => ({ ...trade, txType: normalizeTx(trade.txType) })),
    [trades]
  );
  const latestFiling = useMemo(
    () => [...normalized].sort((a, b) => b.filedDate.localeCompare(a.filedDate))[0]?.filedDate ?? "",
    [normalized]
  );
  const periodCounts = useMemo(() => {
    const covered = normalized.filter((trade) => coverageMatches(trade.ticker, coverage));
    const counts: Record<PeriodFilter, number> = { "7D": 0, "30D": 0, "90D": 0, "전체": covered.length };
    if (!latestFiling) return counts;
    for (const trade of covered) {
      const age = daysBetween(latestFiling, trade.filedDate);
      if (age <= 7) counts["7D"] += 1;
      if (age <= 30) counts["30D"] += 1;
      if (age <= 90) counts["90D"] += 1;
    }
    return counts;
  }, [coverage, latestFiling, normalized]);
  const coverageCounts = useMemo(
    () => ({
      major: normalized.filter((trade) => coverageMatches(trade.ticker, "major")).length,
      russell: normalized.filter((trade) => coverageMatches(trade.ticker, "russell")).length,
      all: normalized.length,
    }),
    [normalized]
  );
  const rows = useMemo(
    () => {
      const q = query.trim().toLowerCase();
      return normalized
        .filter((trade) => coverageMatches(trade.ticker, coverage))
        .filter((trade) => filter === "전체" || trade.txType === filter)
        .filter((trade) => {
          if (period === "전체" || !latestFiling) return true;
          const maxDays = period === "7D" ? 7 : period === "30D" ? 30 : 90;
          return daysBetween(latestFiling, trade.filedDate) <= maxDays;
        })
        .filter((trade) => {
          if (!q) return true;
          const koName = companyName(trade.ticker, trade.company);
          const sector = inferSector(trade.ticker, trade.company, trade.sector);
          return [trade.ticker, trade.company, koName, sector, trade.filer, trade.role, trade.txType]
            .join(" ")
            .toLowerCase()
            .includes(q);
        })
        .sort((a, b) => {
          if (filingSort === "latest") return b.filedDate.localeCompare(a.filedDate) || b.value - a.value;
          if (filingSort === "oldest") return a.filedDate.localeCompare(b.filedDate) || b.value - a.value;
          return b.value - a.value;
        });
    },
    [coverage, filingSort, filter, latestFiling, normalized, period, query]
  );
  const buyValue = rows
    .filter((trade) => trade.txType === "매수")
    .reduce((sum, trade) => sum + trade.value, 0);
  const sellValue = rows
    .filter((trade) => trade.txType === "매도")
    .reduce((sum, trade) => sum + trade.value, 0);
  const clusterCompanies = new Set(
    rows.filter((trade) => trade.clusterCount >= 2).map((trade) => trade.ticker)
  ).size;
  const rangeLabel = meta?.dateRange ? `${meta.dateRange.from} ~ ${meta.dateRange.to}` : "2026년 누적";
  const subLabel = `${coverageName(coverage)} · ${period === "전체" ? rangeLabel : `최근 ${period}`}`;

  return (
    <div>
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-bold text-muted-foreground shadow-sm">
        <CheckCircle2 size={13} className={meta ? "text-positive" : "text-warning"} />
        {meta
          ? `SEC EDGAR 실데이터 · ${meta.filedDate} 신고 ${trades.length}건 · 수집 ${meta.generatedAt.slice(0, 16).replace("T", " ")} UTC`
          : "샘플 데이터 · 파이프라인 연결 전"}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Rare Insider Event" value={`${rows.filter((trade) => trade.txType === "매수" || trade.clusterCount >= 2).length}건`} sub={subLabel} tone="warn" />
        <Stat label="Insider Buy Value" value={fmtUSD(buyValue / 1e6, 1) + "M"} sub="희소 매수 이벤트 금액" tone="up" />
        <Stat label="Insider Sell Value" value={fmtUSD(sellValue / 1e6, 1) + "M"} sub="대형주 매도 신고 금액" tone="down" />
        <Stat label="Cluster Companies" value={`${clusterCompanies}종목`} sub="동일 방향 2인 이상 신고" />
        <Stat
          label="Latest Filing Signals"
          value={`${rows.length}건`}
          sub={meta?.filingsScanned ? `${coverageName(coverage)} · filing ${meta.filingsScanned}건 스캔` : `${coverageName(coverage)} 중심`}
        />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Coverage</p>
            <p className="text-[12px] text-muted-foreground">
              대형주는 기본 레이더, Russell 2000은 Small Cap Insider Radar로 분리해서 봅니다.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">
            현재 {coverageName(coverage)} · {rows.length}건
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {([
            ["major", "Mega/Large"],
            ["russell", "Russell 2000"],
            ["all", "전체"],
          ] as const).map(([option, label]) => (
            <button
              key={option}
              onClick={() => setCoverage(option)}
              className={`h-9 rounded-lg px-3 text-[12px] font-bold transition-colors ${
                coverage === option
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {label}
              <span className="num ml-1 text-[10px] opacity-70">{coverageCounts[option]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-3 shadow-sm lg:grid-cols-[1fr_auto]">
        <label className="flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3">
          <Search size={15} className="text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="티커, 기업명, 신고인 검색"
            className="h-full min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="flex flex-wrap gap-1">
          {(["전체", "매수", "매도"] as const).map((option) => (
            <Pill key={option} active={filter === option} onClick={() => setFilter(option)}>
              {option}
            </Pill>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
        {(["7D", "30D", "90D", "전체"] as const).map((option) => (
          <button
            key={option}
            onClick={() => setPeriod(option)}
            className={`h-9 px-3 text-[12px] font-bold transition-colors ${
              period === option
                ? "rounded-lg bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {option === "전체" ? "전체 기록" : option}
            <span className="num ml-1 text-[10px] opacity-70">{periodCounts[option] ?? 0}</span>
          </button>
        ))}
      </div>

      <SectorSummary rows={rows} />

      <div className="mt-3 grid gap-2 md:hidden">
        {rows.slice(0, 40).map((trade) => {
          const score = eventImportanceScore(trade);
          return (
            <article key={trade.id} className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="num text-[15px] font-extrabold">{trade.ticker}</span>
                    <span
                      className={`px-2 py-1 text-[10px] font-extrabold ${
                        trade.txType === "매수" ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
                      }`}
                    >
                      {transactionLabel(trade)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[12px] font-semibold text-muted-foreground">
                    {companyName(trade.ticker, trade.company)}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {coverageLabel(trade.ticker)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="num text-[16px] font-extrabold">{score}</p>
                  <p className="text-[10px] font-bold text-muted-foreground">Importance</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg border border-border/70 bg-background p-2">
                  <p className="text-muted-foreground">거래대금</p>
                  <p className="num mt-1 font-extrabold">{fmtUSD(trade.value / 1e6, 2)}M</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background p-2">
                  <p className="text-muted-foreground">직접보유 변동</p>
                  <p className={`num mt-1 font-extrabold ${ownChangeClass(trade)}`}>
                    {ownChangeLabel(trade)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                <span className="truncate">{trade.filer} · {trade.role}</span>
                <span className="num shrink-0">{trade.txDate} → {trade.filedDate}</span>
              </div>
              <div className="mt-2 text-[10.5px] font-semibold text-muted-foreground">{filingDelayLabel(trade)}</div>
            </article>
          );
        })}
      </div>
      {rows.length === 0 && (
        <div className="mt-3 rounded-xl border border-border bg-card px-4 py-10 text-center text-[13px] font-semibold text-muted-foreground shadow-sm">
          추적 중인 {coverageName(coverage)} 범위에서 최근 조건에 맞는 희소 내부자 이벤트가 감지되지 않았습니다.
          <br />
          내부자 거래는 원래 자주 발생하지 않으므로 30D 또는 90D 범위로 넓혀 확인하세요.
        </div>
      )}

      <div className="mt-3 hidden overflow-x-auto rounded-xl border border-border bg-card shadow-sm md:block">
        <table className="w-full min-w-[1460px] text-[12.5px]">
          <thead>
            <tr className="border-b border-border bg-secondary/80 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="w-[76px] px-3 py-2 font-semibold">
                <button
                  type="button"
                  onClick={() => setFilingSort((current) => nextFilingSort(current))}
                  className="inline-flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground"
                  title="클릭: 최신순 → 오래된순 → 기본순"
                >
                  {filingSortLabel(filingSort)}
                </button>
              </th>
              <th className="w-[76px] px-3 py-2 font-semibold">거래일</th>
              <th className="w-[190px] px-3 py-2 font-semibold">종목</th>
              <th className="w-[110px] px-3 py-2 font-semibold">Coverage</th>
              <th className="w-[280px] px-3 py-2 font-semibold">신고인</th>
              <th className="w-[92px] px-3 py-2 text-center font-semibold">구분</th>
              <th className="w-[128px] px-3 py-2 font-semibold">신고상태</th>
              <th className="w-[118px] px-3 py-2 text-right font-semibold">수량</th>
              <th className="w-[96px] px-3 py-2 text-right font-semibold">단가</th>
              <th className="w-[128px] px-3 py-2 text-right font-semibold">거래대금</th>
              <th className="w-[124px] px-3 py-2 text-right font-semibold">직접보유 변동</th>
              <th className="w-[128px] px-3 py-2 text-right font-semibold">Importance</th>
              <th className="w-[110px] px-3 py-2 font-semibold">신호</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((trade) => (
              <tr key={trade.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/60">
                <td className="num whitespace-nowrap px-3 py-2.5 text-muted-foreground">{trade.filedDate.slice(5)}</td>
                <td className="num whitespace-nowrap px-3 py-2.5 text-muted-foreground">{trade.txDate.slice(5)}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <div className="num text-[13px] font-extrabold">{trade.ticker}</div>
                  <div className="text-[11px] text-muted-foreground">{companyName(trade.ticker, trade.company)}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <span
                    className={`inline-flex h-6 items-center rounded-full px-2 text-[10px] font-extrabold ${
                      coverageLabel(trade.ticker) === "Russell 2000"
                        ? "bg-warning/10 text-warning"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {coverageLabel(trade.ticker)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <div className="font-semibold">{trade.filer}</div>
                  <div className="text-[11px] text-muted-foreground">{trade.role}</div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={`inline-flex h-6 min-w-[64px] items-center justify-center whitespace-nowrap px-2 text-[11px] font-bold ${
                      trade.txType === "매수" ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
                    }`}
                  >
                    {transactionLabel(trade)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-[11px] font-semibold text-muted-foreground">
                  {filingDelayLabel(trade)}
                </td>
                <td className="num px-3 py-2.5 text-right">{fmtNum(trade.shares)}</td>
                <td className="num px-3 py-2.5 text-right">{fmtUSD(trade.price, 2)}</td>
                <td className="num px-3 py-2.5 text-right font-semibold">{fmtUSD(trade.value / 1e6, 2)}M</td>
                <td
                  className={`num px-3 py-2.5 text-right font-semibold ${ownChangeClass(trade)}`}
                  title="SEC Form 4의 거래 후 직접 보유주식 기준 변동률입니다."
                >
                  {ownChangeLabel(trade)}
                </td>
                <td className="num px-3 py-2.5 text-right font-extrabold">{eventImportanceScore(trade)}</td>
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
    () =>
      [...events].sort((a, b) => {
        if (a.ticker === "SPCX") return -1;
        if (b.ticker === "SPCX") return 1;
        return dDay(a.lockupDate) - dDay(b.lockupDate);
      }),
    [events]
  );
  const spacexEvent = rows.find((event) => event.ticker === "SPCX");
  const within30 = events.filter((event) => dDay(event.lockupDate) <= 30 && dDay(event.lockupDate) >= 0).length;
  const within14 = events.filter((event) => dDay(event.lockupDate) <= 14 && dDay(event.lockupDate) >= 0).length;
  const avgDays = events.length ? events.reduce((sum, event) => sum + event.lockupDays, 0) / events.length : 0;
  const longLockup = events.filter((event) => event.lockupDays > 180).length;

  return (
    <div>
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-bold text-muted-foreground shadow-sm">
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

      {spacexEvent && (
        <section className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">Most Watched IPO</p>
              <h3 className="mt-1 text-[18px] font-extrabold">SPCX · 스페이스X</h3>
              <p className="mt-1 text-[12px] leading-6 text-muted-foreground">
                현재 수집 데이터에는 대표 락업 해제일 1건이 잡혀 있습니다. 실제 IPO에서는 임직원, 초기 투자자, 전략 투자자,
                일부 물량 조건에 따라 여러 차례 단계적 락업 해제가 생길 수 있어 추가 공시 확인이 필요합니다.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center md:min-w-[360px]">
              <div className="rounded-lg border border-border bg-card px-3 py-2">
                <p className="text-[10px] font-bold text-muted-foreground">IPO</p>
                <p className="num mt-1 text-[12px] font-extrabold">{spacexEvent.ipoDate}</p>
              </div>
              <div className="rounded-lg border border-border bg-card px-3 py-2">
                <p className="text-[10px] font-bold text-muted-foreground">Lockup</p>
                <p className="num mt-1 text-[12px] font-extrabold">{spacexEvent.lockupDate}</p>
              </div>
              <div className="rounded-lg border border-border bg-card px-3 py-2">
                <p className="text-[10px] font-bold text-muted-foreground">D-Day</p>
                <p className="num mt-1 text-[12px] font-extrabold">
                  {dDay(spacexEvent.lockupDate) >= 0 ? `D-${dDay(spacexEvent.lockupDate)}` : "해제"}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="mt-4 grid gap-2.5">
        {rows.map((event) => {
          const dd = dDay(event.lockupDate);
          const urgent = dd <= 14 && dd >= 0;
          const featured = event.ticker === "SPCX";
          return (
            <div
              key={event.id}
              className={`grid grid-cols-1 gap-3 rounded-xl border px-4 py-3.5 shadow-sm md:grid-cols-[auto_1fr_auto_auto] md:items-center ${
                featured ? "border-primary/40 bg-primary/5" : urgent ? "border-warning/60 bg-warning/10" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-3 md:w-44">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold ${
                    featured ? "bg-primary text-primary-foreground" : urgent ? "bg-warning text-warning-foreground" : "bg-secondary text-foreground"
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

  const dashboardSnapshot = useMemo(
    () => marketSnapshot(insiderTrades, lockupEvents),
    [insiderTrades, lockupEvents]
  );

  return (
    <div className={theme}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-shell/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between xl:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
                <BarChart3 size={22} strokeWidth={2.3} />
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent-strong">
                  <span className="inline-block h-px w-3 bg-accent-strong" /> BMO VALUE TALKS
                </p>
                <h1 className="text-[26px] font-extrabold leading-none tracking-tight">BMO Signal Flow</h1>
                <p className="mt-1 flex items-center gap-1 text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
                  <Building2 size={11} /> S&P500 · NASDAQ100 · Russell 2000 SEC Event Radar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:justify-end">
              <a
                href="https://www.bvtmoneyflow.xyz/"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[12px] font-semibold text-muted-foreground shadow-sm hover:text-foreground"
              >
                Money Flow <ExternalLink size={13} />
              </a>
              <ThemeButton theme={theme} setTheme={setTheme} />
            </div>
          </div>
          <div className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-5 pb-3 xl:px-8">
            <Pill active={tab === "insider"} onClick={() => setTab("insider")}>
              희소 내부자 이벤트
            </Pill>
            <Pill active={tab === "lockup"} onClick={() => setTab("lockup")}>
              IPO 락업
            </Pill>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-5 py-6 xl:px-8">
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-end md:justify-between md:p-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">SEC Event Radar</p>
              <h2 className="mt-1 max-w-[760px] text-2xl font-extrabold tracking-tight md:text-[32px]">
                대형주와 Russell 2000 내부자거래 이벤트 레이더
              </h2>
              <p className="mt-2 max-w-[760px] text-[13px] leading-6 text-muted-foreground">
                BMO Signal Flow는 S&P500·NASDAQ100 대형주를 기본 레이더로 두고, Russell 2000 중소형주 내부자거래까지
                별도 필터로 확장해 추적합니다. 내부자 매매처럼 매일 발생하지 않는 희소 이벤트를 과장하지 않고,
                중요한 정보 흐름을 빠르게 확인하도록 설계했습니다.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
              <Search size={14} />
              업데이트 {formatUpdateTime(insiderMeta, lockupMeta)}
            </div>
          </div>

          <div className="grid gap-3">
            <SummaryBar
              trades={insiderTrades}
              lockups={lockupEvents}
              meta={insiderMeta}
              lockupMeta={lockupMeta}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="hidden rounded-xl border border-border bg-card p-4 shadow-sm lg:block lg:self-start lg:sticky lg:top-28">
              <p className="px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Navigation</p>
              <div className="mt-3 grid gap-1">
                <button
                  onClick={() => setTab("insider")}
                  className={`flex h-10 items-center justify-between rounded-lg px-3 text-left text-[12px] font-bold transition-colors ${
                    tab === "insider" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <span>Insider Events</span>
                  <Users size={14} />
                </button>
                <button
                  onClick={() => setTab("lockup")}
                  className={`flex h-10 items-center justify-between rounded-lg px-3 text-left text-[12px] font-bold transition-colors ${
                    tab === "lockup" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <span>IPO Lockup</span>
                  <CalendarClock size={14} />
                </button>
              </div>
              <div className="mt-5 rounded-lg border border-border bg-background p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Radar Status</p>
                <div className="mt-3 grid gap-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Latest</span>
                    <span className="num font-bold">{dashboardSnapshot.latestFiling ? dashboardSnapshot.latestFiling.slice(5) : "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">7D Events</span>
                    <span className="num font-bold">{dashboardSnapshot.rows7d.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lockup Soon</span>
                    <span className="num font-bold">{dashboardSnapshot.lockupSoon}</span>
                  </div>
                </div>
              </div>
            </aside>
            <div className="min-w-0">
              {tab === "insider" && <InsiderTab trades={insiderTrades} meta={insiderMeta} />}
              {tab === "lockup" && <LockupTab events={lockupEvents} meta={lockupMeta} />}
            </div>
          </div>

          <footer className="mt-12 border-t border-border pt-6">
            <section className="rounded-2xl border border-border bg-card p-6 text-[13px] leading-7 text-muted-foreground shadow-sm">
              <h2 className="mb-4 text-[22px] font-extrabold tracking-tight text-foreground">읽는 법</h2>
              <div className="mb-5 flex flex-wrap gap-x-6 gap-y-2 text-[12px] font-bold text-foreground">
                <span className="inline-flex items-center gap-2">
                  <i className="h-3 w-3 bg-positive" /> 초록 = 희소 내부자 매수 이벤트
                </span>
                <span className="inline-flex items-center gap-2">
                  <i className="h-3 w-3 bg-negative" /> 파랑 = 내부자 매도 공시
                </span>
              </div>
              <p>
                이 화면은 매일 많은 신호가 쏟아지는 대시보드가 아니라, 대형주와 Russell 2000 중소형주에서 드물게 발생하는
                SEC Form 4 내부자 거래 이벤트를 빠르게 포착하기 위한 레이더입니다.
              </p>
              <p className="mt-3">
                Event Importance는 공시 유형, 거래대금, 임원 참여 여부, 반복 신고, 지분 변동률을 함께 본 참고 점수입니다.
                주가 반응 데이터가 붙기 전까지는 투자 판단보다 이벤트 선별용으로 보는 편이 적합합니다.
              </p>
              <p className="mt-3">
                Sector Filing Activity는 자금 흐름이 아니라 공시 이벤트가 어느 섹터에 밀집되어 있는지 보여줍니다.
                특정 섹터가 강하게 보이더라도 아래 표에서 개별 기업의 신고인, 거래일, 공시 맥락을 확인하세요.
              </p>
              <p className="mt-3">
                IPO 락업은 상장 직후 제한되었던 주식의 매도 가능 시점을 추적합니다. 락업 해제는 잠재적 공급 증가 신호일 수
                있지만, 실제 매도 발생을 뜻하지는 않습니다.
              </p>
              <p className="mt-3">
                유의: 과거 신고와 공시 원문을 보기 쉽게 재가공한 화면이며 투자 권유가 아닙니다. 데이터: SEC EDGAR 공개
                공시 기반, {formatUpdateTime(insiderMeta, lockupMeta)} · 미국 장마감 후 자동 갱신.
              </p>
            </section>

            <div className="mt-8 flex flex-col gap-3 rounded-xl bg-foreground px-5 py-4 text-[12px] font-semibold text-background shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>
                  <b className="text-accent">BMO</b> Value Talks
                </span>
                <span>—</span>
                <a href="https://blog.naver.com/bmovaluetalks" className="hover:underline">
                  blog.naver.com/bmovaluetalks
                </a>
                <span>·</span>
                <a href="https://www.bvtmoneyflow.xyz/" className="hover:underline">
                  Money Flow
                </a>
                <span>·</span>
                <a href="https://www.sec.gov/edgar" className="hover:underline">
                  SEC EDGAR
                </a>
              </div>
              <span className="num">@BMOValueTalk</span>
            </div>

            <div className="flex items-start justify-center gap-2 px-4 py-4 text-center text-[11px] leading-relaxed text-muted-foreground">
              <ShieldAlert size={13} className="mt-0.5 shrink-0" />
              <span>본 사이트의 모든 수치는 정보 제공 목적이며 투자 판단의 참고용으로만 사용하세요.</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
