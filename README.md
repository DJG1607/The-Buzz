# El Zumbido

Un juego de **Backrooms en tercera persona**, hecho con Three.js y basado en el lore público de la
[Backrooms Wiki](https://backrooms-wiki.wikidot.com/). Todo cabe en un archivo HTML: no hay assets
externos ni compilación. Las texturas, los sprites y el audio se generan por código al arrancar.

**[▶ Jugar](el-zumbido.html)** · abre el archivo en un navegador, o sírvelo con `python -m http.server`.

---

## Los archivos

| | |
|---|---|
| **`el-zumbido.html`** | El juego entero. Empieza por el índice de secciones del principio. |
| **`GUIA.md`** | **Cómo está montado y dónde tocar para cambiar cada cosa.** Empieza aquí si vas a meter mano. |
| `mapa-descenso.html` | Anexo: el grafo completo de saltos entre niveles, la fauna de cada uno y los tipos de salida. |
| `pruebas/` | Comprobaciones automáticas: `node pruebas/todo.js` |
| `herramientas/` | `anexo.js` regenera el anexo desde el catálogo del juego. |

---

## De qué va

Has hecho *noclip* fuera de la realidad y caes en el **Level 0** sin nada en los bolsillos. No hay
final: sólo profundidad. Cada nivel tiene varias salidas, cada una baja a un sitio distinto, y el
único sitio donde se guarda la partida son los puestos abandonados del M.E.G.

## Lo que hay dentro

- **34 niveles del catálogo de la wiki** — The Lobby, Habitable Zone, Pipe Dreams, Electrical
  Station, Abandoned Office, Terror Hotel, Lights Out, Thalassophobia, The Caves, The Suburbs,
  Field of Wheat, The Endless City, The Boiling Frogs, Matrix, Attic Floorboards, Numbered Doors,
  Ruins Left Behind, The Roller Rink, The Infinite Mall, Sewer System, An Empty Car Park,
  Timeless Airport, The Poolrooms, The Black Lake, The Moribund Highway, Eyes On You, Frostbite,
  The Lurking Darkness, Space Station, Fallout Shelter, Downtown Diner, Ghoul Town, Level ! y
  Level Fun — más los asentamientos **Base Beta** y **Camp Amber**, y niveles sin catalogar
  generados por semilla cuando te sales del mapa conocido.
- **Diez entidades** con su número oficial: Facelings (9), Smilers (3), Hounds (8), Skin-Stealers
  (10), Deathmoths (4), Dullers (6), Clumps (5), Crawlers (17), Wretches (15) y Partygoers.
  Persiguen por los pasillos con un campo de distancias, no en línea recta.
- **Forcejeo**: cuando una entidad te alcanza, te agarra. Hay que soltarse pulsando una secuencia
  de teclas antes de que se acabe el tiempo. Cuanto más limpio lo hagas, más tarda en levantarse.
- **Ataque especial por entidad**, fiel a su ficha de la wiki: el Hound te desgarra las piernas, el
  Clump te arrastra a su boca, el Duller mete el brazo **a través de la pared** y el Smiler sólo
  salta si le das luz o haces ruido. Siempre avisan antes y se pueden esquivar.
- **Multijugador con amigos**: sala con nombre, la partida va directa entre vuestros ordenadores
  por WebRTC. Camináis el mismo laberinto y os veis moveros; cada uno tiene sus enemigos y su
  botín. No hace falta instalar nada.
- **La palanca**: el primer objeto con el que se puede responder. Si algo te tiene agarrado,
  **[V]** te suelta de golpe y lo deja tonto. Se gasta al usarla.
- **Casilleros con tirada de d6**: un 1 no da nada, un 6 es un petate intacto.
- **Daño por zonas del cuerpo**, con hemorragias y vendajes.
- **Variaciones del Level 0** talladas en el laberinto: arcos, pilares, fosos, zonas sin luz, salas
  rojas y la Manila Room.
- **Cuatro personajes**, dos de ellos desbloqueables —entre ellos **el Entrenador**, el Faceling
  del Level 31, al que los suyos no atacan—, y **52 logros**. Se eligen en un carrusel al darle a
  Jugar.

## Idiomas

El juego está en **español e inglés**. Se cambia en Ajustes → Idioma, sobre la marcha y sin perder
la partida. En inglés el juego se llama *The Buzz*.

## Controles

| Tecla | Acción |
|---|---|
| `W A S D` | Moverte |
| Ratón | Mirar |
| `SHIFT` | Correr (gasta aliento y hace ruido) |
| `E` | Abrir contenedor · usar salida · guardar en un puesto |
| `1`–`4` | Sacar objeto (otra vez para usarlo) |
| `Q` / `R` | Beber Almond Water · vendarte |
| `F` / `G` | Linterna · bengala |
| `V` | Palanca: soltarse de un agarre de golpe |
| `T Z Q X` | Soltarse de un agarre forcejeando |
| `ESC` | Pausa y ajustes |

## Cómo está hecho

Un solo archivo. La única dependencia para jugar en solitario es Three.js 0.150.1 desde CDN; el
multijugador carga además PeerJS, pero **sólo si le das a «Jugar con amigos»**, así que sin internet
el juego normal sigue funcionando igual:

- El laberinto sale de un *recursive backtracker* con *braiding* para abrir salas.
- Las texturas del entorno se pintan en canvas de 384 px (moqueta con fibras, papel pintado con
  costuras y humedades, hormigón con grietas ramificadas, madera con nudos…).
- Los personajes son sprites de 24×36 dibujados píxel a píxel y sombreados dentro de su silueta.
- El audio es WebAudio puro: el zumbido de los fluorescentes son tres osciladores filtrados.
- Las entidades comparten un *flow field* recalculado desde el jugador cada 0,35 s.

Los detalles y las trampas están en la [guía](GUIA.md).

## Créditos

Niveles, entidades y salidas basados en el lore público de la
[Backrooms Wiki](https://backrooms-wiki.wikidot.com/), publicada bajo
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Los textos de este juego son
propios; ninguno reproduce los artículos originales.
