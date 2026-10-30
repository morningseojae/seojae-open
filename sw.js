// 아침 서재 — 오프라인에서도 앱 화면이 열리게 (2026-10-30)
// 네트워크를 먼저 쓰고(새 버전이 늘 바로 옴), 끊겼을 때만 이 기기에 둔 마지막 판을 보여 줌.
// 같은 사이트의 GET 만 다룸 — 구글 서버(Apps Script)·노션 같은 바깥 요청은 건드리지 않음. 자료의 원본은 구글 드라이브.
const C = "seojae-v1";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    if (res.ok && !u.pathname.endsWith("version.json")) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match("index.html"))));
});
