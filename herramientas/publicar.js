// Saca la copia que se publica: el mismo juego, pero sin el modo historia (el capítulo 1 todavía
// no sale). Pone HIST_PUBLICO a false y deja el resultado en publicar/el-zumbido.html.
// (El archivo del repositorio ya lo esconde fuera de local, p. ej. en GitHub Pages; esto es para
// publicarlo en otro sitio sin depender de dónde se abra.)
//   node herramientas/publicar.js
const fs = require("fs"), path = require("path");
const raiz = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(raiz, "el-zumbido.html"), "utf8");
const marca = /const HIST_PUBLICO = [^\n]*;/g;
const veces = (src.match(marca) || []).length;
if (veces !== 1) { console.error("No encuentro «const HIST_PUBLICO = …;» exactamente una vez (" + veces + ")."); process.exit(1); }
const out = src.replace(marca, "const HIST_PUBLICO = false;");
const dir = path.join(raiz, "publicar");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "el-zumbido.html"), out);
const v = (src.match(/const VERSION = "([^"]+)"/) || [])[1];
console.log("publicar/el-zumbido.html listo: v" + v + ", sin el modo historia (" + Math.round(out.length / 1024) + " KB).");
