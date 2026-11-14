// 아침 서재 — 오프라인에서도 앱 화면이 열리게 (2026-10-30)
// 네트워크를 먼저 쓰고(새 버전이 늘 바로 옴), 끊겼거나 2초 넘게 늦으면 이 기기에 둔 마지막 판을 먼저 보여 줌(2026-11-14).
// 같은 사이트의 GET 만 다룸 — 구글 서버(Apps Script)·노션 같은 바깥 요청은 건드리지 않음. 자료의 원본은 구글 드라이브.
const C = "seojae-open-v1";   // 공개판: 개인용(/seojae/)과 캐시 이름을 나눔
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  // 2026-11-14 빠르게 열기: 인터넷을 먼저 기다리되 2초가 넘으면 이 기기에 둔 판으로 먼저 열고, 받는 것은 뒤에서 마저 받아 다음에 씀
  // (version.json 은 늘 인터넷 — 새 판 알림이 늦지 않게)
  const net = fetch(r).then(res => {
    if (res.ok && !u.pathname.endsWith("version.json")) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); }
    return res;
  });
  const fromCache = () => caches.match(r, { ignoreSearch: r.mode === "navigate" }).then(m => m || (r.mode === "navigate" ? caches.match("index.html", { ignoreSearch: true }) : null));
  if (u.pathname.endsWith("version.json")) { e.respondWith(net.catch(fromCache)); return; }
  e.waitUntil(net.catch(() => {}));
  e.respondWith(new Promise(done => {
    let settled = false; const give = x => { if (!settled && x) { settled = true; done(x); } };
    const t = setTimeout(() => fromCache().then(m => m ? give(m) : null), 2000);
    net.then(res => { clearTimeout(t); give(res); }).catch(() => { clearTimeout(t); fromCache().then(m => give(m || Response.error())); });
  }));
});
