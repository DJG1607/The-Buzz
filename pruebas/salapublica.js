/* Sala pública y walkie-talkie (4.0).
   ────────────────────────────────────────────────────────────────────────────
   · Sala pública: sólo el nombre. Se reclama «publica-1»; si ya la lleva otro anfitrión se entra en
     ella; si está llena o no responde se prueba la siguiente, hasta 6. Se entra directo al juego y el
     personaje se elige DENTRO (no en el menú). Si cae el anfitrión, la partida sigue y se vuelve a buscar.
   · Walkie-talkie: con uno encima se oye por voz a quien lleve otro aunque esté en otro nivel.
   · Chat de texto: la pista está a la vista mientras haya sala.                           */

const { cargar, crearContador } = require("./banco.js");
const fs = require("fs"), path = require("path");
const c = crearContador();
const fuente = fs.readFileSync(path.join(__dirname, "..", "el-zumbido.html"), "utf8");

class PeerFalso {
  constructor(id, opciones) {
    this.opciones = opciones || {};
    this.id = id || "invitado-" + Math.random().toString(36).slice(2, 7);
    this.h = {}; this.disconnected = false; this.destroyed = false; this.llamadas = [];
    PeerFalso.todos.push(this);
  }
  on(e, f) { (this.h[e] = this.h[e] || []).push(f); }
  emit(e, x) { (this.h[e] || []).forEach(f => f(x)); }
  connect(id) { const cx = conexionFalsa(id); this.llamadas.push(id); this.ultima = cx; return cx; }
  reconnect() {}
  destroy() { this.destroyed = true; }
}
PeerFalso.todos = [];
function conexionFalsa(id) {
  return { peer: id, h: {}, enviados: [], on(e, f) { this.h[e] = f; }, send(m) { this.enviados.push(m); },
    close() { if (this.cerrada) return; this.cerrada = true; if (this.h.close) this.h.close(); } };
}
function pantalla(X, nombre) {
  const doc = X.__ctx.document, cache = {};
  doc.getElementById = id => cache[id] || (cache[id] = doc.createElement("div"));
  cache.mpName = doc.getElementById("mpName"); cache.mpName.value = nombre === undefined ? "Ana" : nombre;
  cache.mpRoom = doc.getElementById("mpRoom"); cache.mpRoom.value = "";
  return cache;
}
const dejar = () => new Promise(r => setImmediate(r));
const ultimo = () => PeerFalso.todos[PeerFalso.todos.length - 1];
function nuevo(nombre) {
  const X = cargar(); const p = pantalla(X, nombre);
  X.__ctx.Peer = PeerFalso; X.MP.libreria = true;
  X.__ctx.setTimeout = () => 1;                       // los plazos de espera no se disparan solos
  return { X, p };
}

(async () => {
  console.log("── SALA PÚBLICA: EL ANFITRIÓN ──");
  c.ok(/id="mpPublic"/.test(fuente) && /Sala pública \(hasta 10\)/.test(fuente), "hay un botón «Sala pública (hasta 10)»");
  {
    const { X, p } = nuevo("");
    X.mpPublica();
    c.ok(PeerFalso.todos.length === 0 && /nombre/i.test(p.mpStatus.textContent), "sin nombre no se hace nada");
  }
  const A = nuevo("Ana");
  A.X.mpPublica(); await dejar();
  const pa = ultimo();
  c.ok(pa.id === "elzumbido-publica-1", "lo primero es reclamar «publica-1» (id " + pa.id + ")");
  c.ok(A.X.G.running === false, "mientras no abre, no se entra en el juego");
  pa.emit("open");
  c.ok(A.X.MP.activo && A.X.MP.anfitrion && A.X.MP.publica && A.X.MP.grande, "abre una sala pública: es grande (10) y la lleva él");
  c.ok(A.X.G.running === true && A.p.pickScreen.hidden === false, "entra directo al juego, sin ficha de nivel ni menú, y se le pide el personaje");
  c.ok(A.X.G.paused === true, "mientras elige no le pasa nada (partida en pausa)");
  const nivelA = { id: A.X.G.levelId, seed: A.X.G.levelSeed };

  // elegir el personaje dentro del juego
  const libre = A.X.CHARACTERS.filter(ch => A.X.charUnlocked(ch));
  const otro = libre.find(ch => ch.id !== A.X.G.char.id) || libre[0];
  const enviosA = [];
  A.X.MP.conexiones = [{ peer: "x", send(m) { enviosA.push(m); } }];
  A.X.keys.escape = true; A.X.resumeGame();
  c.ok(A.X.G.paused === true, "Escape no sirve para saltarse la elección");
  A.X.mpElegirPersonaje(otro.id);
  c.ok(A.X.G.char.id === otro.id && A.X.G.paused === false && A.p.pickScreen.hidden === true, "elige «" + otro.id + "» y se ve el juego");
  c.ok(A.X.G.levelId === nivelA.id && A.X.G.levelSeed === nivelA.seed, "el nivel de la sala no cambia al elegir");
  c.ok(A.X.hasItem("walkie") && A.X.hasItem("medkit"), "baja con botiquín y walkie-talkie");
  c.ok(enviosA.some(m => m.t === "hola" && m.ch === otro.id), "y avisa a la sala de qué personaje es");
  A.X.mpElegirPersonaje("coach");
  c.ok(A.X.G.char.id === otro.id, "no se puede cambiar otra vez ya dentro (se elige una vez)");

  console.log("\n── SALA PÚBLICA: EL QUE ENTRA ──");
  const B = nuevo("Bea");
  B.X.mpPublica(); await dejar();
  const pb = ultimo();
  c.ok(pb.id === "elzumbido-publica-1", "también empieza reclamando «publica-1»");
  pb.emit("error", { type: "unavailable-id" }); await dejar();
  const pb2 = ultimo();
  c.ok(pb !== pb2 && pb.destroyed && !/^elzumbido-/.test(pb2.id) && pb2.opciones.config, "como ya la lleva otro, abre una conexión normal para entrar");
  pb2.emit("open");
  c.ok(pb2.llamadas[0] === "elzumbido-publica-1", "y llama a «publica-1»");
  const cx1 = pb2.ultima;
  cx1.h.open();
  c.ok(B.X.G.running === false, "hasta que no sabe en qué nivel está la expedición no entra en el juego");
  B.X.mpRecibir(cx1, { t: "sala", modo: "normal", grande: 1 });
  B.X.mpRecibir(cx1, { t: "nivel", id: "0", seed: 4242, modo: "normal" });
  c.ok(B.X.G.running === true && B.p.pickScreen.hidden === false, "al llegar el nivel entra directo al juego y se le pide el personaje");
  c.ok(B.X.G.levelId === "0" && B.X.G.levelSeed === 4242 && B.X.MP.grande, "en el nivel y con la semilla del anfitrión, en sala grande");
  B.X.mpElegirPersonaje(B.X.CHARACTERS[0].id);
  c.ok(B.X.G.levelSeed === 4242 && !B.X.G.paused, "elige personaje y el nivel sigue siendo el de la sala");

  console.log("\n── SALA LLENA O QUE NO RESPONDE ──");
  const C = nuevo("Cris");
  C.X.mpPublica(); await dejar();
  ultimo().emit("error", { type: "unavailable-id" }); await dejar();
  const pc = ultimo(); pc.emit("open"); pc.ultima.h.open();
  C.X.mpRecibir(pc.ultima, { t: "lleno", cap: 10 }); await dejar();
  const pc2 = ultimo();
  c.ok(pc2.id === "elzumbido-publica-2", "«publica-1» está llena: pasa a reclamar «publica-2»");
  c.ok(C.X.PUB.on && !C.X.G.running, "sigue buscando, sin entrar en el juego");
  pc2.emit("open");
  c.ok(C.X.MP.anfitrion && C.X.MP.sala === "publica-2" && C.X.G.running, "y como nadie la lleva, la abre él");
  // una sala que ya no responde
  const D = nuevo("Dani");
  D.X.mpPublica(); await dejar();
  ultimo().emit("error", { type: "unavailable-id" }); await dejar();
  const pd = ultimo(); pd.emit("open");
  pd.emit("error", { type: "peer-unavailable" }); await dejar();
  c.ok(ultimo().id === "elzumbido-publica-2", "si el anfitrión de «publica-1» ya no está, también prueba la siguiente");
  // sin sitio en ninguna
  const E = nuevo("Eva");
  E.X.mpPublica(); await dejar();
  let vistas = [];
  for (let i = 1; i <= 6; i++) {
    const p = ultimo(); vistas.push(p.id);
    p.emit("error", { type: "unavailable-id" }); await dejar();
    const q = ultimo(); q.emit("open"); q.ultima.h.open();
    E.X.mpRecibir(q.ultima, { t: "lleno", cap: 10 }); await dejar();
  }
  c.ok(vistas.join() === [1, 2, 3, 4, 5, 6].map(n => "elzumbido-publica-" + n).join(), "recorre las salas de la 1 a la 6 en orden");
  c.ok(!E.X.PUB.on && !E.X.MP.activo && /llenas/.test(E.p.mpStatus.textContent), "si están todas llenas lo dice y deja de buscar");
  c.ok(!E.p.mpPublic.hidden && !E.p.mpCreate.hidden, "y vuelven los botones");
  // un fallo de red no recorre las seis
  const F = nuevo("Fer");
  F.X.mpPublica(); await dejar();
  const nPeers = PeerFalso.todos.length;
  ultimo().emit("error", { type: "network" }); await dejar();
  c.ok(!F.X.PUB.on && PeerFalso.todos.length === nPeers && /servidor de salas/.test(F.p.mpStatus.textContent), "si no llega al servidor de salas, avisa en vez de probar las seis");
  // volver atrás cancela
  const Gx = nuevo("Gus");
  Gx.X.mpPublica(); await dejar();
  Gx.X.mpSalir();
  c.ok(!Gx.X.PUB.on, "salir cancela la búsqueda");

  console.log("\n── SE VA EL ANFITRIÓN ──");
  const B2 = nuevo("Bea");
  B2.X.mpPublica(); await dejar();
  ultimo().emit("error", { type: "unavailable-id" }); await dejar();
  const q2 = ultimo(); q2.emit("open"); const cxh = q2.ultima; cxh.h.open();
  B2.X.mpRecibir(cxh, { t: "nivel", id: "0", seed: 99, modo: "normal" });
  B2.X.mpElegirPersonaje(B2.X.CHARACTERS[0].id);
  const antes = PeerFalso.todos.length;
  cxh.h.close(); await dejar();
  c.ok(B2.X.G.running === true, "la partida sigue en marcha");
  c.ok(PeerFalso.todos.length === antes + 1 && ultimo().id === "elzumbido-publica-1" && B2.X.PUB.on, "y se vuelve a buscar sala empezando por la 1 (el que llegue primero será el nuevo anfitrión)");
  ultimo().emit("open");
  c.ok(B2.X.MP.anfitrion && B2.X.MP.publica && B2.X.G.running && B2.p.pickScreen.hidden === true, "al abrirla no se vuelve a pedir el personaje ni se reinicia la partida");

  console.log("\n── LAS SALAS NORMALES NO CAMBIAN ──");
  const N = nuevo("Nora"); N.p.mpRoom.value = "la cuadrilla";
  N.X.mpEmpezar(true); await dejar();
  ultimo().emit("open");
  c.ok(ultimo().id === "elzumbido-la-cuadrilla" && !N.X.MP.publica && !N.X.MP.grande && !N.X.G.running && !N.X.PUB.eligiendo,
    "crear una sala con nombre sigue igual: cuadrilla, sin entrar sola al juego, personaje en el menú");
  c.ok(!N.X.PUB.on, "y no busca salas públicas");

  console.log("\n── WALKIE-TALKIE ──");
  const W = cargar();
  const { ITEMS, TIERS, MEG_TIENDA, G, MP } = W;
  c.ok(ITEMS.walkie && ITEMS.walkie.equip && ITEMS.walkie.name_en && ITEMS.walkie.blurb_en, "el walkie-talkie existe, es equipo (no ocupa hueco) y está en inglés");
  c.ok(TIERS.bueno.includes("walkie") && TIERS.raro.includes("walkie"), "sale de los casilleros");
  c.ok(MEG_TIENDA.some(x => x.id === "walkie"), "y se compra en la intendencia");
  c.ok(/walkie\(x\)\{/.test(fuente), "tiene su icono");
  W.resetRun("scout"); W.buildLevel("0", 5);
  W.MP.activo = true; W.MP.peer = { id: "yo" };
  W.startRun("scout");
  c.ok(W.hasItem("walkie"), "en multijugador todos bajan con uno");
  const sinMP = cargar(); sinMP.startRun("scout");
  c.ok(!sinMP.hasItem("walkie"), "en solitario no (no hace falta)");
  // pos lleva si tienes walkie
  const enviados = [];
  W.MP.conexiones = [{ peer: "z", send(m) { enviados.push(m); } }];
  W.G.running = true; W.G.paused = false; W.MP.reloj = 0;
  W.updateGhosts(0.2);
  c.ok(enviados.some(m => m.t === "pos" && m.rd === 1), "la posición dice si llevas walkie");
  // la voz: otro nivel, con y sin walkie
  const lvOtro = "9@9";
  function nodo() { return { el: { volume: 0 }, an: { getByteTimeDomainData(b) { b.fill(180); } }, buf: new Uint8Array(64), nivel: 0, vol: 0 }; }
  const o = { id: "amigo", vx: 5, vz: 5, x: 5, z: 5, lv: lvOtro, rd: 1 };
  W.VOZ.nodes.amigo = nodo();
  for (let i = 0; i < 30; i++) W.vozCompanero(o, false);
  c.ok(W.vozRadio(o) && W.VOZ.nodes.amigo.vol > 0.55 && o.habla === true, "con walkie los dos, se le oye en otro nivel (volumen " + W.VOZ.nodes.amigo.vol.toFixed(2) + ") y se ve que habla");
  const o2 = { id: "amigo2", vx: 5, vz: 5, x: 5, z: 5, lv: lvOtro, rd: 0 };
  W.VOZ.nodes.amigo2 = nodo();
  for (let i = 0; i < 30; i++) W.vozCompanero(o2, false);
  c.ok(!W.vozRadio(o2) && W.VOZ.nodes.amigo2.vol < 0.01 && !o2.habla, "si él no lleva walkie, en otro nivel no se le oye");
  W.G.equip.walkie = false;
  const o3 = { id: "amigo3", vx: 5, vz: 5, x: 5, z: 5, lv: lvOtro, rd: 1 };
  W.VOZ.nodes.amigo3 = nodo();
  for (let i = 0; i < 30; i++) W.vozCompanero(o3, false);
  c.ok(!W.vozRadio(o3) && W.VOZ.nodes.amigo3.vol < 0.01, "y si no lo llevas tú, tampoco");
  W.G.equip.walkie = true;
  // lejos pero en el mismo nivel, con walkie: se oye
  const o4 = { id: "amigo4", vx: 90, vz: 90, x: 90, z: 90, lv: W.G.levelId + "@" + W.G.levelSeed, rd: 1 };
  W.VOZ.nodes.amigo4 = nodo();
  for (let i = 0; i < 30; i++) W.vozCompanero(o4, true);
  c.ok(W.VOZ.nodes.amigo4.vol > 0.4, "con walkie también se oye a un compañero muy lejos del mismo nivel");
  // sala grande: los de otro nivel con walkie entran en el reparto de voces
  W.MP.grande = true; W.VOZ.listo = true; W.VOZ.calls = {}; W.VOZ.dest = { stream: {} };
  const llamadas = [];
  W.MP.peer = { id: "a0", call(id) { llamadas.push(id); return { peer: id, on() {}, close() {} }; } };
  W.MP.otros = {
    a1: { voz: true, x: 3, z: 3, lv: W.G.levelId + "@" + W.G.levelSeed, rd: 0 },
    a2: { voz: true, x: 3, z: 3, lv: lvOtro, rd: 1 },
    a3: { voz: true, x: 3, z: 3, lv: lvOtro, rd: 0 }
  };
  W.vozGestionar();
  c.ok(llamadas.includes("a1") && llamadas.includes("a2") && !llamadas.includes("a3"), "en sala grande se llama al cercano y al del walkie de otro nivel, pero no al de otro nivel sin walkie");

  console.log("\n── CHAT DE TEXTO A LA VISTA ──");
  const T = cargar(); const ph = pantalla(T);
  T.MP.activo = true; T.mpChatHint();
  c.ok(!ph.chatHint.hidden && /chat/i.test(ph.chatHint.textContent), "con sala, la pista del chat de texto está a la vista");
  T.MP.activo = false; T.mpChatHint();
  c.ok(ph.chatHint.hidden === true, "sin sala, no");
  c.ok(/\{id:"chat",\s+def:"enter"/.test(fuente) && /k===kb\("chat"\) && MP\.activo/.test(fuente), "el chat va con [Enter] en cualquier sala (normal, grande o pública)");

  process.exit(c.resumen("la sala pública y el walkie") ? 1 : 0);
})();
