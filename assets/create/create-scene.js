/**
 * Create studio scene — Production glTF-ready Three.js loader.
 * Drop an optimized .glb at ../models/create-hero.glb later;
 * until then we render a lightweight procedural hero mesh.
 * Honors prefers-reduced-motion and WebGL failure.
 */
(function () {
  const canvas = document.getElementById('createCanvas');
  const fallback = document.getElementById('createFallback');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function showFallback() {
    if (canvas) canvas.style.display = 'none';
    if (fallback) fallback.classList.add('is-visible');
  }

  // Scroll reveals — opt-in via .js-motion so content stays visible if this script never runs
  const nodes = document.querySelectorAll('.create-reveal');
  if (reduce) {
    nodes.forEach((n) => n.classList.add('is-in'));
    showFallback();
    return;
  }
  document.documentElement.classList.add('js-motion');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    nodes.forEach((n) => io.observe(n));
  } else {
    nodes.forEach((n) => n.classList.add('is-in'));
  }

  if (!canvas || typeof THREE === 'undefined') {
    showFallback();
    return;
  }

  let renderer, scene, camera, mesh, mixer, clock, raf, ro;
  // Future: load ../models/create-hero.glb via GLTFLoader + DRACOLoader when asset exists.

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    else if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.15, 3.2);

    const amb = new THREE.AmbientLight(0xb8d4e8, 0.55);
    const key = new THREE.DirectionalLight(0x00c9b1, 1.1);
    key.position.set(2.5, 3, 2);
    const rim = new THREE.DirectionalLight(0xc9973a, 0.65);
    rim.position.set(-2, 1, -1.5);
    scene.add(amb, key, rim);

    const geo = new THREE.IcosahedronGeometry(1.05, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a2d45,
      metalness: 0.55,
      roughness: 0.28,
      emissive: 0x00c9b1,
      emissiveIntensity: 0.08,
      flatShading: true,
    });
    mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0xc9973a, transparent: true, opacity: 0.22 })
    );
    mesh.add(wire);

    // Optional GLB swap (silent if missing)
    if (typeof THREE.GLTFLoader === 'function' || (THREE.addons && THREE.addons.GLTFLoader)) {
      // skip — CDN classic build may not include loaders; procedural mesh is the ship path
    }

    clock = new THREE.Clock();

    function resize() {
      const wrap = canvas.parentElement;
      const w = Math.max(wrap.clientWidth, 1);
      const h = Math.max(wrap.clientHeight, 320);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    function tick() {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      mesh.rotation.y = t * 0.28;
      mesh.rotation.x = Math.sin(t * 0.35) * 0.18;
      mesh.position.y = Math.sin(t * 0.7) * 0.06;
      if (mixer) mixer.update(clock.getDelta());
      renderer.render(scene, camera);
    }
    tick();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else tick();
    });
  } catch (err) {
    console.warn('[create-scene]', err);
    showFallback();
  }
})();
