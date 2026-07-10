// ⚠️ 프로토타입용 샘플 데이터입니다. 내부자 매매·IPO 락업 항목은 실제 SEC 공시와 무관한 가상의 예시이며,
// 서학개미 항목은 실제 종목이지만 수치는 가상입니다. 실서비스는 SEC EDGAR / 예탁결제원 데이터로 대체됩니다.

// ── 1. 미국 내부자 매매 (Form 4) ─────────────────────────────
export type InsiderRole = "CEO" | "CFO" | "이사" | "10%대주주" | "COO";
export type TxType = "매수" | "매도" | "옵션행사";

export interface InsiderTrade {
  id: string;
  ticker: string;
  company: string;
  sector?: string;
  filer: string;
  role: string;
  txType: TxType;
  shares: number;
  price: number;
  value: number; // USD
  filedDate: string;
  txDate: string;
  ownAfter: number; // 거래 후 보유주식수
  ownChangePct: number; // 보유지분 변동률
  clusterCount: number; // 같은 회사, 최근 7일 내 동일 방향 매매 인원 수
  secUrl?: string; // SEC 원문 URL
}

export const INSIDER_TRADES: InsiderTrade[] = [
  { id: "i01", ticker: "NEBX", company: "Nebula Robotics Inc.", sector: "로보틱스", filer: "J. Callahan", role: "CEO", txType: "매수", shares: 42000, price: 18.4, value: 772800, filedDate: "2026-07-06", txDate: "2026-07-03", ownAfter: 1284000, ownChangePct: 3.4, clusterCount: 3 },
  { id: "i02", ticker: "NEBX", company: "Nebula Robotics Inc.", sector: "로보틱스", filer: "M. Alvarez", role: "CFO", txType: "매수", shares: 15000, price: 18.6, value: 279000, filedDate: "2026-07-06", txDate: "2026-07-03", ownAfter: 210000, ownChangePct: 7.7, clusterCount: 3 },
  { id: "i03", ticker: "NEBX", company: "Nebula Robotics Inc.", sector: "로보틱스", filer: "R. Kim", role: "이사", txType: "매수", shares: 8000, price: 18.7, value: 149600, filedDate: "2026-07-05", txDate: "2026-07-02", ownAfter: 96000, ownChangePct: 9.1, clusterCount: 3 },
  { id: "i04", ticker: "SLFY", company: "Solify Energy Corp.", sector: "신재생에너지", filer: "T. Grant", role: "CEO", txType: "매도", shares: 120000, price: 42.1, value: 5052000, filedDate: "2026-07-06", txDate: "2026-07-02", ownAfter: 890000, ownChangePct: -11.9, clusterCount: 2 },
  { id: "i05", ticker: "SLFY", company: "Solify Energy Corp.", sector: "신재생에너지", filer: "D. Nakamura", role: "10%대주주", txType: "매도", shares: 300000, price: 41.8, value: 12540000, filedDate: "2026-07-04", txDate: "2026-07-01", ownAfter: 4100000, ownChangePct: -6.8, clusterCount: 2 },
  { id: "i06", ticker: "QNTM", company: "Quantis Health Inc.", sector: "헬스케어", filer: "S. Park", role: "COO", txType: "매수", shares: 6000, price: 9.2, value: 55200, filedDate: "2026-07-03", txDate: "2026-06-30", ownAfter: 61000, ownChangePct: 10.9, clusterCount: 1 },
  { id: "i07", ticker: "VLTR", company: "Voltera Systems", sector: "반도체장비", filer: "H. Weiss", role: "이사", txType: "매도", shares: 25000, price: 76.4, value: 1910000, filedDate: "2026-07-02", txDate: "2026-06-29", ownAfter: 140000, ownChangePct: -15.2, clusterCount: 1 },
  { id: "i08", ticker: "BRKF", company: "Brookford Materials", sector: "소재", filer: "L. Chen", role: "CFO", txType: "매수", shares: 18000, price: 31.2, value: 561600, filedDate: "2026-06-30", txDate: "2026-06-26", ownAfter: 88000, ownChangePct: 25.7, clusterCount: 2 },
  { id: "i09", ticker: "BRKF", company: "Brookford Materials", sector: "소재", filer: "A. Novak", role: "CEO", txType: "매수", shares: 40000, price: 30.9, value: 1236000, filedDate: "2026-06-29", txDate: "2026-06-25", ownAfter: 620000, ownChangePct: 6.9, clusterCount: 2 },
  { id: "i10", ticker: "ORBX", company: "Orbix Aerospace", sector: "우주항공", filer: "P. Dubois", role: "10%대주주", txType: "매도", shares: 500000, price: 54.6, value: 27300000, filedDate: "2026-06-27", txDate: "2026-06-23", ownAfter: 3200000, ownChangePct: -13.5, clusterCount: 1 },
];

// ── 2. 미국 IPO 락업 해제 캘린더 ─────────────────────────────
export interface LockupEvent {
  id: string;
  ticker: string;
  company: string;
  ipoDate: string;
  ipoPrice: number;
  lockupDate: string;
  lockupDays: number;
  underwriter: string | null;
}

// 실데이터 로드 전 폴백용 샘플(가상의 예시).
export const LOCKUP_EVENTS: LockupEvent[] = [
  { id: "l00", ticker: "SPCX", company: "SPACE EXPLORATION TECHNOLOGIES CORP", ipoDate: "2026-06-12", ipoPrice: 135, lockupDate: "2027-06-13", lockupDays: 366, underwriter: null },
  { id: "l01", ticker: "FYNL", company: "Fynleap Technologies", ipoDate: "2026-01-14", ipoPrice: 22, lockupDate: "2026-07-13", lockupDays: 180, underwriter: "Goldman / Morgan Stanley" },
  { id: "l02", ticker: "HRZN", company: "Horizon Biosciences", ipoDate: "2026-02-05", ipoPrice: 16, lockupDate: "2026-08-04", lockupDays: 180, underwriter: "JPMorgan" },
  { id: "l03", ticker: "PLSR", company: "Pulsar Data Systems", ipoDate: "2026-01-28", ipoPrice: 28, lockupDate: "2026-07-27", lockupDays: 180, underwriter: "Goldman Sachs" },
];

// ── 3. 서학개미 순매수·보관금액 대시보드 ─────────────────────
export interface HoldingRow {
  ticker: string;
  company: string;
  custodyUSD: number; // 백만달러, 예탁결제원 집계 기준(가상)
  custodyChangePct: number; // 전주 대비
  weeklyNetBuyUSD: number; // 백만달러, 이번주 순매수(음수면 순매도)
  rank: number;
  prevRank: number;
}

export const HOLDINGS: HoldingRow[] = [
  { ticker: "TSLA", company: "테슬라", custodyUSD: 12840, custodyChangePct: 2.1, weeklyNetBuyUSD: 184, rank: 1, prevRank: 1 },
  { ticker: "NVDA", company: "엔비디아", custodyUSD: 9720, custodyChangePct: 4.6, weeklyNetBuyUSD: 312, rank: 2, prevRank: 2 },
  { ticker: "SOXL", company: "디렉시온 반도체 3배", custodyUSD: 3980, custodyChangePct: -3.2, weeklyNetBuyUSD: -96, rank: 3, prevRank: 4 },
  { ticker: "PLTR", company: "팔란티어", custodyUSD: 3510, custodyChangePct: 6.8, weeklyNetBuyUSD: 158, rank: 4, prevRank: 6 },
  { ticker: "AAPL", company: "애플", custodyUSD: 3240, custodyChangePct: -0.4, weeklyNetBuyUSD: -22, rank: 5, prevRank: 3 },
  { ticker: "TQQQ", company: "프로셰어스 나스닥 3배", custodyUSD: 2870, custodyChangePct: 1.2, weeklyNetBuyUSD: 41, rank: 6, prevRank: 5 },
  { ticker: "MSFT", company: "마이크로소프트", custodyUSD: 2410, custodyChangePct: 0.9, weeklyNetBuyUSD: 18, rank: 7, prevRank: 7 },
  { ticker: "COIN", company: "코인베이스", custodyUSD: 1980, custodyChangePct: 9.4, weeklyNetBuyUSD: 143, rank: 8, prevRank: 12 },
  { ticker: "AVGO", company: "브로드컴", custodyUSD: 1740, custodyChangePct: 3.1, weeklyNetBuyUSD: 52, rank: 9, prevRank: 9 },
  { ticker: "MSTR", company: "마이크로스트래티지", custodyUSD: 1620, custodyChangePct: -6.1, weeklyNetBuyUSD: -74, rank: 10, prevRank: 8 },
];

export const BASE_DATE = new Date();
BASE_DATE.setHours(0, 0, 0, 0);
export function dDay(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - BASE_DATE.getTime()) / 86400000);
}
