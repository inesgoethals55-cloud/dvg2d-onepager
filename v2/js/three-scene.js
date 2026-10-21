/* ==========================================================
   3D-vormen (skill: add-3d-assets)
   De platte vormen worden echte 3D-modellen (models/*.glb) in een
   Three.js-scène. Volgorde van terugval:
     1. GLB-modellen laden uit models/ (via een server)
     2. lukt dat niet (bv. file://), dezelfde vormen hier zelf extruderen
     3. lukt 3D helemaal niet (geen WebGL, geen internet), dan blijft de SVG
   ========================================================== */

(() => {
  const MODELS = ['lens', 'blob', 'arch', 'disc', 'tile'];
  const DEPTH = 0.16; // diepte van de extrusie, relatief tot de grootte van de vorm
  const BASE_TILT = { x: -0.5, y: 0.62 };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- geometrie uit de gedeelde vormen (ook gebruikt door tools/export-models.html) ---------- */

  // 400×400-vlak (y naar beneden) → eenheidsvlak rond 0 (y naar boven)
  const unit = ([x, y]) => [(x - 200) / 400, (200 - y) / 400];

  function nodesToShape(THREE, nodes) {
    const shape = new THREE.Shape();
    shape.moveTo(...unit(nodes[0].p));
    nodes.forEach((a, k) => {
      const b = nodes[(k + 1) % nodes.length];
      shape.bezierCurveTo(...unit(a.o), ...unit(b.i), ...unit(b.p));
    });
    return shape;
  }

  function buildGeometry(THREE, name) {
    let shape;
    if (name === 'disc') {
      shape = new THREE.Shape().absarc(0, 0, 0.5, 0, Math.PI * 2, false);
    } else if (name === 'tile') {
      shape = new THREE.Shape();
      shape.moveTo(-0.5, -0.5).lineTo(0.5, -0.5).lineTo(0.5, 0.5).lineTo(-0.5, 0.5).lineTo(-0.5, -0.5);
    } else {
      shape = nodesToShape(THREE, window.SHAPE_NODES[name]);
    }
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.008,
      bevelSegments: 4,
      curveSegments: 24,
    });
    geo.translate(0, 0, -DEPTH / 2);
    geo.computeVertexNormals();
    return geo;
  }

  window.DVG3D = { MODELS, buildGeometry };

  /* ---------- kleuren uit CSS ---------- */

  const probe = document.createElement('canvas').getContext('2d');
  function cssColor(THREE, el, varName) {
    probe.fillStyle = '#000';
    probe.fillStyle = getComputedStyle(el).getPropertyValue(varName).trim() || '#000';
    return new THREE.Color().setStyle(probe.fillStyle, THREE.SRGBColorSpace);
  }

  function webglAvailable() {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) {
      return false;
    }
  }

  /* ---------- AssetLoader: elk model één keer laden, daarna hergebruiken ---------- */

  async function loadGeometries(THREE) {
    if (location.protocol !== 'file:') {
      try {
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();
        const entries = await Promise.all(MODELS.map(async (name) => {
          const gltf = await loader.loadAsync(`models/${name}.glb`);
          let geo = null;
          gltf.scene.traverse((o) => { if (o.isMesh && !geo) geo = o.geometry; });
          if (!geo) throw new Error(`geen mesh in ${name}.glb`);
          return [name, geo];
        }));
        return Object.fromEntries(entries);
      } catch (err) {
        console.info('3D: GLB-modellen niet geladen, vormen worden zelf opgebouwd.', err.message);
      }
    }
    return Object.fromEntries(MODELS.map((name) => [name, buildGeometry(THREE, name)]));
  }

  /* ---------- één scène per vormvlak ---------- */

  function mount(THREE, el, items, geos) {
    const canvas = document.createElement('canvas');
    canvas.className = 'art3d';
    canvas.setAttribute('aria-hidden', 'true');

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (e) {
      return null;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const half = 250;
    const camera = new THREE.OrthographicCamera(-half, half, half, -half, 1, 4000);
    camera.position.set(0, 0, 1500);

    // mat materiaal + afgestemd licht (Three.js rekent fysisch, vandaar ~π): de voorkant
    // houdt ongeveer de echte paletkleur, de zijkanten worden donkerder en tonen de diepte
    scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 1.55));
    const key = new THREE.DirectionalLight(0xffffff, 2.05);
    key.position.set(-300, 500, 900);
    scene.add(key);

    const group = new THREE.Group();
    items.forEach((item, k) => {
      const material = new THREE.MeshLambertMaterial({ color: cssColor(THREE, el, item.color) });
      const mesh = new THREE.Mesh(geos[item.model], material);
      mesh.position.set(item.cx - 200, 200 - item.cy, k * 34);
      mesh.scale.set(item.s, item.sy || item.s, item.s);
      mesh.rotation.z = -THREE.MathUtils.degToRad(item.rot || 0);
      group.add(mesh);
    });
    group.rotation.set(BASE_TILT.x, BASE_TILT.y, 0);
    scene.add(group);

    const size = () => {
      const w = el.clientWidth || 300;
      renderer.setSize(w, w, false);
    };
    size();
    new ResizeObserver(size).observe(el);

    const target = { x: BASE_TILT.x, y: BASE_TILT.y };
    let visible = false;
    let frame = null;

    const draw = () => {
      frame = null;
      group.rotation.x += (target.x - group.rotation.x) * 0.08;
      group.rotation.y += (target.y - group.rotation.y) * 0.08;
      renderer.render(scene, camera);
      const moving = Math.abs(target.x - group.rotation.x) + Math.abs(target.y - group.rotation.y) > 0.0005;
      if (visible && moving && !reducedMotion) frame = requestAnimationFrame(draw);
    };
    const request = () => { if (!frame) frame = requestAnimationFrame(draw); };

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) request();
    }, { rootMargin: '100px' }).observe(el);

    renderer.render(scene, camera);
    el.prepend(canvas);
    el.classList.add('is-3d');

    return {
      // de vormen draaien licht mee met de muis (desktop) of het scrollen (touch)
      tilt(dx, dy) {
        if (reducedMotion) return;
        target.x = BASE_TILT.x + dy * 0.35;
        target.y = BASE_TILT.y + dx * 0.5;
        if (visible) request();
      },
      el,
    };
  }

  async function boot() {
    if (!webglAvailable() || !window.SCENES_3D) return;

    let THREE;
    try {
      THREE = await import('three');
    } catch (err) {
      console.info('3D: Three.js niet geladen, de platte vormen blijven staan.', err.message);
      return;
    }

    const geos = await loadGeometries(THREE);
    const targets = [];
    const hero = document.querySelector('.hero__art');
    if (hero) targets.push([hero, window.SCENES_3D.hero]);
    document.querySelectorAll('.section__art').forEach((el, i) => {
      const list = window.SCENES_3D.sections;
      targets.push([el, list[i % list.length]]);
    });

    const scenes = targets.map(([el, items]) => mount(THREE, el, items, geos)).filter(Boolean);
    if (reducedMotion || !scenes.length) return;

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (finePointer) {
      addEventListener('pointermove', (e) => {
        scenes.forEach((s) => {
          const r = s.el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > innerHeight) return;
          const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / innerWidth));
          const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / innerHeight));
          s.tilt(dx, dy);
        });
      }, { passive: true });
    } else {
      addEventListener('scroll', () => {
        scenes.forEach((s) => {
          const r = s.el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > innerHeight) return;
          s.tilt(0, (r.top + r.height / 2 - innerHeight / 2) / innerHeight);
        });
      }, { passive: true });
    }
  }

  if (document.querySelector('.hero__art')) {
    document.addEventListener('dvg:rendered', () => { boot(); }, { once: true });
  }
})();
