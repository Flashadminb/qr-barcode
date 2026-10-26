/* ให้เปิดใช้ได้แม้ไม่มีอินเทอร์เน็ต — เปลี่ยนเลขเวอร์ชันทุกครั้งที่อัปเดตไฟล์ */
const CACHE = 'qrb-v5';
const CORE = [
  './', './index.html', './style.css', './app.js', './manifest.webmanifest', './icon-192.png',
  'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js',
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// ใช้ของในเครื่องก่อน (เร็ว) แล้วอัปเดตจากเน็ตเบื้องหลัง
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req.mode === 'navigate' ? './' : req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || net;
  }));
});
