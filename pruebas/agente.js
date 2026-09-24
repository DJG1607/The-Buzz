/* Agente del M.E.G. (desde 3.0.0): el modo de las misiones.
   ────────────────────────────────────────────────────────────────────────────
   Se empieza en la Base Beta, se cogen encargos en el tablón de una base, se
   cumplen por los niveles y se cobran en una base: fichas, un objeto, y al
   acumular misiones, trajes que sólo salen aquí. Aquí se prueba cada tipo
   de encargo de principio a fin con la lógica real del juego.            */

const { cargar, crearContador } = require("./banco.js");
const j = cargar();
const { G, CAT, SKINS, ITEMS, buildLevel, player } = j;
const c = crearContador();

function base(id, semilla){ buildLevel(id, semilla || 3); G.running = true; G.paused = false; G.dead = false; G.grab = null; }
j.resetRun("scout");
G.megMode = true; G.meg = { q:null, ofertas:[] }; G.prog = { rand:0, mp:0, rev:0, seen:{} };
G.cap = 10;

console.log("── EL TABLÓN ──");
base("beta");
c.ok(!!G.megBoard, "en la Base Beta hay un tablón de misiones");
player.pos.x = G.megBoard.x; player.pos.z = G.megBoard.z;
const f = j.nearestFocus();
c.ok(f && f.kind === "board", "al acercarte, [E] abre el tablón");
base("11.2");
c.ok(!!G.megBoard, "también en la Base Omicron (Level 11.2), que es nueva");
base("1");
c.ok(!G.megBoard, "en un nivel normal no hay tablón");
j.megOfertas();
c.ok(G.meg.ofertas.length === 3 && new Set(G.meg.ofertas.map(q => q.tipo)).size === 3, "el tablón ofrece 3 encargos distintos");
const tipos = Object.keys(j.MEG_TIPOS);
c.ok(tipos.length === 8 && tipos.every(t => j.megTexto(j.megNueva(t)).length > 20), "8 tipos de encargo, todos con su explicación: " + tipos.join(", "));
const cercanos = j.megCercanos();
c.ok(cercanos.length > 5 && cercanos.every(id => CAT.find(l => l.id === id && !l.settlement)), "las expediciones van a niveles a uno o dos saltos de una base (" + cercanos.length + ")");

console.log("\n── DE PRINCIPIO A FIN ──");
function aceptar(tipo, ajuste){
  base("beta");
  const q = j.megNueva(tipo); if(ajuste) ajuste(q);
  G.meg.ofertas = [q]; j.megAceptar(0);
  return G.meg.q;
}
function cobrar(){ base("beta"); const f0 = G.prog.fichas || 0, q = G.meg.q; j.megCobrar(); return (G.prog.fichas || 0) - f0 === q.fichas || (G.prog.fichas || 0) - f0 === q.fichas + 15; }

let q = aceptar("explore", q => q.need = 2);
base("1", 5); base("1", 6);
c.ok(q.have === 1 && !q.done, "Reconocimiento: volver al mismo nivel no cuenta dos veces");
base("2", 5);
c.ok(q.done, "…y al pisar un segundo nivel distinto, cumplida");
c.ok(cobrar() && G.prog.meg === 1 && !G.meg.q && G.meg.ofertas.length === 3, "se cobra en la base: fichas, +1 misión y encargos nuevos");
c.ok(G.ach.meg1, "logro: la primera misión");

q = aceptar("catalog", q => q.target = "hound");
c.ok(G.equip.megcamera, "Documentación: si no tienes cámara, te la dan al aceptar");
j.megEvent("photo", "smiler");
c.ok(!q.done, "fotografiar otra entidad no vale");
j.megEvent("photo", "hound");
c.ok(q.done && cobrar(), "fotografiar la que piden la cumple");

q = aceptar("beacons");
c.ok(j.hasItem("megbeacon"), "Balizamiento: te dan las balizas");
base("1", 7);
player.pos.x = 0; player.pos.z = 0; j.placeBeacon();
player.pos.x = 5; j.placeBeacon();
c.ok(!q.done, "dos balizas juntas no valen");
player.pos.x = 40; j.placeBeacon();
c.ok(q.done && cobrar(), "a más de 25 m una de otra, sí");

q = aceptar("stun", q => q.need = 3);
for(let i=0;i<3;i++) j.megEvent("stun");
c.ok(q.done && cobrar(), "Contención: aturdir las entidades que pide");

q = aceptar("fetch");
base("1", 8);
c.ok(G.megObj && G.megObj.tipo === "fetch", "Recuperación: el maletín aparece en el siguiente nivel");
const lejos = Math.hypot(G.megObj.x - player.pos.x, G.megObj.z - player.pos.z);
c.ok(lejos > 8, "lejos de donde apareces (" + lejos.toFixed(0) + " m)");
j.megPick(G.megObj);
c.ok(q.done && !G.megObj && cobrar(), "al recogerlo, cumplida");

q = aceptar("rescue");
base("2", 8);
c.ok(G.megObj && G.megObj.tipo === "rescue", "Rescate: el explorador perdido está en el siguiente nivel");
j.megPick(G.megObj);
c.ok(q.done && cobrar(), "encontrarlo la cumple");

q = aceptar("reach", q => q.target = "6.1");
base("6.1", 2);
c.ok(q.done && cobrar(), "Expedición: llegar al nivel que piden");

q = aceptar("supply", q => { q.item = "almond"; q.need = 2; });
j.addItem("almond", 2);
j.megEntregar();
c.ok(!G.meg.q && !j.hasItem("almond"), "Suministros: se entregan en el tablón y se cobran al momento");

console.log("\n── FICHAS, INTENDENCIA Y TRAJES ──");
G.prog.fichas = 100;
j.megComprar({ id:"megradio", precio:40 });
c.ok(G.prog.fichas === 60 && j.hasItem("megradio"), "en la intendencia se compra con fichas (radio: 40)");
G.prog.fichas = 10;
const antes = j.hasItem("medkit");
j.megComprar({ id:"medkit", precio:30 });
c.ok(G.prog.fichas === 10 && j.hasItem("medkit") === antes, "sin fichas suficientes no se compra");
const trajes = SKINS.filter(s => s.need && s.need.meg);
c.ok(trajes.length === 4, "4 trajes exclusivos: " + trajes.map(s => s.es).join(", "));
G.prog.meg = 9;
c.ok(trajes.filter(s => j.skinUnlocked(s)).length === 3 && !j.skinUnlocked(j.SKIN_BY.meg_elite), "se desbloquean por misiones cumplidas (con 9: tres de cuatro)");
c.ok(ITEMS.megradio.meg && ITEMS.megcamera.meg && ITEMS.megbeacon.meg, "los tres objetos del modo: radio, cámara y balizas");

console.log("\n── SE GUARDA ──");
q = aceptar("stun", q => q.need = 4);
j.megEvent("stun");
base("beta");
j.saveGame();
c.ok(G.saveSlot && G.saveSlot.megMode && G.saveSlot.meg.q && G.saveSlot.meg.q.have === 1, "la partida guarda el modo y el encargo a medias");

process.exit(c.resumen("el modo Agente del M.E.G.") ? 1 : 0);
