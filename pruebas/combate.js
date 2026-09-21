/* Comprueba las entidades: velocidades, aliento y ataques especiales.
   ────────────────────────────────────────────────────────────────────────────
   Las dos reglas que sostienen el combate y conviene no romper:

     · Huir tiene que funcionar. La velocidad sostenible del jugador
       (alternando sprint y paso, con el aliento en equilibrio) es ~4,3 m/s.
       Sólo el Hound y el Wretch la superan, y los dos se cansan a los 7 s,
       momento en que bajan por debajo de andar.
     · Ningún ataque especial mata de un golpe estando sano. Duele mucho,
       pero siempre te deja una segunda oportunidad.                        */

const fs = require("fs");
const path = require("path");
const { cargar, crearContador, JUEGO } = require("./banco.js");
const j = cargar();
const { ENT_DEF, entitySpecial, updateSpecial, G, PARTS, bodyAvg, buildLevel, player } = j;
const c = crearContador();

const src = fs.readFileSync(JUEGO, "utf8");
const ANDAR = +src.match(/const WALK = ([\d.]+)/)[1];
const CORRER = +src.match(/RUN = ([\d.]+)/)[1];
const GASTO = +src.match(/G\.stamina - dt\*([\d.]+)\)/)[1];
const RECUPERA = +src.match(/dt\*\(moving\?([\d.]+):/)[1];

/* ── 1. huir funciona ── */
const ciclo = RECUPERA / (RECUPERA + GASTO);           // fracción del tiempo corriendo
const SOSTENIBLE = ciclo * CORRER + (1 - ciclo) * ANDAR;

console.log("── PERSECUCIÓN ──");
console.log("  andar " + ANDAR + " · correr " + CORRER + " · sostenible " + SOSTENIBLE.toFixed(2) + " m/s\n");
const perseguidores = Object.entries(ENT_DEF)
  .filter(([, d]) => d.kind === "walker")
  .sort((a, b) => b[1].chase - a[1].chase);
for (const [k, d] of perseguidores) {
  const teGana = d.chase > SOSTENIBLE;
  console.log("  " + k.padEnd(10) + "persec " + String(d.chase).padEnd(5) +
    "daño " + String(d.dmg).padEnd(4) + "memoria " + String(d.memory).padEnd(4) +
    (d.tires ? "se cansa" : "        ") +
    (teGana ? "   TE GANA a la larga" : "   lo dejas atrás"));
  if (teGana) c.ok(d.tires === true, "    ↳ " + k + " te gana, así que tiene que cansarse");
}
const cansado = k => ENT_DEF[k].chase * 0.7;           // el 0,7 del código cuando `tires`
for (const [k, d] of perseguidores)
  if (d.tires) c.ok(cansado(k) < ANDAR, k + " cansado (" + cansado(k).toFixed(1) + " m/s) baja de andar");

/* ── 2. cada entidad tiene su especial, en los dos idiomas ── */
console.log("\n── FICHAS DE ATAQUE ESPECIAL ──");
const CAMPOS = ["name", "log", "tell", "death"];
for (const [k, def] of Object.entries(ENT_DEF)) {
  const sp = def.sp;
  if (!sp) { c.fallar(k + " no tiene ataque especial"); continue; }
  const faltan = [];
  for (const campo of CAMPOS) {
    if (!sp[campo]) faltan.push(campo);
    if (!sp[campo + "_en"]) faltan.push(campo + "_en");   // el juego está en dos idiomas
  }
  if (!sp.pct || !sp.parts || !sp.parts.length) faltan.push("pct/parts");
  for (const p of sp.parts || [])
    if (!PARTS.some(x => x.id === p)) faltan.push("zona inventada: " + p);
  c.ok(faltan.length === 0, k.padEnd(10) + sp.name.padEnd(24) +
    String(Math.round(sp.pct * 100) + "%").padStart(4) + " a " + (sp.parts || []).join("+").padEnd(28) +
    (sp.reach ? "a distancia " + sp.reach + " m" : "sólo al perder el forcejeo") +
    (faltan.length ? "   ← falta: " + faltan.join(",") : ""));
}

/* ── 3. el daño es el que dice la ficha, y nunca mata de un golpe ── */
console.log("\n── DAÑO REAL SOBRE UN CUERPO SANO ──");
buildLevel("0", 1);
const sano = () => {
  PARTS.forEach(p => { G.body[p.id] = 100; G.bleeding[p.id] = 0; });
  G.sanity = 100; G.dead = false; G.grace = 0; G.grab = null;
};
for (const [k, def] of Object.entries(ENT_DEF)) {
  if (!def.sp) continue;
  sano();
  const antes = bodyAvg();
  entitySpecial({ def });
  const perdido = antes - bodyAvg();
  const esperado = def.sp.pct * 100;
  c.ok(Math.abs(perdido - esperado) < 0.6 && !G.dead,
    k.padEnd(10) + "vida " + antes.toFixed(0) + " → " + bodyAvg().toFixed(0) +
    " (-" + perdido.toFixed(1) + ", esperado -" + esperado.toFixed(0) + ")" +
    (G.dead ? "   ← MATA DE UN GOLPE" : ""));
}

/* ── 4. el especial a distancia avisa y se puede esquivar ── */
console.log("\n── LOS QUE ATACAN A DISTANCIA AVISAN ANTES ──");
const DT = 1 / 60;
buildLevel("36", 5);                                   // el aeropuerto no tiene entidades propias
player.pos.set(G.cell * 4, 0, G.cell * 4);
const bicho = (tipo, dist) => ({
  def: ENT_DEF[tipo], x: player.pos.x + dist, z: player.pos.z,
  r: 0.3, stun: 0, grabbed: false, spCd: 0, spWind: 0
});
const conAlcance = Object.keys(ENT_DEF).filter(k => ENT_DEF[k].sp && ENT_DEF[k].sp.reach);

for (const tipo of conAlcance) {
  sano(); G.torchOn = true; G.noise = 1;               // el Smiler necesita luz o ruido
  const e = bicho(tipo, 1.0);
  const golpeaYa = updateSpecial(e, 1.0, DT);
  c.ok(!golpeaYa && e.spWind > 0, tipo.padEnd(10) + "avisa " + e.spWind.toFixed(1) + " s antes de pegar");
}
for (const tipo of conAlcance) {
  sano(); G.torchOn = true; G.noise = 1;
  const e = bicho(tipo, 1.0);
  updateSpecial(e, 1.0, DT);
  let d = 1.0, tocado = false;
  for (let i = 0; i < 200 && e.spWind > 0; i++) { d += 0.25; if (updateSpecial(e, d, DT)) tocado = true; }
  c.ok(!tocado && bodyAvg() === 100, tipo.padEnd(10) + "si te apartas, falla");
}
for (const tipo of conAlcance) {
  sano(); G.torchOn = true; G.noise = 1;
  const e = bicho(tipo, 1.0);
  let tocado = false;
  for (let i = 0; i < 400 && !tocado; i++) tocado = updateSpecial(e, 1.0, DT);
  c.ok(tocado && 100 - bodyAvg() > 5, tipo.padEnd(10) + "si te quedas, entra (-" + (100 - bodyAvg()).toFixed(0) + ")");
}

/* ── 5. el Smiler sólo salta con luz o ruido, como dice la wiki ── */
console.log("\n── EL SMILER SÓLO REACCIONA A LUZ O RUIDO ──");
function saltaSmiler(torch, ruido) {
  sano(); G.torchOn = torch; G.noise = ruido;
  const e = bicho("smiler", 1.0);
  for (let i = 0; i < 600; i++) if (updateSpecial(e, 1.0, DT)) return true;
  return false;
}
c.ok(!saltaSmiler(false, 0.02), "a oscuras y quieto no te ataca");
c.ok(saltaSmiler(true, 0.02), "con la linterna encendida sí");
c.ok(saltaSmiler(false, 1), "corriendo (ruido) también");

/* ── 6. el Duller atraviesa la pared ── */
console.log("\n── EL DULLER METE EL BRAZO POR LA PARED ──");
c.ok(ENT_DEF.duller.sp.wallHack === true, "lleva wallHack, como dice su ficha de la wiki");
sano();
const n = G.n;
let muro = null;
for (let y = 1; y < n - 1 && !muro; y++)
  for (let x = 1; x < n - 1; x++) if (G.grid[y * n + x] === 1) { muro = [x, y]; break; }
const dentroDelMuro = {
  def: ENT_DEF.duller, x: G.cell * muro[0], z: G.cell * muro[1],
  r: 0.3, stun: 0, grabbed: false, spCd: 0, spWind: 0
};
let alcanzo = false;
for (let i = 0; i < 400 && !alcanzo; i++) alcanzo = updateSpecial(dentroDelMuro, 1.2, DT);
c.ok(alcanzo && bodyAvg() < 100, "te alcanza desde dentro del muro (vida " + bodyAvg().toFixed(0) + ")");

/* ── 7. los demás no atacan solos ── */
console.log("\n── LOS DEMÁS SÓLO REMATAN SI PIERDES EL FORCEJEO ──");
for (const tipo of Object.keys(ENT_DEF)) {
  if (ENT_DEF[tipo].sp && ENT_DEF[tipo].sp.reach) continue;
  sano();
  const e = bicho(tipo, 0.5);
  let disparo = false;
  for (let i = 0; i < 600; i++) if (updateSpecial(e, 0.5, DT)) disparo = true;
  c.ok(!disparo && bodyAvg() === 100, tipo.padEnd(10) + "no ataca solo");
}

process.exit(c.resumen("el combate") ? 1 : 0);
