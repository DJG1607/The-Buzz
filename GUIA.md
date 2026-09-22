# Guía del proyecto

Esto explica **cómo está montado El Zumbido y dónde tocar para cambiar cada cosa**.
Si sólo quieres jugar, con el [README](README.md) basta.

---

## 1. Por qué todo está en un archivo

`el-zumbido.html` son ~7.100 líneas y lo contiene todo: estilos, menús, el juego,
las texturas, los sprites y el sonido. No hay imágenes, ni audio, ni compilación, ni
`npm install`. Para jugar en solitario la única dependencia es Three.js, que viene de un
CDN; el multijugador carga además PeerJS, pero sólo cuando le das a «Jugar con amigos».

Eso es a propósito. Significa que el juego **funciona con hacer doble clic en el archivo**,
se puede subir a cualquier sitio tal cual y no se rompe porque falte una carpeta.

El precio es que el archivo es largo. Por eso tiene un **índice de secciones al principio
del `<script>`**: ábrelo, mira los nombres y busca el que quieras con `Ctrl+F`.

### Los cuatro bloques

| Líneas | Qué es |
|---|---|
| 1–4 | `<meta charset>` y el título |
| 5–397 | `<style>`: los estilos de menús y HUD |
| 398–~640 | El lienzo 3D, el HUD y las **ocho pantallas**: título, sala, personajes, informe, muerte, nivel superado, ajustes y pausa |
| ~641 | Three.js 0.150.1 desde CDN — la única dependencia fija |
| ~642–final | El juego, en 44 secciones |

---

## 2. Cómo transcurre una partida

```
Portada  →  [Jugar]  →  carrusel de personajes  →  informe del nivel  →  JUGAR
    │
    └─ [Jugar con amigos] → sala → (lo mismo, pero compartiendo laberinto)
                                                        │
                            ┌───────────────────────────┤
                            │                           │
                     llegas a una salida            te matan
                            │                           │
                     pantalla "superado"          pantalla de muerte
                     (logro + ficha)              (o continuar desde
                            │                      el último puesto)
                     informe del siguiente
                            │
                       vuelta a JUGAR
```

Se empieza **siempre en el Level 0** y sin nada encima. Cada salida abre los niveles
siguientes. Sólo se guarda la partida en los **puestos abandonados del M.E.G.**, que
aparecen por azar en algunos niveles.

---

## 3. Cómo se construye un nivel

Todo pasa dentro de `buildLevel(id, semilla)` (sección **MONTAJE DEL NIVEL**), y siempre
en este orden:

1. **`genMaze()`** teje el laberinto con *recursive backtracker* y luego lo *trenza*
   (`braid`) abriendo pasillos para que no sea un laberinto perfecto.
2. **`carveSpecials()`** talla las variaciones del lore: arcos, pilares, fosos, zonas sin
   luz, la sala roja y la Manila Room.
3. **`reopenSpecials()`** repara lo anterior. El anillo de la sala roja se estampa encima
   del laberinto sin mirar qué pasillos corta, y llegaba a dejar el 80% del mapa
   incomunicado; esta función lo detecta y le abre más puertas.
4. **Las salidas.** De las que el nivel declara en `exitsTo` se colocan **sólo 2-4, al
   azar** (`nExits = 2 + rand()*3`), lejos del inicio y separadas entre sí.
5. **El puesto del M.E.G.**, si toca según la probabilidad `outpost`.
6. **Los contenedores**, pegados a las paredes.
7. **Las grabadoras**, escondidas en callejones sin salida.
8. **`decorate()`** mete los muebles propios del nivel.
9. **Las entidades**, con reglas duras de distancia para que no aparezcan encima de ti.
10. **`clearBlockedPaths()`** quita cualquier mueble que haya tapado un pasillo.

> **Esto NO es un fallo:** que un nivel declare 6 salidas y en la partida veas 2. Es el
> punto 4. Las salidas son aleatorias a propósito. Lo que sí sería un fallo es que un
> destino declarado no apareciera *nunca* — y eso se comprueba en las pruebas.

---

## 4. Dónde se toca cada cosa

Todo esto está en `el-zumbido.html`. Busca el nombre de la sección con `Ctrl+F`.

| Quiero… | Sección | Qué toco |
|---|---|---|
| Añadir un nivel | `CATÁLOGO DE NIVELES` | Una entrada en `CAT` + engancharlo al `exitsTo` de otro nivel |
| Cambiar la fauna de un nivel | `CATÁLOGO DE NIVELES` | El campo `ents` de ese nivel |
| Cambiar lo peligroso que es | `CATÁLOGO DE NIVELES` | `ents`, `drain` (cordura) y `risk` |
| Cambiar cuánto botín da | `CATÁLOGO DE NIVELES` | `boxes` y `outpost` |
| Tocar una entidad | `ENTIDADES` | `ENT_DEF`: `chase`, `dmg`, `memory`, `tires`, `sp` |
| Tocar un ataque especial | `ENTIDADES` | El campo `sp` de esa entidad |
| Tocar un objeto | `OBJETOS` | `ITEMS`, y `useItem()` en `USO DE OBJETOS` |
| Cambiar qué sale de los casilleros | `OBJETOS` | `TIERS` (los tres cajones) y `DICE` (el d6) |
| Cambiar la dificultad | `MODOS DE JUEGO` | `DIFFS` |
| Cambiar velocidad o aliento | `JUGADOR` | `WALK`, `RUN`, `staminaMax()` |
| Añadir un tipo de salida | `SALIDAS` | `EXIT_KINDS` + su geometría en `SALIDAS: geometría por tipo` |
| Cambiar un ajuste | `AJUSTES` | `OPT_ROWS` |
| Añadir un logro | `LOGROS` | `ACHIEVEMENTS` (los de nivel se generan solos) |
| Añadir un personaje | `PERSONAJES` | `CHARACTERS`; se desbloquea con `unlockAt` (profundidad) o `unlockLevel` (pisar un nivel) |
| Tocar el multijugador | `MULTIJUGADOR` | `MP`, `mpRecibir()` y `updateGhosts()` |

### Añadir un nivel, paso a paso

1. Copia una entrada de `CAT` parecida y cámbiale `id`, `num`, `title`, `risk`.
2. Ajusta el aspecto: `grid`, `cell`, `wallH`, `braid`, `fog`, `amb`, las texturas de
   `floor`/`wall`/`ceil`, y `deco` (tiene que ser uno de los ya implementados).
3. Pon `ents`, `boxes`, `outpost`, `drain` y `special`.
4. Escribe `lore` y `tip` **en los dos idiomas** (`lore_en`, `tip_en`).
5. En `exitsTo`, adónde se va desde él.
6. **Importante:** añade una salida *hacia* él desde algún nivel existente, o no se
   podrá llegar nunca.
7. Actualiza el anexo: `node herramientas/anexo.js`.
8. Comprueba: `node pruebas/todo.js`.

---

## 5. El multijugador

Está en la sección **MULTIJUGADOR** del archivo. Funciona así:

1. Todos escriben el **mismo nombre de sala**. El que le da a *Crear sala* abre un `Peer` con el id
   `elzumbido-<sala>`; los demás se conectan a ese id.
2. Una vez conectados, **la partida va directa de un ordenador a otro** (WebRTC). El único momento
   en que hace falta un intermediario es el «hola» inicial, y de eso se encarga el broker público
   de PeerJS.
3. Se comparten dos cosas: el **nivel** (su id y su semilla, que es lo que lo genera entero) y
   **dónde está cada uno**. Los enemigos y el botín son de cada jugador, así que una conexión mala
   no le estropea la partida a nadie.
4. Los demás se dibujan con `updateGhosts()`, como sprites del personaje que eligieron, con la
   posición interpolada porque llega ocho veces por segundo.

**PeerJS se carga a demanda** (`mpCargarLibreria()`), no como `<script src>`. Eso es a propósito:
si fuera fijo, el juego en solitario dejaría de arrancar sin internet. `pruebas/sintaxis.js` lo
vigila.

Lo que **no** hace: no sincroniza enemigos, ni botín, ni quién ha abierto qué casillero. Si algún
día quieres eso, el anfitrión tendría que simular y mandar el estado, y hay que pensarse qué pasa
cuando se va.

---

## 6. Los dos idiomas

El juego está en español e inglés y se cambia en caliente desde Ajustes.

- **Texto fijo del HTML:** atributo `data-en="..."`. Lo cambia `applyLangDom()`.
- **Frases sueltas del código:** `tx("español", "english")`.
- **Datos:** `txf(objeto, "campo")`, que busca el campo con sufijo `_en`
  (`name_en`, `lore_en`, `blurb_en`…).

> **Cualquier texto nuevo necesita su pareja en inglés.** Las pruebas lo comprueban
> para objetos y ataques especiales.

> **Cuidado:** `applyLangDom()` reescribe el `innerHTML` de todo lo que tenga `data-en`.
> Si metes ahí dentro un elemento que rellenas por código, se borrará al cambiar de
> idioma. Por eso la etiqueta de versión va en su propio elemento, fuera.

---

## 7. Trampas que ya han mordido

Cosas que no se ven mirando el código y cuestan una tarde cada una.

**El juego entero va dentro de una IIFE con `try/catch`.**
Dos consecuencias: desde la consola del navegador **no se ven** `G`, `CAT` ni nada; y si
algo revienta al arrancar **no sale por consola**, sale un cartel. El error queda en
`window.__zerr` — míralo ahí.

**En JavaScript gana la última definición.**
El juego tuvo meses dos `rollDice` y dos `lootForRoll`. La copia vieja estaba más abajo,
así que era la que mandaba: el modificador de dado de la dificultad no hacía nada y los
casilleros repartían premios que no cabían en la mochila. Desde fuera no se notaba.
`node pruebas/sintaxis.js` lo caza.

**La vida que ves es la media de seis zonas.**
El daño normal va a una zona al azar, así que 9 puntos en una pierna se ven como un 1,6%
en la barra. Si quieres que un golpe *se note*, tiene que ir a varias zonas a la vez:
eso es lo que hacen los ataques especiales.

**El plano y la grabadora caducan al bajar.**
Los dos señalan una salida **del nivel en el que estás**. `descendTo()` los borra. La
brújula no: es equipo permanente. Si añades otro objeto que señale algo del nivel,
bórralo ahí también.

**Sin `<meta charset>` los acentos se rompen.**
Servido por HTTP sin declarar UTF-8, «brújula» sale como «brÃºjula». Está puesto; no lo
quites. Y **no** le pongas `<!DOCTYPE>`: la maqueta está hecha en modo *quirks* y el
doctype la cambiaría.

**Three.js tiene que ser 0.150.1.**
Las versiones a partir de la r160 quitaron el build UMD, que es el que permite cargarlo
con una sola etiqueta `<script>` sin módulos.

---

## 8. Comprobar que no has roto nada

```bash
node pruebas/todo.js
```

Tarda un par de minutos y carga el juego sin navegador. Lo que mira está explicado en
[pruebas/README.md](pruebas/README.md).

Para verlo de verdad en el navegador hace falta servirlo por HTTP (con `file://` algunas
cosas no van):

```bash
python -m http.server 8777
```

Y abrir `http://localhost:8777/el-zumbido.html`.

---

## 9. Los otros archivos

| Archivo | Para qué |
|---|---|
| `el-zumbido.html` | El juego entero |
| `mapa-descenso.html` | Anexo con el grafo de saltos, la fauna y los tipos de salida |
| `herramientas/anexo.js` | Regenera el anexo desde el catálogo del juego |
| `pruebas/` | Las comprobaciones automáticas |
| `GUIA.md` | Esto |
