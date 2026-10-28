/* El mundo (desde 1.6.0): casilleros que ya no se tragan el botín, ataques
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
const RAPIDO = !!process.env.ZUMBIDO_RAPIDO;          // node pruebas/todo.js rapido
if (RAPIDO) console.log("  (versión rápida: menos semillas y menos vueltas de reordenamiento)");

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
  for (let sem = 1; sem <= (RAPIDO ? 1 : 6); sem++) {
    limpio(l.id, sem);
    niveles++;
    const maxEsperado = Math.min(l.exitsTo.length, G.n >= 45 ? 4 : 3);     // (5.0) en los niveles grandes, una más
    if (G.exits.length > maxEsperado || G.exits.length < Math.min(1, l.exitsTo.length)) pocas = false;
    const sp = [w2c(player.pos.x), w2c(player.pos.z)];
    const { dist } = bfs(G.grid, G.n, sp[0], sp[1]);
    let far = 0; for (const d of dist) if (d > far) far = d;
    for (const e of G.exits) if (dist[e.cell[1] * G.n + e.cell[0]] < far * 0.28) lejos = false;
  }
}
c.ok(pocas, "entre 1 y 3 salidas por partida en los " + niveles + " niveles generados (4 en los niveles grandes de la 5.0)");
c.ok(lejos, "ninguna salida en el primer cuarto del recorrido");
c.ok(Object.values(CROSS_TIME).every(t => t >= 1.5), "cruzar cualquier salida lleva 1,5 s o más");

/* ── 6. el nivel se reordena ── */
console.log("\n── EL NIVEL SE REORDENA SIN ROMPER NADA ──");
let cambios = 0, rotos = 0, emparedados = 0, instanciasMal = 0, probados = 0, salidasMovidas = 0;
for (const l of CAT) {
  if (l.settlement) continue;
  for (let sem = 1; sem <= (RAPIDO ? 1 : 3); sem++) {
    limpio(l.id, sem * 7);
    const pc = [w2c(player.pos.x), w2c(player.pos.z)];
    for (let vuelta = 0; vuelta < (RAPIDO ? 2 : 4); vuelta++) {
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

/* ── calidad gráfica (3.0.5) ──
   Medido en una gráfica integrada a 1080p, «Baja» y «Ultra» iban casi igual de
   justos porque sólo cambiaba la resolución. Ahora cada nivel decide también las
   luces, la distancia de dibujado, el polvo, el grano y el tipo de material. */
console.log("\n── CALIDAD GRÁFICA ──");
const { CALIDAD, calidad, distanciaDibujo, paramsLambert, gobernar, GOB, granoActivo, LIGHT_POOL } = j;
const P = CALIDAD.slice(1);
const sube = k => P.every((p, i) => i === 0 || p[k] >= P[i - 1][k]);
c.ok(P.length === 4 && sube("lamps") && sube("dust") && sube("fog") && sube("bump") && [0.6, 1, 1, 1].every((r, i) => Math.abs(P[i].ratio() - r) < 1e-9),
  "cada nivel de calidad pide más que el anterior: luces " + P.map(p => p.lamps).join("/") + ", polvo " + P.map(p => p.dust).join("/"));
c.ok(P[0].simple && P[1].simple && !P[2].simple && !P[3].simple && !P[0].grain && P[1].grain, "Baja y Media usan materiales sencillos; Baja además quita el grano");
c.ok(P.every(p => p.lamps <= LIGHT_POOL.length), "ninguna calidad pide más luces de las que hay (" + LIGHT_POOL.length + ")");
// el recorte de distancia no puede notarse: lo que queda fuera tiene que estar ya tapado por la niebla
const tope = [0.03, 0.005, 0.0005, 0.00005];        // lo que puede verse del fondo, por calidad
let fueraDeRango = 0, sePasa = 0, sePasaDe = "", masLejosEnBaja = 0;
for (const l of CAT) {
  const dens = j.instantiate(l.id, 3).fog;
  for (let q = 1; q <= 4; q++) {
    const far = distanciaDibujo(dens, q);
    if (far < 40 || far > 240) fueraDeRango++;
    if (far < 240 && far > 40 && Math.exp(-Math.pow(far * dens, 2)) > tope[q - 1]) { sePasa++; sePasaDe = l.id + " q" + q; }
    if (q > 1 && distanciaDibujo(dens, q - 1) > far + 1e-9) masLejosEnBaja++;
  }
}
c.ok(fueraDeRango === 0 && masLejosEnBaja === 0, "la distancia de dibujado va de 40 a 240 m y nunca es mayor en una calidad más baja (" + CAT.length + " niveles)");
c.ok(sePasa === 0, "en los " + CAT.length + " niveles, lo que se deja de dibujar ya lo tapa la niebla (≤ 3 % en Baja, ≤ 0,005 % en Ultra)" + (sePasa ? ": falla " + sePasaDe : ""));
const pl = paramsLambert({ color: 1, map: {}, roughness: 0.5, metalness: 0.3, bumpMap: {}, bumpScale: 1, opacity: 0.5, transparent: true, side: 2 });
c.ok(Object.keys(pl).sort().join() === "color,map,opacity,side,transparent", "el material sencillo se queda con el color, la textura y la transparencia, y suelta lo del PBR (" + Object.keys(pl).join(", ") + ")");
G.opts.fx = 1; G.opts.quality = 3;
const grano = [[0, 3], [1, 1], [1, 3], [2, 2], [2, 1]].map(([fx, q]) => { G.opts.fx = fx; G.opts.quality = q; return granoActivo(); });
G.opts.fx = 1; G.opts.quality = 3;
c.ok(grano.join() === "false,false,true,true,false", "el grano sólo se pinta si se ve: no con «Limpio», ni con calidad Baja");
// resolución dinámica
G.opts.auto = 1; GOB.mul = 1; GOB.ok = 0;
c.ok(gobernar(30) === true && GOB.mul === 0.88, "a 30 fps baja la resolución un paso (×0,88)");
for (let i = 0; i < 6; i++) gobernar(25);
c.ok(GOB.mul === 0.6 && gobernar(20) === false, "sigue bajando pero nunca por debajo de ×0,6");
const antes60 = GOB.mul;
c.ok(gobernar(48) === false && gobernar(60) === false && gobernar(60) === false && gobernar(60) === false && GOB.mul === antes60, "con 48 fps se queda como está, y a 60 espera cuatro tandas antes de subir");
c.ok(gobernar(60) === true && GOB.mul === 0.68, "…y a la cuarta sube un paso (×0,68)");
G.opts.auto = 0; GOB.mul = 1;
c.ok(gobernar(10) === false && GOB.mul === 1, "con el ajuste automático apagado no toca nada");
G.opts.auto = 1; GOB.mul = 1; GOB.ok = 0;
const fuenteM = require("fs").readFileSync(require("path").join(__dirname, "..", "el-zumbido.html"), "utf8");
c.ok(!/#vignette\{[^}]*mix-blend-mode/.test(fuenteM) && !/#scan\{[^}]*mix-blend-mode/.test(fuenteM) && /body\[data-q="1"\] #grain/.test(fuenteM),
  "la viñeta y las líneas de barrido ya no usan «multiplicar» (negro con transparencia es lo mismo y cuesta menos) y el grano se oculta en Baja");
c.ok((fuenteM.match(/new THREE\.MeshStandardMaterial\(/g) || []).length === 1 && (fuenteM.match(/\bstdMat\(/g) || []).length >= 25, "todos los materiales de superficie pasan por stdMat(), que elige el tipo según la calidad");
c.ok(/applyBrightness\(\);\s*applyQuality\(\);/.test(fuenteM), "la calidad elegida se aplica ya al arrancar (antes sólo al tocar el ajuste)");
c.ok(/if\(!granoActivo\(\)\) return;/.test(fuenteM) && !/createImageData\(w,h\)/.test(fuenteM), "el grano no se pinta píxel a píxel en JavaScript ni cuando no se ve");
c.ok(j.OPT_ROWS.some(r => r.id === "auto") && j.OPT_TAB_OF.auto === "gfx", "el ajuste automático está en la pestaña de Gráficos");

/* ── 9. modo aleatorio ── */
console.log("\n── MODO ALEATORIO ──");
const { instantiate, levelTitle } = j;
const catAntes = JSON.stringify(CAT.map(l => l.ents));
G.randomMode = true;
const destinos = new Set(); let fueraDelGrafo = 0, nombresBien = true, faunas = new Set(), salidasTotal = 0;
for (const l of CAT.slice(0, 20)) {
  for (let sem = 1; sem <= (RAPIDO ? 1 : 4); sem++) {
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
c.ok(destinos.size > (RAPIDO ? 12 : 25), "las salidas llevan a " + destinos.size + " niveles distintos, no sólo a los del grafo");
c.ok(fueraDelGrafo > salidasTotal * 0.6, fueraDelGrafo + " de " + salidasTotal + " salidas van a un sitio al que el grafo normal no lleva");
c.ok(nombresBien, "el destino que anuncia cada salida es el nivel que te encuentras al cruzarla");
c.ok(faunas.size > (RAPIDO ? 10 : 40), "la fauna se baraja: " + faunas.size + " combinaciones distintas en " + (RAPIDO ? 20 : 80) + " niveles");
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

console.log("\n── NIVELES GRANDES Y SIN BORDES (5.0, Halloween y otoño) ──");
{
  // más grandes: 1,7 veces de lado (los asentamientos, 1,3)
  const crecen = CAT.filter(l => !l.settlement).every(l => l.gridBase && l.grid >= Math.round(l.gridBase*1.6) && l.grid % 2 === 1);
  const bases = CAT.filter(l => l.settlement).every(l => l.grid > l.gridBase && l.grid % 2 === 1);
  c.ok(crecen && bases, "todos los niveles crecen 1,7 veces de lado (casi el triple de superficie) y los asentamientos 1,3; siempre con un número impar de celdas");
  // sin bordes: la fila y la columna de la costura son la misma, y lo de más allá es lo de enfrente
  let cosidos = true, sinBorde = true, conectados = true;
  for (const l of CAT.slice(0, RAPIDO ? 12 : CAT.length)) {
    limpio(l.id, 7);
    const n = G.n, S = G.toroS;
    if (!S || Math.abs(S - (n - 1)*G.cell) > 1e-6) sinBorde = false;
    for (let i = 0; i < n; i++) if (G.grid[i*n] !== G.grid[i*n + n - 1] || G.grid[i] !== G.grid[(n - 1)*n + i]) cosidos = false;
    for (const [x, z] of [[c2w(3), c2w(5)], [c2w(n - 4), c2w(2)], [c2w(9), c2w(n - 6)]]) if (j.solidAt(x, z) !== j.solidAt(x + S, z) || j.solidAt(x, z) !== j.solidAt(x - S, z - S)) sinBorde = false;
    // todo lo abierto se alcanza (pasando por la costura si hace falta)
    const d = j.bfsToro(G.grid, n, w2c(player.pos.x), w2c(player.pos.z));
    for (let k = 0; k < d.length; k++) if (G.grid[k] === 0 && d[k] < 0) { conectados = false; break; }
  }
  c.ok(sinBorde, "en todos los niveles se sigue andando más allá del borde: el laberinto se repite al otro lado (sin pared exterior)");
  c.ok(cosidos, "la costura está cosida: la última fila y la última columna son la primera");
  c.ok(conectados, "y no queda nada incomunicado, contando los pasos que cruzan la costura");
  // el jugador cruza la costura: pasa a la otra copia; lo que se mueve se coloca en la copia más cercana a él
  limpio("1", 11);
  const S = G.toroS;
  player.pos.set(S/2 + 0.4, 0, 0);
  const e = G.entities[0];
  if (e) { e.x = -S/2 + 1; e.z = 0; }
  const antes = G.toroCruces || 0;
  j.toroPaso();
  c.ok(Math.abs(player.pos.x - (-S/2 + 0.4)) < 1e-6 && G.toroCruces === antes + 1, "al pasar la costura el jugador sigue en el mismo sitio del laberinto, en la otra copia");
  c.ok(!e || Math.abs(j.toroD(e.x - player.pos.x)) <= S/2 && Math.abs(e.x - player.pos.x) < S/2 + 0.01, "la fauna que está al otro lado de la costura se ve y persigue desde la copia más cercana (no a " + Math.round(S) + " m)");
  // al cruzar, lo lejano se reordena sin dejar nada incomunicado
  limpio("0", 21);
  const r = j.toroRenovar(() => 0.37);
  const d = j.bfsToro(G.grid, G.n, w2c(player.pos.x), w2c(player.pos.z));
  let todo = true; for (let k = 0; k < d.length; k++) if (G.grid[k] === 0 && d[k] < 0) { todo = false; break; }
  c.ok(r.abiertos > 0 && r.cerrados > 0 && todo, "lo que queda lejos y no se ve se reordena (" + r.abiertos + " muros abiertos, " + r.cerrados + " pasillos cerrados) y todo sigue conectado: nunca vuelves exactamente al mismo sitio");
  c.ok(/renderMundo/.test(j.frame.toString()) && /intersectsBox/.test(j.renderMundo.toString()), "lo de más allá de la costura se pinta (sólo las copias que caen delante de la cámara)");
  // más y más grandes zonas especiales
  let esp = 0, gr = 0;
  for (let s2 = 1; s2 <= 6; s2++) { limpio("0", s2); esp += G.specials.length; gr += G.specials.filter(sp => sp.r > sp.def.radius).length; }
  c.ok(esp >= 12 && gr > 0, "zonas especiales: más (" + (esp/6).toFixed(1) + " por nivel en el Level 0) y más grandes");
  // empieza cerca del centro, no en una esquina pegada a la costura
  limpio("0", 3);
  const n = G.n, cx = w2c(player.pos.x), cy = w2c(player.pos.z);
  c.ok(Math.abs(cx - n/2) < n*0.2 && Math.abs(cy - n/2) < n*0.2, "se aparece cerca del centro del nivel");
}

console.log("\n── HALLOWEEN Y OTOÑO (5.0) ──");
{
  G.opts.temporada = 1;
  limpio("0", 5);
  const T = G.temporada;
  c.ok(T && T.calabazas.length >= 6, "en temporada hay calabazas talladas por los niveles (" + (T ? T.calabazas.length : 0) + " en el Level 0)");
  c.ok(T && T.calabazas.every(k => !j.solidAt(k.x, k.z)), "ninguna calabaza dentro de un muro");
  const conCaramelos = G.drops.filter(o => o.id === "caramelo").length;
  c.ok(conCaramelos > 0, "y a veces caramelos al lado (" + conCaramelos + ")");
  limpio("9", 5);
  c.ok(G.temporada && G.temporada.hojas && G.temporada.alfombra, "al aire libre, en las calles y los campos, hojas secas en el suelo y cayendo");
  limpio("41", 5);
  c.ok(G.temporada && !G.temporada.hojas, "en la playa y el agua, no");
  // el caramelo
  G.prog = G.prog || {}; G.prog.caramelos = 12; G.ach.truco = false; G.sanity = 50;
  addItem("caramelo", 1);
  j.useItem("caramelo");
  c.ok(G.sanity === 58 && G.prog.caramelos === 13 && G.ach.truco, "un caramelo da +8 de cordura; el decimotercero da el logro «Truco o trato»");
  c.ok(j.skinUnlocked(j.SKIN_BY.calabaza) && /Truco o trato/.test(j.skinNeedText(j.SKIN_BY.calabaza)), "y con él, el disfraz de calabaza");
  let caramelosEnBotin = 0;
  for (let i = 0; i < 400; i++) caramelosEnBotin += j.lootForRoll(3, Math.random).filter(x => x === "caramelo").length;
  c.ok(caramelosEnBotin > 0, "los casilleros dan caramelos en temporada (" + caramelosEnBotin + " en 400 tiradas)");
  G.opts.temporada = 2;
  limpio("0", 5);
  let fuera = 0; for (let i = 0; i < 400; i++) fuera += j.lootForRoll(3, Math.random).filter(x => x === "caramelo").length;
  c.ok(!G.temporada && fuera === 0, "fuera de temporada (o con la opción en «Nunca»), ni calabazas ni caramelos");
  c.ok(["truco", "calabazas"].every(id => j.ACHIEVEMENTS.some(a => a.id === id && a.name_en && a.desc_en)) && ITEMS.caramelo.name_en && ITEMS.caramelo.blurb_en, "los logros y el caramelo, en los dos idiomas");
  c.ok(j.OPT_ROWS.some(o => o.key === "temporada"), "se puede elegir en Ajustes: automático, siempre o nunca");
}

console.log("\n── LAS VERSIONES Y LA COPIA SIN EL CAPÍTULO 1 (5.0) ──");
{
  const V = j.VERSIONES;
  c.ok(V[0].v === "5.0" && V.length >= 10 && V.every(r => r.es && r.en && r.puntos.length && r.puntos.every(p => p[0] && p[1])), "la lista de versiones va de la 5.0 a la primera (" + V.length + "), cada una con lo que trajo en español y en inglés");
  c.ok(V.every((r, i) => !i || r.fecha <= V[i-1].fecha), "de la más nueva a la más vieja");
  c.ok(!V.some(r => r.puntos.some(p => /historia|cap[ií]tulo|chapter|story/i.test(p[0] + p[1]))), "y no cuenta nada del modo historia (el capítulo 1 todavía no se publica)");
  const fs = require("fs"), path = require("path");
  const raiz = path.join(__dirname, "..");
  require("child_process").execSync("node " + JSON.stringify(path.join(raiz, "herramientas", "publicar.js")), { stdio: "pipe" });
  const pub = cargar(path.join(raiz, "publicar", "el-zumbido.html"));
  c.ok(pub.HIST_PUBLICO === false && j.HIST_PUBLICO === true, "herramientas/publicar.js saca la copia con el modo historia apagado (en la tuya sigue encendido)");
  // en GitHub Pages (o cualquier web) el archivo del repositorio también lo esconde; sólo se ve en local
  const linea = (fs.readFileSync(path.join(raiz, "el-zumbido.html"), "utf8").match(/const HIST_PUBLICO = ([^\n]*);/) || [])[1];
  const vale = loc => Function("location", "return " + linea)(loc);
  c.ok(linea && !vale({protocol:"https:", hostname:"djg1607.github.io"}) && !vale({protocol:"https:", hostname:"claude.ai"}) && vale({protocol:"http:", hostname:"localhost"}) && vale({protocol:"file:", hostname:""}),
    "el modo historia sólo aparece jugando en local: en GitHub Pages sigue escondido aunque subas el repositorio");
  c.ok(!pub.ACHIEVEMENTS.some(a => /^hist_|^owen$/.test(a.id)) && !pub.CHARACTERS.some(ch => ch.id === "owen") && !pub.OPT_ROWS.some(o => o.key === "vista" || o.key === "histHud"),
    "en la copia publicada no hay logros de la historia, ni Owen, ni ajustes de la historia");
}

process.exit(c.resumen("el mundo") ? 1 : 0);
