/* Söuthsea Swimrun — blog admin.
   Static-site publishing tool: edits posts/posts.json, generates the post page,
   blog.html, the home "latest" cards and sitemap.xml (via js/templates.js), and
   commits everything to GitHub in a single commit through the Git Data API.
   Netlify then redeploys the site automatically.

   Auth: a fine-grained GitHub PAT (contents: read/write on vvecchiatti/sos),
   kept in localStorage only. */
(function () {
  'use strict';

  var OWNER = 'vvecchiatti';
  var REPO = 'sos';
  var BRANCH = 'main';
  var PREFIX = 'southsea-site/'; // site lives in this folder inside the repo
  var API = 'https://api.github.com';
  var TOKEN_KEY = 'sos-admin-token';
  var T = window.SOS_TEMPLATES;

  var $ = function (id) { return document.getElementById(id); };
  var state = {
    token: localStorage.getItem(TOKEN_KEY) || '',
    manifest: null,
    editing: null,      // {list:'reports'|'articles', index} or null for new post
    photos: [],         // [{path (repo-relative site path "/images/posts/.."), dataB64|null, previewUrl}]
    coverIndex: 0,
    legacy: false,
    busy: false
  };

  /* ---------- status bar ---------- */
  function status(msg, cls, spin) {
    var el = $('status');
    el.className = 'status show' + (cls ? ' ' + cls : '');
    $('status-text').textContent = msg;
    $('status-spinner').style.display = spin ? '' : 'none';
    if (!spin && msg) { setTimeout(function () { if ($('status-text').textContent === msg) el.className = 'status'; }, 6000); }
  }
  function statusHide() { $('status').className = 'status'; }

  /* ---------- GitHub API ---------- */
  function gh(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({
      'Authorization': 'Bearer ' + state.token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }, opts.headers || {});
    return fetch(API + path, opts).then(function (r) {
      if (!r.ok) {
        return r.json().catch(function () { return {}; }).then(function (b) {
          var err = new Error('GitHub ' + r.status + ': ' + (b.message || r.statusText));
          err.status = r.status;
          throw err;
        });
      }
      return r.status === 204 ? null : r.json();
    });
  }

  function fetchManifest() {
    return gh('/repos/' + OWNER + '/' + REPO + '/contents/' + PREFIX + 'posts/posts.json?ref=' + BRANCH)
      .then(function (f) {
        var json = decodeURIComponent(escape(atob(f.content.replace(/\n/g, ''))));
        return JSON.parse(json);
      })
      .catch(function (e) {
        // Not on GitHub yet (first deploy window): fall back to the site copy.
        if (e.status !== 404) throw e;
        return fetch('/posts/posts.json').then(function (r) {
          if (!r.ok) throw e;
          return r.json();
        });
      });
  }

  /* Single commit with many files via Git Data API.
     files: [{path (repo path), content (utf8 string) | b64 (base64 string) | del:true}] */
  function commitFiles(files, message) {
    var base = '/repos/' + OWNER + '/' + REPO;
    var headSha, baseTree;
    return gh(base + '/git/ref/heads/' + BRANCH).then(function (ref) {
      headSha = ref.object.sha;
      return gh(base + '/git/commits/' + headSha);
    }).then(function (commit) {
      baseTree = commit.tree.sha;
      // Create blobs for binary files; text goes straight into the tree.
      var blobPromises = files.map(function (f) {
        if (f.del) return Promise.resolve({ path: f.path, mode: '100644', type: 'blob', sha: null });
        if (f.b64) {
          return gh(base + '/git/blobs', {
            method: 'POST',
            body: JSON.stringify({ content: f.b64, encoding: 'base64' })
          }).then(function (blob) {
            return { path: f.path, mode: '100644', type: 'blob', sha: blob.sha };
          });
        }
        return Promise.resolve({ path: f.path, mode: '100644', type: 'blob', content: f.content });
      });
      return Promise.all(blobPromises);
    }).then(function (tree) {
      return gh(base + '/git/trees', {
        method: 'POST',
        body: JSON.stringify({ base_tree: baseTree, tree: tree })
      });
    }).then(function (newTree) {
      return gh(base + '/git/commits', {
        method: 'POST',
        body: JSON.stringify({ message: message, tree: newTree.sha, parents: [headSha] })
      });
    }).then(function (newCommit) {
      return gh(base + '/git/refs/heads/' + BRANCH, {
        method: 'PATCH',
        body: JSON.stringify({ sha: newCommit.sha })
      });
    });
  }

  /* ---------- views ---------- */
  function showView(id) {
    ['login-view', 'list-view', 'editor-view'].forEach(function (v) {
      $(v).classList.toggle('hidden', v !== id);
    });
    $('logout-btn').classList.toggle('hidden', id === 'login-view');
    window.scrollTo(0, 0);
  }

  function renderList() {
    ['reports', 'articles'].forEach(function (list) {
      var ul = $(list + '-list');
      ul.innerHTML = '';
      (state.manifest[list] || []).forEach(function (p, i) {
        var li = document.createElement('li');
        var img = document.createElement('img');
        img.src = p.cover; img.alt = '';
        var meta = document.createElement('div');
        meta.className = 'meta';
        var t = document.createElement('div');
        t.className = 't';
        t.textContent = p.title;
        if (p.format !== 'text') {
          var b = document.createElement('span');
          b.className = 'badge gray'; b.textContent = 'legacy';
          t.appendChild(b);
        }
        var s = document.createElement('div');
        s.className = 's';
        s.textContent = p.year ? p.tag + ' · ' + p.year : p.tag;
        meta.appendChild(t); meta.appendChild(s);
        var edit = document.createElement('button');
        edit.className = 'btn secondary small'; edit.type = 'button'; edit.textContent = 'Edit';
        edit.addEventListener('click', function () { openEditor(list, i); });
        var view = document.createElement('a');
        view.className = 'btn secondary small'; view.textContent = 'View';
        view.href = '/posts/' + p.slug + '.html'; view.target = '_blank'; view.rel = 'noopener';
        li.appendChild(img); li.appendChild(meta); li.appendChild(edit); li.appendChild(view);
        ul.appendChild(li);
      });
    });
  }

  /* ---------- editor ---------- */
  function slugify(s) {
    return String(s).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'post';
  }

  function currentSlug() {
    if (state.editing) {
      return state.manifest[state.editing.list][state.editing.index].slug;
    }
    return slugify($('f-title').value);
  }

  function openEditor(list, index) {
    state.editing = (list != null) ? { list: list, index: index } : null;
    state.photos = [];
    state.coverIndex = 0;
    $('preview-card').classList.add('hidden');

    var p = state.editing ? state.manifest[list][index] : null;
    state.legacy = !!(p && p.format !== 'text');

    $('editor-title').textContent = p ? 'Edit post' : 'New post';
    $('f-title').value = p ? p.title : '';
    $('f-author').value = (p && p.author) || '';
    $('f-tag').value = p ? p.tag : 'Race Report';
    $('f-year').value = p ? p.year : String(new Date().getFullYear());
    $('f-excerpt').value = p ? p.excerpt : '';
    $('f-body').value = (p && p.body) || '';

    $('body-card').style.display = state.legacy ? 'none' : '';
    $('legacy-note').style.display = state.legacy ? '' : 'none';
    $('gallery-card').style.display = state.legacy ? 'none' : '';
    $('delete-btn').classList.toggle('hidden', !p);

    if (p && p.format === 'text') {
      (p.gallery || []).forEach(function (src) {
        state.photos.push({ path: src, b64: null, previewUrl: src });
      });
      state.coverIndex = Math.max(0, (p.gallery || []).indexOf(p.cover));
    }
    renderThumbs();
    updateSlugHint();
    showView('editor-view');
  }

  function updateSlugHint() {
    var slug = currentSlug();
    $('slug-hint').innerHTML = 'Post address: <code>/posts/' + T.esc(slug) + '.html</code>' +
      (state.editing ? '' : ' (from the title)');
  }

  function renderThumbs() {
    var wrap = $('thumbs');
    wrap.innerHTML = '';
    state.photos.forEach(function (ph, i) {
      var d = document.createElement('div');
      d.className = 'thumb' + (i === state.coverIndex ? ' cover' : '');
      var img = document.createElement('img');
      img.src = ph.previewUrl; img.alt = '';
      var tools = document.createElement('div');
      tools.className = 'tools';
      var cov = document.createElement('button');
      cov.type = 'button'; cov.textContent = i === state.coverIndex ? '★ cover' : 'cover';
      cov.addEventListener('click', function () { state.coverIndex = i; renderThumbs(); });
      var rm = document.createElement('button');
      rm.type = 'button'; rm.textContent = 'remove';
      rm.addEventListener('click', function () {
        state.photos.splice(i, 1);
        if (state.coverIndex >= state.photos.length) state.coverIndex = Math.max(0, state.photos.length - 1);
        renderThumbs();
      });
      tools.appendChild(cov); tools.appendChild(rm);
      d.appendChild(img); d.appendChild(tools);
      wrap.appendChild(d);
    });
  }

  /* Resize in the browser so the repo doesn't fill up with 8 MB photos. */
  function processImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var MAX = 1600;
        var w = img.naturalWidth, h = img.naturalHeight;
        if (w > MAX || h > MAX) {
          var k = Math.min(MAX / w, MAX / h);
          w = Math.round(w * k); h = Math.round(h * k);
        }
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        var dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        URL.revokeObjectURL(url);
        resolve({ b64: dataUrl.split(',')[1], previewUrl: dataUrl });
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not read ' + file.name)); };
      img.src = url;
    });
  }

  function addFiles(fileList) {
    var files = Array.prototype.filter.call(fileList, function (f) { return /^image\//.test(f.type); });
    if (!files.length) return;
    status('Processing ' + files.length + ' photo(s)…', '', true);
    var chain = Promise.resolve();
    files.forEach(function (f) {
      chain = chain.then(function () {
        return processImage(f).then(function (res) {
          state.photos.push({ path: null, b64: res.b64, previewUrl: res.previewUrl });
          renderThumbs();
        });
      });
    });
    chain.then(function () { statusHide(); })
      .catch(function (e) { status(e.message, 'err', false); });
  }

  /* ---------- publish ---------- */
  function validate() {
    if (!$('f-title').value.trim()) return 'Add a title.';
    if (!$('f-excerpt').value.trim()) return 'Add a short excerpt (it appears on the blog cards).';
    if (!state.legacy) {
      if (!$('f-body').value.trim()) return 'The post text is empty.';
      if (!state.photos.length) return 'Add at least one photo (the cover).';
    }
    return null;
  }

  function buildPost(slug) {
    var year = $('f-year').value.trim();
    // Assign repo paths to newly added photos.
    var n = 0;
    var gallery = state.photos.map(function (ph) {
      if (ph.path) return ph.path;
      n++;
      var name = slug + '-' + Date.now().toString(36) + '-' + n + '.jpg';
      ph.path = '/images/posts/' + slug + '/' + name;
      return ph.path;
    });
    return {
      slug: slug,
      title: $('f-title').value.trim(),
      tag: $('f-tag').value,
      year: year,
      excerpt: $('f-excerpt').value.trim(),
      author: $('f-author').value.trim(),
      cover: state.legacy
        ? state.manifest[state.editing.list][state.editing.index].cover
        : gallery[state.coverIndex],
      gallery: gallery,
      body: $('f-body').value,
      format: state.legacy ? 'html' : 'text'
    };
  }

  function upsertManifest(post) {
    var m = JSON.parse(JSON.stringify(state.manifest));
    var targetList = post.year ? 'reports' : 'articles';
    var entry = {
      slug: post.slug, title: post.title, tag: post.tag, year: post.year,
      excerpt: post.excerpt, cover: post.cover, format: post.format
    };
    if (post.format === 'text') {
      entry.author = post.author;
      entry.gallery = post.gallery;
      entry.body = post.body;
    }
    if (state.editing) {
      var fromList = state.editing.list;
      if (fromList === targetList) {
        m[targetList][state.editing.index] = entry;
      } else {
        m[fromList].splice(state.editing.index, 1);
        m[targetList].unshift(entry);
      }
    } else {
      // New posts go on top. Reports are grouped by year in the listing, so
      // insert before the first entry of the same-or-older year.
      if (targetList === 'reports') {
        var idx = m.reports.findIndex(function (p) { return (p.year || '0') <= post.year; });
        if (idx === -1) idx = m.reports.length;
        m.reports.splice(idx, 0, entry);
      } else {
        m.articles.unshift(entry);
      }
    }
    return m;
  }

  function regenFiles(manifest, post, opts) {
    opts = opts || {};
    var files = [];
    files.push({ path: PREFIX + 'posts/posts.json', content: JSON.stringify(manifest, null, 2) + '\n' });
    files.push({ path: PREFIX + 'blog.html', content: T.renderBlogHtml(manifest) });
    files.push({ path: PREFIX + 'sitemap.xml', content: T.renderSitemap(manifest) });
    if (post && post.format === 'text' && !opts.deleting) {
      files.push({ path: PREFIX + 'posts/' + post.slug + '.html', content: T.renderPostHtml(post) });
      state.photos.forEach(function (ph) {
        if (ph.b64) files.push({ path: PREFIX + ph.path.replace(/^\//, ''), b64: ph.b64 });
      });
    }
    // Home page latest cards (regenerate between markers).
    return gh('/repos/' + OWNER + '/' + REPO + '/contents/' + PREFIX + 'index.html?ref=' + BRANCH)
      .then(function (f) {
        var html = decodeURIComponent(escape(atob(f.content.replace(/\n/g, ''))));
        var re = /(<!-- HOME-LATEST:START[^>]*-->)[\s\S]*?(<!-- HOME-LATEST:END -->)/;
        if (re.test(html)) {
          var updated = html.replace(re, '$1\n' + T.renderHomeLatest(manifest) + '\n$2');
          if (updated !== html) files.push({ path: PREFIX + 'index.html', content: updated });
        }
        return files;
      });
  }

  function publish() {
    if (state.busy) return;
    var err = validate();
    if (err) { status(err, 'err', false); return; }
    var slug = currentSlug();
    var post = buildPost(slug);
    var manifest = upsertManifest(post);
    state.busy = true;
    $('publish-btn').disabled = true;
    status('Publishing…', '', true);
    regenFiles(manifest, post)
      .then(function (files) {
        var msg = (state.editing ? 'Update post: ' : 'New post: ') + post.title + ' (via admin)';
        return commitFiles(files, msg);
      })
      .then(function () {
        state.manifest = manifest;
        state.editing = null;
        status('Published! The site redeploys in ~1 minute. View: /posts/' + slug + '.html', 'ok', false);
        renderList();
        showView('list-view');
      })
      .catch(function (e) { status(e.message, 'err', false); })
      .finally(function () { state.busy = false; $('publish-btn').disabled = false; });
  }

  function removePost() {
    if (!state.editing || state.busy) return;
    var p = state.manifest[state.editing.list][state.editing.index];
    if (!window.confirm('Delete "' + p.title + '"? The post page is removed from the site. This cannot be undone from here.')) return;
    var manifest = JSON.parse(JSON.stringify(state.manifest));
    manifest[state.editing.list].splice(state.editing.index, 1);
    state.busy = true;
    status('Deleting…', '', true);
    regenFiles(manifest, null, { deleting: true })
      .then(function (files) {
        files.push({ path: PREFIX + 'posts/' + p.slug + '.html', del: true });
        return commitFiles(files, 'Delete post: ' + p.title + ' (via admin)');
      })
      .then(function () {
        state.manifest = manifest;
        state.editing = null;
        status('Post deleted. The site redeploys in ~1 minute.', 'ok', false);
        renderList();
        showView('list-view');
      })
      .catch(function (e) { status(e.message, 'err', false); })
      .finally(function () { state.busy = false; });
  }

  /* ---------- auth ---------- */
  function login(token) {
    state.token = token;
    status('Checking access…', '', true);
    return gh('/repos/' + OWNER + '/' + REPO)
      .then(function () { return fetchManifest(); })
      .then(function (m) {
        state.manifest = m;
        localStorage.setItem(TOKEN_KEY, token);
        statusHide();
        renderList();
        showView('list-view');
      })
      .catch(function (e) {
        state.token = '';
        localStorage.removeItem(TOKEN_KEY);
        status(e.status === 401 ? 'Token rejected — check it and try again.' : e.message, 'err', false);
        showView('login-view');
      });
  }

  /* ---------- wire up ---------- */
  $('login-btn').addEventListener('click', function () {
    var t = $('token-input').value.trim();
    if (t) login(t);
  });
  $('token-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') $('login-btn').click();
  });
  $('logout-btn').addEventListener('click', function () {
    localStorage.removeItem(TOKEN_KEY);
    state.token = '';
    $('token-input').value = '';
    showView('login-view');
  });
  $('new-post-btn').addEventListener('click', function () { openEditor(null, null); });
  $('back-btn').addEventListener('click', function () {
    state.editing = null;
    showView('list-view');
  });
  $('f-title').addEventListener('input', updateSlugHint);
  $('publish-btn').addEventListener('click', publish);
  $('delete-btn').addEventListener('click', removePost);
  $('preview-btn').addEventListener('click', function () {
    $('preview-card').classList.remove('hidden');
    var html = T.bodyTextToHtml($('f-body').value);
    var author = $('f-author').value.trim();
    if (author) html += '\n<p style="color:#555;font-style:italic;">By ' + T.esc(author) + '.</p>';
    $('preview-body').innerHTML = html;
    $('preview-card').scrollIntoView({ behavior: 'smooth' });
  });

  var drop = $('drop-zone');
  drop.addEventListener('click', function () { $('file-input').click(); });
  $('file-input').addEventListener('change', function () {
    addFiles(this.files);
    this.value = '';
  });
  ['dragover', 'dragenter'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); });
  });
  drop.addEventListener('drop', function (e) { addFiles(e.dataTransfer.files); });

  // Session restore
  if (state.token) { login(state.token); } else { showView('login-view'); }
})();
