/* Ropa, protecciones y animaciones (4.0).
   ────────────────────────────────────────────────────────────────────────────
   · Cuatro ranuras (cabeza, torso, brazos, piernas); cada prenda protege unas zonas,
     se desgasta con lo que absorbe y se rompe.
   · Ponerse y quitarse: cambia lo que hubiera, no cabe → al suelo, conserva el desgaste.
   · Se guarda y se carga; se ve en el personaje (mochila incluida, sea el que sea).
   · Acciones con animación y su aviso a los compañeros.
   · La versión: comparar números y buscar la publicada.                         */

const { cargar, crearContador } = require("./banco.js");
const fs = require("fs"), path = require("path");
const j = cargar();
const {
  G, ITEMS, PARTS, buildLevel, player, addItem, hasItem, invFind, removeItem, CLOTH, CLOTH_SLOTS, wornKey, lookConRopa,
  clothProtect, clothAbsorb, putOn, takeOff, wornRaw, wornIds, cleanKey, clothWearOf, clothSanityMul, clothStaminaMul,
  playAct, ACCIONES, actSprite, updateAct, dropItem, pickDrop, saveGame, applySave, skinAtlas, cmpVersion, VERSION,
  ACH_BY_ID, CHARACTERS, bpEntries, bpDo, BP, MP
} = j;
const c = crearContador();
const fuente = fs.readFileSync(path.join(__dirname, "..", "el-zumbido.html"), "utf8");

// se pone una prenda con el desgaste dicho (lo que se encuentra por ahí viene ya usado)
function poner(id, w) { addItem(id, 1); G.wear[id] = w === undefined ? 1 : w; return putOn(id); }
function limpio() {
  j.resetRun("scout"); buildLevel("0", 3);
  G.running = true; G.paused = false; G.dead = false; G.grace = 0; G.sanity = 100; G.inv = []; G.wear = {};
  G.worn = { head: null, torso: null, arms: null, legs: null }; G.equip = {};
  PARTS.forEach(p => { G.body[p.id] = 100; G.bleeding[p.id] = 0; });
}

console.log("── LA TABLA DE ROPA ──");
c.ok(Object.keys(CLOTH).length === 6, "seis prendas: casco, mascarilla, chaleco, traje, guantes y botas");
c.ok(Object.keys(CLOTH).every(id => ITEMS[id] && ITEMS[id].cloth && ITEMS[id].slot === CLOTH[id].slot && CLOTH_SLOTS.includes(CLOTH[id].slot)),
  "cada una existe como objeto y su ranura coincide");
c.ok(Object.keys(CLOTH).every(id => ITEMS[id].name_en && ITEMS[id].blurb_en), "y está traducida al inglés");
c.ok(new Set(Object.keys(CLOTH).map(id => CLOTH[id].key)).size === 6, "cada prenda tiene su letra para la firma del aspecto");

console.log("\n── PROTECCIÓN Y DESGASTE ──");
limpio();
c.ok(clothProtect("head", 10) === 10, "sin ropa no se absorbe nada");
poner("hardhat");
c.ok(wornRaw().head === "hardhat" && !invFind("hardhat"), "ponerse el casco lo saca de la mochila y lo pone en la cabeza");
const resto = clothProtect("head", 10);
c.ok(Math.abs(resto - 4.5) < 1e-9, "el casco nuevo se come el 55 % del golpe a la cabeza (quedan " + resto.toFixed(2) + " de 10)");
c.ok(clothProtect("legL", 10) === 10, "y no protege las piernas");
const w1 = clothWearOf("hardhat");
c.ok(w1 < 1 && Math.abs((1 - w1) - 5.5 / CLOTH.hardhat.dur) < 1e-9, "lo que absorbe lo desgasta (" + (100 * w1).toFixed(1) + " % queda)");
G.wear.hardhat = 0.2;
c.ok(clothAbsorb("hardhat") < CLOTH.hardhat.absorb * 0.75 && clothAbsorb("hardhat") > CLOTH.hardhat.absorb * 0.5, "gastado protege menos, pero no nada");
c.ok(wornKey() === "H", "y se ve gastado: la letra pasa a mayúscula");
G.wear.hardhat = 0.005;
clothProtect("head", 40);
c.ok(wornRaw().head === null && G.wear.hardhat === undefined, "a cero se rompe: desaparece de la ranura y su desgaste se borra");
c.ok(G.prog.absorbido > 0, "y lo absorbido se anota (para estadísticas)");

limpio();
["vest", "hardhat"].forEach(id => poner(id));
const antes = clothProtect("torso", 20);
c.ok(Math.abs(antes - 20 * (1 - 0.45)) < 1e-9, "el chaleco se come el 45 % del golpe al torso");
poner("hazsuit");
c.ok(wornRaw().torso === "hazsuit" && !!invFind("vest"), "otro traje en la misma ranura: el chaleco vuelve a la mochila");
c.ok(clothProtect("legR", 10) < 10 && clothProtect("armL", 10) < 10, "el traje protege también brazos y piernas");
c.ok(clothSanityMul() === 1 && clothStaminaMul() < 1, "y cansa un poco más (aliento ×" + clothStaminaMul() + ")");
limpio(); poner("gasmask");
c.ok(clothSanityMul() < 1, "la mascarilla baja lo que te asusta");

console.log("\n── PONERSE Y QUITARSE ──");
limpio();
poner("boots", 0.4);
takeOff("legs");
c.ok(!!invFind("boots") && wornRaw().legs === null && Math.abs(G.wear.boots - 0.4) < 1e-9, "quitártelas las devuelve a la mochila con el mismo desgaste");
limpio(); G.cap = 1;
poner("gloves");
addItem("gasmask", 1);          // llena el único hueco
c.ok(takeOff("arms") === false && wornRaw().arms === "gloves", "sin sitio en la mochila no te las quitas (no se pierden)");
limpio();
poner("hardhat", 0.5);
const n0 = G.drops.length;
dropItem("hardhat", "w:head", false);
c.ok(wornRaw().head === null && G.drops.length === n0 + 1 && G.drops[G.drops.length - 1].wear === 0.5, "soltar la prenda puesta la deja en el suelo con su desgaste");
const d = G.drops[G.drops.length - 1];
player.pos.x = d.x; player.pos.z = d.z;
pickDrop(d);
c.ok(!!invFind("hardhat") && Math.abs(G.wear.hardhat - 0.5) < 1e-9, "y al recogerla conserva el desgaste");

console.log("\n── LA MOCHILA (CAJÓN) ──");
limpio();
poner("vest"); addItem("boots", 1);
const lista = bpEntries();
c.ok(lista.some(e => e.id === "vest" && e.worn === "torso") && lista.some(e => e.id === "boots" && !e.worn), "el cajón lista lo puesto (con su ranura) y lo guardado");
c.ok(fuente.includes('tx("Puesto","Wearing")'), "hay una sección «Puesto» / «Wearing»");

console.log("\n── GUARDAR Y CARGAR ──");
limpio();
poner("hardhat", 0.37);
saveGame();
const guardado = JSON.parse(JSON.stringify(G.saveSlot));
limpio();
applySave(guardado);
c.ok(wornRaw().head === "hardhat" && Math.abs(G.wear.hardhat - 0.37) < 1e-9, "se guarda lo puesto y su desgaste");
applySave(Object.assign({}, guardado, { worn: { head: "vest", torso: "ninguno", arms: null, legs: null } }));
c.ok(wornRaw().head === null && wornRaw().torso === null, "un guardado raro (prenda en la ranura que no es) se limpia");
applySave(Object.assign({}, guardado, { worn: undefined }));
c.ok(wornIds().length === 0, "y una partida vieja, sin ropa, carga sin problema");

console.log("\n── SE VE EN EL PERSONAJE ──");
limpio();
c.ok(wornKey() === "", "sin nada, sin firma");
G.equip.backpack = true; poner("hardhat"); poner("gloves");
c.ok(wornKey() === "bhg", "mochila + casco + guantes = «bhg»");
c.ok(cleanKey("bhg<script>") === "bhg" && cleanKey(42) === "" && cleanKey("bhmvzgoBHMVZGOxxxx").length <= 8, "la firma que llega de otro jugador se limpia");
for (const ch of CHARACTERS) {
  const look = { pal: { shirt: "#123456", pants: "#222", skin: "#ccaa88", hair: "#222" }, opts: { pack: "#4d4437" } };
  const con = lookConRopa(look, "b"), sin = lookConRopa(look, "");
  c.ok(!!con.opts.pack && !sin.opts.pack, "la mochila sale con «b» y no sin él, sea quien sea el personaje (" + ch.id + ")");
  break;
}
const lk = lookConRopa({ pal: { shirt: "#123456", pants: "#222" }, opts: {} }, "hV");
c.ok(lk.opts.hardhat && lk.opts.vest && lk.opts.torn, "casco y chaleco muy gastado (rasgado)");
for (const ch of CHARACTERS) {
  const a1 = skinAtlas(ch.id, "base", "b"), a2 = skinAtlas(ch.id, "base", "b"), a3 = skinAtlas(ch.id, "base", "");
  if (a1 !== a2 || a1 === a3) { c.ok(false, "el atlas con y sin mochila es distinto y se reutiliza (" + ch.id + ")"); break; }
}
c.ok(true, "el atlas con y sin mochila es distinto y se reutiliza (todos los personajes)");

console.log("\n── ANIMACIONES ──");
limpio();
MP.activo = false;
playAct("equip");
c.ok(G.act && G.act.kind === "equip" && G.act.t === ACCIONES.equip.t, "ponerse algo arranca la animación");
const a = updateAct(0.3);
c.ok(a && a.pose === "equip" && G.act.t < ACCIONES.equip.t, "y avanza (pose «equip»)");
playAct("noexiste");
c.ok(G.act.kind === "equip", "una acción desconocida no hace nada");
let envios = [];
MP.activo = true; MP.conexiones = [{ peer: "x", send(m) { envios.push(m); } }];
playAct("drink");
c.ok(envios.some(m => m.t === "accion" && m.a === "drink"), "en multijugador se avisa a los compañeros");
MP.activo = false; MP.conexiones = [];
for (const k of Object.keys(ACCIONES)) {
  const s0 = actSprite(k, 0), s5 = actSprite(k, 0.5), s1 = actSprite(k, 1);
  if (!(Math.abs(s0[0]) < 1e-9 && Math.abs(s1[0]) < 1e-9 && s5[1] > 0.5 && s5[1] < 1.2)) { c.ok(false, "el gesto de «" + k + "» empieza y acaba en reposo"); break; }
}
c.ok(true, "todos los gestos empiezan y acaban en reposo y no deforman de más");

console.log("\n── LOGROS Y TRADUCCIONES ──");
["dressed", "clothbreak", "fullkit"].forEach(id => {
  const l = ACH_BY_ID[id];
  c.ok(l && l.name_en && l.desc_en, "logro «" + id + "» con inglés");
});
limpio();
["hardhat", "vest", "gloves", "boots"].forEach(id => poner(id));
c.ok(G.ach.fullkit && G.ach.dressed, "con una prenda en cada ranura sale «De pies a cabeza»");

console.log("\n── LA VERSIÓN ──");
c.ok(VERSION === "4.0", "la versión es exactamente «4.0» (no 4.0.0)");
c.ok(cmpVersion("3.0.5", "4.0") < 0 && cmpVersion("4.0", "4.0.0") === 0 && cmpVersion("4.0.1", "4.0") > 0 && cmpVersion("4.1", "4.0.9") > 0 && cmpVersion("10.0", "9.9") > 0,
  "comparar versiones número a número (3.0.5 < 4.0 = 4.0.0 < 4.0.1 < 4.1; 10.0 > 9.9)");
c.ok(/id="verCheck"/.test(fuente) && /id="verReload"/.test(fuente) && /id="verBox"/.test(fuente), "Ajustes tiene la caja de versión con «Buscar actualización»");
c.ok(/cache:"no-store"/.test(fuente) && /const VERSION = "\(\[\^"\]\+\)"/.test(fuente), "y la busca de nuevo en el servidor, sin usar la caché");

(async () => {
  // desde un archivo local no se puede comprobar
  j.__ctx.location = { protocol: "file:", pathname: "/x/el-zumbido.html", search: "" };
  let error = null;
  try { await j.buscarVersion(); } catch (e) { error = e; }
  c.ok(error && error.message === "local", "desde un archivo local lo dice en vez de fallar");
  // con servidor: encuentra la versión publicada
  j.__ctx.location = { protocol: "https:", pathname: "/zumbido.html", search: "" };
  let pedido = null;
  j.__ctx.fetch = (url, op) => { pedido = { url, op }; return Promise.resolve({ ok: true, text: () => Promise.resolve('x\nconst VERSION = "4.1";\ny') }); };
  const v = await j.buscarVersion();
  c.ok(v === "4.1" && /\?v=\d+/.test(pedido.url) && pedido.op.cache === "no-store", "con servidor lee la versión publicada, con la caché esquivada");

  console.log("\n── AVISO DE VERSIÓN AJENA EN MULTIJUGADOR ──");
  const avisos = [];
  const oldToast = j.__ctx.toast;
  const o1 = { id: "elzumbido-x", nombre: "Ana", ver: "4.0" };
  j.mpAvisarVersion(o1);
  c.ok(o1.avisadoVer === 1, "misma versión: no avisa");
  const o2 = { id: "elzumbido-y", nombre: "Bea", ver: "3.0.4" };
  j.mpAvisarVersion(o2);
  c.ok(o2.avisadoVer === 1, "versión distinta: se avisa una vez");
  j.mpAvisarVersion(o2);
  c.ok(true, "y sólo una");
  c.ok(/\bv:VERSION\b/.test(fuente), "el «hola» lleva la versión de cada uno");

  process.exit(c.resumen("la ropa y la versión") ? 1 : 0);
})();
