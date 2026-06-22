/*
  Seym display currency converter.
  Store prices live in TRY. When the shopper picks USD/EUR we convert the
  displayed amount client-side using a live (free, no-key) FX rate and keep
  TRY as the real checkout currency. Markets is NOT used here.

  Markup contract: any price element carries class "seym-money" and a
  data-base attribute holding the amount in TRY *cents* (Shopify `price`).
*/
(function () {
  'use strict';

  var BASE = 'TRY';
  var STORE_KEY = 'seym-currency';
  var RATE_KEY = 'seym-currency-rates';
  var RATE_TTL = 12 * 60 * 60 * 1000; // 12h
  var LOCALE = (document.documentElement.lang || 'en').indexOf('tr') === 0 ? 'tr-TR' : 'en-US';

  var CURRENCIES = {
    TRY: { code: 'TRY', symbol: '₺' },
    USD: { code: 'USD', symbol: '$' },
    EUR: { code: 'EUR', symbol: '€' }
  };

  // Fallback rates (1 TRY -> X) used only if the API is unreachable.
  var FALLBACK = { TRY: 1, USD: 0.024, EUR: 0.022 };

  var rates = FALLBACK;
  var current = BASE;
  var observer = null;

  function getStored() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function setStored(v) {
    try { localStorage.setItem(STORE_KEY, v); } catch (e) {}
  }

  function loadCachedRates() {
    try {
      var raw = localStorage.getItem(RATE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || (Date.now() - obj.t) > RATE_TTL) return null;
      return obj.r;
    } catch (e) { return null; }
  }
  function saveRates(r) {
    try { localStorage.setItem(RATE_KEY, JSON.stringify({ t: Date.now(), r: r })); } catch (e) {}
  }

  function fetchRates() {
    var urls = [
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/try.json',
      'https://latest.currency-api.pages.dev/v1/currencies/try.json'
    ];
    function tryUrl(i) {
      if (i >= urls.length) return Promise.reject();
      return fetch(urls[i]).then(function (r) {
        if (!r.ok) throw new Error('bad');
        return r.json();
      }).catch(function () { return tryUrl(i + 1); });
    }
    return tryUrl(0).then(function (data) {
      var t = data && data.try;
      if (!t) throw new Error('no rates');
      var r = { TRY: 1 };
      if (typeof t.usd === 'number') r.USD = t.usd;
      if (typeof t.eur === 'number') r.EUR = t.eur;
      return r;
    });
  }

  function formatMoney(cents, code) {
    var amount = (cents / 100) * (rates[code] || FALLBACK[code] || 1);
    try {
      return new Intl.NumberFormat(LOCALE, {
        style: 'currency',
        currency: code,
        minimumFractionDigits: code === 'TRY' ? 2 : 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (e) {
      var sym = (CURRENCIES[code] || {}).symbol || '';
      return sym + amount.toFixed(2);
    }
  }

  function convertAll() {
    // Pause the observer so our own edits don't retrigger conversion.
    if (observer) observer.disconnect();
    var els = document.querySelectorAll('.seym-money');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var base = parseInt(el.getAttribute('data-base'), 10);
      if (isNaN(base)) continue;
      // Remember the server-rendered TRY string so TRY is always exact.
      if (!el.hasAttribute('data-try-html')) {
        el.setAttribute('data-try-html', el.innerHTML);
      }
      if (current === BASE) {
        el.innerHTML = el.getAttribute('data-try-html');
      } else {
        el.textContent = formatMoney(base, current);
      }
    }
    if (observer) observer.observe(document.body, { childList: true, subtree: true });
  }

  function updateUI() {
    // Active states on every currency button.
    var btns = document.querySelectorAll('[data-currency]');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var on = b.getAttribute('data-currency') === current;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-current', on ? 'true' : 'false');
    }
    // Header label "EN · TRY".
    var labels = document.querySelectorAll('[data-cur-label]');
    for (var j = 0; j < labels.length; j++) { labels[j].textContent = current; }
    // "charged in TRY" note — only when a non-TRY display currency is active.
    var notes = document.querySelectorAll('[data-currency-note]');
    for (var k = 0; k < notes.length; k++) { notes[k].hidden = (current === BASE); }
  }

  function setCurrency(code) {
    if (!CURRENCIES[code]) return;
    current = code;
    setStored(code);
    convertAll();
    updateUI();
  }

  // Re-convert when new price nodes appear (cart drawer, quick add, ajax).
  var pending = null;
  function scheduleConvert() {
    if (pending) return;
    pending = requestAnimationFrame(function () {
      pending = null;
      if (current !== BASE) convertAll();
    });
  }

  function init() {
    current = getStored() || BASE;

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-currency]');
      if (!btn) return;
      e.preventDefault();
      setCurrency(btn.getAttribute('data-currency'));
    });

    var cached = loadCachedRates();
    if (cached) { rates = cached; }

    convertAll();
    updateUI();

    if (!cached) {
      fetchRates().then(function (r) {
        rates = r; saveRates(r);
        if (current !== BASE) convertAll();
      }).catch(function () { /* keep fallback */ });
    }

    if ('MutationObserver' in window) {
      observer = new MutationObserver(scheduleConvert);
      observer.observe(document.body, { childList: true, subtree: true });
    }
    document.addEventListener('cart:refresh', scheduleConvert);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
