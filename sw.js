/* 驾考通 PWA Service Worker —— 自动生成，请勿手改（改 build_sw.py） */
/* 作用：把题目和全部题图缓存到手机本地，之后断网也能刷题；
        iPhone「添加到主屏幕」后即为可离线使用的独立 App。 */
const CACHE = 'jk-1184f08e';
const CORE = ['./', './index.html', './style.css', './app.js', './data.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon-180.png', './question-bank/index.html', './mnemonics/index.html', './mnemonics/img/mn_color.jpg', './mnemonics/img/mn_signs.jpg', './mnemonics/img/mn_signs_all.jpg', './mnemonics/img/mn_lights.jpg', './mnemonics/img/mn_marks.jpg', './mnemonics/img/mn_fine200.jpg', './answers/index.html'];
const IMAGES = [
  './img/ke1/004.jpg',
  './img/ke1/006.jpg',
  './img/ke1/007.jpg',
  './img/ke1/008.jpg',
  './img/ke1/009.jpg',
  './img/ke1/010.jpg',
  './img/ke1/011.jpg',
  './img/ke1/012.jpg',
  './img/ke1/013.jpg',
  './img/ke1/014.jpg',
  './img/ke1/015.jpg',
  './img/ke1/017.jpg',
  './img/ke1/018.jpg',
  './img/ke1/019.jpg',
  './img/ke1/020.jpg',
  './img/ke1/021.jpg',
  './img/ke1/022.jpg',
  './img/ke1/023.jpg',
  './img/ke1/024.jpg',
  './img/ke1/025.jpg',
  './img/ke1/026.jpg',
  './img/ke1/027.jpg',
  './img/ke1/028.jpg',
  './img/ke1/029.jpg',
  './img/ke1/030.jpg',
  './img/ke1/031.jpg',
  './img/ke1/032.jpg',
  './img/ke1/033.jpg',
  './img/ke1/035.jpg',
  './img/ke1/036.jpg',
  './img/ke1/037.jpg',
  './img/ke1/038.jpg',
  './img/ke1/039.jpg',
  './img/ke1/040.jpg',
  './img/ke1/041.jpg',
  './img/ke1/042.jpg',
  './img/ke1/043.jpg',
  './img/ke1/044.jpg',
  './img/ke1/045.jpg',
  './img/ke1/046.jpg',
  './img/ke1/047.jpg',
  './img/ke1/048.jpg',
  './img/ke1/049.jpg',
  './img/ke1/050.jpg',
  './img/ke1/051.jpg',
  './img/ke1/052.jpg',
  './img/ke1/053.jpg',
  './img/ke1/054.jpg',
  './img/ke1/055.jpg',
  './img/ke1/056.jpg',
  './img/ke1/057.jpg',
  './img/ke1/058.jpg',
  './img/ke1/059.jpg',
  './img/ke1/060.jpg',
  './img/ke1/061.jpg',
  './img/ke1/062.jpg',
  './img/ke1/063.jpg',
  './img/ke1/064.jpg',
  './img/ke1/065.jpg',
  './img/ke1/066.jpg',
  './img/ke1/067.jpg',
  './img/ke1/068.jpg',
  './img/ke1/069.jpg',
  './img/ke1/071.jpg',
  './img/ke1/072.jpg',
  './img/ke1/115.jpg',
  './img/ke1/117.jpg',
  './img/ke1/118.jpg',
  './img/ke1/119.jpg',
  './img/ke1/120.jpg',
  './img/ke1/121.jpg',
  './img/ke1/122.jpg',
  './img/ke1/123.jpg',
  './img/ke1/124.jpg',
  './img/ke1/125.jpg',
  './img/ke1/126.jpg',
  './img/ke1/127.jpg',
  './img/ke1/128.jpg',
  './img/ke1/130.jpg',
  './img/ke1/131.jpg',
  './img/ke1/132.jpg',
  './img/ke1/133.jpg',
  './img/ke1/134.jpg',
  './img/ke1/135.jpg',
  './img/ke1/136.jpg',
  './img/ke1/137.jpg',
  './img/ke1/138.jpg',
  './img/ke1/139.jpg',
  './img/ke1/140.jpg',
  './img/ke1/141.jpg',
  './img/ke1/144.jpg',
  './img/ke1/151.jpg',
  './img/ke1/152.jpg',
  './img/ke1/159.jpg',
  './img/ke1/161.jpg',
  './img/ke1/168.jpg',
  './img/ke1/169.jpg',
  './img/ke1/170.jpg',
  './img/ke1/171.jpg',
  './img/ke1/172.jpg',
  './img/ke1/173.jpg',
  './img/ke1/174.jpg',
  './img/ke1/178.jpg',
  './img/ke1/179.jpg',
  './img/ke1/180.jpg',
  './img/ke1/181.jpg',
  './img/ke1/182.jpg',
  './img/ke1/183.jpg',
  './img/ke1/184.jpg',
  './img/ke1/185.jpg',
  './img/ke1/186.jpg',
  './img/ke1/187.jpg',
  './img/ke1/188.jpg',
  './img/ke1/382.jpg',
  './img/ke1/383.jpg',
  './img/ke1/390.jpg',
  './img/ke1/391.jpg',
  './img/ke1/392.jpg',
  './img/ke1/393.jpg',
  './img/ke1/394.jpg',
  './img/ke1/395.jpg',
  './img/ke1/400.jpg',
  './img/ke1/401.jpg',
  './img/ke1/406.jpg',
  './img/ke1/414.jpg',
  './img/ke1/418.jpg',
  './img/ke1/439.jpg',
  './img/ke1/440.jpg',
  './img/ke1/441.jpg',
  './img/ke1/443.jpg',
  './img/ke1/447.jpg',
  './img/ke1/449.jpg',
  './img/ke1/450.jpg',
  './img/ke1/453.jpg',
  './img/ke1/458.jpg',
  './img/ke1/460.jpg',
  './img/ke1/461.jpg',
  './img/ke1/476.jpg',
  './img/ke1/477.jpg',
  './img/ke1/478.jpg',
  './img/ke1/479.jpg',
  './img/ke1/480.jpg',
  './img/ke1/486.jpg',
  './img/ke1/494.jpg',
  './img/ke1/495.jpg',
  './img/ke1/499.jpg',
  './img/ke1/500.jpg',
  './img/ke4/026.jpg',
  './img/ke4/027.jpg',
  './img/ke4/028.jpg',
  './img/ke4/034.jpg',
  './img/ke4/041.jpg',
  './img/ke4/042.jpg',
  './img/ke4/043.jpg',
  './img/ke4/044.jpg',
  './img/ke4/046.jpg',
  './img/ke4/048.jpg',
  './img/ke4/050.jpg',
  './img/ke4/051.jpg',
  './img/ke4/053.jpg',
  './img/ke4/054.jpg',
  './img/ke4/062.jpg',
  './img/ke4/064.jpg',
  './img/ke4/065.jpg',
  './img/ke4/066.jpg',
  './img/ke4/067.jpg',
  './img/ke4/068.jpg',
  './img/ke4/069.jpg',
  './img/ke4/070.jpg',
  './img/ke4/071.jpg',
  './img/ke4/072.jpg',
  './img/ke4/073.jpg',
  './img/ke4/076.jpg',
  './img/ke4/077.jpg',
  './img/ke4/078.jpg',
  './img/ke4/079.jpg',
  './img/ke4/081.jpg',
  './img/ke4/082.jpg',
  './img/ke4/083.jpg',
  './img/ke4/084.jpg',
  './img/ke4/085.jpg',
  './img/ke4/086.jpg',
  './img/ke4/087.jpg',
  './img/ke4/088.jpg',
  './img/ke4/089.jpg',
  './img/ke4/090.jpg',
  './img/ke4/091.jpg',
  './img/ke4/092.jpg',
  './img/ke4/093.jpg',
  './img/ke4/094.jpg',
  './img/ke4/095.jpg',
  './img/ke4/096.jpg',
  './img/ke4/097.jpg',
  './img/ke4/098.jpg',
  './img/ke4/099.jpg',
  './img/ke4/100.jpg',
  './img/ke4/101.jpg',
  './img/ke4/102.jpg',
  './img/ke4/103.jpg',
  './img/ke4/104.jpg',
  './img/ke4/105.jpg',
  './img/ke4/106.jpg',
  './img/ke4/107.jpg',
  './img/ke4/108.jpg',
  './img/ke4/109.jpg',
  './img/ke4/110.jpg',
  './img/ke4/111.jpg',
  './img/ke4/112.jpg',
  './img/ke4/113.jpg',
  './img/ke4/114.jpg',
  './img/ke4/115.jpg',
  './img/ke4/116.jpg',
  './img/ke4/117.jpg',
  './img/ke4/118.jpg',
  './img/ke4/119.jpg',
  './img/ke4/120.jpg',
  './img/ke4/121.jpg',
  './img/ke4/122.jpg',
  './img/ke4/123.jpg',
  './img/ke4/124.jpg',
  './img/ke4/125.jpg',
  './img/ke4/126.jpg',
  './img/ke4/127.jpg',
  './img/ke4/128.jpg',
  './img/ke4/129.jpg',
  './img/ke4/130.jpg',
  './img/ke4/131.jpg',
  './img/ke4/132.jpg',
  './img/ke4/133.jpg',
  './img/ke4/134.jpg',
  './img/ke4/135.jpg',
  './img/ke4/137.jpg',
  './img/ke4/138.jpg',
  './img/ke4/139.jpg',
  './img/ke4/147.jpg',
  './img/ke4/149.jpg',
  './img/ke4/150.jpg',
  './img/ke4/152.jpg',
  './img/ke4/153.jpg',
  './img/ke4/155.jpg',
  './img/ke4/161.jpg',
  './img/ke4/167.jpg',
  './img/ke4/170.jpg',
  './img/ke4/184.jpg',
  './img/ke4/246.jpg',
  './img/ke4/248.jpg',
  './img/ke4/252.jpg',
  './img/ke4/255.jpg',
  './img/ke4/256.jpg',
  './img/ke4/260.jpg',
  './img/ke4/261.jpg',
  './img/ke4/262.jpg',
  './img/ke4/263.jpg',
  './img/ke4/265.jpg',
  './img/ke4/266.jpg',
  './img/ke4/273.jpg',
  './img/ke4/277.jpg',
  './img/ke4/280.jpg',
  './img/ke4/283.jpg',
  './img/ke4/284.jpg',
  './img/ke4/286.jpg',
  './img/ke4/287.jpg',
  './img/ke4/291.jpg',
  './img/ke4/294.jpg',
  './img/ke4/295.jpg',
  './img/ke4/296.jpg',
  './img/ke4/301.jpg',
  './img/ke4/302.jpg',
  './img/ke4/304.jpg',
  './img/ke4/305.jpg',
  './img/ke4/306.jpg',
  './img/ke4/308.jpg',
  './img/ke4/309.jpg',
  './img/ke4/310.jpg',
  './img/ke4/316.jpg',
  './img/ke4/317.jpg',
  './img/ke4/321.jpg',
  './img/ke4/322.jpg',
  './img/ke4/326.jpg',
  './img/ke4/327.jpg',
  './img/ke4/328.jpg',
  './img/ke4/329.jpg',
  './img/ke4/330.jpg',
  './img/ke4/331.jpg',
  './img/ke4/332.jpg',
  './img/ke4/333.jpg',
  './img/ke4/334.jpg',
  './img/ke4/335.jpg',
  './img/ke4/337.jpg',
  './img/ke4/339.jpg',
  './img/ke4/340.jpg',
  './img/ke4/342.jpg',
  './img/ke4/343.jpg',
  './img/ke4/344.jpg',
  './img/ke4/346.jpg',
  './img/ke4/347.jpg',
  './img/ke4/349.jpg',
  './img/ke4/380.jpg',
  './img/ke4/399.jpg',
  './img/ke4/400.jpg',
  './img/ke4/401.jpg',
  './img/ke4/403.jpg',
  './img/ke4/407.jpg',
  './img/ke4/409.jpg',
  './img/ke4/411.jpg',
  './img/ke4/413.jpg',
  './img/ke4/416.jpg',
  './img/ke4/423.jpg',
  './img/ke4/424.jpg',
  './img/ke4/429.jpg',
  './img/ke4/430.jpg',
  './img/ke4/431.jpg',
  './img/ke4/432.jpg',
  './img/ke4/435.jpg',
  './img/ke4/436.jpg',
  './img/ke4/442.jpg',
  './img/ke4/445.jpg',
  './img/ke4/450.jpg',
  './img/ke4/451.jpg',
  './img/ke4/454.jpg',
  './img/ke4/455.jpg',
  './img/ke4/456.jpg',
  './img/ke4/459.jpg',
  './img/ke4/460.jpg',
  './img/ke4/461.jpg',
  './img/ke4/463.jpg',
  './img/ke4/466.jpg',
  './img/ke4/467.jpg',
  './img/ke4/473.jpg',
  './img/ke4/476.jpg',
  './img/ke4/477.jpg',
  './img/ke4/478.jpg',
  './img/ke4/480.jpg',
  './img/ke4/482.jpg',
  './img/ke4/483.jpg',
  './img/ke4/484.jpg'
];

/* 单个文件缓存（失败不抛错，避免整批中断） */
function putOne(cache, url) {
  return cache.match(url).then(function (hit) {
    if (hit) return null;
    return fetch(url, { cache: 'no-cache' }).then(function (res) {
      if (res && res.ok) return cache.put(url, res);
      return null;
    }).catch(function () { return null; });
  });
}

/* 分批并行预缓存：每批 8 张 —— 比串行快得多，又不会一次压 300 个请求 */
function precacheAll(cache, urls, batch) {
  var i = 0;
  function next() {
    if (i >= urls.length) return Promise.resolve();
    var chunk = urls.slice(i, i + batch);
    i += batch;
    return Promise.all(chunk.map(function (u) { return putOne(cache, u); })).then(next);
  }
  return next();
}

self.addEventListener('install', function (e) {
  /* 只预缓存核心文件就立刻 skipWaiting —— 新版本秒级接管。
     294 张题图不阻塞安装（否则安装要几十秒，期间旧版还在管页面，
     用户会看到「强刷是新的、普通刷新又变回旧的」）。 */
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(CORE).then(function () { return self.skipWaiting(); });
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); }).then(function () {
      // 接管之后再后台补缓存题图：即使中途被杀，漏掉的图也会走 fetch 兜底联网补上
      return caches.open(CACHE).then(function (c) { return precacheAll(c, IMAGES, 8); });
    })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // 跨域资源：网络优先，失败回退缓存
  if (url.origin !== location.origin) {
    e.respondWith(fetch(req).catch(function () { return caches.match(req); }));
    return;
  }

  /* 导航请求（打开页面）：网络优先 —— 在线时永远拿最新页面（修复旧版
     「一切导航都映射回主站首页」导致子页面打不开/刷新不到新版的问题）。
     注意必须带 cache:'no-cache'：GitHub Pages 给 HTML 发的是 max-age=600，
     不带这个参数时浏览器会直接吃 10 分钟的 HTTP 缓存，导致「刷新了还是旧版」。
     离线或网络失败时按原路径回退缓存；仅主站首页路径才用 index.html 兜底。 */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-cache' }).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var cp = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, cp); });
        }
        return res;
      }).catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (hit) {
          if (hit) return hit;
          // 仅当请求路径落在主站作用域根（无子路径）时才用首页兜底
          var path = url.pathname.replace(/\/+$/, '');
          var root = location.pathname.replace(/[^/]*$/, '').replace(/\/+$/, '');
          return path === root || path === '' ? caches.match('./index.html') : Response.error();
        });
      })
    );
    return;
  }

  /* 核心小文件（style.css / app.js）：网络优先 —— 它们必须与 HTML 同一版本，
     否则会渲染出「新 HTML + 旧 CSS」的混搭页（口诀速记卡片曾因此整卡丢样式）。
     文件很小（几十 KB），每次联网校验代价可忽略；离线时回退缓存。 */
  if (/\/style\.css$|\/app\.js$/.test(url.pathname)) {
    e.respondWith(
      fetch(req, { cache: 'no-cache' }).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var cp = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, cp); });
        }
        return res;
      }).catch(function () {
        return caches.match(req, { ignoreSearch: true });
      })
    );
    return;
  }

  // 其余同源资源：缓存优先 —— 命中就不联网
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var cp = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, cp); });
        }
        return res;
      }).catch(function () {
        return caches.match(req);
      });
    })
  );
});
