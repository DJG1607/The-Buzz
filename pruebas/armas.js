/* Armas y habilidades (desde 1.5.0): armas de mano, habilidades por
   personaje, el modo Sin retorno sin guardado, y las paredes atravesables.
   ────────────────────────────────────────────────────────────────────────────
   Cada mecánica aquí toca un sistema que ya existía (inventario, daño, botín,
   HUD) y es fácil que un cambio en uno rompa el otro sin que se note jugando.
   Por eso cada bloque prueba la función real, no una copia recortada.        */

const { cargar, crearContador } = require("./banco.js");
const j = cargar();
const {
  G, ITEMS, hasItem, addItem, buildLevel, player,
  swingHand, updateWeapons, useAbility, updateAbility,
  CHARACTERS, resetRun, updateNoclips, saveGame, DIFF_LV
} = j;
const c = crearContador();

function limpio() {
  buildLevel("0", 1);
  G.running = true; G.paused = false; G.dead = false; G.grab = null;
}

/* ── 1. armas de mano: se reparten entre las dos manos y la tercera va a la mochila ── */
console.log("── ARMAS DE MANO ──");
limpio();
G.weapons = { L: null, R: null }; G.weaponCd = { L: 0, R: 0 };
c.ok(addItem("pipe", 1) && G.weapons.L === "pipe", "la primera arma va a la mano izquierda");
c.ok(addItem("rebar", 1) && G.weapons.R === "rebar", "la segunda va a la derecha");
c.ok(addItem("bat", 1) === true && G.weapons.L === "pipe" && G.weapons.R === "rebar" && G.inv.some(x => x.id === "bat"),
  "con las dos manos llenas, la tercera va a la mochila (antes se perdía)");
c.ok(addItem("bat", 1) === false, "y una repetida no entra dos veces");
c.ok(hasItem("pipe") && hasItem("rebar"), "hasItem() reconoce las dos armas equipadas");

const e = { def: { kind: "walker", dmg: 10 }, x: player.pos.x + 1.0, z: player.pos.z, r: 0.3, stun: 0, grabbed: false };
G.entities.push(e);
swingHand("L");
c.ok(e.stun >= ITEMS.pipe.stun - 0.01, "golpear con la izquierda aturde según su ficha (" + e.stun.toFixed(1) + ")");
c.ok(G.weaponCd.L > 0, "queda en su propio cooldown tras golpear");
const stunAntes = e.stun;
swingHand("L");
c.ok(e.stun === stunAntes, "un segundo golpe inmediato no hace nada (cooldown)");
updateWeapons(5);
swingHand("R");
// tras el primer golpe el objetivo sale empujado; puede quedar fuera de alcance de rebar (2.0 m) —
// lo que importa es que la mano derecha, con su propio cooldown, no se vio bloqueada por la izquierda
c.ok(G.weaponCd.R > 0 || G.weaponCd.R === ITEMS.rebar.cd, "la mano derecha tiene su cooldown independiente de la izquierda");

/* ── 2. una habilidad por personaje, y hace lo que dice ── */
console.log("\n── HABILIDADES POR PERSONAJE ──");
for (const ch of CHARACTERS) {
  c.ok(!!ch.ability && !!ch.ability.name && !!ch.ability.name_en && !!ch.ability.blurb && !!ch.ability.blurb_en,
    ch.id.padEnd(10) + "tiene habilidad con ficha en los dos idiomas: " + (ch.ability ? ch.ability.name : "NINGUNA"));
  c.ok(ch.ability.cd >= 60, ch.id.padEnd(10) + "recarga en " + ch.ability.cd + " s (no es instantánea)");
}

limpio(); resetRun("scout"); G.running = true;
useAbility();
c.ok(G.pulseExit > 0 && G.abilityCd > 0, "Marcos: localiza la salida y entra en cooldown");
const cdMarcos = G.abilityCd;
useAbility();
c.ok(G.abilityCd === cdMarcos, "Marcos: no se puede reactivar en cooldown");

limpio(); resetRun("scav"); G.running = true;
useAbility();
c.ok(G.lootBonus === 2, "Vera: el próximo casillero lleva +2");
const r = j.rollDice(() => 0);
c.ok(r === 4 && G.lootBonus === 0, "Vera: el bono se aplica una vez (dado " + r + ") y se gasta");

limpio(); resetRun("lazarus"); G.running = true;
// hurtPlayer() reparte el golpe a una zona al azar (rollPart), así que se
// mide sobre bodyAvg() en vez de una sola zona, y con muchos golpes pequeños
// para que la aleatoriedad se promedie.
j.PARTS.forEach(p => G.body[p.id] = 100);
let antesA = j.bodyAvg();
for (let i = 0; i < 40; i++) j.hurtPlayer(2, "x");
const sinEscudo = antesA - j.bodyAvg();
j.PARTS.forEach(p => G.body[p.id] = 100);
useAbility();
c.ok(G.shield > 0, "Lázaro: el escudo queda activo");
let antesB = j.bodyAvg();
for (let i = 0; i < 40; i++) j.hurtPlayer(2, "x");
const conEscudo = antesB - j.bodyAvg();
c.ok(conEscudo < sinEscudo * 0.65, "Lázaro: con el escudo 40 golpes iguales hacen menos daño en total (" + sinEscudo.toFixed(1) + " → " + conEscudo.toFixed(1) + ")");

limpio(); resetRun("coach"); G.running = true;
const cerca = { def: { kind: "walker", dmg: 10 }, x: player.pos.x + 3, z: player.pos.z, r: .3, stun: 0, grabbed: false };
const lejos = { def: { kind: "walker", dmg: 10 }, x: player.pos.x + 20, z: player.pos.z, r: .3, stun: 0, grabbed: false };
G.entities.push(cerca, lejos);
useAbility();
c.ok(cerca.stun > 0 && lejos.stun === 0, "El Entrenador: aturde lo cercano y no lo lejano");

/* ── 3. Sin retorno no permite guardar ── */
console.log("\n── SIN RETORNO NO SE GUARDA ──");
limpio();
G.opts = Object.assign({}, G.opts, { diff: 4 });
c.ok(DIFF_LV().noSave === true, "el campo noSave está activo en Sin retorno");
c.ok(saveGame() === false, "saveGame() se niega en Sin retorno");
G.opts = Object.assign({}, G.opts, { diff: 2 });
c.ok(DIFF_LV().noSave === false, "Vagabundo sí permite guardar (noSave false)");
c.ok(saveGame() === true, "saveGame() funciona en Vagabundo");

/* ── 4. paredes atravesables: se generan en pares y teleportan ── */
console.log("\n── PAREDES ATRAVESABLES ──");
let conPar = 0, total = 0;
for (const semilla of [1, 2, 3, 4, 5, 6, 7, 8]) {
  buildLevel("0", semilla);
  total++;
  if (G.noclips && G.noclips.length) {
    conPar++;
    for (const par of G.noclips) {
      c.ok(par.A && par.B && par.A.mesh && par.B.mesh, "cada par tiene sus dos marcadores en el mundo");
      const d = Math.hypot(par.A.x - par.B.x, par.A.z - par.B.z);
      c.ok(d > 3, "las dos paredes de un par no están pegadas (" + d.toFixed(1) + " m)");
    }
  }
}
c.ok(conPar > 0 && conPar < total, "salen en algunas semillas y no en todas (" + conPar + "/" + total + ")");

buildLevel("0", 2);
if (G.noclips && G.noclips.length) {
  const par = G.noclips[0];
  player.pos.x = par.A.x; player.pos.z = par.A.z;
  updateNoclips(1 / 60);
  const d = Math.hypot(player.pos.x - par.B.x, player.pos.z - par.B.z);
  c.ok(d < 2, "al pisar la marca A, el jugador aparece junto a la marca B (" + d.toFixed(1) + " m)");
  c.ok(par.A.cd > 0 && par.B.cd > 0, "las dos marcas quedan bloqueadas un momento para no rebotar");
} else {
  console.log("  (esta semilla no generó ningún par; probado en otras semillas arriba)");
}

process.exit(c.resumen("las armas y habilidades") ? 1 : 0);
