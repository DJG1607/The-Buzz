/* Multijugador (desde 1.8.0): multijugador de verdad, botiquín, aspectos, teclas a
   gusto y mando.
   ────────────────────────────────────────────────────────────────────────────
   El multijugador no se puede probar con PeerJS sin varios ordenadores, así
   que aquí se cargan TRES copias del juego (anfitrión y dos invitados) y se
   conectan con una red de mentira que entrega los mensajes al momento y en
   forma de estrella, igual que la de verdad: cada invitado sólo habla con el
   anfitrión. Si el anfitrión no reenviara, los invitados no se verían.     */

const { cargar, crearContador } = require("./banco.js");
const fs = require("fs"), path = require("path");
const c = crearContador();
const fuente = fs.readFileSync(path.join(__dirname, "..", "el-zumbido.html"), "utf8");

/* ── red de mentira ── */
const H = cargar(), A = cargar(), B = cargar();
const ids = new Map([[H, "elzumbido-sala"], [A, "peer-ana"], [B, "peer-bea"]]);
const nombres = new Map([[H, "Hugo"], [A, "Ana"], [B, "Bea"]]);
function conexion(de, a) {        // la conexión que ve «de», apuntando a «a»
  const cx = { peer: ids.get(a), open: true, send(m) { a.mpRecibir(vuelta(a, de), JSON.parse(JSON.stringify(m))); }, close() {} };
  return cx;
}
const cache = new Map();
function vuelta(a, de) {          // la conexión que ve «a», apuntando a «de» (siempre la misma)
  const k = ids.get(a) + ">" + ids.get(de);
  if (!cache.has(k)) cache.set(k, conexion(a, de));
  return cache.get(k);
}
for (const j of [H, A, B]) {
  j.MP.activo = true; j.MP.nombre = nombres.get(j); j.MP.peer = { id: ids.get(j) };
  j.MP.anfitrion = j === H;
  j.resetRun("scout"); j.buildLevel("0", 7);
  j.G.running = true; j.G.paused = false; j.G.dead = false; j.G.grace = 0;
}
H.MP.conexiones = [vuelta(H, A), vuelta(H, B)];
A.MP.conexiones = [vuelta(A, H)];
B.MP.conexiones = [vuelta(B, H)];
const hola = j => j.mpEnviar({ t: "hola", nombre: j.MP.nombre, ch: "scout", sk: "base" });
hola(H); hola(A); hola(B);
const pasos = (n, dt) => { for (let i = 0; i < n; i++) for (const j of [H, A, B]) j.updateGhosts(dt || 0.1); };
pasos(3);

console.log("── LA SALA ──");
c.ok(Object.keys(A.MP.otros).includes(ids.get(B)) && Object.keys(B.MP.otros).includes(ids.get(A)),
  "los dos invitados se ven entre sí (el anfitrión reenvía; antes cada uno sólo veía al anfitrión)");
c.ok(Object.keys(H.MP.otros).length === 2, "el anfitrión ve a los dos");
H.mpElegirModo("random");
c.ok(A.MP.modo === "random" && B.MP.modo === "random", "el anfitrión elige el modo aleatorio y lo reciben todos");
A.mpElegirModo("normal");
c.ok(H.MP.modo === "random", "un invitado no puede cambiar el modo");
H.mpElegirModo("normal");

console.log("\n── CHAT ──");
let recibidoB = null;
const addB = B.MP; // (el chat se pinta en el DOM de mentira; se comprueba por el reenvío)
A.mpEnviar({ t: "chat", n: "Ana", txt: "¿alguien tiene pilas?" });
c.ok(/sendChat/.test(fuente) && /MP_REENVIA = \{hola:1, pos:1, chat:1/.test(fuente), "el chat va por la misma centralita que el resto");

console.log("\n── CAER Y QUE TE REANIMEN ──");
// Ana cae al lado de Bea
B.player.pos.set(A.player.pos.x + 1, 0, A.player.pos.z);
pasos(3);
A.die("Te alcanzó algo.");
pasos(2);
c.ok(A.G.downed === true && !A.G.dead, "con amigos, morir te deja CAÍDO en vez de muerto");
const antes = A.bodyAvg();
A.hurtPlayer(50, "x");
c.ok(A.bodyAvg() === antes, "caído no recibes más daño");
c.ok(B.MP.otros[ids.get(A)].dn === 1, "Bea ve que Ana está caída");
B.G.inv = [];
B.startRevive(B.MP.otros[ids.get(A)]);
c.ok(!B.G.reviving, "sin botiquín no se puede reanimar");
B.addItem("medkit", 1);
const ana = B.MP.otros[ids.get(A)];
ana.vx = B.player.pos.x + 0.8; ana.vz = B.player.pos.z;
B.keys[B.kb("use")] = true;
B.startRevive(ana);
for (let i = 0; i < 20 && B.G.reviving; i++) B.updateRevive(0.2);
B.keys[B.kb("use")] = false;
c.ok(A.G.downed === false && !A.G.dead, "Bea mantiene E 3 s con un botiquín y Ana se levanta (el mensaje pasa por el anfitrión)");
c.ok(!B.hasItem("medkit") && B.G.prog.rev === 1, "a Bea le cuesta el botiquín y le cuenta para el aspecto de sanitario");
c.ok(A.PARTS.every(p => A.G.body[p.id] >= 40), "Ana vuelve con al menos un 40% en cada zona");

A.die("Otra vez.");
A.updateDowned(41);
c.ok(A.G.dead === true, "si nadie te reanima en 40 s, se acaba");
A.G.dead = false; A.G.running = true; A.G.downed = false;
for (const k in A.MP.otros) A.MP.otros[k].dn = 1;
A.die("Todos caídos.");
c.ok(A.G.dead === true, "si no queda nadie en pie, no hay espera: se acaba ya");
const solo = cargar(); solo.resetRun("scout"); solo.buildLevel("0", 1); solo.G.running = true;
solo.die("x");
c.ok(solo.G.dead === true && !solo.G.downed, "en solitario, morir sigue siendo morir");

console.log("\n── BOTIQUÍN ──");
solo.G.dead = false; solo.G.running = true;
solo.PARTS.forEach(p => { solo.G.body[p.id] = 40; solo.G.bleeding[p.id] = 1; });
solo.G.inv = [{ id: "medkit", qty: 1 }];
solo.useItem("medkit");
c.ok(solo.PARTS.every(p => solo.G.body[p.id] === 70 && !solo.G.bleeding[p.id]), "usado en solitario: +30 en todas las zonas y fuera hemorragias");
c.ok(solo.ITEMS.medkit.name_en && solo.TIERS.raro.includes("medkit"), "sale en los casilleros buenos y raros, y está en los dos idiomas");

console.log("\n── ASPECTOS ──");
const S = solo.SKINS;
c.ok(S.length >= 6 && S.filter(s => s.need).length >= 5, S.length + " aspectos, " + S.filter(s => s.need).length + " que hay que ganarse");
solo.G.prog = { rand: 0, mp: 0, rev: 0, seen: {} };
c.ok(S.filter(s => s.need).every(s => !solo.skinUnlocked(s)), "al empezar, ninguno está desbloqueado");
c.ok(Math.max(...S.filter(s => s.need && s.need.rand).map(s => s.need.rand)) >= 100, "el más difícil pide superar 100 niveles o más en aleatorio");
solo.G.prog.rand = 30;
c.ok(solo.skinUnlocked(S.find(s => s.id === "hazmat")) && !solo.skinUnlocked(S.find(s => s.id === "lobby")), "con 30 niveles en aleatorio: el traje de contención sí, el del Level 0 todavía no");
solo.G.skins = { scout: "hazmat" };
c.ok(solo.skinOf("scout") === "hazmat" && solo.skinAtlas("scout", "hazmat") !== solo.skinAtlas("scout", "base"), "el aspecto elegido tiene su propio sprite");
solo.G.skins = { scout: "void" };
c.ok(solo.skinOf("scout") === "base", "uno bloqueado no se puede llevar aunque esté guardado");
c.ok(/if\(G\.randomMode\) G\.prog\.rand/.test(fuente) && /if\(MP\.activo\) G\.prog\.mp/.test(fuente), "cada nivel superado en aleatorio o con amigos cuenta");

console.log("\n── TECLAS A GUSTO ──");
solo.G.opts.keys = {};
solo.G.inv = [{ id: "almond", qty: 2 }]; solo.G.sanity = 30;
solo.setKey("drink", "h");
solo.doKeyAction("h");
c.ok(solo.G.sanity > 30, "cambiar «beber» a H: la H bebe");
const s2 = solo.G.sanity; solo.doKeyAction("q");
c.ok(solo.G.sanity === s2, "y la Q ya no");
solo.setKey("torch", "h");
c.ok(solo.kb("torch") === "h" && solo.kb("drink") === "f", "si la tecla ya era de otra acción, se intercambian");
c.ok(!/<div><kbd>W A S D<\/kbd><span data-en=" move"> moverte<\/span><\/div>\s*<div><kbd data-en="MOUSE">/.test(fuente), "la chuleta de teclas ya no está en el título (está en Ajustes → Controles)");
c.ok(/id="pauseKeys"/.test(fuente), "la de la pausa se pinta con las teclas que tengas puestas");

console.log("\n── MANDO ──");
const pad = { connected: true, id: "Mando de prueba", axes: [0, -1, 0.9, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
solo.__ctx.navigator.getGamepads = () => [pad];
solo.G.opts.pad = 1; solo.G.dead = false; solo.G.running = true; solo.G.paused = false;
const yaw0 = solo.player.yaw;
solo.pollPad(0.1);
c.ok(solo.PAD.move.y > 0.9 && solo.player.yaw !== yaw0, "stick izquierdo mueve y el derecho gira la cámara");
solo.G.inv = [{ id: "almond", qty: 2 }]; solo.G.sanity = 30; solo.setKey("drink", "q");
pad.buttons[12].pressed = true; solo.pollPad(0.1);
c.ok(solo.G.sanity > 30, "la cruceta arriba bebe, como la tecla de beber");
pad.buttons[12].pressed = false; solo.pollPad(0.1);
c.ok(solo.tag("use") === "[A]" && solo.tag("heal") === "[Y]", "al tocar el mando, los textos nombran sus botones: " + solo.tag("use") + " para usar, " + solo.tag("heal") + " para curar");
c.ok(solo.keyify("<b>{crowbar}</b>") === "<b>[→]</b>", "también dentro de las fichas de los objetos (la palanca: " + solo.keyify("{crowbar}") + ")");
solo.setInput("kb");
c.ok(solo.tag("use") === "[E]" && solo.tag("drink") === "[Q]", "y al volver al teclado vuelven las teclas (y las que hayas cambiado)");
solo.setKey("use", "k");
c.ok(solo.tag("use") === "[K]", "si cambias «usar» a K, los avisos dicen [K] (antes seguían diciendo [E])");
solo.setKey("use", "e");
const literales = (fuente.match(/"<b>\[E\]<\/b> "|\[mantén E\]|"\[C\] "|<b>\[R\]<\/b>|<b>\[V\]<\/b>|\[N\] para cerrar/g) || []);
c.ok(literales.length === 0, "ningún texto con una tecla escrita a mano" + (literales.length ? ": " + literales.join(" ") : ""));
solo.G.opts.pad = 0; solo.pollPad(0.1);
c.ok(solo.PAD.move.x === 0 && solo.PAD.move.y === 0, "con el mando desactivado en Ajustes, no hace nada");


/* ── gestos y voz por proximidad (desde 3.0.0) ── */
console.log("\n── GESTOS Y VOZ ──");
A.hacerGesto(0);
const anaEnBea = B.MP.otros[ids.get(A)];
c.ok(anaEnBea && anaEnBea.gesto && anaEnBea.gesto.pose === "wave", "Ana saluda y Bea lo ve (pasa por la centralita del anfitrión)");
c.ok((B.G.burbujas || []).some(b => b.who === anaEnBea), "con un bocadillo encima de su cabeza");
c.ok(A.G.gesto && A.G.gesto.pose === "wave" && (A.G.burbujas || []).some(b => b.who === null), "y Ana ve su propio bocadillo");
c.ok(A.GESTOS.length === 8, "hay 8 gestos: saludar, aquí, sígueme, espera, peligro, salida, gracias y vale");
const vd = A.vozDistancia;
c.ok(vd(1, true) === 1 && vd(18, true) === 0 && vd(5, true) > vd(10, true) && vd(5, false) < vd(5, true),
  "voz por proximidad: entera a 2 m, nada a 18 m, baja con la distancia y tras una pared");
A.mpEnviar({ t: "voz", on: 1 });
c.ok(B.MP.otros[ids.get(A)].voz === true && H.MP.otros[ids.get(A)].voz === true, "cuando Ana activa la voz, los demás se enteran");
c.ok(A.vozModo() === 2, "por defecto el micro va abierto: la voz funciona sin tener que mantener ninguna tecla");
c.ok(/peer\.on\("call", \(call\)=>\{ if\(mio\(\)\) vozEntrante\(call\); \}\)/.test(fuente) && /String\(mpYo\(\)\) > String\(id\)/.test(fuente),
  "entre cada pareja llama sólo el de id menor: nada de llamadas cruzadas");
c.ok(/createMediaStreamDestination/.test(fuente) && /VOZ\.micGain\.gain\.value = abierto \? 1 : 0/.test(fuente),
  "la llamada lleva siempre el mismo flujo y el micro se abre o se cierra con una ganancia");
c.ok(/n\.el\.volume = clamp\(n\.vol, 0, 1\)/.test(fuente) && !/pan\.connect\(Audio_\.master\)/.test(fuente),
  "la voz suena por un <audio> (con la cancelación de eco del navegador), no por WebAudio");
c.ok(/o\.vozElegida\)/.test(fuente), "el «pulsar Y» que se guardaba solo en versiones anteriores ya no se hereda");


/* ── la sala, la orientación del compañero y el latido (3.0.1) ── */
console.log("\n── LA SALA (3.0.1) ──");
// el compañero se ve desde TU cámara: si viene de cara, de frente
const anaB = B.MP.otros[ids.get(A)];
// (en el banco la cámara está en el origen)
anaB.x = anaB.vx = 0; anaB.z = anaB.vz = 10; anaB.yaw = Math.PI; anaB.lv = B.G.levelId + "@" + B.G.levelSeed; anaB.visto = 0;
B.updateGhosts(0.05);
c.ok(anaB.fila === 0, "si tu compañero camina hacia tu cámara, se le ve de frente (antes, siempre de espaldas)");
anaB.yaw = 0; anaB.x = anaB.vx = 0; anaB.z = anaB.vz = 10; B.updateGhosts(0.05);
c.ok(anaB.fila === 2, "si se aleja, de espaldas");
anaB.yaw = Math.PI / 2; anaB.x = anaB.vx = 0; anaB.z = anaB.vz = 10; B.updateGhosts(0.05);
c.ok(anaB.fila === 1, "y si cruza por delante, de perfil");
c.ok(/yaw:\+player\.facing\.toFixed\(2\)/.test(fuente), "cada uno manda hacia dónde mira su personaje, no su cámara");

// sin clones: un eco de uno mismo no crea otro jugador
const antesEco = Object.keys(A.MP.otros).length;
A.mpRecibir(null, { t: "hola", from: ids.get(A), nombre: "Ana", ch: "scout" });
c.ok(Object.keys(A.MP.otros).length === antesEco && !A.MP.otros[ids.get(A)], "un mensaje de uno mismo no te crea un «clon»");
let cerrada = false;
A.mpAtarConexion({ peer: ids.get(A), on() {}, close() { cerrada = true; } });
c.ok(cerrada, "y una conexión contigo mismo se cierra al momento");
c.ok(/if\(MP\.peer \|\| MP\.activo\) mpSalir\(\);/.test(fuente), "crear o entrar en una sala cierra antes la conexión que hubiera (de ahí salían los clones)");
c.ok(/\$\("mpCreate"\)\.hidden = MP\.activo; \$\("mpJoin"\)\.hidden = MP\.activo; \$\("mpLeave"\)\.hidden = !MP\.activo;/.test(fuente),
  "dentro de una sala desaparecen «Crear» y «Entrar» y sale «Salir de la sala»");

// la sala se cierra sola a los diez minutos vacía
const Sv = cargar();
Sv.MP.activo = true; Sv.MP.anfitrion = true; Sv.MP.peer = { id: "elzumbido-vacia", destroy() {} }; Sv.MP.conexiones = [];
Sv.mpVigilar(Sv.MP_VACIA_MAX - 1);
c.ok(Sv.MP.activo, "una sala vacía sigue abierta a los 9:59");
Sv.mpVigilar(2);
c.ok(!Sv.MP.activo && !Sv.MP.peer, "a los diez minutos vacía se cierra y el nombre queda libre");
const S2 = cargar();
S2.MP.activo = true; S2.MP.anfitrion = true; S2.MP.peer = { id: "elzumbido-llena", destroy() {} };
S2.MP.conexiones = [{ peer: "x", visto: Date.now(), send() {}, close() {} }];
S2.mpVigilar(S2.MP_VACIA_MAX + 5);
c.ok(S2.MP.activo, "con alguien dentro no se cierra, pasen los minutos que pasen");

// latido: si el anfitrión deja de dar señales, el invitado vuelve a jugar solo
const I = cargar();
const cxHost = { peer: "elzumbido-sala", visto: Date.now() - 20000, send() {}, close() {} };
I.MP.activo = true; I.MP.anfitrion = false; I.MP.peer = { id: "peer-invitado", destroy() {} };
I.MP.conexiones = [cxHost]; I.MP.otros = { "elzumbido-sala": { nombre: "Hugo" } };
I.mpVigilar(1);
c.ok(!I.MP.activo && !I.MP.conexiones.length, "si el anfitrión lleva 15 s sin dar señales (cerró la pestaña), el invitado sigue en solitario");

/* ── entrar en una sala (3.0.3): el servidor de salas, con un Peer de mentira ──
   Lo que fallaba en la vida real y en localhost no se ve: si el anfitrión
   pierde el hilo con el servidor la sala deja de existir para los demás; el que
   no consigue entrar se quedaba sin botón de «Entrar»; y al salir uno mismo
   salía el falso «el anfitrión ha cerrado la sala». */
console.log("\n── ENTRAR EN UNA SALA (3.0.3) ──");
class PeerFalso {
  constructor(id, opciones) {
    this.opciones = opciones || {};
    this.id = id || "invitado-" + Math.random().toString(36).slice(2, 7);
    this.h = {}; this.disconnected = false; this.destroyed = false; this.llamadas = []; this.reconexiones = 0;
    PeerFalso.todos.push(this);
  }
  on(e, f) { (this.h[e] = this.h[e] || []).push(f); }
  emit(e, x) { (this.h[e] || []).forEach(f => f(x)); }
  connect(id) { const cx = conexionFalsa(id); this.llamadas.push(id); this.ultima = cx; return cx; }
  reconnect() { this.reconexiones++; this.disconnected = false; }
  destroy() { this.destroyed = true; }
}
PeerFalso.todos = [];
function conexionFalsa(id) {
  const cx = { peer: id, h: {}, enviados: [], on(e, f) { this.h[e] = f; }, send(m) { this.enviados.push(m); },
    close() { if (this.cerrada) return; this.cerrada = true; if (this.h.close) this.h.close(); } };
  return cx;
}
// elementos de la pantalla que se conservan (el banco crea uno nuevo en cada getElementById)
function pantalla(X) {
  const doc = X.__ctx.document, cache = {};
  doc.getElementById = id => cache[id] || (cache[id] = doc.createElement("div"));
  cache.mpName = doc.getElementById("mpName"); cache.mpName.value = "Ana";
  cache.mpRoom = doc.getElementById("mpRoom"); cache.mpRoom.value = "La Sala 9";
  cache.toast = doc.getElementById("toast");
  return cache;
}
const dejar = () => new Promise(r => setImmediate(r));

(async () => {
  // 1. el anfitrión pierde el hilo con el servidor: reconecta una vez, sin abrir la sala de nuevo
  const H = cargar(); const pH = pantalla(H);
  H.__ctx.Peer = PeerFalso; H.MP.libreria = true;
  H.mpEmpezar(true); await dejar();
  const ph = PeerFalso.todos[PeerFalso.todos.length - 1];
  c.ok(ph.id === "elzumbido-la-sala-9", "«La Sala 9» se convierte en el nombre de sala elzumbido-la-sala-9");
  ph.emit("open");
  c.ok(H.MP.activo && H.MP.anfitrion && !pH.mpGoRow.hidden, "el anfitrión abre la sala");
  ph.disconnected = true; ph.emit("disconnected");
  c.ok(ph.reconexiones === 1 && /reconectando/.test(pH.mpStatus.textContent), "si pierde el hilo con el servidor, reconecta (antes la sala dejaba de existir sin que nadie lo notara)");
  ph.disconnected = true; ph.emit("disconnected");
  c.ok(ph.reconexiones === 1, "sin insistir cada milisegundo: espera unos segundos entre intentos");
  H.MP.reintento = 0; ph.disconnected = true; H.mpVigilar(1);
  c.ok(ph.reconexiones === 2, "y el vigilante de cada segundo vuelve a intentarlo si sigue sin servidor");
  ph.emit("open");
  c.ok(H.MP.activo && /vuelve a estar abierta/.test(pH.mpStatus.textContent), "al recuperarlo, la sala vuelve a estar abierta");

  // 2. el invitado: «open» al reconectar no vuelve a llamar al anfitrión
  const G2 = cargar(); const pG = pantalla(G2);
  G2.__ctx.Peer = PeerFalso; G2.MP.libreria = true;
  G2.mpEmpezar(false); await dejar();
  const pg = PeerFalso.todos[PeerFalso.todos.length - 1];
  pg.emit("open"); pg.emit("open");
  c.ok(pg.llamadas.length === 1 && pg.llamadas[0] === "elzumbido-la-sala-9", "el invitado llama al anfitrión una sola vez, aunque «open» salte otra vez al reconectar (si no, salían clones)");

  // 2b. la configuración de red: PeerJS trae TURN gratuitos que ya no existen
  const cfg = pg.opciones.config || {};
  const urls = (cfg.iceServers || []).flatMap(x => [].concat(x.urls));
  c.ok(urls.length >= 3 && urls.every(u => /^(stun|turn)s?:/.test(u)) && !urls.some(u => /peerjs\.com/.test(u)),
    "usa su propia lista de servidores y no los TURN de PeerJS, que ya no existen (" + urls.length + " servidores)");
  c.ok(urls.length <= 5, "sin pasarse de servidores: Chrome avisa de que con más de cinco se descubre más lento");
  const primero = (cfg.iceServers || [])[0] || {};
  c.ok([].concat(primero.urls).every(u => /^turns?:/.test(u)) && !!primero.username && !!primero.credential,
    "el servidor de relevo (TURN, con usuario y clave) va el primero de la lista");
  c.ok((cfg.iceServers || []).slice(1).every(x => [].concat(x.urls).every(u => /^stun:/.test(u))) && (cfg.iceServers || []).length >= 2,
    "y detrás van los STUN");
  c.ok(cfg.iceTransportPolicy === "all", "por defecto se prueba la conexión directa y, si falla, WebRTC pasa solo al relevo");
  c.ok(/iceTransportPolicy:\(MP_SOLO_RELEVO && !anfitrion\) \? "relay" : "all"/.test(fuente) && /\[\?&\]relevo/.test(fuente),
    "con «?relevo» en la dirección, el que entra (sólo él: el TURN no deja relevo contra relevo) va forzado por el servidor de relevo, para probar el TURN");

  // 3. no consigue entrar: vuelven «Crear» y «Entrar» (antes sólo salía «Salir de la sala»)
  pg.emit("error", { type: "peer-unavailable" });
  c.ok(!G2.MP.activo && !G2.MP.peer && pG.mpCreate.hidden === false && pG.mpJoin.hidden === false && pG.mpLeave.hidden === true,
    "si la sala no existe, el invitado puede volver a darle a «Entrar» sin salir antes");
  c.ok(/No hay ninguna sala/.test(pG.mpStatus.textContent), "y se le dice por qué");
  const antesPeers = PeerFalso.todos.length;
  G2.mpEmpezar(false); await dejar();
  c.ok(PeerFalso.todos.length === antesPeers + 1, "y puede intentarlo otra vez");
  PeerFalso.todos[PeerFalso.todos.length - 1].emit("open");

  // 4. una llamada de voz a alguien que ya se fue no echa a nadie de la sala
  const V = cargar(); pantalla(V);
  V.__ctx.Peer = PeerFalso; V.MP.libreria = true;
  V.mpEmpezar(false); await dejar();
  const pv = PeerFalso.todos[PeerFalso.todos.length - 1];
  pv.emit("open"); pv.ultima.h.open();
  pv.emit("error", { type: "peer-unavailable" });
  c.ok(V.MP.activo && V.MP.conexiones.length === 1, "«peer-unavailable» con la sala ya montada (una llamada de voz a alguien que se fue) no te saca de ella");

  // 5. nunca llega a abrirse: a los 15 s se rinde en vez de quedarse «Entrando…» para siempre
  const T = cargar(); const pT = pantalla(T);
  const pend = [];
  T.__ctx.setTimeout = (f, ms) => { pend.push({ f, ms }); return pend.length; };
  T.__ctx.Peer = PeerFalso; T.MP.libreria = true;
  T.mpEmpezar(false); await dejar();
  PeerFalso.todos[PeerFalso.todos.length - 1].emit("open");
  const espera = pend.find(p => p.ms === 40000), aviso = pend.find(p => p.ms === 8000);
  c.ok(!!espera && T.MP.activo, "entrar espera hasta 40 s (entre redes distintas tarda)");
  aviso.f();
  c.ok(/Sigo intentándolo/.test(pT.mpStatus.textContent), "a los 8 s avisa de que sigue intentándolo");
  espera.f();
  c.ok(!T.MP.activo && !pT.mpCreate.hidden && /No he conseguido conectar/.test(pT.mpStatus.textContent) && /routers/.test(pT.mpStatus.textContent),
    "si no abre, se rinde, vuelven los botones y se apunta a los routers como posible causa");

  // 6. una conexión que se cae sin haber llegado a abrirse no es «el anfitrión cerró la sala»
  const N = cargar(); const pN = pantalla(N);
  N.__ctx.Peer = PeerFalso; N.MP.libreria = true;
  N.mpEmpezar(false); await dejar();
  const pn = PeerFalso.todos[PeerFalso.todos.length - 1];
  pn.emit("open"); pn.ultima.h.error && pn.ultima.h.error();
  c.ok(!N.MP.activo && /No he conseguido conectar/.test(pN.mpStatus.textContent) && !/anfitri/i.test(pN.toast.textContent),
    "una conexión que falla al entrar dice que no ha podido conectar, no que el anfitrión cerró la sala");

  // 7. salir uno mismo no avisa de nada falso
  const L = cargar(); const pL = pantalla(L);
  L.__ctx.Peer = PeerFalso; L.MP.libreria = true;
  L.mpEmpezar(false); await dejar();
  const pl = PeerFalso.todos[PeerFalso.todos.length - 1];
  pl.emit("open"); pl.ultima.h.open();
  c.ok(L.MP.activo && L.MP.conexiones.length === 1, "el invitado entra en la sala");
  pL.toast.textContent = "";
  L.mpSalir();
  c.ok(!L.MP.activo && pl.destroyed && pl.ultima.cerrada && pL.toast.textContent === "",
    "salir tú mismo cierra todo sin el falso «el anfitrión ha cerrado la sala»");

  // 8. el reloj de verdad: una pestaña dormida no cierra salas ni conexiones por error
  const R = cargar(); pantalla(R);
  const cxR = { peer: "elzumbido-x", visto: Date.now() - 50000, send() {}, close() {} };
  R.MP.activo = true; R.MP.anfitrion = false; R.MP.peer = { id: "yo", destroy() {}, disconnected: false, destroyed: false };
  R.MP.conexiones = [cxR]; R.MP.otros = {};
  R.MP.tic = Date.now() - 60000;                        // el navegador la ha tenido 60 s sin dar un solo tic
  R.mpVigilar();
  c.ok(R.MP.activo && R.MP.conexiones.length === 1, "si esta pestaña ha estado dormida, no da por perdidas las conexiones (lo que no llegó es culpa suya)");
  cxR.visto = Date.now() - 20000; R.MP.tic = Date.now() - 1000;
  R.mpVigilar();
  c.ok(!R.MP.activo, "pero 15 s callada estando despierta sí");
  const E = cargar(); pantalla(E);
  E.MP.activo = true; E.MP.anfitrion = true; E.MP.peer = { id: "elzumbido-e", destroy() {}, disconnected: false, destroyed: false }; E.MP.conexiones = [];
  E.MP.tic = Date.now() - 601000;
  E.mpVigilar();
  c.ok(!E.MP.activo, "una sala vacía se cierra a los diez minutos de reloj, no de tics de temporizador");
  const Q = cargar(); pantalla(Q);
  const enviados = [];
  Q.MP.activo = true; Q.MP.anfitrion = true; Q.MP.peer = { id: "elzumbido-q", destroy() {}, disconnected: false, destroyed: false };
  Q.MP.conexiones = [{ peer: "z", visto: Date.now(), send(m) { enviados.push(m.t); }, close() {} }];
  Q.MP.tic = Date.now() - 1000; Q.mpVigilar();
  c.ok(enviados.includes("latido"), "el latido se manda por tiempo real (cada 2 s)");

  process.exit(c.resumen("el multijugador") ? 1 : 0);
})();
