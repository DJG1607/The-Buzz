/* Contador de visitas (4.0): GoatCounter.
   ────────────────────────────────────────────────────────────────────────────
   Sólo cuenta en la página publicada: nunca desde un archivo local ni localhost, ni con el modo
   pruebas, ni si el jugador lo apaga en Ajustes. Se carga a demanda (no es un <script src> fijo) para
   que el juego siga arrancando sin internet.                                                    */

const { cargar, crearContador } = require("./banco.js");
const fs = require("fs"), path = require("path");
const c = crearContador();
const fuente = fs.readFileSync(path.join(__dirname, "..", "el-zumbido.html"), "utf8");

function juego(loc) {
  const j = cargar();
  j.__ctx.location = Object.assign({ protocol: "https:", hostname: "djg1607.github.io", pathname: "/The-Buzz/el-zumbido.html", search: "" }, loc || {});
  const anadidos = [];
  const crear = j.__ctx.document.createElement.bind(j.__ctx.document);
  j.__ctx.document.createElement = tag => tag === "script" ? { tag, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } } : crear(tag);
  j.__ctx.document.head = { appendChild(x) { anadidos.push(x); } };
  const eventos = [];
  j.__ctx.window.goatcounter = { count(o) { eventos.push(o); } };
  j.G.opts = Object.assign({}, j.G.opts, { stats: 1 });
  return { j, anadidos, eventos };
}

console.log("── DÓNDE CUENTA ──");
{
  const { j, anadidos } = juego();
  c.ok(j.contarOk(), "en la página publicada (https) cuenta");
  j.contarInicio();
  const s = anadidos[0];
  c.ok(anadidos.length === 1 && s.attrs["data-goatcounter"] === "https://buzzzumb.goatcounter.com/count" && /gc\.zgo\.at\/count\.js$/.test(s.src) && s.async === true,
    "carga el script de GoatCounter con el código de sitio «buzzzumb»");
  j.contarInicio();
  c.ok(anadidos.length === 1, "y sólo una vez");
}
for (const [nombre, loc] of [["un archivo local (file://)", { protocol: "file:", hostname: "" }], ["localhost", { protocol: "http:", hostname: "localhost" }],
  ["127.0.0.1", { protocol: "http:", hostname: "127.0.0.1" }], ["algo.localhost", { protocol: "http:", hostname: "algo.localhost" }]]) {
  const { j, anadidos, eventos } = juego(loc);
  j.contarInicio(); j.contar("partida");
  c.ok(!j.contarOk() && !anadidos.length && !eventos.length, "desde " + nombre + " no cuenta nada");
}
{
  const { j, anadidos, eventos } = juego();
  j.G.opts.stats = 0;
  j.contarInicio(); j.contar("partida");
  c.ok(!j.contarOk() && !anadidos.length && !eventos.length, "con «Contar mi visita» apagado no carga ni apunta nada");
}
{
  const { j, anadidos, eventos } = juego();
  j.TRUCO.on = true;
  j.contarInicio(); j.contar("partida");
  c.ok(!anadidos.length && !eventos.length, "con el modo pruebas encendido tampoco");
}

console.log("\n── QUÉ APUNTA ──");
{
  const { j, eventos } = juego();
  j.contar("partida", "Partida nueva");
  c.ok(eventos.length === 1 && eventos[0].path === "juego/partida" && eventos[0].event === true && eventos[0].title === "Partida nueva", "un evento «juego/partida» (como evento, no como visita de página)");
  const { j: k, eventos: ev2 } = juego();
  k.G.opts.lang = "es";
  k.startRun(k.CHARACTERS[0].id);
  c.ok(ev2.some(e => e.path === "juego/partida"), "empezar una partida lo apunta");
  const { j: m, eventos: ev3 } = juego();
  m.MP.activo = true; m.MP.peer = { id: "yo" };
  m.startRun(m.CHARACTERS[0].id);
  c.ok(ev3.some(e => e.path === "juego/partida-multijugador"), "y distingue la de multijugador");
  const { j: p, eventos: ev4 } = juego();
  p.__ctx.document.getElementById = () => ({ value: "Ana", hidden: false, textContent: "" });
  p.mpPublica();
  c.ok(ev4.some(e => e.path === "juego/sala-publica"), "buscar sala pública también");
  let roto = null;
  const { j: q } = juego();
  q.__ctx.window.goatcounter = { count() { throw new Error("falla GoatCounter"); } };
  try { q.contar("partida"); } catch (e) { roto = e; }
  c.ok(!roto, "si GoatCounter falla (bloqueado por un antivirus, sin internet), el juego ni se entera");
}

console.log("\n── AJUSTES Y TEXTOS ──");
{
  const { j } = juego();
  const fila = j.OPT_ROWS.find(r => r.id === "stats");
  c.ok(!!fila && fila.get() === 1 && j.OPT_TAB_OF.stats === "game", "hay una opción «Contar mi visita» en Partida, activada por defecto");
  fila.set(0);
  c.ok(j.G.opts.stats === 0 && fila.get() === 0, "se puede apagar");
  c.ok(/stats:\s+\["Contar mi visita","Count my visit"\]/.test(fuente) && /Anonymously counts that someone opened the game/.test(fuente), "con su nombre y su explicación en español e inglés");
  c.ok(!/<script[^>]+gc\.zgo\.at/.test(fuente), "el script no está fijo en el HTML: se carga a demanda y se puede apagar");
}

process.exit(c.resumen("el contador de visitas") ? 1 : 0);
