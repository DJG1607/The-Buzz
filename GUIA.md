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

Desde 4.0 hay **salas grandes** (hasta 10) con el reenvío adelgazado y la voz limitada a los más
cercanos; está explicado en la sección 6¹⁴.

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

## 6¹³. El modo pruebas (3.0.2)

**Quitarlo del juego:** `const MODO_PRUEBAS = false;` y el código Konami deja de hacer nada
(también se ignora lo que hubiera guardado el navegador). Dentro del juego se apaga con el
mismo código o con «Salir del modo pruebas» en la pausa.

**La contraseña.** Encender pide una contraseña (`trucoPedir()` abre `#trucoBox`). En el código
no está escrita: sólo su huella FNV-1a (`TRUCO_HUELLA`, con `trucoHuella()`), y el jugador la
saca de `TRUCO_PIEZAS`, un acertijo de cuatro piezas en español y en inglés, cada una cifrada de
una forma y con su pista; cada pieza da un trozo y hacen falta las cuatro. Acertarla guarda la
huella en `localStorage["zumbido.pruebas.llave"]` y el código ya no la vuelve a pedir; apagar
nunca la pide. Si cambias la contraseña, regenera las piezas y la huella a la vez:
`pruebas/inventario.js` descifra el acertijo con sus propias pistas y comprueba que dé la
huella, así que no se puede quedar sin solución. No escribas la contraseña ni la llave en claro
en el repositorio (ni en las pruebas): es público.

El código Konami (↑↑↓↓←→←→BA) enciende o apaga `TRUCO.on`, que se guarda aparte del progreso
(`localStorage["zumbido.pruebas"]`). Todo lo que desbloquea es **virtual**: se mira `TRUCO.on`
en `charUnlocked()`, `skinUnlocked()`, el códice, el mapa del descenso y `megFichas()` (9999),
así que al apagarlo no queda rastro en `G.unlocked`, `G.codex` ni `G.prog`. Comprar en el tablón
no descuenta fichas y `unlockAch()` no da logros. `resetRun()` llama a `trucoDarTodo()`, que
también está en la pausa junto a `TRUCO.god` (lo miran `hurtPlayer()` y `die()`) y a
`trucoViajar(id)`, que sale como botón en `dmSelect()` si el mapa se abrió desde la pausa.
Si añades algo que se desbloquea, que mire `TRUCO.on` en su comprobación en vez de escribirlo
en el progreso.

## 6¹⁴. La versión 4.0: ropa, animaciones, versión y salas grandes

La versión es exactamente `"4.0"` (`VERSION`), no `4.0.0`. `cmpVersion()` compara número a número
y trata lo que falta como cero, así que `4.0` = `4.0.0`.

**Ropa y protecciones.** `CLOTH` (casco, mascarilla, chaleco, traje, guantes, botas) está en la
sección ROPA Y PROTECCIONES: cuatro ranuras (`CLOTH_SLOTS`), `parts` = zonas del cuerpo que
protege, `absorb` = fracción del golpe que se come y `dur` = daño que aguanta antes de romperse.
`hurtPlayer()` pasa cada golpe por `clothProtect(partId, dmg)`, que lo reparte entre las prendas
que cubren esa zona, las desgasta (`G.wear`, igual que las armas) y, a cero, las rompe
(`clothBreak`). Protege menos según se gasta (`clothAbsorb`: 100 % nueva, 60 % casi rota). Lo
puesto vive en `G.worn` (`wornRaw()`), se guarda en la partida (`saveGame`/`applySave` lo
limpian si viene raro) y aparece como cuarta sección del cajón («Puesto»). Soltarlo usa la mano
ficticia `"w:<ranura>"` en `takeOut()`.
`hasItem(id)` cuenta también lo que llevas **puesto**; para saber si está en la mochila, usa
`invFind(id)`. Y lo que se encuentra por ahí viene **ya usado** (`addItem` pone un desgaste al
azar): en una prueba que mida números, fija `G.wear[id]` antes de ponértelo.

**Aspecto.** `wornKey()` da una firma («bhVg»: mochila, casco, chaleco muy gastado, guantes;
mayúscula = por debajo del 30 %). `skinAtlas(chId, skinId, gk)` con `gk` crea un atlas por
combinación (`lookConRopa()` aplica cada prenda sobre el aspecto del personaje) y lo guarda en
`SPRITES`; sin `gk` es el de siempre. La mochila se ve en **cualquier** personaje porque la «b»
la dibuja `lookConRopa`, no el aspecto de cada uno. El jugador (`refrescarAspecto()`) y los
compañeros (el `pos` lleva `gk`, que se limpia con `cleanKey()`) rehacen su figura cuando cambia.

**Animaciones.** `ACCIONES` (ponerse ropa, beber, vendarse, agacharse, recibir golpe),
`playAct(kind)` y `updateAct(dt)`: la figura 3D toma una postura de `RIG_POSE`, el sprite se
estira/agacha/sacude (`actSprite`), y a los compañeros les llega `{t:"accion", a}`. El golpe
tiñe un instante al jugador (`tinteJugador`). Hay chispas (`chispas`/`updateFx`) al absorber y al
romperse una prenda.

**El caído (sprite).** Fila 4 de `personAtlas()` (`FALLEN_ROW`): cuerpo tumbado de lado, con
dos fotogramas respirando, dibujado como cartel a `FALLEN_SCALE` (×1,35). La versión «vista
desde arriba» que hubo en 3.0.5 no se leía en el mundo; si la tocas, mírala dentro del juego.

**Versión en Ajustes.** `#verBox`: «Buscar actualización» (`comprobarVersion`) vuelve a pedir esta
misma página con `cache:"no-store"` y `?v=<hora>` y lee `const VERSION = "…"` con una expresión
regular, así que **no cambies la forma de esa línea**. Desde `file://` no se puede y lo dice.
En multijugador cada `hola` lleva `v`; si no coincide, `mpAvisarVersion()` avisa una vez.

**Salas grandes.** El que crea la sala elige «Cuadrilla» (4) o «Sala grande» (10) (`MP.tam`, `MP.grande`,
`MP_CAP`); el invitado lo sabe por el mensaje `sala` (`grande`). Si no cabe, el anfitrión manda
`{t:"lleno", cap}` y cierra (`mpLlena()`); quien ya estaba y se reconecta ocupa su sitio. **No hay
servidores por jugador ni por sala:** la sala vive en el navegador del anfitrión y el servidor
gratuito de PeerJS sólo sirve para que se encuentren, así que el límite es la conexión y el equipo
del anfitrión. En estrella, cada posición se reenvía a todos los demás (crece con el cuadrado de
los jugadores), por eso en sala grande: `mpPosDebe()` adelgaza el reenvío (lejos de ti, una de
cada tres; otro nivel, una de cada seis), el `pos` corto no lleva arma ni ropa salvo una vez por
segundo (el receptor sólo actualiza `gl/gr/gk` si vienen), la posición sale cada 0,12 s, los
jugadores a más de 34 m no se dibujan y la voz (que es malla: n−1 llamadas por persona) se
limita a los 3 más cercanos de tu nivel (`vozElegir()`, con histéresis, cada 1,5 s). Si subes el
tope de 10, mide primero lo que sube la subida del anfitrión (~9×8 mensajes por ronda).

**Sala pública y walkie (4.0, segunda tanda).** *Sala pública* = botón en la pantalla de multijugador:
sólo se pone el nombre. Como el servidor gratuito de PeerJS no da lista de salas, se usan nombres
fijos «publica-1»…«publica-6» (`MP_PUB_SALAS`): `mpPublica()` → `mpPublicaIntento()` reclama el
nombre como anfitrión; si el servidor dice `unavailable-id` ya hay anfitrión y se entra como
invitado; si dice `lleno` (o no responde, o `peer-unavailable`) se prueba la siguiente
(`mpFalloAlEntrar(msg, true)`; los errores de red no, porque saldrían seis fallos seguidos).
`PUB` guarda la búsqueda y `mpSalir(true)` la conserva (un `mpSalir()` normal la cancela). Se entra
**directo al juego**: `mpEntrarPublica()` hace `startRun` + `beginPlay` sin ficha de nivel y
`mpPedirPersonaje()` abre `#pickScreen` (con la partida en pausa; `resumeGame()` no deja saltarlo con
Escape) para elegir el personaje **dentro** del juego. `mpElegirPersonaje()` rehace el inventario
conservando nivel y semilla. El invitado espera a recibir el `nivel` del anfitrión para entrar. Si
cae el anfitrión de una sala pública, `mpSoltar` no te saca a solitario: la partida sigue y se
vuelve a buscar sala desde la 1 (el primero que reclame el nombre es el nuevo anfitrión) sin volver a
pedir personaje. La sala pública es siempre «grande».
*Walkie-talkie* (`walkie`, equipo, no ocupa hueco): quien lo lleva oye por voz a otro que también lo
lleve **en cualquier nivel o distancia** (`vozRadio()`, volumen mínimo 0,7 en otro nivel y 0,55 en el
mismo) y en sala grande entra en el reparto de voces (`vozGestionar`). El `pos` lleva `rd`. En
multijugador todos bajan con uno (`startRun`); también sale de casilleros y se compra. El chat de
texto ya iba con [Enter] en cualquier sala; ahora hay una pista permanente (`#chatHint`,
`mpChatHint()`) porque no se descubría.

**Contador de visitas (4.0).** GoatCounter, sitio `buzzzumb` (panel: https://buzzzumb.goatcounter.com,
sólo lo ve el autor con su cuenta). `contarInicio()` añade el script **a demanda** (no hay `<script>`
fijo, como con PeerJS: sin internet el juego arranca igual) y `contar(ev)` apunta eventos
(`juego/partida`, `partida-multijugador`, `partida-meg`, `partida-aleatoria`, `sala-publica`,
`sala-creada`, `sala-entrar`). `contarOk()` decide si cuenta: sólo con http(s) y fuera de
localhost, con la opción «Contar mi visita» activada (Ajustes → Partida, `G.opts.stats`) y sin el modo
pruebas. Cualquier fallo de GoatCounter se traga. Si añades un evento nuevo, que sea con `contar()`
y que no lleve nombres ni nada personal. El README avisa de que se cuentan visitas de forma anónima.

## 6¹⁵. La versión 5.0: modo historia, Inés, 14 niveles, armas, equipo y emotes

**Modo historia.** Sección «MODO HISTORIA» del archivo (antes del BUCLE), con su CSS y su HTML entre
marcas propias. Reutiliza el motor de los niveles normales:

- *Mapas*: `HIST_MAPAS[id]` (los crea `histNivel()`) es como una entrada de `CAT` con `hist:true`.
  `instantiate("h:id")` lo devuelve y `buildLevel()` monta la rejilla con `histMapa()`: salas como
  rectángulos (`salas`), filas de texto o un **laberinto con semilla fija** con salas estampadas
  encima (`sellos`). `histConectar()` abre camino a lo que un sello deje aislado sin tocar muros de sala
  ni puertas. En un mapa de historia no salen salidas, casilleros, cintas, paredes falsas ni fauna al azar;
  después `histPoblar()` pone puertas (`puertas`: un muro sin bloque y con hoja que gira; abrir = la celda
  pasa a 0), muebles (`props`, `HIST_PROPS`), luces (`lamparas` o `lamparasMod`) y lo que pida el tramo.
- *Guion*: `HIST_CAPS.c1.tramos` es una lista de tramos `{id, titulo, mapa, pj, montar, run}`. `run` es
  una función `async` que recibe `E` (`histAPI()`): `E.dice(quien, es, en)`, `E.piensa`, `E.elige([[es,en]…])`,
  `E.sub` (frase sin parar el juego), `E.cine`/`E.linea` (pantalla negra, cintas VHS), `E.tel` (el móvil),
  `E.nota`, `E.objetivo`, `E.zona`/`E.cerca`/`E.usar`/`E.cuando` (esperas), `E.actor`/`E.ir`/`E.sigue`
  (personajes que andan por la rejilla), `E.enemigo` (el Acomodador o un Hound con ronda), `E.camara` (plano
  fijo)… Cada espera es una promesa que resuelve `histUpdate()` en el bucle; al cancelar (te pillan, sales)
  se rechazan todas con `HIST_CANCEL`.
- *Puntos de control*: cada tramo superado se guarda en `localStorage["zumbido.historia.v1"]`. Si te pillan,
  `histFallo()` vuelve a montar el tramo con las banderas de cuando empezó (salvo lo hecho que no se
  deshace: válvulas, fusibles, objetos cogidos).
- *Enganches en el motor*: `updatePlayer` (`histControl()`: bloqueado o andando solo), `updateCamera`
  (`histCamaraUpdate()`), `nearestFocus`/`interact`/aviso de [E] (cosas usables `kind:"hist"`), `doKeyAction`
  (`histTecla()`), el clic del ratón (`histClic()`), la pausa por soltar el ratón (`histAbierto()`), `skinAtlas`
  (los jugables de `HIST_PJ`), y en la historia no hay cordura, sustos al azar ni reordenar el nivel.
- *Videocámara* ([K], la tecla del gadget): `histCamara()` pone el filtro verde en el lienzo, cierra el
  campo de visión, enciende un foco infrarrojo que pesa más cuanto más oscuro está (`updateLights`) y hace
  visibles las mallas de `HIST.ocultos` (flechas de tinta invisible) y al Acomodador cuando va con
  `soloCamara`. La linterna del móvil es la de siempre, con `G.torchFuel` como batería del móvil.
- *Personajes*: `HIST_LOOK` (Owen, Danny, Maya, Rosa, June y el Acomodador) y `HIST_PJ` (los jugables). No
  están en `CHARACTERS`: no salen en la selección ni en la sala pública. Danny sólo se juega en los tramos
  con `pj:"danny"` (el interludio).
- *Probarlo*: `pruebas/historia.js` tiene un bot que juega el capítulo entero con las tres respuestas.
  Si añades un tramo nuevo con una espera rara (`E.cuando(fn)`), prefiere `E.cerca`/`E.zona`/`E.usar`: el bot
  sabe resolverlas. `HIST.inmune` (sólo para las pruebas) hace que los enemigos no te pillen.

**Segunda tanda de la 5.0** (después de probarla):

- *La casa a escala real*: el mapa `casa` va en celdas de **0,55 m** (`grid:31`, `wallH:2.4`), así los muros
  son tabiques. Las puertas ocupan **varias celdas** (`puertas.X.celdas:[[x,y],…]`; `histGruposPuerta()`
  junta las que se tocan y `histPuerta(celdas, ch, def)` hace una sola hoja con marco por las dos caras;
  `def.hacia:-1` la abre hacia el otro lado). `vanos` son huecos de paso sin puerta con dintel
  (`histVano`). Los muebles se arriman a su pared con coordenadas de celda **con decimales a lo largo de la
  pared**; `libre:true` lo deja en el punto (un sofá en medio del salón) y `rot` lo gira. Los bultos van con
  `histBulto(g, ancho, fondo)` (varios círculos a lo largo del mueble) y `obstacleAt` mira dos celdas
  alrededor cuando la celda es menor de 1 m. Muebles nuevos: inodoro, alfombra, lámpara de pie, cuadros,
  planta, mesilla, armario, cómoda, cocina, perchero y suelos de baldosa (`suelo`). Los muros de los marcos y
  dinteles usan `histMuroMat(ancho, y0, alto)`: la textura a escala de mundo, empezando a la altura buena
  para que el zócalo no salga en un dintel. Ojo: con `wallH` distinto de 2,4 la textura del muro se repite
  y el zócalo sale también arriba; por eso la casa mide 2,4 m de alto. Lámparas nuevas: `lampStyle:"plafon"`.
- *Maple Street*: mapa `calle` al aire libre (`ceil:null`, `lampStyle:"street"`), con coches, buzones,
  porches, calabazas, el parque y la gasolinera. **Rendimiento**: `HM()` comparte el material cuando no
  lleva extras (si algo tiene que cambiar de color él solo, pásale un extra, aunque sea `{}`: el volante de
  las válvulas lo hace) y `histFusionar()` funde, al acabar `montar`, las piezas iluminadas de los muebles
  quietos (`HIST_FIJOS`, sin `id`) en una malla por material. La calle pasó de unas 2.300 llamadas de
  dibujo a menos de 400. Las hojas y los charcos de `decorate("suburb")` eran una malla con su propio
  material cada una (miles): ahora son mallas instanciadas, también en los niveles normales.
- *Primera persona*: `G.opts.vista` (Ajustes → Controles, «Cámara en el modo historia») y la acción `view`
  (P). `primeraPersona()` sólo vale en la historia y sin agarre; `camaraPrimera()` pone la cámara a 1,58 m con
  balanceo al andar, oculta el sprite y usa `player.cansancio`, `player.ojoY` (bajar la cabeza al caer) y
  `player.inclina` (alabeo). `pitchMin()/pitchMax()` dejan mirar más arriba y abajo. Las escenas con
  `E.camara` siguen con su plano.
- *Cansancio*: `histFatiga(dt)` (desde `updatePlayer`, sólo en la historia y fuera de escenas). Sin
  aliento corriendo: tropieza y, si nada le persigue (`HIST.cazando`), se cae (`FALLEN_ROW`), se pone de
  rodillas y jadea con las manos en las rodillas; hasta el 40 % (15 % perseguido) no corre. La fila 7 del
  atlas (`FATIGA_ROW`, `FATIGA_POSE`) tiene esas posturas y gestos de conversación; `drawPerson` acepta en
  la postura `baja` (el tronco se dobla hacia la cámara) y `cabeza`. Los actores las usan con `E.gesto(id,
  "cansado"|"tropieza"|"arrodilla"|"habla"|"cruzado"|"nuca"|"suelo"|"sentado")`, gesticulan solos al hablar
  y cambian de postura de vez en cuando (`HIST_OCIO`). En 3D: poses `tired`, `stumble`, `kneel`, `talk`,
  `crossed`, `headrub`.
- *Música*: `MUS_PIEZAS` (9 piezas escritas como acordes + reglas por compás) y `musUpdate()` (desde
  `updateMusic`): programa los compases con antelación en el reloj de audio, alterna pieza y silencio, y
  añade la capa `persec` cuando `G.chasing`. Todo pasa por `melIn`/`melGain`, así que la pausa, el menú y
  «Música: ninguna» la callan sin código aparte. `musElegir(cfg)` decide por riesgo y decorado; en la
  historia manda `cfg.musica` del mapa, `T.musica` del tramo o `E.musica(id)`.
- *Sonido*: `Audio_.revIn` (reverberación con respuesta generada, `setReverb(cfg)` por nivel), `step()` según
  `cfg.floor[0]`, `ambienteLejano()` (golpes, pasos que se alejan, tuberías, una puerta) y `tone()` acepta un
  destino. En la historia: `HIST_VOZ` (cada uno suena distinto al escribir), puertas que crujen, jadeos,
  tropiezos y caídas.
- *Guion*: tramos nuevos `calle` (Maple Street: el coche de Danny, la llamada de Maya andando con
  `hLlamada()`, el cartel, el parque, Earl, el primer vistazo al Acomodador) y `nido` (la cena con June, con
  temas a elegir); además, comentarios de Maya por el Commons (`hComenta()`), la escena de la fuente, el
  campamento de Danny y la voz de Maya en el Level 0, la despedida grabada de Danny y June al empezar el
  interludio y el rincón de Danny en las Tuberías. Doce notas. Personaje nuevo, sólo de la historia: **Earl**.

**Tercera tanda de la 5.0**:

- *Choque con tabiques*: con celdas más estrechas que el cuerpo (`RADIUS` 0,36 frente a celdas de 0,55 m)
  las cuatro esquinas de `blockedCircle` caían a los dos lados de un tabique y se podía andar por dentro
  de él. Ahora, si `2r > 0,9·cell`, mira también puntos intermedios.
- *Música*: 20 piezas. `musOpciones(cfg)` da las que pegan con el nivel y `musElegir` escoge una (y otra al
  acabar cada vuelta); cada vuelta cambia de tono (`MUS.trans`) y de tempo (`MUS.vel`).
- *Cintas*: `histCintaSonido(on)` (lo llama `histCine` con `vhs:true`) y `histCintaUpdate()`: siseo, red,
  cabezal con «wow», chasquidos y un murmullo con la voz de quien habla filtrado.
- *Esfuerzo*: fila 8 del atlas (`ESFUERZO_POSE`), `E.esfuerzo(tipo, s)` (empujar, levantar, girar, coger,
  secarse) y gestos de actor `empuja/levanta/gira/recoge/seca`. `histFatiga(dt, enEscena)` maneja el esfuerzo
  incluso en escenas bloqueadas. Partículas (`PART`, `particula`, `gotasSudor`, `gotera`, `anilloAgua`) en el
  motor; `cfg.goteras` hace gotear el techo.
- *Mecánicas*: acción `crouch` (Z; `player.agachado`, velocidad `G.char.agachado || 0.45`, ruido ×0,25, la
  cámara baja; los crujidos no saltan agachado). `ITEMS.botella` + acción `throw` (T): `lanzarBotella()` →
  `romperBotella()` pone `G.cebo` y manda a las entidades caminantes a mirar (`lastSeenX/Z`, `hunt`) y en la
  historia `histCebo()` pone a los enemigos en «busca». `histRespiracion()`: escondido, jadeando y con un
  enemigo a menos de 5,5 m, si no mantienes correr sube `HIST.oidoRiesgo` y a 2,2 pierdes («te ha oído»).
- *Owen jugable*: entrada en `CHARACTERS` con `unlockHist:"c1"` (lo mira `checkUnlocks`, que también se llama al
  acabar el capítulo) y habilidad `nightshot` (`nightshotAplicar`: filtro verde, más luz ambiente y entidades
  con `depthTest:false`). Danny sigue siendo sólo de la historia.
- *Detalles de la casa*: `histEspejo(malla)` cambia el material del cristal por un `ShaderMaterial` con el
  reflejo (técnica del `Reflector` de three.js, con plano de corte oblicuo); `histEspejosRender()` lo pinta
  justo antes del render principal, sólo el más cercano a menos de 5 m, y pone tu sprite de cara al reflejo.
  `histPantalla(malla, "dibujos"|"dvd")`: lienzos animados a 12 fps (la tele y el portátil). `HIST.giran`
  (ventilador, segundero) y `HIST.parpadean` (el reloj del horno). Lo que lleva `userData.noFundir` no lo
  funde `histFusionar`.
- *Cielo*: `cieloCrear(cfg)` en los niveles con `ceil:null`: esfera que sigue a la cámara, degradado desde
  `fogColor`, estrellas y luna si es de noche.

**Cuarta tanda de la 5.0**:

- *Cámara en sitios pequeños*: con `G.cell < 1`, tres rayos (centro y ±0,25 rad) con paso de 5 cm; acercarse
  es rápido pero no instantáneo y, si no cabe a 0,95 m durante 0,2 s, pasa a primera persona
  (`player.camAuto`) hasta que vuelva a caber a 1,4 m durante 0,6 s. El sprite se oculta con margen.
- *Agachado*: fila 9 del atlas (`AGACHADO_POSE`). De perfil es una postura normal; de frente y de espaldas
  `drawAgachado()` pinta de pie en un lienzo aparte y lo pega con las piernas encogidas y el cuerpo bajado
  (doblar las rodillas de frente casi no se ve).
- *Voces falsas*: `vozSilaba(quien, destino, volumen, final)` es una sílaba de voz con dos formantes de una
  vocal al azar y una consonante de ruido; `HIST_VOZ` guarda el tono (`f0`), los formantes (`form`) y la
  velocidad de cada personaje. Suenan al escribir el diálogo, en los subtítulos (`E.sub`) y, filtradas, en
  las cintas.
- *El barrio*: el mapa `calle` tiene `grid:61` y `murosOcultos:true` (las celdas sólidas chocan pero no se
  dibujan: lo que se ve son las casas). Props nuevos: `casa` (cuerpo con tablas, desván en prisma, faldones
  con tejas, frontón con `histPrismaTri`, porche, ventanas con contraventanas, garaje, chimenea), `seto`,
  `pino`, `estanque`, `glorieta`, `tobogan`, `local` (tienda con toldo y rótulo), `gasolinera`, `marquesina2`,
  `surtidor2`, `pilon`, `senal`, `cesped` y `rayas`. Las texturas se pintan en gris y el color del material las
  tiñe (`histMatTex`, a escala de mundo). Obstáculos girados con `histObstaculoLocal`. El recorrido: Maple
  Street → camino del parque (`k`) → Birch Park → puerta norte (`g`) → Commerce Avenue → aparcamiento (`a`) →
  muelle (`d`).

**Quinta tanda de la 5.0** (pulido del barrio):

- *Farolas*: con `murosOcultos` no hay paredes donde arrimar las lámparas del motor (salían en mitad de la
  calzada). El barrio usa `lampStyle:"none"` y el prop `farola`, que mete su bombilla en `G.lamps` para que
  la reparta el `LIGHT_POOL` como cualquier lámpara.
- *Sin bordes vacíos*: un `cesped` enorme por debajo del suelo (`alto:-0.03`), casas y árboles de decorado
  fuera de la rejilla (no se pisan) y más niebla.
- *Carteles*: `histCartelDoble()` (dos planos espalda con espalda); los `DoubleSide` se leían al revés.
- *Sombras de contacto*: `histSombraContacto(g)` (caja del mueble → mancha radial) para los tipos de
  `HIST_SOMBRA`. Escaparates con estanterías (`histEscaparateTex`).
- *Primera persona*: los ojos van a 1,30 m (el sprite mide 1,42). Antes, a 1,58, parecías un gigante.
- *Pausa*: `body.pausa` esconde el diálogo, los subtítulos, el móvil y las notas detrás del menú.
- *El objeto de la mano* (`player.handMesh`) no se enseña en la historia ni en primera persona: flotaba.

**Sexta tanda de la 5.0** (móvil, tutoriales, casa de dos plantas, accesibilidad):

- *El móvil* (`hist/movil.js` dentro del motor): `HIST_CONTACTOS`, `HIST_CHATS` (historial fijo),
  `HIST_LLAMADAS`, `HIST_FOTOS` y `HIST_PRUEBAS`. Lo que pasa en la partida va en las banderas
  (`movilFlags()`: `chats`, `noLeidos`, `llamadasNuevas`, `notasTxt`, `pruebas`), así se guarda solo.
  Pantallas en `movilEstado().pantalla`: `inicio`, `chats`, `chat`, `llamadas`, `fotos`, `foto`, `mapa`,
  `notas`, `llamada`. `histMovilTecla()` va antes que todo en `histTecla()`; con el móvil abierto los
  enemigos esperan (`histMoverEnemigo`) y no te mueves (`histControl`). El avatar es la cabeza del sprite
  recortada del atlas (`movilAvatar`) y las fotos se pintan con sprites (`histFotoCanvas`), también las
  de los marcos de la casa (`histCuadroTex`, motivos 1 y 2).
- *API del guion*: `E.tel({chat, msgs})` escribe en un chat; `E.tel({llamada, estado, auto})` enseña una
  llamada; `E.responder(chat, ops, {sinSenal})` deja elegir qué contestar (con `sinSenal` sale «No
  entregado»); `E.llamada(c, {ops})` es una llamada entrante (devuelve 0 contestar / 1 colgar);
  `E.enLlamada(c)` pone el recuadro de «en llamada» mientras andas (`null` lo quita); `E.mensaje(chat,
  de, es, en)` mete un mensaje con aviso; `E.tutorial(id, titulo, texto, icono)`; `E.prueba(id, x, y, z)`.
  Tras un `E.responder` que no va seguido de un `E.tel`, el guion cierra con `histMovilCerrar()`.
- *Grabar*: `histClic()` → `histGrabar()` con la cámara encendida. Vale la prueba registrada (en
  `HIST.pruebas`, que se vacía en cada tramo) más centrada en horizontal (unos 25°), a menos de 16 m y a la
  vista (`canSee`). Guarda una miniatura en `HIST.capturas` y al llegar a 8 da `hist_grabar`.
- *Tutoriales*: `histTutorial(id, …)` abre una nota de tipo `tuto` y apunta `tut_<id>`; si ya está, no hace
  nada. Agacharse en la historia necesita `tut_agachar` (llega en «Sin hacer ruido»; `histTramo` la pone
  sola en los tramos de después, para partidas guardadas de antes). La pausa pinta los controles de la
  historia con `renderPauseKeys()` (se llama en `pauseGame()`).
- *Dos plantas*: las dos plantas comparten rejilla, separadas por el muro de la fila 11. `cfg.escaleras`
  ({a, b, yaw, dir}, en celdas): al llegar andando a `a` mirando hacia `dir`, fundido y apareces en `b`
  (`histEscaleras`). `cfg.sinBloque` son macizos que no se dibujan (la escalera y el hueco se chocan,
  pero se ve el mueble). Props `escalera`, `hueco` y `precinto` (`id:"precinto"`, sus trozos en
  `userData.piezas`; con `flags.precinto` ya no se monta).
- *Accesibilidad* (pestaña `acc`): `dalt` (filtros SVG `feColorMatrix` de `DALT_MATRICES` sobre `#stage`,
  no sobre el body: así el menú no cambia), `textoTam` (variable CSS `--texto-esc`), `textoVel` (≥4 sale
  entero), `subFondo`, `sinDestellos` (sin temblor, sin ruido en las cintas, el apagón fijo), `agacharModo`
  y `correrModo` (pulsar en vez de mantener: `player.agToggle` / `runToggle`), `histHud` (0 siempre, 1 se
  esconden, 2 nunca) y `contraste`. Todo en `applyAccesibilidad()`.
- *Primera persona*: ya no tiene tecla (la acción `view` pasa a ser `phone`, M); sólo Ajustes → Controles.
  En la historia, Ajustes → Controles enseña sólo sus teclas, con sus nombres (`renderKeyBox`, que ahora se
  repinta en `openOpts`); agacharse, la cámara y la botella aparecen cuando ya se han aprendido.

**Séptima tanda de la 5.0** (pulido: barrio de Halloween, escaleras, cámara, voces, baterías):

- *El barrio*: `calle` tiene Elm Court (salas nuevas al oeste de Maple: calle, jardines, glorieta y el
  mirador del arroyo; fondo de saco a propósito, la pasarela está rota). En los props, **`lado` es la pared
  contra la que va la espalda**: una casa del lado oeste que mira al este es `lado:"o"`, y su centro tiene
  que quedar ~2,8 celdas detrás del borde de lo que se pisa (cuerpo de 8 m más porche).
- *Props de Halloween*: `calabaza` (gajos y cara que parpadea: `HIST.velas`), `calabazaRota`, `telarana`,
  `fantasma` (se mece: `HIST.ondean`), `lapida`, `esqueleto` (con `id`, `userData.esq` para el susto),
  `espantapajaros`, `paja`, `maiz`, `hinchable` (respira: `HIST.hinchables`), `luces` (guirnalda entre `a` y
  `b`; las bombillas son una sola malla con colores por vértice), `pancarta` (ajusta la letra al texto),
  `cuenco`, `vasos`, `gato` (Pickles: `HIST.gatos`), `canasta`, `arroyo`, `puente`, `arana`, `bruja`,
  `murcielagos`, `cartelVenta`, `foco`. `arbol` tiene ramas que salen del tronco (`histRama`), copa de
  bultos, `abedul`, `verde`, `papel` (papel higiénico) y hojarasca; `pino`, capas irregulares.
- *La fiesta*: `HIST.fiesta = {x, z, radio, ventanas}` hace sonar bombo y bajo amortiguados según la
  distancia (`histFiesta`) y cambia el color de las ventanas.
- *Guion*: `hRecuerdo(E, id)` (seis recuerdos, logro `hist_recuerdos`), `hMaullido`, el chat `pickles`
  (contacto nuevo; `movilOrden()` pone delante los chats que salen en la partida), gestos nuevos de los
  actores con las poses de los emotes (`saluda`, `celebra`, `baila`, `senala`, `rie`, `encoge`, `pulgar`).
- *Voces*: `vozSilaba` lleva diente de sierra + triángulo con filtros de formante «peaking» (antes eran
  pasa-banda estrechos y apenas se oían) y `histDuck` baja la música (un nodo entre `musicBus` y `master`)
  mientras alguien habla.
- *Mensajes*: `histAviso(c, m)` es el globo de arriba; `E.tel` lo enseña con «escribiendo…» antes de abrir
  el chat, y cada mensaje tarda `histTelRetardo(m)`.
- *Baterías*: `histBaterias(dt)` gasta el móvil (0,005 %/s, +0,05 con la pantalla) y avisa al 20, 5 y 0;
  la cámara gasta 0,3 %/s y 1,5 por grabación. `HIST.camNecesaria` (en las esperas que necesitan la cámara)
  impide quedarse atascado. Sin batería, la M enseña la pantalla negra.
- *Escaleras*: `cfg.huecosSuelo` / `cfg.huecosTecho` (en celdas) cortan el plano del suelo o del techo
  (`planoConHuecos`, con las UV recalculadas). `cfg.escaleras[i].ruta` es el camino por los escalones con
  su altura; `histEscaleras` lo recorre (`HIST.escala`, `player.yOff`, que suben el dibujo, la sombra y la
  cámara) y al final hace el fundido. Los props `escalera` (con `pozo`: lo que se ve por el hueco del techo)
  y `hueco` (los escalones que bajan) los dibujan.
- *Cámara*: con celdas finas (la casa), `camCorte` esconde los tabiques entre la cámara y Owen (guarda la
  matriz de cada instancia y la devuelve); `cfg.sinCorte` son los que nunca se esconden (el muro entre las
  dos plantas y la fachada). En toda la historia, un rayo contra los muebles acerca la cámara (mínimo 0,8 m).
  Al rayo hay que darle `raycaster.camera` o los `Sprite` revientan.
- *Agacharse*: `drawAgachado` dibuja de frente y de espaldas unas cuclillas (rodillas fuera, manos en las
  rodillas, el cuerpo 13 px más bajo); de perfil, `AGACHADO_POSE` con el torso inclinado y brazos sueltos.

**Octava tanda de la 5.0** (gráficos de noche; el módulo «ATMÓSFERA» del motor de la historia):

- *Halos*: `histHalo(x, y, z, color, tam, {parp, ref})` apunta un brillo; `histHalosConstruir()` los mete
  todos en un solo `THREE.Points` con mezcla aditiva (atributos `hcol`, `htam`, `hfase`, `hparp`, `hon`) que
  respeta la niebla y se apaga con el apagón o si su lámpara (`ref`) está muerta. Los ponen las farolas (vía
  `G.lamps`), los porches, las ventanas encendidas (`histHaloLocal`, en coordenadas del grupo), las
  guirnaldas, las calabazas talladas, el muelle y el foco de los Henderson. Fuera de la historia,
  `halosNivel(cfg)` (desde `buildLevel`) hace lo mismo con las lámparas de cada nivel.
- *Luna*: `cfg.luna` (en `calle`) crea una luz direccional con sombras PCF suaves que sigue al jugador,
  ajustada al texel (`histLunaUpdate`); sólo en calidad Alta y Ultra. Proyecta sombra todo lo que no es
  `MeshBasic`, transparente o un plano; la reciben también el suelo y el césped.
- *Más ambiente*: `cfg.hojas` (hojas que caen alrededor del jugador), `cfg.bruma` (rectángulos en celdas con
  dos capas de bruma que se desplazan), `cfg.murcielagos`, humo de las chimeneas (`HIST.chimeneas`, lo
  rellena la casa con `chimenea`), nubes en el cielo (`cieloCrear` tiene `tiempo` y `nubes`), viñeta CSS
  en `body.hist #stage::after`.
- *Texturas*: `MAT.asfalto` (se define en el motor de la historia y lo usa `floor:["asfalto", …]`),
  `histCespedTex` a 256 px con briznas, matas y hojas. Las casas llevan arbustos al pie (`arbustos:false`
  para quitarlos), cortinas y lámpara en las ventanas encendidas y el reflejo de su luz en el suelo.
- *Interiores*: `luzInterior(cfg)` (para mapas con techo) hace dos mallas por nivel: la sombra de contacto
  (una tira con degradado en el suelo, al pie de la pared, en el techo y en lo alto de la pared, por cada
  borde entre una celda libre y una sólida; no la llevan las puertas ni los `sinBloque`; `cfg.ao` cambia la
  opacidad) y los charcos de luz (un cuadrado en el suelo y otro más pequeño en el techo por lámpara, con un
  shader aditivo que se apaga con la lámpara y con el apagón: `luzInteriorUpdate`). La textura del degradado
  va con `flipY = false` (si no, la parte oscura queda lejos de la esquina y parece un escalón).
- *Backrooms*: `histDecoBackrooms(cfg)` (antes de `histFusionar`, para que se fundan) pone enchufes,
  placas caídas y humedad en `l0`, charcos, cables y palés en `l1`, y luces rojas y vapor en `l2`. El `id`
  de los mapas de la historia es `h:l0`, no `l0`.
- *Animación*: `personAtlas` tiene ahora **16 columnas** (`PERSONA_COLS`): en las filas 0-3, las 0-7 son
  andar y las 8-15 correr, dibujadas con `gaitPose8(col)` (8 fases por ciclo); las demás filas siguen
  usando las columnas 0-7. Quien elige fotograma lo calcula con `atlas.cols` (el jugador, los actores, el
  Acomodador, el espejo); las entidades siguen con sus atlas de 8. El paso pesa (`fase = animT·π/4`: sube a
  mitad de zancada, se hunde al pisar), corriendo hay polvo en las pisadas 0 y 4 (`particula`, tipo
  `sudor`, que se desvanece) y parado más de 3,5 s mira a los lados (`player.quietoT`; los actores,
  `A.quietoT`).
- *Cámara de la casa* (sustituye a la de corte con distancia variable): con celdas finas, `want = 2.3` fijo y
  `camaraCasa(px, pz, yaw, pitch, yOff, wallH, dist)` la pone detrás y por encima del techo (el techo es de
  una cara: desde arriba no se ve). `camCorte` esconde tabiques en una franja de ±0,9 m; `cfg.telon` pone un
  bloque negro sobre el muro entre plantas; en `histAtmosferaUpdate`, con la cámara alta se esconden lo
  que cuelga del techo (`HIST.techo`: ventilador y dinteles de `histVano`), las lámparas y las puertas
  (`piv` y `g`) cercanas a la línea cámara-Owen. Ya no hay rayo contra muebles en la casa.
- *De frente y de espaldas*: `drawPerson` desplaza el cuerpo (`vaiven`) hacia la pierna que apoya, levanta
  el pie que avanza (`alza`, con la suela de espaldas) y acorta los brazos según el balanceo (escorzo).
- *Enemigos y sonido*: `histEnemigoVida` (después de `histPintarEnemigo`) da al Acomodador su cara de
  estática (`E.cara`, una textura de 16×16 que se repinta), tirones, pasos y la radio (sílabas de `vozSilaba`
  por un filtro paso banda), y al perro ojos (`E.ojos`), pasos y jadeo. `histDest(x, z, vol, alcance)` da un
  nodo de ganancia + panorámica estéreo para cualquier ruido; `HIST_RUIDO` son los ruidos y `HIST_AMBIENTE`
  qué se oye en cada mapa y cada cuánto (`histAmbienteUpdate`). En casa, tic-tac (`HIST.relojPos`) y nevera
  (`HIST.neveraPos`).
- *Música (décima tanda)*: `MUS_MOTIVO` y `MUS_RESPUESTA` son el leitmotiv (compases de `[pulso, semitono
  sobre re, duración]`) sobre `MUS_ACORDES_D`; lo usan las piezas `titulo` (menú), `danny` (casa y la
  pantalla del capítulo) y `calle` (vals en 3/4: los pulsos del motivo ×0,75). `musNota` tiene `cuerdas`,
  `trem`, `coro`, `estatica`, `latido` y `pizz`, y cada nota pasa por un `StereoPanner` (`musPan(inst, f)`).
  `musNodos` añade una sala (convolución de 3,4 s, envío desde `tono` y desde la capa de persecución) y el
  bus `tens`. `musAmenaza()` da 0-1 según lo cerca que esté lo peligroso (en la historia `HIST.enemigos`,
  sin contar al Acomodador que sólo se ve por la cámara; si no, `G.cercaD`, que deja `updateEntities`), y
  `musUpdate` programa la pieza `tension` en ese bus, apartando un poco la pieza. Con el juego parado,
  `frame()` llama a `musUpdate` y `musMenuPieza()` elige `titulo`, `danny` (pantalla del capítulo) o
  `final` (fin del capítulo); en los menús la pieza no se acaba ni cambia de tono.
- *Menús*: `tituloDeriva(dt)` (desde `frame()`, con el juego parado) pone a `player` en un pasillo largo al
  azar y lo pasea (`tituloLibre` mide cuánto sitio hay en una dirección; gira en los cruces y al final del
  pasillo), con la cámara a 1,58 m y el vaivén de una cámara en mano; también pinta el contador `#osdTc`.
  Sustituye a `titleOrbit`, que no volvía a arrancar al salir al título. `uiSonido("pasa"|"pulsa"|"vuelve")`
  y `menuSonidos()` (delegado en `document`, también despierta el audio con el primer clic o tecla); el
  mando hace tic al mover el foco. El CSS nuevo: `#tituloOSD`, `@keyframes tubo`, `hojaEntra`, `velo`,
  `.intro-mas` y la cinta de `#histScreen .hs-card`.

**Inés** (`id:"ines"`): campos nuevos `healMul` (lo usa `bandagePart`) y `bleedMul` (`updateBleeding`), y la
habilidad `triage` en `useAbility()`.

**Niveles**: 14 más (16, 17, 18, 20, 38, 39, 46, 48, 54, 55, 63, 66, 70, 75), con lore resumido de sus páginas
y enlazados desde niveles que ya existían donde la wiki dice que se llega. `node herramientas/anexo.js`
regenera el mapa del descenso (80 niveles).

**Armas y prendas**: hacha (`fireaxe`, la que más aturde), llave (`wrench`, la más rápida y duradera), palo de
hockey (`hockey`, más alcance) y táser (`taser`, 4,6 m y 8 cargas). Prendas `headlamp` (letra «l»: con ella
puesta `toggleTorch` funciona sin linterna y la luz no ocupa la mano), `leather` («j»), `kneepads` («k»,
`o.knee`) y `motohelmet` («y», capucha con visera). `cleanKey()` acepta las letras nuevas.

**Emotes**: `GESTOS` pasa a 12 (teclas en `GESTO_TECLAS`: 1-9, 0, - y =). `personAtlas()` tiene ahora
**10 filas**: 0-3 andar/correr, 4 caído, 5-6 emotes de frente, 7 cansancio y gestos, 8 esfuerzo y 9 agachado (`EMOTE_POSE`: `drawPerson` acepta una postura
como objeto en vez de un número de fotograma). `emoteFrame(pose, t)` dice qué dibujo toca; lo usan el
jugador y los compañeros. La figura 3D hace la postura con el mismo nombre en `RIG_POSE.human`.

### La actualización de Halloween y otoño (5.0)

- *Niveles grandes*: `ampliarNivel(cfg)` (sobre `CAT` al cargar y sobre cada `makeDeepLevel`) multiplica
  `grid` por `ESCALA_NIVEL` (1,7; asentamientos 1,3; siempre impar) y `boxes`, y guarda `gridBase` y
  `escala`. En `buildLevel` la fauna se multiplica por `1 + (escala-1)*0,55` (también el techo `maxEnts` y el
  máximo por especie) y los niveles de 45 celdas o más llevan una salida más. `carveSpecials` saca más zonas
  y con más radio según `G.n/31`.
- *Sin bordes* (sección «EL MUNDO SIN BORDES»): `nivelSinBorde(cfg)` (todo lo que no es de la historia) hace
  `G.toroS = (n-1)·cell`. `genMazeToro` genera el laberinto sobre un toro de periodo `P = n-1` (la fila y
  la columna `n-1` son copia de la 0; `toroCoser` las vuelve a igualar después de tallar salas) y cierra los
  pilares que el trenzado deja abiertos sin salida. `toroD(d)` es la diferencia más corta en el toro.
  `solidAt`, `obstacleAt`, `bfs` (sólo si le pasas `G.grid`), `bfsToro`, `flowStep`, `cellBusy`, las luces
  (`updateLights`), la salida más cercana y el plano envuelven. `toroPaso()` (después de `updatePlayer`)
  lleva al jugador y a la cámara a la otra copia al pasar la costura, coloca la fauna, las bengalas, los
  objetos del suelo, las balizas y los compañeros en la copia más cercana a él y llama a `toroRenovar`
  (no en multijugador: cada uno lo haría a su manera), que abre muros y cierra pasillos lejos y fuera de la
  vista sin tocar las celdas con algo pegado (`G.toroDeco`, de `toroMarcarDeco`) ni dejar nada
  incomunicado. `renderMundo()` sustituye a `renderer.render`: cerca de la costura vuelve a pintar el
  mundo moviendo la cámara y las luces al revés (sin tocar las matrices del mundo), sólo para las copias
  cuya franja cae en el frustum. Se aparece cerca del centro (`G.toroInicio`).
- *Temporada*: `temporada()` mira `G.opts.temporada` (0 automático: 22 de septiembre a noviembre; 1
  siempre; 2 nunca) y `temporadaAplicar()` pone la clase `temporada` en el body, el aviso `#temporadaBox` y
  las hojas del título (`#tituloHojas`). `temporadaDecorar(cfg, open, rand)` (con su propia semilla, para
  no cambiar el resto del nivel) pone calabazas (`InstancedMesh`: cuerpo con color por vértice **en lineal**,
  rabo, cara y brillo en el suelo), caramelos (`spawnDrop` con uid fijo), telarañas en esquinas de techo y,
  en exteriores de calle o campo, una alfombra de hojas que sigue al jugador (`temporadaAlfombra`) y
  hojas que caen (`THREE.Points`). `temporadaUpdate` hace temblar las velas y cuenta las calabazas vistas
  (`G.prog.calabazas`). Objeto `caramelo` (`season:true`), logros `truco` y `calabazas`, aspecto `calabaza`
  con `need:{ach:"truco"}` (nuevo tipo de requisito en `skinUnlocked`/`skinNeedText`).
- *Versiones*: `VERSIONES` (versión, fecha, título y puntos en los dos idiomas) y `renderVersiones()` en
  `#versionesScreen`; se abre desde `#verTagBtn` (la versión del título), `#novedadesBtn` y `#verTodas`
  (Ajustes). **Al sacar una versión nueva, añádela arriba.**
- *Copia publicada*: `HIST_PUBLICO` (true en el archivo del repositorio). `node herramientas/publicar.js`
  escribe `publicar/el-zumbido.html` con `false`: `historiaOcultar()` quita el botón, los logros `hist_*` y
  `owen`, a Owen y los ajustes `vista`/`histHud`. Esa es la que se sube mientras el capítulo 1 no salga.
- *Interiores de la historia*: `histInteriorDetalle(cfg)` (desde `histAtmosferaCrear`, sólo la casa) pone
  moldura, enchufes, interruptores y cuadros, y apunta cada instancia en `G.cortePegados[celda del muro]`
  para que `camCorte` la esconda con su muro. La sombra (`luzInterior`, `onBeforeCompile`) y los charcos
  de luz descartan lo que está por encima de la cámara y la franja que corta `camCorte` (`CORTE_U`).

## 7. Trampas que ya han mordido

**Colores por vértice o por instancia (5.0).** Van en espacio lineal: un `0.88, 0.42, 0.08` sale color
melocotón. Para un naranja de verdad, `0.62, 0.12, 0.008`, o `color.setHex(...).convertSRGBToLinear()`.

**Las pruebas y la fecha (5.0).** La temporada depende del día: `banco.js` arranca el juego con
`temporada: 2` en las opciones guardadas para que las pruebas den lo mismo en octubre que en marzo; las que
la prueban la encienden a mano.

**Finales de línea (5.0).** El archivo va con saltos LF. Si un script de Python lo abre sin `newline=""` y lo
escribe en Windows, lo pasa entero a CRLF sin avisar, y entonces fallan pruebas que buscan `"</div>\n</div>"`
(la de los controles de la pausa en los dos idiomas) y los cambios multilínea dejan de encajar. Lee y escribe
siempre con `newline=""`.

**Cámaras de escena dentro de una pared (5.0).** En el nido de June la escena salía negra: la cámara fija
estaba en una celda sólida. La prueba de la historia comprueba ahora cada `E.camara([c2w(x), h, c2w(z)], …)`
contra la rejilla de su mapa. Ojo: la celda 14.6 ya es la 15.

**El THREE de las pruebas es de mentira (5.0).** `pruebas/banco.js` sólo tiene de verdad `Vector3` (con los
métodos que se le han ido añadiendo) y `PointLight`; lo demás devuelve objetos vacíos. Un
`raycaster.intersectObjects(...)` no devuelve un array: comprobar con `Array.isArray` antes de recorrerlo.

**CSS fuera de las marcas (5.0).** `hist/inyectar.py` sustituye lo que hay entre `MODO HISTORIA (5.0)` y
`FIN MODO HISTORIA`: lo que se añada a `estilos.css` *después* de la marca final se queda fuera y se duplica en
cada inyección. La marca final tiene que ser la última línea. Y al borrar una regla de varias líneas, borrarla
entera: una línea huérfana con `}` se comía la regla siguiente (las notas salían sin estilo).

**Muros negros con algunas alturas (arreglado en la 5.0).** `buildLevel` oscurece el pie de los muros con
`Math.pow(t, 0.55)`; con alturas como 2,7, 3,4 o 4,8 m el redondeo del flotante dejaba `t` en -0,00000001,
la potencia daba NaN y caras enteras salían negras (también en niveles normales). Ahora va con
`Math.max(0, …)`. Si tocas colores por vértice, cuidado con las potencias de números que pueden ser -0.

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

**El anfitrión perdía el hilo con el servidor de salas y nadie lo notaba (3.0.3).**
PeerJS registra el nombre de la sala en un servidor; si el anfitrión pierde esa conexión
(red, pestaña en segundo plano, servidor) salta `disconnected` y la sala **deja de poder
encontrarse** aunque él la vea «abierta»: el que intenta entrar recibe «no hay ninguna sala con
ese nombre». `mpReconectar()` lo arregla con `peer.reconnect()` (mismo nombre) desde el evento,
desde `mpVigilar()` y al volver a la pestaña (`visibilitychange`). Ojo: `reconnect()` vuelve a
lanzar `open`, y el manejador tiene que ser idempotente (`MP.abierto`) o el invitado llamaba
otra vez al anfitrión y salían clones. En localhost no se ve; se reproduce en vivo con
`MP.peer.socket._socket.close()` en dos pestañas del navegador integrado.
Además: el que no consigue entrar (sala inexistente, 15 s sin abrir la conexión, fallo de red)
pasa por `mpFalloAlEntrar()`, que lo cierra todo y devuelve los botones de «Entrar» y «Crear»
(en la 3.0.1 se quedaban ocultos); un `peer-unavailable` con la sala ya montada es una llamada de
voz a alguien que se fue y no echa a nadie; y `mpSalir()` marca todo como cerrado **antes** de
cerrar las conexiones, porque `c.close()` avisa al momento y salía el falso «el anfitrión ha
cerrado la sala». El latido y los diez minutos cuentan con el reloj (`Date.now()`), no con
«un tic = un segundo»: los navegadores frenan los temporizadores de las pestañas en segundo plano.
`pruebas/multijugador.js` lo cubre con un `Peer` de mentira.

**«Bajar los gráficos» casi no bajaba nada (3.0.5).** Medido en una gráfica integrada (Intel UHD,
1080p, mismo nivel y semilla), el fotograma iba igual en Media, Alta y Ultra (25 ms) y sólo Baja
ganaba, y sólo por la resolución. Lo caro estaba en otro sitio, así que `CALIDAD[]` (una tabla, un
perfil por nivel) decide ahora seis cosas: resolución, **luces** (cada una se paga en cada píxel),
**distancia de dibujado** (`distanciaDibujo()`: la niebla ya lo tapa todo más allá de `k/densidad`,
así que recortar ahí no se ve y ahorra el 25-40 % del fotograma también en Alta), polvo, grano y
**material** (`stdMat()`: Lambert en Baja y Media, casi la mitad de precio que el PBR y muy parecido).
Resultado, ms por fotograma antes → ahora: Baja 14,1 → 1,0 · Media 25,4 → 3,6 · Alta 25,2 → 16,4 ·
Ultra 25,1 → 20,0. Además el grano de cinta se pintaba píxel a píxel en JS (100.000 números al azar
por fotograma) **incluso con el filtro en «Limpio»**: ahora es una textura de ruido que se desplaza
y no se pinta si no se ve; y `#vignette`/`#scan` dejan de usar `mix-blend-mode:multiply` (negro
con transparencia es lo mismo y cuesta menos). La resolución dinámica (`gobernar()`, ajuste
«Ajuste automático») baja hasta ×0,6 si va a menos de 40 fps y vuelve a subir, sin pasar de lo
elegido. Reglas: todo material nuevo va por `stdMat()` (y `.bumpMap` puede ser `null`); todo coste
visual nuevo se cuelga de un campo de `CALIDAD`. **Cómo medir esto:** copia de depuración con
`window.__dbg`, `innerWidth/innerHeight` forzados (con el panel oculto valen 0 y el lienzo mide
0×0: sólo mides la CPU), `gl.finish()` tras cada `render`, 40 fotogramas de calentamiento (cambiar
el número de luces recompila todos los shaders) y la versión anterior con `git show` a la misma
escala de pantalla (el `devicePixelRatio` del panel cambia entre 1 y 1,25 si está oculto).

**Un compañero caído se veía «aplastado y flotando» (3.0.5).** El sprite caído se escalaba a 0,45 de
alto y se quedaba de pie. Ahora `actorDown()` lo marca como tumbado y `billboard()` lo echa boca
arriba (`rotation.order = "YXZ"`, −90° en X y el giro en Y). Cambiar «Personajes» (pixel art / 3D)
con la sala abierta tampoco se notaba en los compañeros: `figuraDesactualizada()` los rehace y
`refrescarFiguras()` lo aplica al momento. Cada uno manda además lo que lleva en las manos (`gl`,
`gr`) y las figuras 3D lo dibujan. **En el banco las mallas de mentira dicen que todo es 3D
(`isRig()` siempre true) y no guardan `userData`:** estas piezas se prueban con objetos normales.

**Lo que pasa «sólo en tu copia» no lo ve nadie más (3.0.5).** Cada jugador construye su propia
copia del nivel (misma semilla, enemigos y casilleros propios), así que todo lo que cambie el
mundo tiene que mandarse a mano. Los objetos soltados no se mandaban: los compañeros no los
veían. Ahora `spawnDrop()` los anuncia (`suelo`) y `pickDrop()` avisa de lo que queda
(`recoge`), con un identificador único (`uid`) para no duplicar ni rebotar; el anfitrión los
reenvía (`MP_REENVIA`), se los manda al que entra después (en el «hola») y guarda los de un nivel
al que aún no has llegado (`MP.sueloPend`, se vacía en `buildLevel()`). Los casilleros y los
enemigos siguen siendo de cada uno a propósito. El nivel de una partida con amigos lo fija el
anfitrión: `startRun()` conserva la semilla que el invitado ya recibió (`heredado`; antes
`resetRun()` se la pisaba con una propia y la ficha del nivel enseñaba otro laberinto hasta el
primer «hola»). La ficha del nivel enseña la semilla para poder comprobarlo a ojo. Si añades algo que deje cosas en el mundo,
decide si es de todos y mándalo igual.

**PeerJS ya no trae TURN que funcionen: entre redes distintas hay que dárselos (3.0.4).**
Sus servidores de relevo gratuitos (`eu-0.turn.peerjs.com`, `us-0.turn.peerjs.com`) ya no existen
en el DNS, así que con la configuración por defecto sólo quedaba un STUN, y dos dispositivos en
redes distintas (datos móviles, CGNAT, routers estrictos) sólo conectan si el router deja hacerlo
directamente. En un mismo equipo o en localhost no se nota. `new Peer()` recibe ahora
`config:{iceServers:MP_STUN.concat(MP_TURN)}` (sustituye a la de PeerJS por completo, por eso
lleva también `sdpSemantics`). `MP_STUN` son cuatro STUN comprobados; `MP_TURN` lleva el TURN
gratuito de ExpressTURN (`free.expressturn.com:3478`, las credenciales van a la vista: se cambian
en su panel si alguien abusa). Se pega ahí cualquier otro con `{urls:[…], username:"…", credential:"…"}`.
**Límites de ese TURN, comprobados a mano con peticiones TURN crudas:** sólo responde por UDP 3478
(TCP y TLS no), así que una red que bloquee el UDP (colegios) no pasa; y **no deja relevo contra
relevo** (`CreatePermission` → 403 Forbidden IP, también entre sus dos IPs), o sea que al menos uno
de los dos ha de ser alcanzable: uno en casa y otro con datos móviles sí, dos redes muy cerradas no.
Un TURN de pago o con TCP/443 lo arregla. Abrir el juego con `?relevo` fuerza al que ENTRA a usar
sólo el relevo (el anfitrión no: por lo dicho, relevo contra relevo no puede funcionar). Con la conexión abierta el
juego dice «directa» o «por servidor de relevo» (`mpTipoConexion()`), y si no abre en 40 s
(`MP_ESPERA`) lo cuenta y vuelve a dejar «Entrar». Chrome avisa si hay más de cinco servidores.

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
| `herramientas/publicar.js` | Saca `publicar/el-zumbido.html`, la copia sin el modo historia que se sube |
| `pruebas/` | Las comprobaciones automáticas |
| `GUIA.md` | Esto |
