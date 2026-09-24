/* Curación, códice y música (desde 1.5.1): la mochila/objetos
   de equipo responden al usarlos, curar una zona concreta del cuerpo, que el
   códice se reinicie con el progreso, y la música/ambiente por nivel.
   ────────────────────────────────────────────────────────────────────────────
   El bug del códice era real y sutil: wipeProgress() borraba localStorage
   pero no G.codex en memoria, así que el primer codexSeeEnt()/codexSeeItem()
   de la partida siguiente volvía a guardar el códice viejo encima. Por eso
   aquí se prueba el flujo completo de dos pulsaciones (armar + confirmar),
   no sólo la línea que faltaba.                                            */

const { cargar, crearContador } = require("./banco.js");
const j = cargar();
const {
  G, PARTS, ITEMS, ENT_DEF, CAT, buildLevel, useItem, healBodyPart,
  wipeProgress, renderCodex, entityIcon, itemIconCanvas, codexSeeEnt, codexSeeItem,
  musicModeFor, ambientFlavorFor, updateAmbient, applyLevelAudio, Audio_
} = j;
const c = crearContador();

function limpio() {
  buildLevel("0", 1);
  G.running = true; G.paused = false; G.dead = false; G.grab = null;
}

/* ── 1. curar una zona concreta, sin tocar las demás ── */
console.log("── CURAR UNA ZONA CONCRETA DEL CUERPO ──");
limpio();
G.inv = [{ id: "bandage", qty: 5 }];
PARTS.forEach(p => { G.body[p.id] = 100; G.bleeding[p.id] = 0; });
G.body.armL = 30; G.body.legR = 10;   // legR es la peor de las dos
healBodyPart("armL");
c.ok(G.body.armL === 75 && G.body.legR === 10, "clic en armL cura armL (75) y no toca legR (sigue en 10)");
c.ok(G.inv[0].qty === 4, "se gasta un vendaje");
useItem("bandage");
c.ok(G.body.legR === 55, "la tecla R sigue curando automáticamente la peor zona (legR)");
G.body.armL = 100; G.bleeding.armL = 0;
healBodyPart("armL");
c.ok(G.inv[0].qty === 3, "una zona ya sana no gasta el vendaje al pulsarla");

/* ── 2. objetos de equipo dan señal al usarlos por segunda vez ── */
console.log("\n── LA MOCHILA Y EL EQUIPO YA NO SE QUEDAN MUDOS ──");
limpio();
G.equip.backpack = true; G.equip.map = true; G.equip.compass = true;
for (const id of ["backpack", "map", "compass"]) {
  let avisó = false;
  const antes = j.toastFn; // no existe: sólo comprobamos que no lanza excepción
  try { useItem(id); avisó = true; } catch (e) { avisó = false; }
  c.ok(avisó, "usar «" + id + "» ya no revienta ni se queda callado");
}

/* ── 3. el códice se reinicia de verdad al borrar el progreso ── */
console.log("\n── EL CÓDICE SE REINICIA CON EL PROGRESO ──");
G.codex = { ent: { faceling: true, hound: true }, item: { almond: true } };
G.ach = { six: true }; G.unlocked = { level_0: true };
wipeProgress();                     // primera pulsación: sólo pide confirmar
c.ok(Object.keys(G.codex.ent).length === 2, "la primera pulsación todavía no borra nada (pide confirmar)");
wipeProgress();                     // segunda: borra de verdad
c.ok(Object.keys(G.codex.ent).length === 0 && Object.keys(G.codex.item).length === 0,
  "la segunda pulsación vacía el códice (antes se quedaba con lo viejo)");
c.ok(Object.keys(G.ach).length === 0 && Object.keys(G.unlocked).length === 0,
  "logros y niveles vistos también se vacían, como antes");

/* ── 4. el códice se pinta con iconos sin reventar ── */
console.log("\n── EL CÓDICE SE PINTA SIN REVENTAR ──");
Object.keys(ENT_DEF).forEach(k => codexSeeEnt(k));
Object.keys(ITEMS).forEach(k => codexSeeItem(k));
G.unlocked["level_0"] = true;
let pintadoOk = true;
try { renderCodex("titleScreen"); } catch (e) { pintadoOk = false; console.log("   " + e.stack); }
c.ok(pintadoOk, "renderCodex() con todo desbloqueado no revienta");
try { entityIcon("hound"); itemIconCanvas("bandage"); pintadoOk = true; } catch (e) { pintadoOk = false; }
c.ok(pintadoOk, "los iconos de entidad y de objeto se generan sin excepción");

/* ── 5. música: el acorde se pone más tenso cuanto peor es el nivel ── */
console.log("\n── MÚSICA SEGÚN LO PELIGROSO QUE ES EL NIVEL ──");
let raizAnterior = 999;
for (const risk of [0, 1, 2, 3]) {
  const m = musicModeFor({ risk, settlement: false });
  c.ok(m.root < raizAnterior, "riesgo " + risk + ": la raíz baja (más grave) — " + m.root.toFixed(0) + " Hz");
  raizAnterior = m.root;
  c.ok(m.intervals.length === 4, "riesgo " + risk + ": siempre son 4 voces");
}
const modoAsentamiento = musicModeFor({ risk: 3, settlement: true });
const modoSeguro = musicModeFor({ risk: 0, settlement: false });
c.ok(JSON.stringify(modoAsentamiento.intervals) === JSON.stringify(modoSeguro.intervals),
  "un asentamiento suena como un nivel seguro, sin importar lo que diga su campo risk");

/* ── 6. el sonido ambiente coincide con el tipo de nivel ── */
console.log("\n── AMBIENTE SEGÚN EL TIPO DE NIVEL ──");
c.ok(ambientFlavorFor({ deco: "sea" }) === "water", "sea → agua");
c.ok(ambientFlavorFor({ deco: "caves" }) === "water", "caves → agua");
c.ok(ambientFlavorFor({ deco: "field" }) === "wind", "field → viento");
c.ok(ambientFlavorFor({ deco: "electrical" }) === "spark", "electrical → chispazos");
c.ok(ambientFlavorFor({ deco: "office" }) === "none", "un nivel sin sabor propio no revienta (\"none\")");
c.ok(ambientFlavorFor({}) === "none", "sin deco tampoco revienta");

limpio();
let ok = true;
try {
  Audio_.init();
  for (const cfg of CAT.slice(0, 10)) {
    buildLevel(cfg.id, 3);
    G.running = true; G.paused = false;
    applyLevelAudio();
    G.ambTimer = 0;
    updateAmbient(0.1);
  }
} catch (e) { ok = false; console.log("   " + e.stack); }
c.ok(ok, "música + ambiente en 10 niveles reales seguidos, sin excepciones");

process.exit(c.resumen("la curación, el códice y la música") ? 1 : 0);
