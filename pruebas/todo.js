/* Lanza todas las pruebas de una vez.
   ────────────────────────────────────────────────────────────────────────────
   Uso:  node pruebas/todo.js            todas
         node pruebas/todo.js niveles    sólo una

   Termina con código 0 si todo está bien y 1 si algo falla, así que sirve
   igual para mirarlo a ojo que para engancharlo a cualquier automatismo.   */

const { spawnSync } = require("child_process");
const path = require("path");

const PRUEBAS = [
  ["sintaxis", "que el archivo no tenga errores de JavaScript ni definiciones repetidas"],
  ["niveles", "que los 51 niveles se puedan jugar y el grafo de saltos esté sano"],
  ["combate", "velocidades, aliento y los ataques especiales de las entidades"],
  ["objetos", "botín, dado, plano y cinta, bengalas y traducciones"],
  ["tanda2", "armas de mano, habilidades por personaje, Sin retorno sin guardar, paredes atravesables"],
  ["tanda3", "curación por zona, códice que se reinicia y se ve mejor, música y ambiente"],
  ["tanda4", "casilleros, especiales, fauna de la wiki, brújula, salidas, reordenamiento, manos, mapa, música y sprites"],
  ["tanda5", "fauna con techo, especiales sin encadenar, inventario por huecos, soltar/desechar, uso rápido, ajustes"],
  ["tanda6", "multijugador (tres copias conectadas), botiquín y reanimar, aspectos, teclas a gusto, mando"]
];

const pedida = process.argv[2];
const lista = pedida ? PRUEBAS.filter(([n]) => n === pedida) : PRUEBAS;
if (!lista.length) {
  console.log("No existe la prueba «" + pedida + "». Hay: " + PRUEBAS.map(p => p[0]).join(", "));
  process.exit(1);
}

const t0 = Date.now();
const resultados = [];
for (const [nombre, descripcion] of lista) {
  console.log("\n" + "═".repeat(74));
  console.log("  " + nombre.toUpperCase() + " — " + descripcion);
  console.log("═".repeat(74));
  const r = spawnSync(process.execPath, [path.join(__dirname, nombre + ".js")], { stdio: "inherit" });
  resultados.push([nombre, r.status === 0]);
}

console.log("\n" + "═".repeat(74));
const malas = resultados.filter(([, ok]) => !ok);
for (const [nombre, ok] of resultados) console.log("  " + (ok ? "BIEN " : "FALLA") + "  " + nombre);
console.log("  " + ((Date.now() - t0) / 1000).toFixed(0) + " s");
console.log(malas.length
  ? "\n  Falla: " + malas.map(([n]) => n).join(", ") + ". Mira más arriba qué línea."
  : "\n  Todo correcto.");
process.exit(malas.length ? 1 : 0);
