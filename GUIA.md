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
| Añadir un personaje | `PERSONAJES` | `CHARACTERS`; se desbloquea con `unlockAt` (profundidad) o `unlockLevel` (pisar un nivel); su `ability` es la habilidad activa |
| Tocar el multijugador | `MULTIJUGADOR` | `MP`, `mpRecibir()` y `updateGhosts()` |
| Añadir un arma de mano | `OBJETOS` | Un `ITEMS.xxx` con `weapon:true`, `reach`, `stun`, `cd` — entra sola en `TIERS` |
| Tocar una habilidad activa | `PERSONAJES` | El campo `ability` de ese personaje + su rama en `useAbility()` |
| Tocar el códice | `LOGROS` (cerca) | `renderCodex()`, `codexSeeEnt()` / `codexSeeItem()` |
| Tocar las paredes atravesables | `MONTAJE DEL NIVEL` | El bloque que talla `G.noclips` + `updateNoclips()` |
| Curar una zona concreta | `DAÑO POR ZONAS` | `bandagePart()` (compartida por la tecla R y el clic en el maniquí) |
| Tocar el códice (qué se ve, cómo se ve) | `LOGROS` (cerca) | `renderCodex()`, `entityIcon()`, `itemIconCanvas()` |
| Tocar la música o el ambiente | `AUDIO` | `musicModeFor()`, `AMB_FLAVOR`/`ambientFlavorFor()`, `applyLevelAudio()` |
| Tocar la melodía | `MÚSICA Y AMBIENTE` | `MEL_SCALES`, `melodyFor()`, `updateMusic()`, `Audio_.pluck()` |
| Tocar la música que sube el jugador | `TU MÚSICA` | `USER_TRACKS`, `addUserTracks()`, `userMusicPlay()` (IndexedDB `zumbido.music`) |
| Cada cuánto se reordena el nivel | `EL NIVEL SE REORDENA` | `shiftDelay()`, y cuánto cambia en `shiftMaze()` |
| Cuánto cuesta cruzar una salida | `USO DE OBJETOS` (tras `interact()`) | `CROSS_TIME` por tipo de salida |
| Cuántas salidas hay y lo lejos que están | `MONTAJE DEL NIVEL` | `nExits` y la lista `[0.68, 0.5, 0.3]` |
| Lo buena que es la brújula | `MAPA, CAMINO Y BRÚJULA` | `COMPASS_RANGE`, `compassSignal()`, `compassWobble()` |
| El mapa del descenso del juego | `MAPA DEL DESCENSO` | `renderDescentMap()`, `dmSelect()` |
| Una opción gráfica | `AJUSTES` | `OPT_ROWS` + `qualityRatio()`/`bumpMul()`/`applyFx()`… |
| El aspecto de los sprites | `PIXEL ART` | Se dibujan igual que siempre; `refineSprite()` les pone resolución, contorno y luz |
| El modo aleatorio | `MODO ALEATORIO` | `randomizeLevel()` (qué se baraja), `randomLevelId()` (adónde llevan las salidas) |
| Cuántas entidades como mucho | `MODOS DE JUEGO` | `DIFFS[x].maxEnts` (total), `chasers` (cuántas persiguen a la vez); 4 por especie en `buildLevel()` |
| Máximo de unidades por objeto | `INVENTARIO` | `STACK_BASE` + `DIFFS[x].stack` → `stackMax()` |
| Soltar / desechar | `OBJETO EN LA MANO` | `takeOut()`, `dropItem()`, `spawnDrop()`, `pickDrop()` |
| El aspecto de una salida | `SALIDAS: geometría por tipo` | `EXIT_PAINT` (texturas) y `buildExitMesh()` |
| Las pestañas de ajustes | `AJUSTES` | `OPT_TABS` y `OPT_TAB_OF` (qué ajuste va en cuál) |
| Una acción nueva con tecla | `JUGADOR` | Añadirla a `ACTIONS` y su rama en `doKeyAction()`; la tecla se lee siempre con `kb("id")` |
| Qué hace cada botón del mando | `MANDO` | `pollPad()` (en partida) y `padMenu()` (menús) |
| Un aspecto nuevo | `PERSONAJES` (cerca) | `SKINS`: `pal`/`opts` que se superponen a los del personaje, y `need` |
| La ropa de un personaje | `PERSONAJES` | Las prendas de su `opts` (`vest`, `jacket`, `scarf`, `whistle`…); se dibujan en `drawHumanoid()` |
| Los sprites de personas y entidades | `PIXEL ART` | `drawPerson()` (personas, con `gaitPose()` para el paso), `drawHoundHD()`… (animales), `finishHD()` (contorno y luz) |
| Las figuras de 8 bits en 3D | `8 BITS EN 3D` | `rigHuman()` y `rigHound()`… (los modelos), `RIG_POSE` (las animaciones), `GEAR` (lo que llevan en la mano) |
| El modo Agente del M.E.G. | `MODO AGENTE DEL M.E.G.` | `MEG_TIPOS` (los encargos y lo que pagan), `megNueva()`, `megEvent()` (qué los hace avanzar), `MEG_TIENDA`, `MEG_PREMIOS`; los trajes, en `SKINS` con `need:{meg:N}` |
| Cuánto aguanta un arma | `OBJETOS` | `ITEMS.xxx.uses`; el desgaste está en `G.wear[id]` y lo gasta `wearWeapon()` |
| La voz y los gestos | `MULTIJUGADOR` | `VOZ_CERCA`/`VOZ_LEJOS`, `vozDistancia()`, `GESTOS` y sus posturas en `RIG_POSE` |
| El multijugador | `MULTIJUGADOR` | `MP_REENVIA` (qué reenvía el anfitrión), `mpRecibir()`, caer/reanimar en `goDown()`/`reviveMe()` |

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

## 6½. Sistemas de la tanda grande (1.5.0)

Cinco piezas nuevas que comparten un patrón: todas viven fuera de `G.inv`, así que no
compiten por los cuatro huecos rápidos.

- **Armas de mano** (`ITEMS.pipe/rebar/bat`, campo `weapon:true`). Se guardan en
  `G.weapons.L` / `G.weapons.R`, no en `G.inv`. `addItem()` las reparte a la primera mano
  libre; desde 1.6.0 una tercera va a la mochila (antes se perdía) y `weaponClick()` las
  pasa de la mochila a una mano y al revés. `swingHand("L"|"R")` busca al `walker` más cercano dentro
  de `reach`, le pone `stun` y lo empuja; cada mano tiene su propio `G.weaponCd`.
- **Habilidad activa** (`CHARACTERS[x].ability`). `useAbility()` es un único `dispatch`
  por `ability.id` (`pulse`/`loot`/`shield`/`calm`). El cooldown es un solo número,
  `G.abilityCd`, que cualquier personaje nuevo reutiliza con sólo darle otro `id`.
- **Códice** (`G.codex.ent` / `G.codex.item`). Se marca visto en el mismo sitio donde ya
  se generaba la entidad (`makeEntity`) o se recogía el objeto (`addItem`), así que un
  nivel o un objeto nuevo queda documentado sin tocar `renderCodex()`.
- **Paredes atravesables** (`G.noclips`). Se tallan en `buildLevel()` junto a los
  contenedores, como pares de marcadores pegados a una pared (`wallSpot()`, igual que un
  casillero). `updateNoclips()` mide la distancia del jugador a cada marca del bucle
  principal; no tocan `G.grid`, así que no pueden romper la conectividad del laberinto.
- **Sin retorno sin guardar** (`DIFFS[4].noSave`). Un booleano que `saveGame()` y
  `useOutpost()` comprueban antes de escribir nada. Si se añade un quinto modo de
  dificultad, hereda el comportamiento sin tocar el guardado.

## 6¾. Música y ambiente (1.5.1)

No hay archivos de audio, así que la "música" es WebAudio puro, igual que el resto del
sonido del juego: un acorde de cuatro osciladores (`Audio_.musicVoices`) que se desliza
muy despacio de una nota a otra con `setTargetAtTime` — nunca salta, nunca hay un click.

- **`musicModeFor(cfg)`** decide la raíz y los intervalos según `cfg.risk` (0-3):
  consonante y grave-suave en los niveles seguros, un clúster de segunda menor pegado a
  la raíz en los letales. Un asentamiento (`cfg.settlement`) suena siempre como riesgo 0,
  aunque su campo `risk` diga otra cosa.
- **`AMB_FLAVOR` / `ambientFlavorFor(cfg)`** añade un sonido suelto según `cfg.deco`:
  goteo de agua en `sea`/`pool`/`caves`, viento en `field`/`suburb`, chispazos en
  `electrical`/`pipes`. `updateAmbient(dt)` lo dispara con un temporizador (`G.ambTimer`),
  igual que `updateScares()` ya hacía con los sustos.
- **`applyLevelAudio()`** junta el hum, la música y el ambiente en una sola llamada; la
  usan `beginPlay()` y `resumeGame()` para no repetir los mismos números en dos sitios.
  `pauseGame()`, `toTitle()` y `die()` bajan `musicGain`/`ambGain` igual que ya hacían con
  `humGain`.
- **No se puede verificar de oído.** `pruebas/curacion.js` prueba los números que deciden el
  sonido (la raíz baja con el riesgo, el sabor coincide con el `deco`), no el sonido en
  sí. Si tocas esto, compruébalo jugando.

## 6⅞. La tanda 1.6.0

- **Ataques especiales.** Las diez entidades tienen `sp.reach`/`windup`/`cd`; antes seis
  no los tenían y su especial sólo salía si perdías el forcejeo entero, así que no se veía
  nunca. Mientras cargan se plantan (`step × 0.08`), se tiñen de rojo (`spTint()`) y sale
  un cartel grande con barra (`#spwarn`, `G.spWarn`). Un aturdimiento o un agarre cancela
  la carga (`cancelSpecial()`).
- **Casilleros.** `rollDice()` sólo da un 1 con un 1 natural: la dificultad baja la
  calidad del botín, no lo vacía. Lo que no cabe se queda en `c.left` y `takeLeftovers()`
  lo recoge al volver.
- **Salidas.** Menos (2-3) y más lejos, y hay que **mantener E** el tiempo de
  `CROSS_TIME` sin alejarse; hace ruido y un agarre la corta (`updateCrossing()`).
- **El nivel se reordena.** Los muros son un `InstancedMesh` con `SHIFT_SPARE` bloques de
  reserva escondidos; `G.wallInst` dice qué bloque ocupa cada celda. `shiftMaze()` abre
  muros entre pasillos, cierra pasillos comprobando con un BFS que no se incomunica nada
  (si un cierre rompe algo, se deshace) y a veces mueve una salida. Sólo toca celdas que el
  jugador **no ve** y que no tienen nada encima (`cellBusy()`). Desactivado en
  multijugador: cada jugador lo haría distinto y dejaríais de compartir laberinto.
- **Fauna fiel a la wiki.** Revisada nivel a nivel contra la sección *Entities* de cada
  artículo. Varios niveles se han quedado sin entidades del catálogo porque la wiki no
  documenta ninguna (Level 0, 6, 7, 37…): su peligro es el propio nivel.
- **Sprites.** `refineSprite()` pasa cada atlas por Scale2x y le pone contorno, luz de
  borde y oclusión. Las texturas quedan al doble de tamaño; **los iconos miden
  `ICON_PX` (32)**, así que cualquier sitio que los pinte tiene que usar un canvas de ese
  tamaño o `drawImage(icono, 0, 0, ICON_PX, ICON_PX)`.
- **Modo aleatorio.** `G.randomMode` hace que `instantiate()` devuelva una **copia**
  barajada del nivel del catálogo (fauna, casilleros, puesto, zonas especiales y un
  `risk` recalculado con la fauna), nunca el objeto de `CAT`, que queda intacto. Todo sale
  de la semilla del nivel mezclada con su id, así que el nombre que anuncia una salida es
  el nivel que te encuentras al cruzarla. Las salidas ignoran `exitsTo` y usan
  `randomLevelId()`. Se guarda con la partida (`randomMode` en el guardado) y el
  multijugador siempre arranca en modo normal.
- **Tu música.** Se guarda en IndexedDB (`zumbido.music`, almacén `tracks`) y suena por un
  `<audio>` enchufado a WebAudio con `createMediaElementSource`, así que respeta el volumen
  general y el de música. Si IndexedDB no existe (ventana privada), dura sólo la sesión.

## 6⁹⁄₁₀. La tanda 1.7.0

- **Fauna.** `DIFFS` lleva ahora `maxEnts` (techo total), `chasers` (cuántas persiguen a la
  vez) y `stack` (ajuste del máximo por objeto). En `updateEntities()` se calcula `libres`:
  las `chasers` entidades más cercanas que te persiguen; el resto está `rondando` a ~8 m y
  no carga especiales. `G.spGate` es una pausa global de 5 s entre especiales, y
  `G.spWarn` impide que empiece otro mientras uno carga.
- **Inventario.** `invCount()` cuenta huecos (`G.inv.length`), no unidades. `addItem()`
  rechaza si el objeto está en su `stackMax()` o si no queda hueco para uno nuevo.
  `G.drops` son objetos soltados en el suelo de este nivel; `cellBusy()` los respeta al
  reordenar el laberinto.
- **Uso rápido** (`G.opts.quickUse`, por defecto activado): `QUICK_USE` son los objetos que
  se gastan al primer toque desde las teclas o la mochila.
- **Curar por zonas.** `toggleHeal()` / `renderHeal()`, con `healOpen` igual que `bpOpen`:
  suelta el ratón sin pausar.

## 6¹⁰. La tanda 1.8.0

- **La red es una estrella.** Cada invitado sólo está conectado al anfitrión. Hasta 1.8.0 el
  anfitrión no reenviaba nada, así que **los invitados no se veían entre sí**. Ahora reenvía
  todo lo de `MP_REENVIA` añadiendo `from` (el id del que lo mandó), y todos indexan a los
  demás por `m.from || c.peer`.
- **Modo de sala.** `MP.modo` lo elige el anfitrión y viaja en `sala` y en `nivel`; el modo
  aleatorio funciona en multijugador porque todo sale de la semilla del nivel.
- **Caer y reanimar.** `die()` con amigos en pie llama a `goDown()`: `G.downed`, 40 s, sin
  daño ni agarres ni especiales. Reanimar es mantener la tecla de usar 3 s junto al caído con
  un botiquín (`startRevive`/`updateRevive`), que manda `revivir` con `to`. Si se acaba el
  tiempo o no queda nadie en pie, `die()` de verdad (con `dieForce`).
- **Los fantasmas se recrean al cambiar de nivel**: `buildLevel()` tira el `world` entero, y
  sus sprites se quedaban colgando de un mundo que ya no se dibujaba.
- **Aspectos.** `skinAtlas(ch, skin)` construye el atlas bajo demanda. El progreso
  (`G.prog`: `rand`, `mp`, `rev`) y lo elegido (`G.skins`) van en el meta, y
  `wipeProgress()` los borra.
- **Teclas.** Todo lo que antes miraba `keys["e"]` mira `keys[kb("use")]`. El cambio de
  tecla se captura con un `keydown` en fase de captura, antes que el del juego.

## 6¹¹. La versión 2.0.0: ropa, sprites nuevos y 8 bits en 3D

- **Sprites.** David pidió que se parecieran a los de Backrooms No-Clip (pixel art plano, nítido,
  contorno oscuro, luz cenital). `drawPerson()` dibuja a 1 píxel en celdas de 48×72: es un
  esqueleto 2D y `gaitPose(col)` da los ángulos de cada fotograma (columnas 0-3 andar: neutro,
  zancada, neutro, zancada; 4-7 correr); filas 0 frente, 1 perfil a la derecha, 2 espalda, 3
  perfil espejado. Los animales (`drawHoundHD`, `drawCrawlerHD`, `drawClumpHD`) van en celdas de
  64×48 y el Smiler y la Deathmoth en 48×48. `buildAtlas(cols, rows, dibujo, cw, ch, flat)`
  guarda `cw`/`ch` y `makeSprite()` saca el ancho del plano de ahí, para que los píxeles sean
  cuadrados (antes todo se estiraba al `w`×`h` de la entidad). `finishHD()` pone el contorno
  de 1 px y la luz; lo semitransparente (la sombra del suelo) no cuenta. Ya no hay Scale2x en
  los personajes: `refineSprite()` sólo lo usan los iconos.
- **Ajuste «Personajes»** (`G.opts.figs`): 0 sprites (por defecto), 1 muñecos 3D. Se cambió la
  clave (antes `voxel`) para que quien ya tuviera guardado el 3D vea los sprites nuevos.
- **Ropa.** `drawPerson()` y `rigHuman()` entienden prendas en `opts`: `vest`, `jacket` (+`jacketShade`,
  `patches`), `strap`, `scarf`, `pendant`, `whistle`, `badge`, `tie`, `cross`, `number`,
  `stripe`, `torn`, `skates`, `bandages`, `goggles`, `visor`, `pattern`, `partyhat`. Un aspecto
  quita la ropa del personaje (la lista `ROPA`) y pone la suya; lo que no es ropa (la coleta,
  la silueta) se conserva.
- **Muñecos de vóxeles.** Una primera versión sacaba los cubitos del propio sprite (extruido)
  y no gustó: se quedaba en un cartón con grosor. Ahora cada figura se modela aparte:
  - `vgrid()` es una rejilla de cubitos con `box()` y `paint()` (repinta sólo donde ya hay,
    como el `source-atop` de los sprites). Un color con `!` delante brilla (va a una malla con
    `MeshBasicMaterial`): ojos del Smiler, del Hound, de Lázaro y del Wretch, la linterna.
  - `rigHuman(look)` monta el humano con la paleta y las prendas del aspecto (las mismas
    `opts` de `drawHumanoid()`); `rigHound/Crawler/Clump/Smiler/Moth` los animales. Cada
    pieza tiene su padre y su articulación (`at`, en cubitos); un humano mide 36 cubitos,
    como su sprite.
  - `rigTemplate()` hace las mallas una vez por aspecto y tamaño (en `atlas.rigT`, con
    `userData.keep`) y `makeRig()` monta un `Group` por figura. El grupo lleva `material`
    como si fuera una malla, para que el tinte del especial y la opacidad de los amigos sigan
    funcionando sin tocarlos.
  - La animación la hace `rigAnimate()` desde `billboard()`: mide la velocidad por lo que la
    figura se ha movido desde el fotograma anterior (un salto de más de 1,5 m es un
    teletransporte y no cuenta), y `rigPose()` —función pura— da los giros de cada pieza.
    Las posturas especiales se piden con `userData.pose` (`held`, `grab`, `stun`, `wind`,
    `chase`, `down`), el golpe con `userData.swing` y lo que lleva en las manos con
    `userData.gearL/gearR`. `setFrame()` no hace nada con una figura: se anima sola.
  - `actorDown()` tumba la figura (o aplasta el sprite) al caer en multijugador.

## 6¹². La versión 3.0.0: niveles, modo Agente, objetos, voz y gestos

- **Quince niveles** con su lore leído de la wiki y enlazados desde donde la wiki dice que se
  entra (el 74, desde el 68, que también es nuevo). Los que en la wiki salen a niveles que el
  juego no tiene van a `"deep"`. El 11.2 es un asentamiento (`settlement:true`): la Base Omicron.
  `herramientas/anexo.js` regenera el mapa del descenso con ellos.
- **Armas que se rompen.** El desgaste va por id en `G.wear` (sólo se puede llevar una de cada),
  se guarda con la partida, viaja al suelo con `spawnDrop(…, wear)` y vuelve con `pickDrop()`.
  `wearWeapon()` compara con `1e-6` y no con 0: veinticuatro restas de 1/24 dejan 1e-16 y el bate
  aguantaba un golpe de más.
- **Objetos.** `EQUIP_IDS` sale de `ITEMS` (los que llevan `equip`): antes la lista de equipo
  estaba escrita a mano en cinco sitios. `meg:true` marca los tres del modo, que no entran en
  `TIERS`. Los efectos con tiempo (`G.boostT`, `G.bloatT`, `G.camCd`, la extracción, los
  fogonazos del Firesalt) los descuenta `updateWeapons()`, que corre cada fotograma.
- **Modo Agente.** `G.megMode` y `G.meg = {q, ofertas}` van con la partida; las fichas y la cuenta
  de misiones, en `G.prog` (entre partidas). El tablón se monta junto al puesto de cada base
  (`buildMegBoard()`, desde `buildOutpost()`), y `megEnterLevel()` se llama al final de
  `buildLevel()`. El maletín y el explorador perdido se colocan con un BFS desde donde apareces,
  entre el 55 y el 90 % de la distancia máxima.
- **Voz.** Cada jugador manda siempre el mismo flujo (`createMediaStreamDestination()`) y el micro
  se engancha a él con una ganancia de 0 o 1: así la llamada no hay que renegociarla. Entre cada
  pareja llama el de id menor. Chrome sólo deja pasar a WebAudio el audio de WebRTC si el flujo
  está también en un `<audio>` (aunque esté en silencio). Nada de esto se puede probar en el banco:
  allí `MP.peer.call` no existe y las funciones lo comprueban antes de usarlo.
- **Gestos.** `hacerGesto()` manda `{t:"gesto"}` (el anfitrión lo reenvía) y `mostrarGesto()`
  pone el bocadillo; con los muñecos 3D, la postura va en `userData.pose` (`wave`, `point`,
  `stop`, `bow`, `cheer`).

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

**Reiniciar progreso tiene que tocar TODO lo que persiste, no sólo `localStorage`.**
`wipeProgress()` borraba `META_KEY` del `localStorage` pero se olvidaba de `G.codex` en
memoria (1.5.1). El bug no se veía al momento: se veía en la **siguiente** partida, cuando
`codexSeeEnt()`/`codexSeeItem()` volvían a llamar a `saveMeta()` y reescribían el códice
viejo encima del que acababas de borrar. Si añades un nuevo `G.algo` que se guarde junto a
`G.unlocked`/`G.ach`/`G.codex`, añádelo también a `wipeProgress()` — y prueba el flujo de
**las dos pulsaciones** (arma → confirma), no sólo una, o el test no lo va a pillar.

**Un objeto "de equipo" sin un `else if` en `useItem()` no falla: se queda mudo.**
Antes de 1.5.1, usar el mapa, la brújula o la mochila una segunda vez no hacía nada — ni
error, ni aviso, sencillamente atravesaba todos los `if/else if` sin entrar en ninguno.
Se sentía roto aunque técnicamente no lo estaba. Si añades un objeto `equip:true` sin
una acción de "uso" real, dale al menos un `toast()` de vuelta.

**Todo texto que el código escribe tiene que pasar por `tx()` o `txf()`, también al *restaurarlo*.**
«Borrar progreso» volvía en español con el juego en inglés porque, tras borrar, el código le
devolvía el texto con `btn.textContent = "Borrar progreso"`. Buscando el mismo patrón (1.6.0)
salieron más: la frase de muerte de las diez entidades (no tenían `death_en`), las muertes
por hemorragia o cordura, las pistas del objeto en la mano, los controles de la pausa (sin
`data-en`), el sello «Catalogado» y la lista de «Tu música», que se pinta al arrancar y no se
repintaba al cambiar de idioma. `pruebas/mundo.js` busca ahora esos patrones en el código.
Si algo se pinta una sola vez, `applyLanguage()` tiene que volver a pintarlo.

**Lo semitransparente tiene que llevar `depthWrite:false`.**
El personaje «desaparecía» al pisar una zona de clipping: la columna de luz de la salida
era un cilindro transparente que escribía en el búfer de profundidad, y al estar el
jugador dentro, lo tapaba. Y un bucle de animación (`updateLights`) les forzaba la
opacidad a 0,4-0,9 cada fotograma, así que daba igual lo tenue que se pusiera el
material: ahora late sobre `material.userData.base`.

**Ningún texto puede llevar una tecla escrita a mano: se nombra con `tag("accion")`.**
Con mando el juego seguía enseñando «[E]», «[C]», «CLIC IZQ»… (y con teclas cambiadas,
también las de siempre). Ahora `INPUT` dice qué se tocó lo último (`setInput()` desde el
teclado, el ratón o `pollPad()`), y `btn()`/`tag()` devuelven la tecla o el botón del mando
(`PAD_BTN`). En los datos (fichas de objetos) se escribe `{crowbar}` y lo traduce `keyify()`.
Con mando, la mochila y el panel de curar se manejan con `padPanel()`. `pruebas/multijugador.js` busca
teclas escritas a mano en el código.

**`world` se reasigna en cada `buildLevel()`.**
Cualquier referencia guardada a `world` de antes de cambiar de nivel apunta a un grupo que ya
no se dibuja: lo que añadas ahí no sale en pantalla. Por eso los compañeros de multijugador se
recrean si `o.mesh.parent !== world`.

**El compañero de multijugador siempre salía de espaldas (3.0.1).**
Su sprite usaba la fila (frente, perfil, espalda) que calculaba SU juego con SU cámara, que
siempre está detrás de él. La fila hay que calcularla en cada ordenador con la cámara propia
y hacia dónde mira el compañero (`player.facing`, que es lo que se manda ahora).

**PeerJS no siempre avisa cuando el otro cierra la pestaña.** El `close` de una conexión
puede no llegar nunca, y el invitado se quedaba «conectado» a una sala que ya no existía.
Por eso hay un latido (`{t:"latido"}` cada 2 s en `mpVigilar()`): una conexión que lleva 15 s
callada se da por cerrada. Además, al cerrar la pestaña (`pagehide`) se destruye el peer para
que el nombre de la sala quede libre al momento, y una sala vacía se cierra a los 10 minutos.

**Clones al darle a «Entrar» después de «Crear sala».** `mpEmpezar()` creaba un peer nuevo
sin cerrar el anterior, y el nuevo se conectaba a la sala del viejo: el mismo jugador otra
vez. Ahora cierra lo que hubiera antes, ignora mensajes de uno mismo y, dentro de una sala,
los botones de crear y entrar se sustituyen por «Salir de la sala».

**La voz por WebAudio no pasa por la cancelación de eco.** El navegador sólo cancela el eco
de lo que suena por un `<audio>`; con WebAudio y altavoces, tu compañero se oía a sí mismo.
La voz sale por el `<audio>` (con `el.volume` según la distancia) y WebAudio sólo la mide.
Probarla de verdad: dos pestañas del navegador integrado se conectan por el broker de PeerJS;
basta sustituir `navigator.mediaDevices.getUserMedia` por un oscilador para tener «micro».

**Con el ratón capturado no se puede hacer clic en el HUD.**
La mochila desplegable (1.5.0) decía «clic para cogerlo», pero con el *pointer lock* puesto
los clics nunca le llegaban. Ahora abrirla suelta el ratón (sin pausar: el manejador de
`pointerlockchange` mira `bpOpen`) y cerrarla lo vuelve a capturar.

**`#hud` tiene `pointer-events:none`: todo lo clicable dentro tiene que pedir `auto` (3.0.1).**
Por eso usar, soltar y desechar en la mochila no hacían nada: los clics atravesaban el panel,
caían en el `<canvas>` del juego y su manejador cerraba la mochila. Les pasaba lo mismo al
tablón del M.E.G., a los gestos y al maniquí de vitales. `pruebas/inventario.js` lo comprueba
para cada uno; si añades un panel con botones al HUD, añádelo a esa lista.
Y al cambiar de un panel a otro, el que se cierra no debe volver a capturar el ratón
(`closeBackpack(true)`, `closeMegBoard(true)`): `requestPointerLock()` es asíncrono y la
captura llegaba cuando el panel nuevo ya estaba abierto. Por si acaso, `pointerlockchange`
suelta cualquier captura que llegue con un panel abierto.

**La mochila (3.0.1) es un cajón con selección: `BP.sel`.** `bpEntries()` da la lista (manos,
huecos, equipo) y `bpDo("main"|"drop"|"trash")` actúa sobre lo elegido; ratón, teclado
(`bpKeyAction()`) y mando (`padPanel()`) pasan todos por ahí. Tras actuar, la selección sigue
al objeto (un arma que cambia de mano) o pasa al que ocupa su hueco. Desechar pide dos
pulsaciones en 3 s (`BP.armed`).

**El banco de pruebas se engancha en el ÚLTIMO `resize();`.**
Inyecta la exportación de símbolos justo antes. Hasta 1.6.0 usaba el primero, y en cuanto
`applyQuality()` llamó a `resize()` la exportación acabó dentro de esa función y ninguna
prueba arrancaba.

**Three.js tiene que ser 0.150.1.**
Las versiones a partir de la r160 quitaron el build UMD, que es el que permite cargarlo
con una sola etiqueta `<script>` sin módulos.

---

## 8. Comprobar que no has roto nada

Mientras tocas algo, la versión rápida (alrededor de un minuto):

```bash
node pruebas/todo.js rapido
```

Antes de commitear, la completa (7-8 minutos):

```bash
node pruebas/todo.js
```

Las dos cargan el juego sin navegador y hacen lo mismo; la rápida con menos semillas y
menos vueltas en las tres pruebas pesadas (`niveles`, `mundo` e `inventario`). Lo que mira
cada una está explicado en [pruebas/README.md](pruebas/README.md).

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
