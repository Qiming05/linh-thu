/* Linh Thú Hán Tự — service worker
   - index.html: lấy bản mới từ mạng trước (để cập nhật tự đến), mất mạng thì dùng bản đã lưu.
   - ảnh, thư viện CDN, font, dữ liệu nét chữ: dùng bản đã lưu, lần đầu thì tải rồi lưu lại.
   Khi đổi danh sách CORE hoặc cách cache, tăng VERSION. */
const VERSION = 'v1';
const CACHE = 'linh-thu-' + VERSION;
const CORE = [
  './', 'index.html', 'manifest.webmanifest',
  'assets/kenney-tiny-town/tilemap_packed.png',
  'assets/kenney-tiny-creatures/Kenney_tiny_dungeon.png',
  'assets/kenney-tiny-creatures/tilemap_packed.png',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
  'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5.0/dist/hanzi-writer.min.js',
  'https://cdn.jsdelivr.net/npm/pinyin-pro@3.26.0/dist/index.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('linh-thu-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const isPage = req => req.mode === 'navigate' || /\/(index\.html)?$/.test(new URL(req.url).pathname);

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!/^https?:$/.test(url.protocol)) return;

  if (url.origin === location.origin && isPage(req)) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); }
      return res;
    }).catch(() => caches.match('index.html').then(r => r || caches.match('./'))));
    return;
  }

  const cacheable = url.origin === location.origin || /(^|\.)(jsdelivr\.net|googleapis\.com|gstatic\.com)$/.test(url.hostname);
  if (!cacheable) return; // AI hay dịch vụ khác: luôn đi thẳng ra mạng
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
