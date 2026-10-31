// 자동 생성 — 직접 고치지 말 것. 공개판도구/ai_extract.py 가 개인용 서버(서버/Code.js)의 AI 부분을 옮겨 만듦.
// 아침 서재 공개판 AI 일꾼(웹 워커): 사용자 브라우저 안에서 사용자 자기 열쇠로 제미나이·클로드를 부름. 열쇠는 이 기기에만.
// ───────── 구글 앱스 스크립트 흉내(이 일꾼 안에서만) ─────────
// 개인용 서버의 AI 코드를 고치지 않고 그대로 돌리려고, 그 코드가 쓰는 구글 서버 도구를 브라우저 것으로 바꿔 둡니다.
// 웹 워커 안이라 「기다렸다 받기」(동기 요청)를 써도 화면이 멈추지 않습니다.
let KEYS_ = {}, PROPS_ = {}, OUTPROPS_ = {}, GW_ = "", DEV_ = "";
const SHARED_ = () => KEYS_.geminiKey === "__SHARED__";   // 열쇠 없이 「함께 쓰는 무료 AI」 — 제미나이 요청을 공개 창구로 보내 창구의 열쇠로 부름
const userProps_ = {
  getProperty: k => (k in KEYS_ ? KEYS_[k] : (k in PROPS_ ? PROPS_[k] : null)),
  setProperty: (k, v) => { PROPS_[k] = String(v); OUTPROPS_[k] = String(v); return userProps_; },
  deleteProperty: k => { delete PROPS_[k]; OUTPROPS_[k] = null; return userProps_; },
};
const PropertiesService = { getUserProperties: () => userProps_, getScriptProperties: () => userProps_ };
const CACHE_ = {};
const cache_ = {
  get: k => { const e = CACHE_[k]; return e && e.t > Date.now() ? e.v : null; },
  put: (k, v, s) => { CACHE_[k] = { v: String(v), t: Date.now() + (s || 600) * 1000 }; },
  remove: k => { delete CACHE_[k]; },
};
const CacheService = { getScriptCache: () => cache_, getUserCache: () => cache_ };
const Utilities = {
  sleep: ms => { const end = Date.now() + ms; while (Date.now() < end) { /* 기다림 */ } },
  formatDate: (d, tz, f) => {
    const p = {}; new Intl.DateTimeFormat("en-CA", { timeZone: tz || "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      .formatToParts(d).forEach(x => { p[x.type] = x.value; });
    return f.replace(/yyyy/g, p.year).replace(/MM/g, p.month).replace(/dd/g, p.day).replace(/HH/g, p.hour).replace(/mm/g, p.minute).replace(/ss/g, p.second);
  },
  getUuid: () => (self.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)),
  base64Encode: s => btoa(unescape(encodeURIComponent(String(s)))),
};
const Logger = { log: () => {} };
function sharedFetch_(url, o) {   // 공개 창구(aiShared)에 맡김: 모델 목록 · 글 만들기만
  const m = String(url).match(/\/models\/([\w.\-]+):generateContent/), op = m ? "gen" : /\/models\?/.test(url) ? "models" : "";
  const fail = (code, msg) => ({ getResponseCode: () => code, getContentText: () => JSON.stringify({ error: { message: msg } }), getHeaders: () => ({}) });
  if (!op || !GW_) return fail(400, "함께 쓰는 무료 AI로는 할 수 없는 요청입니다");
  const x = new XMLHttpRequest();
  x.open("POST", GW_, false); x.setRequestHeader("Content-Type", "text/plain;charset=utf-8");
  try { x.send(JSON.stringify({ fn: "aiShared", args: [{ op, model: m ? m[1] : "", body: op === "gen" ? String(o.payload || "") : "", dev: DEV_ }] })); }
  catch (e) { return fail(0, "함께 쓰는 무료 AI 창구에 닿지 못했습니다 — 인터넷을 확인해 주세요"); }
  let j = null; try { j = JSON.parse(x.responseText); } catch (e) {}
  if (!j) return fail(502, "함께 쓰는 무료 AI 창구가 알아볼 수 없는 답을 보냈습니다");
  if (!j.ok) return fail(429, j.error || "함께 쓰는 무료 AI가 지금 답하지 않습니다");
  return { getResponseCode: () => j.result.code, getContentText: () => j.result.text, getHeaders: () => ({}) };
}
const UrlFetchApp = {
  fetch: (url, o) => {
    o = o || {};
    if (SHARED_() && /^https:\/\/generativelanguage\.googleapis\.com\//.test(url)) return sharedFetch_(url, o);
    const x = new XMLHttpRequest();
    x.open(String(o.method || "get").toUpperCase(), url, false);
    if (o.contentType) x.setRequestHeader("Content-Type", o.contentType);
    Object.keys(o.headers || {}).forEach(k => x.setRequestHeader(k, o.headers[k]));
    if (/^https:\/\/api\.anthropic\.com\//.test(url)) x.setRequestHeader("anthropic-dangerous-direct-browser-access", "true");   // 클로드를 브라우저에서 바로 부를 때 필요한 표시
    try { x.send(o.payload == null ? null : o.payload); }
    catch (e) { return { getResponseCode: () => 0, getContentText: () => JSON.stringify({ error: { message: "AI 회사에 닿지 못했습니다 — 인터넷을 확인해 주세요" } }), getHeaders: () => ({}) }; }
    return {
      getResponseCode: () => x.status,
      getContentText: () => x.responseText,
      getHeaders: () => { const h = {}; String(x.getAllResponseHeaders() || "").trim().split(/[\r\n]+/).forEach(l => { const i = l.indexOf(":"); if (i > 0) h[l.slice(0, i).trim().toLowerCase()] = l.slice(i + 1).trim(); }); return h; },
    };
  },
};
function claudeWarn_() { /* 개인용은 크레딧 경고를 메일로 보냄 — 공개판은 하지 않음 */ }

const AI_ENTRY_ = { coWrite: b => coWrite_(b), spellCheck: b => spellCheck_(b), reviewMs: b => reviewMs_(b) };
const AI_MSG_ = m => { m = String(m || "").replace(/설정 → 주석 서재(에서)?/g, "설정 → 쓰기 → AI 열쇠$1").replace(/요약 열쇠/g, "AI 열쇠");
  return SHARED_() && m && !/내 열쇠/.test(m) && /한도|429|붐빕|몫|준비되지|닿지|답하지|혼잡|많이 썼/.test(m) ? m + " — 함께 쓰는 무료 AI는 여러 사람이 나눠 써서 한도가 작습니다. 설정 → 쓰기 → AI 열쇠에 내 열쇠를 넣으면 넉넉하고 더 좋은 답을 받습니다." : m; };
self.onmessage = e => {
  const d = e.data || {};
  KEYS_ = d.keys || {}; PROPS_ = d.props || {}; OUTPROPS_ = {}; GW_ = d.gw || ""; DEV_ = d.dev || "";
  let out;
  try {
    if (!AI_ENTRY_[d.fn]) throw new Error("공개판에서는 아직 쓰지 않는 AI 기능입니다: " + d.fn);
    let r = AI_ENTRY_[d.fn].apply(null, d.args || []);
    if (r && typeof r === "object" && r.error) r = Object.assign({}, r, { error: AI_MSG_(r.error) });
    out = { id: d.id, ok: true, result: r, props: OUTPROPS_ };
  } catch (err) { out = { id: d.id, ok: false, error: AI_MSG_(err && err.message || err), props: OUTPROPS_ }; }
  self.postMessage(out);
};

// ───────── 개인용 서버에서 옮긴 AI 부분 ─────────
function props_() { return PropertiesService.getUserProperties(); }

const esc_ = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const CLAUDE_PRICE = { in: 4, out: 20, cacheRead: 0.2, cacheWrite: 5, search: 0.01 };

function kstDay_(d) { return Utilities.formatDate(d || new Date(), "Asia/Seoul", "yyyy-MM-dd"); }

function addMonth_(day) { const p = day.split("-").map(Number), d = new Date(Date.UTC(p[0], p[1], 1)), last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(p[2], last)); return d.toISOString().slice(0, 10); }

function claudeLedger_() {
  let L = null; try { L = JSON.parse(props_().getProperty("claudeLedger") || "null"); } catch (e) {}
  // 처음 만들 때: 2026-10-28 콘솔 잔액 $199.68 (첫 요약 한 번 $0.32)을 반영
  L = Object.assign({ credit: 200, from: "2026-10-27", spent: 0, warned: false, empty: false, calls: 0, log: [] }, L || { spent: 0.32, calls: 1, log: [{ at: "2026-10-28", usd: 0.32, what: "주석 요약 (콘솔 잔액으로 맞춤)" }] });
  const today = kstDay_(); let rolled = false;
  while (addMonth_(L.from) <= today) { L.from = addMonth_(L.from); L.spent = 0; L.warned = false; L.empty = false; L.calls = 0; L.log = []; rolled = true; }
  if (rolled) claudeSave_(L);
  return L;
}

function claudeSave_(L) { props_().setProperty("claudeLedger", JSON.stringify(L)); }

function claudeCharge_(usage, what) {
  if (!usage) return;
  const u = usage, st = u.server_tool_use || {};
  const usd = ((u.input_tokens || 0) * CLAUDE_PRICE.in + (u.output_tokens || 0) * CLAUDE_PRICE.out + (u.cache_read_input_tokens || 0) * CLAUDE_PRICE.cacheRead + (u.cache_creation_input_tokens || 0) * CLAUDE_PRICE.cacheWrite) / 1e6 + (st.web_search_requests || 0) * CLAUDE_PRICE.search;
  const L = claudeLedger_(); L.spent += usd; L.calls = (L.calls || 0) + 1;
  L.log = [{ at: Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm"), usd: Math.round(usd * 10000) / 10000, what: what || "요약", tin: u.input_tokens || 0, tout: u.output_tokens || 0, s: st.web_search_requests || 0 }].concat(L.log || []).slice(0, 30);
  claudeSave_(L);
  claudeWarn_(L);
}

function safe_(fn) {
  try { return Object.assign({ ok: true }, fn()); }
  catch (e) { return { ok: false, error: e.message || String(e) }; }
}

function geminiModels_(key, fresh) {   // 쓸 수 있는 모델을 새 flash → flash-lite → pro 순으로 (6시간 기억; 목록을 못 받으면 기억하지 않음)
  const cache = CacheService.getScriptCache();
  if (!fresh) { const hit = cache.get("gemini-models2"); if (hit) return JSON.parse(hit); }
  let list = [];
  try {
    const res = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=" + encodeURIComponent(key), { muteHttpExceptions: true });
    if (res.getResponseCode() === 200) {
      const names = ((JSON.parse(res.getContentText() || "{}").models) || []).filter(m => (m.supportedGenerationMethods || []).indexOf("generateContent") >= 0).map(m => String(m.name).replace(/^models\//, ""));
      const ver = n => parseFloat((n.match(/\d+(\.\d+)?/) || ["0"])[0]), byVer = (a, b) => ver(b) - ver(a);
      const flash = names.filter(n => /^gemini-\d+(\.\d+)?-flash$/.test(n)).sort(byVer);
      const lite = names.filter(n => /^gemini-\d+(\.\d+)?-flash-lite$/.test(n)).sort(byVer);
      const pro = names.filter(n => /^gemini-\d+(\.\d+)?-pro$/.test(n)).sort(byVer);
      const rest = names.filter(n => /^gemini-\d+(\.\d+)?-flash/.test(n) && !/preview|exp|image|tts|audio|live|embed/.test(n)).sort(byVer);
      const alias = ["gemini-flash-latest", "gemini-flash-lite-latest", "gemini-pro-latest"].filter(n => names.indexOf(n) >= 0);   // 구글이 늘 최신 모델로 이어 주는 이름
      const prev = names.filter(n => /^gemini-\d+(\.\d+)?-flash(-lite)?-preview/.test(n) && !/image|tts|audio|live/.test(n)).sort(byVer);
      list = Array.from(new Set(alias.slice(0, 1).concat(flash, alias.slice(1), lite, pro, rest, prev))).slice(0, 12);
    }
  } catch (e) {}
  if (list.length) { cache.put("gemini-models2", JSON.stringify(list), 21600); return list; }
  // 목록을 못 받았을 때의 임시 후보 (기억해 두지 않아 다음 번에 다시 받습니다)
  return ["gemini-flash-latest", "gemini-3.5-flash", "gemini-flash-lite-latest", "gemini-3.5-flash-lite", "gemini-3-flash", "gemini-3-flash-lite"];
}

function geminiSkip_() { try { return JSON.parse(CacheService.getScriptCache().get("gemini-skip") || "{}"); } catch (e) { return {}; } }

function geminiMark_(model, code) { const c = CacheService.getScriptCache(), m = geminiSkip_(); m[model] = code; c.put("gemini-skip", JSON.stringify(m), code === 404 ? 21600 : 900); }   // 한도는 15분 뒤 다시 시도

function aiText_(prompt, opts) {
  opts = opts || {};
  const p = props_(), gk = p.getProperty("geminiKey"), ck = p.getProperty("claudeKey");
  if (!gk && !ck) throw new Error("요약 열쇠가 없습니다 (설정 → 주석 서재)");
  // 클로드 열쇠가 있으면 클로드 먼저(사용자 선택 2026-10-28), 안 되면 제미나이로
  let claudeErr = "";
  if (ck) { try { return aiClaude_(prompt, opts, ck); } catch (e) { if (!gk) throw e; claudeErr = e.message; } }
  if (gk) {
    // opts.search: 구글 검색으로 자료를 보강(grounding). 검색 설정을 받지 않는 모델이면(400) 검색 없이 다시 부릅니다
    const call = (model, think, search) => { const gen = { temperature: opts.temperature == null ? 0.3 : opts.temperature, maxOutputTokens: opts.maxTokens || 8000 };
      if (opts.json) gen.responseMimeType = "application/json";
      if (think) gen.thinkingConfig = { thinkingBudget: 0 };
      const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: gen };
      if (search) body.tools = [{ google_search: {} }];
      return UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + encodeURIComponent(gk),
        { method: "post", contentType: "application/json", payload: JSON.stringify(body), muteHttpExceptions: true }); };
    const tryCall = model => {   // 검색+생각끄기 → 검색만 → 둘 다 없이
      const combos = opts.search ? [[true, true], [false, true], [true, false], [false, false]] : [[true, false], [false, false]];
      let res = null, code = 0, used = null;
      for (const [think, search] of combos) { res = call(model, think, search); code = res.getResponseCode(); used = { think: think, search: search }; if (code !== 400) break; }
      return { res: res, code: code, used: used }; };
    let last = "", errs = [];
    const order = l => l.slice().sort((a, b) => opts.fast ? (/lite/.test(b) ? 1 : 0) - (/lite/.test(a) ? 1 : 0) : 0);   // 빠른 일(맞춤법)은 lite 모델부터
    const skip = geminiSkip_();
    let models = order(geminiModels_(gk)).filter(m => !skip[m]), refreshed = false, quota = 0, gone = 0;
    if (!models.length) quota = 1;   // 후보가 모두 방금 막혔거나 한도 — 다시 두드리지 않음 (클로드 열쇠가 있으면 그쪽으로)
    for (let i = 0; i < models.length; i++) {   // 혼잡(503)·한도(429)·없는 모델(404)이면 다음 후보로
      const model = models[i];
      let r = tryCall(model);
      if (r.code === 503) { Utilities.sleep(2500); r = tryCall(model); }
      if (r.code === 429) {   // 분당 한도면 잠깐 기다려 한 번 더, 하루 사용량(quota)이면 바로 다음 모델로
        let msg = ""; try { msg = String(((JSON.parse(r.res.getContentText() || "{}").error) || {}).message || ""); } catch (e) {}
        if (!/quota|billing|plan/i.test(msg)) { Utilities.sleep(2500); r = tryCall(model); }
        if (r.code === 429) { quota++; geminiMark_(model, 429); } }
      if (r.code === 404) { gone++; geminiMark_(model, 404); }
      if (r.code === 404 && !refreshed) { refreshed = true; const nl = order(geminiModels_(gk, true)).filter(m => m !== model); if (nl.length) { models = models.slice(0, i + 1).concat(nl.filter(m => models.indexOf(m) < 0 || models.indexOf(m) > i)); } }   // 모델 이름이 바뀌었으면 목록을 새로 받아 이어서
      let j; try { j = JSON.parse(r.res.getContentText() || "{}"); } catch (e) { j = { error: { message: "제미나이 응답을 읽지 못했습니다" } }; if (r.code === 200) r.code = 502; }
      if (r.code === 200) {
        const cand = (j.candidates || [])[0] || {}, parts = (cand.content || {}).parts || [];
        const t = parts.filter(x => x.text && !x.thought).map(x => x.text).join("");   // 생각(thought) 조각은 빼고 답만
        // 검색으로 참고한 웹 자료 (제목·주소)
        const gm = cand.groundingMetadata || {}, sources = (gm.groundingChunks || []).map(c => (c.web || {})).filter(w => w.uri).map(w => ({ title: String(w.title || w.uri).slice(0, 80), url: w.uri })).slice(0, 8);
        if (t) return { text: t, ai: "gemini (" + model + ")", sources: sources, searched: !!(r.used && r.used.search), info: { finish: cand.finishReason, parts: parts.length, thought: parts.filter(x => x.thought).length, usage: j.usageMetadata, used: r.used } };
        last = model + ": 빈 응답 (" + (cand.finishReason || "") + ")"; continue; }
      last = model + " " + r.code + ": " + ((j.error || {}).message || "").slice(0, 100); errs.push(last);
      if (r.code !== 503 && r.code !== 429 && r.code !== 404) break;
    }
    if (claudeErr) throw new Error(claudeErr + " / 대신 쓴 제미나이도 안 됨: " + (errs.length > 1 ? errs.slice(-2).join(" / ") : last));
    if (!ck) {
      if (quota && quota + gone >= errs.length) throw new Error("제미나이 무료 사용 한도에 걸렸습니다. 15분쯤 뒤 다시 눌러 보시고, 그래도 같으면 오늘 몫을 다 쓴 것이라 내일(오후 4~5시쯤 초기화) 됩니다. 설정 → 주석 서재에 클로드 열쇠를 넣어 두면 그때는 클로드로 이어서 요약합니다.");
      throw new Error("제미나이 " + (errs.length > 1 ? errs.slice(-2).join(" / ") : last));
    }
  }
  return aiClaude_(prompt, opts, ck);
}

function aiClaude_(prompt, opts, ck) {
  // 클로드 (Claude Opus 5.5): temperature 같은 표본 설정은 받지 않음(보내면 400). 생각은 늘 켜져 있어 effort 로 깊이를 조절 —
  // 요약·맞춤법은 low 로 빠르게. 생각도 max_tokens 안에 들어가므로 넉넉히. 웹 검색은 web_search_20260209.
  const CLAUDE_MODEL = "claude-opus-5-5";
  const payload = { model: CLAUDE_MODEL, max_tokens: Math.max(8000, Math.min((opts.maxTokens || 2500) * 2, 16000)),
    output_config: { effort: "low" }, messages: [{ role: "user", content: prompt }] };
  if (opts.search) payload.tools = [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }];
  const post = () => UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", { method: "post", contentType: "application/json",
    headers: { "x-api-key": ck, "anthropic-version": "2023-06-01" }, payload: JSON.stringify(payload), muteHttpExceptions: true });
  const readJ = res => { try { return JSON.parse(res.getContentText() || "{}"); } catch (e) { return { error: { message: "클로드 응답을 읽지 못했습니다" } }; } };
  let res = post(), code = res.getResponseCode(), j = readJ(res);
  if (code === 400 && payload.tools) { delete payload.tools; res = post(); code = res.getResponseCode(); j = readJ(res); }   // 검색을 못 쓰면 검색 없이
  for (let t = 0; t < 2 && (code === 429 || code === 529 || code >= 500); t++) {   // 혼잡·한도면 잠시 뒤 다시
    const h = res.getHeaders() || {}, ra = +(h["retry-after"] || h["Retry-After"] || 0);
    Utilities.sleep(Math.min(15000, ra ? ra * 1000 : 3000 * (t + 1))); res = post(); code = res.getResponseCode(); j = readJ(res); }
  if (code !== 200) {
    const m = ((j.error || {}).message || "").slice(0, 160);
    if (code === 401) throw new Error("클로드 열쇠가 맞지 않습니다 — 설정 → 주석 서재에서 다시 넣어 주세요");
    if (code === 400 && /credit|balance|billing/i.test(m)) { try { const L = claudeLedger_(); L.empty = true; claudeSave_(L); claudeWarn_(L, "클로드 크레딧이 떨어져 요약을 하지 못했습니다."); } catch (e) {} throw new Error("클로드 크레딧이 부족합니다 (console.anthropic.com → 결제)"); }
    throw new Error("클로드 " + code + ": " + m);
  }
  try { claudeCharge_(j.usage, opts.kind); } catch (e) {}   // 쓴 금액 쌓기(추정)
  // 검색이 길어지면 잠시 멈춘 답(pause_turn)이 올 수 있어 이어서 받음 (최대 2번)
  const content = (j.content || []).slice();
  for (let t = 0; t < 2 && j.stop_reason === "pause_turn"; t++) {
    payload.messages = [{ role: "user", content: prompt }, { role: "assistant", content: content.slice() }];
    res = post(); if (res.getResponseCode() !== 200) break; j = readJ(res); try { claudeCharge_(j.usage, opts.kind); } catch (e) {} (j.content || []).forEach(x => content.push(x));
  }
  if (j.stop_reason === "refusal") throw new Error("클로드가 이 요청에 답하지 않았습니다");
  const srcs = []; content.forEach(x => { if (x.type === "web_search_tool_result" && Array.isArray(x.content)) x.content.forEach(c => { if (c.url && srcs.length < 8) srcs.push({ title: String(c.title || c.url).slice(0, 80), url: c.url }); }); });
  const text = content.filter(x => x.type === "text").map(x => x.text || "").join("");
  if (!text) throw new Error("클로드가 빈 답을 보냈습니다 (" + (j.stop_reason || "") + ")");
  // 답이 실제로 기대어 쓴 원문 구절(인용 위치) — 검색 결과 전체가 아니라 인용한 곳만
  const cites = []; content.forEach(x => { if (x.type === "text" && Array.isArray(x.citations)) x.citations.forEach(c => { if (c && c.url && c.cited_text && cites.length < 10 && !cites.some(y => y.url === c.url && y.text === c.cited_text)) cites.push({ url: c.url, title: String(c.title || c.url).slice(0, 120), text: String(c.cited_text).slice(0, 600) }); }); });
  return { text: text, ai: "claude (" + CLAUDE_MODEL + ")", sources: cites.length ? srcs.filter(x => cites.some(c => c.url === x.url)).concat(cites.filter((c, i) => !srcs.some(x => x.url === c.url) && cites.findIndex(y => y.url === c.url) === i).map(c => ({ title: c.title.slice(0, 80), url: c.url }))) : srcs, cites: cites, searched: !!payload.tools, info: { stop: j.stop_reason, truncated: j.stop_reason === "max_tokens", usage: j.usage } };
}

function reviewMs_(body) {
  NG_ = ((body || {}).ng && typeof body.ng === "object") ? body.ng : null; CALLNAME_ = cnClean_((body || {}).callName);
  return safe_(() => {
    if ((body || {}).mode === "outline") return outline_(body);
    let left = 60000;
    const pieces = ((body || {}).pieces || []).map(x => ({ id: String(x.id || ""), title: String(x.title || "").slice(0, 120), text: String(x.text || "").slice(0, 9000) }))
      .filter(x => x.id && x.text.replace(/\s/g, "").length > 20).filter(x => { if (left <= 0) return false; left -= x.text.length; return true; });
    if (!pieces.length) throw new Error("검토할 글이 없습니다");
    const kind = String(body.kind || "원고");
    const genre = String(body.genre || ""), focus = String(body.focus || "").slice(0, 400), fic = genreKind_({ genre: genre }) === "fiction", serial = !!body.serial;
    const prompt = aiPr_({ genre: genre + " " + kind }) + (/설교/.test(genre + kind) ? SERMON_RULES_ : "") + "\n당신은 " + who_({ genre: genre + " " + kind }) + "의 글을 함께 다듬는 편집자입니다. 원칙에 어긋난 곳(추측을 사실처럼 쓴 문장, 본문이 말하지 않는 동기를 단정한 문장, 확인 필요한 원어·숫자·인용)도 짚습니다. 아래는 「" + String(body.title || "") + "」 " + kind + (genre ? " (글의 성격: " + genre + ")" : "") + "의 " + (body.item || "꼭지") + "들입니다(순서대로). 글을 대신 고쳐 쓰지 말고, 글쓴이가 스스로 고칠 수 있도록 짚을 점만 한국어로 짧게 적어 주세요.\n"
      + (focus ? "이 성격의 글에서 특히 볼 것: " + focus + "\n" : "")
      + (fic ? "볼 것: 1) 시점 — 한 장면 안에서 시점이 흔들리는 곳 2) 설정 — 아래 설정 노트·앞 장면과 어긋나는 곳(이름·나이·장소·때) 3) 복선 — 심었는데 거두지 않았거나, 거뒀는데 심지 않은 것 4) 정보 — 독자에게 너무 이르거나 늦게 드러나는 정보 5) 흐름 — 장면 사이가 이어지지 않거나 긴장이 풀리는 곳" + (serial ? " 6) 연재 — 화 첫머리 훅과 화 끝 당김이 약한 곳" : "") + ".\n" + (body.settings ? "─── 설정 노트(작가가 정한 것 — 🔒비밀은 본문에 드러내지 말고 복선이 맞는지만) ───\n" + String(body.settings).slice(0, 6000) + "\n───\n" : "")
        : "볼 것: 1) 흐름 — 꼭지 안에서 생각이 끊기거나 건너뛰는 곳 2) 되풀이 — 같은 말·예화·문장이 꼭지 안팎에서 겹치는 곳 3) 연결 — 앞뒤 꼭지와 이어지지 않거나 이으면 좋을 곳 4) 분명함 — 무엇을 말하려는지 흐린 문장 5) 표현 — 지나치게 단정하거나 오해될 수 있는 " + (genreKind_({ genre: genre + " " + kind }) === "faith" ? "신학적 표현, 성경 인용의 출처가 빠진 곳" : "표현, 출처가 빠진 사실·인용") + ".\n")
      + "규칙: 꼭지마다 가장 중요한 것부터 최대 5개. 칭찬·일반론은 쓰지 말 것. quote 는 그 꼭지 본문에 실제로 있는 짧은 구절(30자 이내, 그대로 옮김). 짚을 점이 없으면 빈 목록.\n"
      + "답은 JSON 하나만: {\"overall\":\"원고 전체에 대한 2~4문장\",\"pieces\":[{\"id\":\"꼭지 id\",\"notes\":[{\"type\":\"" + (fic ? "시점|설정|복선|정보|흐름" + (serial ? "|연재" : "") : "흐름|되풀이|연결|분명함|표현") + "\",\"quote\":\"원문 구절\",\"note\":\"짚을 점 한두 문장\"}]}]}\n\n"
      + pieces.map((x, i) => "### 꼭지 " + (i + 1) + " (id: " + x.id + ") " + x.title + "\n" + x.text).join("\n\n");
    const r = aiText_(prompt, { json: true, maxTokens: 8000, temperature: 0.2, kind: kind + " 검토" });
    let j; try { const s = r.text, a = s.indexOf("{"), b = s.lastIndexOf("}"); j = JSON.parse(s.slice(a, b + 1)); } catch (e) { throw new Error("검토 결과를 읽지 못했습니다: " + String(r.text || "").slice(0, 80)); }
    const ids = {}; pieces.forEach(x => ids[x.id] = x.text);
    const out = (j.pieces || []).filter(x => x && ids[x.id] !== undefined).map(x => ({ id: x.id, notes: (x.notes || []).filter(n => n && n.note).slice(0, 5)
      .map(n => ({ type: String(n.type || "").slice(0, 8), quote: String(n.quote || "").slice(0, 60), note: String(n.note).slice(0, 300), found: !!n.quote && ids[x.id].indexOf(String(n.quote)) >= 0 })) }));
    return { overall: String(j.overall || "").slice(0, 800), pieces: out, ai: r.ai, count: pieces.length };
  });
}

function coWrite_(body) {
  CALLNAME_ = cnClean_((body || {}).callName); NG_ = ((body || {}).ng && typeof body.ng === "object") ? body.ng : null;   // 앱 설정 「나를 부르는 호칭」 — 모든 AI 기능의 aiPr_ 가 씀 (요청마다 새로)
  if ((body || {}).mode === "research") return research_(body);
  if ((body || {}).mode === "refine") return refine_(body);
  if ((body || {}).mode === "suggest") return suggest_(body);
  if ((body || {}).mode === "card") return card_(body);
  if ((body || {}).mode === "rulecheck") return ruleCheck_(body);
  if ((body || {}).mode === "verify") return verify_(body);
  if ((body || {}).mode === "check10") return check10_(body);
  if ((body || {}).mode === "alts") return alts_(body);
  if ((body || {}).mode === "feedback") return feedback_(body);
  if ((body || {}).mode === "setcheck") return setCheck_(body);
  if ((body || {}).mode === "worldsync") return worldSync_(body);
  if ((body || {}).mode === "dayline") return dayLine_(body);
  return safe_(() => {
    const d = (body || {}).doc || {}, msgs = ((body || {}).messages || []).filter(m => m && m.text).slice(-12);
    if (!msgs.length) throw new Error("물어볼 말이 없습니다");
    const doc = String(d.body || ""), sel = String(d.sel || "").slice(0, 3000), genre = String(d.genre || "글").slice(0, 30);
    const sys = "당신은 " + who_(d) + " 곁에서 함께 쓰는 글쓰기 동료입니다. 한국어로 답하고, 글쓴이의 목소리와 문체를 존중합니다.\n"
      + aiPr_(d) + (d.sermon ? SERMON_RULES_ : "") + vrText_(d)
      + "답하는 방식:\n1) 글쓴이가 먼저 생각하도록 질문·방향을 앞세우고, 초안은 글쓴이가 청할 때 씁니다.\n2) 고쳐 쓴 문장을 줄 때는 원문 길이를 크게 넘지 않고, 글쓴이의 낱말을 살립니다.\n"
      + "3) 사실·인용·성경 구절·책·출처를 지어내지 않습니다. 확실하지 않으면 '확인 필요'라고 씁니다. 성경 구절은 장·절을 밝히고" + (genreKind_(d) === "faith" ? ", 해석은 복음주의 전통 안에서 조심스럽게" : "") + ".\n"
      + "4) 칭찬·일반론은 빼고 구체적으로. 5) 답은 짧게 — 보통 12줄 안. 목록은 '- '로.\n"
      + "6) 글에 바로 넣을 수 있는 문장을 줄 때만 그 문장을 다음 블록으로 감쌉니다(블록 밖 설명은 짧게):\n<<<넣기\n(넣을 문장)\n>>>\n"
      + "6-1) 글에 이미 있는 문장을 바꿔 쓰자고 할 때는 <<<넣기 대신 원문과 함께 이 블록으로 냅니다(원문은 [글]에 있는 그대로 한 글자도 바꾸지 말고 복사, 한 블록에 한 문장 안팎):\n<<<바꾸기\n원문: (글에 있는 문장 그대로)\n제안: (바꾼 문장)\n>>>\n"
      + (d.noContinue && !d.sermon ? "7) 이 글의 성격(" + genre + ")에서는 본문을 이어 쓰거나 통째로 지어 주지 않습니다. 질문·구조·표현 제안까지만 하고, <<<넣기 블록은 고른 부분을 다듬는 한두 문장일 때만 씁니다.\n" : "")
      + (d.sermon ? "7) 설교: 본문을 저절로 이어 쓰지 않습니다. 초안은 설교 원고 규칙대로(설계 카드의 한 문장 확정 뒤, 네 자리는 〔직접 쓸 자리〕로) 글쓴이가 청할 때만 <<<넣기 블록으로 냅니다.\n" : "")
      + (d.gate ? "7) 이 글은 설계 카드의 '" + cardLb_(d.card || d)[0] + "'이(가) 아직 확정되지 않았습니다(원칙 1-4). 본문 초안(여러 문단·장면)을 청하면 쓰지 말고, 먼저 그것을 글쓴이가 정하도록 질문으로 도우세요. 고른 부분을 다듬는 한두 문장은 괜찮습니다.\n" : "")
      + (d.poem ? "7) 이 글은 시입니다. 시행을 지어 주거나 바꿔 쓴 시행을 <<<넣기 블록으로 주지 않습니다. 소리·이미지·행갈이를 짚는 질문과 관찰까지만 합니다(비문은 짚기만).\n" : "")
      + (d.meditation ? "8) 이 글은 묵상입니다. 묵상은 글쓴이가 말씀 앞에서 드리는 기도이므로 문장을 지어 주지 않습니다. 관찰 질문, 본문의 배경 가운데 확실한 사실(출처를 밝힘), 맞춤법만 돕고 <<<넣기 블록은 쓰지 않습니다.\n" : "")
      + "\n글의 성격: " + genre + (d.item ? " (단위: " + String(d.item).slice(0, 10) + ")" : "") + (d.focus ? "\n이 성격에서 특히 볼 것: " + String(d.focus).slice(0, 300) : "")
      + "\n제목: " + String(d.title || "(제목 없음)").slice(0, 120) + (d.passage ? "\n성경 본문: " + String(d.passage).slice(0, 60) : "")
      + "\n─── 지금 글 (" + doc.length + "자" + (doc.length > 14000 ? ", 길어서 앞뒤만" : "") + ") ───\n" + (doc.length > 14000 ? doc.slice(0, 7000) + "\n…(중략)…\n" + doc.slice(-7000) : doc || "(아직 비어 있음)") + "\n───\n"
      + (sel ? "글쓴이가 지금 고른 부분:\n「" + sel + "」\n" : "") + (d.near && !sel ? "커서 가까운 곳:\n" + String(d.near).slice(0, 1200) + "\n" : "")
      + (d.refs ? "─── 글쓴이가 함께 읽게 한 원고 자료 (사실·인용은 여기 있는 것만 씀) ───\n" + String(d.refs).slice(0, 6000) + "\n───\n" : "")
      + worldCtx_(d) + aroundCtx_(d)
      + (d.card ? "─── 설계 카드 (" + (d.card.ok ? "글쓴이가 한 문장을 확정함 — 초안·구조안은 이 카드에서 벗어나지 않음" : "한 문장은 아직 확정 전 — 초안을 청하면 먼저 한 문장을 확정하자고 말함") + ") ───\n" + (L => ["세 줄: " + String(d.card.three || "").slice(0, 600), L[0] + ": " + String(d.card.one || ""), L[1] + ": " + String(d.card.func || ""), L[2] + ": " + String(d.card.target || ""), L[3] + ": " + String(d.card.path || ""), L[4] + ": " + String(d.card.story || ""), "분량: " + String(d.card.budget || "")])(cardLb_(d.card)).join("\n").slice(0, 2500) + "\n" + (d.card.own ? "글쓴이가 직접 쓰는 자리(손대지 않음): " + String(d.card.own).slice(0, 100) + "\n" : "") + "───\n" : "");
    const conv = msgs.map(m => (m.role === "ai" ? "도우미: " : "글쓴이: ") + String(m.text).slice(0, 4000)).join("\n\n");
    const r = aiText_(sys + "\n대화:\n" + conv + "\n\n도우미:", { maxTokens: 3000, temperature: 0.5, kind: "글쓰기 도움" });
    return { text: String(r.text || "").trim(), ai: r.ai || "" };
  });
}

const AI_PRINCIPLES_ = "[글쓰기 보조 원칙 — 반드시 지킵니다]\n"
  + "1) 글의 주인은 사람입니다. AI는 조사·대조·초안을 돕고, 방향·채택·마지막 문장은 글쓴이가 정합니다. 제안은 글쓴이가 고를 수 있게 내놓습니다.\n"
  + "2) 확인한 것과 추측한 것을 나눕니다. 원 자료(본문)가 말하지 않는 동기·평가를 단정하지 않습니다(\"본문은 이유를 말하지 않습니다. 다만…\"). 의견이 갈리면 갈린다고 씁니다(\"~로 보는 견해도 있고, ~로 보는 견해도 있습니다\"). 근거는 가장 가까운 곳(같은 장·같은 글)에서 찾습니다. 낱말의 문법적 뜻과 더 큰 맥락의 읽기(정경적·기독론적 읽기)를 섞지 않고, 해석적 읽기는 그렇다고 밝힙니다. 비유('같다')를 실체('되다')로 바꾸지 않습니다.\n"
  + "3) 원어·전문 용어 주장은 어근·어형, 다른 문맥의 반례, 글에서 말할 범위를 확인한 것만 쓰고, 확인하지 못했으면 '(확인 필요)'라고 씁니다. 연도·인명·숫자·인용은 공식 출처와 대조한 것만 씁니다. 확인하지 못한 것은 확인하지 못했다고 씁니다. 사실 주장에는 필요하면 (확인함)/(추론)/(확인 못 함)을 붙입니다.\n"
  + "4) 글쓴이가 준 자료와 글쓴이의 생각도 검증·점검 대상입니다. 맞장구도 깎아내림도 아닙니다. 점검은 기준(복음주의 신학과 성결교회 전통)을 먼저 밝히고, 큰 방향 → 맞는 점(근거와 함께) → 다듬을 점(왜 문제가 될 수 있는지) → 바꿔 쓸 문장 제안 순서로 합니다. 둘을 비교할 때 한쪽을 깎아내리지 않습니다(\"개역개정은 ~로 옮겼습니다. 새한글성경은 ~로 옮겼습니다\"). 지적을 받아도 무조건 받아들이지 않고, 인정할 것과 지킬 것을 나눠 답합니다.\n"
  + "5) 예화·사례도 사실을 확인합니다. 통설이 틀리면 정확한 사실을 쓰고, 허구 작품은 허구라고 밝힙니다. 비기독교 작가·작품을 억지로 기독교와 연결하지 않고(\"우연한 겹침\" 정도로), 밈은 조롱·정죄로 쓰지 않습니다.\n"
  + "6) 글은 한 문장으로 꿰고, 많이 조사하고 적게 씁니다. 독자 기준은 이 주제를 잘 모르는 사람 — 쉬운 말, 짧은 문장. 전문 지식(원어 등)은 한 편에 하나나 둘.\n"
  + "7) 글이 사람을 다치게 하지 않게: 폭력·상처는 묘사 수위를 지키고, 어떤 일을 특정 시간·장소로 한정하는 표현이 배타적으로 들리지 않는지 봅니다. 작성자용 안내(큐·메모)와 독자용 글을 섞지 않습니다.\n"
  + "8) 자료에 저자·역자로 나오는 '임요한'은 글쓴이 본인이 아닙니다. 이름이 같다고 같은 사람으로 연결하지 않습니다.\n";

const SERMON_RULES_ = "[설교 원고 규칙]\n"
  + "- 사람이 먼저 본문을 읽고 '내가 받은 것' 세 줄을 적습니다. 초안은 설계 카드(한 문장 · 기능 · 겨냥할 자리(타락한 상태) · 그리스도로 가는 길 · 주 예화 · 분량 예산)의 한 문장을 글쓴이가 확정한 뒤에만 씁니다. 지금 글에 확정된 한 문장이 없으면 초안 대신 설계 카드 초안(한 문장 후보 2~3개)을 내고, 세 줄이 없으면 한 번만 청합니다.\n"
  + "- 도입 첫 문단 · 1인칭 고백 · 결론 마지막 문단 · 기도문, 이 네 자리는 글쓴이가 직접 씁니다. 초안에는 이 자리에 〔직접 쓸 자리: …〕라고 표시만 합니다.\n"
  + "- 성경은 새한글성경 문구로 씁니다(널리 암송하는 구절은 개역개정도 되며 '(개역개정)' 표시). 정확한 문구를 확인하지 못했으면 장·절만 쓰고 '(새한글 문구 확인 필요)'라고 씁니다.\n"
  + "- 그리스도로 가는 길을 밝히고, 정경적 읽기면 그렇다고 표시합니다. 전체에 위로의 목회적 톤을 담고 값싼 은혜를 막는 문장 한 줄을 남깁니다. 비판 대지는 위로 대지로 다시 짜고, 인물의 약함은 책망 없이 참아 주신 하나님의 증거로 읽습니다.\n"
  + "- 소리 내어 하는 글이므로 '말하는 문장'으로 씁니다. 말버릇은 문단마다 한두 번까지. 주석에서 얻은 관찰은 본문에서 확인되는 것만 쓰고 주석가 이름을 나열하지 않습니다.\n"
  + "- 예화는 주 예화 하나(도입에서 열고 결론에서 닫음) + 보조 두세 개, 하나에 350~450자, 남는 것은 예비 예화로. 결론은 전체의 20% 안팎(최소 1,000자), 새 정보·요약 나열·훈계 목록 없이 앞의 이미지를 다시 불러와 닫고, 마지막 문장은 축원으로 맺습니다. 결론 틀은 지난번과 다르게.\n";

function vrText_(d) { d = d || {};
  return (d.rules ? "[글쓴이가 정한 규칙 — 지적에서 생긴 것이라 반드시 따릅니다]\n" + String(d.rules).slice(0, 3000) + "\n" : "")
    + (d.voice ? "[말투 기준 — 글쓴이가 직접 고친 문장들입니다. 새로 쓰거나 고치는 문장은 이 말투로 쓰되 사실·인용·원문은 바꾸지 않고, 말버릇은 문단마다 한두 번까지]\n" + String(d.voice).slice(0, 2500) + "\n" : ""); }

const EDIT_RULES_ = "규칙: 1) 뜻과 내용은 그대로 둡니다. 없던 사실·예화·인용·숫자·성경 구절을 더하지 않고, 본문에 있는 내용만 씁니다. 2) 글쓴이의 낱말과 문체를 살립니다(문체 견본 참고). "
  + "3) 성경 인용(「 」 안의 구절, 장·절이 붙은 문장)은 글자 하나도 바꾸지 않습니다. 4) ■ ◆ 로 시작하는 소제목 줄과 == __ [^1] 같은 표시 기호, 줄바꿈·빈 줄·줄 앞 공백(들여쓰기)은 원문 그대로 둡니다(시의 행·연은 특히). 5) 한국어 맞춤법·띄어쓰기를 지키되, 시의 시적 허용(일부러 어긴 맞춤법·반복·생략)은 존중합니다.";

function editCtx_(d) {
  return "글의 성격: " + String(d.genre || "글").slice(0, 30) + "\n제목: " + String(d.title || "(제목 없음)").slice(0, 120)
    + (d.samples ? "\n문체 견본(같은 글의 다른 문단):\n" + String(d.samples).slice(0, 1500) : "");
}

function jsonOf_(t, open, close) { const s = String(t || "").replace(/^```(json)?|```$/g, "").trim(), a = s.indexOf(open), b = s.lastIndexOf(close); if (a < 0 || b < a) throw new Error("AI 답을 읽지 못했습니다"); return JSON.parse(s.slice(a, b + 1)); }

function refine_(body) {
  return safe_(() => {
    const d = body || {}, text = String(d.text || "");
    if (!text.trim()) throw new Error("다듬을 글이 없습니다");
    if (text.length > 4000) throw new Error("한 번에 4,000자까지 다듬을 수 있습니다 — 조금 나눠서 골라 주세요");
    const prompt = aiPr_(d) + (d.sermon ? SERMON_RULES_ : "") + vrText_(d) + "\n당신은 " + who_(d) + "의 글을 함께 다듬는 편집자입니다. 아래 [고른 부분]만 다음 방향으로 고쳐 주세요(고칠 때는 최소한만, 근거가 있는 것만).\n방향: " + String(d.dir || "다듬기").slice(0, 200)
      + (d.instr ? "\n글쓴이의 부탁: " + String(d.instr).slice(0, 400) : "") + (d.poem ? "\n이 글은 시입니다. 행을 합치거나 나누지 말고, 행 수와 줄 앞 공백을 원문과 똑같이 둡니다." : "") + "\n" + EDIT_RULES_ + " 6) [고른 부분]만 고치고 앞뒤 글은 고치지 않습니다. 7) 고칠 데가 없으면 원문을 그대로 돌려줍니다.\n"
      + editCtx_(d) + worldCtx_(d) + "\n\n[앞 글]\n" + String(d.before || "").slice(-800) + "\n\n[고른 부분]\n" + text + "\n\n[뒷글]\n" + String(d.after || "").slice(0, 800)
      + '\n\n답은 JSON 하나만: {"to":"고친 [고른 부분] 전체","why":"무엇을 왜 고쳤는지 40자 안"}';
    const r = aiText_(prompt, { json: true, maxTokens: Math.min(6000, 600 + text.length * 2), temperature: 0.3, kind: "다듬기" });
    const j = jsonOf_(r.text, "{", "}"), to = String(j.to == null ? "" : j.to);
    if (!to.trim()) throw new Error("AI가 빈 답을 보냈습니다 — 다시 눌러 보세요");
    return { to: to, why: String(j.why || "").slice(0, 80), same: to.trim() === text.trim(), ai: r.ai || "" };
  });
}

function alts_(body) {
  return safe_(() => {
    const d = body || {}, text = String(d.text || "").trim(); if (!text) throw new Error("바꿔 볼 문장을 고르세요"); if (text.length > 1200) throw new Error("다른 표현은 1,200자까지 — 문장 한두 개를 골라 주세요");
    const prompt = aiPr_(d) + (d.sermon ? SERMON_RULES_ : "") + vrText_(d) + "\n당신은 글쓴이 곁의 편집자입니다. [고른 부분]을 뜻·사실·인용·인명은 그대로 두고, 표현만 서로 다르게 바꿔 쓴 후보 4개를 냅니다. 후보끼리 결이 달라야 합니다(짧게 / 리듬을 바꿔 / 감각을 살려 / 어순을 바꿔 등). 글쓴이의 말투 기준이 있으면 따릅니다. 새 사건·새 주장은 더하지 않습니다."
      + (d.instr ? "\n방향: " + String(d.instr).slice(0, 200) : "") + (d.avoid && d.avoid.length ? "\n이미 보여 준 후보와 겹치지 않게:\n" + d.avoid.slice(0, 12).map(x => "- " + String(x).slice(0, 300)).join("\n") : "")
      + "\n" + editCtx_(d) + worldCtx_(d) + "\n\n[앞 글]\n" + String(d.before || "").slice(-600) + "\n\n[고른 부분]\n" + text + "\n\n[뒷글]\n" + String(d.after || "").slice(0, 600)
      + '\n\n답은 JSON 하나만: {"alts":["후보1","후보2","후보3","후보4"]}';
    const r = aiText_(prompt, { json: true, maxTokens: Math.min(5000, 800 + text.length * 6), temperature: 0.8, kind: "다른 표현" });
    let a = []; try { a = jsonOf_(r.text, "{", "}").alts || []; } catch (e) { throw new Error("후보를 읽지 못했습니다 — 다시 눌러 보세요"); }
    a = a.map(x => String(x || "").trim()).filter(x => x && x !== text); a = a.filter((x, i) => a.indexOf(x) === i).slice(0, 4);
    if (!a.length) throw new Error("다른 표현을 찾지 못했습니다 — 다시 눌러 보세요");
    return { alts: a, ai: r.ai || "" };
  });
}

const DAYLINE_ICONS_ = ["cup", "sun2", "partly", "cloud", "rain", "snow", "fog", "pot", "pencil", "sun"];

function dayLine_(body) {
  return safe_(() => {
    const d = body || {}, clip = (x, n) => String(x == null ? "" : x).replace(/[\r\n<>]/g, " ").slice(0, n);
    const seed = String(d.date || "").replace(/\D/g, "");
    const topics = ["아침 빛", "따뜻한 차", "창밖 바람", "펼친 책", "천천히 걷기", "기도", "쉼", "작은 감사", "첫 문장", "연필", "새소리", "고요", "한 걸음", "기다림", "씨앗", "편지", "등불", "물 한 잔"];
    const hint = topics[(+seed.slice(-3) || 0) % topics.length];
    const prompt = "아침마다 말씀을 읽고 묵상과 글을 쓰는 사람의 다이어리 앱입니다. 오늘 화면 귀퉁이에 손글씨로 적힐 한 문장을 씁니다."
      + "\n오늘: " + clip(d.date, 10) + " (" + clip(d.season, 4) + ") · 오늘의 주제 씨앗: " + hint + " (꼭 이 낱말을 쓰지 않아도 됨)"
      + (d.avoid ? "\n어제 문장과 겹치지 않게: " + clip(d.avoid, 60) : "")
      + "\n\n조건: 말씀 앞에 앉거나 한 줄을 쓰려는 사람에게 건네는 따뜻한 한 문장. 18~30자, 존댓말(~요/~세요/~입니다), 한국어."
      + " 성경 구절·인용·사람 이름·숫자는 넣지 않습니다. 이모지·따옴표 없이. 설교하지 말고 다정하게. 날마다 다른 느낌으로."
      + "\n그리고 문장에 어울리는 그림 하나를 이 가운데서 고릅니다: " + DAYLINE_ICONS_.join(", ") + " (cup=찻잔, sun2=해, partly=해와 구름, cloud=구름, rain=비, snow=눈, fog=안개, pot=새싹 화분, pencil=연필, sun=떠오르는 해)"
      + '\n답은 JSON 하나만: {"line":"문장","icon":"그림 이름"}';
    const r = aiText_(prompt, { json: true, maxTokens: 300, temperature: 1.0, kind: "오늘의 한 줄" });
    let t = "", ic = ""; try { const o = jsonOf_(r.text, "{", "}"); t = String(o.line || ""); ic = String(o.icon || ""); } catch (e) { t = String(r.text || ""); }
    t = t.replace(/["“”「」『』]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
    if (!t) throw new Error("한 줄을 받지 못했습니다");
    return { line: t, icon: DAYLINE_ICONS_.indexOf(ic) >= 0 ? ic : "cup", ai: r.ai || "" };
  });
}

function feedback_(body) {
  return safe_(() => {
    const d = body || {}, doc = String(d.body || ""); if (doc.replace(/\s/g, "").length < 80) throw new Error("피드백을 받기에 글이 너무 짧습니다");
    const crit = (d.criteria || []).map(String).slice(0, 6);
    const prompt = aiPr_(d) + (d.sermon ? SERMON_RULES_ : "") + vrText_(d) + "\n당신은 이 분야를 잘 아는 편집자입니다. [글]을 읽고 아래를 냅니다. 칭찬은 근거와 함께, 약점은 고칠 방향과 함께. 글을 대신 다시 쓰지 않습니다. 대안 문장은 고칠 곳마다 최소한으로만."
      + "\n1) scores: 기준마다 1~5점과 근거 한 줄. 기준: " + (crit.length ? crit.join(", ") : "구성, 문장, 전달")
      + "\n2) strong: 강점 2~3개(글 속 근거와 함께) · weak: 약점 2~3개(고칠 방향과 함께)"
      + "\n3) items: 고칠 곳 최대 8곳. from 은 [글]에 있는 그대로의 구절(한 문장 안팎, 글 안에서 한 번만 나오게). kind 는 \"설정 어긋남\"(아래 설정 노트·앞 내용과 맞지 않음)·\"개연성\"·\"문장\"·\"구성\"·\"사실 확인\" 가운데 하나. note 는 무엇이 왜 문제인지(80자 안), to 는 그 구절의 대안(고칠 수 없는 구조 문제면 빈 문자열)."
      + (d.settings ? "\n\n[설정 노트 — 이 원고의 인물·장소·용어 등. 본문이 이것과 어긋나면 짚기]\n" + String(d.settings).slice(0, 6000) : "")
      + (d.card ? "\n[설계 카드] 한 문장: " + String(d.card.one || "") + " / 기능: " + String(d.card.func || "") + "\n" : "")
      + aroundCtx_(d) + (d.poem ? "\n이 글은 시입니다. to(대안 시행)는 늘 빈 문자열로 — 짚기만 합니다." : "")
      + "\n" + editCtx_(d) + "\n\n[글]\n" + (doc.length > 16000 ? doc.slice(0, 16000) : doc)
      + '\n\n답은 JSON 하나만: {"scores":[{"k":"기준","n":4,"why":"근거"}],"strong":["…"],"weak":["…"],"items":[{"from":"원문 구절","kind":"문장","note":"코멘트","to":"대안"}]}';
    const r = aiText_(prompt, { json: true, maxTokens: 6000, temperature: 0.3, kind: "피드백" });
    let j; try { j = jsonOf_(r.text, "{", "}"); } catch (e) { throw new Error("피드백을 읽지 못했습니다 — 다시 눌러 보세요"); }
    const KS = ["설정 어긋남", "개연성", "문장", "구성", "사실 확인"];
    const scores = (j.scores || []).filter(x => x && x.k).map(x => ({ k: String(x.k).slice(0, 20), n: Math.max(1, Math.min(5, Math.round(+x.n || 3))), why: String(x.why || "").slice(0, 120) })).slice(0, 6);
    const items = (j.items || []).filter(x => x && typeof x.from === "string" && x.from && doc.indexOf(x.from) >= 0)
      .map(x => ({ from: x.from.slice(0, 400), kind: KS.indexOf(x.kind) >= 0 ? x.kind : "문장", note: String(x.note || "").slice(0, 160), to: d.poem ? "" : String(x.to || "").slice(0, 600) })).slice(0, 8);
    return { scores: scores, strong: (j.strong || []).map(String).map(x => x.slice(0, 200)).slice(0, 3), weak: (j.weak || []).map(String).map(x => x.slice(0, 200)).slice(0, 3), items: items, ai: r.ai || "" };
  });
}

function setCheck_(body) {
  return safe_(() => {
    const d = body || {}, sc = (d.scenes || []).filter(x => x && String(x.body || "").trim()).slice(0, 60);
    if (!sc.length) throw new Error("점검할 글이 없습니다");
    let left = 40000; const docs = [];
    sc.forEach(x => { const b = String(x.body || "").slice(0, Math.max(0, left)); left -= b.length; if (b) docs.push({ n: +x.n || 0, title: String(x.title || "").slice(0, 80), body: b, info: ["pov", "loc", "when", "st"].map(k => x[k] ? ({ pov: "시점", loc: "장소", when: "때", st: "이야기 시각" })[k] + "=" + String(x[k]).slice(0, 60) : "").filter(Boolean).join(", ") }); });
    const prompt = aiPr_(d) + "\n당신은 소설의 연속성 편집자(스크립트 수퍼바이저)입니다. 아래 [장면들]을 [설정 노트]와 서로의 앞뒤와 견주어, 글에 분명히 드러난 어긋남만 짚습니다. 추측·창작 금지, 확실하지 않으면 빼기. 글을 대신 고쳐 쓰지 않습니다."
      + "\n1) items: 어긋난 곳 최대 12곳. n 은 장면 번호, from 은 그 장면 [글]에 있는 그대로의 구절(한 문장 안팎), kind 는 \"설정 어긋남\"(나이·외모·직업 등 속성)·\"성격·말투\"·\"관계\"·\"시간·장소\"(장면 정보·앞 장면과)·\"앞뒤 모순\" 가운데 하나, who 는 관련 항목 이름, note 는 무엇이 왜 어긋나는지(100자 안), set 은 근거(설정 노트의 값이나 앞 장면 구절, 80자 안). 인물의 성장·거짓말·반전처럼 의도일 수 있으면 note 끝에 \"(의도라면 괜찮음)\"."
      + "\n2) aliases: 노트에 적힌 이름·다른 이름이 아닌 호칭으로 노트의 항목을 부른 곳 최대 8개. who 는 노트 항목 이름, alias 는 그 호칭(본문 그대로), n·from 은 근거 구절. '그녀'·'선생님'처럼 여러 사람에게 두루 쓰는 말이면 common 을 true 로."
      + (d.serial ? "\n이 원고는 웹소설 연재입니다(장면 = 화)." : "")
      + "\n\n[설정 노트]\n" + (String(d.settings || "").slice(0, 8000) || "(없음)")
      + "\n\n[장면들]\n" + docs.map(x => "### 장면 " + x.n + " 「" + x.title + "」" + (x.info ? " (" + x.info + ")" : "") + "\n" + x.body).join("\n\n")
      + '\n\n답은 JSON 하나만: {"items":[{"n":1,"from":"원문 구절","kind":"설정 어긋남","who":"","note":"","set":""}],"aliases":[{"who":"","alias":"","n":1,"from":"","common":false}]}';
    const r = aiText_(prompt, { json: true, maxTokens: 6000, temperature: 0.2, kind: "설정 점검" });
    let j; try { j = jsonOf_(r.text, "{", "}"); } catch (e) { throw new Error("설정 점검 결과를 읽지 못했습니다 — 다시 눌러 보세요"); }
    const KS = ["설정 어긋남", "성격·말투", "관계", "시간·장소", "앞뒤 모순"], str = (x, n) => String(x == null ? "" : x).slice(0, n), byN = n => docs.find(x => x.n === +n);
    const items = (j.items || []).filter(x => x && typeof x.from === "string" && x.from && byN(x.n) && byN(x.n).body.indexOf(x.from) >= 0)
      .map(x => ({ n: +x.n, from: x.from.slice(0, 400), kind: KS.indexOf(x.kind) >= 0 ? x.kind : "설정 어긋남", who: str(x.who, 40), note: str(x.note, 200), set: str(x.set, 160) })).slice(0, 12);
    const aliases = (j.aliases || []).filter(x => x && x.who && x.alias && byN(x.n) && byN(x.n).body.indexOf(String(x.alias)) >= 0)
      .map(x => ({ who: str(x.who, 40), alias: str(x.alias, 30).trim(), n: +x.n, from: str(x.from, 200), common: !!x.common })).filter(x => x.alias.length >= 2 && x.alias !== x.who).slice(0, 8);
    return { items: items, aliases: aliases, cut: left < 0, ai: r.ai || "" };
  });
}

function worldSync_(body) {
  return safe_(() => {
    const d = body || {}, doc = String(d.body || ""); if (doc.replace(/\s/g, "").length < 60) throw new Error("정리할 글이 너무 짧습니다");
    const kinds = (d.kinds || []).map(String).slice(0, 10);
    const prompt = aiPr_(d) + "\n당신은 작가의 설정 노트를 정리하는 조수입니다. [글]을 읽고 [지금 노트]와 견주어 다음을 찾습니다. 글에 분명히 적힌 것만 — 추측·창작 금지, 이미 노트에 똑같이 있는 것은 빼기.\n"
      + "1) add: 글에 나왔지만 노트에 없는 " + (kinds.length ? kinds.join("·") : "인물·장소") + " 가운데 **이야기에 중요한 것만** (이름, 종류, 글에서 드러난 속성, 한 줄 메모, 근거가 된 글 구절, imp = 왜 중요한지 한 줄)\n"
      + "   중요한 것: 이름이 있고 대사·행동·생각·관계가 드러나는 인물 · 사건이 일어나거나 여러 번 돌아오는 장소 · 줄거리를 움직이거나 다시 나올 물건·기술·조직·용어 · 주인공과 이어진 것\n"
      + "1-1) minor: 노트에 없지만 **스쳐 간 것** — 이름(또는 짧은 지칭)만 남겨 두면 되는 것. 예: 한 번 지나간 행인·점원·운전사, 지나가다 들른 가게·거리, 배경으로 한 번 언급된 상표·지명. 이름(name)과 종류(kind)만, 많아야 25. '그녀'·'남자'처럼 이름이 아닌 대명사·일반 명사는 넣지 않음\n"
      + (d.minors ? "1-2) promote: [스쳐 간 것으로 등록된 이름] 가운데 이 글에서 중요해진 것(대사·관계·사건이 생김) — name, imp(왜). 그 밖의 등록된 이름은 add·minor에 다시 넣지 않음\n[스쳐 간 것으로 등록된 이름] " + String(d.minors).slice(0, 1500) + "\n" : "")
      + (d.muted ? "[글쓴이가 넣지 않기로 한 이름 — 어느 목록에도 넣지 않음] " + String(d.muted).slice(0, 800) + "\n" : "")
      + "2) update: 노트에 있는 항목의 속성이 글에서 새로 드러났거나 노트와 다르게 적힌 것 (이름, 속성 {칸:값}, 무엇이 달라졌는지)\n"
      + "3) rel: 글에서 드러난 두 항목 사이의 관계 (a, b, 관계 이름 — a 쪽에서 본 이름). tone 은 글에 분명히 드러날 때만: good(우호·사랑·신뢰) · bad(적대·원한·갈등) · mixed(애증·긴장·거래), 드러나지 않으면 빈칸\n"
      + "각 항목의 why 에는 근거가 된 [글]의 구절을 그대로 짧게(60자 안). 많아야 add 15 · update 10 · rel 12. 중요한지 애매하면 minor 로.\n"
      + (d.tpl ? "종류마다 기본 칸: " + String(d.tpl).slice(0, 800) + "\n" : "")
      + (d.rules ? "\n[정리 규칙 — 글쓴이가 정한 기준, 반드시 따름]\n" + String(d.rules).slice(0, 2000) + "\n" : "")
      + "\n[지금 노트]\n" + (String(d.settings || "").slice(0, 6000) || "(없음)") + "\n\n" + editCtx_(d) + "\n\n[글]\n" + (doc.length > 14000 ? doc.slice(0, 14000) : doc)
      + '\n\n답은 JSON 하나만: {"add":[{"name":"","kind":"","props":{"칸":"값"},"note":"","why":"","imp":"왜 중요한지"}],"minor":[{"name":"","kind":""}],"promote":[{"name":"","imp":""}],"update":[{"name":"","props":{"칸":"값"},"note":"","why":""}],"rel":[{"a":"","b":"","label":"","tone":"good|bad|mixed|(비면 중립)","why":""}]}';
    const r = aiText_(prompt, { json: true, maxTokens: 5000, temperature: 0.2, kind: "설정 정리" });
    let j; try { j = jsonOf_(r.text, "{", "}"); } catch (e) { throw new Error("설정 정리 결과를 읽지 못했습니다 — 다시 눌러 보세요"); }
    const str = (x, n) => String(x == null ? "" : x).slice(0, n || 120), pr = o => { const out = {}; Object.keys(o || {}).slice(0, 10).forEach(k => { const v = str(o[k], 160).trim(); if (k && v) out[str(k, 30)] = v; }); return out; };
    const add = (j.add || []).filter(x => x && x.name).map(x => ({ name: str(x.name, 40), kind: str(x.kind, 20), props: pr(x.props), note: str(x.note, 200), why: str(x.why, 100), imp: str(x.imp, 120) })).slice(0, 15);
    const addN = add.map(x => x.name), minor = (j.minor || []).filter(x => x && x.name && String(x.name).trim().length >= 2 && addN.indexOf(String(x.name).trim()) < 0).map(x => ({ name: str(x.name, 40).trim(), kind: str(x.kind, 20) })).filter((x, i, A) => A.findIndex(y => y.name === x.name) === i).slice(0, 25);
    const promote = (j.promote || []).filter(x => x && x.name && d.minors && String(d.minors).indexOf(String(x.name)) >= 0).map(x => ({ name: str(x.name, 40), imp: str(x.imp, 120) })).slice(0, 10);
    const update = (j.update || []).filter(x => x && x.name && (Object.keys(x.props || {}).length || x.note)).map(x => ({ name: str(x.name, 40), props: pr(x.props), note: str(x.note, 200), why: str(x.why, 100) })).slice(0, 10);
    const rel = (j.rel || []).filter(x => x && x.a && x.b && x.label && x.a !== x.b).map(x => ({ a: str(x.a, 40), b: str(x.b, 40), label: str(x.label, 30), tone: ["good", "bad", "mixed"].indexOf(x.tone) >= 0 ? x.tone : "", why: str(x.why, 100) })).slice(0, 12);
    return { add: add, minor: minor, promote: promote, update: update, rel: rel, ai: r.ai || "" };
  });
}

function suggest_(body) {
  return safe_(() => {
    const d = (body || {}).doc || {}, msgs = ((body || {}).messages || []).filter(m => m && m.text).slice(-6), doc = String(d.body || ""), sel = String(d.sel || "");
    const scope = sel || doc; if (scope.replace(/\s/g, "").length < 10) throw new Error("살펴볼 글이 너무 짧습니다");
    const ask = msgs.length ? String(msgs[msgs.length - 1].text).slice(0, 600) : "글을 더 낫게 다듬을 곳";
    const prompt = aiPr_(d) + (d.sermon ? SERMON_RULES_ : "") + vrText_(d) + "\n당신은 " + who_(d) + "의 글을 함께 다듬는 편집자입니다. 글쓴이의 부탁에 맞춰 [살펴볼 글]에서 고칠 곳을 찾아 고친 안을 주세요(고칠 때는 최소한만, 근거가 있는 것만).\n글쓴이의 부탁: " + ask
      + (d.only ? "\n이 글에서는 이것만 고칩니다: " + String(d.only).slice(0, 200) : "") + "\n" + EDIT_RULES_
      + " 6) from 은 [살펴볼 글]에 있는 그대로의 구절(한 문장 안팎, 200자 안, 글 안에서 한 번만 나오도록 앞뒤 낱말을 넉넉히). 7) 가장 중요한 것부터 최대 8곳. 고칠 곳이 없으면 빈 목록.\n"
      + editCtx_(d) + (d.refs ? "\n참고 자료(사실은 여기 있는 것만):\n" + String(d.refs).slice(0, 4000) : "") + worldCtx_(d)
      + "\n\n[살펴볼 글]\n" + (scope.length > 12000 ? scope.slice(0, 12000) : scope)
      + '\n\n답은 JSON 하나만: {"items":[{"from":"원문 구절","to":"고친 구절","why":"까닭 40자 안"}]}';
    const r = aiText_(prompt, { json: true, maxTokens: 5000, temperature: 0.3, kind: "제안" });
    let items = []; try { items = jsonOf_(r.text, "{", "}").items || []; } catch (e) { throw new Error("제안을 읽지 못했습니다 — 다시 눌러 보세요"); }
    items = items.filter(x => x && typeof x.from === "string" && typeof x.to === "string" && x.from && x.from !== x.to && doc.indexOf(x.from) >= 0)
      .map(x => ({ from: x.from.slice(0, 400), to: x.to.slice(0, 600), why: String(x.why || "").slice(0, 80) })).slice(0, 8);
    return { items: items, ai: r.ai || "" };
  });
}

function card_(body) {
  return safe_(() => {
    const d = body || {}, three = String(d.three || "").trim(), doc = String(d.body || "");
    const prompt = aiPr_(d) + (d.sermon ? SERMON_RULES_ : "") + vrText_(d)
      + "\n당신은 글쓴이의 설계 카드를 함께 짜는 조력자입니다. 글쓴이가 정할 수 있게 후보를 내놓습니다. 카드 칸: " + cardDesc_(d) + ".\n"
      + (three ? "글쓴이가 먼저 읽고 받은 것 세 줄(여기서 출발합니다):\n" + three.slice(0, 1200) + "\n" : "글쓴이가 아직 세 줄을 적지 않았습니다. 지금 글과 본문에서 출발하되, 세 줄을 적어 달라는 말을 ask 에 한 번만 넣습니다.\n")
      + "글의 성격: " + String(d.genre || "글").slice(0, 30) + "\n제목: " + String(d.title || "(제목 없음)").slice(0, 120) + (d.passage ? "\n성경 본문: " + String(d.passage).slice(0, 60) : "")
      + (d.minutes ? "\n분량: 말하는 시간 " + (+d.minutes || 20) + "분 (1분에 약 350음절, 말할 때 약 20% 덧붙음)" : "")
      + "\n─── 지금 글 ───\n" + (doc.length > 8000 ? doc.slice(0, 8000) + "…" : doc || "(아직 비어 있음)") + "\n───\n"
      + '답은 JSON 하나만: {"ones":["' + cardLb_(d)[0] + ' 후보1","후보2","후보3"],"func":"' + cardLb_(d)[1] + '","target":"' + cardLb_(d)[2] + '","path":"' + (d.sermon ? "그리스도로 가는 길" : cardLb_(d)[3]) + '","stories":["' + cardLb_(d)[4] + ' 후보' + (d.kind === "novel" ? "" : " — 출처·사실 여부") + '","후보2"],"budget":"분량 예산(예: 20분 · 도입 10% · 본론 70% · 결론 20%)","ask":"세 줄이 없을 때만 한 문장으로 청함, 있으면 빈칸"}';
    const r = aiText_(prompt, { json: true, maxTokens: 2500, temperature: 0.5, kind: "설계 카드" });
    let j; try { j = jsonOf_(r.text, "{", "}"); } catch (e) { throw new Error("카드 초안을 읽지 못했습니다 — 다시 눌러 보세요"); }
    const str = (x, n) => String(x || "").slice(0, n || 300), arr = (x, n) => (Array.isArray(x) ? x : [x]).map(y => str(y, 240)).filter(Boolean).slice(0, n);
    return { ones: arr(j.ones, 3), func: str(j.func), target: str(j.target), path: str(j.path), stories: arr(j.stories, 3), budget: str(j.budget, 120), ask: str(j.ask, 200), ai: r.ai || "" };
  });
}

function ruleCheck_(body) {
  return safe_(() => {
    const rules = String((body || {}).rules || "").trim(); if (!rules) throw new Error("점검할 규칙이 없습니다");
    const prompt = aiPr_(body) + "\n아래는 글쓴이가 글을 쓰며 받은 지적을 규칙으로 바꿔 모은 목록입니다(날짜·계기·적용 방법). 규칙을 정리하도록 돕습니다. 규칙을 대신 고치지 말고 짚기만 합니다.\n"
      + "볼 것: 1) 서로 부딪히는 규칙(번호 둘과 어떻게 부딪히는지) 2) 다른 규칙이나 시간이 지나 낡았을 수 있는 규칙(확인할 질문으로) 3) 최소만 있고 최대가 없는(또는 그 반대) 규칙 4) 합쳐도 되는 규칙 5) 계기나 적용 방법이 비어 실제로 쓰기 어려운 규칙.\n"
      + "형식: 위 다섯 소제목마다 '- [번호] 짚을 점' 한두 줄. 없으면 '없음'. 마지막에 한 줄로 전체 인상. 마크다운 제목(#)은 쓰지 않습니다.\n\n[규칙 목록]\n" + rules.slice(0, 8000);
    const r = aiText_(prompt, { maxTokens: 2000, temperature: 0.3, kind: "규칙 점검" });
    return { text: String(r.text || "").trim(), ai: r.ai || "" };
  });
}

function verify_(body) {
  return safe_(() => {
    const d = body || {}, doc = String(d.body || ""); if (doc.replace(/\s/g, "").length < 30) throw new Error("검증할 글이 너무 짧습니다");
    const prompt = aiPr_(d) + (d.sermon ? SERMON_RULES_ : "")
      + "\n당신은 글쓴이의 원고를 검증하는 조교입니다. [글]에서 사실 주장을 뽑아 확인합니다: 연도·인명·숫자·통계·인용문(누가 어디서 한 말)·성경 구절의 장절과 문구·원어(히브리어·헬라어) 설명·예화의 사실(실화인지, 통설과 다른지, 허구 작품인지)·책과 저자.\n"
      + "항목마다 웹 검색으로 공식·믿을 만한 출처와 대조하고 status 를 셋 가운데 하나로: \"확인함\"(출처와 맞음), \"추론\"(본문·자료가 직접 말하지 않는 해석·동기 — 그렇다고 밝혀야 함), \"확인 못 함\"(출처를 찾지 못했거나 사람이 인쇄본 등에서 직접 대조해야 함). 원어는 어근·어형, 다른 문맥의 반례, 말할 범위를 note 에 적습니다. 틀린 곳은 note 에 바른 사실을 씁니다. 지어내지 않습니다.\n"
      + "가장 중요한 것부터 최대 15개. 답은 JSON 하나만: {\"rows\":[{\"kind\":\"원어|예화|인용|숫자|연도|인명|성경|책\",\"claim\":\"글에 있는 그대로의 짧은 구절(60자 안)\",\"status\":\"확인함|추론|확인 못 함\",\"source\":\"출처 이름이나 주소\",\"note\":\"확인한 내용·틀린 점·사람이 직접 대조할 곳(80자 안)\"}]}\n"
      + "글의 성격: " + String(d.genre || "글").slice(0, 30) + "\n제목: " + String(d.title || "").slice(0, 120) + (d.passage ? "\n성경 본문: " + String(d.passage).slice(0, 60) : "") + (d.refs ? "\n\n[글쓴이의 자료 창고 — 글의 인용·각주가 이 자료(원문·쪽)와 맞는지도 대조. 자료 자체도 출처로 확인하고, 자료에 'AI 조사'·'확인 못 함'으로 적힌 것은 근거로 치지 않음]\n" + String(d.refs).slice(0, 5000) : "") + "\n\n[글]\n" + doc.slice(0, 14000);
    const r = aiText_(prompt, { json: true, maxTokens: 5000, temperature: 0.2, search: true, kind: "검증표" });
    let rows = []; try { rows = jsonOf_(r.text, "{", "}").rows || []; } catch (e) { throw new Error("검증표를 읽지 못했습니다 — 다시 눌러 보세요"); }
    const ST = ["확인함", "추론", "확인 못 함"];
    rows = rows.filter(x => x && x.claim).map(x => ({ kind: String(x.kind || "").slice(0, 10), claim: String(x.claim).slice(0, 120), status: ST.indexOf(x.status) >= 0 ? x.status : "확인 못 함", source: String(x.source || "").slice(0, 200), note: String(x.note || "").slice(0, 200) })).slice(0, 15);
    return { rows: rows, sources: r.sources || [], searched: !!r.searched, ai: r.ai || "" };
  });
}

function check10_(body) {
  return safe_(() => {
    const d = body || {}, doc = String(d.body || ""), qs = (d.questions || []).map(String).slice(0, 10); if (!qs.length) throw new Error("질문이 없습니다"); if (doc.replace(/\s/g, "").length < 30) throw new Error("점검할 글이 너무 짧습니다");
    const prompt = aiPr_(d) + (d.sermon ? SERMON_RULES_ : "") + (d.card ? "\n[설계 카드] 한 문장: " + String(d.card.one || "") + " / 기능: " + String(d.card.func || "") + " / 겨냥할 자리: " + String(d.card.target || "") + " / 가는 길: " + String(d.card.path || "") + "\n" : "")
      + "\n완성 전 점검 질문에 답합니다. 질문마다 ans 는 \"예\"·\"아니오\"·\"모름\" 가운데 하나, why 는 글에서 찾은 근거 한 줄(60자 안, 아니오면 어디를 고치면 되는지). 마지막 질문(이 글이 먼저 글쓴이에게 한 말)처럼 글쓴이만 답할 수 있는 것은 \"모름\"으로 둡니다.\n"
      + qs.map((q, i) => (i + 1) + ". " + q + ((d.mine || [])[i] ? "\n   (글쓴이의 답: " + String(d.mine[i]).slice(0, 200) + " — 이 답이 글에 실제로 드러나는지 보고, 맞장구치지 말고 근거로 판단)" : "")).join("\n") + "\n\n[글]\n" + (doc.length > 14000 ? doc.slice(0, 7000) + "\n…\n" + doc.slice(-7000) : doc)
      + '\n\n답은 JSON 하나만: {"answers":[{"ans":"예|아니오|모름","why":"근거"}]} — 질문 순서대로 ' + qs.length + "개";
    const r = aiText_(prompt, { json: true, maxTokens: 2500, temperature: 0.2, kind: "점검 10문항" });
    let a = []; try { a = jsonOf_(r.text, "{", "}").answers || []; } catch (e) { throw new Error("점검 결과를 읽지 못했습니다 — 다시 눌러 보세요"); }
    a = qs.map((q, i) => { const x = a[i] || {}; return { ans: ["예", "아니오", "모름"].indexOf(x.ans) >= 0 ? x.ans : "모름", why: String(x.why || "").slice(0, 160) }; });
    return { answers: a, ai: r.ai || "" };
  });
}

function research_(body) {
  return safe_(() => {
    const c = (body || {}).ctx || {}, msgs = ((body || {}).messages || []).filter(m => m && m.text).slice(-10);
    if (!msgs.length) throw new Error("물어볼 말이 없습니다");
    const sys = aiPr_(c) + "\n당신은 " + who_(c) + "의 자료 조사 조교입니다. 한국어로 답합니다. 예화를 찾을 때는 넓게(역사·문학·시·영화·드라마·미술·음악·요즘 문화·한국과 동양 사상·베스트셀러·최신 뉴스) 찾되, 후보마다 출처와 사실 여부를 밝히고 허구 작품은 허구라고 씁니다.\n"
      + "원칙:\n1) 웹 검색으로 확인한 내용을 바탕으로 답하고, 중요한 사실마다 어디서 확인했는지(자료 이름) 밝힙니다.\n"
      + "2) 책·저자·쪽수·인용문·통계·연도·사례를 지어내지 않습니다. 검색으로 확인하지 못한 것은 '확인하지 못함'이라고 분명히 씁니다. 인용문은 원문을 찾았을 때만 그대로 옮기고, 아니면 요지로 씁니다.\n"
      + "3) 성경 구절은 장·절을 밝힙니다. 해석이 교단·전통에 따라 갈리면 어느 전통의 견해인지 밝히고 한쪽으로 단정하지 않습니다.\n"
      + "4) 믿을 만한 자료(학술 자료, 신학교·성서공회·출판사, 널리 인정된 사전·개론서)를 먼저 씁니다. 블로그·커뮤니티 글은 그렇다고 밝힙니다.\n"
      + "5) 글을 대신 써 주지 말고 자료를 정리해 줍니다. 짧게 — 보통 15줄 안, 목록은 '- '로. 마크다운 제목(#)·표는 쓰지 않습니다.\n"
      + (c.ms ? "\n지금 원고: 「" + String(c.ms).slice(0, 80) + "」" + (c.genre ? " (" + String(c.genre).slice(0, 20) + ")" : "") : "")
      + (c.title ? "\n지금 쓰는 글 제목: " + String(c.title).slice(0, 120) : "") + (c.passage ? "\n성경 본문: " + String(c.passage).slice(0, 60) : "")
      + (c.sel ? "\n글쓴이가 글에서 고른 부분: 「" + String(c.sel).slice(0, 1500) + "」" : "")
      + (c.one ? "\n이 글의 한 문장(설계 카드): " + String(c.one).slice(0, 300) + " — 예화·자료는 이 한 문장을 섬기는 것으로 고릅니다." : "")
      + (c.sermon ? "\n" + SERMON_RULES_ : "") + "\n";
    const conv = msgs.map(m => (m.role === "ai" ? "조교: " : "글쓴이: ") + String(m.text).slice(0, 4000)).join("\n\n");
    const r = aiText_(sys + "\n대화:\n" + conv + "\n\n조교:", { maxTokens: 3000, temperature: 0.3, search: true, kind: "조사 도우미" });
    return { text: String(r.text || "").trim(), ai: r.ai || "", sources: r.sources || [], cites: r.cites || [], searched: !!r.searched };
  });
}

function spellCheck_(body) {
  return safe_(() => {
    const text = String((body || {}).text || "").slice(0, 8000);
    if (text.replace(/\s/g, "").length < 10) throw new Error("글이 너무 짧습니다");
    const prompt = "다음 한국어 글의 맞춤법·띄어쓰기·오타·문장부호·어법(호응이 틀린 문장)만 살펴 고칠 곳을 찾아 주세요. 문체·표현·내용은 바꾸지 말고, 성경 인용문(「 」 안이나 '개역한글' 같은 번역 표시가 붙은 문장)·고유명사·일부러 쓴 구어체는 건드리지 마세요. ■ ◆ 로 시작하는 소제목 줄과 == __ [^ 같은 표시 기호는 그대로 두세요. 줄마다 따로 살피고 줄을 넘어 묶지 마세요.\n"
      + "답은 JSON 하나만: {\"items\":[{\"from\":\"원문 그대로의 짧은 구절(한 줄 안, 앞뒤 몇 글자 포함)\",\"to\":\"고친 구절\",\"why\":\"이유 한 마디\"}]} — 최대 40개, 확실한 것만. 고칠 곳이 없으면 {\"items\":[]}.\n\n[글]\n" + text;
    const r = aiText_(prompt, { json: true, maxTokens: 3000, temperature: 0, fast: !!(body && body.fast), kind: "맞춤법" });
    let items = [];
    try { const s = r.text, a = s.indexOf("{"), b = s.lastIndexOf("}"); items = (JSON.parse(s.slice(a, b + 1)).items || []); } catch (e) { throw new Error("제안을 읽지 못했습니다: " + r.text.slice(0, 80)); }
    items = items.filter(x => x && typeof x.from === "string" && typeof x.to === "string" && x.from !== x.to && text.indexOf(x.from) >= 0)
      .map(x => ({ from: x.from.slice(0, 120), to: x.to.slice(0, 120), why: String(x.why || "").slice(0, 80) })).slice(0, 40);
    return { items: items, ai: r.ai };
  });
}

function worldCtx_(d) {
  if (!d.world) return "";
  return "\n─── 이 원고의 월드·노트 (글쓴이가 정한 설정 — 답과 고친 안은 이것과 어긋나지 않게. 본문이 설정과 다르면 어느 쪽이 맞는지 글쓴이에게 물음. 없는 설정은 지어내지 않음) ───\n"
    + String(d.world).slice(0, 6000) + "\n───\n";
}

function aroundCtx_(d) {
  if (!d.around) return "";
  return "\n─── 원고 안 이 글의 자리 (앞뒤 글 요약 — 흐름·설정이 앞 내용과 이어지는지 볼 때 씀. 앞뒤 글을 고치지는 않음) ───\n"
    + String(d.around).slice(0, 2400) + "\n───\n";
}

function genreKind_(d) { d = d || {}; const g = String(d.kind || "") + " " + String(d.genre || "");
  if (d.sermon || /sermon|meditation|essay|설교|묵상|에세이|신앙/.test(g)) return "faith";
  if (/novel|소설/.test(g)) return "fiction"; if (/paper|논문/.test(g)) return "paper"; return "other"; }

function who_(d) { return genreKind_(d) === "faith" ? "목회자이자 작가인 글쓴이" : "글쓴이"; }

let CALLNAME_ = "", NG_ = null;

function cnClean_(v) { return String(v || "").replace(/[^가-힣ㄱ-ㅎㅏ-ㅣA-Za-z0-9 ·]/g, "").replace(/\s+/g, " ").trim().slice(0, 20); }   // 호칭은 글자·숫자·빈칸만 (프롬프트를 흔들지 못하게)

function aiPr_(d) { const k = genreKind_(d); let p = AI_PRINCIPLES_;
  if (k !== "faith") p = p.replace("점검은 기준(복음주의 신학과 성결교회 전통)을 먼저 밝히고", "점검은 이 글의 성격에 맞는 기준(" + (k === "paper" ? "학문적 엄밀성 — 근거·논증·인용의 정확성" : k === "fiction" ? "작품 안의 개연성과 작가가 정한 설정" : "사실과 논리, 독자에게 실제로 도움이 되는가") + ")을 먼저 밝히고");
  if (k === "fiction") p += "9) 이 글은 소설(허구)입니다. 작가가 정하지 않은 인물의 동기·과거·사건·결말을 지어내 정해진 것처럼 쓰지 않습니다. 가능성은 '이런 방향도 있습니다'처럼 후보로만 내고, 정하는 것은 작가입니다. 인물의 생각·대사를 신앙 잣대로 고치지 않습니다(작가가 청할 때만 점검).\n";
  if (k === "paper") p += "9) 이 글은 논문입니다. 본문을 대신 써 주지 않습니다(연구윤리) — 연구 질문·논증 구조·근거 점검·문헌 찾기·표현 다듬기까지만 돕습니다. 출처·인용·쪽수는 확인한 것만 쓰고, 학계 견해는 누구의 견해인지 밝힙니다.\n";
  const ng = (d || {}).ng || NG_;   // 소설 장르 관례 (앱 원고 정보 「장르」, 2026-10-30)
  if (ng && ng.n) p += "[이 소설의 장르] " + String(ng.n).slice(0, 20) + " — 장르 관례: " + String(ng.rule || "").replace(/[\r\n]/g, " ").slice(0, 160) + ". 관례는 참고일 뿐, 작가가 정한 설정·선택이 먼저입니다(관례를 강요하거나 틀이라고 지적하지 않음).\n";
  const cn = cnClean_((d || {}).callName) || CALLNAME_;   // 앱 설정 「나를 부르는 호칭」 (2026-10-30)
  if (cn) p += "호칭: 글쓴이에게 직접 말을 건넬 때만 「" + cn + "」(이)라고 부르고 다른 호칭을 지어 쓰지 않습니다. 넣기·바꾸기·초안처럼 독자가 읽을 글에는 이 호칭을 넣지 않으며, 글 속 인물과 같은 사람으로 잇지 않습니다.\n";
  return p; }

function outline_(body) {
  let left = 120000;
  const pieces = ((body || {}).pieces || []).slice(0, 400).map(x => ({ id: String(x.id || ""), title: String(x.title || "").slice(0, 80), text: String(x.text || "").slice(0, 700) }))
    .filter(x => x.id).filter(x => { if (left <= 0) return false; left -= x.text.length + x.title.length; return true; });
  if (!pieces.length) throw new Error("검토할 글이 없습니다");
  const genre = String(body.genre || ""), item = String(body.item || "장면"), fic = genreKind_({ genre: genre }) === "fiction";
  const prompt = aiPr_({ genre: genre + " 원고" }) + "\n당신은 " + who_({ genre: genre }) + "의 장편 원고를 처음부터 끝까지 보는 편집자입니다. 아래는 「" + String(body.title || "") + "」의 " + item + " " + pieces.length + "개를 요약·장면 정보·처음과 끝 몇 줄로 줄인 것입니다. 문장은 다 받지 않았으니 문장 평가·맞춤법은 하지 말고 **구조만** 봅니다. 요약에 없는 내용을 지어내지 말고, 확실하지 않으면 '확인 필요'라고 씁니다.\n"
    + (body.settings ? "[설정 노트]\n" + String(body.settings).slice(0, 4000) + "\n" : "")
    + "볼 것: 1) 흐름·속도 — 늘어지거나 서두르는 구간 2) " + (fic ? "인물 변화 — 주인공·주요 인물이 어디서 움직이고 어디서 멈추는지 3) 복선 — 심고 거두지 않은 것, 거뒀는데 심지 않은 것 4) 시간·개연성 — 순서가 엉키거나 동기가 빈 곳 5) 중심 질문 — 처음에 던진 질문과 결말이 이어지는지" : "논지 흐름 — 앞뒤가 이어지는지 3) 되풀이 — 같은 내용이 여러 곳에서 겹치는지 4) 빠진 연결 5) 처음과 끝이 맞는지") + "\n"
    + "규칙: 칭찬·일반론 없이. 구간은 3~8개(예: '1~12장'). " + item + "마다 짚을 점은 꼭 필요할 때만, 최대 2개.\n"
    + '답은 JSON 하나만: {"overall":"원고 전체 구조 3~5문장","arcs":[{"range":"1~12' + item + '","note":"그 구간 한두 문장"}],"pieces":[{"id":"id","notes":[{"type":"' + (fic ? "흐름|인물|복선|시간|질문" : "흐름|논지|되풀이|연결|처음끝") + '","note":"한두 문장"}]}]}\n\n'
    + pieces.map((x, i) => "### " + (i + 1) + ". (id: " + x.id + ") " + x.title + "\n" + x.text).join("\n\n");
  const r = aiText_(prompt, { json: true, maxTokens: 6000, temperature: 0.2, kind: "장편 구조 검토" });
  let j; try { const t = r.text, a = t.indexOf("{"), b = t.lastIndexOf("}"); j = JSON.parse(t.slice(a, b + 1)); } catch (e) { throw new Error("검토 결과를 읽지 못했습니다: " + String(r.text || "").slice(0, 80)); }
  const ids = {}; pieces.forEach(x => ids[x.id] = 1);
  return { ok: true, overall: String(j.overall || "").slice(0, 1200), arcs: (j.arcs || []).slice(0, 8).map(a => ({ range: String(a.range || "").slice(0, 30), note: String(a.note || "").slice(0, 300) })),
    pieces: (j.pieces || []).filter(x => x && ids[x.id]).map(x => ({ id: x.id, notes: (x.notes || []).filter(n => n && n.note).slice(0, 2).map(n => ({ type: String(n.type || "").slice(0, 8), quote: "", note: String(n.note).slice(0, 300), found: false })) })), ai: r.ai, count: pieces.length };
}

function cardLb_(c) { const k = (c || {}).kind;
  if (k === "paper") return ["연구 질문", "가설·주장", "연구의 공백", "연구 방법", "핵심 근거·자료"];
  if (k === "novel") return ["장면이 할 일", "인물의 목표·갈등", "독자에게 남길 것", "전환점", "시점·장소·때"];
  if (k === "selfhelp") return ["핵심 메시지(약속)", "대상 독자", "독자의 문제", "원리·방법", "사례"];
  return ["한 문장", "기능", "겨냥할 자리", (c || {}).sermon ? "그리스도로 가는 길" : "핵심으로 가는 길", "주 예화"]; }

function cardDesc_(d) {
  if (d.kind === "paper") return "연구 질문(이 논문이 답하려는 물음 하나) · 가설·주장(질문에 대한 잠정적 답) · 연구의 공백(선행 연구가 다루지 않은 것 — 확인한 것만, 확인 못 했으면 그렇다고) · 연구 방법(문헌 분석·설문·주석 연구 등) · 핵심 근거·자료(주장을 받칠 1차 자료 — 실제로 있는 자료만) · 분량 예산";
  if (d.kind === "novel") return "장면이 할 일(이 장면이 끝나면 무엇이 바뀌는가 하나) · 인물의 목표·갈등(이 장면에서 원하는 것과 막는 것) · 독자에게 남길 것(정서나 질문) · 전환점(장면이 꺾이는 순간) · 시점·장소·때 · 분량 예산 — 작가가 정하지 않은 사건·동기는 후보로만";
  return "한 문장(이 글이 말할 것 하나) · 기능(독자에게 일어날 일) · 겨냥할 자리(독자의 아픔·필요" + (d.sermon ? ", 설교에서는 타락한 상태" : "") + ") · " + (d.sermon ? "그리스도로 가는 길" : "핵심으로 가는 길") + " · 주 예화(도입에서 열고 결론에서 닫을 예화 하나 — 사실 여부를 밝히고, 허구 작품은 허구라고) · 분량 예산";
}
