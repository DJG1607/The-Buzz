/* Cuarta tanda (1.6.0): casilleros que ya no se tragan el botín, ataques
   especiales para las diez entidades, fauna fiel a la wiki, brújula más
   floja, salidas que cuesta cruzar, el nivel que se reordena, las dos manos,
   el mapa del descenso, la música nueva y el refinado de sprites.
   ────────────────────────────────────────────────────────────────────────────
   Lo más delicado es el reordenamiento: cierra y abre muros con el jugador
   dentro, así que aquí se genera cada nivel con varias semillas, se reordena
   una y otra vez y se comprueba que nada queda incomunicado ni emparedado. */

const { cargar, crearContador } = require("./banco.js");
const j = cargar();
const {
  G, CAT, ITEMS, ENT_DEF, PARTS, buildLevel, player, bfs, w2c, c2w, bodyAvg,
  rollDice, openContainer, takeLeftovers, addItem, hasItem, weaponClick,
  updateSpecial, cancelSpecial, compassSignal, compassBand,
  startCrossing, updateCrossing, keys, CROSS_TIME,
  shiftMaze, SHIFT_SPARE, musicSource, melodyFor, updateMusic, MEL_SCALES,
  refineSprite, ICON_TEX, ICON_PX, REFINE, dmLayers, renderDescentMap, dmSelect,
  qualityRatio, bumpMul
} = j;
const c = crearContador();

function limpio(id, semilla) {
  buildLevel(id || "0", semilla || 1);
  G.running = true; G.paused = false; G.dead = false; G.grab = null;
  G.grace = 0; G.chasing = 0; G.sanity = 100; G.pulseExit = 0;
  PARTS.forEach(p => { G.body[p.id] = 100; G.bleeding[p.id] = 0; });
}

/* ── 1. casilleros ── */
console.log("── LOS CASILLEROS YA NO SE TRAGAN EL BOTÍN ──");
limpio();
for (const modo of [3, 4]) {
  G.opts = Object.assign({}, G.opts, { diff: modo });
  const charAntes = G.char; G.char = null;
  let unos = 0; const N = 60000;
  for (let i = 0; i < N; i++) if (rollDice(Math.random) === 1) unos++;
  G.char = charAntes;
  c.ok(unos / N > 0.14 && unos / N < 0.19,
    "modo " + modo + ": vacíos " + (unos * 100 / N).toFixed(1) + "% (sólo el 1 natural; antes 33-50%)");
}
G.opts = Object.assign({}, G.opts, { diff: 2 });

limpio();
// bolsillos llenos y todo el equipo ya puesto: así el botín son consumibles y
// armas (el equipo repetido se cambia por consumibles), que sí ocupan hueco
G.equip = { map: true, compass: true, flashlight: true, backpack: true };
G.weapons = { L: "pipe", R: "rebar" };
// desde 1.7.0 cada hueco es un objeto: para llenarlos hacen falta cuatro distintos, al máximo
G.cap = 4; G.inv = ["almond", "bandage", "battery", "flare"].map(id => ({ id, qty: j.stackMax(id) }));
const caja = { name: "Casillero", name_en: "Locker", opened: false, x: 0, z: 0, minRoll: 6 };
openContainer(caja);
c.ok(caja.opened && caja.left && caja.left.length > 0, "con los bolsillos llenos, lo que no cabe se queda dentro (" + (caja.left || []).length + ")");
const quedaban = caja.left.length;
G.inv = [];
takeLeftovers(caja);
c.ok(caja.left.length === 0 && G.inv.length > 0, "al volver con sitio se recoge (" + quedaban + " → 0 dentro)");

limpio();
G.weapons = { L: "pipe", R: "rebar" }; G.weaponCd = { L: 0, R: 0 }; G.inv = []; G.cap = 4;
c.ok(addItem("bat", 1) && G.inv.some(s => s.id === "bat"), "un arma con las manos llenas va a la mochila");
weaponClick("bat", null);
c.ok(G.weapons.L === "bat" && G.inv.some(s => s.id === "pipe"), "desde la mochila se cambia por la de la mano izquierda");
weaponClick("rebar", "R");
c.ok(G.weapons.R === null && G.inv.some(s => s.id === "rebar"), "y desde una mano vuelve a la mochila");

/* ── 2. ataques especiales ── */
console.log("\n── LAS DIEZ ENTIDADES TIENEN ATAQUE ESPECIAL ──");
const tipos = Object.keys(ENT_DEF);
c.ok(tipos.every(t => ENT_DEF[t].sp && ENT_DEF[t].sp.reach > 0 && ENT_DEF[t].sp.windup > 0),
  "las " + tipos.length + " tienen alcance y carga (antes 6 sólo remataban al perder el forcejeo)");
limpio();
player.pos.set(G.cell * 4, 0, G.cell * 4);
G.torchOn = true; G.noise = 1;
for (const t of ["faceling", "hound", "wretch", "partygoer"]) {
  PARTS.forEach(p => { G.body[p.id] = 100; G.bleeding[p.id] = 0; });
  G.spGate = 0; G.spWarn = null;                        // una entidad cada vez
  const e = { def: ENT_DEF[t], x: player.pos.x + 1, z: player.pos.z, r: 0.3, stun: 0, grabbed: false, spCd: 0, spWind: 0 };
  updateSpecial(e, 1.0, 1 / 60);
  const avisa = e.spWind > 0 && G.spWarn && G.spWarn.e === e;
  let dio = false;
  for (let i = 0; i < 300 && !dio; i++) dio = updateSpecial(e, 1.0, 1 / 60);
  c.ok(avisa && dio && bodyAvg() < 100, t.padEnd(10) + " avisa con el cartel grande y, si te quedas, entra");
}
const coachAntes = G.char;
G.char = j.CHARACTERS.find(x => x.id === "coach");
G.spGate = 0; G.spWarn = null;
const fac = { def: ENT_DEF.faceling, x: player.pos.x + 1, z: player.pos.z, r: 0.3, stun: 0, grabbed: false, spCd: 0, spWind: 0 };
let alCoach = false;
for (let i = 0; i < 400; i++) if (updateSpecial(fac, 1.0, 1 / 60)) alCoach = true;
c.ok(!alCoach && fac.spWind === 0, "a los Facelings no les sale el especial contra el Entrenador");
G.char = coachAntes;
const e2 = { def: ENT_DEF.hound, x: 0, z: 0, r: 0.3, stun: 0, grabbed: false, spCd: 0, spWind: 1 };
G.spWarn = { e: e2 };
cancelSpecial(e2);
c.ok(e2.spWind === 0 && G.spWarn === null, "aturdir a una entidad cancela su carga y quita el aviso");

/* ── 3. fauna según la wiki ── */
console.log("\n── LA FAUNA DE CADA NIVEL, SEGÚN LA WIKI ──");
const byId = {}; CAT.forEach(l => byId[l.id] = l);
const sinFauna = ["0", "6", "7", "10", "37", "19", "41", "64", "99", "32", "65", "72"];
c.ok(sinFauna.every(id => !Object.keys(byId[id].ents || {}).some(k => byId[id].ents[k] > 0)),
  "sin entidades del catálogo donde la wiki no documenta ninguna (" + sinFauna.join(", ") + ")");
const deberia = { "11": ["faceling", "hound"], "5": ["deathmoth", "hound", "stealer"], "Fun": ["partygoer", "faceling"], "56": ["deathmoth"] };
for (const id in deberia) {
  const hay = Object.keys(byId[id].ents).filter(k => byId[id].ents[k] > 0).sort();
  c.ok(JSON.stringify(hay) === JSON.stringify(deberia[id].slice().sort()), "Level " + id + ": " + hay.join(", "));
}

/* ── 4. brújula ── */
console.log("\n── LA BRÚJULA YA NO ES UN GPS ──");
limpio("1", 3);
G.nearestExit = G.exits[0];
const sig = d => { G.nearestDist = d; return compassSignal(); };
c.ok(sig(8) > sig(40) && sig(40) > sig(70), "la señal cae con la distancia (" + sig(8).toFixed(2) + " → " + sig(40).toFixed(2) + " → " + sig(70).toFixed(2) + ")");
c.ok(sig(120) === 0, "muy lejos, sin señal");
G.nearestDist = 20; const quieto = compassSignal(); G.chasing = 1; const perseguido = compassSignal(); G.chasing = 0;
c.ok(perseguido < quieto * 0.5, "con algo persiguiéndote casi no sirve");
G.nearestDist = 23.4;
c.ok(!/\d/.test(compassBand()), "no da metros exactos: «" + compassBand() + "»");
G.pulseExit = 5;
c.ok(/\d+ m/.test(compassBand()), "el Ojo de topógrafo sí los da: «" + compassBand() + "»");
G.pulseExit = 0;

/* ── 5. salidas ── */
console.log("\n── LAS SALIDAS CUESTAN MÁS ──");
let pocas = true, lejos = true, niveles = 0;
for (const l of CAT) {
  if (l.settlement) continue;
  for (let sem = 1; sem <= 6; sem++) {
    limpio(l.id, sem);
    niveles++;
    const maxEsperado = Math.min(l.exitsTo.length, 3);
    if (G.exits.length > maxEsperado || G.exits.length < Math.min(1, l.exitsTo.length)) pocas = false;
    const sp = [w2c(player.pos.x), w2c(player.pos.z)];
    const { dist } = bfs(G.grid, G.n, sp[0], sp[1]);
    let far = 0; for (const d of dist) if (d > far) far = d;
    for (const e of G.exits) if (dist[e.cell[1] * G.n + e.cell[0]] < far * 0.28) lejos = false;
  }
}
c.ok(pocas, "entre 1 y 3 salidas por partida en los " + niveles + " niveles generados (antes hasta 4)");
c.ok(lejos, "ninguna salida en el primer cuarto del recorrido");
c.ok(Object.values(CROSS_TIME).every(t => t >= 1.5), "cruzar cualquier salida lleva 1,5 s o más");

/* ── 6. el nivel se reordena ── */
console.log("\n── EL NIVEL SE REORDENA SIN ROMPER NADA ──");
let cambios = 0, rotos = 0, emparedados = 0, instanciasMal = 0, probados = 0, salidasMovidas = 0;
for (const l of CAT) {
  if (l.settlement) continue;
  for (let sem = 1; sem <= 3; sem++) {
    limpio(l.id, sem * 7);
    const pc = [w2c(player.pos.x), w2c(player.pos.z)];
    for (let vuelta = 0; vuelta < 4; vuelta++) {
      const antes = bfs(G.grid, G.n, pc[0], pc[1]).dist.filter(d => d >= 0).length;
      let abiertosAntes = 0; for (let i = 0; i < G.grid.length; i++) if (G.grid[i] === 0) abiertosAntes++;
      const r = shiftMaze(Math.random);
      probados++;
      if (r.changed) cambios++;
      salidasMovidas += r.exits || 0;
      const { dist } = bfs(G.grid, G.n, pc[0], pc[1]);
      const ahora = dist.filter(d => d >= 0).length;
      // todo lo abierto sigue alcanzable: lo alcanzable cambia sólo por muros abiertos (+) y cerrados (-)
      let abiertos = 0; for (let i = 0; i < G.grid.length; i++) if (G.grid[i] === 0) abiertos++;
      // si antes estaba todo conectado, después también (hay niveles con bolsas sueltas de fábrica)
      if (antes === abiertosAntes && ahora !== abiertos) rotos++;
      for (const e of G.exits) if (dist[e.cell[1] * G.n + e.cell[0]] < 0) rotos++;
      for (const k of G.containers) if (G.grid[w2c(k.z) * G.n + w2c(k.x)] === 1) emparedados++;
      let muros = 0; for (let i = 0; i < G.grid.length; i++) if (G.grid[i] === 1) muros++;
      let usadas = 0; for (let i = 0; i < G.wallInst.length; i++) if (G.wallInst[i] >= 0) usadas++;
      if (usadas !== muros) instanciasMal++;
    }
  }
}
c.ok(cambios > probados * 0.6, "cambia algo en " + cambios + " de " + probados + " reordenamientos");
c.ok(salidasMovidas > 0, "alguna salida se va a otro sitio (" + salidasMovidas + " veces)");
c.ok(rotos === 0, "nunca queda una zona ni una salida incomunicada");
c.ok(emparedados === 0, "nunca empareda un casillero");
c.ok(instanciasMal === 0, "cada muro del mapa tiene su bloque en 3D, ni uno más ni uno menos");

/* ── 7. música ── */
console.log("\n── MÚSICA ──");
G.opts = Object.assign({}, G.opts, { musicSrc: 1 });
c.ok(musicSource() === 0, "«Tu música» sin canciones subidas cae a la del juego");
G.opts = Object.assign({}, G.opts, { musicSrc: 2 });
c.ok(musicSource() === 2, "«Sin música» es sin música");
G.opts = Object.assign({}, G.opts, { musicSrc: 0 });
c.ok(MEL_SCALES.length === 4 && [0, 1, 2, 3].every(r => melodyFor({ risk: r }).scale === MEL_SCALES[r]), "una escala de melodía por riesgo");
let peta = null;
try { limpio("2", 1); for (let i = 0; i < 2000; i++) updateMusic(0.05); } catch (e) { peta = e; }
c.ok(!peta, "100 s de melodía sin excepciones" + (peta ? ": " + peta.message : ""));

/* ── 8. sprites y mapa ── */
console.log("\n── SPRITES, MAPA Y OPCIONES ──");
c.ok(REFINE === 2 && Object.keys(ICON_TEX).every(k => ICON_TEX[k].width === ICON_PX), "los iconos salen refinados a " + ICON_PX + " px");
const lienzo = { width: 24 * 4, height: 36 * 2, getContext: () => ({ getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) }) };
const fino = refineSprite(lienzo, 24, 36, 4, 2);
c.ok(fino.width === 24 * 4 * 2 && fino.height === 36 * 2 * 2, "un atlas de 4×2 fotogramas sale al doble (" + fino.width + "×" + fino.height + ")");
const capas = dmLayers();
c.ok(CAT.every(l => capas[l.id] !== undefined), "desde el Level 0 se llega a los " + CAT.length + " niveles del mapa");
let mapaPeta = null;
try { renderDescentMap("titleScreen"); dmSelect("1"); dmSelect(null); } catch (e) { mapaPeta = e; }
c.ok(!mapaPeta, "el mapa del descenso se pinta y se selecciona sin excepciones" + (mapaPeta ? ": " + mapaPeta.message : ""));
const ratios = [1, 2, 3, 4].map(q => { G.opts.quality = q; return qualityRatio(); });
c.ok(ratios[0] < ratios[1] && ratios[1] <= ratios[2] && ratios[2] <= ratios[3], "la calidad sube la resolución interna (" + ratios.join(" · ") + ")");
G.opts.quality = 1; const sinRelieve = bumpMul(); G.opts.quality = 3;
c.ok(sinRelieve === 0 && bumpMul() === 1, "calidad baja quita el relieve de las texturas");

/* ── 9. modo aleatorio ── */
console.log("\n── MODO ALEATORIO ──");
const { instantiate, levelTitle } = j;
const catAntes = JSON.stringify(CAT.map(l => l.ents));
G.randomMode = true;
const destinos = new Set(); let fueraDelGrafo = 0, nombresBien = true, faunas = new Set(), salidasTotal = 0;
for (const l of CAT.slice(0, 20)) {
  for (let sem = 1; sem <= 4; sem++) {
    buildLevel(l.id, sem * 13);
    const oficiales = new Set(l.exitsTo.map(r => r.to));
    for (const e of G.exits) {
      salidasTotal++;
      destinos.add(e.destId);
      if (!oficiales.has(e.destId)) fueraDelGrafo++;
      if (e.destName !== levelTitle(instantiate(e.destId, e.destSeed))) nombresBien = false;
    }
    faunas.add(JSON.stringify(G.cfg.ents));
  }
}
c.ok(destinos.size > 25, "las salidas llevan a " + destinos.size + " niveles distintos, no sólo a los del grafo");
c.ok(fueraDelGrafo > salidasTotal * 0.6, fueraDelGrafo + " de " + salidasTotal + " salidas van a un sitio al que el grafo normal no lleva");
c.ok(nombresBien, "el destino que anuncia cada salida es el nivel que te encuentras al cruzarla");
c.ok(faunas.size > 40, "la fauna se baraja: " + faunas.size + " combinaciones distintas en 80 niveles");
const a1 = JSON.stringify(instantiate("5", 99).ents), a2 = JSON.stringify(instantiate("5", 99).ents);
c.ok(a1 === a2, "la misma semilla da siempre el mismo nivel barajado");
G.randomMode = false;
c.ok(JSON.stringify(CAT.map(l => l.ents)) === catAntes && instantiate("5", 99) === CAT.find(l => l.id === "5"),
  "el catálogo normal queda intacto al salir del modo aleatorio");

/* ── 10. nada se queda en español con el juego en inglés ──
   El bug: «Borrar progreso» volvía siempre en español porque el código le
   ponía el texto a mano. Buscando el mismo patrón salieron más: frases de
   muerte de las diez entidades, pistas de la mano, controles de la pausa… */
console.log("\n── NADA SE QUEDA EN UN SOLO IDIOMA ──");
const fuente = require("fs").readFileSync(require("path").join(__dirname, "..", "el-zumbido.html"), "utf8");
const script = fuente.slice(fuente.indexOf("<script>\n"));
const literalES = /(textContent|innerHTML)\s*=\s*"[^"]*[a-záéíóúñ]{4,}[^"]*"\s*;/g;
const sueltos = (script.match(literalES) || []).filter(x => !/tx\(|×|·/.test(x));
c.ok(sueltos.length === 0, "ningún texto puesto a mano sin tx()" + (sueltos.length ? ": " + sueltos.join(" | ") : ""));
const dieSueltos = script.match(/\bdie\(\s*"/g) || [];
c.ok(dieSueltos.length === 0, "ninguna muerte con la frase sólo en español");
c.ok(Object.keys(ENT_DEF).every(k => ENT_DEF[k].death_en && ENT_DEF[k].sp.death_en), "las diez entidades tienen su frase de muerte en inglés");
c.ok(!/hurtPlayer\([^)]*def\.death\)/.test(script), "el daño pasa la frase de muerte por txf(), no en crudo");
const pausa = fuente.slice(fuente.indexOf('id="pauseScreen"'), fuente.indexOf("</div>\n</div>", fuente.indexOf('id="pauseScreen"')));
const teclasSinIngles = (pausa.match(/<div><kbd>[^\n]*<\/div>/g) || []).filter(l => !/data-en/.test(l));
c.ok(teclasSinIngles.length === 0, "los controles de la pausa están en los dos idiomas");

/* ── 11. cruzar una salida (al final: deja el juego en transición) ── */
console.log("\n── CRUZAR UNA SALIDA LLEVA SU TIEMPO ──");
limpio("1", 5);
const sal = G.exits[0];
player.pos.set(sal.mx, 0, sal.mz);
keys["e"] = true;
startCrossing(sal);
updateCrossing(0.3);
c.ok(G.crossing && G.crossing.t > 0, "con [E] pulsada se va llenando (" + Math.round(G.crossing.t / G.crossing.need * 100) + "%)");
keys["e"] = false;
updateCrossing(0.1);
c.ok(G.crossing === null, "si sueltas [E], se corta");
keys["e"] = true;
startCrossing(sal);
player.pos.set(sal.mx + 6, 0, sal.mz);
updateCrossing(0.1);
c.ok(G.crossing === null, "si te alejas, se corta");
player.pos.set(sal.mx, 0, sal.mz);
startCrossing(sal);
G.grab = { ent: {} };
updateCrossing(0.1);
c.ok(G.crossing === null, "si algo te agarra, se corta");
G.grab = null;
startCrossing(sal);
const need = G.crossing.need;
let t = 0;
while (G.crossing && t < 20) { updateCrossing(0.1); t += 0.1; }
startCrossing(sal);
c.ok(G.crossing === null && t >= need - 0.11, "aguantando " + need.toFixed(1) + " s se cruza (y ya no se puede volver a empezar: está en transición)");
keys["e"] = false;

process.exit(c.resumen("la cuarta tanda") ? 1 : 0);
