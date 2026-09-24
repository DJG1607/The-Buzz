/* Comprueba que los 26 niveles se pueden jugar.
   ────────────────────────────────────────────────────────────────────────────
   Genera cada nivel con muchas semillas distintas y mira tres cosas:

     1. Que el nivel sea jugable: se puede llegar a las salidas y a los
        contenedores, no apareces dentro de una pared ni con una entidad
        encima, y ningún mueble deja trozos del mapa incomunicados.
     2. Que el grafo de saltos esté sano: ninguna salida apunta a un nivel que
        no existe y no hay niveles a los que no se pueda llegar.
     3. Que la dificultad suba con el campo `risk` de cada nivel.

   Ojo con una cosa que parece un fallo y no lo es: cada partida coloca sólo
   2-4 de las salidas que el nivel declara (nExits = 2 + rand()*3). Es a
   propósito, las salidas son aleatorias. Lo que sí se comprueba es que, con
   suficientes semillas, todos los destinos declarados lleguen a aparecer.   */

const { cargar, crearContador } = require("./banco.js");
const j = cargar();
const { CAT, G, buildLevel, bfs, player, w2c, ENT_DEF, DIFFS } = j;
const c = crearContador();

// en modo rápido (node pruebas/todo.js rapido) se miran 2 semillas en vez de 20
const RAPIDO = !!process.env.ZUMBIDO_RAPIDO;
const SEMILLAS = Array.from({ length: RAPIDO ? 2 : 20 }, (_, i) => i * 7919 + 3);
if (RAPIDO) console.log("  (versión rápida: " + SEMILLAS.length + " semillas; los destinos y las salidas por nivel sólo se miran en la completa)");

/* ── 1. cada nivel, con cada semilla, tiene que ser jugable ── */
function jugable(cfg, semilla) {
  const problemas = [];
  try { buildLevel(cfg.id, semilla); }
  catch (e) { return ["revienta al generar: " + e.message]; }

  const n = G.n, rejilla = G.grid;
  const cx = Math.max(0, Math.min(n - 1, w2c(player.pos.x)));
  const cy = Math.max(0, Math.min(n - 1, w2c(player.pos.z)));
  if (rejilla[cy * n + cx] === 1) problemas.push("apareces dentro de una pared");

  const d = bfs(rejilla, n, cx, cy).dist;

  if (!G.exits.length) problemas.push("sin salidas");
  for (const e of G.exits)
    if (d[e.cell[1] * n + e.cell[0]] < 0) problemas.push("salida a «" + e.destId + "» inalcanzable");

  for (const cont of G.containers) {
    const kx = w2c(cont.x), ky = w2c(cont.z);
    if (kx < 0 || ky < 0 || kx >= n || ky >= n) problemas.push("contenedor fuera del mapa");
    else if (d[ky * n + kx] < 0) problemas.push("contenedor inalcanzable");
  }

  let cerca = Infinity;
  for (const e of G.entities) cerca = Math.min(cerca, Math.hypot(e.x - player.pos.x, e.z - player.pos.z));
  if (G.entities.length && cerca < 12) problemas.push("entidad a " + cerca.toFixed(1) + " m nada más entrar");

  let abiertas = 0, aisladas = 0;
  for (let i = 0; i < n * n; i++) {
    if (rejilla[i] === 1) continue;
    abiertas++;
    if (d[i] < 0) aisladas++;
  }
  if (aisladas / abiertas > 0.02) problemas.push(aisladas + " de " + abiertas + " celdas incomunicadas");

  return problemas.length ? [...new Set(problemas)] : null;
}

console.log("── ¿SE PUEDE JUGAR CADA NIVEL? (" + SEMILLAS.length + " semillas cada uno) ──");
let pruebas = 0;
for (const cfg of CAT) {
  const malas = [];
  for (const s of SEMILLAS) {
    pruebas++;
    const p = jugable(cfg, s);
    if (p) malas.push("semilla " + s + ": " + p.join("; "));
  }
  const etiqueta = ("Level " + cfg.id + " " + cfg.title).padEnd(30).slice(0, 30);
  if (malas.length) { c.fallar(etiqueta + "\n      " + malas.join("\n      ")); }
  else console.log("  OK    " + etiqueta +
    G.exits.length + " salidas, " + G.containers.length + " contenedores, " + G.entities.length + " entidades");
}
console.log("  (" + pruebas + " generaciones)");

/* ── 2. el grafo de saltos ── */
console.log("\n── EL GRAFO DE SALTOS ──");
const ids = new Set(CAT.map(x => x.id));
const entran = {}; CAT.forEach(x => entran[x.id] = []);
const rotas = [];
for (const cfg of CAT)
  for (const r of cfg.exitsTo) {
    if (r.to === "deep") continue;                  // salto a nivel sin catalogar
    if (!ids.has(r.to)) rotas.push(cfg.id + " → " + r.to);
    else entran[r.to].push(cfg.id);
  }
c.ok(rotas.length === 0, rotas.length ? "salidas a niveles que no existen: " + rotas.join(", ")
  : "todas las salidas apuntan a niveles que existen");

const huerfanos = CAT.filter(x => x.id !== "0" && !entran[x.id].length).map(x => x.id);
c.ok(huerfanos.length === 0, huerfanos.length ? "niveles a los que no se llega: " + huerfanos.join(", ")
  : "a los " + CAT.length + " niveles se puede llegar (el Level 0 es el de entrada)");

/* ── 3. todos los destinos declarados acaban apareciendo ── */
console.log("\n── LOS DESTINOS DECLARADOS, ¿SALEN ALGUNA VEZ? ──");
if (RAPIDO) console.log("  (saltado en la versión rápida: necesita muchas semillas)");
for (const cfg of (RAPIDO ? [] : CAT)) {
  const declarados = [...new Set(cfg.exitsTo.map(r => r.to))];
  const vistos = {}; declarados.forEach(x => vistos[x] = 0);
  let minSalidas = 99, minPasos = 1e9;
  for (const s of SEMILLAS) {
    buildLevel(cfg.id, s);
    minSalidas = Math.min(minSalidas, G.exits.length);
    for (const e of G.exits) if (vistos[e.destId] !== undefined) vistos[e.destId]++;
    const d = bfs(G.grid, G.n, w2c(player.pos.x), w2c(player.pos.z)).dist;
    for (const e of G.exits) {
      const paso = d[e.cell[1] * G.n + e.cell[0]];
      if (paso >= 0) minPasos = Math.min(minPasos, paso);
    }
  }
  const nunca = declarados.filter(x => !vistos[x]);
  const etiqueta = ("Level " + cfg.id).padEnd(12) +
    (declarados.length - nunca.length) + "/" + declarados.length + " destinos" +
    ", mínimo " + minSalidas + " salidas, la más cercana a " + minPasos + " pasos";
  // con pocas semillas es normal que algún destino no llegue a salir: eso sólo se exige en la completa
  c.ok((RAPIDO || nunca.length === 0) && minSalidas >= 2 && minPasos >= 10,
    etiqueta + (nunca.length ? "  ← nunca aparece: " + nunca.join(",") : ""));
}

/* ── 4. la amenaza sube con el riesgo declarado ── */
console.log("\n── ¿LA DIFICULTAD SIGUE AL CAMPO risk? ──");
const filas = CAT.map(cfg => {
  let amenaza = 0;
  for (const [tipo, cuantos] of Object.entries(cfg.ents || {})) {
    const def = ENT_DEF[tipo];
    if (!def || !cuantos) continue;
    amenaza += cuantos * def.dmg * (def.kind === "walker" ? Math.max(0.5, def.chase / 4) : 0.6);
  }
  const area = cfg.grid * cfg.grid * 0.5 * cfg.cell * cfg.cell / 1000;
  return { id: cfg.id, risk: cfg.risk, amenaza: amenaza / area };
});
const medias = [0, 1, 2, 3].map(r => {
  const g = filas.filter(f => f.risk === r && f.amenaza > 0);
  return g.length ? g.reduce((a, f) => a + f.amenaza, 0) / g.length : 0;
});
medias.forEach((m, r) => console.log("  riesgo " + r + ": amenaza media " + m.toFixed(1)));
for (let r = 1; r < 4; r++)
  c.ok(medias[r] > medias[r - 1], "el riesgo " + r + " pega más que el " + (r - 1));

process.exit(c.resumen("los niveles") ? 1 : 0);
