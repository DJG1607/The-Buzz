/* La prueba más básica: que el archivo sea JavaScript válido y no tenga
   definiciones repetidas.
   ────────────────────────────────────────────────────────────────────────────
   Lo de las repetidas no es manía. En JavaScript, si dos funciones se llaman
   igual, gana la última del archivo. Este juego tuvo durante meses dos
   `rollDice` y dos `lootForRoll`: la copia vieja estaba más abajo, así que era
   la que mandaba, y por eso el modificador de dado de la dificultad no hacía
   nada y los casilleros repartían premios que no cabían en la mochila. Desde
   fuera no se notaba nada raro. Esta comprobación lo caza en un segundo.   */

const fs = require("fs");
const { crearContador, JUEGO } = require("./banco.js");
const c = crearContador();

const html = fs.readFileSync(JUEGO, "utf8");

/* ── 1. ¿es JavaScript válido? ── */
const bloques = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
c.ok(bloques.length === 1, "hay un solo bloque <script> propio (" + bloques.length + ")");
const src = bloques.sort((a, b) => b.length - a.length)[0] || "";
try { new Function(src); c.ok(true, "el JavaScript compila (" + src.length.toLocaleString("es") + " caracteres)"); }
catch (e) { c.fallar("el JavaScript NO compila: " + e.message); }

/* ── 2. nada definido dos veces ── */
const lineas = src.split("\n");
const funciones = {}, constantes = {};
lineas.forEach((l, i) => {
  let m = l.match(/^function ([A-Za-z_$][\w$]*)\s*\(/);
  if (m) (funciones[m[1]] = funciones[m[1]] || []).push(i + 1);
  m = l.match(/^(?:const|let|var) ([A-Za-z_$][\w$]*)\s*=/);
  if (m) (constantes[m[1]] = constantes[m[1]] || []).push(i + 1);
});
const dupF = Object.entries(funciones).filter(([, v]) => v.length > 1);
const dupC = Object.entries(constantes).filter(([, v]) => v.length > 1);
c.ok(dupF.length === 0, dupF.length
  ? "FUNCIONES REPETIDAS (gana la última): " + dupF.map(([k, v]) => k + " en " + v.join(" y ")).join("; ")
  : Object.keys(funciones).length + " funciones, ninguna repetida");
c.ok(dupC.length === 0, dupC.length
  ? "CONSTANTES REPETIDAS: " + dupC.map(([k, v]) => k + " en " + v.join(" y ")).join("; ")
  : Object.keys(constantes).length + " constantes, ninguna repetida");

/* ── 3. lo que el archivo necesita para funcionar fuera de casa ── */
c.ok(/<meta charset="utf-8">/i.test(html),
  "declara UTF-8 (sin esto los acentos salen como «brÃºjula» según dónde se sirva)");
c.ok(/three@0\.150\.1/.test(html), "usa Three.js 0.150.1 (las versiones nuevas quitaron el build UMD)");
c.ok(!/\ssrc="(?!https:\/\/cdn\.jsdelivr)/.test(html.replace(/<script src="https:[^"]*">/g, "")),
  "no depende de ningún archivo externo: todo va dentro");

/* ── 4. la versión está puesta ── */
const ver = html.match(/const VERSION = "([^"]+)"/);
c.ok(!!ver, ver ? "versión " + ver[1] : "no encuentro const VERSION");
c.ok(/id="verTag"/.test(html) && /id="verTagOpts"/.test(html), "la versión se pinta en portada y en ajustes");

/* ── 5. el índice de secciones sigue ahí ── */
const secciones = (src.match(/═{5,}\s*[^═\s][^═]*\s*═{5,}/g) || []).length;
c.ok(secciones > 30, secciones + " secciones marcadas para poder orientarse");

process.exit(c.resumen("la sintaxis") ? 1 : 0);
