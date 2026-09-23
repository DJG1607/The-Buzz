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

- **49 niveles del catálogo de la wiki** (más los asentamientos **Base Beta** y **Camp Amber**, y
  niveles sin catalogar generados por semilla cuando te sales del mapa conocido). El catálogo entero
  está listado en [mapa-descenso.html](mapa-descenso.html).
- **Diez entidades** con su número oficial: Facelings (9), Smilers (3), Hounds (8), Skin-Stealers
  (10), Deathmoths (4), Dullers (6), Clumps (5), Crawlers (17), Wretches (15) y Partygoers.
  Persiguen por los pasillos con un campo de distancias, no en línea recta.
- **Forcejeo**: cuando una entidad te alcanza, te agarra. Hay que soltarse pulsando una secuencia
  de teclas antes de que se acabe el tiempo. Cuanto más limpio lo hagas, más tarda en levantarse.
- **Ataque especial por entidad**, fiel a su ficha de la wiki: el Hound te desgarra las piernas, el
  Clump te arrastra a su boca, el Duller mete el brazo **a través de la pared** y el Smiler sólo
  salta si le das luz o haces ruido. Las diez lo tienen: se plantan, se ponen rojas y sale un
  aviso grande con una barra — si te apartas a tiempo, fallan.
- **Fauna fiel a la wiki**, revisada nivel a nivel: donde la wiki no documenta entidades (el
  Level 0, Lights Out, Thalassophobia…) no hay, y el peligro es el propio nivel.
- **El nivel se reordena** cada minuto y pico a tus espaldas: se abren muros, se cierran
  pasillos y alguna salida cambia de sitio. Nunca delante de ti y nunca dejando nada
  incomunicado.
- **Salidas que cuestan**: pocas, lejos, sin luces que se vean desde la otra punta, y hay que
  **mantener E** unos segundos para cruzarlas, haciendo ruido. Cada tipo tiene su propio
  material: madera con veta, pintura desconchada, acero cepillado, tapa de alcantarilla…
- **Fauna con techo**: por mucha que tenga un nivel, sólo unas pocas entidades te persiguen a la
  vez (el resto ronda esperando), y los ataques especiales nunca se encadenan.
- **Multijugador con amigos**: sala con nombre, la partida va directa entre vuestros ordenadores
  por WebRTC. Camináis el mismo laberinto y os veis moveros; cada uno tiene sus enemigos y su
  botín. No hace falta instalar nada.
- **La palanca**: si algo te tiene agarrado, **[V]** te suelta de golpe y lo deja tonto. Se gasta
  al usarla.
- **Dos manos a la vista** con **tres armas reutilizables** — tubería, varilla y bate —, una en
  cada mano: golpean con el **clic izquierdo y el clic derecho**. Si llevas las dos ocupadas, la
  tercera va a la mochila y desde ahí se cambia de mano.
- **Una habilidad activa por personaje** (tecla **[C]**), con su propio tiempo de recarga: Marcos
  localiza la salida sin brújula, Vera se garantiza un buen casillero, Lázaro aguanta la mitad de
  daño un rato, y el Entrenador aturde todo lo que tenga cerca.
- **La mochila se despliega con [B]** y enseña todo lo que llevas. **Cada hueco es un objeto**, no
  una unidad, y cada objeto tiene un máximo que baja con la dificultad. Desde la mochila puedes
  **soltar** un objeto al suelo (y recogerlo luego) o **desecharlo**; **[X]** suelta lo que llevas
  en la mano. Las teclas 1-4 usan el objeto al primer toque.
- **Códice**: un archivo de campo, con iconos y pestañas, que documenta cada entidad,
  objeto y nivel según los vas encontrando, con la ficha real de cada uno.
- **Paredes que no son paredes de verdad**: entras por una y sales por otra, en otro punto del
  nivel. Aparecen sueltas por el laberinto, no siempre, y sin avisar cuál es la pareja de cuál.
- **Modo Sin retorno**: la dificultad más dura no permite guardar la partida en ningún puesto.
- **Modo aleatorio** (botón propio en el título): empiezas en un nivel al azar con un par de
  objetos al azar, cada salida lleva a cualquier nivel —a veces a uno sin catalogar— y cada
  nivel sale con su fauna, su botín y sus zonas especiales barajados. No se juega en
  multijugador.
- **Casilleros con tirada de d6**: un 1 no da nada, un 6 es un petate intacto. Lo que no te
  cabe se queda dentro y puedes volver a por ello.
- **Mapa del descenso interactivo**, dentro del juego y en el anexo: tocas un nivel y se
  encienden los niveles a los que puedes ir desde él y los que llevan hasta él.
- **Brújula con sus límites**: tiembla, da la distancia por tramos y pierde la señal lejos o
  con algo persiguiéndote.
- **Daño por zonas del cuerpo**, con hemorragias y vendajes. `R` venda la peor zona y **[N]** (o
  el botón de la cruz bajo el maniquí) abre un panel para elegir cuál curar.
- **Música y sonido ambiente**, generados por código igual que el resto del audio: un acorde
  y una melodía con eco que se ponen más tensos cuanto más peligroso es el nivel, más goteo,
  viento o chispazos según el tipo de sitio. **Puedes subir tu propia música** en Ajustes, y
  la música y el ambiente tienen cada uno su volumen.
- **Ajustes en cuatro pestañas** (Partida, Controles, Sonido, Gráficos) que se deslizan de lado.
  Opciones gráficas: calidad (resolución y relieve), distancia de visión, filtro de pantalla
  (limpio, grano o VHS), temblor de cámara y contador de FPS.
- **Variaciones del Level 0** talladas en el laberinto: arcos, pilares, fosos, zonas sin luz, salas
  rojas y la Manila Room.
- **Cuatro personajes**, dos de ellos desbloqueables —entre ellos **el Entrenador**, el Faceling
  del Level 31, al que los suyos no atacan—, y **71 logros**. Se eligen en un carrusel al darle a
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
| `E` | Abrir contenedor · guardar en un puesto · **mantener** para cruzar una salida |
| `1`–`4` | Sacar objeto (otra vez para usarlo) |
| `Q` / `R` | Beber Almond Water · vendar la peor zona |
| `N` | Elegir qué zona curar |
| `X` | Soltar lo que llevas en la mano |
| `F` / `G` | Linterna · bengala |
| `V` | Palanca: soltarse de un agarre de golpe |
| `T Z Q X` | Soltarse de un agarre forcejeando |
| Clic izq. / clic der. | Golpear con el arma de la mano izquierda / derecha |
| `C` | Habilidad especial del personaje |
| `B` | Abrir / cerrar la mochila |
| `ESC` | Pausa y ajustes |

## Cómo está hecho

Un solo archivo. La única dependencia para jugar en solitario es Three.js 0.150.1 desde CDN; el
multijugador carga además PeerJS, pero **sólo si le das a «Jugar con amigos»**, así que sin internet
el juego normal sigue funcionando igual:

- El laberinto sale de un *recursive backtracker* con *braiding* para abrir salas.
- Las texturas del entorno se pintan en canvas de 384 px (moqueta con fibras, papel pintado con
  costuras y humedades, hormigón con grietas ramificadas, madera con nudos…).
- Los personajes son sprites de 24×36 dibujados píxel a píxel, sombreados dentro de su silueta y
  refinados al doble de resolución con Scale2x, contorno y luz de borde.
- El audio es WebAudio puro: el zumbido de los fluorescentes son tres osciladores filtrados.
- Las entidades comparten un *flow field* recalculado desde el jugador cada 0,35 s.

Los detalles y las trampas están en la [guía](GUIA.md).

## Créditos

Niveles, entidades y salidas basados en el lore público de la
[Backrooms Wiki](https://backrooms-wiki.wikidot.com/), publicada bajo
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Los textos de este juego son
propios; ninguno reproduce los artículos originales.
