import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarClock,
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
const moneyFlowTickerUrl = (ticker: string) =>
  `https://www.bvtmoneyflow.xyz/?ticker=${encodeURIComponent(ticker)}`;

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
  majorUniverseTickers.has(ticker.toUpperCase()) ? "S&P/Nasdaq" : "Russell 2000";
const coverageMatches = (ticker: string, coverage: CoverageFilter) => {
  if (coverage === "all") return true;
  const isMajor = majorUniverseTickers.has(ticker.toUpperCase());
  return coverage === "major" ? isMajor : !isMajor;
};
const coverageName = (coverage: CoverageFilter) =>
  coverage === "major" ? "S&P500 · NASDAQ100" : coverage === "russell" ? "Russell 2000" : "전체";
function TickerMark({ ticker }: { ticker: string }) {
  const clean = ticker.replace(/[^A-Z0-9]/gi, "").slice(0, 2).toUpperCase();
  const isMajor = coverageMatches(ticker, "major");
  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-extrabold shadow-sm ${
        isMajor
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-warning/30 bg-warning/10 text-warning"
      }`}
      title={`${ticker} ${isMajor ? "S&P500 · NASDAQ100" : "Russell 2000"} logo badge`}
    >
      {clean}
    </span>
  );
}
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
const isValidFilingDateOrder = (trade: Pick<NormalizedTrade, "filedDate" | "txDate">) =>
  !trade.txDate || !trade.filedDate || daysBetween(trade.filedDate, trade.txDate) >= 0;
const secFilingUrl = (trade: Pick<NormalizedTrade, "id" | "secUrl">) => {
  if (trade.secUrl) return trade.secUrl;
  const accession = trade.id.replace(/^f4-/, "");
  return `https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(accession)}`;
};

const eventImportanceScore = (trade: Pick<NormalizedTrade, "value" | "role" | "clusterCount" | "ownChangePct" | "txType">) => {
  const tx = normalizeTx(trade.txType);
  let score = tx === "매수" ? 45 : 32;
  if (/CEO|CFO|COO/i.test(trade.role)) score += 12;
  if (trade.clusterCount >= 2) score += 15;
  if (trade.value >= 10_000_000) score += 18;
  if (Math.abs(trade.ownChangePct) >= 10 && Math.abs(trade.ownChangePct) <= 1000) score += 10;
  return Math.min(99, score);
};
const eventImportanceParts = (trade: Pick<NormalizedTrade, "value" | "role" | "clusterCount" | "ownChangePct" | "txType">) => {
  const parts = [normalizeTx(trade.txType) === "매수" ? "매수 기본 +45" : "매도 기본 +32"];
  if (/CEO|CFO|COO/i.test(trade.role)) parts.push("주요 임원 +12");
  if (trade.clusterCount >= 2) parts.push("클러스터 +15");
  if (trade.value >= 10_000_000) parts.push("거래대금 +18");
  if (Math.abs(trade.ownChangePct) >= 10 && Math.abs(trade.ownChangePct) <= 1000) parts.push("보유량 변화 +10");
  return parts.join(" · ");
};
const eventImportanceGrade = (score: number) => (score >= 75 ? "높음" : score >= 60 ? "주목" : "보통");
const nextFilingSort = (sort: FilingSort): FilingSort =>
  sort === "default" ? "latest" : sort === "latest" ? "oldest" : "default";
const filingSortLabel = (sort: FilingSort) =>
  sort === "latest" ? "SEC 공시일 ↓" : sort === "oldest" ? "SEC 공시일 ↑" : "SEC 공시일";
const filingDelayLabel = (trade: Pick<NormalizedTrade, "filedDate" | "txDate">) => {
  const delay = daysBetween(trade.filedDate, trade.txDate);
  if (delay < 0) return "일자 확인";
  if (delay === 0) return "당일 SEC 공시";
  return `거래 후 ${delay}일 SEC 공시`;
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
    <div className="inline-flex h-10 items-center rounded-full border border-border bg-card p-0.5 shadow-sm md:h-9">
      <button
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors md:h-8 md:w-8 ${
          theme === "light" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={() => setTheme("light")}
        title="라이트 모드"
      >
        <Sun size={15} />
      </button>
      <button
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors md:h-8 md:w-8 ${
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
      className={`h-8 shrink-0 rounded-md border px-3 text-[11.5px] font-bold transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground"
      }`}
    >
      {children}
    </button>
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
  const normalized = trades
    .map((trade) => ({ ...trade, txType: normalizeTx(trade.txType) }))
    .filter(isValidFilingDateOrder);
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
  tab,
  trades,
  lockups,
  meta,
}: {
  tab: Tab;
  trades: InsiderTrade[];
  lockups: LockupEvent[];
  meta: InsiderMeta | null;
}) {
  const snapshot = useMemo(() => marketSnapshot(trades, lockups), [trades, lockups]);
  const validTrades = useMemo(
    () => trades.map((trade) => ({ ...trade, txType: normalizeTx(trade.txType) })).filter(isValidFilingDateOrder),
    [trades]
  );
  const invalidDateCount = trades.length - validTrades.length;
  const trackedCompanies = new Set(validTrades.map((trade) => trade.ticker)).size;
  const screenDate = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  });
  const collectedAt = meta?.generatedAt ? meta.generatedAt.slice(0, 16).replace("T", " ") + " UTC" : "-";
  const within30 = lockups.filter((event) => dDay(event.lockupDate) <= 30 && dDay(event.lockupDate) >= 0).length;
  const within14 = lockups.filter((event) => dDay(event.lockupDate) <= 14 && dDay(event.lockupDate) >= 0).length;
  const avgDays = lockups.length ? lockups.reduce((sum, event) => sum + event.lockupDays, 0) / lockups.length : 0;
  const longLockup = lockups.filter((event) => event.lockupDays > 180).length;
  const items: Array<{ label: string; value: string; sub: string; tone?: "up" | "down" | "warn" }> = tab === "insider"
    ? [
        { label: "공시 발생 기업", value: `${trackedCompanies}개`, sub: `유효 공시 ${validTrades.length}건 기준` },
        { label: "최근 7일 신규 공시", value: `${snapshot.rows7d.length}건`, sub: "전체 공시 범위" },
        { label: "30일 희소 내부자거래", value: `${snapshot.rareInsider.length}건`, sub: "매수 또는 클러스터 기준", tone: "warn" },
        { label: "최신 유효 공시", value: snapshot.latestFiling ? snapshot.latestFiling.replace(/-/g, ".") : "-", sub: `수집 ${collectedAt}` },
      ]
    : [
        { label: "14일 내 락업 해제", value: `${within14}건`, sub: "매도 압력 사전 확인", tone: "warn" },
        { label: "30일 내 락업 해제", value: `${within30}건`, sub: "유통물량 확대 가능" },
        { label: "평균 락업 기간", value: `${avgDays.toFixed(0)}일`, sub: "공모일 기준" },
        { label: "180일 초과 락업", value: `${longLockup}건`, sub: `전체 ${lockups.length}건 기준` },
      ];

  return (
    <section>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="min-h-[122px] min-w-0 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
            <p className="text-[13px] font-bold text-muted-foreground">{item.label}</p>
            <p
              className={`num mt-2 text-[30px] font-extrabold leading-none ${
                item.tone === "up" ? "text-positive" : item.tone === "down" ? "text-negative" : item.tone === "warn" ? "text-warning" : ""
              }`}
            >
              {item.value}
            </p>
            <p className="mt-2 line-clamp-2 text-[12px] leading-4 text-muted-foreground">{item.sub}</p>
          </div>
        ))}
      </div>
      {tab === "insider" && <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-semibold text-muted-foreground">
        <span className="rounded-full border border-border bg-card px-3 py-2">SEC EDGAR</span>
        <span className="rounded-full border border-border bg-card px-3 py-2">공시 {trades.length}건 수집</span>
        <span className="rounded-full border border-warning/40 bg-warning/10 px-3 py-2">날짜 이상치 {invalidDateCount}건 제외</span>
        <span className="rounded-full border border-positive/30 bg-positive/10 px-3 py-2 text-positive">유효 공시 {validTrades.length}건</span>
        <span className="rounded-full border border-border bg-card px-3 py-2">화면 {screenDate}</span>
      </div>}
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

function InsiderTab({ trades, meta, initialTicker = "" }: { trades: InsiderTrade[]; meta: InsiderMeta | null; initialTicker?: string }) {
  const [filter, setFilter] = useState<TxFilter>("전체");
  const [period, setPeriod] = useState<PeriodFilter>("30D");
  const [coverage, setCoverage] = useState<CoverageFilter>(() => initialTicker ? "all" : "major");
  const [query, setQuery] = useState(initialTicker);
  const [filingSort, setFilingSort] = useState<FilingSort>("default");
  const [selectedTrade, setSelectedTrade] = useState<NormalizedTrade | null>(null);
  const allNormalized = useMemo(
    () => trades.map((trade) => ({ ...trade, txType: normalizeTx(trade.txType) })),
    [trades]
  );
  const invalidDateCount = useMemo(
    () => allNormalized.filter((trade) => !isValidFilingDateOrder(trade)).length,
    [allNormalized]
  );
  const normalized = useMemo(
    () => allNormalized.filter(isValidFilingDateOrder),
    [allNormalized]
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
  const buyCount = rows.filter((trade) => trade.txType === "매수").length;
  const sellCount = rows.filter((trade) => trade.txType === "매도").length;
  const clusterCompanies = new Set(
    rows.filter((trade) => trade.clusterCount >= 2).map((trade) => trade.ticker)
  ).size;
  const rangeLabel = meta?.dateRange ? `${meta.dateRange.from} ~ ${meta.dateRange.to}` : "2026년 누적";
  const subLabel = `${coverageName(coverage)} · ${period === "전체" ? rangeLabel : `최근 ${period}`}`;

  return (
    <div>
      <div className="grid gap-3 text-[12px] sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-h-[104px] rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="font-bold text-muted-foreground">현재 필터 결과</p>
          <p className="num mt-1 text-lg font-extrabold">{rows.length}건</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{subLabel}</p>
        </div>
        <div className="min-h-[104px] rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="font-bold text-muted-foreground">매수</p>
          <p className={`num mt-1 text-lg font-extrabold ${buyCount > 0 ? "text-positive" : "text-muted-foreground"}`}>
            {buyCount}건
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {buyValue > 0 ? `${fmtUSD(buyValue / 1e6, 1)}M` : "희소 매수 없음"}
          </p>
        </div>
        <div className="min-h-[104px] rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="font-bold text-muted-foreground">매도</p>
          <p className="num mt-1 text-lg font-extrabold text-negative">{sellCount}건</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Form 4 공시 기준</p>
        </div>
        <div className="min-h-[104px] rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="font-bold text-muted-foreground">클러스터 발생 종목</p>
          <p className="num mt-1 text-lg font-extrabold">{clusterCompanies}종목</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {invalidDateCount > 0 ? `일자 이상치 ${invalidDateCount}건 제외` : "일자 검증 통과"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">공시 범위</p>
            <p className="text-[12px] text-muted-foreground">
              버튼의 숫자는 기업 수가 아니라 유효 공시 기록 수입니다. 대형주와 Russell 2000을 분리해서 봅니다.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">
            현재 {coverageName(coverage)} · {rows.length}건
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {([
            ["major", "S&P500 · NASDAQ100"],
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
              <span className="num ml-1 text-[10px] opacity-70">{coverageCounts[option]}건</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-3 shadow-sm lg:grid-cols-[1fr_auto]">
        <label className="flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
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
          {(query || filter !== "전체" || period !== "30D" || coverage !== "major") && (
            <button
              onClick={() => { setQuery(""); setFilter("전체"); setPeriod("30D"); setCoverage("major"); }}
              className="h-8 rounded-md border border-border bg-card px-3 text-[11.5px] font-bold text-muted-foreground hover:border-primary hover:text-foreground"
            >
              필터 초기화
            </button>
          )}
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
            <article
              key={trade.id}
              onClick={() => setSelectedTrade(trade)}
              className="cursor-pointer rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-secondary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <TickerMark ticker={trade.ticker} />
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
                  <p className="text-[10px] font-bold text-muted-foreground">
                    {eventImportanceGrade(score)}
                  </p>
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
          추적 중인 {coverageName(coverage)} 범위에서 최근 조건에 맞는 희소 내부자거래가 감지되지 않았습니다.
          <br />
          내부자 거래는 원래 자주 발생하지 않으므로 30D 또는 90D 범위로 넓혀 확인하세요.
        </div>
      )}

      <div className="mt-3 hidden overflow-x-auto rounded-xl border border-border bg-card shadow-sm md:block">
        <table className="w-full min-w-[1120px] text-[12.5px]">
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
              <th className="w-[88px] px-3 py-2 font-semibold">실제 거래일</th>
              <th className="w-[190px] px-3 py-2 font-semibold">종목</th>
              <th className="w-[280px] px-3 py-2 font-semibold">신고인</th>
              <th className="w-[92px] px-3 py-2 text-center font-semibold">구분</th>
              <th className="w-[128px] px-3 py-2 text-right font-semibold">거래대금</th>
              <th className="w-[124px] px-3 py-2 text-right font-semibold">직접보유 변동</th>
              <th className="w-[128px] px-3 py-2 text-right font-semibold">Importance</th>
              <th className="w-[110px] px-3 py-2 font-semibold">신호</th>
              <th className="w-[88px] px-3 py-2 text-center font-semibold">원문</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((trade) => {
              const score = eventImportanceScore(trade);
              return (
              <tr
                key={trade.id}
                onClick={() => setSelectedTrade(trade)}
                className="cursor-pointer border-b border-border/70 last:border-0 hover:bg-secondary/60"
              >
                <td className="num whitespace-nowrap px-3 py-2.5 text-muted-foreground">{trade.filedDate.slice(5)}</td>
                <td className="num whitespace-nowrap px-3 py-2.5 text-muted-foreground">{trade.txDate.slice(5)}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <TickerMark ticker={trade.ticker} />
                    <div>
                      <div className="num text-[13px] font-extrabold">{trade.ticker}</div>
                      <div className="text-[11px] text-muted-foreground">{companyName(trade.ticker, trade.company)}</div>
                    </div>
                  </div>
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
                <td className="num px-3 py-2.5 text-right font-semibold">{fmtUSD(trade.value / 1e6, 2)}M</td>
                <td
                  className={`num px-3 py-2.5 text-right font-semibold ${ownChangeClass(trade)}`}
                  title="SEC Form 4의 거래 후 직접 보유주식 기준 변동률입니다."
                >
                  {ownChangeLabel(trade)}
                </td>
                <td
                  className="num px-3 py-2.5 text-right font-extrabold"
                  title={eventImportanceParts(trade)}
                >
                  {score} · {eventImportanceGrade(score)}
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
                <td className="px-3 py-2.5 text-center">
                  <a
                    href={secFilingUrl(trade)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex h-7 items-center justify-center rounded-md border border-border px-2 text-[11px] font-bold text-muted-foreground hover:text-foreground"
                  >
                    SEC
                  </a>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selectedTrade && (
        <div className="fixed inset-0 z-50 bg-background/70 p-4 backdrop-blur-sm" onClick={() => setSelectedTrade(null)}>
          <section
            className="ml-auto flex h-full max-w-[520px] flex-col overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <TickerMark ticker={selectedTrade.ticker} />
                <div>
                  <p className="num text-[13px] font-bold text-primary">{selectedTrade.ticker}</p>
                  <h3 className="text-xl font-extrabold">{companyName(selectedTrade.ticker, selectedTrade.company)}</h3>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {coverageLabel(selectedTrade.ticker)} · {inferSector(selectedTrade.ticker, selectedTrade.company, selectedTrade.sector)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrade(null)}
                className="rounded-lg border border-border px-3 py-1 text-[12px] font-bold text-muted-foreground hover:text-foreground"
              >
                닫기
              </button>
            </div>

            <div className="mt-4 grid gap-3 text-[13px]">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="font-extrabold">{selectedTrade.filer}</p>
                <p className="mt-1 text-muted-foreground">{selectedTrade.role}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <p className="text-muted-foreground">실제 거래일</p>
                    <p className="num font-bold">{selectedTrade.txDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">SEC 공시일</p>
                    <p className="num font-bold">{selectedTrade.filedDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">공시 상태</p>
                    <p className="font-bold">{filingDelayLabel(selectedTrade)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">거래 코드</p>
                    <p className="font-bold">{selectedTrade.txType === "매수" ? "P · 공개시장 매수" : "S · 공개시장 매도"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-[11px] font-bold text-muted-foreground">수량</p>
                  <p className="num mt-1 text-lg font-extrabold">{fmtNum(selectedTrade.shares)}주</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-[11px] font-bold text-muted-foreground">평균 단가</p>
                  <p className="num mt-1 text-lg font-extrabold">{fmtUSD(selectedTrade.price, 2)}</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-[11px] font-bold text-muted-foreground">거래대금</p>
                  <p className="num mt-1 text-lg font-extrabold">{fmtUSD(selectedTrade.value / 1e6, 2)}M</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-[11px] font-bold text-muted-foreground">거래 후 보유량</p>
                  <p className="num mt-1 text-lg font-extrabold">{fmtNum(selectedTrade.ownAfter)}주</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground">Event Importance</p>
                    <p className="num mt-1 text-xl font-extrabold">
                      {eventImportanceScore(selectedTrade)} · {eventImportanceGrade(eventImportanceScore(selectedTrade))}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${selectedTrade.txType === "매수" ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"}`}>
                    {transactionLabel(selectedTrade)}
                  </span>
                </div>
                <p className="mt-3 text-[12px] leading-6 text-muted-foreground">{eventImportanceParts(selectedTrade)}</p>
              </div>

              <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-[12px] leading-6 text-muted-foreground">
                <p className="font-bold text-foreground">10b5-1 계획 및 직접/간접 보유</p>
                <p className="mt-1">
                  현재 요약 데이터에는 10b5-1 계획 여부와 직접/간접 보유 구분이 별도 필드로 저장되어 있지 않습니다.
                  SEC 원문에서 각주와 보유 형태를 확인해야 합니다.
                </p>
              </div>

              <a
                href={moneyFlowTickerUrl(selectedTrade.ticker)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-primary px-4 text-[13px] font-extrabold text-primary"
              >
                Money Flow에서 거래대금 확인
              </a>

              <a
                href={secFilingUrl(selectedTrade)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-[13px] font-extrabold text-primary-foreground"
              >
                SEC 원문 검색
              </a>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export interface LockupMeta {
  generatedAt: string;
  candidatesChecked?: number;
}

function LockupTab({ events, meta, initialTicker = "" }: { events: LockupEvent[]; meta: LockupMeta | null; initialTicker?: string }) {
  const rows = useMemo(
    () =>
      [...events]
        .filter((event) => !initialTicker || event.ticker.toUpperCase() === initialTicker.toUpperCase())
        .sort((a, b) => {
        if (a.ticker === "SPCX") return -1;
        if (b.ticker === "SPCX") return 1;
        return dDay(a.lockupDate) - dDay(b.lockupDate);
      }),
    [events, initialTicker]
  );
  const spacexEvent = rows.find((event) => event.ticker === "SPCX");

  return (
    <div>
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-bold text-muted-foreground shadow-sm">
        <CalendarClock size={13} className={meta ? "text-positive" : "text-warning"} />
        {meta
          ? `SEC EDGAR 실데이터 · 424B4 증권신고서 ${events.length}건 · 수집 ${meta.generatedAt.slice(0, 16).replace("T", " ")} UTC`
          : "샘플 데이터 · 파이프라인 연결 전"}
      </div>

      {spacexEvent && (
        <section className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm">
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
                <a
                  href={moneyFlowTickerUrl(event.ticker)}
                  className="mt-1 inline-flex text-[11px] font-bold text-primary hover:underline"
                >
                  거래대금 보기
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const initialTicker = (params.get("ticker") ?? "").trim().toUpperCase();
  const [tab, setTab] = useState<Tab>(() =>
    window.location.pathname.includes("ipo-lockup") || params.get("tab") === "lockup" ? "lockup" : "insider"
  );
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return new URLSearchParams(window.location.search).get("theme") === "dark" ? "dark" : "light";
  });
  const [insiderTrades, setInsiderTrades] = useState<InsiderTrade[]>(INSIDER_TRADES);
  const [insiderMeta, setInsiderMeta] = useState<InsiderMeta | null>(null);
  const [lockupEvents, setLockupEvents] = useState<LockupEvent[]>(LOCKUP_EVENTS);
  const [lockupMeta, setLockupMeta] = useState<LockupMeta | null>(null);
  const changeTab = (next: Tab) => {
    setTab(next);
    const tickerQuery = initialTicker ? `?ticker=${encodeURIComponent(initialTicker)}` : "";
    window.history.replaceState(null, "", `${next === "lockup" ? "/ipo-lockup/" : "/insider/"}${tickerQuery}`);
  };

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
        <header className="sticky top-0 z-40 border-b-2 border-foreground/70 bg-shell/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1280px] items-end justify-between gap-3 px-4 pb-3 pt-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent-strong">
                  <span className="inline-block h-px w-3 bg-accent-strong" /> BMO VALUE TALKS
                </p>
                <h1 className="truncate font-serif text-[32px] font-bold leading-tight sm:text-[42px]">
                  Money <span className="italic text-accent-strong">Flow</span>
                </h1>
                <p className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">
                  미국 주식 거래대금·내부자 거래·IPO 락업 분석
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 md:justify-end">
              <ThemeButton theme={theme} setTheme={setTheme} />
            </div>
          </div>
          <nav aria-label="BMO Value Talks 서비스" className="mx-auto flex max-w-[1280px] gap-1.5 overflow-x-auto px-4 pb-3 md:px-6">
            <a
              href="/"
              className="inline-flex h-8 shrink-0 items-center rounded-md border border-border bg-card px-3 text-[11.5px] font-bold text-muted-foreground hover:border-primary hover:text-foreground"
            >
              시장 흐름
            </a>
            <Pill active={tab === "insider"} onClick={() => changeTab("insider")}>
              내부자 거래
            </Pill>
            <Pill active={tab === "lockup"} onClick={() => changeTab("lockup")}> 
              IPO 락업
            </Pill>
            <a href="/today.html" className="inline-flex h-8 shrink-0 items-center rounded-md border border-border bg-card px-3 text-[11.5px] font-bold text-muted-foreground hover:border-primary hover:text-foreground">오늘의 요약</a>
          </nav>
        </header>

        <main className="mx-auto max-w-[1280px] px-4 py-5 md:px-6 md:py-7">
          <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{tab === "insider" ? "INSIDER TRADING" : "IPO LOCKUP"}</p>
              <h2 className="mt-1 max-w-[760px] font-serif text-[24px] font-bold leading-tight md:text-[30px]">
                {tab === "insider" ? "내부자 거래" : "IPO 락업"}
              </h2>
              <p className="mt-1 max-w-[760px] text-[12.5px] leading-5 text-muted-foreground">
                {tab === "insider"
                  ? "미국 상장기업 임원과 주요 주주의 내부자 거래를 확인합니다."
                  : "미국 상장기업의 보호예수 해제 일정과 잠재 공급 이벤트를 확인합니다."}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
              기준일 · <b className="font-semibold text-foreground">{formatUpdateTime(insiderMeta, lockupMeta)}</b>
            </div>
          </div>

          <div className="grid gap-3">
            <SummaryBar
              tab={tab}
              trades={insiderTrades}
              lockups={lockupEvents}
              meta={insiderMeta}
            />
          </div>

          <div className="mt-4 min-w-0">
            {tab === "insider" && <InsiderTab trades={insiderTrades} meta={insiderMeta} initialTicker={initialTicker} />}
            {tab === "lockup" && <LockupTab events={lockupEvents} meta={lockupMeta} initialTicker={initialTicker} />}
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
                Event Importance는 공시 유형, 거래대금, 임원 참여 여부, 반복 공시, 지분 변동률을 함께 본 참고 점수입니다.
                주가 반응 데이터가 붙기 전까지는 투자 판단보다 이벤트 선별용으로 보는 편이 적합합니다.
              </p>
              <p className="mt-3">
                Sector Filing Activity는 자금 흐름이 아니라 공시 이벤트가 어느 섹터에 밀집되어 있는지 보여줍니다.
                특정 섹터가 강하게 보이더라도 아래 표에서 개별 기업의 신고인, 실제 거래일, SEC 공시일, 공시 맥락을 확인하세요.
              </p>
              <p className="mt-3">
                IPO 락업은 상장 직후 제한되었던 주식의 매도 가능 시점을 추적합니다. 락업 해제는 잠재적 공급 증가 신호일 수
                있지만, 실제 매도 발생을 뜻하지는 않습니다.
              </p>
              <p className="mt-3">
                유의: 과거 공시와 공시 원문을 보기 쉽게 재가공한 화면이며 투자 권유가 아닙니다. 데이터: SEC EDGAR 공개
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
