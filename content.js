/* JustAgro — підставляє вміст із content.json (редагується в admin.html) */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function digits(s) { return String(s || '').replace(/[^\d+]/g, ''); }
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function apply(c) {
    // контакти
    if (c.phone) {
      var tel = digits(c.phone);
      $$('a[href^="tel:"]').forEach(function (a) {
        if (tel.length >= 10) a.setAttribute('href', 'tel:' + tel);
        if (/\+380/.test(a.textContent)) a.textContent = c.phone;
      });
    }
    if (c.viber) $$('a[href^="viber:"]').forEach(function (a) { a.setAttribute('href', 'viber://chat?number=' + encodeURIComponent(digits(c.viber))); });
    if (c.telegram) $$('a[href^="https://t.me"]').forEach(function (a) { a.setAttribute('href', 'https://t.me/' + String(c.telegram).replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '')); });
    var cp = $('.contacts p.muted');
    if (cp) cp.innerHTML = esc(c.hours) + '<br>' + esc(c.email) + '<br>' + esc(c.address);
    var ft = $('.foot span:last-child');
    if (ft) ft.textContent = [c.address, c.email].filter(Boolean).join(' · ');

    // головний екран
    var h1 = $('#page-home .hero h1');
    if (h1 && c.hero_title) h1.innerHTML = esc(c.hero_title).replace(/\n/g, '<br>');
    var lead = $('#page-home .hero .lead');
    if (lead && c.hero_text) lead.textContent = c.hero_text;

    // ціни
    var pd = $('#page-prices .block > p.muted');
    if (pd) pd.textContent = 'Оновлено: ' + (c.prices_date || '') + '. Ціна в гривнях за тонну. Точна ціна залежить від якості, обсягу і відстані.';
    var tb = $('.prices tbody');
    if (tb && Array.isArray(c.prices)) {
      tb.innerHTML = c.prices.map(function (p) {
        return '<tr data-crop="' + esc(p.group || p.name) + '"><td>' + esc(p.name) + '</td><td>' + esc(p.spec) + '</td><td class="prices__v">' + esc(p.price) + '</td><td><a href="#contacts">Продати</a></td></tr>';
      }).join('');
    }

    // прийомки
    if (Array.isArray(c.points)) {
      var ul = $('.points__list');
      if (ul) ul.innerHTML = c.points.map(function (p, i) {
        return '<li><span class="pin">' + (i + 1) + '</span><div><b>' + esc(p.name) + '</b><br><span class="muted">' + esc(p.addr) + '</span></div></li>';
      }).join('');
      if (window.JA_renderPoints) window.JA_renderPoints(c.points.filter(function (p) { return isFinite(p.lat) && isFinite(p.lng); }).map(function (p, i) {
        return { n: i + 1, name: p.name, addr: p.addr, ll: [Number(p.lat), Number(p.lng)] };
      }));
    }

    // про нас
    var ab = $('#page-about .lead');
    if (ab && c.about) ab.textContent = c.about;
    if (Array.isArray(c.features)) $$('#page-about .grid3 .card').forEach(function (card, i) {
      var f = c.features[i]; if (!f) { card.hidden = true; return; }
      card.hidden = false; card.querySelector('h3').textContent = f.title; card.querySelector('p').textContent = f.text;
    });

    // вигляд
    if (c.accent && /^#[0-9a-f]{6}$/i.test(c.accent)) {
      var st = document.getElementById('ja-accent') || document.head.appendChild(Object.assign(document.createElement('style'), { id: 'ja-accent' }));
      st.textContent = ':root,[data-theme="dark"]{--gold:' + c.accent + ';--gold-text:' + c.accent + '}' +
        '[data-theme="light"]{--gold:' + c.accent + ';--gold-text:color-mix(in srgb,' + c.accent + ' 62%,#000)}';
    }
    var stored = null; try { stored = localStorage.getItem('theme'); } catch (e) {}
    if (!stored && (c.default_theme === 'light' || c.default_theme === 'dark')) {
      document.documentElement.setAttribute('data-theme', c.default_theme);
      var lb = $('.theme__label'); if (lb) lb.textContent = c.default_theme === 'dark' ? 'Світла тема' : 'Темна тема';
    }
    var tr = $('.tabs__link[data-tab="track"]');
    if (tr) {
      tr.hidden = c.show_track === false;
      if (c.show_track === false && location.hash === '#track') location.hash = '#home';
    }
  }

  // «Продати» у таблиці → підставити культуру у форму
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.prices a[href="#contacts"]');
    if (!a) return;
    var f = document.getElementById('fCrop'); if (f) f.value = a.closest('tr').cells[0].textContent + ', ';
  });

  var preview = /[?&]preview=1/.test(location.search);
  if (preview) {
    try {
      var d = JSON.parse(localStorage.getItem('ja_preview') || 'null');
      if (d) {
        apply(d);
        var b = document.createElement('div');
        b.textContent = 'Попередній перегляд — зміни ще не опубліковані';
        b.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;background:#111;color:#fff;padding:10px 18px;border-radius:999px;font:600 14px Montserrat,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.3)';
        document.body.appendChild(b);
        return;
      }
    } catch (e) {}
  }
  fetch('content.json?t=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (c) { if (c) apply(c); })
    .catch(function () {});
})();
