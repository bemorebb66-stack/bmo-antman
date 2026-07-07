// SEC EDGAR IPO 락업 해제 캘린더 수집기
// 사용법: node fetch_lockup.mjs [--max-candidates 40] [--months 9]
// 출력: pipeline/out/lockup.json + site/public/data/lockup.json
//
// 방법: 424B4(최종 증권신고서) 중 "lock-up period" 문구가 있는 최근 건을 full-text search로 찾고,
// 각 회사의 전체 424B4 신고 이력에서 "가장 이른" 424B4인 것만 채택한다(후속 유상증자 제외, 최초
// IPO만). 본문에서 락업 일수·공모가·총발행주식수·공모주식수를 정규식으로 추출한다.
// 현재가/시가총액 등 실시간 시세는 공식 무료 API가 아니라서 포함하지 않음(계획 문서 참고).

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UA = "SeohakRadar/0.1 (personal project; bemorebb66@gmail.com)";
const SEC = "https://www.sec.gov";

const args = process.argv.slice(2);
const argVal = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) : def;
};
const MAX_CANDIDATES = argVal("--max-candidates", 40);
const MONTHS = argVal("--months", 9);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, asText = true) {
  await sleep(130);
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Encoding": "gzip" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return asText ? res.text() : res.json();
}

function cleanText(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#146;|&#8217;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

async function searchCandidates() {
  const end = new Date();
  const start = new Date(end.getTime());
  start.setMonth(start.getMonth() - MONTHS);
  const fmt = (d) => d.toISOString().slice(0, 10);
  const url =
    `https://efts.sec.gov/LATEST/search-index?q=%22lock-up+period%22&forms=424B4` +
    `&dateRange=custom&startdt=${fmt(start)}&enddt=${fmt(end)}`;
  const json = await get(url, false);
  return (json.hits?.hits || []).map((h) => ({
    accession: h._source.adsh,
    cik: h._source.ciks[0].replace(/^0+/, ""),
    company: (h._source.display_names[0] || "").replace(/\s*\([A-Z.]+\)\s*\(CIK.*$/, "").trim(),
    ticker: (h._source.display_names[0].match(/\(([A-Z.]{1,6})\)/) || [])[1] || "",
    fileDate: h._source.file_date,
    fileId: h._id, // "accession:filename"
  }));
}

async function isFirstEver424B4(cik, accession) {
  const j = await get(`${SEC}/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=424B4&dateb=&owner=include&count=100&output=atom`);
  const dates = [...j.matchAll(/<filing-date>([\d-]+)<\/filing-date>/g)].map((m) => m[1]);
  const accessions = [...j.matchAll(/<accession-number>([\d-]+)<\/accession-number>/g)].map((m) => m[1]);
  if (accessions.length === 0) return true; // 조회 실패 시 통과시켜 개별 필터에 맡김
  // 날짜순 정렬 후 가장 이른 것과 비교
  const pairs = accessions.map((a, i) => ({ a, d: dates[i] })).sort((a, b) => a.d.localeCompare(b.d));
  return pairs[0]?.a === accession;
}

function parseLockup(text) {
  // "락업" 조항 표현이 회사마다 제각각이라(단순 "(the lock-up period)"부터 "the earlier of (A)...
  // (B) the date that is 180 days after..., or the Lock-Up Period"까지) "N days after the date of
  // this prospectus" 형태를 전부 찾은 뒤, 근처(±250자)에 "lock"이 있는 것만 락업 조항으로 인정한다.
  let lockupDays = null;
  for (const m of text.matchAll(/(\d{2,3})\s*days after the date of this prospectus/gi)) {
    const around = text.slice(Math.max(0, m.index - 250), m.index + 250).toLowerCase();
    if (around.includes("lock")) {
      lockupDays = Number(m[1]);
      break;
    }
  }
  if (!lockupDays) return null;

  const dateM = text.match(/Prospectus dated\s*&?#?\d*;?\s*([A-Z][a-z]+\s*&?#?\d*;?\s*\d{1,2}\s*,\s*\d{4})/);
  const prospectusDate = dateM ? dateM[1].replace(/&#\d+;/g, " ").replace(/\s+/g, " ").trim() : null;

  // 공모가: "public offering price"류 표현 근처 첫 "$숫자(.숫자)?" 값 (표지 가격표 기준)
  let ipoPrice = null;
  const priceCtxM = text.match(/public offering price[^$]{0,25}\$\s*([0-9]{1,4}(?:\.[0-9]{1,2})?)/i);
  if (priceCtxM) ipoPrice = Number(priceCtxM[1]);

  const bookRunnerM = text.match(/(?:Joint Book-Runners?|Book-Running Managers?)\s+([A-Z][A-Za-z.&, ]{2,40}?)(?:\s{2,}|\s+[A-Z][a-z]+ [A-Z])/);

  return {
    lockupDays,
    prospectusDate,
    ipoPrice,
    underwriter: bookRunnerM ? bookRunnerM[1].trim() : null,
  };
}

function toIsoDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}

async function main() {
  console.log(`1) EDGAR full-text search로 최근 ${MONTHS}개월 424B4 후보 조회...`);
  const candidates = await searchCandidates();
  console.log(`   후보 ${candidates.length}건 발견`);

  const seenCik = new Set();
  const events = [];
  let checked = 0;
  for (const c of candidates) {
    if (events.length >= MAX_CANDIDATES) break;
    if (!c.ticker || seenCik.has(c.cik)) continue;
    seenCik.add(c.cik);
    checked++;
    try {
      const isIpo = await isFirstEver424B4(c.cik, c.accession);
      if (!isIpo) {
        console.log(`   스킵 (후속 유상증자로 판단): ${c.ticker} ${c.company}`);
        continue;
      }
      const [accNoDash, fileName] = c.fileId.split(":");
      const cikPath = c.cik;
      const html = await get(`${SEC}/Archives/edgar/data/${cikPath}/${accNoDash.replace(/-/g, "")}/${fileName}`);
      const text = cleanText(html);
      const parsed = parseLockup(text);
      if (!parsed || !parsed.lockupDays || !parsed.ipoPrice) {
        console.log(`   스킵 (파싱 실패): ${c.ticker} ${c.company}`);
        continue;
      }
      const ipoDate = toIsoDate(parsed.prospectusDate) || c.fileDate;
      const lockupDate = new Date(new Date(ipoDate).getTime() + parsed.lockupDays * 86400000)
        .toISOString()
        .slice(0, 10);

      events.push({
        id: `lk-${c.accession}`,
        ticker: c.ticker,
        company: c.company,
        ipoDate,
        ipoPrice: parsed.ipoPrice,
        lockupDate,
        lockupDays: parsed.lockupDays,
        underwriter: parsed.underwriter,
      });
      console.log(`   [${events.length}] ${c.ticker} ${c.company} — 락업 ${parsed.lockupDays}일, 해제일 ${lockupDate}`);
    } catch (e) {
      console.log(`   실패 (${c.ticker || c.cik}): ${e.message}`);
    }
  }

  events.sort((a, b) => a.lockupDate.localeCompare(b.lockupDate));

  const out = {
    meta: {
      source: "SEC EDGAR full-text search + 424B4 prospectus 본문 파싱",
      generatedAt: new Date().toISOString(),
      candidatesChecked: checked,
      note: "락업일수·공모가만 SEC 원문에서 추출. 발행주식수(유통물량 비율)·현재가·시총 등은 미포함(발행구조가 회사마다 달라 정규식으로 신뢰성 있게 추출 불가 / 실시간 시세는 별도 유료·무료 API 연동 필요).",
    },
    events,
  };

  const outPath = join(__dirname, "out", "lockup.json");
  const sitePath = join(__dirname, "..", "site", "public", "data", "lockup.json");
  mkdirSync(dirname(outPath), { recursive: true });
  mkdirSync(dirname(sitePath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  writeFileSync(sitePath, JSON.stringify(out));
  console.log(`\n완료: ${events.length}건 수집 (후보 ${checked}건 확인) → out/lockup.json, site/public/data/lockup.json`);
}

main().catch((e) => {
  console.error("실패:", e.message);
  process.exit(1);
});
