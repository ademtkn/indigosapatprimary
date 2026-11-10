// Indigo Sapat Primary — admin panel.
// Edits content/*.json in the GitHub repository and publishes every change as one commit;
// the GitHub Actions workflow then rebuilds the site (node src/build.mjs) and deploys it.
// No server: the browser talks to the GitHub API with the editor's own fine-grained token.
(function () {
  'use strict';
  var I = window.ADMIN_I18N, CFG = window.ADMIN_CONFIG || {};
  var LANGS = ['ky', 'ru', 'en'], LI = { ky: 0, ru: 1, en: 2 };
  var FILES = {
    ky: 'content/ky.json', ru: 'content/ru.json', en: 'content/en.json', site: 'content/site.json',
    staff: 'content/staff.json', menu: 'content/menu.json', news: 'content/news.json', images: 'content/images.json',
    editors: 'content/editors.json',
  };
  var AUTH = window.ADMIN_AUTH;
  var PAGE_KEYS = ['home', 'about', 'academics', 'programs', 'admissions', 'life', 'staff', 'news', 'contact', '_common', 'ai', 'root'];
  var MULTI = ['body', 'd', 'a', 'lead', 'descr', 'why', 'short', 'shared', 'hello', 'noAnswer', 'error', 'disclaimer', 'bodyIg', 'mapBody'];
  var HIDDEN = ['icon', 'code', 'htmlLang', 'label', 'langName', 'ogLocale'];
  // Where each photo slot appears on the site: [ky, ru, en]
  var SLOTS = {
    'home-welcome': ['Башкы бет — кош келиңиз', 'Главная — приветствие', 'Home — welcome'],
    'stage-1': ['1–2-класстар', '1–2 классы', 'Grades 1–2'], 'stage-2': ['3–4-класстар', '3–4 классы', 'Grades 3–4'], 'stage-3': ['5–6-класстар', '5–6 классы', 'Grades 5–6'],
    english: ['Англис тили бөлүгү', 'Блок «Английский»', 'English block'],
    'life-1': ['Мектеп турмушу — 1 (чоң)', 'Школьная жизнь — 1 (большое)', 'School life — 1 (large)'], 'life-2': ['Мектеп турмушу — 2', 'Школьная жизнь — 2', 'School life — 2'], 'life-3': ['Мектеп турмушу — 3', 'Школьная жизнь — 3', 'School life — 3'],
    'about-story': ['Мектеп жөнүндө — тарых', 'О школе — история', 'About — story'], director: ['Директордун сүрөтү', 'Фото директора', 'Director photo'],
    languages: ['Окуу — тилдер', 'Обучение — языки', 'Academics — languages'],
    'english-math': ['Программалар — English Maths', 'Программы — English Maths', 'Programs — English Maths'], robotics: ['Программалар — робототехника', 'Программы — робототехника', 'Programs — robotics'],
    chess: ['Программалар — шахмат', 'Программы — шахматы', 'Programs — chess'], 'magic-science': ['Программалар — Magic Science', 'Программы — Magic Science', 'Programs — Magic Science'],
    'news-instagram': ['Жаңылыктар — Instagram', 'Новости — Instagram', 'News — Instagram'], 'news-2gis': ['Жаңылыктар — 2GIS', 'Новости — 2GIS', 'News — 2GIS'],
  };

  // ---------- small helpers ----------
  var store = function (s) {
    return {
      get: function (k) { try { return s.getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { s.setItem(k, v); return true; } catch (e) { return false; } },
      del: function (k) { try { s.removeItem(k); } catch (e) {} },
    };
  };
  var local = store(window.localStorage), session = store(window.sessionStorage);
  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return [].slice.call((el || document).querySelectorAll(sel)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var humanize = function (k) { return String(k).replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, function (c) { return c.toUpperCase(); }); };
  var getAt = function (o, p) { for (var i = 0; i < p.length && o != null; i++) o = o[p[i]]; return o; };
  var setAt = function (o, p, v) {
    for (var i = 0; i < p.length - 1; i++) { if (o[p[i]] == null) o[p[i]] = typeof p[i + 1] === 'number' ? [] : {}; o = o[p[i]]; }
    o[p[p.length - 1]] = v;
  };
  var today = function () { var d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  var uid = function (pre) { return pre + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); };

  var ui = local.get('isp-admin-lang') || (/^ky/.test(navigator.language) ? 'ky' : /^ru/.test(navigator.language) ? 'ru' : 'en');
  if (!LI.hasOwnProperty(ui)) ui = 'en';
  var T = function (k) { var v = I.UI[ui][k]; return v == null ? I.UI.en[k] : v; };
  var secName = function (k) { return (I.SECTIONS[k] || [])[LI[ui]] || (I.FIELDS[k] || [])[LI[ui]] || humanize(k); };
  var fieldName = function (k) { return (I.FIELDS[k] || [])[LI[ui]] || (I.SECTIONS[k] || [])[LI[ui]] || humanize(k); };
  var ico = function (d) { return '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
  var IC = {
    home: ico('<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>'),
    doc: ico('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>'),
    menu: ico('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    news: ico('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>'),
    users: ico('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.6c2.4.3 4 2.1 4.5 4.9"/>'),
    image: ico('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>'),
    gear: ico('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'),
    up: ico('<path d="M12 19V5M6 11l6-6 6 6"/>'), down: ico('<path d="M12 5v14M6 13l6 6 6-6"/>'),
    trash: ico('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'), plus: ico('<path d="M12 5v14M5 12h14"/>'),
    eye: ico('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    ext: ico('<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>'), out: ico('<path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 16l4-4-4-4M14 12H3"/>'),
    upload: ico('<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>'), copy: ico('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>'),
    link: ico('<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>'),
    burger: ico('<path d="M4 7h16M4 12h16M4 17h16"/>'), key: ico('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>'), rocket: ico('<path d="M5 15c-1 1-2 4-2 6 2 0 5-1 6-2M9 15l-3-3c1-4 5-9 12-9 0 7-5 11-9 12z"/><circle cx="15" cy="9" r="1.5"/>'),
    search: ico('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  };

  // ---------- GitHub API ----------
  var params = new URLSearchParams(location.search);
  var API = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(params.get('api') || '') ? params.get('api') : 'https://api.github.com'; // local test server only
  var gh = {
    token: '', repo: '', branch: 'main',
    req: function (method, path, body, accept) {
      return fetch(API + path, {
        method: method, cache: 'no-store',
        headers: Object.assign({ Authorization: 'Bearer ' + gh.token, Accept: accept || 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
          body ? { 'Content-Type': 'application/json' } : {}),
        body: body ? JSON.stringify(body) : undefined,
      }).then(function (r) {
        if (!r.ok) return r.text().then(function (t) { var e = new Error('GitHub ' + r.status + ': ' + t.slice(0, 200)); e.status = r.status; throw e; });
        return accept && accept.indexOf('raw') > -1 ? r.text() : r.json();
      });
    },
    rp: function (s) { return '/repos/' + gh.repo + s; },
    file: function (p) { return gh.req('GET', gh.rp('/contents/' + p.split('/').map(encodeURIComponent).join('/') + '?ref=' + encodeURIComponent(gh.branch)), null, 'application/vnd.github.raw+json'); },
    head: function () { return gh.req('GET', gh.rp('/git/ref/heads/' + encodeURIComponent(gh.branch))).then(function (r) { return r.object.sha; }); },
    // Path → blob sha of every file in the commit (to send only files that changed)
    tree: function (commitSha) {
      return gh.req('GET', gh.rp('/git/commits/' + commitSha)).then(function (c) {
        return gh.req('GET', gh.rp('/git/trees/' + c.tree.sha + '?recursive=1'));
      }).then(function (t) {
        var m = {}; (t.tree || []).forEach(function (e) { if (e.type === 'blob') m[e.path] = e.sha; }); return m;
      });
    },
    // One commit for all files: [{ path, content, encoding: 'utf-8' | 'base64' }]; equal contents share one blob
    commit: function (files, message, parent) {
      var tree, made = {};
      return gh.req('GET', gh.rp('/git/commits/' + parent)).then(function (c) {
        tree = c.tree.sha;
        return files.reduce(function (p, f) {
          return p.then(function (acc) {
            var key = f.encoding + ':' + f.content;
            var blob = made[key] ? Promise.resolve(made[key]) : gh.req('POST', gh.rp('/git/blobs'), { content: f.content, encoding: f.encoding }).then(function (b) { return (made[key] = b.sha); });
            return blob.then(function (sha) { return acc.concat({ path: f.path, mode: '100644', type: 'blob', sha: sha }); });
          });
        }, Promise.resolve([]));
      }).then(function (entries) {
        return gh.req('POST', gh.rp('/git/trees'), { base_tree: tree, tree: entries });
      }).then(function (t) {
        return gh.req('POST', gh.rp('/git/commits'), { message: message, tree: t.sha, parents: [parent] });
      }).then(function (c) {
        return gh.req('PATCH', gh.rp('/git/refs/heads/' + encodeURIComponent(gh.branch)), { sha: c.sha }).then(function () { return c.sha; });
      });
    },
    lastRun: function () {
      return gh.req('GET', gh.rp('/actions/runs?branch=' + encodeURIComponent(gh.branch) + '&per_page=1')).then(function (r) { return (r.workflow_runs || [])[0] || null; });
    },
  };

  // ---------- state ----------
  // pending: uploaded images not yet published, path → { b64, url }; shown: published in this session (preview until the site rebuilds)
  var S = { data: {}, orig: {}, sha: null, pending: {}, shown: {}, me: {} };
  var ser = function (k) { return JSON.stringify(S.data[k], null, 2) + '\n'; };
  var referencedUploads = function () {
    var out = {};
    (function walk(v) {
      if (typeof v === 'string') { if (S.pending[v]) out[v] = 1; }
      else if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { walk(v[k]); });
    })([S.data.images, S.data.staff, S.data.news]);
    return Object.keys(out);
  };
  var changed = function () {
    return Object.keys(FILES).filter(function (k) { return S.data[k] !== undefined && ser(k) !== S.orig[k]; });
  };
  var changeCount = function () { return changed().length + referencedUploads().length; };
  var draftKey = function () { return 'isp-admin-draft:' + gh.repo + '@' + gh.branch; };
  var draftTimer = null;
  function touched() {
    updatePublish();
    clearTimeout(draftTimer);
    draftTimer = setTimeout(function () {
      if (!changed().length) { local.del(draftKey()); return; }
      var d = {}; changed().forEach(function (k) { d[k] = S.data[k]; });
      local.set(draftKey(), JSON.stringify({ sha: S.sha, data: d }));
    }, 600);
  }

  // ---------- shell ----------
  var root = document.getElementById('admin');
  function toast(msg, kind) {
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' toast--' + kind : ''); el.textContent = msg; el.setAttribute('role', 'status');
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 400); }, kind === 'err' ? 7000 : 3800);
  }
  function langSwitch() {
    return '<div class="uilang" role="group" aria-label="Language">' + LANGS.map(function (l) {
      return '<button type="button" data-ui="' + l + '"' + (l === ui ? ' aria-pressed="true"' : ' aria-pressed="false"') + ' title="' + esc(I.UI[l].langNames[l]) + '">' + I.UI.en.langs[l] + '</button>';
    }).join('') + '</div>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ui]');
    if (!b) return;
    ui = b.dataset.ui; local.set('isp-admin-lang', ui); document.documentElement.lang = ui;
    if (S.sha) { shell(); route(); } else login();
  });

  // ---------- login ----------
  // Editors sign in with username + password (admin/editors.json, see auth.js);
  // the site owner can also sign in with a GitHub token (first set-up, or when no editor is left).
  var FAILS = 'isp-admin-fails';
  function waitLeft() {
    var f = {}; try { f = JSON.parse(local.get(FAILS) || '{}'); } catch (e) {}
    return Math.max(0, Math.ceil(((f.until || 0) - Date.now()) / 1000));
  }
  function failed() {
    var f = {}; try { f = JSON.parse(local.get(FAILS) || '{}'); } catch (e) {}
    f.n = (f.n || 0) + 1;
    if (f.n >= 5) f.until = Date.now() + Math.min(600, 30 * Math.pow(2, f.n - 5)) * 1000; // 30 s, 60 s, … up to 10 min
    local.set(FAILS, JSON.stringify(f));
  }
  function saveAuth(auth, remember) {
    local.del('isp-admin-auth'); session.del('isp-admin-auth');
    (remember ? local : session).set('isp-admin-auth', JSON.stringify(auth));
  }
  function login(err, prefill) {
    document.documentElement.lang = ui;
    prefill = prefill || {};
    var saved = {}; try { saved = JSON.parse(local.get('isp-admin-auth') || session.get('isp-admin-auth') || '{}'); } catch (e) {}
    root.innerHTML = '<div class="login"><div class="login-card">' +
      '<div class="login-top"><img src="../assets/img/logo.png" alt="Indigo Sapat" width="120">' + langSwitch() + '</div>' +
      '<h1>' + esc(T('appName')) + '</h1><p class="muted">' + esc(T('loginHelp')) + '</p>' +
      (err ? '<p class="alert" role="alert">' + esc(err) + '</p>' : '') +
      '<form id="login-form" class="login-form">' +
      '<label>' + esc(T('username')) + '<input name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required value="' + esc(prefill.username || (saved.user && saved.user.username) || '') + '"></label>' +
      '<label>' + esc(T('password')) + '<input name="password" type="password" autocomplete="current-password" maxlength="6" required></label>' +
      '<label class="check"><input type="checkbox" name="remember" checked> ' + esc(T('remember')) + '</label>' +
      '<button class="btn btn--primary btn--block" type="submit">' + esc(T('signIn')) + '</button></form>' +
      '<details class="howto"' + (prefill.owner ? ' open' : '') + '><summary>' + esc(T('ownerLogin')) + '</summary>' +
      '<form id="owner-form" class="login-form"><p>' + esc(T('ownerHelp')) + '</p>' +
      '<label>' + esc(T('token')) + '<input name="token" type="password" autocomplete="off" required placeholder="github_pat_…"></label>' +
      '<div class="row2"><label>' + esc(T('repo')) + '<input name="repo" required value="' + esc(CFG.repo || '') + '"></label>' +
      '<label>' + esc(T('branch')) + '<input name="branch" required value="' + esc(CFG.branch || 'main') + '"></label></div>' +
      '<button class="btn btn--light btn--block" type="submit">' + esc(T('signIn')) + '</button>' +
      '<ol>' + T('tokenSteps').map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new ↗</a></form></details>' +
      '</div></div>';
    $('#login-form').addEventListener('submit', function (e) { e.preventDefault(); passwordLogin(e.target); });
    $('#owner-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target, auth = { mode: 'token', token: f.token.value.trim(), repo: f.repo.value.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, ''), branch: f.branch.value.trim() };
      saveAuth(auth, false);
      start(auth);
    });
  }
  function passwordLogin(f) {
    var username = f.username.value.trim().toLowerCase(), password = f.password.value, remember = f.remember.checked;
    var wait = waitLeft();
    if (wait) { login(T('tooMany').replace('{s}', wait), { username: username }); return; }
    var b = f.querySelector('button'); b.disabled = true; b.textContent = T('checking');
    fetch('editors.json?ts=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }, function () { return {}; }).then(function (db) {
      var rec = (db.editors || []).filter(function (x) { return x.username === username; })[0];
      if (!db.vault || !(db.editors || []).length) throw 'none';
      if (!rec) throw 'bad';
      return AUTH.unlock(rec, password).then(function (key) {
        return AUTH.openVault(key, db.vault).then(function (token) { return { token: token, key: key, rec: rec }; });
      });
    }).then(function (r) {
      local.del(FAILS);
      var auth = { mode: 'password', token: r.token, repo: CFG.repo, branch: CFG.branch || 'main', k: AUTH.b64(r.key), user: { username: r.rec.username, name: r.rec.name, role: r.rec.role } };
      saveAuth(auth, remember);
      start(auth);
    }).catch(function (e) {
      if (e === 'none') { login(T('noEditorsYet'), { owner: true }); return; }
      failed();
      var w = waitLeft();
      login(w ? T('tooMany').replace('{s}', w) : T('badLogin'), { username: username });
    });
  }

  function start(auth) {
    gh.token = auth.token; gh.repo = auth.repo; gh.branch = auth.branch || 'main';
    S.me = { mode: auth.mode || 'token', user: auth.user || null, k: auth.k ? AUTH.unb64(auth.k) : null };
    root.innerHTML = '<div class="login"><p class="loading">' + esc(T('loading')) + '</p></div>';
    gh.head().then(function (sha) {
      S.sha = sha;
      var keys = Object.keys(FILES);
      return Promise.all(keys.map(function (k) {
        return gh.file(FILES[k]).catch(function (e) { if (e.status === 404 && k === 'editors') return '{"vault":null,"editors":[]}'; throw e; });
      })).then(function (texts) {
        keys.forEach(function (k, i) { S.data[k] = JSON.parse(texts[i]); S.orig[k] = ser(k); });
      });
    }).then(function () {
      var draft = null; try { draft = JSON.parse(local.get(draftKey()) || 'null'); } catch (e) {}
      if (draft && draft.sha === S.sha && confirm(T('draftFound'))) Object.keys(draft.data).forEach(function (k) { S.data[k] = draft.data[k]; });
      else local.del(draftKey());
      shell(); route();
    }).catch(function (e) {
      S.sha = null;
      login(T('loginFailed') + ' (' + (e.status || e.message) + ')', { owner: S.me.mode === 'token' });
    });
  }

  function signOut() {
    if (changeCount() && !confirm(T('leaveWarn') + ' ' + T('discardConfirm'))) return;
    local.del('isp-admin-auth'); session.del('isp-admin-auth'); local.del(draftKey());
    S = { data: {}, orig: {}, sha: null, pending: {}, shown: {}, me: {} };
    location.hash = ''; login();
  }

  function shell() {
    document.documentElement.lang = ui;
    var nav = [
      ['#/', IC.home, T('dashboard')], ['#/pages/home', IC.doc, T('pages')], ['#/menu', IC.menu, T('menu')], ['#/news', IC.news, T('news')],
      ['#/staff', IC.users, T('staff')], ['#/media', IC.image, T('media')], ['#/settings', IC.gear, T('settings')], ['#/editors', IC.key, T('editors')],
    ];
    var site = (S.data.site && S.data.site.url) || '../';
    root.innerHTML =
      '<header class="top"><button class="iconbtn burger" type="button" aria-label="Menu" aria-expanded="false">' + IC.burger + '</button>' +
      '<a class="top-brand" href="#/"><img src="../assets/img/logo.png" alt="" width="64"><span>' + esc(T('appName')) + '</span></a>' +
      '<div class="top-tools">' + langSwitch() +
      '<a class="btn btn--ghost btn--sm hide-sm" href="' + esc(site) + '" target="_blank" rel="noopener">' + IC.ext + '<span>' + esc(T('viewSite')) + '</span></a>' +
      '<button class="btn btn--primary btn--sm" type="button" id="publish">' + IC.rocket + '<span>' + esc(T('publish')) + '</span><b class="count" hidden></b></button>' +
      '<button class="iconbtn" type="button" id="signout" title="' + esc(T('signOut')) + '" aria-label="' + esc(T('signOut')) + '">' + IC.out + '</button></div></header>' +
      '<div class="layout"><aside class="side" id="side"><nav>' + nav.map(function (n) {
        return '<a href="' + n[0] + '" data-nav="' + n[0].split('/')[1] + '">' + n[1] + '<span>' + esc(n[2]) + '</span></a>' +
          (n[0] === '#/pages/home' ? '<div class="subnav">' + PAGE_KEYS.map(function (k) { return '<a href="#/pages/' + k + '" data-page="' + k + '">' + esc(pageName(k)) + '</a>'; }).join('') + '</div>' : '');
      }).join('') + '</nav><p class="side-foot">' + esc(T('signedInAs')) + ': <b>' + esc(S.me.user ? (S.me.user.name || S.me.user.username) + ' (' + S.me.user.username + ')' : T('owner')) + '</b><br>' + esc(gh.repo) + ' · ' + esc(gh.branch) + '</p></aside>' +
      '<main class="main" id="view"></main></div>';
    $('#publish').addEventListener('click', publishDialog);
    $('#signout').addEventListener('click', signOut);
    var burger = $('.burger');
    burger.addEventListener('click', function () {
      var open = !document.body.classList.contains('side-open');
      document.body.classList.toggle('side-open', open); burger.setAttribute('aria-expanded', String(open));
    });
    $('#side').addEventListener('click', function (e) { if (e.target.closest('a')) document.body.classList.remove('side-open'); });
    updatePublish();
  }
  function pageName(k) {
    if (k === '_common') return T('commonTexts');
    if (k === 'ai') return T('assistantTexts');
    if (k === 'root') return T('rootTexts');
    return (S.data[ui] && S.data[ui].nav[k]) || humanize(k);
  }
  function updatePublish() {
    var b = $('#publish'); if (!b) return;
    var n = changeCount(), c = b.querySelector('.count');
    c.hidden = !n; c.textContent = n; b.disabled = !n;
    b.title = n ? n + ' ' + T('unsaved') : T('noChanges');
  }
  window.addEventListener('beforeunload', function (e) { if (S.sha && changeCount()) { e.preventDefault(); e.returnValue = T('leaveWarn'); } });

  // ---------- routing ----------
  window.addEventListener('hashchange', function () { if (S.sha) route(); });
  function route() {
    var h = location.hash.replace(/^#\/?/, '').split('/');
    var view = $('#view'); if (!view) return;
    $$('#side [data-nav]').forEach(function (a) { a.classList.toggle('on', a.dataset.nav === (h[0] || '')); });
    $$('#side [data-page]').forEach(function (a) { a.classList.toggle('on', h[0] === 'pages' && a.dataset.page === h[1]); });
    var y = view.dataset.route === location.hash ? window.scrollY : 0;
    view.dataset.route = location.hash;
    var r = { '': dashboard, pages: pagesView, menu: menuView, news: newsView, staff: staffView, media: mediaView, settings: settingsView, editors: editorsView }[h[0]] || dashboard;
    view.innerHTML = r(h[1]);
    afterRender(view);
    window.scrollTo(0, y);
  }
  var rerender = route;

  // ---------- building blocks ----------
  var pAttr = function (f, p) { return ' data-f="' + f + '" data-p="' + esc(JSON.stringify(p)) + '"'; };
  function input(f, p, value, opts) {
    opts = opts || {};
    var a = pAttr(f, p) + (opts.ph ? ' placeholder="' + esc(opts.ph) + '"' : '') + (opts.lang ? ' lang="' + opts.lang + '"' : '');
    if (opts.type === 'check') return '<input type="checkbox"' + a + (value ? ' checked' : '') + '>';
    if (opts.multi) return '<textarea rows="2"' + a + '>' + esc(value) + '</textarea>';
    return '<input type="' + (opts.type || 'text') + '"' + a + ' value="' + esc(value) + '">';
  }
  // A text in three languages. get(l) → path in file l (lang files) or in `file` with the language at the end.
  function tri(label, pathFor, file, opts) {
    opts = opts || {};
    var vals = LANGS.map(function (l) { return getAt(S.data[file || l], pathFor(l)); });
    var multi = opts.multi || vals.some(function (v) { return String(v || '').length > 70 || /\n/.test(v || ''); });
    var search = vals.join(' ').toLowerCase() + ' ' + String(label).toLowerCase();
    return '<div class="fld" data-s="' + esc(search) + '"><div class="fld-label">' + esc(label) + (opts.hint ? ' <small>' + esc(opts.hint) + '</small>' : '') +
      (opts.copy ? ' <button type="button" class="mini" data-copyall="' + esc(JSON.stringify({ f: file, p: pathFor('ky').slice(0, -1) })) + '">' + IC.copy + esc(T('sameName')) + '</button>' : '') + '</div>' +
      LANGS.map(function (l, i) {
        return '<label class="lrow"><span class="ltag" title="' + esc(T('langNames')[l]) + '">' + T('langs')[l] + '</span>' + input(file || l, pathFor(l), vals[i], { multi: multi, lang: l }) + '</label>';
      }).join('') + '</div>';
  }
  function single(label, f, p, opts) {
    opts = opts || {};
    return '<div class="fld" data-s="' + esc(String(getAt(S.data[f], p) || '').toLowerCase() + ' ' + label.toLowerCase()) + '"><label class="fld-label" >' + esc(label) +
      (opts.hint ? ' <small>' + esc(opts.hint) + '</small>' : '') + '</label>' + input(f, p, getAt(S.data[f], p), opts) + '</div>';
  }
  function tools(f, p, i, n, extra) {
    return '<span class="tools">' + (extra || '') +
      '<button type="button" class="iconbtn sm" data-act="up"' + pAttr(f, p) + ' data-i="' + i + '"' + (i === 0 ? ' disabled' : '') + ' title="' + esc(T('up')) + '" aria-label="' + esc(T('up')) + '">' + IC.up + '</button>' +
      '<button type="button" class="iconbtn sm" data-act="down"' + pAttr(f, p) + ' data-i="' + i + '"' + (i === n - 1 ? ' disabled' : '') + ' title="' + esc(T('down')) + '" aria-label="' + esc(T('down')) + '">' + IC.down + '</button>' +
      '<button type="button" class="iconbtn sm danger" data-act="del"' + pAttr(f, p) + ' data-i="' + i + '" title="' + esc(T('remove')) + '" aria-label="' + esc(T('remove')) + '">' + IC.trash + '</button></span>';
  }
  function imgPick(f, p, size) {
    var v = getAt(S.data[f], p) || '';
    var src = v ? (S.pending[v] ? S.pending[v].url : S.shown[v] || '../' + v) : '';
    return '<div class="imgpick' + (size ? ' imgpick--' + size : '') + '">' +
      '<div class="imgpick-view">' + (src ? '<img src="' + esc(src) + '" alt="">' : '<span>' + esc(T('noImage')) + '</span>') + (v && S.pending[v] ? '<em>' + esc(T('newImage')) + '</em>' : '') + '</div>' +
      '<div class="imgpick-acts"><label class="btn btn--light btn--sm">' + IC.upload + '<span>' + esc(v ? T('replace') : T('upload')) + '</span>' +
      '<input type="file" accept="image/*" hidden data-img="' + esc(JSON.stringify({ f: f, p: p, max: size === 'portrait' ? 900 : 1600 })) + '"></label>' +
      (v ? '<button type="button" class="iconbtn sm danger" data-clear="' + esc(JSON.stringify({ f: f, p: p })) + '" title="' + esc(T('remove')) + '" aria-label="' + esc(T('remove')) + '">' + IC.trash + '</button>' : '') +
      '</div></div>';
  }
  var pageHead = function (title, help, extra) {
    return '<div class="vhead"><div><h1>' + esc(title) + '</h1>' + (help ? '<p class="muted">' + esc(help) + '</p>' : '') + '</div>' + (extra || '') + '</div>';
  };

  // ---------- dashboard ----------
  function dashboard() {
    var ch = changed(), up = referencedUploads();
    var tiles = [['#/pages/home', IC.doc, T('pages')], ['#/menu', IC.menu, T('menu')], ['#/news', IC.news, T('news')], ['#/staff', IC.users, T('staff')], ['#/media', IC.image, T('media')], ['#/settings', IC.gear, T('settings')]];
    return pageHead(T('welcome'), T('welcomeText')) +
      '<div class="cards">' +
      '<section class="card"><h2>' + esc(T('deploy')) + '</h2><div id="deploy" class="deploy">' + esc(T('loading')) + '</div>' +
      '<a class="btn btn--light btn--sm" href="' + esc(S.data.site.url || '../') + '" target="_blank" rel="noopener">' + IC.ext + '<span>' + esc(T('viewSite')) + '</span></a></section>' +
      '<section class="card"><h2>' + esc(T('changedFiles')) + '</h2>' +
      (ch.length || up.length ? '<ul class="files">' + ch.map(function (k) { return '<li>' + esc(FILES[k]) + '</li>'; }).join('') + up.map(function (k) { return '<li>' + esc(k) + '</li>'; }).join('') + '</ul>' +
        '<div class="row-btns"><button class="btn btn--primary btn--sm" type="button" data-go="publish">' + IC.rocket + '<span>' + esc(T('publish')) + '</span></button>' +
        '<button class="btn btn--light btn--sm" type="button" data-go="discard">' + esc(T('discard')) + '</button></div>'
        : '<p class="muted">' + esc(T('noChanges')) + '</p>') + '</section></div>' +
      '<div class="tiles">' + tiles.map(function (t) { return '<a class="tile" href="' + t[0] + '">' + t[1] + '<span>' + esc(t[2]) + '</span></a>'; }).join('') + '</div>';
  }

  // ---------- page texts ----------
  function pagesView(key) {
    key = PAGE_KEYS.indexOf(key) > -1 ? key : 'home';
    var parts = key === '_common' ? ['brand', 'nav', 'common'] : [key];
    var body = parts.map(function (k) {
      var obj = S.data.en[k];
      if (key !== '_common') {
        var scal = Object.keys(obj).filter(function (x) { return typeof obj[x] === 'string' && HIDDEN.indexOf(x) < 0; });
        var rest = Object.keys(obj).filter(function (x) { return typeof obj[x] !== 'string'; });
        return (scal.length ? group('_head', scal.map(function (x) { return node([k, x], x); }).join(''), true) : '') +
          rest.map(function (x) { return group(x, children([k, x]), true); }).join('');
      }
      return group(k, children([k]), true);
    }).join('');
    var opts = PAGE_KEYS.map(function (k) { return '<option value="' + k + '"' + (k === key ? ' selected' : '') + '>' + esc(pageName(k)) + '</option>'; }).join('');
    return pageHead(T('pages') + ' — ' + pageName(key), '',
      '<div class="vtools"><select class="pagesel" aria-label="' + esc(T('pages')) + '">' + opts + '</select>' +
      '<label class="searchbox">' + IC.search + '<input type="search" class="search" placeholder="' + esc(T('search')) + '"></label>' +
      '<button type="button" class="btn btn--light btn--sm" data-go="collapse">' + esc(T('collapseAll')) + '</button></div>') +
      '<div class="editor">' + body + '<p class="muted nothing" hidden>' + esc(T('nothingFound')) + '</p></div>';
  }
  function group(k, inner, open) { return '<details class="grp"' + (open ? ' open' : '') + '><summary>' + esc(secName(k)) + '</summary><div class="grp-body">' + inner + '</div></details>'; }
  function keysOf(p) {
    var seen = {}, out = [];
    LANGS.slice().reverse().forEach(function (l) { var o = getAt(S.data[l], p); if (o && typeof o === 'object') Object.keys(o).forEach(function (k) { if (!seen[k]) { seen[k] = 1; out.push(k); } }); });
    return out.filter(function (k) { return HIDDEN.indexOf(k) < 0; });
  }
  function sample(p) { for (var i = 2; i >= 0; i--) { var v = getAt(S.data[LANGS[i]], p); if (v != null) return v; } return null; }
  function children(p) { return keysOf(p).map(function (k) { return node(p.concat(k), k); }).join(''); }
  function node(p, k) {
    var v = sample(p);
    if (v == null || typeof v !== 'object') return tri(fieldName(k), function () { return p; }, null, { multi: MULTI.indexOf(k) > -1 });
    if (Array.isArray(v)) return list(p, k, v);
    return '<div class="sub"><div class="sub-title">' + esc(secName(k)) + '</div>' + children(p) + '</div>';
  }
  function list(p, k) {
    var n = Math.max.apply(null, LANGS.map(function (l) { return (getAt(S.data[l], p) || []).length; }));
    var objs = (sample(p) || []).some(function (x) { return x && typeof x === 'object'; });
    var items = [];
    for (var i = 0; i < n; i++) {
      var ip = p.concat(i);
      if (objs) {
        var s = sample(ip) || {}, prev = s.t || s.k || s.q || s.n || s.time || s.m || '';
        items.push('<div class="itm"><div class="itm-bar"><b>' + (i + 1) + '</b><span class="itm-prev">' + esc(String(prev).slice(0, 60)) + '</span>' + tools('*', p, i, n) + '</div>' + children(ip) + '</div>');
      } else {
        items.push('<div class="itm itm--row"><div class="itm-bar"><b>' + (i + 1) + '</b>' + tools('*', p, i, n) + '</div>' + tri(fieldName(k), function () { return ip; }, null, { multi: MULTI.indexOf(k) > -1 }) + '</div>');
      }
    }
    return '<div class="arr"><div class="arr-head">' + esc(fieldName(k)) + ' <span class="muted">(' + n + ')</span></div>' + items.join('') +
      '<button type="button" class="btn btn--light btn--sm add" data-act="add"' + pAttr('*', p) + '>' + IC.plus + '<span>' + esc(T('add')) + '</span></button></div>';
  }
  var blank = function (v, key) {
    if (typeof v === 'string') return key === 'icon' || key === 'code' ? v : '';
    if (Array.isArray(v)) return [];
    if (v && typeof v === 'object') { var o = {}; Object.keys(v).forEach(function (k) { o[k] = blank(v[k], k); }); return o; }
    return v;
  };

  // ---------- menu ----------
  function menuView() {
    var m = S.data.menu, n = m.items.length;
    var rows = m.items.map(function (it, i) {
      var vis = '<label class="switch" title="' + esc(T('show')) + '">' + input('menu', ['items', i, 'visible'], it.visible !== false, { type: 'check' }) + '<span>' + esc(T('show')) + '</span></label>';
      if (it.type === 'link') {
        return '<div class="itm' + (it.visible === false ? ' is-off' : '') + '"><div class="itm-bar">' + IC.link + '<span class="itm-prev">' + esc(T('menuLink')) + '</span>' + vis + tools('menu', ['items'], i, n) + '</div>' +
          single(T('url'), 'menu', ['items', i, 'url'], { ph: 'https://… / page.html' }) +
          tri(T('titleF'), function (l) { return ['items', i, 'label', l]; }, 'menu') + '</div>';
      }
      return '<div class="itm' + (it.visible === false ? ' is-off' : '') + '"><div class="itm-bar">' + IC.doc + '<span class="itm-prev">' + esc(T('menuPage')) + ': <b>' + esc(pageName(it.page)) + '</b></span>' + vis +
        tools('menu', ['items'], i, n, '<a class="iconbtn sm" href="#/pages/' + it.page + '" title="' + esc(T('pages')) + '">' + IC.doc + '</a>') + '</div>' +
        tri(T('titleF'), function () { return ['nav', it.page]; }) + '</div>';
    }).join('');
    return pageHead(T('menu'), T('menuHelp')) + '<div class="editor">' + rows +
      '<button type="button" class="btn btn--light btn--sm add" data-go="addlink">' + IC.plus + '<span>' + esc(T('addLink')) + '</span></button>' +
      '<div class="card mt"><label class="switch">' + input('menu', ['showApply'], m.showApply !== false, { type: 'check' }) + '<span>' + esc(T('showApply')) + '</span></label>' +
      tri(T('applyLabel'), function () { return ['nav', 'apply']; }) + tri(T('homeLabel'), function () { return ['nav', 'home']; }) + '</div></div>';
  }

  // ---------- news ----------
  function newsView() {
    var list = S.data.news.map(function (p, i) { return { p: p, i: i }; })
      .sort(function (a, b) { return String(b.p.date).localeCompare(String(a.p.date)); });
    var cards = list.map(function (x) {
      var p = x.p, i = x.i;
      var title = (p.title && (p.title[ui] || p.title.en || p.title.ru || p.title.ky)) || T('untitled');
      return '<details class="itm post"' + (x.open || !p.title || !(p.title.ky || p.title.ru || p.title.en) ? ' open' : '') + '><summary class="itm-bar"><b>' + esc(p.date) + '</b><span class="itm-prev">' + esc(title) + '</span>' +
        (p.published === false ? '<span class="pill">' + esc(T('hidden')) + '</span>' : '') +
        '<span class="tools"><button type="button" class="iconbtn sm danger" data-act="del"' + pAttr('news', []) + ' data-i="' + i + '" title="' + esc(T('remove')) + '" aria-label="' + esc(T('remove')) + '">' + IC.trash + '</button></span></summary>' +
        '<div class="post-grid">' + imgPick('news', [i, 'image']) + '<div>' +
        '<div class="row2">' + single(T('date'), 'news', [i, 'date'], { type: 'date' }) +
        '<div class="fld"><span class="fld-label">&nbsp;</span><label class="switch">' + input('news', [i, 'published'], p.published !== false, { type: 'check' }) + '<span>' + esc(T('publishedFlag')) + '</span></label></div></div>' +
        tri(T('titleF'), function (l) { return [i, 'title', l]; }, 'news') +
        tri(T('bodyF'), function (l) { return [i, 'body', l]; }, 'news', { multi: true, hint: T('bodyHint') }) + '</div></div></details>';
    }).join('');
    return pageHead(T('news'), T('newsHelp'), '<button type="button" class="btn btn--primary btn--sm" data-go="addpost">' + IC.plus + '<span>' + esc(T('addPost')) + '</span></button>') +
      '<div class="editor">' + (cards || '<p class="muted">—</p>') + '</div>';
  }

  // ---------- staff ----------
  var staffFilter = 'all';
  function staffView() {
    var depts = (S.data[ui].staff || S.data.en.staff).depts, keys = Object.keys(S.data.en.staff.depts), n = S.data.staff.length;
    var cards = S.data.staff.map(function (m, i) {
      if (staffFilter !== 'all' && m.dept !== staffFilter) return '';
      var nm = (m.name && (m.name[ui] || m.name.en || m.name.ru || m.name.ky)) || '';
      return '<div class="itm person"><div class="itm-bar"><b>' + (i + 1) + '</b><span class="itm-prev">' + esc(nm || '—') + ' · ' + esc((m.role && m.role[ui]) || '') + '</span>' + tools('staff', [], i, n) + '</div>' +
        '<div class="person-grid">' + imgPick('staff', [i, 'photo'], 'portrait') + '<div>' +
        tri(T('nameF'), function (l) { return [i, 'name', l]; }, 'staff', { copy: true }) +
        tri(T('roleF'), function (l) { return [i, 'role', l]; }, 'staff') +
        '<div class="row2"><div class="fld"><label class="fld-label">' + esc(T('deptF')) + '</label><select' + pAttr('staff', [i, 'dept']) + '>' +
        keys.map(function (d) { return '<option value="' + d + '"' + (m.dept === d ? ' selected' : '') + '>' + esc(depts[d] || d) + '</option>'; }).join('') + '</select></div>' +
        '<div class="fld"><span class="fld-label">&nbsp;</span><label class="switch">' + input('staff', [i, 'native'], !!m.native, { type: 'check' }) + '<span>' + esc(T('nativeF')) + '</span></label></div></div>' +
        '</div></div></div>';
    }).join('');
    var filt = '<select class="stafffilter" aria-label="' + esc(T('deptF')) + '"><option value="all">' + esc(T('allDepts')) + '</option>' +
      keys.map(function (d) { return '<option value="' + d + '"' + (staffFilter === d ? ' selected' : '') + '>' + esc(depts[d] || d) + '</option>'; }).join('') + '</select>';
    return pageHead(T('staff'), T('staffHelp'), '<div class="vtools">' + filt + '<button type="button" class="btn btn--primary btn--sm" data-go="addperson">' + IC.plus + '<span>' + esc(T('addPerson')) + '</span></button></div>') +
      '<div class="editor">' + cards + '</div>';
  }

  // ---------- media ----------
  function mediaView() {
    var slots = Object.keys(S.data.images);
    return pageHead(T('media'), T('mediaHelp')) + '<div class="media">' + slots.map(function (s) {
      return '<div class="mslot"><div class="mslot-name">' + esc((SLOTS[s] || [])[LI[ui]] || s) + '</div>' + imgPick('images', [s]) + '</div>';
    }).join('') + '</div>';
  }

  // ---------- settings ----------
  function settingsView() {
    var site = S.data.site, phones = site.phones || [];
    return pageHead(T('settings'), T('settingsHelp')) + '<div class="editor">' +
      '<section class="card"><h2>' + esc(T('phones')) + '</h2>' + phones.map(function (p, i) {
        return '<div class="itm itm--row"><div class="itm-bar"><b>' + (i + 1) + '</b>' + tools('site', ['phones'], i, phones.length) + '</div>' + input('site', ['phones', i], typeof p === 'string' ? p : p.label, { ph: '+996 …', type: 'tel' }) + '</div>';
      }).join('') + '<button type="button" class="btn btn--light btn--sm add" data-go="addphone">' + IC.plus + '<span>' + esc(T('addPhone')) + '</span></button>' +
      single(T('whatsapp'), 'site', ['whatsapp'], { ph: '996700123456', hint: T('whatsappHint') }) + '</section>' +
      '<section class="card"><h2>' + esc(T('addressBlock')) + '</h2>' +
      ['address', 'addressShort', 'addressMap', 'hoursVal'].map(function (k) { return tri(T(k), function () { return ['common', k]; }); }).join('') + '</section>' +
      '<section class="card"><h2>Instagram · 2GIS</h2>' +
      single(T('instagram'), 'site', ['instagram']) + single(T('handle'), 'site', ['handle']) + single(T('instagramDm'), 'site', ['instagramDm']) +
      single(T('map'), 'site', ['map']) + single(T('network'), 'site', ['network']) + '</section>' +
      '<section class="card"><h2>' + esc(T('siteUrl')) + '</h2>' + single(T('siteUrl'), 'site', ['url']) + single(T('customDomain'), 'site', ['customDomain']) +
      single(T('aiEndpoint'), 'site', ['aiEndpoint']) + '</section></div>';
  }

  // ---------- editors ----------
  var isAdmin = function () { return S.me.mode === 'token' || !!(S.me.user && S.me.user.role === 'admin'); };
  function editorsView() {
    var db = S.data.editors, list = db.editors || [], me = S.me;
    var origNames = (JSON.parse(S.orig.editors || '{}').editors || []).map(function (x) { return x.username; });
    var roleSel = function (i, v) {
      return '<select' + (i == null ? ' id="ed-role"' : pAttr('editors', ['editors', i, 'role'])) + '>' + ['editor', 'admin'].map(function (r) {
        return '<option value="' + r + '"' + (v === r ? ' selected' : '') + '>' + esc(T(r === 'admin' ? 'roleAdmin' : 'roleEditor')) + '</option>'; }).join('') + '</select>';
    };
    var card = function (e, i) {
      var mine = me.user && me.user.username === e.username, admin = isAdmin();
      return '<div class="itm"><div class="itm-bar">' + IC.users + '<span class="itm-prev"><b>' + esc(e.name || e.username) + '</b> · ' + esc(e.username) +
        (mine ? ' (' + esc(T('you')) + ')' : '') + '</span>' + (origNames.indexOf(e.username) < 0 ? '<span class="pill">' + esc(T('pending')) + '</span>' : '') +
        '<span class="tools"><button type="button" class="btn btn--light btn--sm" data-go="setpw" data-i="' + i + '">' + IC.key + '<span>' + esc(T('setPassword')) + '</span></button>' +
        (admin ? '<button type="button" class="iconbtn sm danger" data-go="deleditor" data-i="' + i + '" title="' + esc(T('remove')) + '" aria-label="' + esc(T('remove')) + '">' + IC.trash + '</button>' : '') + '</span></div>' +
        (admin ? '<div class="row2">' + single(T('displayName'), 'editors', ['editors', i, 'name']) +
          '<div class="fld"><label class="fld-label">' + esc(T('role')) + '</label>' + roleSel(i, e.role) + '</div></div>' : '') + '</div>';
    };
    var html = pageHead(T('editors'), T('editorsHelp'));
    if (!isAdmin()) {
      return html + '<div class="editor">' + list.map(function (e, i) { return me.user && e.username === me.user.username ? card(e, i) : ''; }).join('') + '</div>';
    }
    if (!db.vault) {
      return html + '<div class="editor"><section class="card"><h2>' + esc(T('setupVault')) + '</h2><p class="muted">' + esc(T('setupHelp')) + '</p>' +
        '<button type="button" class="btn btn--primary btn--sm" data-go="setupvault">' + IC.key + '<span>' + esc(T('setupVault')) + '</span></button></section></div>';
    }
    if (!me.k) {
      return html + '<div class="editor"><section class="card"><p>' + esc(T('noKey')) + '</p>' +
        (me.mode === 'token' ? '<button type="button" class="btn btn--light btn--sm" data-go="resetvault">' + esc(T('resetVault')) + '</button>' : '') + '</section></div>';
    }
    return html + '<div class="editor"><p class="note-box">' + esc(T('securityNote')) + '</p>' + list.map(card).join('') +
      '<section class="card"><h2>' + esc(T('addEditor')) + '</h2>' +
      '<div class="row2"><div class="fld"><label class="fld-label" for="ed-name">' + esc(T('displayName')) + '</label><input id="ed-name"></div>' +
      '<div class="fld"><label class="fld-label" for="ed-user">' + esc(T('username')) + ' <small>' + esc(T('usernameRule')) + '</small></label><input id="ed-user" autocapitalize="none" spellcheck="false" autocomplete="off"></div></div>' +
      '<div class="row2"><div class="fld"><label class="fld-label" for="ed-pw">' + esc(T('password')) + ' <small>' + esc(T('pwRule')) + '</small></label><input id="ed-pw" type="password" maxlength="6" autocomplete="new-password"></div>' +
      '<div class="fld"><label class="fld-label" for="ed-pw2">' + esc(T('password2')) + '</label><input id="ed-pw2" type="password" maxlength="6" autocomplete="new-password"></div></div>' +
      '<div class="fld"><label class="fld-label" for="ed-role">' + esc(T('role')) + '</label>' + roleSel(null, 'editor') + '</div>' +
      '<p class="alert" id="ed-err" hidden></p>' +
      '<button type="button" class="btn btn--primary btn--sm add" data-go="addeditor">' + IC.plus + '<span>' + esc(T('addEditor')) + '</span></button></section>' +
      '<section class="card"><h2>' + esc(T('replaceToken')) + '</h2><p class="muted">' + esc(T('replaceHelp')) + '</p>' +
      '<input id="ed-token" type="password" autocomplete="off" placeholder="github_pat_…">' +
      '<button type="button" class="btn btn--light btn--sm add" data-go="replacetoken">' + esc(T('save')) + '</button></section>' +
      (me.mode === 'token' ? '<section class="card"><button type="button" class="btn btn--light btn--sm add" data-go="resetvault">' + esc(T('resetVault')) + '</button></section>' : '') +
      '</div>';
  }
  // Keep the vault key / token of this sign-in up to date in the stored session
  function keepSession() {
    var store = local.get('isp-admin-auth') ? local : session, a = {};
    try { a = JSON.parse(store.get('isp-admin-auth') || '{}'); } catch (e) {}
    a.token = gh.token; if (S.me.k) a.k = AUTH.b64(S.me.k);
    store.set('isp-admin-auth', JSON.stringify(a));
  }
  // Asks for a new password twice; resolves with it, or null when cancelled
  function askPassword(title) {
    return new Promise(function (done) {
      var d = document.createElement('dialog'); d.className = 'dlg';
      d.innerHTML = '<form method="dialog"><h2>' + esc(title) + '</h2>' +
        '<label>' + esc(T('newPassword')) + ' <small class="muted">' + esc(T('pwRule')) + '</small><input name="a" type="password" maxlength="6" autocomplete="new-password"></label>' +
        '<label>' + esc(T('password2')) + '<input name="b" type="password" maxlength="6" autocomplete="new-password"></label><p class="alert" hidden></p>' +
        '<div class="row-btns"><button class="btn btn--primary" value="ok">' + esc(T('save')) + '</button><button class="btn btn--light" value="cancel" formnovalidate>' + esc(T('cancel')) + '</button></div></form>';
      document.body.appendChild(d);
      var f = d.querySelector('form'), al = d.querySelector('.alert');
      f.addEventListener('submit', function (e) {
        if (e.submitter && e.submitter.value === 'cancel') return;
        var err = !AUTH.PASSWORD.test(f.a.value) ? T('pwRule') : f.a.value !== f.b.value ? T('pwMismatch') : '';
        if (err) { e.preventDefault(); al.textContent = err; al.hidden = false; }
      });
      d.addEventListener('close', function () { var v = d.returnValue === 'ok' ? f.a.value : null; d.remove(); done(v); });
      d.showModal();
    });
  }
  function editorAction(go, btn) {
    var db = S.data.editors, list = db.editors = db.editors || [];
    var busy = function (on) { btn.disabled = on; if (on) btn.dataset.label = btn.innerHTML, btn.textContent = T('checking'); else if (btn.dataset.label) btn.innerHTML = btn.dataset.label; };
    var fail = function (e) { busy(false); toast(String((e && e.message) || e), 'err'); };
    if (go === 'setupvault' || go === 'resetvault') {
      if (go === 'resetvault' && !confirm(T('resetConfirm'))) return;
      AUTH.newVault(gh.token).then(function (r) {
        db.vault = r.vault; if (go === 'resetvault') db.editors = [];
        S.me.k = r.key; keepSession(); touched(); rerender();
      }).catch(fail);
    } else if (go === 'addeditor') {
      var name = $('#ed-name').value.trim(), user = $('#ed-user').value.trim().toLowerCase(), pw = $('#ed-pw').value, role = $('#ed-role').value;
      var err = !AUTH.USERNAME.test(user) ? T('usernameRule') : list.some(function (x) { return x.username === user; }) ? T('userExists')
        : !AUTH.PASSWORD.test(pw) ? T('pwRule') : pw !== $('#ed-pw2').value ? T('pwMismatch') : '';
      if (err) { var el = $('#ed-err'); el.textContent = err; el.hidden = false; return; }
      busy(true);
      AUTH.lock(S.me.k, pw, { username: user, name: name, role: role }).then(function (rec) { list.push(rec); touched(); rerender(); }).catch(fail);
    } else if (go === 'setpw') {
      var i = +btn.dataset.i, e = list[i];
      askPassword(T('setPassword') + ': ' + e.username).then(function (pw) {
        if (!pw) return;
        busy(true);
        return AUTH.lock(S.me.k, pw, e).then(function (rec) { list[list.indexOf(e)] = rec; touched(); rerender(); });
      }).catch(fail);
    } else if (go === 'deleditor') {
      var j = +btn.dataset.i, admins = list.filter(function (x) { return x.role === 'admin'; }).length;
      if (!confirm(list[j].role === 'admin' && admins === 1 ? T('lastAdmin') : T('remove') + ': ' + (list[j].name || list[j].username) + '?')) return;
      list.splice(j, 1); touched(); rerender();
    } else if (go === 'replacetoken') {
      var tok = $('#ed-token').value.trim(); if (!tok) return;
      busy(true);
      fetch(API + '/repos/' + gh.repo, { headers: { Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json' } }).then(function (r) {
        if (!r.ok || !r.json) throw new Error(T('tokenBad'));
        return AUTH.sealToken(S.me.k, tok);
      }).then(function (vault) { db.vault = vault; gh.token = tok; keepSession(); touched(); toast(T('tokenOk'), 'ok'); rerender(); }).catch(fail);
    }
  }

  // ---------- events ----------
  function afterRender(view) {
    var sel = $('.pagesel', view); if (sel) sel.addEventListener('change', function () { location.hash = '#/pages/' + sel.value; });
    var sf = $('.stafffilter', view); if (sf) sf.addEventListener('change', function () { staffFilter = sf.value; rerender(); });
    var q = $('.search', view);
    if (q) q.addEventListener('input', function () {
      var s = q.value.trim().toLowerCase(), any = false;
      $$('.fld', view).forEach(function (f) { var hit = !s || f.dataset.s.indexOf(s) > -1; f.hidden = !hit; any = any || hit; });
      $$('.itm, .sub, .arr', view).forEach(function (el) { el.hidden = !!s && !$$('.fld', el).some(function (f) { return !f.hidden; }); });
      $$('details.grp', view).forEach(function (d) { var vis = $$('.fld', d).some(function (f) { return !f.hidden; }); d.hidden = !!s && !vis; if (s && vis) d.open = true; });
      $('.nothing', view).hidden = any;
    });
    $$('[data-img]', view).forEach(function (inp) { inp.addEventListener('change', onImage); });
    $$('textarea', view).forEach(grow);
    if ($('#deploy', view)) refreshDeploy();
  }
  function grow(t) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }

  document.addEventListener('input', onEdit);
  document.addEventListener('change', function (e) { if (e.target.matches('select[data-f], input[type=checkbox][data-f], input[type=date][data-f]')) onEdit(e); });
  function onEdit(e) {
    var el = e.target; if (!el.dataset || !el.dataset.f || !S.sha) return;
    var p = JSON.parse(el.dataset.p), v = el.type === 'checkbox' ? el.checked : el.value;
    setAt(S.data[el.dataset.f], p, v);
    if (el.tagName === 'TEXTAREA') grow(el);
    touched();
    if (el.type === 'checkbox' && /^(menu|news)$/.test(el.dataset.f)) rerender();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act], [data-go], [data-clear], [data-copyall]');
    if (!a || !S.sha) return;
    if (a.dataset.copyall) {
      var c = JSON.parse(a.dataset.copyall), obj = getAt(S.data[c.f], c.p), src = obj[ui] || obj.en || obj.ru || obj.ky || '';
      LANGS.forEach(function (l) { obj[l] = src; }); touched(); rerender(); return;
    }
    if (a.dataset.clear) { var x = JSON.parse(a.dataset.clear); setAt(S.data[x.f], x.p, ''); touched(); rerender(); return; }
    var go = a.dataset.go;
    if (go) {
      if (/^(setupvault|resetvault|addeditor|setpw|deleditor|replacetoken)$/.test(go)) editorAction(go, a);
      else if (go === 'publish') publishDialog();
      else if (go === 'discard') { if (confirm(T('discardConfirm'))) { Object.keys(FILES).forEach(function (k) { S.data[k] = JSON.parse(S.orig[k]); }); S.pending = {}; touched(); rerender(); } }
      else if (go === 'collapse') { var ds = $$('#view details.grp'), open = ds.some(function (d) { return d.open; }); ds.forEach(function (d) { d.open = !open; }); a.textContent = open ? T('expandAll') : T('collapseAll'); }
      else if (go === 'addlink') { S.data.menu.items.push({ type: 'link', url: '', visible: true, label: { ky: '', ru: '', en: '' } }); touched(); rerender(); }
      else if (go === 'addpost') { S.data.news.push({ id: uid('post'), date: today(), image: '', published: true, title: { ky: '', ru: '', en: '' }, body: { ky: '', ru: '', en: '' } }); touched(); rerender(); }
      else if (go === 'addperson') { S.data.staff.push({ id: uid('p'), dept: staffFilter === 'all' ? 'class' : staffFilter, photo: '', native: false, name: { ky: '', ru: '', en: '' }, role: { ky: '', ru: '', en: '' } }); touched(); rerender(); setTimeout(function () { window.scrollTo(0, document.body.scrollHeight); }, 30); }
      else if (go === 'addphone') { (S.data.site.phones = S.data.site.phones || []).push(''); touched(); rerender(); }
      return;
    }
    var act = a.dataset.act, f = a.dataset.f, p = JSON.parse(a.dataset.p), i = +a.dataset.i;
    var files = f === '*' ? LANGS : [f];
    if (act === 'del' && !confirm(T('removeConfirm'))) return;
    files.forEach(function (k) {
      var arr = getAt(S.data[k], p);
      if (!Array.isArray(arr)) { if (act !== 'add') return; arr = []; setAt(S.data[k], p, arr); }
      if (act === 'add') { var s = sample(p.concat(0)) != null ? (getAt(S.data[k], p) || [])[arr.length - 1] || sample(p.concat(0)) : ''; arr.push(blank(s)); }
      else if (act === 'del') arr.splice(i, 1);
      else if (act === 'up' && i > 0) arr.splice(i - 1, 0, arr.splice(i, 1)[0]);
      else if (act === 'down' && i < arr.length - 1) arr.splice(i + 1, 0, arr.splice(i, 1)[0]);
    });
    touched(); rerender();
  });

  // Photos are resized in the browser (JPEG) before they are added to the commit.
  function onImage(e) {
    var inp = e.target, file = inp.files && inp.files[0], cfg = JSON.parse(inp.dataset.img);
    if (!file) return;
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var k = Math.min(1, cfg.max / Math.max(img.width, img.height)), w = Math.round(img.width * k), h = Math.round(img.height * k);
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      var data = c.toDataURL('image/jpeg', 0.85);
      var base = (file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'photo').slice(0, 40);
      var path = 'assets/uploads/' + base + '-' + Date.now().toString(36) + '.jpg';
      S.pending[path] = { b64: data.split(',')[1], url: data };
      setAt(S.data[cfg.f], cfg.p, path);
      touched(); rerender();
    };
    img.onerror = function () { URL.revokeObjectURL(url); toast(T('imgTooBig'), 'err'); };
    img.src = url;
  }

  // ---------- publish ----------
  function publishDialog() {
    if (!changeCount()) { toast(T('noChanges')); return; }
    var d = document.createElement('dialog'); d.className = 'dlg';
    d.innerHTML = '<form method="dialog"><h2>' + esc(T('publish')) + '</h2><p class="muted">' + changeCount() + ' ' + esc(T('unsaved')) + '</p>' +
      '<label>' + esc(T('commitMsg')) + '<input name="msg" maxlength="120"></label>' +
      '<div class="row-btns"><button class="btn btn--primary" value="ok">' + IC.rocket + '<span>' + esc(T('publish')) + '</span></button><button class="btn btn--light" value="cancel">✕</button></div></form>';
    document.body.appendChild(d);
    d.addEventListener('close', function () { var ok = d.returnValue === 'ok', msg = d.querySelector('[name=msg]').value.trim(); d.remove(); if (ok) publish(msg); });
    d.showModal();
  }
  // Git's blob id of a text, to compare a rebuilt page with the one in the repository
  function blobSha(text) {
    var bytes = new TextEncoder().encode(text), headr = new TextEncoder().encode('blob ' + bytes.length + '\0');
    var all = new Uint8Array(headr.length + bytes.length); all.set(headr); all.set(bytes, headr.length);
    return crypto.subtle.digest('SHA-1', all).then(function (h) { return [].map.call(new Uint8Array(h), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); });
  }
  // The site is rebuilt here with the same templates as `node src/build.mjs` (docs/admin/lib/site.mjs)
  // and the changed pages are committed to docs/, which GitHub Pages serves.
  function builtFiles(head) {
    return Promise.all([import('./lib/site.mjs'), gh.tree(head)]).then(function (r) {
      var content = {}; Object.keys(FILES).forEach(function (k) { content[k] = S.data[k]; });
      var out = r[0].buildSite(clone(content)), have = r[1];
      var list = Object.keys(out.files).map(function (p) { return { path: 'docs/' + p, content: out.files[p] }; })
        .concat({ path: 'server/knowledge.json', content: out.knowledge });
      return Promise.all(list.map(function (f) { return blobSha(f.content).then(function (s) { return s === have[f.path] ? null : { path: f.path, content: f.content, encoding: 'utf-8' }; }); }))
        .then(function (x) { return x.filter(Boolean); });
    });
  }
  function publish(msg) {
    var b = $('#publish'); b.disabled = true; b.querySelector('span').textContent = T('publishing');
    var ch = changed(), up = referencedUploads();
    var files = ch.map(function (k) { return { path: FILES[k], content: ser(k), encoding: 'utf-8' }; })
      .concat(up.map(function (pth) { return { path: pth, content: S.pending[pth].b64, encoding: 'base64' }; }))
      .concat(up.map(function (pth) { return { path: 'docs/' + pth, content: S.pending[pth].b64, encoding: 'base64' }; }));
    var head;
    gh.head().then(function (h) {
      head = h;
      if (head !== S.sha && !confirm(T('conflict'))) throw null;
      return builtFiles(head);
    }).then(function (pages) {
      return gh.commit(files.concat(pages), msg || 'Admin: ' + ch.concat(up).map(function (x) { return (FILES[x] || x).replace(/^content\/|^assets\/uploads\//, ''); }).join(', '), head);
    }).then(function (sha) {
      S.sha = sha;
      ch.forEach(function (k) { S.orig[k] = ser(k); });
      up.forEach(function (pth) { S.shown[pth] = S.pending[pth].url; delete S.pending[pth]; });
      local.del(draftKey());
      toast(T('published'), 'ok');
      deployPoll = Date.now(); setTimeout(refreshDeploy, 4000);
    }).catch(function (e) {
      if (e) toast(T('publishFailed') + ': ' + (e.message || e), 'err');
    }).then(function () {
      b.querySelector('span').textContent = T('publish'); updatePublish(); if (/^#?\/?$/.test(location.hash)) rerender();
    });
  }

  // ---------- deploy status (GitHub Actions) ----------
  var deployPoll = 0, deployTimer = null;
  function ago(t) { var m = Math.round((Date.now() - new Date(t)) / 6e4); return m < 1 ? T('justNow') : m + ' ' + T('minutesAgo'); }
  function refreshDeploy() {
    if (!S.sha) return;
    gh.lastRun().then(function (r) {
      var el = $('#deploy');
      var run = r && r.status !== 'completed', bad = r && r.status === 'completed' && r.conclusion !== 'success';
      var html = !r ? esc(T('deployNone')) : '<span class="dot ' + (run ? 'dot--run' : bad ? 'dot--bad' : 'dot--ok') + '"></span>' +
        esc(run ? T('deployRun') : bad ? T('deployFail') : T('deployOk')) + ' <span class="muted">· ' + esc(ago(r.updated_at || r.created_at)) + '</span>' +
        (r.html_url ? ' <a href="' + esc(r.html_url) + '" target="_blank" rel="noopener">↗</a>' : '');
      if (el) el.innerHTML = html;
      clearTimeout(deployTimer);
      if ((run || Date.now() - deployPoll < 60000) && Date.now() - deployPoll < 6 * 60000) deployTimer = setTimeout(refreshDeploy, 8000);
    }).catch(function () { var el = $('#deploy'); if (el) el.textContent = T('deployNone'); });
  }

  // ---------- go ----------
  var saved = null; try { saved = JSON.parse(local.get('isp-admin-auth') || session.get('isp-admin-auth') || 'null'); } catch (e) {}
  if (saved && saved.token) start(saved); else login();
})();
