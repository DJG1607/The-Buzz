/* Inventario y fauna (desde 1.7.0): lo que se notaba jugando.
   ────────────────────────────────────────────────────────────────────────────
   · Niveles con mucha fauna: techo de entidades, sólo unas pocas persiguen a
     la vez y los especiales ya no se encadenan (uno cada 5 s como mínimo).
   · Inventario: cada hueco es un objeto, con un máximo de unidades por objeto
     que baja con la dificultad; se puede soltar al suelo o desechar.
   · Uso rápido de objetos, curar por zonas con [N], ajustes en pestañas.
   · Salidas: nada semitransparente que tape al jugador, sin baliza, más lejos.
   · Paredes de clipping casi invisibles.                                   */

const { cargar, crearContador } = require("./banco.js");
const fs = require("fs"), path = require("path");
const j = cargar();
const {
  G, CAT, ITEMS, ENT_DEF, PARTS, DIFFS, buildLevel, player, bfs, w2c,
  addItem, hasItem, updateSpecial, stackMax, invCount, dropItem, pickDrop, slotKey,
  OPT_ROWS, OPT_TAB_OF, OPT_TABS
} = j;
const c = crearContador();
const RAPIDO = !!process.env.ZUMBIDO_RAPIDO;          // node pruebas/todo.js rapido
const fuente = fs.readFileSync(path.join(__dirname, "..", "el-zumbido.html"), "utf8");

function limpio(id, semilla) {
  buildLevel(id || "0", semilla || 1);
  G.running = true; G.paused = false; G.dead = false; G.grab = null;
  G.grace = 0; G.sanity = 100; G.spGate = 0; G.spWarn = null;
  PARTS.forEach(p => { G.body[p.id] = 100; G.bleeding[p.id] = 0; });
}

/* ── 1. niveles con mucha fauna ── */
console.log("── NIVELES CON MUCHA FAUNA ──");
let peor = 0, peorTipo = 0, dondePeor = "";
// en la rápida sólo el caso más cargado: Sin retorno, muy abajo
for (const modo of (RAPIDO ? [4] : [1, 2, 3, 4])) {
  G.opts = Object.assign({}, G.opts, { diff: modo });
  for (const depth of (RAPIDO ? [20] : [0, 8, 20])) {
    G.depth = depth;
    for (const l of CAT) {
      if (l.settlement) continue;
      limpio(l.id, 3);
      const max = DIFFS[modo].maxEnts;
      if (G.entities.length > max) { peor = Math.max(peor, G.entities.length); dondePeor = l.id + " modo " + modo; }
      const porTipo = {};
      G.entities.forEach(e => porTipo[e.type] = (porTipo[e.type] || 0) + 1);
      peorTipo = Math.max(peorTipo, ...Object.values(porTipo), 0);
    }
  }
}
G.depth = 0; G.opts = Object.assign({}, G.opts, { diff: 2 });
c.ok(peor === 0, "ningún nivel pasa del techo de su dificultad (7/10/12/14), ni a descenso 21" + (dondePeor ? ": " + dondePeor : ""));
c.ok(peorTipo <= 4, "nunca más de 4 de la misma especie (máximo visto: " + peorTipo + ")");

limpio("1", 2);
player.pos.set(G.cell * 4, 0, G.cell * 4);
G.torchOn = true; G.noise = 1;
const mk = t => ({ def: ENT_DEF[t], x: player.pos.x + 1, z: player.pos.z, r: 0.3, stun: 0, grabbed: false, spCd: 0, spWind: 0 });
const a = mk("hound"), b = mk("wretch");
updateSpecial(a, 1.0, 1 / 60);
updateSpecial(b, 1.0, 1 / 60);
c.ok(a.spWind > 0 && b.spWind === 0, "si una entidad está cargando su especial, la otra espera");
for (let i = 0; i < 200; i++) { updateSpecial(a, 1.0, 1 / 60); updateSpecial(b, 1.0, 1 / 60); }
c.ok(b.spWind === 0, "y sigue esperando mientras dura la pausa entre especiales (" + G.spGate.toFixed(1) + " s)");
G.spGate = 0;
updateSpecial(b, 1.0, 1 / 60);
c.ok(b.spWind > 0, "pasada la pausa, ya puede");
c.ok(DIFFS.slice(1).every(d => d.chasers >= 2 && d.chasers <= 4), "sólo 2-4 entidades persiguen a la vez según la dificultad; el resto ronda");
c.ok(/G\.grabImmune = 4\.0;/.test(fuente), "tras soltarte de un agarre, 4 s sin que te agarre otra (antes 2,6)");

/* ── 2. inventario ── */
console.log("\n── HUECOS POR OBJETO, MÁXIMO POR OBJETO ──");
limpio();
G.inv = []; G.cap = 4; G.equip = {}; G.weapons = { L: null, R: null };
for (let i = 0; i < 5; i++) addItem("almond", 1);
c.ok(invCount() === 1, "cinco Almond Water ocupan un solo hueco (antes, cinco)");
const maxAgua = stackMax("almond");
for (let i = 0; i < 20; i++) addItem("almond", 1);
c.ok(G.inv[0].qty === maxAgua && addItem("almond", 1) === false, "no se pasa del máximo por objeto (" + maxAgua + ")");
const maxPorModo = [1, 2, 3, 4].map(m => { G.opts = Object.assign({}, G.opts, { diff: m }); return stackMax("bandage"); });
G.opts = Object.assign({}, G.opts, { diff: 2 });
c.ok(maxPorModo[0] > maxPorModo[1] && maxPorModo[1] > maxPorModo[2] && maxPorModo[2] > maxPorModo[3] && maxPorModo[3] >= 1,
  "el máximo baja con la dificultad (vendas: " + maxPorModo.join(" · ") + ")");
addItem("bandage", 1); addItem("battery", 1); addItem("flare", 1);
c.ok(invCount() === 4 && addItem("recorder", 1) === false, "cuatro objetos distintos llenan los cuatro huecos");

console.log("\n── SOLTAR Y DESECHAR ──");
const antes = G.inv.find(s => s.id === "flare").qty;
dropItem("flare", null, false);
c.ok(!hasItem("flare") && G.drops.length === 1 && G.drops[0].qty === antes, "soltar deja el objeto en el suelo, donde estás");
pickDrop(G.drops[0]);
c.ok(hasItem("flare") && G.drops.length === 0, "y se vuelve a recoger");
const aguaAntes = G.inv.find(s => s.id === "almond").qty;
dropItem("almond", null, true);
c.ok(G.inv.find(s => s.id === "almond").qty === aguaAntes - 1 && G.drops.length === 0, "desechar quita una unidad y no deja nada en el suelo");
G.weapons = { L: "pipe", R: null };
dropItem("pipe", "L", false);
c.ok(G.weapons.L === null && G.drops.some(d => d.id === "pipe"), "un arma se suelta desde la mano");
G.equip.backpack = true; G.cap = 10;
G.inv = [1, 2, 3, 4, 5].map(i => ({ id: ["almond", "bandage", "battery", "flare", "recorder"][i - 1], qty: 1 }));
dropItem("backpack", null, false);
c.ok(G.equip.backpack === true && G.cap === 10, "la mochila no se suelta si lo que llevas no cabe en los bolsillos");

/* ── 3. uso rápido ── */
console.log("\n── USAR OBJETOS DE UNA PULSACIÓN ──");
limpio();
G.inv = [{ id: "almond", qty: 3 }]; G.sanity = 40; G.held = null;
G.opts = Object.assign({}, G.opts, { quickUse: 1 });
slotKey(0);
c.ok(G.sanity > 40 && G.inv[0].qty === 2, "con uso rápido, una pulsación ya bebe el agua");
G.opts = Object.assign({}, G.opts, { quickUse: 0 });
G.sanity = 40; slotKey(0);
const trasUna = G.sanity;
slotKey(0);
c.ok(trasUna === 40 && G.sanity > 40, "sin él, la primera la saca y la segunda la usa, como antes");
G.opts = Object.assign({}, G.opts, { quickUse: 1 });

/* ── 4. ajustes, salidas, clipping, pausa ── */
console.log("\n── AJUSTES, SALIDAS Y DETALLES ──");
c.ok(OPT_TABS.length === 4 && OPT_ROWS.every(r => OPT_TAB_OF[r.id]), "los " + OPT_ROWS.length + " ajustes están repartidos en " + OPT_TABS.length + " pestañas");
const glow = fuente.match(/const glowMat = [^\n]*/)[0];
c.ok(/depthWrite:false/.test(glow), "el brillo de las salidas no escribe profundidad (era lo que tapaba al jugador)");
c.ok(!/const beacon/.test(fuente), "sin baliza: la salida no se ve desde la otra punta del nivel");
c.ok(/color:0xd8d0ff, transparent:true, opacity:\.04/.test(fuente), "las paredes de clipping arrancan casi invisibles");
c.ok(!/pauseMapBtn/.test(fuente), "sin botón de mapa del descenso en la pausa");
let lejos = true;
for (const l of CAT.slice(0, 25)) {
  if (l.settlement) continue;
  limpio(l.id, 5);
  const { dist } = bfs(G.grid, G.n, w2c(player.pos.x), w2c(player.pos.z));
  let far = 0; for (const d of dist) if (d > far) far = d;
  for (const e of G.exits) if (dist[e.cell[1] * G.n + e.cell[0]] < far * 0.38) lejos = false;
}
c.ok(lejos, "las salidas quedan más lejos: nunca antes del 38% del recorrido");

/* ── 5. el cajón de la mochila (3.0.1) ──
   Los botones de usar, soltar y desechar no hacían nada: el panel vivía dentro
   del HUD, que tiene pointer-events:none, y los clics lo atravesaban hasta el
   juego (que lo cerraba). Lo mismo le pasaba al tablón del M.E.G., a los
   gestos y al maniquí de vitales. */
console.log("\n── EL CAJÓN DE LA MOCHILA ──");
// la regla CSS «#id{...}» del principio de una línea (no «#hud #id» ni «#id .clase»)
const cssDe = id => {
  let i = fuente.indexOf("#" + id + "{");
  while (i > 0 && fuente[i - 1] !== " " && fuente[i - 1] !== "\n") i = fuente.indexOf("#" + id + "{", i + 1);
  return i < 0 ? "" : fuente.slice(i, fuente.indexOf("}", i));
};
const sinRaton = ["backpack", "megBoard", "gestos", "healPanel", "healBtn", "bodyc"].filter(id => !/pointer-events:auto/.test(cssDe(id)));
c.ok(!sinRaton.length, "todo lo que se clica dentro del HUD pide el ratón (pointer-events:auto)" + (sinRaton.length ? ": falta en " + sinRaton.join(", ") : ""));
c.ok(/#backpack\{[^}]*transform:translateX\(104%\)/.test(fuente) && /#backpack\.open\{[^}]*transform:none/.test(fuente), "entra deslizándose por la derecha");

const { BP, bpEntries, bpDo, bpKey, bpKeyAction, toggleBackpack, invFind } = j;
limpio();
G.inv = []; G.cap = 10; G.equip = { backpack: true, flashlight: true }; G.weapons = { L: "pipe", R: null }; G.wear = { pipe: 0.8 };
addItem("almond", 1); addItem("almond", 1); addItem("bandage", 1); addItem("ducttape", 1);
G.inv.splice(2, 0, { id: "rebar", qty: 1 }); G.wear.rebar = 0.7;       // guardada: con una mano libre, addItem la empuñaría
G.sanity = 40; G.held = null;
toggleBackpack();
c.ok(j.bpOpen && BP.sel === "pipe|L", "se abre con lo primero elegido: la mano izquierda");
const orden = bpEntries().map(bpKey).join(" ");
c.ok(orden.indexOf("pipe|L") === 0 && orden.indexOf("almond|") < orden.indexOf("flashlight|"), "orden: manos, huecos y equipo (" + orden + ")");

BP.sel = "almond|"; bpDo("main");
c.ok(G.sanity > 40 && invFind("almond").qty === 1, "«Usar» bebe el agua");
bpDo("drop");
c.ok(!hasItem("almond") && G.drops.some(d => d.id === "almond"), "«Soltar» lo deja en el suelo");
c.ok(BP.sel === "bandage|", "y queda elegido el que ocupa su hueco, no el primero de todos (" + BP.sel + ")");
bpDo("trash");
c.ok(hasItem("bandage") && BP.armed === "bandage|", "«Desechar» la primera vez sólo pide confirmación");
bpDo("trash");
c.ok(!hasItem("bandage") && !G.drops.some(d => d.id === "bandage"), "la segunda lo tira del todo");
BP.sel = "ducttape|"; bpDo("trash"); BP.sel = "rebar|"; bpDo("trash");
c.ok(hasItem("ducttape") && hasItem("rebar"), "cambiar de objeto anula la confirmación pendiente");
BP.armed = "";

BP.sel = "rebar|"; bpDo("main");
c.ok(G.weapons.R === "rebar" && BP.sel === "rebar|R", "«Empuñar» pasa el arma a la mano libre y la selección la sigue");
bpDo("main");
c.ok(!G.weapons.R && invFind("rebar") && BP.sel === "rebar|", "«Guardar» la devuelve a la mochila");
BP.sel = "flashlight|"; G.torchFuel = 50; G.torchOn = false; bpDo("main");
c.ok(G.torchOn, "la linterna se enciende desde su ficha");
c.ok(j.bpMain({ id: "backpack", qty: 1, eq: true }) === null, "el equipo pasivo no tiene acción principal (la mochila, el mapa…)");

BP.sel = "pipe|L";
bpKeyAction("arrowright");
c.ok(BP.sel !== "pipe|L", "las flechas cambian de objeto");
const sel1 = BP.sel;
bpKeyAction("arrowleft");
c.ok(BP.sel === "pipe|L", "y vuelven");
c.ok(/const fl = !bpOpen;/.test(fuente), "con la mochila abierta las flechas no mueven al personaje");
BP.sel = "ducttape|"; G.wear.pipe = 0.3;
bpKeyAction("enter");
c.ok(!hasItem("ducttape") && G.wear.pipe > 0.3, "Enter hace la acción principal (la cinta arregla la tubería)");
BP.sel = "rebar|"; bpKeyAction(j.kb("drop"));
c.ok(!hasItem("rebar"), "la tecla de soltar suelta lo elegido");
bpKeyAction("escape");
c.ok(!j.bpOpen, "Esc cierra la mochila (sin pausar)");
c.ok(G.paused !== true, "…y no ha pausado");

// con mando: B abre, la cruceta elige, A usa, X suelta, Y (dos veces) desecha, B cierra
limpio();
G.inv = []; G.cap = 10; G.equip = { backpack: true }; G.weapons = { L: null, R: null };
addItem("almond", 2); addItem("bandage", 1); addItem("battery", 1);
G.sanity = 30; G.opts.pad = 1;
const pad = { connected: true, id: "Mando de prueba", axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
j.__ctx.navigator.getGamepads = () => [pad];
const pulsa = b => { pad.buttons[b].pressed = true; j.pollPad(0.05); pad.buttons[b].pressed = false; j.pollPad(0.05); };
pulsa(1);
c.ok(j.bpOpen && BP.sel === "almond|", "mando: B abre la mochila");
pulsa(0);
c.ok(G.sanity > 30 && invFind("almond").qty === 1, "A usa lo elegido");
pulsa(15);
c.ok(BP.sel === "bandage|", "la cruceta a la derecha pasa al siguiente");
pulsa(2);
c.ok(!hasItem("bandage") && G.drops.some(d => d.id === "bandage"), "X lo suelta");
pulsa(3);
c.ok(hasItem("battery") || hasItem("almond"), "Y una vez sólo avisa");
pulsa(3);
c.ok(bpEntries().length === 2, "Y otra vez lo desecha (" + bpEntries().map(bpKey).join(" ") + ")");
pulsa(1);
c.ok(!j.bpOpen, "B la cierra");
G.opts.pad = 0;

limpio();
G.inv = [{ id: "bat", qty: 1 }]; G.weapons = { L: "pipe", R: null }; G.wear = { pipe: 1, bat: 1 };
slotKey(0);
c.ok(G.weapons.R === "bat" && !invFind("bat"), "la tecla de un hueco con un arma la empuña (antes la «sacaba» y no pasaba nada)");
c.ok(/if\(bpOpen\) closeBackpack\(true\);/.test(fuente) && /closeBackpack\(true\);\s*closeHeal\(\);\s*megOpen = true;/.test(fuente),
  "abrir curar o el tablón con la mochila abierta no vuelve a capturar el ratón");
c.ok(/if\(pointerLocked && \(bpOpen \|\| healOpen \|\| megOpen\)\)/.test(fuente), "y una captura que llega tarde con un panel abierto se suelta");
c.ok(!/<b>\+34<\/b>/.test(fuente), "el Almond Water dice lo que cura de verdad (ponía +34 y daba 39)");

/* ── 6. modo pruebas: el código Konami (3.0.2) ── */
console.log("\n── MODO PRUEBAS (CÓDIGO KONAMI) ──");
const { TRUCO, trucoTecla, trucoDarTodo, trucoViajar, CHARACTERS, SKINS, charUnlocked, skinUnlocked, unlockAch, megFichas, resetRun, EQUIP_IDS } = j;
const guardado = () => j.__ctx.localStorage.getItem("zumbido.pruebas");
c.ok(!TRUCO.on, "arranca apagado");
const bloqueados = CHARACTERS.filter(ch => !charUnlocked(ch)).length + SKINS.filter(s => !skinUnlocked(s)).length;
const KON = ["arrowup","arrowup","arrowdown","arrowdown","arrowleft","arrowright","arrowleft","arrowright","b","a"];
["a", "b"].concat(KON.slice(0, 9)).forEach(k => trucoTecla(k));
c.ok(!TRUCO.on, "a medias (o con teclas de más delante) no hace nada");
trucoTecla("a");
c.ok(!TRUCO.on && TRUCO.pidiendo, "↑↑↓↓←→←→BA no lo enciende: pide la contraseña");

// el acertijo tiene que poder resolverse con sus propias pistas, en los dos idiomas.
// La llave va en base64 para no destripárselo a quien lea las pruebas.
const LLAVE = Buffer.from("YWJjaXNh", "base64").toString();
const AB = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const desVigenere = (t, llave) => { let j2 = 0; return t.replace(/[A-Z]/g, ch => AB[(AB.indexOf(ch) - AB.indexOf(llave[j2++ % llave.length].toUpperCase()) + 26) % 26]); };
const desCesar = (t, n) => t.replace(/[A-Z]/g, ch => AB[(AB.indexOf(ch) - n + 26) % 26]);
const desAtbash = t => t.replace(/[A-Z]/g, ch => AB[25 - AB.indexOf(ch)]);
const MORSE = ".- -... -.-. -.. . ..-. --. .... .. .--- -.- .-.. -- -. --- .--. --.- .-. ... - ..- ...- .-- -..- -.-- --..".split(" ");
const desMorse = t => t.split(" / ").map(w => w.split(" ").map(l => AB[MORSE.indexOf(l)]).join("")).join(" ");
const soluciones = {}, trozos = {};
for (const lengua of ["es", "en"]) {
  const pz = j.TRUCO_PIEZAS[lengua];
  const claro = [desVigenere(pz[0].c, LLAVE), desCesar(pz[1].c, 3), desAtbash(pz[2].c), desMorse(pz[3].c)];
  trozos[lengua] = claro.map(f => f.split(" ").pop());
  soluciones[lengua] = trozos[lengua].join("").toLowerCase();
  c.ok(pz.length === 4 && claro.every(f => /^[A-Z ]+$/.test(f)), "acertijo (" + lengua + "): " + claro.join(" · "));
}
c.ok(soluciones.es === soluciones.en && j.trucoHuella(soluciones.es) === j.TRUCO_HUELLA, "las cuatro piezas juntas dan la contraseña, igual en español que en inglés");
c.ok(["es", "en"].every(l => trozos[l].length === 4 && trozos[l].every(t => t.length >= 1 && t.length <= 2)) &&
  new Set(j.TRUCO_PIEZAS.es.map(pz => pz.c)).size === 4 && new Set(j.TRUCO_PIEZAS.es.map(pz => pz.p[0].split(" · ")[1].split(" ")[0])).size === 4,
  "cada pieza sólo da un trozo: hacen falta las cuatro");
c.ok(!fuente.toLowerCase().includes(LLAVE) && !fuente.toLowerCase().includes(soluciones.es), "ni la llave del Vigenère ni la contraseña están escritas en el juego");
c.ok(j.trucoProbar(soluciones.es.slice(0, 4) + "i" + soluciones.es.slice(4)) === false && !TRUCO.on && TRUCO.pidiendo,
  "bien escrita no vale: la palabra lleva la falta a posta");
c.ok(j.trucoProbar(soluciones.es) === true && TRUCO.on && !TRUCO.pidiendo && guardado() === "1", "con la buena se enciende y se queda guardado en el navegador");
c.ok(bloqueados > 0 && CHARACTERS.every(charUnlocked) && SKINS.every(skinUnlocked), "todos los personajes y trajes, también los del M.E.G. (" + bloqueados + " estaban bloqueados)");
const achAntes = Object.keys(G.ach).length;
c.ok(unlockAch("deep5") === false && Object.keys(G.ach).length === achAntes, "con él no se ganan logros");
const fichasReales = (G.prog && G.prog.fichas) || 0;
c.ok(megFichas() >= 9999, "fichas del M.E.G. sin límite…");
limpio(); G.inv = []; G.cap = 10; G.equip = { backpack: true };
j.megComprar({ id: "rations", precio: 20 });
c.ok(hasItem("rations") && ((G.prog && G.prog.fichas) || 0) === fichasReales, "…y comprar no gasta las de verdad");
resetRun("scout");
const consumibles = Object.keys(ITEMS).filter(id => !ITEMS[id].equip && !ITEMS[id].weapon);
c.ok(G.cap >= 30 && EQUIP_IDS.every(id => G.equip[id]) && ["pipe", "rebar", "bat"].every(hasItem) &&
  consumibles.every(id => invFind(id) && invFind(id).qty === stackMax(id)),
  "cada partida empieza con todo: equipo, las tres armas y " + consumibles.length + " consumibles a tope (" + G.inv.length + "/" + G.cap + " huecos)");
limpio(); G.inv = []; G.equip = {}; G.cap = 4; G.weapons = { L: null, R: null };
G.running = true; G.dead = false;
trucoDarTodo();
c.ok(G.cap >= 30 && hasItem("medkit") && hasItem("megcamera"), "«Dame todo» en plena partida");
TRUCO.god = true; G.sanity = 50;
const cuerpo = JSON.stringify(G.body);
j.hurtPlayer(80, "prueba");
c.ok(JSON.stringify(G.body) === cuerpo, "invencible: no hace daño");
j.die("prueba");
c.ok(!G.dead && G.sanity >= 60, "ni se muere (tampoco de cordura)");
TRUCO.god = false;
const hondo = G.depth; G.paused = true;
trucoViajar("37");
c.ok(G.levelId === "37" && G.depth === hondo + 1 && !G.paused, "viajar a cualquier nivel desde el mapa del descenso (del 0 al Level 37 de golpe)");
c.ok(/data-viaje=/.test(fuente) && /id="trucoRow" hidden/.test(fuente), "los botones sólo salen en la pausa con el modo encendido");
KON.forEach(k => trucoTecla(k));
c.ok(!TRUCO.on && guardado() === "0" && !CHARACTERS.every(charUnlocked), "el mismo código lo apaga y todo vuelve a estar como antes");
c.ok(!TRUCO.god, "y quita la invencibilidad");
c.ok(/const MODO_PRUEBAS = true;/.test(fuente) && /function trucoTecla\(k\)\{\s*if\(!MODO_PRUEBAS\) return false;/.test(fuente),
  "se puede quitar del juego entero con MODO_PRUEBAS = false");
c.ok(/id="trSalir"/.test(fuente) && /\$\("trSalir"\)\.addEventListener\("click", \(\)=> trucoCambiar\(false\)\)/.test(fuente), "y apagar desde la pausa");
c.ok(/if\(trucoTecla\(k\)\)\{ e\.preventDefault\(\);/.test(fuente), "la última tecla del código no se cuela en la caja de la contraseña");

process.exit(c.resumen("el inventario") ? 1 : 0);
