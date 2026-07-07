// Hero photo rotation: random order per visit + gentle cross-fade.
// External file so it satisfies the site's CSP (script-src 'self').
(function () {
  var bg = document.getElementById('heroBg');
  if (!bg) return;
  var imgs = [
    '/images/emerging-from-the-lake.jpg',
    '/images/Coniston20251.jpg',
    '/images/received_531417724571319.jpg',
    '/images/Cote-Dazure2.jpg',
    '/images/received_554777298985856.jpg'
  ];
  // Shuffle so each visit starts on a different photo.
  for (var i = imgs.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = imgs[i]; imgs[i] = imgs[j]; imgs[j] = t;
  }

  var a = document.createElement('div');
  var b = document.createElement('div');
  a.className = 'hero-slide active';
  b.className = 'hero-slide';
  a.style.backgroundImage = "url('" + imgs[0] + "')";
  bg.appendChild(a);
  bg.appendChild(b);

  var layers = [a, b], cur = 0, idx = 0;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || imgs.length < 2) return; // static random photo, no auto-rotate

  function preload(src) { var im = new Image(); im.src = src; }
  preload(imgs[1]);

  setInterval(function () {
    var next = (idx + 1) % imgs.length;
    var hidden = layers[1 - cur];
    hidden.style.backgroundImage = "url('" + imgs[next] + "')";
    hidden.classList.add('active');
    layers[cur].classList.remove('active');
    cur = 1 - cur;
    idx = next;
    preload(imgs[(next + 1) % imgs.length]);
  }, 6000);
})();
