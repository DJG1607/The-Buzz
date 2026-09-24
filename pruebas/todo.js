/* Lanza todas las pruebas de una vez.
   ────────────────────────────────────────────────────────────────────────────
   Uso:  node pruebas/todo.js                 todas, completas (~11 minutos)
         node pruebas/todo.js rapido          todas, en versión corta (~1 minuto)
         node pruebas/todo.js niveles         sólo una
         node pruebas/todo.js rapido mundo    sólo una, en versión corta

   El modo rápido es para ir comprobando mientras se toca algo: hace lo mismo
   con menos semillas y menos vueltas. Antes de commitear, la completa.

   Termina con código 0 si todo está bien y 1 si algo falla, así que sirve
   igual para mirarlo a ojo que para engancharlo a cualquier automatismo.   */

const { spawnSync } = require("child_process");
const path = require("path");

const PRUEBAS = [
  ["sintaxis", "que el archivo no tenga errores de JavaScript ni definiciones repetidas"],
  ["niveles", "que los 66 niveles se puedan jugar y el grafo de saltos esté sano"],
  ["combate", "velocidades, aliento y los ataques especiales de las entidades"],
  ["objetos", "botín, dado, plano y cinta, bengalas y traducciones"],
  ["armas", "armas de mano y su desgaste, habilidades por personaje, Sin retorno sin guardar, paredes atravesables"],
  ["curacion", "curación por zona, códice que se reinicia y se ve mejor, música y ambiente"],
  ["mundo", "casilleros, especiales, fauna de la wiki, brújula, salidas, reordenamiento, modo aleatorio, idiomas"],
  ["inventario", "fauna con techo, especiales sin encadenar, inventario por huecos, soltar/desechar, uso rápido, ajustes"],
  ["multijugador", "multijugador (tres copias conectadas), botiquín y reanimar, aspectos, teclas a gusto, mando, gestos y voz"],
  ["figuras", "ropa de cada personaje y aspecto, figuras de 8 bits en 3D (vóxeles)"],
  ["agente", "modo Agente del M.E.G.: tablón, los 8 tipos de encargo, intendencia, trajes y guardado"]
];

const args = process.argv.slice(2);
const rapido = args.includes("rapido") || args.includes("rápido");
const pedida = args.find(a => a !== "rapido" && a !== "rápido");
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
  const env = Object.assign({}, process.env, rapido ? { ZUMBIDO_RAPIDO: "1" } : {});
  const r = spawnSync(process.execPath, [path.join(__dirname, nombre + ".js")], { stdio: "inherit", env });
  resultados.push([nombre, r.status === 0]);
}

console.log("\n" + "═".repeat(74));
const malas = resultados.filter(([, ok]) => !ok);
for (const [nombre, ok] of resultados) console.log("  " + (ok ? "BIEN " : "FALLA") + "  " + nombre);
console.log("  " + ((Date.now() - t0) / 1000).toFixed(0) + " s");
console.log(malas.length
  ? "\n  Falla: " + malas.map(([n]) => n).join(", ") + ". Mira más arriba qué línea."
  : "\n  Todo correcto." + (rapido ? " (versión rápida: antes de commitear, pasa la completa)" : ""));
process.exit(malas.length ? 1 : 0);
