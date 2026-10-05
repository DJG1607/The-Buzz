/* Sala grande (4.0): hasta 10 jugadores.
   ────────────────────────────────────────────────────────────────────────────
   No hay un servidor por jugador: la sala vive en el navegador del anfitrión y la
   red es una estrella, así que lo que crece es el trabajo del anfitrión (cada posición
   que recibe, la reenvía a todos los demás). Aquí se comprueba que:
   · el aforo se respeta (4 en cuadrilla, 10 en sala grande) y el que llega de más lo sabe,
   · el anfitrión adelgaza el reenvío de posiciones (lejos, otro nivel),
   · los datos fijos (arma, ropa) no viajan en cada mensaje,
   · la voz sólo se reparte entre los más cercanos,
   · todo sigue igual en una sala normal.                                      */

const { cargar, crearContador } = require("./banco.js");
const fs = require("fs"), path = require("path");
const c = crearContador();
const fuente = fs.readFileSync(path.join(__dirname, "..", "el-zumbido.html"), "utf8");

// una conexión de mentira: guarda lo que se le manda y recuerda sus manejadores
function cx(id) {
  return { peer: id, h: {}, enviados: [], visto: Date.now(), cerrada: false,
    on(e, f) { this.h[e] = f; }, send(m) { this.enviados.push(JSON.parse(JSON.stringify(m))); }, close() { this.cerrada = true; } };
}
function anfitrion(grande, n) {
  const H = cargar();
  H.MP.activo = true; H.MP.anfitrion = true; H.MP.grande = !!grande; H.MP.peer = { id: "elzumbido-sala", destroy() {} };
  H.resetRun("scout"); H.buildLevel("0", 7);
  H.G.running = true; H.G.paused = false; H.G.dead = false;
  H.MP.conexiones = [];
  for (let i = 0; i < (n || 0); i++) H.MP.conexiones.push(cx("p" + i));
  return H;
}
const nivelDe = H => H.G.levelId + "@" + H.G.levelSeed;

console.log("── AFORO ──");
const H0 = anfitrion(false, 0);
c.ok(H0.MP_CAP.cuadrilla === 4 && H0.MP_CAP.grande === 10, "cuadrilla de 4 y sala grande de 10");
c.ok(H0.mpCap() === 4 && !H0.mpLlena(), "una sala normal vacía admite hasta 4");
H0.MP.grande = true;
c.ok(H0.mpCap() === 10, "una sala grande, hasta 10");

for (const grande of [false, true]) {
  const cap = grande ? 10 : 4;
  const H = anfitrion(grande, 0);
  let admitidos = 0, rechazados = 0, aviso = null, rechazado = null;
  H.__ctx.setTimeout = f => f();                         // el cierre diferido, al momento
  for (let i = 0; i < cap + 2; i++) {
    const x = cx("inv" + i);
    H.mpAtarConexion(x);
    x.h.open();
    if (H.MP.conexiones.includes(x)) admitidos++;
    else { rechazados++; rechazado = x; aviso = aviso || x.enviados.find(m => m.t === "lleno"); }
  }
  c.ok(admitidos + 1 === cap && rechazados === 3, (grande ? "sala grande" : "sala normal") + ": con el anfitrión caben " + cap + " y los demás se rechazan (entran " + (admitidos + 1) + ")");
  c.ok(aviso && aviso.cap === cap && rechazado.cerrada, "al que sobra se le dice que está llena (" + cap + ") y se le cierra la conexión");
  // quien ya estaba dentro y se reconecta no cuenta como uno más
  const dentro = H.MP.conexiones[0], mismo = cx(dentro.peer);
  H.mpAtarConexion(mismo); mismo.h.open();
  c.ok(H.MP.conexiones.includes(mismo) && !mismo.enviados.some(m => m.t === "lleno"), "y el que ya estaba y se reconecta entra: ocupa su sitio, no uno nuevo");
}

// el invitado que recibe «lleno» vuelve a poder pulsar Entrar
const I = cargar();
I.MP.activo = true; I.MP.anfitrion = false; I.MP.peer = { id: "yo", destroy() {} }; I.MP.conexiones = [cx("elzumbido-sala")];
I.mpRecibir(I.MP.conexiones[0], { t: "lleno", cap: 4 });
c.ok(!I.MP.activo && !I.MP.peer, "el que recibe «lleno» queda fuera de la sala y puede volver a probar");
// el invitado se entera de que la sala es grande
const J = cargar();
J.MP.activo = true; J.MP.anfitrion = false; J.MP.peer = { id: "yo" }; J.MP.conexiones = [cx("elzumbido-sala")];
J.mpRecibir(J.MP.conexiones[0], { t: "sala", modo: "normal", grande: 1 });
c.ok(J.MP.grande === true && J.mpCap() === 10, "el invitado sabe por el anfitrión que la sala es grande");
J.mpRecibir(J.MP.conexiones[0], { t: "sala", modo: "normal", grande: 0 });
c.ok(J.MP.grande === false, "y que ya no");
// el anfitrión anuncia el tamaño al abrir
const Ha = anfitrion(true, 0);
const nuevo = cx("nuevo1"); Ha.mpAtarConexion(nuevo); nuevo.h.open();
c.ok(nuevo.enviados.some(m => m.t === "sala" && m.grande === 1), "el anfitrión dice «sala grande» a cada uno que entra");
c.ok(/data-tam="cuadrilla"/.test(fuente) && /data-tam="grande"/.test(fuente) && /id="mpSize"/.test(fuente), "la pantalla de la sala deja elegir «Cuadrilla» o «Sala grande» antes de crearla");
c.ok(/MP\.grande = anfitrion && MP\.tam === "grande"/.test(fuente), "sólo el que crea la sala decide el tamaño");

console.log("\n── REENVÍO DE POSICIONES ──");
const R = anfitrion(false, 0);
const pos = (x, z, lv, extra) => Object.assign({ t: "pos", x, z, yaw: 0, f: 0, r: 0, hp: 100, dn: 0, lv }, extra || {});
c.ok(R.mpPosDebe(pos(0, 0, "a"), { lv: "b", x: 500, z: 500 }, 1), "sala normal: se reenvía todo, esté donde esté");
R.MP.grande = true;
const dest = { lv: "a", x: 0, z: 0 };
c.ok(R.mpPosDebe(pos(5, 5, "a"), dest, 1) && R.mpPosDebe(pos(5, 5, "a"), dest, 2), "sala grande: lo cercano y de tu nivel, siempre");
const lejos = [1, 2, 3, 4, 5, 6].map(n => R.mpPosDebe(pos(80, 0, "a"), dest, n));
c.ok(lejos.filter(Boolean).length === 2, "lo lejano, una de cada tres (" + lejos.filter(Boolean).length + " de 6)");
const otro = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => R.mpPosDebe(pos(1, 1, "b"), dest, n));
c.ok(otro.filter(Boolean).length === 2, "lo de otro nivel, una de cada seis (" + otro.filter(Boolean).length + " de 12)");
c.ok(R.mpPosDebe(pos(80, 0, "b", { gk: "bh", gl: null, gr: null }), dest, 1), "los mensajes completos (arma, ropa) siempre pasan");
c.ok(R.mpPosDebe(pos(80, 0, "b"), undefined, 1) && R.mpPosDebe(pos(80, 0, "b"), { lv: undefined }, 1), "y de quien aún no se sabe nada, también");

// el reenvío de verdad: 10 jugadores, 9 conexiones; unos cerca, otros lejos, otros en otro nivel
function ronda(H, rondas) {
  const lv = nivelDe(H);
  H.MP.conexiones.forEach((x, i) => {
    H.MP.otros[x.peer] = { nombre: "J" + i, ch: "scout", lv: i < 3 ? lv : (i < 6 ? lv : "9@9"), x: i < 3 ? i : (i < 6 ? 100 + i * 10 : 5), z: 0, visto: 0 };
  });
  for (let r = 0; r < rondas; r++)
    H.MP.conexiones.forEach((x, i) => {
      const o = H.MP.otros[x.peer];
      H.mpRecibir(x, pos(o.x, o.z, o.lv));
    });
  return H.MP.conexiones.reduce((s, x) => s + x.enviados.filter(m => m.t === "pos").length, 0);
}
const Hn = anfitrion(false, 9), Hg = anfitrion(true, 9);
const nNormal = ronda(Hn, 12), nGrande = ronda(Hg, 12);
c.ok(nNormal === 12 * 9 * 8, "sala normal: cada posición llega a los 8 demás (" + nNormal + " envíos en 12 rondas)");
c.ok(nGrande < nNormal * 0.65, "sala grande con 9 invitados repartidos: se manda bastante menos (" + nGrande + " frente a " + nNormal + ", " + Math.round(100 * nGrande / nNormal) + " %)");
const cercanos = Hg.MP.conexiones[0].enviados.filter(m => m.t === "pos" && (m.from === "p1" || m.from === "p2")).length;
c.ok(cercanos === 24, "y los que están cerca de ti siguen llegando enteros (24 de 24)");
c.ok(Hg.MP.conexiones[1].enviados.filter(m => m.t === "pos" && m.from === "p3").length < 12, "mientras que a los lejanos se les ve con menos frecuencia");

console.log("\n── LO QUE SE ENVÍA ──");
const E = anfitrion(true, 2);
E.G.levelId = "0"; E.G.levelSeed = 7;
E.MP.fullT = 0;
const lista = [];
for (let i = 0; i < 30; i++) {
  E.MP.conexiones.forEach(x => x.enviados.length = 0);
  E.updateGhosts(0.13);
  const m = E.MP.conexiones[0].enviados.find(m => m.t === "pos");
  if (m) lista.push(m);
}
const completos = lista.filter(m => m.gk !== undefined).length;
c.ok(lista.length > 20 && completos >= 2 && completos <= 6, "sala grande: sólo algunos mensajes llevan arma y ropa (" + completos + " de " + lista.length + ", uno por segundo)");
c.ok(lista.every(m => m.x !== undefined && m.z !== undefined && m.hp !== undefined && m.lv), "pero todos llevan posición, vida y nivel");
const cortos = lista.filter(m => m.gk === undefined);
c.ok(JSON.stringify(cortos[0]).length < JSON.stringify(lista.find(m => m.gk !== undefined)).length * 0.7, "y el corto pesa mucho menos (" + JSON.stringify(cortos[0]).length + " frente a " + JSON.stringify(lista.find(m => m.gk !== undefined)).length + " bytes)");
const N = anfitrion(false, 1); N.MP.fullT = 0; N.G.levelId = "0"; N.G.levelSeed = 7;
let todosCompletos = true;
for (let i = 0; i < 5; i++) { N.MP.conexiones[0].enviados.length = 0; N.updateGhosts(0.09); const m = N.MP.conexiones[0].enviados.find(m => m.t === "pos"); if (m && m.gk === undefined) todosCompletos = false; }
c.ok(todosCompletos, "sala normal: todos los mensajes completos, como siempre");

// el que recibe un mensaje corto no pierde lo que sabía de él
const Rx = cargar();
Rx.MP.activo = true; Rx.MP.anfitrion = false; Rx.MP.peer = { id: "yo" };
Rx.mpRecibir(null, Object.assign(pos(1, 1, "a"), { from: "z", gk: "bh", gl: "bat", gr: null, n: "Zoe", ch: "scout", sk: "base" }));
Rx.mpRecibir(null, Object.assign(pos(2, 2, "a"), { from: "z" }));
const z = Rx.MP.otros.z;
c.ok(z.gk === "bh" && z.gl === "bat" && z.x === 2, "un mensaje corto actualiza la posición y conserva su arma y su ropa");

console.log("\n── LA VOZ CON MUCHA GENTE ──");
const cand = [["a", 3], ["b", 9], ["c", 1], ["d", 25], ["e", 5], ["f", 40]].map(([id, d]) => ({ id, d }));
const v0 = Hg.vozElegir(cand, {}, 3);
c.ok(JSON.stringify(v0.llamar.slice().sort()) === '["a","c","e"]' && v0.cerrar.length === 0, "de seis, se llama a los tres más cercanos (c, a, e)");
const v1 = Hg.vozElegir(cand, { c: 1, a: 1, e: 1 }, 3);
c.ok(v1.llamar.length === 0 && v1.cerrar.length === 0, "si ya están, no se hace nada");
const mov = cand.map(x => x.id === "b" ? { id: "b", d: 2 } : x);
const v2 = Hg.vozElegir(mov, { c: 1, a: 1, e: 1 }, 3);
c.ok(v2.llamar.includes("b") === false || v2.llamar.length <= 1, "uno que se acerca no hace saltar todo");
const v3 = Hg.vozElegir(mov, { c: 1, a: 1, e: 1, d: 1 }, 3);
c.ok(v3.cerrar.includes("d"), "una llamada con alguien que se ha ido lejos se cierra");
const v4 = Hg.vozElegir([{ id: "a", d: 3 }, { id: "b", d: 3.1 }, { id: "c", d: 3.2 }, { id: "d", d: 3.3 }], { a: 1, b: 1, c: 1, d: 1 }, 3);
c.ok(v4.cerrar.length === 0, "histéresis: el cuarto, casi igual de cerca, no se corta y se vuelve a llamar sin parar");
const v5 = Hg.vozElegir([], { x: 1 }, 3);
c.ok(v5.cerrar.includes("x"), "si nadie está a tu alcance, se cuelgan las llamadas");
c.ok(Hg.VOZ_MAX_GRANDE === 3, "máximo 3 voces a la vez en sala grande");

// vozLlamar respeta el cupo; en sala normal no hay cupo
function conVoz(grande) {
  const H = anfitrion(grande, 0);
  const llamadas = [];
  H.MP.peer = { id: "a0", call(id) { llamadas.push(id); return { peer: id, on() {}, close() {} }; } };
  H.VOZ.listo = true; H.VOZ.dest = { stream: {} }; H.VOZ.calls = {};
  return { H, llamadas };
}
const g = conVoz(true);
["b1", "b2", "b3", "b4", "b5"].forEach(id => g.H.vozLlamar(id));
c.ok(g.llamadas.length === 3, "sala grande: a la cuarta llamada no se llama (" + g.llamadas.length + ")");
const n = conVoz(false);
["b1", "b2", "b3", "b4", "b5"].forEach(id => n.H.vozLlamar(id));
c.ok(n.llamadas.length === 5, "sala normal: sin límite, como antes");
const ent = conVoz(true);
for (let i = 0; i < 4; i++) ent.H.VOZ.calls["x" + i] = { peer: "x" + i, close() {} };
let cerrada = false;
ent.H.vozEntrante({ peer: "intruso", answer() {}, on() {}, close() { cerrada = true; } });
c.ok(cerrada, "y una llamada entrante de más se rechaza");

console.log("\n── LEJOS NO SE DIBUJA ──");
c.ok(/MP\.grande && Math\.hypot\(o\.vx - player\.pos\.x, o\.vz - player\.pos\.z\) > MP_VISTA_GRANDE/.test(fuente), "en sala grande a los jugadores a más de 34 m ni se les dibuja");
c.ok(/vozGestionar\(\)/.test(fuente) && /MP\.vozT = 1\.5/.test(fuente), "el reparto de voces se revisa cada segundo y medio");

process.exit(c.resumen("la sala grande") ? 1 : 0);
