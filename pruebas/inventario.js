/* Inventario y fauna (desde 1.7.0): lo que se notaba jugando.
   ────────────────────────────────────────────────────────────────────────────
   · Niveles con mucha fauna: techo de entidades, sólo unas pocas persiguen a
     la vez y los especiales ya no se encadenan (uno cada 5 s como mínimo).
   · Inventario: cada hueco es un objeto, con un máximo de unidades por objeto
     que baja con la dificultad; se puede soltar al suelo o desechar.
   · Uso rápido de objetos, curar por zonas con [N], ajustes en pestañas.
   · Salidas: nada semitransparente que tape al jugador, sin baliza, más lejos.
   · Paredes de clipping casi invisibles.                                   */

const { cargar, crearContador } = require("./banco.js");
const fs = require("fs"), path = require("path");
const j = cargar();
const {
  G, CAT, ITEMS, ENT_DEF, PARTS, DIFFS, buildLevel, player, bfs, w2c,
  addItem, hasItem, updateSpecial, stackMax, invCount, dropItem, pickDrop, slotKey,
  OPT_ROWS, OPT_TAB_OF, OPT_TABS
} = j;
const c = crearContador();
const RAPIDO = !!process.env.ZUMBIDO_RAPIDO;          // node pruebas/todo.js rapido
const fuente = fs.readFileSync(path.join(__dirname, "..", "el-zumbido.html"), "utf8");

function limpio(id, semilla) {
  buildLevel(id || "0", semilla || 1);
  G.running = true; G.paused = false; G.dead = false; G.grab = null;
  G.grace = 0; G.sanity = 100; G.spGate = 0; G.spWarn = null;
  PARTS.forEach(p => { G.body[p.id] = 100; G.bleeding[p.id] = 0; });
}

/* ── 1. niveles con mucha fauna ── */
console.log("── NIVELES CON MUCHA FAUNA ──");
let peor = 0, peorTipo = 0, dondePeor = "";
// en la rápida sólo el caso más cargado: Sin retorno, muy abajo
for (const modo of (RAPIDO ? [4] : [1, 2, 3, 4])) {
  G.opts = Object.assign({}, G.opts, { diff: modo });
  for (const depth of (RAPIDO ? [20] : [0, 8, 20])) {
    G.depth = depth;
    for (const l of CAT) {
      if (l.settlement) continue;
      limpio(l.id, 3);
      const max = DIFFS[modo].maxEnts;
      if (G.entities.length > max) { peor = Math.max(peor, G.entities.length); dondePeor = l.id + " modo " + modo; }
      const porTipo = {};
      G.entities.forEach(e => porTipo[e.type] = (porTipo[e.type] || 0) + 1);
      peorTipo = Math.max(peorTipo, ...Object.values(porTipo), 0);
    }
  }
}
G.depth = 0; G.opts = Object.assign({}, G.opts, { diff: 2 });
c.ok(peor === 0, "ningún nivel pasa del techo de su dificultad (7/10/12/14), ni a descenso 21" + (dondePeor ? ": " + dondePeor : ""));
c.ok(peorTipo <= 4, "nunca más de 4 de la misma especie (máximo visto: " + peorTipo + ")");

limpio("1", 2);
player.pos.set(G.cell * 4, 0, G.cell * 4);
G.torchOn = true; G.noise = 1;
const mk = t => ({ def: ENT_DEF[t], x: player.pos.x + 1, z: player.pos.z, r: 0.3, stun: 0, grabbed: false, spCd: 0, spWind: 0 });
const a = mk("hound"), b = mk("wretch");
updateSpecial(a, 1.0, 1 / 60);
updateSpecial(b, 1.0, 1 / 60);
c.ok(a.spWind > 0 && b.spWind === 0, "si una entidad está cargando su especial, la otra espera");
for (let i = 0; i < 200; i++) { updateSpecial(a, 1.0, 1 / 60); updateSpecial(b, 1.0, 1 / 60); }
c.ok(b.spWind === 0, "y sigue esperando mientras dura la pausa entre especiales (" + G.spGate.toFixed(1) + " s)");
G.spGate = 0;
updateSpecial(b, 1.0, 1 / 60);
c.ok(b.spWind > 0, "pasada la pausa, ya puede");
c.ok(DIFFS.slice(1).every(d => d.chasers >= 2 && d.chasers <= 4), "sólo 2-4 entidades persiguen a la vez según la dificultad; el resto ronda");
c.ok(/G\.grabImmune = 4\.0;/.test(fuente), "tras soltarte de un agarre, 4 s sin que te agarre otra (antes 2,6)");

/* ── 2. inventario ── */
console.log("\n── HUECOS POR OBJETO, MÁXIMO POR OBJETO ──");
limpio();
G.inv = []; G.cap = 4; G.equip = {}; G.weapons = { L: null, R: null };
for (let i = 0; i < 5; i++) addItem("almond", 1);
c.ok(invCount() === 1, "cinco Almond Water ocupan un solo hueco (antes, cinco)");
const maxAgua = stackMax("almond");
for (let i = 0; i < 20; i++) addItem("almond", 1);
c.ok(G.inv[0].qty === maxAgua && addItem("almond", 1) === false, "no se pasa del máximo por objeto (" + maxAgua + ")");
const maxPorModo = [1, 2, 3, 4].map(m => { G.opts = Object.assign({}, G.opts, { diff: m }); return stackMax("bandage"); });
G.opts = Object.assign({}, G.opts, { diff: 2 });
c.ok(maxPorModo[0] > maxPorModo[1] && maxPorModo[1] > maxPorModo[2] && maxPorModo[2] > maxPorModo[3] && maxPorModo[3] >= 1,
  "el máximo baja con la dificultad (vendas: " + maxPorModo.join(" · ") + ")");
addItem("bandage", 1); addItem("battery", 1); addItem("flare", 1);
c.ok(invCount() === 4 && addItem("recorder", 1) === false, "cuatro objetos distintos llenan los cuatro huecos");

console.log("\n── SOLTAR Y DESECHAR ──");
const antes = G.inv.find(s => s.id === "flare").qty;
dropItem("flare", null, false);
c.ok(!hasItem("flare") && G.drops.length === 1 && G.drops[0].qty === antes, "soltar deja el objeto en el suelo, donde estás");
pickDrop(G.drops[0]);
c.ok(hasItem("flare") && G.drops.length === 0, "y se vuelve a recoger");
const aguaAntes = G.inv.find(s => s.id === "almond").qty;
dropItem("almond", null, true);
c.ok(G.inv.find(s => s.id === "almond").qty === aguaAntes - 1 && G.drops.length === 0, "desechar quita una unidad y no deja nada en el suelo");
G.weapons = { L: "pipe", R: null };
dropItem("pipe", "L", false);
c.ok(G.weapons.L === null && G.drops.some(d => d.id === "pipe"), "un arma se suelta desde la mano");
G.equip.backpack = true; G.cap = 10;
G.inv = [1, 2, 3, 4, 5].map(i => ({ id: ["almond", "bandage", "battery", "flare", "recorder"][i - 1], qty: 1 }));
dropItem("backpack", null, false);
c.ok(G.equip.backpack === true && G.cap === 10, "la mochila no se suelta si lo que llevas no cabe en los bolsillos");

/* ── 3. uso rápido ── */
console.log("\n── USAR OBJETOS DE UNA PULSACIÓN ──");
limpio();
G.inv = [{ id: "almond", qty: 3 }]; G.sanity = 40; G.held = null;
G.opts = Object.assign({}, G.opts, { quickUse: 1 });
slotKey(0);
c.ok(G.sanity > 40 && G.inv[0].qty === 2, "con uso rápido, una pulsación ya bebe el agua");
G.opts = Object.assign({}, G.opts, { quickUse: 0 });
G.sanity = 40; slotKey(0);
const trasUna = G.sanity;
slotKey(0);
c.ok(trasUna === 40 && G.sanity > 40, "sin él, la primera la saca y la segunda la usa, como antes");
G.opts = Object.assign({}, G.opts, { quickUse: 1 });

/* ── 4. ajustes, salidas, clipping, pausa ── */
console.log("\n── AJUSTES, SALIDAS Y DETALLES ──");
c.ok(OPT_TABS.length === 4 && OPT_ROWS.every(r => OPT_TAB_OF[r.id]), "los " + OPT_ROWS.length + " ajustes están repartidos en " + OPT_TABS.length + " pestañas");
const glow = fuente.match(/const glowMat = [^\n]*/)[0];
c.ok(/depthWrite:false/.test(glow), "el brillo de las salidas no escribe profundidad (era lo que tapaba al jugador)");
c.ok(!/const beacon/.test(fuente), "sin baliza: la salida no se ve desde la otra punta del nivel");
c.ok(/color:0xd8d0ff, transparent:true, opacity:\.04/.test(fuente), "las paredes de clipping arrancan casi invisibles");
c.ok(!/pauseMapBtn/.test(fuente), "sin botón de mapa del descenso en la pausa");
let lejos = true;
for (const l of CAT.slice(0, 25)) {
  if (l.settlement) continue;
  limpio(l.id, 5);
  const { dist } = bfs(G.grid, G.n, w2c(player.pos.x), w2c(player.pos.z));
  let far = 0; for (const d of dist) if (d > far) far = d;
  for (const e of G.exits) if (dist[e.cell[1] * G.n + e.cell[0]] < far * 0.38) lejos = false;
}
c.ok(lejos, "las salidas quedan más lejos: nunca antes del 38% del recorrido");

process.exit(c.resumen("el inventario") ? 1 : 0);
