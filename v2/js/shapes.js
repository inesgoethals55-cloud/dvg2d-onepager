/* Vormen: één bron voor
   - de platte SVG-vormen met ankerpunten (main.js, terugval),
   - de 3D-modellen in models/*.glb (tools/export-models.html),
   - de 3D-scènes op de pagina (three-scene.js).
   Alles staat in hetzelfde vlak van 400 × 400. */

// Een node: p = ankerpunt, i = inkomend handvat, o = uitgaand handvat.
const SHAPE_NODES = {
  lens: [
    { p: [40, 360], i: [20, 140], o: [260, 380] },
    { p: [360, 40], i: [380, 260], o: [140, 20] },
  ],
  blob: [
    { p: [170, 20], i: [70, 30], o: [280, 10] },
    { p: [380, 150], i: [360, 60], o: [395, 260] },
    { p: [240, 380], i: [340, 390], o: [120, 370] },
    { p: [20, 230], i: [30, 340], o: [10, 120] },
  ],
  arch: [
    { p: [60, 390], i: [60, 390], o: [60, 390] },
    { p: [60, 200], i: [60, 200], o: [60, 14] },
    { p: [340, 200], i: [340, 14], o: [340, 200] },
    { p: [340, 390], i: [340, 390], o: [340, 390] },
  ],
};

/* 3D-composities: dezelfde opstelling als de SVG-vormen.
   model  = bestand in models/ (lens, blob, arch, disc, tile)
   color  = CSS-variabele; --s1/--s2/--s3 kiest smartColors per achtergrond
   cx, cy = middelpunt, s = grootte (sy voor een afwijkende hoogte), rot = graden */
const SCENES_3D = {
  hero: [
    { model: 'disc', color: '--brand-primary', cx: 250, cy: 215, s: 270 },
    { model: 'lens', color: '--brand-secondary', cx: 144, cy: 274, s: 248 },
    { model: 'tile', color: '--brand-neutral', cx: 328, cy: 328, s: 56, rot: 14 },
    { model: 'tile', color: '--brand-dark', cx: 100, cy: 153, s: 120, sy: 6 },
    { model: 'tile', color: '--brand-dark', cx: 100, cy: 167, s: 120, sy: 6 },
    { model: 'tile', color: '--brand-dark', cx: 100, cy: 181, s: 120, sy: 6 },
    { model: 'disc', color: '--brand-accent', cx: 96, cy: 96, s: 32 },
  ],
  sections: [
    [
      { model: 'lens', color: '--s1', cx: 200, cy: 200, s: 400 },
      { model: 'disc', color: '--s2', cx: 320, cy: 320, s: 124 },
    ],
    [
      { model: 'blob', color: '--s1', cx: 200, cy: 200, s: 340 },
      { model: 'tile', color: '--s3', cx: 52, cy: 332, s: 64 },
      { model: 'disc', color: '--s2', cx: 350, cy: 60, s: 52 },
    ],
    [
      { model: 'arch', color: '--s1', cx: 200, cy: 200, s: 400 },
      { model: 'disc', color: '--s3', cx: 200, cy: 210, s: 104 },
    ],
    [
      { model: 'tile', color: '--s3', cx: 250, cy: 140, s: 200, rot: 14 },
      { model: 'blob', color: '--s1', cx: 130, cy: 280, s: 220 },
    ],
    [
      { model: 'disc', color: '--s1', cx: 220, cy: 190, s: 320 },
      { model: 'lens', color: '--s2', cx: 260, cy: 250, s: 280 },
    ],
    [
      { model: 'arch', color: '--s1', cx: 220, cy: 220, s: 360 },
      { model: 'blob', color: '--s2', cx: 306, cy: 326, s: 152 },
    ],
  ],
};

window.SHAPE_NODES = SHAPE_NODES;
window.SCENES_3D = SCENES_3D;
