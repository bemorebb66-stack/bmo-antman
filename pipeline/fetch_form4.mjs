// SEC EDGAR Form 4 (내부자 매매) 수집기
// 사용법:
//   node fetch_form4.mjs [--max-rows 40] [--max-filings 150]
//   node fetch_form4.mjs --from 2026-01-01 --to 2026-07-31 --universe major --max-rows 1500 --max-filings-per-day 500
// 출력: pipeline/out/insider.json + site/public/data/insider.json
//
// SEC 요구사항: User-Agent에 연락처 명시, 초당 10요청 이하 (여기선 요청당 130ms 대기)

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
const argStr = (name, def = "") => {
  const i = args.indexOf(name);
  return i >= 0 ? String(args[i + 1]) : def;
};
const FROM_DATE = argStr("--from");
const TO_DATE = argStr("--to");
const UNIVERSE = argStr("--universe", "all"); // all | major(S&P 500 + Nasdaq 100)
const QUIET = args.includes("--quiet");
const RANGE_MODE = Boolean(FROM_DATE || TO_DATE);
const MAX_ROWS = argVal("--max-rows", RANGE_MODE ? 1500 : 40);
const MAX_FILINGS = argVal("--max-filings", 150);
const MAX_FILINGS_PER_DAY = argVal("--max-filings-per-day", RANGE_MODE ? 120 : MAX_FILINGS);
const MAX_ROWS_PER_MONTH = argVal("--max-rows-per-month", RANGE_MODE ? 120 : MAX_ROWS);
const MAX_DAYS_PER_MONTH = argVal("--max-days-per-month", RANGE_MODE ? 8 : 999);
const MAX_ROWS_PER_INDEX_DAY = argVal(
  "--max-rows-per-index-day",
  RANGE_MODE ? Math.max(1, Math.ceil(MAX_ROWS_PER_MONTH / MAX_DAYS_PER_MONTH)) : MAX_ROWS
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, asText = true) {
  await sleep(130);
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Encoding": "gzip" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return asText ? res.text() : res.json();
}

const normTicker = (ticker) => ticker.toUpperCase().replace(/\./g, "-").trim();
const normCik = (cik) => String(Number(cik));

async function fetchWikiTickers(url) {
  const html = await get(url);
  const tickers = new Set();
  for (const match of html.matchAll(/(?:www\.(?:nyse|nasdaq)\.com|markets\.cboe\.com)[^>]*>\s*([A-Z][A-Z0-9.]{0,7})\s*<\/a>/g)) {
    const ticker = normTicker(match[1]);
    if (/^[A-Z][A-Z0-9-]{0,7}$/.test(ticker)) tickers.add(ticker);
  }
  return tickers;
}

async function loadMajorUniverse() {
  if (!QUIET) console.log("0) S&P 500 + Nasdaq 100 유니버스 로드...");
  const [sp500, ndx, companyTickers] = await Promise.all([
    fetchWikiTickers("https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"),
    fetchWikiTickers("https://en.wikipedia.org/wiki/Nasdaq-100"),
    get("https://www.sec.gov/files/company_tickers.json", false),
  ]);
  const tickers = new Set([...sp500, ...ndx]);
  const cikByTicker = new Map();
  for (const item of Object.values(companyTickers)) {
    cikByTicker.set(normTicker(item.ticker), normCik(item.cik_str));
  }
  const ciks = new Set();
  for (const ticker of tickers) {
    const cik = cikByTicker.get(ticker);
    if (cik) ciks.add(cik);
  }
  if (tickers.size === 0 || ciks.size === 0) {
    throw new Error("지수 구성 티커를 불러오지 못함");
  }
  if (!QUIET) console.log(`   티커 ${tickers.size}개, SEC CIK 매핑 ${ciks.size}개`);
  return { name: "S&P 500 + Nasdaq 100", tickers, ciks };
}

function qtr(d) {
  return Math.floor(d.getUTCMonth() / 3) + 1;
}
function ymd(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

// 최근 영업일의 form index를 찾을 때까지 하루씩 거슬러 올라감
async function findDailyIndex() {
  const d = new Date();
  for (let back = 0; back < 8; back++) {
    const day = new Date(d.getTime() - back * 86400000);
    const dow = day.getUTCDay();
    if (dow === 0 || dow === 6) continue; // 주말
    const url = `${SEC}/Archives/edgar/daily-index/${day.getUTCFullYear()}/QTR${qtr(day)}/form.${ymd(day)}.idx`;
    try {
      const text = await get(url);
      return { date: day.toISOString().slice(0, 10), text };
    } catch {
      /* 휴장일/아직 미생성 → 하루 더 뒤로 */
    }
  }
  throw new Error("최근 8일 내 daily form index를 찾지 못함");
}

async function getDailyIndexForDate(dateStr) {
  const day = new Date(`${dateStr}T00:00:00Z`);
  const dow = day.getUTCDay();
  if (dow === 0 || dow === 6) return null;
  const url = `${SEC}/Archives/edgar/daily-index/${day.getUTCFullYear()}/QTR${qtr(day)}/form.${ymd(day)}.idx`;
  try {
    const text = await get(url);
    return { date: day.toISOString().slice(0, 10), text };
  } catch {
    return null;
  }
}

function dateRange(from, to) {
  const out = [];
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

function spreadIndexDays(days) {
  if (!RANGE_MODE || days.length <= MAX_DAYS_PER_MONTH) return days;
  const byMonth = new Map();
  for (const day of days) {
    const key = day.date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key).push(day);
  }
  const selected = [];
  for (const monthDays of byMonth.values()) {
    monthDays.sort((a, b) => a.date.localeCompare(b.date));
    if (monthDays.length <= MAX_DAYS_PER_MONTH) {
      selected.push(...monthDays);
      continue;
    }
    const picked = new Set();
    for (let i = 0; i < MAX_DAYS_PER_MONTH; i++) {
      const idx = Math.round((i * (monthDays.length - 1)) / (MAX_DAYS_PER_MONTH - 1));
      picked.add(idx);
    }
    selected.push(...[...picked].sort((a, b) => a - b).map((idx) => monthDays[idx]));
  }
  return selected.sort((a, b) => a.date.localeCompare(b.date));
}

function parseIdx(text) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => /^-{10,}/.test(l));
  const rows = [];
  for (const line of lines.slice(start + 1)) {
    // 고정폭: Form Type(12) Company Name(62) CIK(12) Date Filed(12) File Name
    const formType = line.slice(0, 12).trim();
    if (formType !== "4") continue;
    const company = line.slice(12, 74).trim();
    const cik = line.slice(74, 86).trim();
    const fileName = line.slice(98).trim();
    if (!fileName.endsWith(".txt")) continue;
    rows.push({ company, cik, fileName });
  }
  return rows;
}

const tag = (s, name) => {
  const m = s.match(new RegExp(`<${name}>\\s*([\\s\\S]*?)\\s*</${name}>`));
  return m ? m[1].trim() : "";
};
const tagVal = (s, name) => {
  const block = tag(s, name);
  return block ? tag(`<x>${block}</x>`, "value") || block.replace(/<[^>]+>/g, "").trim() : "";
};

function parseForm4(xml, filedDate) {
  const ticker = tag(xml, "issuerTradingSymbol").toUpperCase();
  const issuer = tag(xml, "issuerName");
  if (!ticker || ticker === "NONE" || ticker === "N/A") return null;

  // 신고인 이름 "LAST FIRST" → "First Last" 근사 변환
  const rawName = tag(xml, "rptOwnerName");
  const filer = rawName
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const officerTitle = tagVal(xml, "officerTitle");
  const isDir = tagVal(xml, "isDirector") === "1" || tagVal(xml, "isDirector") === "true";
  const isTen = tagVal(xml, "isTenPercentOwner") === "1" || tagVal(xml, "isTenPercentOwner") === "true";
  let role = "임원";
  const t = officerTitle.toLowerCase();
  if (/chief executive|(^|\W)ceo(\W|$)/.test(t)) role = "CEO";
  else if (/chief financial|(^|\W)cfo(\W|$)/.test(t)) role = "CFO";
  else if (/chief operating|(^|\W)coo(\W|$)/.test(t)) role = "COO";
  else if (/president/.test(t)) role = "President";
  else if (officerTitle) role = officerTitle.slice(0, 24);
  else if (isTen) role = "10%대주주";
  else if (isDir) role = "이사";

  // Form 4는 직접보유(D)·간접보유(I, 신탁 등) 라인이 별도로 잡히는 경우가 많아서,
  // "거래 전 보유주식수"는 라인별로 따로 계산한 뒤 방향(매수/매도)이 같은 라인끼리만 합산한다.
  // (전체 거래주식수는 다 더치고 보유주식수는 마지막 한 줄만 쓰면 지분변동률이 크게 왜곡됨)
  const txBlocks = xml.match(/<nonDerivativeTransaction>[\s\S]*?<\/nonDerivativeTransaction>/g) || [];
  let buyShares = 0, buyValue = 0, buyBefore = 0, buyAfter = 0;
  let sellShares = 0, sellValue = 0, sellBefore = 0, sellAfter = 0;
  let txDate = "";
  for (const b of txBlocks) {
    const code = tagVal(b, "transactionCode");
    if (code !== "P" && code !== "S") continue; // 공개시장 매수/매도만
    const shares = parseFloat(tagVal(b, "transactionShares")) || 0;
    const price = parseFloat(tagVal(b, "transactionPricePerShare")) || 0;
    if (shares <= 0 || price <= 0) continue;
    txDate = tagVal(b, "transactionDate") || txDate;
    const afterLine = parseFloat(tagVal(b, "sharesOwnedFollowingTransaction")) || 0;
    const beforeLine = code === "P" ? afterLine - shares : afterLine + shares;
    if (code === "P") {
      buyShares += shares; buyValue += shares * price;
      buyBefore += beforeLine; buyAfter += afterLine;
    } else {
      sellShares += shares; sellValue += shares * price;
      sellBefore += beforeLine; sellAfter += afterLine;
    }
  }

  const dir = buyValue >= sellValue ? "매수" : "매도";
  const shares = dir === "매수" ? buyShares : sellShares;
  const value = dir === "매수" ? buyValue : sellValue;
  if (shares <= 0 || value < 10000) return null; // $10k 미만 노이즈 컷
  if (txDate && txDate > filedDate) return null; // Form 4 신고일보다 뒤의 거래일은 파싱/인덱스 이상치로 제외

  const before = dir === "매수" ? buyBefore : sellBefore;
  const ownAfter = dir === "매수" ? buyAfter : sellAfter;
  const ownChangePct = before > 0 ? ((ownAfter - before) / before) * 100 : 0;

  return {
    ticker,
    company: issuer,
    filer,
    role,
    txType: dir,
    shares: Math.round(shares),
    price: +(value / shares).toFixed(2),
    value: Math.round(value),
    ownBefore: Math.round(before),
    filedDate,
    txDate,
    ownAfter: Math.round(ownAfter),
    ownChangePct: +ownChangePct.toFixed(1),
  };
}

async function main() {
  const universe = UNIVERSE === "major" ? await loadMajorUniverse() : null;
  const indexDays = [];
  if (RANGE_MODE) {
    const from = FROM_DATE || "2026-01-01";
    const to = TO_DATE || new Date().toISOString().slice(0, 10);
    if (!QUIET) console.log(`1) daily form index 기간 탐색... ${from} ~ ${to}`);
    for (const dateStr of dateRange(from, to)) {
      const found = await getDailyIndexForDate(dateStr);
      if (found) {
        indexDays.push(found);
        if (!QUIET) console.log(`   ${found.date} index 확인`);
      }
    }
  } else {
    if (!QUIET) console.log("1) 최근 daily form index 탐색...");
    indexDays.push(await findDailyIndex());
  }
  if (indexDays.length === 0) throw new Error("수집 가능한 daily form index를 찾지 못함");

  const daysToProcess = spreadIndexDays(indexDays);
  if (!QUIET && daysToProcess.length !== indexDays.length) {
    console.log(`   월별 균등 샘플링: ${indexDays.length}일 → ${daysToProcess.length}일 처리`);
  }

  const rows = [];
  const rowsByMonth = {};
  const rowsByDay = {};
  let processed = 0;
  let latestDate = indexDays[indexDays.length - 1].date;
  for (const { date, text } of daysToProcess) {
    if (rows.length >= MAX_ROWS) break;
    const monthKey = date.slice(0, 7);
    if ((rowsByMonth[monthKey] ?? 0) >= MAX_ROWS_PER_MONTH) continue;
    let filings = parseIdx(text);
    if (universe) {
      filings = filings.filter((filing) => universe.ciks.has(normCik(filing.cik)));
    }
    if (!QUIET) console.log(`   ${date} — Form 4 filing ${filings.length}건 발견`);

    // 인덱스가 회사명 알파벳순이므로 전체 구간에서 균등 샘플링
    let targets = filings;
    if (filings.length > MAX_FILINGS_PER_DAY) {
      const step = filings.length / MAX_FILINGS_PER_DAY;
      targets = Array.from({ length: MAX_FILINGS_PER_DAY }, (_, i) => filings[Math.floor(i * step)]);
    }

    for (const f of targets) {
      if (rows.length >= MAX_ROWS) break;
      if ((rowsByMonth[monthKey] ?? 0) >= MAX_ROWS_PER_MONTH) break;
      if ((rowsByDay[date] ?? 0) >= MAX_ROWS_PER_INDEX_DAY) break;
      processed++;
      try {
        const accession = f.fileName.split("/").pop().replace(".txt", "");
        const accNoDash = accession.replace(/-/g, "");
        const cikPath = f.fileName.split("/")[2];
        const idx = await get(`${SEC}/Archives/edgar/data/${cikPath}/${accNoDash}/index.json`, false);
        const xmlFile = (idx.directory?.item || []).find(
          (it) => /\.xml$/i.test(it.name) && !/^xsl/i.test(it.name)
        );
        if (!xmlFile) continue;
        const secUrl = `${SEC}/Archives/edgar/data/${cikPath}/${accNoDash}/${xmlFile.name}`;
        const xml = await get(secUrl);
        const row = parseForm4(xml, date);
        if (row) {
          row.id = `f4-${accession}`;
          row.secUrl = secUrl;
          rows.push(row);
          rowsByMonth[monthKey] = (rowsByMonth[monthKey] ?? 0) + 1;
          rowsByDay[date] = (rowsByDay[date] ?? 0) + 1;
          if (!QUIET) process.stdout.write(`   [${rows.length}/${MAX_ROWS}] ${row.ticker} ${row.txType} $${(row.value / 1e6).toFixed(2)}M (${row.filer})\n`);
        }
      } catch (e) {
        // 개별 filing 실패는 건너뜀
      }
    }
  }

  // 동일 종목·신고인·방향의 반복 신고는 1건으로 합산.
  // 보유주식수는 시점이 다른 여러 신고를 단순 합산하면 안 되므로, 가장 이른 거래의 ownBefore와
  // 가장 늦은 거래의 ownAfter를 이어붙여서 구간 전체의 순변동을 계산한다.
  const merged = new Map();
  for (const r of rows) {
    const k = `${r.ticker}|${r.filer}|${r.txType}`;
    const prev = merged.get(k);
    if (!prev) {
      merged.set(k, { ...r, _earliest: r.txDate, _latest: r.txDate });
    } else {
      const totShares = prev.shares + r.shares;
      prev.price = +((prev.value + r.value) / totShares).toFixed(2);
      prev.shares = totShares;
      prev.value += r.value;
      if (r.txDate && (!prev._earliest || r.txDate < prev._earliest)) {
        prev._earliest = r.txDate;
        prev.ownBefore = r.ownBefore;
      }
      if (r.txDate && (!prev._latest || r.txDate >= prev._latest)) {
        prev._latest = r.txDate;
        prev.ownAfter = r.ownAfter;
        prev.txDate = r.txDate;
      }
    }
  }
  rows.length = 0;
  for (const r of merged.values()) {
    r.ownChangePct = r.ownBefore > 0 ? +(((r.ownAfter - r.ownBefore) / r.ownBefore) * 100).toFixed(1) : 0;
    delete r._earliest;
    delete r._latest;
    rows.push(r);
  }

  // 클러스터 탐지: 같은 종목 + 같은 방향, 서로 다른 신고인 수
  const clusterKey = (r) => `${r.ticker}|${r.txType}`;
  const clusters = {};
  for (const r of rows) {
    clusters[clusterKey(r)] = clusters[clusterKey(r)] || new Set();
    clusters[clusterKey(r)].add(r.filer);
  }
  for (const r of rows) r.clusterCount = clusters[clusterKey(r)].size;

  rows.sort((a, b) => b.value - a.value);

  const out = {
    meta: {
      source: "SEC EDGAR daily form index + Form 4 XML",
      universe: universe?.name ?? "All SEC Form 4 issuers",
      universeSize: universe?.tickers.size ?? null,
      filedDate: latestDate,
      dateRange: RANGE_MODE ? { from: FROM_DATE || "2026-01-01", to: TO_DATE || new Date().toISOString().slice(0, 10) } : null,
      generatedAt: new Date().toISOString(),
      filingsScanned: processed,
      monthlyRowCap: RANGE_MODE ? MAX_ROWS_PER_MONTH : null,
      daysPerMonthCap: RANGE_MODE ? MAX_DAYS_PER_MONTH : null,
      rowsPerIndexDayCap: RANGE_MODE ? MAX_ROWS_PER_INDEX_DAY : null,
      note: "공개시장 매수(P)/매도(S)만 집계, $10k 미만 제외",
    },
    trades: rows,
  };

  const outPath = join(__dirname, "out", "insider.json");
  const sitePath = join(__dirname, "..", "site", "public", "data", "insider.json");
  mkdirSync(dirname(outPath), { recursive: true });
  mkdirSync(dirname(sitePath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  writeFileSync(sitePath, JSON.stringify(out));
  console.log(`\n완료: ${rows.length}건 수집 (filing ${processed}건 스캔) → out/insider.json, site/public/data/insider.json`);
}

main().catch((e) => {
  console.error("실패:", e.message);
  process.exit(1);
});
