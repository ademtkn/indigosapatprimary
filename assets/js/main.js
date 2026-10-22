(function () {
  // Remember language choice for the root chooser
  document.querySelectorAll('[data-lang]').forEach(function (a) {
    a.addEventListener('click', function () { try { localStorage.setItem('indigosapat-lang', a.dataset.lang); } catch (e) {} });
  });

  // Mobile navigation
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('site-nav');
  if (burger && nav) {
    var setOpen = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
      burger.querySelector('.sr').textContent = open ? burger.dataset.close : burger.dataset.open;
    };
    burger.addEventListener('click', function () { setOpen(burger.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1240) setOpen(false); });
  }

  // Staff filter
  var filters = document.querySelectorAll('.filter');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.dataset.filter;
      filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      document.querySelectorAll('[data-dept-block]').forEach(function (block) {
        block.hidden = !(f === 'all' || block.dataset.deptBlock === f);
      });
    });
  });

  // Copy phone numbers
  document.querySelectorAll('.copy').forEach(function (btn) {
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      var done = function () { btn.textContent = btn.dataset.done; setTimeout(function () { btn.textContent = label; }, 1600); };
      var fallback = function () {
        var r = document.createRange(); r.selectNodeContents(btn.previousElementSibling);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(btn.dataset.copy).then(done, fallback);
      } else { fallback(); }
    });
  });

  // Contact form → WhatsApp message (link is updated as the visitor types).
  // Without a WhatsApp number the text is copied and Instagram Direct opens instead.
  var form = document.getElementById('contact-form');
  if (form) {
    var send = document.getElementById('cf-send');
    var hint = document.getElementById('cf-hint');
    var text = '';
    var update = function () {
      var d = new FormData(form);
      var lines = [form.dataset.intro];
      form.querySelectorAll('[name]').forEach(function (el) {
        var v = String(d.get(el.name) || '').trim();
        var label = form.querySelector('label[for="' + el.id + '"]');
        if (v && label) lines.push(label.textContent + ': ' + v);
      });
      text = lines.join('\n');
      if (form.dataset.wa) send.href = 'https://wa.me/' + form.dataset.wa + '?text=' + encodeURIComponent(text);
    };
    if (!form.dataset.wa) {
      send.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { if (hint) hint.textContent = hint.dataset.copied; }, function () {});
        }
      });
    }
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    update();
  }

  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
