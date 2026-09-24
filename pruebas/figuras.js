/* Figuras (desde 2.0.0): la ropa de cada personaje, los sprites de pixel art
   con ciclo de andar y correr, y los muñecos de 8 bits en 3D (vóxeles
   articulados, opcionales) con sus animaciones.
   ────────────────────────────────────────────────────────────────────────────
   El banco no tiene WebGL: Three.js es de mentira. Por eso se prueban las
   piezas puras (la rejilla de cubitos, el mallado, los modelos y las
   posturas) y la animación con un muñeco de objetos normales que tiene la
   misma forma que el de verdad.                                          */

const { cargar, crearContador } = require("./banco.js");
const j = cargar();
const { G, CHARACTERS, SKINS, SPRITES, skinLook, rigSpec, rigPose, rigTemplate, rigAnimate, vgrid, voxMeshData } = j;
const c = crearContador();

/* ── 0. sprites de pixel art ── */
console.log("── SPRITES DE PIXEL ART ──");
const at = SPRITES.char_scout;
c.ok(at.cols === 8 && at.rows === 4 && at.cw === 48 && at.ch === 72, "cada persona: 8 fotogramas (4 de andar, 4 de correr) × 4 direcciones, en celdas de 48×72");
c.ok(["hound", "crawler", "clump"].every(k => SPRITES[k].cols === 8 && SPRITES[k].cw === 64 && SPRITES[k].ch === 48), "Hound, Crawler y Clump: de perfil, 64×48, también con fotogramas de correr");
c.ok(["smiler", "deathmoth"].every(k => SPRITES[k].cw === 48 && SPRITES[k].ch === 48), "Smiler y Deathmoth: de frente, 48×48");
c.ok(G.opts.figs === 0 && !j.voxOn(), "por defecto se juega con los sprites");
const gp = j.gaitPose;
const abre = col => Math.abs(gp(col).thL - gp(col).thR);
c.ok(abre(0) < 0.01 && abre(2) < 0.01 && abre(1) > 0.7 && abre(3) > 0.7, "andar: neutro, zancada, neutro, zancada (como en No-Clip)");
c.ok(abre(5) > abre(1) * 1.6 && gp(5).elL > 1.2 && gp(4).lean > gp(0).lean, "correr: zancada más larga, codos doblados y el cuerpo inclinado");
c.ok(gp(0).knL > gp(0).knR, "en el paso neutro la pierna que pasa va doblada");
// finishHD con un lienzo de mentira: un bloque de 4×6 en una celda de 10×10
const px = new Uint8ClampedArray(10 * 10 * 4);
for (let y = 2; y < 8; y++) for (let x = 3; x < 7; x++) { const i = (y * 10 + x) * 4; px[i] = px[i + 1] = px[i + 2] = 150; px[i + 3] = 255; }
const lienzo = { getContext: () => ({ getImageData: () => ({ data: px }), putImageData() {} }) };
j.finishHD(lienzo, 10, 10, 1, 1);
const a = (x, y) => px[(y * 10 + x) * 4 + 3], v = (x, y) => px[(y * 10 + x) * 4];
c.ok(a(2, 4) === 235 && a(7, 4) === 235 && a(4, 1) === 235 && a(4, 8) === 235 && px[(4 * 10 + 2) * 4] < 20 && a(0, 0) === 0, "contorno oscuro de 1 píxel alrededor de la figura");
c.ok(v(4, 2) > v(4, 7) + 30, "luz desde arriba: la cabeza más clara que los pies (" + v(4, 2) + " → " + v(4, 7) + ")");
const src = require("fs").readFileSync(require("path").join(__dirname, "..", "el-zumbido.html"), "utf8");
c.ok(/if\(atlas\.cw\) w = h\*atlas\.cw\/atlas\.ch/.test(src), "el sprite se ve con píxeles cuadrados: el ancho sale de su celda, sin estirarlo");
c.ok(/\+ \(running \? 4 : 0\)/.test(src) && /e\.state === "chase" && e\.mesh\.userData\.atlas\.cols >= 8 \? 4 : 0/.test(src), "el jugador y las entidades que persiguen usan los fotogramas de correr");

/* ── 1. ropa ── */
console.log("\n── CADA UNO CON SU ROPA ──");
const prendas = ch => Object.keys(skinLook(ch, "base").opts).filter(k => j.ROPA.includes(k) && skinLook(ch, "base").opts[k]);
const porPersonaje = CHARACTERS.map(ch => [ch.id, prendas(ch)]);
porPersonaje.forEach(([id, p]) => c.ok(p.length >= 3, id.padEnd(8) + " lleva " + p.join(", ")));
const firmas = porPersonaje.map(([, p]) => p.slice().sort().join("+"));
c.ok(new Set(firmas).size === firmas.length, "no hay dos personajes con la misma ropa");
const vera = CHARACTERS.find(ch => ch.id === "scav");
const hazmat = skinLook(vera, "hazmat").opts;
c.ok(hazmat.visor && hazmat.hood && !hazmat.jacket && !hazmat.goggles, "un aspecto cambia la ropa entera (Vera de hazmat: máscara y capucha, sin su chaqueta)");
c.ok(skinLook(vera, "hazmat").opts.ponytail === true, "pero conserva lo que es suyo (la coleta)");
const conRopa = SKINS.filter(s => s.need && s.opts && Object.keys(s.opts).some(k => j.ROPA.includes(k) && k !== "cap" && k !== "hood"));
c.ok(conRopa.length >= 4, conRopa.length + " aspectos especiales traen prendas propias, no sólo colores");

/* ── 2. cubitos ── */
console.log("\n── LA REJILLA DE CUBITOS ──");
const cubo = vgrid().box(0, 0, 0, 3, 3, 3, "#808080");
const m = voxMeshData(cubo, 1);
c.ok(m.voxeles === 27 && m.caras === 54, "un cubo de 3×3×3 son 27 cubitos y sólo sus 54 caras de fuera (" + m.caras + ")");
cubo.set(1, 3, 1, "!#ffffff");
const m2 = voxMeshData(cubo, 1);
c.ok(m2.glow.idx.length === 5 * 6 && m2.caras === 54 + 4, "un cubito con «!» va aparte, a la malla que brilla (ojos, dientes, linterna)");
const uno = voxMeshData(vgrid().set(0, 0, 0, "#808080"), 0.5, [-0.5, 0, 0]).solid.pos.filter((v, i) => i % 3 === 0);
c.ok(Math.min(...uno) === -0.25 && Math.max(...uno) === 0.25, "el tamaño del cubito y el centrado se aplican al mallar");

/* ── 3. los modelos ── */
console.log("\n── LOS MUÑECOS ──");
const nombres = spec => spec.parts.map(p => p.n);
const cuerpo = ["torso", "head", "armL", "armR", "foreL", "foreR", "handL", "handR", "thighL", "thighR", "shinL", "shinR"];
CHARACTERS.forEach(ch => {
  const sp = rigSpec("human", SPRITES["char_" + ch.id].look);
  c.ok(cuerpo.every(n => nombres(sp).includes(n)), ch.id.padEnd(8) + " tiene cabeza, torso, brazos con codo y piernas con rodilla (" + sp.parts.length + " piezas)");
});
const pieza = (sp, n) => sp.parts.find(p => p.n === n).g;
const colores = g => { const s = new Set(); g.each((x, y, z, col) => s.add(col)); return s; };
const spVera = rigSpec("human", SPRITES.char_scav.look);
c.ok(nombres(spVera).includes("tail") && spVera.parts.find(p => p.n === "tail").p === "head", "la coleta de Vera es una pieza que cuelga de la cabeza (y se balancea)");
let mochila = 0; pieza(spVera, "torso").each((x, y, z) => { if (z <= -4) mochila++; });
c.ok(mochila > 100, "y lleva la mochila a la espalda en 3D (" + mochila + " cubitos)");
c.ok(colores(pieza(rigSpec("human", SPRITES.char_scout.look), "torso")).has("#8a7a4e"), "Marcos lleva su chaleco de topógrafo");
c.ok(colores(pieza(rigSpec("human", SPRITES.char_coach.look), "shinL")).has("#e0503a"), "el Entrenador lleva los patines con ruedas");
c.ok(colores(pieza(rigSpec("human", SPRITES.partygoer.look), "head")).has("#b4527e"), "el Partygoer lleva su gorro de fiesta");
let brilloLazaro = 0; pieza(rigSpec("human", SPRITES.char_lazarus.look), "head").each((x, y, z, col) => { if (col.charAt(0) === "!") brilloLazaro++; });
c.ok(brilloLazaro === 8, "a Lázaro le brillan los ojos dentro de la capucha");
const largo = sp => { let a = 0, b = 0; pieza(sp, "foreL").each((x, y) => { a = Math.min(a, y); }); return a; };
c.ok(largo(rigSpec("human", SPRITES.wretch.look)) < largo(rigSpec("human", SPRITES.stealer.look)), "el Wretch tiene los brazos más largos que los demás");
const bichos = { hound: ["body", "head", "tail", "thighFL", "shinBR"], crawler: ["body", "head", "thighFL", "shinBR"],
  clump: ["body", "t0", "u5"], smiler: ["cloud", "eyes", "grin"], moth: ["body", "wingL", "wingR", "hindL", "hindR"] };
for (const k in bichos) c.ok(bichos[k].every(n => nombres(rigSpec(k)).includes(n)), k.padEnd(8) + " tiene " + bichos[k].join(", "));
let sonrisa = 0, total = 0; pieza(rigSpec("smiler"), "grin").each((x, y, z, col) => { total++; if (col.charAt(0) === "!") sonrisa++; });
c.ok(total > 30 && sonrisa === total, "la sonrisa y los ojos del Smiler brillan en la oscuridad (" + total + " cubitos)");
c.ok(j.RIG_KIND.hound === "hound" && j.RIG_KIND.deathmoth === "moth" && !j.RIG_KIND.faceling, "cada entidad usa su modelo; las de cuerpo humano, el humano con sus rasgos");
const tPl = rigTemplate(SPRITES.char_scout, undefined, 0.94, 1.42), tFa = rigTemplate(SPRITES.faceling, "faceling", 1.0, 1.9);
c.ok(Math.abs(tPl.s * 36 - 1.42) < 1e-9 && tFa.s > tPl.s, "un humano mide 36 cubitos, como su sprite: el Faceling, más alto, tiene cubitos más grandes");
c.ok(rigTemplate(SPRITES.char_scout, undefined, 0.94, 1.42) === tPl, "las mallas se hacen una vez por aspecto y tamaño, y se comparten");

/* ── 4. posturas ── */
console.log("\n── ANIMACIONES ──");
const pico = (T, walk, run, parte, eje) => {                 // el giro máximo de una pieza en un paso completo
  let max = 0;
  for (let i = 0; i < 32; i++) {
    const R = rigPose(T, { t: 0, ph: i / 32 * Math.PI * 2, walk, run, pose: "", twist: 0 });
    max = Math.max(max, Math.abs((R.rot[parte] || [0, 0, 0])[eje || 0]));
  }
  return max;
};
const quieto = pico(tPl, 0, 0, "thighL"), anda = pico(tPl, 1, 0, "thighL"), corre = pico(tPl, 1, 1, "thighL");
c.ok(quieto < 0.05 && anda > 0.4 && corre > anda * 1.6, "las piernas: quietas " + quieto.toFixed(2) + ", andando " + anda.toFixed(2) + ", corriendo " + corre.toFixed(2) + " rad");
c.ok(pico(tPl, 1, 1, "shinL") > pico(tPl, 1, 0, "shinL") * 2, "corriendo dobla mucho más las rodillas");
c.ok(pico(tPl, 1, 1, "foreL") > 1.4 && pico(tPl, 1, 0, "foreL") < 0.5, "y los codos: brazos casi rectos al andar, doblados al correr");
c.ok(pico(tPl, 1, 1, "torso") > pico(tPl, 1, 0, "torso") + 0.15, "corriendo se inclina hacia delante");
const R0 = rigPose(tPl, { t: 0, ph: 0.8, walk: 1, run: 0, pose: "", twist: 0 });
c.ok(Math.sign(R0.rot.armL[0]) === -Math.sign(R0.rot.thighL[0]) || R0.rot.thighL[0] === 0, "cada brazo va al revés que su pierna, como al andar de verdad");
const pose = p => rigPose(tPl, { t: 1, ph: 0, walk: 0, run: 0, pose: p, twist: 0 });
c.ok(pose("held").rot.armL[0] < -1.4, "agarrado forcejea con los brazos en alto");
c.ok(pose("wind").rot.armL[0] < -2.5, "cargando el especial levanta los brazos");
c.ok(pose("stun").rot.head[0] > 0.4, "aturdido deja caer la cabeza");
c.ok(rigPose(tPl, { t: 0, ph: 0, walk: 0, run: 0, pose: "", twist: 0, swR: 0.8 }).rot.armR[0] < -1.5, "el golpe con un arma sube el brazo y lo baja");
const tWr = rigTemplate(SPRITES.wretch, "wretch", 1.0, 1.6);
c.ok(rigPose(tWr, { t: 0, ph: 0, walk: 1, run: 1, pose: "chase", twist: 0 }).rot.armL[0] < -1.2, "el Wretch persigue con los brazos por delante");
const tHo = rigTemplate(SPRITES.hound, "hound", 1.3, 1.0);
c.ok(pico(tHo, 1, 1, "thighBL") > pico(tHo, 1, 0, "thighBL"), "el Hound pasa del trote al galope");
const tMo = rigTemplate(SPRITES.deathmoth, "deathmoth", 1.1, 1.1);
const alas = [0, 0.02, 0.04, 0.06].map(t => rigPose(tMo, { t, ph: 0, walk: 0, run: 0, pose: "", twist: 0 }).rot.wingL[2]);
c.ok(Math.max(...alas) - Math.min(...alas) > 0.5, "la Deathmoth bate las alas");

/* ── 5. la animación sale del movimiento ── */
console.log("\n── SE MUEVE Y SE ANIMA SOLO ──");
// un muñeco de objetos normales con la misma forma que el de Three.js
const v3 = () => ({ x: 0, y: 0, z: 0, set(a, b, c2) { this.x = a; this.y = b; this.z = c2; } });
const obj = () => ({ rotation: v3(), position: v3(), scale: v3(), hijos: [], add(o) { this.hijos.push(o); }, remove() {} });
const P = { root: obj() }; tPl.parts.forEach(p => { P[p.n] = obj(); });
const fig = { position: v3(), rotation: v3(), scale: v3(), material: {},
  userData: { rig: { T: tPl, P, glow: {}, ph: 0, v: 0, twist: 0, back: false, lx: null, lz: null, last: 0, yaw: null, swL: 0, swR: 0, seed: 0, gear: {} } } };
let reloj = 1000; j.__ctx.performance.now = () => reloj;
const paso = (vx, n, yaw) => { let maxMuslo = 0; for (let i = 0; i < n; i++) { reloj += 16; fig.position.x += vx * 0.016; fig.userData.yawWant = yaw || 0; rigAnimate(fig); maxMuslo = Math.max(maxMuslo, Math.abs(P.thighL.rotation.x)); } return maxMuslo; };
const r = fig.userData.rig;
const mQuieto = paso(0, 60), vQuieto = r.v;
const mAnda = paso(3.4, 90, Math.PI / 2), vAnda = r.v;
const mCorre = paso(6.1, 90, Math.PI / 2), vCorre = r.v;
c.ok(vQuieto < 0.01 && Math.abs(vAnda - 3.4) < 0.2 && Math.abs(vCorre - 6.1) < 0.3, "mide su velocidad por lo que se mueve: " + vAnda.toFixed(2) + " m/s andando, " + vCorre.toFixed(2) + " corriendo");
c.ok(mQuieto < 0.05 && mAnda > 0.4 && mCorre > mAnda * 1.5, "y de ahí sale la animación: piernas " + mQuieto.toFixed(2) + " → " + mAnda.toFixed(2) + " → " + mCorre.toFixed(2));
c.ok(Math.abs(fig.rotation.y - Math.PI / 2) < 0.05, "gira suave hacia donde se le pide mirar");
paso(-3.4, 60, Math.PI / 2);
c.ok(r.back, "andando hacia atrás lo nota (y el paso va al revés)");
fig.userData.gearR = "pipe"; paso(0, 2);
c.ok(r.gear.R && r.gear.R.id === "pipe" && P.handR.hijos.length === 1, "el arma equipada aparece en su mano");
fig.userData.gearR = null; paso(0, 2);
c.ok(!r.gear.R, "y desaparece al soltarla");
paso(0, 60); fig.position.x += 40; paso(0, 3);
c.ok(r.v < 0.01, "un teletransporte (noclip, cambio de nivel) no cuenta como correr");
fig.userData.pose = "down"; fig.position.y = 0.34; paso(0, 1);
c.ok(Math.abs(P.root.rotation.x + Math.PI / 2) < 1e-6, "caído en multijugador se tumba en el suelo");

/* ── 6. enganchado al juego ── */
console.log("\n── EN EL JUEGO ──");
const fuente = require("fs").readFileSync(require("path").join(__dirname, "..", "el-zumbido.html"), "utf8");
G.opts.figs = 1; const on = j.voxOn(); G.opts.figs = 0; const off = j.voxOn();
c.ok(on && !off && /return voxOn\(\) \? makeRig\(atlas, w, h, key\) : makeSprite\(atlas, w, h\)/.test(fuente), "el ajuste «Personajes» elige entre los sprites (por defecto) y los muñecos 3D");
c.ok(/makeActor\(SPRITES\[def\.atlas\]/.test(fuente) && /player\.mesh = makeActor\(/.test(fuente) && /o\.mesh = makeActor\(/.test(fuente),
  "lo usan las entidades, el jugador y los compañeros de multijugador");
c.ok(["held", "grab", "stun", "wind", "chase"].every(p => fuente.includes('"' + p + '"')) && /userData\.swing = hand/.test(fuente),
  "el juego les pasa la postura: agarrado, agarrando, aturdido, cargando, persiguiendo y el golpe");
c.ok(/actorDown\(player\.mesh, true\)/.test(fuente) && /actorDown\(o\.mesh, !!o\.dn\)/.test(fuente), "caerse y reanimarse tumba y levanta la figura (tuya y de tus amigos)");
c.ok(Object.keys(j.ENT_LOOK).every(k => SPRITES[k].look) && CHARACTERS.every(ch => SPRITES["char_" + ch.id].look), "todos los atlas con cuerpo humano guardan su aspecto para montar la figura");

process.exit(c.resumen("las figuras") ? 1 : 0);
