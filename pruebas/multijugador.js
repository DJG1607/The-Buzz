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

process.exit(c.resumen("el multijugador") ? 1 : 0);
