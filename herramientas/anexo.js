/* Regenera la tabla de niveles de mapa-descenso.html desde el juego.
   ────────────────────────────────────────────────────────────────────────────
   El anexo tenía su propia copia de los niveles escrita a mano y se quedó
   desfasada (llegó a listar 21 niveles cuando el juego tenía 20). Ahora se
   genera desde `CAT`, así que no pueden divergir.

   Se ejecuta después de tocar niveles, fauna o salidas:

       node herramientas/anexo.js

   Un apunte sobre el campo `meg` del anexo: no significa "catalogado por el
   M.E.G.", significa "aquí puede aparecer un puesto donde guardar" (el punto
   verde de la esquina). Equivale a outpost >= 0.15.                        */

const fs = require("fs");
const path = require("path");

const JUEGO = path.join(__dirname, "..", "el-zumbido.html");
const ANEXO = path.join(__dirname, "..", "mapa-descenso.html");

const UMBRAL_PUESTO = 0.15;
const SIN_FAUNA = "Ninguna documentada en la base del M.E.G.";
const SIN_FAUNA_MEG = "Ninguna: territorio asegurado por el M.E.G.";

const html = fs.readFileSync(JUEGO, "utf8");
const cat = html.slice(html.indexOf("const CAT = ["), html.indexOf("const CAT_BY_ID"));
const ENT_NAMES = eval("(" + html.match(/const ENT_NAMES = (\{[\s\S]*?\n\});/)[1] + ")");

const re = /id:"([^"]+)", num:"([^"]*)", title:"([^"]+)", risk:(\d)(, settlement:true)?[\s\S]*?outpost:([\d.]+)[\s\S]*?ents:\s*\{([^}]*)\}[\s\S]*?exitsTo:\s*\[([\s\S]*?)\]/g;

const filas = [];
let m;
while ((m = re.exec(cat))) {
  const [, id, num, title, risk, settl, outpost, ents, exits] = m;
  const especies = [];
  for (const par of ents.split(",")) {
    const t = par.split(":");
    if (t.length < 2) continue;
    const clave = t[0].trim(), cuantos = parseInt(t[1], 10);
    if (!cuantos || !ENT_NAMES[clave]) continue;
    especies.push(ENT_NAMES[clave]);
  }
  const salidas = [...exits.matchAll(/to:"([^"]+)",\s*kind:"([^"]+)"/g)].map(x => [x[1], x[2]]);
  const settlement = !!settl;
  if (!especies.length) especies.push(settlement ? SIN_FAUNA_MEG : SIN_FAUNA);
  filas.push({
    id, num, title, risk: +risk, settlement,
    meg: +outpost >= UMBRAL_PUESTO,
    ents: especies, exits: salidas
  });
}
if (!filas.length) { console.log("no he podido leer el catálogo del juego"); process.exit(1); }

const anchoId = Math.max(...filas.map(f => f.id.length)) + 3;
const anchoNum = Math.max(...filas.map(f => f.num.length)) + 3;
const anchoTit = Math.max(...filas.map(f => f.title.length)) + 3;
const q = s => '"' + s + '"';

const cuerpo = filas.map(f =>
  "  {id:" + (q(f.id) + ",").padEnd(anchoId) +
  " num:" + (q(f.num) + ",").padEnd(anchoNum) +
  " title:" + (q(f.title) + ",").padEnd(anchoTit) +
  " risk:" + f.risk + ", meg:" + f.meg + (f.settlement ? ", settlement:true" : "") + "," +
  "\n   ents:[" + f.ents.map(q).join(",") + "]," +
  "\n   exits:[" + f.exits.map(e => "[" + q(e[0]) + "," + q(e[1]) + "]").join(",") + "]}"
).join(",\n");

let anexo = fs.readFileSync(ANEXO, "utf8");
const ini = anexo.indexOf("const LEVELS = [");
const fin = anexo.indexOf("\n];", ini);
if (ini < 0 || fin < 0) { console.log("no encuentro la tabla LEVELS en el anexo"); process.exit(1); }
const antes = (anexo.slice(ini, fin).match(/^  \{id:/gm) || []).length;
anexo = anexo.slice(0, ini) + "const LEVELS = [\n" + cuerpo + anexo.slice(fin);

if (!/charset/i.test(anexo)) {
  anexo = anexo.replace("<title>", '<meta charset="utf-8">\n<title>');
  console.log("  (le faltaba el meta charset, se lo he puesto)");
}
fs.writeFileSync(ANEXO, anexo);

console.log("anexo regenerado: " + antes + " → " + filas.length + " niveles · " +
  filas.filter(f => f.settlement).length + " asentamientos · " +
  filas.filter(f => f.meg).length + " con posible puesto · " +
  filas.reduce((a, f) => a + f.exits.length, 0) + " salidas");
