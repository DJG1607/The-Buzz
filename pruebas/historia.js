/* Modo historia (5.0): capítulo 1, «Estática».
   ────────────────────────────────────────────────────────────────────────────
   · Los personajes son exclusivos: nadie de la historia sale en los otros modos, y Danny
     (el secreto) sólo se juega en el interludio.
   · Los mapas se montan, están conectados y tienen sus marcas.
   · Todo lo que se dice está en español e inglés.
   · Un «bot» juega el capítulo entero sin navegador, de la cinta del principio a la
     pantalla final, eligiendo distintas respuestas, y no se puede quedar atascado.     */

const { cargar, crearContador } = require("./banco.js");
const fs = require("fs"), path = require("path");
const c = crearContador();
const RAPIDO = !!process.env.ZUMBIDO_RAPIDO;
const fuente = fs.readFileSync(path.join(__dirname, "..", "el-zumbido.html"), "utf8");
const dejar = () => new Promise(r => setImmediate(r));

const j = cargar();
const { HIST, HIST_CAPS, HIST_MAPAS, HIST_PJ, HIST_LOOK, HIST_QUIEN, CHARACTERS, ACH_BY_ID, G } = j;
const cap = HIST_CAPS.c1;

console.log("── EL CAPÍTULO ──");
c.ok(!!cap && cap.tramos.length >= 12, "el capítulo 1 tiene " + cap.tramos.length + " tramos (puntos de control)");
c.ok(new Set(cap.tramos.map(t => t.id)).size === cap.tramos.length, "cada tramo tiene su propio nombre");
c.ok(cap.tramos[0].id === "intro" && cap.tramos[cap.tramos.length - 1].id === "final", "empieza con la cinta y acaba en el final");
c.ok(cap.tramos.every(t => t.titulo && t.titulo.es && t.titulo.en && typeof t.run === "function" && HIST_MAPAS[t.mapa]), "cada tramo tiene título en los dos idiomas, guion y mapa");
c.ok(cap.titulo.es === "Estática" && cap.titulo.en === "Static", "se llama «Estática» / «Static»");

console.log("\n── PERSONAJES PROPIOS ──");
const nombresHist = Object.keys(HIST_QUIEN).filter(k => k !== "owen").map(k => HIST_QUIEN[k].n).filter(n => n !== "???");
c.ok(!CHARACTERS.some(ch => ch.id === "danny"), "Danny, el secreto, no está en la selección de personaje");
{
  const ow = CHARACTERS.find(ch => ch.id === "owen");
  c.ok(ow && ow.locked && ow.unlockHist === "c1" && ow.ability && ow.ability.id === "nightshot" && ow.name_en && ow.blurb_en && ow.perks_en.length === ow.perks.length,
    "Owen pasa a los demás modos al acabar el capítulo 1, con su habilidad NightShot (en los dos idiomas)");
  c.ok(ACH_BY_ID.owen && ACH_BY_ID.owen.name_en, "y tiene su logro al desbloquearlo");
}
c.ok(nombresHist.every(n => !CHARACTERS.some(ch => ch.name === n || ch.name_en === n)), "ningún otro nombre de la historia coincide con un personaje de los otros modos (Owen es el único que pasa)");
c.ok(["owen", "danny", "maya", "rosa", "june", "usher", "earl"].every(k => HIST_LOOK[k] && HIST_LOOK[k].pal && HIST_LOOK[k].opts), "Owen, Danny, Maya, Rosa, June, Earl y el Acomodador tienen su aspecto");
const tramosDanny = cap.tramos.filter(t => t.pj === "danny").map(t => t.id);
c.ok(tramosDanny.length >= 2 && tramosDanny.every(id => /^danny/.test(id)), "Danny, el personaje secreto, sólo se juega en el interludio (" + tramosDanny.join(", ") + ")");
c.ok(["hist_l0", "hist_l1", "hist_danny", "hist_l2", "hist_c1", "hist_notas"].every(id => ACH_BY_ID[id] && ACH_BY_ID[id].name_en), "seis logros propios, en los dos idiomas");

console.log("\n── LOS MAPAS ──");
for (const id of Object.keys(HIST_MAPAS)) {
  const cfg = HIST_MAPAS[id];
  j.buildLevel("h:" + id, cfg.semilla || 1);
  // se abren las puertas que la historia abre; se dejan cerradas las que nunca se abren
  const nunca = ["mama", "entrada", "radiobarn"];
  Object.keys(HIST.puertas).filter(k => nunca.indexOf(k) < 0).forEach(k => j.histAbrir(k, true));
  const P = (HIST.marcas.P || [])[0];
  // todo el suelo se alcanza desde donde apareces (o subiendo y bajando escaleras), menos lo que está detrás de una puerta cerrada
  const dists = [j.bfs(G.grid, G.n, P[0], P[1]).dist];
  (cfg.escaleras || []).forEach(e => [e.a, e.b].forEach(q => dists.push(j.bfs(G.grid, G.n, Math.round(q[0]), Math.round(q[1])).dist)));
  let sueltos = 0, total = 0;
  for (let k = 0; k < G.grid.length; k++) if (G.grid[k] === 0) { total++; if (dists.every(d => d[k] < 0)) sueltos++; }
  const tras = id === "casa" ? 42 : (id === "commons" ? 12 : 0);  // el cuarto de mamá (7×6 celdas de 55 cm); la tienda de Radio Barn
  c.ok(!!P && sueltos <= tras, "«" + id + "»: se monta y se llega a todo (" + (total - sueltos) + "/" + total + " celdas; detrás de puertas: " + sueltos + ")");
}
{
  j.buildLevel("h:casa", 7);
  const marcas = Object.keys(HIST.marcas);
  c.ok(["P", "c", "k", "n", "m", "r", "F"].every(m => marcas.includes(m)), "la casa tiene sus puertas (Danny, mamá, atrás, entrada) y sus zonas");
  c.ok(["danny", "mama", "atras", "entrada", "owen", "bano"].every(k => HIST.puertas[k]) && !HIST.puertas.danny.abierta && HIST.puertas.owen.abierta, "seis puertas de verdad; la del cuarto de Danny empieza cerrada");
  c.ok(Object.values(HIST.puertas).every(P => P.ks.length === 2), "cada puerta de la casa ocupa dos celdas (1,1 m, a escala)");
  // los muebles grandes chocan: cada uno deja sus círculos de bulto en la rejilla
  const bultos = [];
  for (const k in G.obs) G.obs[k].forEach(o => bultos.push(o));
  c.ok(bultos.length > 20, "los muebles tienen bulto (" + bultos.length + " círculos)");
}

console.log("\n── LOS TEXTOS ──");
{
  const ini = fuente.indexOf("/* ═════════ CAPÍTULO 1: ESTÁTICA ═════════"), fin = fuente.indexOf("/* ═══ FIN MODO HISTORIA ═══ */");
  const guion = fuente.slice(ini, fin);
  const llamadas = [...guion.matchAll(/E\.(dice|piensa|sub|linea)\(\s*(?:"[a-z]+"|null)?\s*,?\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"/g)];
  const iguales = llamadas.filter(m => m[2] === m[3] && !/^(Maya|Owen|2025|No|Danny)[.…]?$/.test(m[2]));
  c.ok(llamadas.length > 180, "el guion tiene " + llamadas.length + " frases sueltas con su traducción (más las cintas, el buzón y las notas)");
  c.ok(iguales.length === 0, "ninguna frase está sin traducir" + (iguales.length ? " (p. ej. «" + iguales[0][2].slice(0, 40) + "»)" : ""));
  const notas = [...guion.matchAll(/(?:hNotaPared\([^()"]*(?:\([^()]*\)[^()"]*)*|nota\(\s*[0-9.]+,\s*)"([a-z0-9_]+)"/g)].map(m => m[1]).concat([...guion.matchAll(/id:"(corcho|cartel_june|cartel_danny)"/g)].map(m => m[1]));
  c.ok(new Set(notas).size === cap.notasTotal, "hay " + new Set(notas).size + " notas para leer y el final las cuenta sobre " + cap.notasTotal);
}

console.log("\n── LO NUEVO DE LA 5.0 (segunda tanda) ──");
{
  const ids = cap.tramos.map(t => t.id);
  c.ok(ids.indexOf("calle") === ids.indexOf("casa3") + 1 && ids.indexOf("nido") === ids.indexOf("l1a") + 1, "dos tramos nuevos: el paseo por Maple Street (tras la casa) y la cena en el nido (tras conocer a June)");
  c.ok(cap.tramos.length >= 17, "el capítulo tiene ahora " + cap.tramos.length + " tramos");
  // la casa, a escala real
  const casa = HIST_MAPAS.casa;
  c.ok(casa.cell < 1 && casa.grid >= 31 && casa.vanos && casa.vanos.length >= 1, "la casa va en celdas de " + casa.cell + " m, con huecos de paso con dintel");
  // primera o tercera persona
  c.ok(!j.ACTIONS.some(a => a.id === "view") && j.ACTIONS.some(a => a.id === "phone") && j.OPT_ROWS.some(r => r.id === "vista"), "primera o tercera persona se elige sólo en Ajustes; la tecla es ahora la del móvil");
  j.HIST.on = true; j.G.opts.vista = 1;
  c.ok(j.primeraPersona() && j.pitchMax() > 1 && j.pitchMin() < -1, "en primera persona se puede mirar mucho más arriba y abajo");
  j.G.opts.vista = 0;
  c.ok(!j.primeraPersona() && j.pitchMax() < 0.5, "en tercera, como siempre");
  // el cansancio: sin aliento corriendo, Owen se cae; si algo le persigue, sólo tropieza
  j.histFatigaReset();
  j.G.stamina = 0; j.player.speed = j.RUN; j.HIST.cazando = 0;
  let f = j.histFatiga(0.05);
  c.ok(f && f.quieto && f.pose === "stumble" && j.HIST.fatiga.agotado && j.HIST.fatiga.dur > 2, "sin aliento corriendo: tropieza y se cae al suelo");
  const poses = new Set();
  for (let i = 0; i < 80; i++) { f = j.histFatiga(0.05); if (f && f.pose) poses.add(f.pose); }
  c.ok(["down", "kneel", "tired"].every(p => poses.has(p)), "luego se queda en el suelo, se pone de rodillas y recupera el aliento (" + [...poses].join(", ") + ")");
  j.histFatigaReset();
  j.G.stamina = 0; j.player.speed = j.RUN; j.HIST.cazando = 1;
  f = j.histFatiga(0.05);
  c.ok(f && !f.quieto && j.HIST.fatiga.leve, "si algo le persigue sólo tropieza: no te quita el control");
  j.histFatigaReset(); j.HIST.cazando = 0; j.HIST.on = false;
  c.ok(j.FATIGA_POSE.length === 8 && j.FATIGA_ROW === 7, "una fila nueva del atlas: cansancio, tropiezo, de rodillas, hablar con las manos, brazos cruzados y la mano en la nuca");
  // voces al escribir
  c.ok(["owen", "maya", "june", "rosa", "danny", "earl"].every(k => j.HIST_VOZ[k] && j.HIST_VOZ[k].f0 > 0) && new Set(["owen", "maya", "june", "rosa", "danny", "earl"].map(k => j.HIST_VOZ[k].f0)).size === 6, "cada personaje habla con su propia «voz falsa» (tono y timbre distintos)");
}

console.log("\n── LO NUEVO DE LA 5.0 (tercera tanda) ──");
{
  // el esfuerzo: Owen se queda quieto haciendo fuerza, con su postura de la fila 8
  j.HIST.on = true; j.histFatigaReset();
  j.histEsfuerzo("levantar", 1);
  let f = j.histFatiga(0.05, true);
  c.ok(f && f.quieto && f.esfuerzo && f.row === j.ESFUERZO_ROW && f.pose === "lift", "hacer fuerza (levantar la persiana, girar válvulas…) tiene su postura y deja quieto");
  for (let i = 0; i < 30; i++) j.histFatiga(0.05, true);
  c.ok(!j.HIST.esfuerzo, "y se acaba sola");
  c.ok(j.ESFUERZO_POSE.length === 8, "fila 8 del atlas: empujar, levantar, girar, coger del suelo y secarse el sudor");
  // contener la respiración: escondido, jadeando y con algo al lado, si no te contienes te oye
  j.histFatigaReset();
  const fallos = [];
  const viejoFallo = j.HIST.fallando;
  j.HIST.enemigos = [{ x: j.player.pos.x + 2, z: j.player.pos.z, tipo: "usher", estado: "busca" }];
  j.HIST.oculto = { x: j.player.pos.x, z: j.player.pos.z, fx: 0, fz: 1 };
  j.player.cansancio = 0.8; j.HIST.inmune = true; j.HIST.flags.tut_aliento = 1;
  for (let i = 0; i < 40; i++) j.histRespiracion(0.1);
  c.ok(j.HIST.oidoRiesgo > 1, "escondido y jadeando con el Acomodador al lado, te va oyendo (riesgo " + j.HIST.oidoRiesgo.toFixed(1) + ")");
  j.HIST.oidoRiesgo = 0; j.keys[j.kb("run")] = true;
  for (let i = 0; i < 30; i++) j.histRespiracion(0.1);
  c.ok(j.HIST.oidoRiesgo < 0.1 && j.HIST.aliento < 0.7, "conteniendo la respiración no te oye, pero el aliento se gasta (" + Math.round(j.HIST.aliento * 100) + " %)");
  j.keys[j.kb("run")] = false; j.HIST.oculto = null; j.HIST.enemigos = []; j.player.cansancio = 0; j.HIST.inmune = false; j.HIST.fallando = viejoFallo;
  // las botellas: lo que te busca va a mirar donde se rompe
  const E = { x: 0, z: 0, estado: "ronda", visto: 0 };
  j.HIST.enemigos = [E];
  j.histCebo(5, 3);
  c.ok(E.estado === "busca" && E.ultimo[0] === 5 && E.ultimo[1] === 3, "una botella rota atrae al Acomodador y a los Hounds a ese sitio");
  j.HIST.enemigos = []; j.HIST.on = false;
  c.ok(j.ITEMS.botella && j.ITEMS.botella.name_en && j.ACTIONS.some(a => a.id === "throw") && j.ACTIONS.some(a => a.id === "crouch"), "botella vacía (también en los casilleros) con tecla de lanzar, y tecla de agacharse en todos los modos");
  c.ok(typeof j.histCintaSonido === "function" && /histCintaSonido\(!!o\.vhs\)/.test(fuente), "las cintas VHS suenan: siseo, zumbido, chasquidos y voces a través de la cinta");
  c.ok(/histEspejosRender\(\)/.test(fuente) && /histPantalla\(pan, "dibujos"/.test(fuente), "los espejos de la casa te reflejan y la tele echa dibujos animados");
  c.ok(j.CAT.every(l => j.musOpciones(l).length >= 2), "cada nivel tiene al menos dos piezas posibles, y cada vuelta cambia de tono y de aire");
}

console.log("\n── EL BARRIO (5.0, cuarta tanda) ──");
{
  const cfg = HIST_MAPAS.calle;
  j.buildLevel("h:calle", cfg.semilla);
  const P = HIST.marcas.P[0], D = HIST.marcas.d[0];
  const { dist } = j.bfs(G.grid, G.n, P[0], P[1]);
  const andando = dist[D[1] * G.n + D[0]], recto = Math.round(Math.hypot(P[0] - D[0], P[1] - D[1]));
  c.ok(andando > recto * 2, "de casa al Commons no se va en línea recta: " + andando + " pasos andando frente a " + recto + " en línea recta");
  const casas = cfg.props.filter(p => p.t === "casa");
  const norte = casas.filter(p => p.lado === "n").map(p => p.x).sort((a, b) => a - b);
  const nav = casas.find(p => p.id === "navarro");
  c.ok(casas.length >= 10 && casas.some(p => p.lado === "s") && nav && norte.indexOf(nav.x) > 0 && norte.indexOf(nav.x) < norte.length - 1,
    casas.length + " casas de madera a los dos lados de Maple Street; la de los Navarro, en mitad de la calle");
  const parque = cfg.props.filter(p => p.t === "arbol" || p.t === "pino").length;
  c.ok(parque >= 30 && cfg.props.some(p => p.t === "estanque") && cfg.props.some(p => p.t === "glorieta"), "Birch Park es grande: " + parque + " árboles, estanque y templete");
  c.ok(cfg.props.some(p => p.t === "gasolinera") && cfg.props.some(p => p.t === "marquesina2") && cfg.props.filter(p => p.t === "local").length >= 5, "Commerce Avenue: tiendas y el Gas-N-Go con su marquesina");
  c.ok(cfg.murosOcultos && ["k", "g", "a", "d"].every(m => HIST.marcas[m]), "lo sólido no se dibuja (se ven las casas y los setos) y el camino tiene sus etapas: parque, puerta norte, aparcamiento y muelle");
  c.ok(j.AGACHADO_POSE && j.AGACHADO_POSE.length === 8, "agacharse tiene sus propios dibujos (de frente, de perfil y de espaldas, quieto y andando)");
}

console.log("\n── EL MÓVIL, LOS TUTORIALES Y LA ACCESIBILIDAD (5.0, quinta tanda) ──");
{
  // el móvil: contactos con foto, chats con historia, llamadas, fotos, notas y mapa
  const chats = Object.keys(j.HIST_CHATS);
  c.ok(chats.length >= 5 && chats.every(k => j.HIST_CONTACTOS[k] && j.HIST_CHATS[k].every(m => m.es && m.en)), chats.length + " chats (" + chats.join(", ") + "), con su contacto y en los dos idiomas");
  c.ok(j.HIST_CHATS.danny.some(m => m.borrador), "en el chat de Danny está el «lo siento» que Owen nunca envió");
  c.ok(j.HIST_FOTOS.length >= 5, j.HIST_FOTOS.length + " fotos en la galería");
  j.HIST.flags = j.HIST.flags || {};
  j.G.torchFuel = 60;
  j.histMovilAbrir("inicio");
  const M = j.movilEstado();
  c.ok(M.abierto && M.pantalla === "inicio", "la tecla del móvil lo abre en la pantalla de inicio");
  j.histMovilTecla("enter");
  c.ok(M.pantalla === "chats", "desde el inicio se entra en los mensajes");
  j.histMovilTecla("escape");
  c.ok(M.pantalla === "inicio", "y Esc vuelve atrás");
  j.histMovilCerrar();
  c.ok(!M.abierto, "y se cierra");
  c.ok(!j.ACTIONS.some(a => a.id === "view") && j.ACTIONS.some(a => a.id === "phone"), "ya no hay tecla de primera persona (va en Ajustes): ahora es la del móvil");
  // tutoriales que paran el juego, una vez cada uno
  j.HIST.flags = {}; j.HIST.nota = null;
  j.histTutorial("prueba", ["T", "T"], ["texto", "text"], "★");
  c.ok(!!j.HIST.nota && j.HIST.flags.tut_prueba === 1, "un tutorial abre una tarjeta que para el juego y se apunta");
  j.histCerrarNota(); j.histTutorial("prueba", ["T", "T"], ["texto", "text"]);
  c.ok(!j.HIST.nota, "y no se repite");
  const tutos = ["movil", "camara", "agachar", "linterna", "correr", "esconder"].filter(t => fuente.indexOf('E.tutorial("' + t + '"') < 0);
  c.ok(!tutos.length && fuente.indexOf('histTutorial("botella"') > 0 && fuente.indexOf('histTutorial("aliento"') > 0, "las mecánicas se van explicando según aparecen: móvil, cámara, agacharse, linterna, correr, esconderse, botellas y aliento" + (tutos.length ? " (faltan " + tutos.join(", ") + ")" : ""));
  // las pruebas que se graban con la cámara
  const pruebas = Object.keys(j.HIST_PRUEBAS);
  const sinSitio = pruebas.filter(id => fuente.indexOf('E.prueba("' + id + '"') < 0);
  c.ok(pruebas.length === 8 && !sinSitio.length, "ocho pruebas para grabar con la cámara, cada una en su sitio del capítulo" + (sinSitio.length ? " (sin sitio: " + sinSitio.join(", ") + ")" : ""));
  c.ok(ACH_BY_ID.hist_grabar && ACH_BY_ID.hist_grabar.name_en, "y un logro por grabarlas todas");
  // la casa de dos plantas
  const casa = HIST_MAPAS.casa;
  c.ok(casa.escaleras && casa.escaleras.length === 2 && casa.props.some(p => p.t === "escalera") && casa.props.some(p => p.t === "hueco"), "la casa tiene dos plantas: escalera abajo, hueco con barandilla arriba");
  c.ok(casa.props.some(p => p.t === "precinto" && p.id === "precinto") && fuente.indexOf('"Arrancar el precinto"') > 0, "la puerta de Danny está precintada (policía, cinta y una nota de mamá) y hay que arrancarlo");
  j.HIST.flags = {};
  j.buildLevel("h:casa", casa.semilla);
  const S = j.HIST.escaleras[0];
  j.player.pos.set(S.ax, 0, S.az); j.player.yaw = Math.atan2(S.dir[0], S.dir[1]); j.player.speed = 1.5;
  j.HIST.bloqueo = 0; j.HIST.dlg = null; j.HIST.nota = null; j.HIST.cine = null; j.HIST.oculto = null; j.HIST.escCd = 0;
  j.histEscaleras(0.05);
  c.ok(j.HIST.escalando === true, "andando hacia la escalera se sube (o se baja) de piso");
  // accesibilidad
  const filas = ["dalt", "textoTam", "textoVel", "subFondo", "sinDestellos", "agacharModo", "correrModo", "histHud", "contraste"].filter(id => !j.OPT_ROWS.some(r => r.id === id));
  c.ok(!filas.length, "Ajustes → Accesibilidad: daltonismo, tamaño y velocidad del texto, fondo de subtítulos, sin destellos, agacharse y correr sin mantener, rótulos y contraste" + (filas.length ? " (faltan " + filas.join(", ") + ")" : ""));
  c.ok(j.DALT_MATRICES.length === 5 && j.DALT_MATRICES.slice(1).every(m => m.trim().split(/\s+/).length === 20), "cuatro filtros de daltonismo (protanopia, deuteranopia, tritanopia y monocromo)");
}

console.log("\n── EL BARRIO EN HALLOWEEN, LAS ESCALERAS Y LAS BATERÍAS (5.0, séptima tanda) ──");
{
  // las cámaras de las escenas no pueden quedar dentro de una pared (en el nido salía todo negro)
  const malas = [];
  for (const T of cap.tramos) {
    const code = (T.montar ? T.montar.toString() : "") + T.run.toString();
    const re = /E\.camara\(\[c2w\(([\d.]+)\),\s*([\d.]+),\s*c2w\(([\d.]+)\)\]/g;
    let m; const cams = [];
    while ((m = re.exec(code))) cams.push([+m[1], +m[3]]);
    if (!cams.length) continue;
    j.buildLevel("h:" + T.mapa, HIST_MAPAS[T.mapa].semilla || 1);
    for (const [x, z] of cams) if (G.grid[Math.round(z) * G.n + Math.round(x)] === 1) malas.push(T.id + " (" + x + ", " + z + ")");
  }
  c.ok(!malas.length, "ninguna cámara de escena está metida en una pared" + (malas.length ? ": " + malas.join(", ") : ""));
  // Elm Court: se entra desde Maple Street y no lleva a ningún otro sitio (la pasarela está rota)
  const calle = HIST_MAPAS.calle;
  j.buildLevel("h:calle", calle.semilla);
  const desdeElm = j.bfs(G.grid, G.n, 9, 30).dist, desdeCasa = j.bfs(G.grid, G.n, 20, 48).dist;
  c.ok(desdeCasa[30 * G.n + 9] > 0 && desdeElm[2 * G.n + 4] > desdeCasa[2 * G.n + 4], "Elm Court se alcanza desde Maple Street y es un fondo de saco: no es un atajo al Commons");
  c.ok(G.grid[22 * G.n + 21] === 1 && G.grid[22 * G.n + 20] === 0, "la pasarela del arroyo se pisa hasta la valla y no se cruza");
  const deco = ["calabaza", "telarana", "fantasma", "lapida", "esqueleto", "luces", "paja", "maiz", "hinchable", "espantapajaros", "murcielagos", "pancarta"];
  const cuantos = calle.props.filter(p => deco.indexOf(p.t) >= 0).length;
  c.ok(cuantos >= 60 && deco.every(t => calle.props.some(p => p.t === t)), "Halloween por todo el barrio: " + cuantos + " adornos (calabazas talladas, telarañas, fantasmas, lápidas, esqueletos, guirnaldas…)");
  c.ok(["tyler", "bromista1", "bromista2"].every(k => HIST_LOOK[k] && j.HIST_VOZ[k] && HIST_QUIEN[k]), "gente nueva en la Noche del Diablo: Tyler Brandt y los dos de la broma, con su aspecto y su voz");
  const recuerdos = ["coche", "canasta", "puente", "columpio", "videoclub", "earl"].filter(id => fuente.indexOf('hRecuerdo(E, "' + id + '")') < 0);
  c.ok(!recuerdos.length && ACH_BY_ID.hist_recuerdos && ACH_BY_ID.hist_pickles && j.HIST_CONTACTOS.pickles, "seis recuerdos de Danny por el barrio y Pickles, el gato perdido (con sus logros y el chat de su dueña)" + (recuerdos.length ? " (faltan " + recuerdos.join(", ") + ")" : ""));
  c.ok(calle.props.some(p => p.t === "poste") && calle.props.filter(p => p.t === "poste").every(p => p.y < 49.6 || p.y > 54.4), "los postes de la luz van al borde de la acera, no en medio");
  // las escaleras de la casa: huecos de verdad y se suben andando
  const casa = HIST_MAPAS.casa;
  c.ok(casa.huecosTecho && casa.huecosSuelo && casa.escaleras.every(e => e.ruta && e.ruta.length >= 2), "la escalera tiene hueco en el techo de abajo y en el suelo de arriba, y un camino por los escalones");
  j.HIST.flags = {};
  j.buildLevel("h:casa", casa.semilla);
  const S = j.HIST.escaleras[0];
  j.player.pos.set(S.ax, 0, S.az); j.player.yaw = Math.atan2(S.dir[0], S.dir[1]); j.player.speed = 1.5;
  j.HIST.bloqueo = 0; j.HIST.dlg = null; j.HIST.nota = null; j.HIST.cine = null; j.HIST.oculto = null; j.HIST.escCd = 0; j.HIST.escala = null;
  j.histEscaleras(0.05);
  let alto = 0;
  for (let i = 0; i < 200 && j.HIST.escala; i++) { j.histEscaleras(0.05); alto = Math.max(alto, j.player.yOff || 0); }
  c.ok(alto > 2 && !j.HIST.escala && Math.abs(j.player.pos.x - S.bx) < 0.01 && j.player.yOff === 0, "Owen sube los escalones de verdad (llega a " + alto.toFixed(1) + " m) y aparece arriba");
  // las baterías se gastan y avisan; si el guion necesita la cámara, nunca te quedas atascado
  j.HIST.on = true; j.HIST.tramo = cap.tramos.find(t => t.id === "calle"); j.HIST.cine = false;
  j.G.torchFuel = 30;
  for (let i = 0; i < 60; i++) j.histBaterias(1);
  c.ok(j.G.torchFuel < 30, "el móvil se gasta solo, poco a poco (" + j.G.torchFuel.toFixed(2) + " % tras un minuto)");
  j.HIST.camOk = true; j.HIST.camBat = 0; j.HIST.camNecesaria = true;
  j.histCamara(true);
  c.ok(j.HIST.camOn && j.HIST.camBat > 0, "sin batería, si la historia necesita la cámara, aguanta un poco más");
  j.histCamara(false); j.HIST.camNecesaria = false; j.HIST.on = false;
  c.ok(j.histTelRetardo({ de: "maya", es: "a", en: "a" }) < j.histTelRetardo({ de: "maya", es: "un mensaje bastante más largo que el otro", en: "a much longer message than the other one" }), "los mensajes tardan lo que se tarda en escribirlos (con los tres puntitos)");
  c.ok(/peaking/.test(j.vozSilaba.toString()) && /histDuck/.test(fuente), "las voces tienen cuerpo (filtros de formante) y la música se aparta cuando alguien habla");
}

console.log("\n── GRÁFICOS: LUZ DE NOCHE (5.0, octava tanda) ──");
{
  const calle = HIST_MAPAS.calle;
  j.buildLevel("h:calle", calle.semilla);
  const n = j.HIST.halos.length;
  c.ok(n > 300, "la calle tiene " + n + " halos de luz (farolas, porches, ventanas, guirnaldas, calabazas)");
  c.ok(calle.luna && calle.hojas && calle.bruma && calle.bruma.length >= 3 && calle.murcielagos, "la calle tiene luna con sombras, hojas que caen, bruma baja y murciélagos");
  c.ok(calle.floor[0] === "asfalto" && typeof j.MAT.asfalto === "function", "el suelo de la calle es asfalto de verdad (grietas, parches, manchas de aceite)");
  c.ok(j.HIST.chimeneas.length >= 1, "las chimeneas echan humo");
  const nivel = j.CAT[0];
  j.HIST.on = false; j.buildLevel(nivel.id, 3);
  c.ok(j.G.halosNivel && j.G.halosNivel.H.length === j.G.lamps.length && j.G.lamps.length > 0, "en los demás modos las lámparas también brillan (" + j.G.lamps.length + " halos en " + nivel.id + ")");
  c.ok(j.G.halosNivel.luz && j.G.halosNivel.luz.ao && j.G.halosNivel.luz.pools && j.G.halosNivel.luz.lamps.length === j.G.lamps.length, "y los interiores tienen sombra en las esquinas y un charco de luz bajo cada lámpara");
  // la casa y los Backrooms de la historia
  j.HIST.on = true;
  for (const id of ["casa", "commons", "l0", "l1", "l2"]) {
    const cfg = HIST_MAPAS[id];
    j.buildLevel("h:" + id, cfg.semilla || 1);
    const R = j.luzInterior(cfg);
    if (!(R.ao && R.pools)) c.ok(false, "«" + id + "» sin sombra de esquinas o sin charcos de luz");
  }
  c.ok(true, "la casa, el Commons y los tres niveles de los Backrooms tienen sombra en las esquinas y charcos de luz");
  j.buildLevel("h:l2", HIST_MAPAS.l2.semilla); j.HIST.halos = []; j.HIST.chimeneas = [];
  j.histDecoBackrooms(HIST_MAPAS.l2);
  c.ok(j.HIST.halos.length >= 8 && j.HIST.chimeneas.some(ch => ch.vapor), "en las Tuberías hay luces rojas de emergencia que laten y vapor saliendo del suelo");
  j.HIST.on = false;
}

console.log("\n── LA CÁMARA DE LA CASA, LOS ENEMIGOS Y EL SONIDO (5.0, novena tanda) ──");
{
  // la cámara de la casa: siempre a la misma distancia, mire donde mire (antes se acercaba y alejaba sola)
  const ds = [], hs = [];
  for (let k = 0; k < 16; k++) { const [x, y, z] = j.camaraCasa(0, 0, k / 16 * Math.PI * 2, -0.25, 0, HIST_MAPAS.casa.wallH, 2.3); ds.push(Math.hypot(x, z)); hs.push(y); }
  const dmin = Math.min(...ds), dmax = Math.max(...ds);
  c.ok(dmax - dmin < 0.001 && Math.min(...hs) > HIST_MAPAS.casa.wallH && /casaMunecas/.test(fuente) && /want = 2\.3;/.test(fuente), "en la casa la cámara va siempre a " + dmin.toFixed(2) + " m y por encima del techo, mire hacia donde mire (sin acercarse ni alejarse)");
  c.ok(HIST_MAPAS.casa.telon && HIST_MAPAS.casa.telon.length, "un telón entre las dos plantas: desde arriba no se ve el otro piso");
  // el sonido: cada sitio tiene su colección de ruidos, todos existen
  const mapas = ["calle", "casa", "commons", "l0", "l1", "l2"], faltan = [];
  mapas.forEach(m => (j.HIST_AMBIENTE[m] || []).forEach(e => { if (typeof j.HIST_RUIDO[e[0]] !== "function") faltan.push(m + ":" + e[0]); }));
  c.ok(mapas.every(m => (j.HIST_AMBIENTE[m] || []).length >= 4) && !faltan.length, "cada sitio suena a algo: perros, búhos, petardos, la casa que cruje, goteras, tuberías…" + (faltan.length ? " (faltan " + faltan.join(", ") + ")" : ""));
  c.ok(/createStereoPanner/.test(j.histDest.toString()), "los ruidos salen de un sitio: bajan con la distancia y suenan a un lado o al otro");
  // los enemigos: pasos, radio y la cara de estática del Acomodador; los perros jadean y les brillan los ojos
  const src = j.histEnemigoVida.toString();
  c.ok(/pasoT/.test(src) && /radioT/.test(src) && /jadeoT/.test(src) && /cara/.test(src) && /ojos/.test(src), "el Acomodador camina con pasos pesados, murmura por una radio y tiene la cara hecha de estática; los perros jadean y les brillan los ojos");
  j.HIST.on = false;
}

console.log("\n── LA MÚSICA ──");
{
  const piezas = Object.keys(j.MUS_PIEZAS);
  c.ok(piezas.length >= 15, piezas.length + " piezas: " + piezas.join(", "));
  const sin = j.CAT.filter(l => !j.musElegir(l));
  c.ok(sin.length === 0, "todos los niveles de los otros modos tienen pieza" + (sin.length ? " (faltan: " + sin.map(l => l.id).join(", ") + ")" : ""));
  const usadas = new Set(j.CAT.map(l => j.musElegir(l)));
  c.ok(usadas.size >= 5, "y no todos la misma: suenan " + usadas.size + " distintas según el nivel");
  c.ok(Object.values(HIST_MAPAS).every(m => j.MUS_PIEZAS[m.musica]), "cada mapa de la historia tiene la suya (" + Object.values(HIST_MAPAS).map(m => m.musica).join(", ") + ")");
  // cada pieza genera notas en todos sus compases sin reventar
  let notas = 0;
  const mal = [];
  for (const id of piezas) {
    const P = j.MUS_PIEZAS[id];
    try { for (let b = 0; b < 16; b++) P.gen(b, P.acordes[b % P.acordes.length], () => notas++, Math.random); } catch (e) { mal.push(id + ": " + e.message); }
  }
  c.ok(!mal.length && notas > 500, "las piezas generan sus notas (" + notas + " en 16 compases de cada una)" + (mal.length ? " · " + mal.join("; ") : ""));
}

console.log("\n── LA MÚSICA Y LOS MENÚS (5.0, décima tanda) ──");
{
  // el leitmotiv: cuatro compases y su respuesta, y lo tocan el menú, la casa y la calle
  const M = j.MUS_MOTIVO, R = j.MUS_RESPUESTA;
  const pulsosOk = f => f.every(cp => cp.every(([p, s, d]) => p >= 0 && p + d <= 4.001 && Number.isFinite(s)));
  c.ok(M.length === 4 && R.length === 4 && pulsosOk(M) && pulsosOk(R) && j.MUS_ACORDES_D.length === 4, "el tema de «El Zumbido»: cuatro compases en re menor y su respuesta, todo dentro del compás");
  c.ok(["titulo", "danny", "calle", "tension"].every(id => j.MUS_PIEZAS[id]), "piezas nuevas: el tema del menú, el de Danny, el vals de Halloween y la capa de tensión");
  c.ok(HIST_MAPAS.casa.musica === "danny" && HIST_MAPAS.calle.musica === "calle", "la casa suena con el tema de Danny y Maple Street con el vals de Halloween");
  // el leitmotiv suena de verdad en las tres: las notas de la melodía coinciden con el motivo
  // la melodía de cada una: el instrumento que la lleva y, en la casa, sólo las notas de arriba (las de abajo son el arpegio)
  const melodia = (id, ins, min) => { const P = j.MUS_PIEZAS[id], notas = []; for (let b = 0; b < 16; b++) P.gen(b, P.acordes[b % 4], (p, inst, s) => { if (inst === ins && s >= min) notas.push(((s % 12) + 12) % 12); }, () => 0.5); return notas; };
  const motivo = M.flat().map(([, s]) => ((s % 12) + 12) % 12);
  const contiene = (h, n) => { for (let i = 0; i + n.length <= h.length; i++) if (n.every((x, k) => h[i + k] === x)) return true; return false; };
  c.ok([["titulo", "piano", 0], ["danny", "piano", 20], ["calle", "campana", 0]].every(([id, ins, min]) => contiene(melodia(id, ins, min), motivo.slice(0, 6))), "el leitmotiv se oye en el menú, en la casa y en la calle");
  // instrumentos nuevos y estéreo
  const nota = j.musNota.toString();
  c.ok(["cuerdas", "trem", "coro", "estatica", "latido", "pizz"].every(i => nota.includes('"' + i + '"')), "instrumentos nuevos: cuerdas, trémolo, coro, estática de radio, latido y pizzicato");
  c.ok(/createStereoPanner/.test(nota) && j.musPan("bajo", 55) === 0 && Math.abs(j.musPan("piano", 1000)) > 0.1, "cada instrumento suena en su sitio: el bajo en el centro, el piano agudo a un lado");
  c.ok(/createConvolver/.test(j.musNodos.toString()), "la música suena en una sala: reverberación propia");
  const usadas = new Set(); for (const id of Object.keys(j.MUS_PIEZAS)) { const P = j.MUS_PIEZAS[id]; for (let b = 0; b < 8; b++) P.gen(b, P.acordes[b % P.acordes.length], (p, inst) => usadas.add(inst), Math.random); }
  const faltan = [...usadas].filter(i => !nota.includes('"' + i + '"'));
  c.ok(!faltan.length, "todas las piezas usan instrumentos que existen" + (faltan.length ? " (faltan " + faltan.join(", ") + ")" : ""));
  // la capa de tensión: sube cuando algo se acerca
  j.HIST.on = true; j.buildLevel("h:l0", HIST_MAPAS.l0.semilla);
  j.player.pos.set(0, 0, 0);
  j.HIST.enemigos = [];
  const lejos = j.musAmenaza();
  j.HIST.enemigos = [{x: 4, z: 0, tipo: "hound", estado: "caza"}];
  const cerca = j.musAmenaza();
  j.HIST.enemigos = [{x: 4, z: 0, tipo: "usher", estado: "quieto", soloCamara: true}]; j.HIST.camOn = false;
  const invisible = j.musAmenaza();
  j.HIST.enemigos = []; j.HIST.on = false;
  c.ok(lejos === 0 && cerca > 0.8 && invisible === 0, "la tensión sube cuando algo anda cerca (" + cerca.toFixed(2) + " a 4 m) y no la delata el Acomodador que sólo se ve por la cámara");
  c.ok(/MUS\.ten/.test(j.musUpdate.toString()) && /tension/.test(j.musUpdate.toString()), "la capa de tensión se mezcla con la pieza: un trémolo y un latido que la tapan un poco");
  // en los menús también hay música
  j.G.running = false;
  const quiere = j.musMenuPieza();
  const fuente = j.musMenuPieza.toString();
  c.ok(["titulo", "danny", "final"].includes(quiere) && /"histScreen"/.test(fuente) && /return "titulo"/.test(fuente), "en el menú suena el tema del juego, y al elegir capítulo el de Danny");
  c.ok(/musUpdate\(dt\)/.test(j.frame.toString()) && /tituloDeriva\(dt\)/.test(j.frame.toString()), "con el juego parado, el bucle sigue: la música del menú y la cámara por el Lobby");
  // la cámara del título: recorre el Lobby sin acercarse a las paredes
  j.buildLevel("0", 7);
  j.TITULO.yaw = null;
  let minPared = 99, recorrido = 0, ant = null;
  for (let k = 0; k < 900; k++) {
    j.tituloDeriva(0.05);
    const x = j.player.pos.x, z = j.player.pos.z;
    if (ant) recorrido += Math.hypot(x - ant[0], z - ant[1]);
    ant = [x, z];
    if (k % 10 === 0) for (let a = 0; a < 8; a++) minPared = Math.min(minPared, j.tituloLibre(x, z, a*Math.PI/4));
  }
  c.ok(recorrido > 15 && minPared > 1, "detrás del título la cámara recorre el Lobby (" + recorrido.toFixed(0) + " m en 45 s) sin pegarse a las paredes (" + minPared.toFixed(1) + " m como poco)");
  c.ok(typeof j.uiSonido === "function" && /pointerover/.test(j.menuSonidos.toString()), "los botones del menú suenan: un tic al pasar por encima y un clac al pulsar");
  j.G.running = false;
}

console.log("\n── INTERIORES Y BACKROOMS MÁS GRANDES (5.0, Halloween y otoño) ──");
{
  // los Backrooms de la historia, más grandes (y el montacargas y la escotilla, al fondo)
  c.ok(HIST_MAPAS.l0.grid >= 71 && HIST_MAPAS.l1.grid >= 45 && HIST_MAPAS.l2.grid >= 51, "los Backrooms de la historia son mucho más grandes (Level 0: " + HIST_MAPAS.l0.grid + ", Level 1: " + HIST_MAPAS.l1.grid + ", Tuberías: " + HIST_MAPAS.l2.grid + " celdas de lado)");
  c.ok(HIST_MAPAS.l1.marcas.E[0][0] >= 40 && HIST_MAPAS.l2.marcas.X[0][0] >= 44, "el montacargas y la escotilla, al fondo del mapa nuevo");
  // la casa: molduras, enchufes, interruptores y cuadros, que se esconden con su muro
  j.HIST.on = true;
  j.buildLevel("h:casa", HIST_MAPAS.casa.semilla);
  const r = j.histInteriorDetalle(j.G.cfg);
  const pegados = Object.keys(j.G.cortePegados || {}).length;
  c.ok(r && r.molduras > 100 && r.enchufes > 5 && r.interruptores > 3 && r.cuadros >= 6, "la casa tiene moldura en lo alto de las paredes, enchufes, interruptores junto a las puertas y cuadros (" + (r ? r.molduras + " · " + r.enchufes + " · " + r.interruptores + " · " + r.cuadros : "nada") + ")");
  c.ok(pegados > 50 && /pegOcultos/.test(j.camCorte.toString()), "lo que va pegado a un muro se esconde con él cuando la cámara de la casa lo quita (antes la moldura y los enchufes se quedaban flotando)");
  c.ok(/corteOn/.test(j.luzInterior.toString()) && /cameraPosition\.y > yw/.test(j.luzInterior.toString()), "las sombras y los charcos de luz del techo no se pintan si la cámara está por encima (era una franja translúcida en la casa)");
  j.HIST.on = false;
}

console.log("\n── EL CAPÍTULO ENTERO, JUGADO POR UN BOT ──");
/* El bot hace lo que haría un jugador con prisa: pasa los textos, elige una respuesta,
   coge y usa lo que haya, va adonde le esperan y, si hay que esconderse, se esconde.
   Los enemigos no lo pueden pillar (HIST.inmune): aquí se prueba que el guion avanza. */
async function jugar(eleccion) {
  const k = cargar();
  const H = k.HIST;
  H.inmune = true;
  k.histEmpezar("c1", "intro", true);
  const usados = new Set();
  let pasos = 0, ultimoTramo = "", tramos = [], ocultoT = 0;
  const tp = (x, z) => { k.player.pos.set(x, 0, z); };
  while (pasos++ < 40000) {
    await dejar();
    if (window_err(k)) return { error: window_err(k), tramos };
    if (!H.on) break;
    const t = H.tramo && H.tramo.id;
    if (t !== ultimoTramo) { ultimoTramo = t; tramos.push(t); usados.clear(); }
    if (H.auto) { tp(H.auto.x, H.auto.z); H.auto = null; }     // en el juego lo anda updatePlayer()
    else if (H.nota) k.histCerrarNota();
    else if (H.dlg && H.dlg.ops) k.histEscoger(Math.min(eleccion, H.dlg.ops.length - 1));
    else if (H.dlg) { k.histAvanzar(); k.histAvanzar(); }
    else if (H.tel) { if (!(H.tel.auto > 0)) k.histTelSiguiente(); }
    else if (H.cineLinea) H.cineLinea.t = 0;
    else if (!H.cine && H.bloqueo === 0) {
      const p = H.pend.find(x => x.tipo !== "t");
      if (H.oculto && (ocultoT += 0.2) > 8) { k.histEsconder(); ocultoT = 0; }
      else if (p && p.tipo === "usar") { const u = H.inter.find(i => i.id === p.id); if (u) { tp(u.x, u.z); k.histUsar(u); } }
      else if (p && p.tipo === "zona") { const m = (H.marcas[p.ch] || [])[0]; if (m) tp(k.c2w(m[0]), k.c2w(m[1])); }
      else if (p && p.tipo === "cerca") tp(p.x, p.z);
      else if (p && p.tipo === "auto") { tp(H.auto.x, H.auto.z); H.auto = null; }
      else if (p && p.tipo === "cond" && H.camOk && !H.camOn) k.histCamara(true);
      else {
        // lo que haya por usar: primero lo nuevo; esconderse sólo si nada más funciona
        const libres = H.inter.filter(i => i.activo && !usados.has(i.id) && !i.esconder);
        const u = libres[0] || (!H.oculto && H.inter.find(i => i.activo && i.esconder));
        if (u) { usados.add(u.id); tp(u.x, u.z); k.histUsar(u); }
      }
    }
    k.G.t += 0.2;
    k.histUpdate(0.2);
  }
  return { fin: !H.on, completado: !!(k.histLeer().completado || {}).c1, tramos, pasos, eleccion: H.eleccion, notas: Object.keys(H.notas).length };
}
function window_err(k) { return k.__ctx.window && k.__ctx.window.__zerr; }

(async () => {
  const elecciones = RAPIDO ? [0] : [0, 1, 2];
  for (const e of elecciones) {
    const r = await jugar(e);
    if (r.error) { c.ok(false, "el capítulo no revienta (respuesta " + (e + 1) + "): " + r.error + " en " + r.tramos.slice(-1)); continue; }
    c.ok(r.fin && r.completado, "con la respuesta " + (e + 1) + " en cada pregunta se llega al final (" + r.tramos.length + " tramos, " + r.pasos + " pasos)");
    c.ok(r.tramos.join() === cap.tramos.map(t => t.id).join(), "y pasa por todos los tramos en orden");
    c.ok(r.eleccion && r.eleccion.espejo === Math.min(e, 2) && r.eleccion.final !== undefined, "y se guardan sus decisiones (lo que le dice a June, arriba o abajo)");
    if (e === 0) c.ok(r.notas >= 7, "el bot ha leído " + r.notas + " notas por el camino");
  }
  process.exit(c.resumen("el modo historia") ? 1 : 0);
})();
