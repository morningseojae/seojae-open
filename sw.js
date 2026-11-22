// 2026-11-22 이 주소(/seojae-open/)는 닫혔습니다. 예전 앱의 오프라인 사본을 지우고 스스로 물러납니다(새 주소의 앱은 따로).
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  try { await caches.delete("seojae-open-v1"); } catch (_) {}
  try { await self.registration.unregister(); } catch (_) {}
  try { (await self.clients.matchAll({ type: "window" })).forEach(c => { try { c.navigate(c.url); } catch (_) {} }); } catch (_) {}
})()));
