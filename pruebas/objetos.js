/* Comprueba el botín, los objetos y las bengalas.
   ────────────────────────────────────────────────────────────────────────────
   Tres cosas que se rompen con facilidad al tocar las tablas de botín:

     · Que un 6 salga "muerto": si ya llevas la mochila y el casillero te da
       otra, se pierde el premio. lootForRoll cambia el equipo repetido por
       algo que sí sirva.
     · Que el plano o la grabadora viajen al nivel siguiente. Los dos señalan
       una salida DEL NIVEL EN EL QUE ESTÁS, así que descendTo los borra.
     · Que la bengala alumbre menos de lo que debe. Se mide la luz que llega
       a cada distancia con la atenuación de Three.js.                       */

const fs = require("fs");
const { cargar, crearContador, JUEGO } = require("./banco.js");
const j = cargar();
const { ITEMS, TIERS, DICE, lootForRoll, G, buildLevel, player, lightFlare, updateFlares } = j;
const c = crearContador();
const src = fs.readFileSync(JUEGO, "utf8");

/* ── 1. el botín no deja premios muertos ── */
console.log("── BOTÍN SEGÚN LO QUE YA LLEVES ENCIMA ──");
const ESCENARIOS = [
  ["recién llegado, sin nada", [], "map"],
  ["con el plano ya en mano", ["map"], "map"],
  ["equipado del todo", ["map", "compass", "flashlight", "backpack"], "map"],
  ["nivel de grabadora", [], "recorder"],
  ["equipado + grabadora", ["map", "compass", "flashlight", "backpack"], "recorder"]
];
for (const [nombre, llevo, premio] of ESCENARIOS) {
  const antes = G.navPrize, equipo = Object.assign({}, G.equip);
  G.navPrize = premio;
  G.equip = {}; llevo.forEach(id => { if (ITEMS[id].equip) G.equip[id] = true; });

  const cuenta = {}; let muertos = 0, total = 0;
  for (let tirada = 1; tirada <= 6; tirada++)
    for (let i = 0; i < 3000; i++)
      for (const id of lootForRoll(tirada, Math.random)) {
        if (!ITEMS[id]) { c.fallar("objeto inventado: " + id); continue; }
        cuenta[id] = (cuenta[id] || 0) + 1; total++;
        if (ITEMS[id].equip && G.equip[id]) muertos++;   // premio que no cabe en la mochila
      }
  const reparto = Object.entries(cuenta).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => k + " " + (v * 100 / total).toFixed(0) + "%").join("  ");
  c.ok(muertos === 0, nombre.padEnd(26) + reparto + (muertos ? "   ← " + muertos + " premios muertos" : ""));

  G.navPrize = antes; G.equip = equipo;
}

const medio = DICE.filter(Boolean).reduce((a, d) => a + d.tiers.length, 0) / 6;
console.log("  media: " + medio.toFixed(2) + " objetos por contenedor");
c.ok(medio > 1.2 && medio < 2.0, "la media por contenedor es razonable (entre 1,2 y 2)");
for (const [nombre, pool] of Object.entries(TIERS))
  c.ok(pool.every(id => ITEMS[id]), "el cajón «" + nombre + "» sólo tiene objetos que existen");

/* ── 2. el dado hace caso a la dificultad ──
   Durante mucho tiempo no lo hizo: había una copia vieja de rollDice más abajo
   en el archivo que, por ser la última, pisaba a la buena y se comía el
   modificador. Esta prueba existe para que no vuelva a pasar. */
console.log("");
console.log("── EL DADO DEL CASILLERO HACE CASO A LA DIFICULTAD ──");
const { rollDice } = j;
const charAntes = G.char;
G.char = null;                                        // sin suerte de personaje
for (const [modo, nombre] of [[1, "Turista (+1)"], [2, "Vagabundo (0)"], [4, "Sin retorno (-1)"]]) {
  G.opts = Object.assign({}, G.opts, { diff: modo });
  const cuenta = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 60000; i++) cuenta[rollDice(Math.random)]++;
  const mod = j.DIFF_LV().dice;
  const reparto = cuenta.slice(1).map((v, k) => (k + 1) + ":" + (v * 100 / 60000).toFixed(0) + "%").join(" ");
  const medio = cuenta.reduce((a, v, k) => a + v * k, 0) / 60000;
  console.log("  " + nombre.padEnd(16) + reparto + "   media " + medio.toFixed(2));
  if (mod > 0) c.ok(cuenta[1] === 0, "    con +1 nunca sale un 1");
  if (mod < 0) c.ok(cuenta[6] === 0 && cuenta[1] > 60000 * 0.25, "    con -1 no salen seises y abundan los unos");
  if (mod === 0) c.ok(cuenta.slice(1).every(v => v > 60000 * 0.12), "    sin modificador, las seis caras salen");
}
G.char = charAntes;
G.opts = Object.assign({}, G.opts, { diff: 2 });

/* ── 3. el plano y la grabadora caducan al bajar de nivel ── */
console.log("\n── EL PLANO Y LA CINTA NO VIAJAN AL NIVEL SIGUIENTE ──");
const cuerpoDescend = src.match(/function descendTo\(levelId, seed\)\{([\s\S]*?)buildLevel\(/);
c.ok(!!cuerpoDescend, "encuentro el trozo de descendTo que limpia el inventario");
const limpieza = cuerpoDescend ? cuerpoDescend[1] : "";
c.ok(/delete G\.equip\.map/.test(limpieza), "borra el plano");
c.ok(/id === "recorder"/.test(limpieza) && /splice/.test(limpieza), "borra las grabadoras");
c.ok(/G\.held === "map"/.test(limpieza) && /G\.held === "recorder"/.test(limpieza),
  "también vacía la mano si llevabas uno de los dos puesto");
c.ok(!/delete G\.equip\.compass/.test(limpieza), "la brújula NO caduca: es equipo permanente");

/* ── 4. las bengalas alumbran ── */
console.log("\n── BENGALAS ──");
buildLevel("6", 3);                                  // Lights Out, donde más falta hacen
G.flares.length = 0;
player.pos.set(0, 0, 0);
lightFlare();
const f = G.flares[0];
c.ok(!!f, "se enciende");
let pico = 0;
for (let i = 0; i < 120; i++) { updateFlares(1 / 60); pico = Math.max(pico, f.light.intensity); }
console.log("  intensidad " + pico.toFixed(2) + " · alcance " + f.light.distance +
  " m · caída " + f.light.decay + " · dura " + f.life.toFixed(0) + " s");
c.ok(pico > 3.5, "es más intensa que la linterna (2,3)");
c.ok(f.light.distance >= 20, "alumbra a 20 m o más");
c.ok(!!f.halo, "tiene halo para verse desde lejos");

const brillo = (I, D, dec, d) => d >= D ? 0 : I * Math.pow(Math.max(0, 1 - Math.pow(d / D, 4)), 2) / Math.pow(Math.max(d, 0.5), dec);
for (const d of [4, 8, 12]) {
  const luz = brillo(pico, f.light.distance, f.light.decay, d);
  c.ok(luz > 0.05, "a " + d + " m todavía llega luz (" + luz.toFixed(3) + ")");
}

// varias a la vez, sin estorbarse
G.flares.length = 0;
for (let i = 0; i < 4; i++) { player.pos.set(i * 5, 0, 0); lightFlare(); }
c.ok(G.flares.length === 4, "se pueden tener cuatro encendidas");
c.ok(new Set(G.flares.map(x => x.light)).size === 4, "cada una con su luz, no comparten");
G.flares[1].life = 0.001; updateFlares(1);
c.ok(G.flares.length === 3, "al agotarse una, las otras siguen");
G.flares.forEach(x => x.life = 0.001); updateFlares(1);
c.ok(G.flares.length === 0, "se limpian todas, sin dejar restos en el nivel");

// el halo, leído del código: en el banco los materiales son un simulacro
const i = src.indexOf("// halo:");
const halo = i < 0 ? "" : src.slice(i, i + 420);
c.ok(halo.indexOf("AdditiveBlending") >= 0, "el halo es aditivo: resplandece, no es una bola opaca");
c.ok(halo.indexOf("depthWrite:false") >= 0, "el halo no tapa lo que hay detrás");

/* ── 5. todos los objetos están en los dos idiomas ── */
console.log("\n── LOS OBJETOS, EN ESPAÑOL Y EN INGLÉS ──");
for (const [id, it] of Object.entries(ITEMS))
  c.ok(!!it.name && !!it.name_en && !!it.blurb && !!it.blurb_en,
    id.padEnd(12) + it.name.padEnd(18) + (it.name_en || "← FALTA EL INGLÉS"));

process.exit(c.resumen("los objetos") ? 1 : 0);
