// Hero photo rotation: random order per visit + gentle cross-fade.
// External file so it satisfies the site's CSP (script-src 'self').
(function () {
  var bg = document.getElementById('heroBg');
  if (!bg) return;
  var imgs = [
    '/images/116243526_10158397088366578_2638732942327839254_n.jpg',
    '/images/116431600_10158400505761578_2008022198782399006_n.jpg',
    '/images/118850265_10224975031902555_243977761831483334_n.jpg',
    '/images/122052665_10225606291563652_4598841480224246808_n-1.jpg',
    '/images/Cornwall3.jpg',
    '/images/d8e43096-02c9-4bcb-b9f8-d3ebe57aa3f4-1024x683.webp',
    '/images/d463d66f-3720-49e4-9cc9-14fe73d26e64-1-e1601547110867.jpeg',
    '/images/otillofinal-15k-copy-2.jpg',
    '/images/swimrun-hero-4.jpg',
    '/images/WhatsApp-Image-2025-06-14-at-16.08.49.jpeg'
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
