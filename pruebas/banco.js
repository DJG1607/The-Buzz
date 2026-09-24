/* Banco de pruebas: carga el juego sin navegador.
   ────────────────────────────────────────────────────────────────────────────
   El juego necesita un navegador (DOM, canvas, WebGL, Three.js). Aquí se le
   monta uno de mentira lo bastante bueno como para que arranque y genere
   niveles, y así se puede comprobar todo desde la consola en segundos.

   Dos cosas hacen falta para que esto funcione:

   1. Three.js y el DOM son simulacros. Casi todo es un "stub" genérico: un
      objeto que responde a cualquier cosa que le pidas sin quejarse. Las
      excepciones son Vector3 y PointLight, que sí son de verdad porque hay
      pruebas que miden posiciones y luces.

   2. El juego entero vive dentro de una IIFE con try/catch, así que sus
      variables no salen fuera y los errores de arranque se los traga. Para
      verlas se inyecta una línea que las cuelga de window.__t, y para
      enterarse de un fallo de arranque se mira window.__zerr.

   Uso:  const { cargar } = require("./banco.js");
         const j = cargar();          // j.CAT, j.G, j.buildLevel, ...        */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const JUEGO = path.join(__dirname, "..", "el-zumbido.html");

// Lo que se saca de dentro de la IIFE para poder probarlo
const EXPORTA = [
  "CAT", "G", "buildLevel", "bfs", "player", "w2c", "c2w",
  "ENT_DEF", "entitySpecial", "updateSpecial", "PARTS", "bodyAvg",
  "ITEMS", "TIERS", "DICE", "lootForRoll", "txf", "tx", "DIFFS",
  "hurtPlayer", "VERSION", "ACHIEVEMENTS", "lightFlare", "updateFlares", "hasItem", "addItem", "rollDice", "DIFF_LV", "swingHand", "updateWeapons", "useAbility", "updateAbility", "CHARACTERS", "resetRun", "updateNoclips", "saveGame", "bandagePart", "healBodyPart", "wipeProgress", "useItem", "renderCodex", "entityIcon", "itemIconCanvas", "codexSeeEnt", "codexSeeItem", "ENT_DEF",
  "musicModeFor", "ambientFlavorFor", "updateAmbient", "applyLevelAudio", "beginPlay", "pauseGame", "resumeGame", "toTitle", "die", "MUSIC_MODES", "Audio_",
  "openContainer", "takeLeftovers", "weaponClick", "cancelSpecial", "compassSignal", "compassBand",
  "startCrossing", "updateCrossing", "keys", "CROSS_TIME", "shiftMaze", "SHIFT_SPARE",
  "musicSource", "melodyFor", "updateMusic", "MEL_SCALES", "refineSprite", "ICON_TEX", "ICON_PX", "REFINE",
  "dmLayers", "renderDescentMap", "dmSelect", "qualityRatio", "bumpMul", "instantiate", "randomLevelId", "levelTitle",
  "stackMax", "invCount", "dropItem", "pickDrop", "slotKey", "OPT_ROWS", "OPT_TAB_OF", "OPT_TABS",
  "MP", "mpRecibir", "mpEnviar", "updateGhosts", "goDown", "reviveMe", "startRevive", "updateRevive", "updateDowned",
  "mpAlguienVivo", "mpElegirModo", "SKINS", "skinUnlocked", "skinAtlas", "skinOf", "checkSkins", "kb", "setKey",
  "doKeyAction", "ACTIONS", "PAD", "pollPad", "startRun", "btn", "tag", "setInput", "keyify", "skinLook", "voxMeshData", "vgrid", "rigSpec", "rigTemplate", "rigPose", "rigAnimate", "makeActor", "setFrame", "billboard", "RIG_KIND", "ROPA", "SPRITES", "voxOn", "isRig", "actorDown", "GEAR", "ENT_LOOK", "gaitPose", "finishHD", "drawPerson"
].join(", ");

/* Stub genérico: devuelve otro stub para cualquier propiedad, y se puede
   llamar y construir. Así Three.js entero funciona sin implementarlo. */
function stub(nombre) {
  const f = function () { return stub(nombre + "()"); };
  const cache = new Map();
  return new Proxy(f, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === "then") return undefined;          // que no lo tomen por promesa
      if (k === "length" || k === "count") return 0;
      if (typeof k === "symbol") return undefined;
      if (["x", "y", "z", "w", "intensity", "opacity", "distance"].includes(k)) return 0;
      if (!cache.has(k)) cache.set(k, stub(nombre + "." + String(k)));
      return cache.get(k);
    },
    set() { return true; },
    apply() { return stub(nombre + "()"); },
    construct() { return stub("new " + nombre); },
    has() { return true; }
  });
}

/* Contexto 2D de canvas: las texturas se pintan aquí, pero como no hace falta
   ver el resultado, cualquier método que no esté listado es un no-op. */
function ctx2d() {
  const base = {
    canvas: { width: 384, height: 384 },
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createConicGradient: () => ({ addColorStop() {} }),
    createPattern: () => ({ setTransform() {} }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, Math.abs(w * h * 4) || 4)), width: w, height: h }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(4, Math.abs(w * h * 4) || 4)), width: w, height: h }),
    measureText: () => ({ width: 10, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 }),
    isPointInPath: () => false
  };
  return new Proxy(base, {
    get(t, k) { return (k in t) ? t[k] : (typeof k === "symbol" ? undefined : function () {}); },
    set(t, k, v) { t[k] = v; return true; },
    has() { return true; }
  });
}

function elemento(etiqueta) {
  return {
    tagName: (etiqueta || "div").toUpperCase(), style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    children: [], childNodes: [], innerHTML: "", textContent: "", value: "", hidden: false,
    width: 1, height: 1, getContext: () => ctx2d(), toDataURL: () => "",
    appendChild(c) { this.children.push(c); return c; }, removeChild() {}, insertBefore() {},
    addEventListener() {}, removeEventListener() {}, setAttribute() {}, getAttribute: () => null,
    querySelector: () => elemento("div"), querySelectorAll: () => [], remove() {},
    focus() {}, blur() {}, scrollIntoView() {}, requestPointerLock() {},
    animate: () => ({ finished: Promise.resolve(), cancel() {}, onfinish: null }),
    getAnimations: () => [], closest: () => null, contains: () => false,
    insertAdjacentHTML() {}, replaceChildren() {}, cloneNode() { return elemento("div"); },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 450 }),
    get firstElementChild() { return elemento("div"); }
  };
}

// Vector3 de verdad: hay pruebas que leen player.pos
class V3 {
  constructor(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  clone() { return new V3(this.x, this.y, this.z); }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  multiplyScalar(k) { this.x *= k; this.y *= k; this.z *= k; return this; }
  length() { return Math.hypot(this.x, this.y, this.z); }
  distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
  normalize() { const l = this.length() || 1; return this.multiplyScalar(1 / l); }
  lerp() { return this; }
  applyQuaternion() { return this; }
  setFromMatrixPosition() { return this; }
}

// PointLight de verdad: hace falta para medir la luz de las bengalas
class Luz {
  constructor(color, intensidad, distancia, caida) {
    this.color = { getHex: () => color, setHex(h) { color = h; } };
    this.intensity = intensidad === undefined ? 1 : intensidad;
    this.distance = distancia || 0;
    this.decay = caida === undefined ? 2 : caida;
    this.position = new V3(); this.rotation = new V3(); this.scale = new V3(1, 1, 1);
    this.visible = true; this.userData = {}; this.children = []; this.name = "";
    this.castShadow = false;
  }
  add(o) { this.children.push(o); return this; }
  remove() { return this; }
  lookAt() {} updateMatrixWorld() {} clone() { return this; } traverse() {}
}

function cargar(ruta) {
  const archivo = ruta || JUEGO;
  const html = fs.readFileSync(archivo, "utf8");
  // el bloque <script> del juego es el más largo de los que no tienen src
  const src = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    .map(m => m[1]).sort((a, b) => b.length - a.length)[0];
  if (!src) throw new Error("no encuentro el <script> del juego en " + archivo);

  const guardado = {};
  const entorno = {
    THREE: new Proxy(stub("THREE"), {
      get(t, k) { return k === "Vector3" ? V3 : (k === "PointLight" ? Luz : Reflect.get(t, k)); },
      has: () => true
    }),
    console, Math, Date, JSON, parseInt, parseFloat, isNaN, isFinite,
    Array, Object, String, Number, Boolean, Error, Map, Set, RegExp, Promise,
    Uint8ClampedArray, Uint8Array, Float32Array, Uint16Array, Uint32Array, Int32Array, ArrayBuffer,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: () => 0, cancelAnimationFrame() {},
    performance: { now: () => 0 },
    localStorage: {
      getItem: k => (k in guardado ? guardado[k] : null),
      setItem: (k, v) => { guardado[k] = String(v); },
      removeItem: k => { delete guardado[k]; }
    },
    navigator: { userAgent: "node", language: "es" },
    location: { href: "http://localhost/", search: "" },
    AudioContext: function () { return stub("AudioContext"); },
    Image: function () { return elemento("canvas"); },
    addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true,
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1
  };
  entorno.window = entorno; entorno.globalThis = entorno; entorno.self = entorno;
  entorno.document = {
    createElement: elemento, createElementNS: elemento,
    getElementById: () => elemento("div"),
    querySelector: () => elemento("div"), querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {}, exitPointerLock() {},
    body: elemento("body"), documentElement: elemento("html"), pointerLockElement: null,
    fonts: { ready: { then() {} } }
  };

  vm.createContext(entorno);
  // se cuelga la exportación justo antes del resize() final, ya dentro de la IIFE.
  // Tiene que ser el ÚLTIMO resize(): hay otros antes (applyQuality lo llama) y
  // si se engancha en uno de ésos la exportación queda dentro de una función.
  const ult = src.lastIndexOf("resize();");
  const conSalida = ult < 0 ? src : src.slice(0, ult) +
    "window.__t = {" + EXPORTA + "};" + String.fromCharCode(10) + src.slice(ult);
  if (conSalida === src) throw new Error("no he podido inyectar la exportación (¿ha cambiado el arranque?)");

  vm.runInContext(conSalida, entorno, { filename: "el-zumbido.js" });
  if (entorno.__zerr) throw new Error("el juego peta al arrancar: " + entorno.__zerr);
  if (!entorno.__t) throw new Error("el juego cargó pero no expuso sus símbolos");
  entorno.__t.__ctx = entorno;          // para tocar el navegador de mentira (p. ej. un mando)
  return entorno.__t;
}

/* Ayudas para que las pruebas se lean igual en todos los archivos */
function crearContador() {
  let fallos = 0;
  return {
    ok(condicion, texto) {
      console.log((condicion ? "  OK    " : "  FALLO ") + texto);
      if (!condicion) fallos++;
      return condicion;
    },
    fallar(texto) { console.log("  FALLO " + texto); fallos++; },
    get fallos() { return fallos; },
    resumen(titulo) {
      console.log("\n" + (fallos ? fallos + " FALLOS en " + titulo : "SIN FALLOS en " + titulo));
      return fallos;
    }
  };
}

module.exports = { cargar, crearContador, JUEGO };
