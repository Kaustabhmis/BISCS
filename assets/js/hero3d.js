/*
 * Interactive 3D hero for the home page (Three.js r160, vendored).
 * Floating glossy "tool tiles" carrying category icons, orbiting shapes and a
 * particle field that react to the pointer and scroll. Falls back silently to
 * the CSS gradient if WebGL is unavailable, and renders a single still frame
 * for users who prefer reduced motion.
 */
// Three.js is ~650 KB, so it is imported lazily once the page is idle.
let THREE;

const canvas = document.querySelector('canvas.hero-3d');
const hero = canvas && canvas.closest('.hero');

function svgIcon(name) {
  const inner = (window.BT_ICONS || {})[name] || '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

/** Canvas texture: rounded gradient tile with a white icon in the middle. */
function tileTexture(color, iconName) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, S, S);
  const base = new THREE.Color(color);
  const light = base.clone().lerp(new THREE.Color('#ffffff'), 0.25);
  const dark = base.clone().lerp(new THREE.Color('#000000'), 0.25);
  grad.addColorStop(0, '#' + light.getHexString());
  grad.addColorStop(1, '#' + dark.getHexString());
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  // soft highlight
  const hi = g.createRadialGradient(S * 0.25, S * 0.2, 0, S * 0.25, S * 0.2, S * 0.7);
  hi.addColorStop(0, 'rgba(255,255,255,0.35)');
  hi.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hi;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const img = new Image();
  img.onload = () => {
    g.drawImage(img, S * 0.27, S * 0.27, S * 0.46, S * 0.46);
    tex.needsUpdate = true;
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgIcon(iconName));
  return tex;
}

/** Rounded-rectangle slab with bevelled edges; front-face UVs mapped 0..1. */
function tileGeometry(w, h, r, depth) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 4, curveSegments: 10
  });
  geo.center();
  // ExtrudeGeometry cap UVs are shape coordinates; normalise to 0..1.
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (uv.getX(i) + w / 2) / w, (uv.getY(i) + h / 2) / h);
  }
  return geo;
}

function init() {
  if (!canvas || !hero) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return; // no WebGL: CSS background remains
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  // Lights
  scene.add(new THREE.HemisphereLight(0xc7d2fe, 0x1e1b4b, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(5, 6, 8);
  scene.add(key);
  const rim = new THREE.PointLight(0xf0abfc, 40, 30);
  rim.position.set(-6, -3, 4);
  scene.add(rim);
  const fill = new THREE.PointLight(0x60a5fa, 30, 30);
  fill.position.set(8, -4, 2);
  scene.add(fill);

  const group = new THREE.Group();
  scene.add(group);

  // Category tiles
  const cats = (window.BT_REGISTRY && window.BT_REGISTRY.CATEGORIES) || [];
  const tileGeo = tileGeometry(1.6, 1.6, 0.36, 0.28);
  const tiles = [];
  const layout = [
    [2.2, 1.9, 0.5], [4.9, 2.3, -1.2], [3.6, -0.2, 1.4], [6.3, 0.0, -0.4],
    [2.4, -2.4, -0.6], [5.2, -2.5, 0.6], [7.6, 2.4, -2.4], [7.9, -1.6, -1.0], [3.9, 3.6, -2.0]
  ];
  cats.forEach((c, i) => {
    const p = layout[i % layout.length];
    const tex = tileTexture(c.color, c.icon);
    const faceMat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.35, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.15 });
    const sideMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(c.color).multiplyScalar(0.8), roughness: 0.3, metalness: 0.1, clearcoat: 1 });
    const mesh = new THREE.Mesh(tileGeo, [faceMat, sideMat]);
    mesh.position.set(p[0], p[1], p[2]);
    mesh.userData = {
      base: mesh.position.clone(),
      phase: i * 1.37,
      speed: 0.5 + (i % 3) * 0.15,
      rot: new THREE.Euler(-0.25 + (i % 2) * 0.2, -0.5 + (i % 3) * 0.25, (i % 2 ? 0.12 : -0.1))
    };
    mesh.rotation.copy(mesh.userData.rot);
    group.add(mesh);
    tiles.push(mesh);
  });

  // Decorative shapes
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xa5b4fc, roughness: 0.15, metalness: 0.2, clearcoat: 1, transparent: true, opacity: 0.85 });
  const pink = new THREE.MeshPhysicalMaterial({ color: 0xf472b6, roughness: 0.25, metalness: 0.3, clearcoat: 1 });
  const torus = new THREE.Mesh(new THREE.TorusKnotGeometry(0.55, 0.18, 160, 20), glass);
  torus.position.set(9.0, -3.3, -1.8);
  const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), pink);
  ico.position.set(0.6, 0.2, -1.8);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.12, 24, 80), new THREE.MeshPhysicalMaterial({ color: 0xfbbf24, roughness: 0.2, metalness: 0.6, clearcoat: 1 }));
  ring.position.set(6.3, 3.7, -2.4);
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32, 32), new THREE.MeshPhysicalMaterial({ color: 0x34d399, roughness: 0.2, clearcoat: 1 }));
  sphere.position.set(7.2, -3.4, 0.4);
  [torus, ico, ring, sphere].forEach((m, i) => { m.userData = { base: m.position.clone(), phase: i * 2.1 }; group.add(m); });
  const deco = [torus, ico, ring, sphere];

  // Particles
  const N = window.innerWidth < 760 ? 180 : 360;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.3) * 26;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xc7d2fe, size: 0.045, transparent: true, opacity: 0.75, depthWrite: false }));
  scene.add(particles);

  // Pointer & resize
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; });

  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // On narrow screens move the cluster behind/under the text and shrink it.
    // On narrow screens the cluster sits in the space below the text.
    const narrow = w < 760;
    if (narrow) {
      const halfH = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const s = Math.min(0.55, (halfH * camera.aspect * 2) / 7.5);
      group.scale.setScalar(s);
      group.position.set(-4.9 * s, -halfH + 2.6 * s + 0.15, 0);
    } else {
      group.scale.setScalar(1);
      group.position.set(w < 1100 ? -1.2 : 0, 0, 0);
    }
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let visible = true, running = false, raf = 0;
  const t0 = performance.now();

  function frame() {
    const t = (performance.now() - t0) / 1000;
    cur.x += (target.x - cur.x) * 0.05;
    cur.y += (target.y - cur.y) * 0.05;
    group.rotation.y = cur.x * 0.18;
    group.rotation.x = cur.y * 0.12;
    tiles.forEach((m) => {
      const u = m.userData;
      m.position.y = u.base.y + Math.sin(t * u.speed + u.phase) * 0.22;
      m.rotation.x = u.rot.x + Math.sin(t * 0.6 + u.phase) * 0.12;
      m.rotation.y = u.rot.y + Math.cos(t * 0.5 + u.phase) * 0.18;
    });
    torus.rotation.x = t * 0.4; torus.rotation.y = t * 0.3;
    ico.rotation.x = t * 0.5; ico.rotation.z = t * 0.3;
    ring.rotation.x = 1.1 + Math.sin(t * 0.7) * 0.3; ring.rotation.y = t * 0.6;
    deco.forEach((m) => { m.position.y = m.userData.base.y + Math.sin(t * 0.8 + m.userData.phase) * 0.25; });
    particles.rotation.y = t * 0.015 + cur.x * 0.05;
    const scrollY = Math.min(window.scrollY, 600);
    camera.position.y = -scrollY * 0.004;
    renderer.render(scene, camera);
  }
  // Adaptive quality: if the device can't keep up (slow GPU or software
  // rendering), stop animating and keep a still frame instead of hogging
  // the main thread.
  let degraded = false, slow = 0, samples = 0, prev = 0;
  function loop(now) {
    const t0 = performance.now();
    frame();
    // Watch the first 30 frames (skipping the first, which compiles shaders):
    // if JS cost or the frame-to-frame gap shows the device is struggling,
    // keep the still frame and stop animating.
    samples++;
    if (samples > 1 && samples <= 30) {
      const cost = performance.now() - t0, gap = prev ? now - prev : 0;
      if (cost > 22 || gap > 50) slow++;
      if (slow >= 6) { degraded = true; running = false; return; }
    }
    prev = now;
    raf = running ? requestAnimationFrame(loop) : 0;
  }
  function setRunning(on) {
    if (reduced || degraded) return;
    if (on && !running) { running = true; raf = requestAnimationFrame(loop); }
    else if (!on && running) { running = false; cancelAnimationFrame(raf); }
  }
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    setRunning(visible && !document.hidden);
  }).observe(hero);
  document.addEventListener('visibilitychange', () => setRunning(visible && !document.hidden));

  // Fade in once the first frame is drawn.
  canvas.style.opacity = '0';
  canvas.style.transition = 'opacity 1s ease';
  frame();
  requestAnimationFrame(() => { canvas.style.opacity = '1'; hero.classList.add('webgl'); });
  setRunning(true);
}

/** True when WebGL would run on a GPU. Software renderers (SwiftShader,
 * llvmpipe) and very low-memory or data-saver devices get the static hero. */
function canRun3D() {
  if (/[?&]3d=1\b/.test(location.search)) return true; // force on (testing)
  try {
    const c = navigator.connection;
    if (c && (c.saveData || /2g/.test(c.effectiveType || ''))) return false;
    if (navigator.deviceMemory && navigator.deviceMemory < 2) return false;
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) return false;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return !/swiftshader|llvmpipe|software|basic render/i.test(name);
  } catch (e) {
    return false;
  }
}

function start() {
  if (!canRun3D()) return;
  import('../vendor/three.module.min.js').then((mod) => { THREE = mod; init(); }).catch(() => { /* keep CSS background */ });
}
// Wait for the page to finish loading, then for an idle moment, so the 3D
// scene never delays the first paint or the tools themselves.
function schedule() {
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
  idle(start, { timeout: 2500 });
}
if (canvas && document.readyState === 'complete') schedule();
else if (canvas) window.addEventListener('load', schedule, { once: true });
