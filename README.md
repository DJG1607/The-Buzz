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

- **64 niveles del catálogo de la wiki** (más los asentamientos **Base Beta**, **Camp Amber** y **Base
  Omicron**, y
  niveles sin catalogar generados por semilla cuando te sales del mapa conocido). El catálogo entero
  está listado en [mapa-descenso.html](mapa-descenso.html). En la 3.0 entraron quince, leídos de sus
  páginas de la wiki y enlazados desde donde la wiki dice que se llega: 3.5 *Electropolis*,
  5.1 *Grand Opening of the Terror Hotel Casino*, 6.1 *The Snackrooms*, 9.2 *Black Market*,
  11.2 *The Refuge* (Base Omicron), 15 *Futuristic Halls*, 25 *The Quarter Hub*, 26 *The SS Fun =)*,
  40 *Roller Rockin' Pizza!*, 57 *Diurnal Art Gallery*, 58 *Water Wonder*, 61 *The Backrooms
  Country Club*, 68 *Theater The Eater*, 71 *Void Basement* y 74 *Stage Fright*.
- **Modo Agente del M.E.G.** (botón propio en el título): empiezas en la Base Beta y en el
  **tablón** de cualquier base coges encargos —reconocimiento, documentar una entidad, recuperar un
  maletín, rescatar a un explorador, llevar suministros, plantar balizas, contención y
  expediciones a un nivel concreto—. Se cobran en una base: **fichas**, que se gastan en la
  intendencia, y un objeto. Al acumular misiones se ganan **cuatro trajes exclusivos** (Agente de
  campo, Reconocimiento, Parka de Omicron y Élite del M.E.G.). Tres objetos son del modo: la
  **radio de extracción** (te saca a la Base Beta), la **cámara** (documenta y deslumbra) y las
  **balizas** (localizan salidas).
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
  por WebRTC. Quien crea la sala elige el **modo** (Descenso o Aleatorio); hay **chat** (en la
  sala y con [Enter] en partida), **nombres** encima de cada uno y una lista con la vida de todos.
  Si mueres con amigos, **caes**: tienes 40 s para que alguien te **reanime con un botiquín**.
  Cada uno tiene sus enemigos y su botín. No hace falta instalar nada.
- **Sprites de pixel art al estilo de [Backrooms No-Clip](https://github.com/AgenteMaxo/backrooms-noclip)**:
  nítidos, con contorno oscuro, luz desde arriba y proporciones de persona, con **ciclo de andar
  y de correr** de frente, de perfil y de espaldas (y los animales, al trote y al galope).
- **Opcional, muñecos en 3D** (Ajustes → Gráficos → Personajes): muñecos articulados de cubitos (cabeza,
  torso, brazos con codo, piernas con rodilla; los animales con sus patas, cola, alas o
  tentáculos) con **animaciones de estar quieto, andar y correr** que salen de cómo se mueven:
  respiran, bracean, doblan rodillas y codos al correr, andan de lado y hacia atrás, forcejean
  cuando los agarran, se tambalean aturdidos y levantan los brazos al cargar el especial. Las
  armas equipadas y la linterna se ven en sus manos.
- **Cada personaje con su ropa**: Marcos con chaleco de topógrafo, correa y brújula al cuello;
  Vera con chaqueta de cuero con parches, bufanda y gafas; Lázaro con vendas y el pantalón roto;
  el Entrenador con silbato, chándal, dorsal y patines. Los Skin-Stealers llevan corbata y los
  Partygoers, gorro de fiesta.
- **Aspectos** para cualquier personaje, difíciles de conseguir, cada uno con su ropa (máscara del
  hazmat, placa del M.E.G., cruz del sanitario…): uniforme del M.E.G., traje de
  contención, papel pintado del Level 0 y «el vacío» (10, 30, 60 y 120 niveles superados en el
  modo aleatorio), sanitario (reanimar a 5 compañeros) y expedición conjunta (25 niveles con
  amigos). Se eligen en la ficha del personaje.
- **Botiquín**: cura un poco todas las zonas y corta las hemorragias; con amigos, reanima.
- **Teclas a gusto y mando**: en Ajustes → Controles se cambia cualquier tecla, y se puede jugar
  con un mando de Xbox, PlayStation o genérico (también en los menús, la mochila y el panel de
  curar). Los avisos en pantalla dicen el botón del mando o la tecla según lo último que toques.
- **La palanca**: si algo te tiene agarrado, **[V]** te suelta de golpe y lo deja tonto. Se gasta
  al usarla.
- **Dos manos a la vista** con **tres armas** — tubería, varilla y bate —, una en cada mano:
  golpean con el **clic izquierdo y el clic derecho**. Si llevas las dos ocupadas, la tercera va a
  la mochila y desde ahí se cambia de mano. **Se desgastan y se rompen** (tubería unos 40 golpes,
  varilla 30, bate 24; al aire gastan menos), nunca salen nuevas de un casillero y la **cinta
  americana** les devuelve la mitad del aguante.
- **Diez objetos nuevos** en la 3.0: de la wiki, **Firesalt** (se lanza y aturde), **Smiler
  Repellent**, **Royal Rations**, **suelas de goma silenciosa** (hechas con Liquid Silence), **Lucky
  O' Milk** de fresa y **Greasy Marshmallows**; la **cinta americana**; y los tres del modo Agente.
- **Voz por proximidad y gestos** con amigos: oyes a cada uno según lo cerca que esté (y nada si
  está en otro nivel), con el micro abierto (o, si lo prefieres, manteniendo **[Y]**); y **[H]** abre ocho gestos
  (saludar, aquí, sígueme, espera, peligro, salida, gracias, vale) que salen en un bocadillo y,
  con los muñecos 3D, el personaje los hace. Las salas vacías se cierran solas a los diez minutos,
  y si el anfitrión se va, los demás siguen en solitario.
- **Una habilidad activa por personaje** (tecla **[C]**), con su propio tiempo de recarga: Marcos
  localiza la salida sin brújula, Vera se garantiza un buen casillero, Lázaro aguanta la mitad de
  daño un rato, y el Entrenador aturde todo lo que tenga cerca.
- **La mochila es un cajón que entra por la derecha con [B]**: arriba las dos manos, debajo los
  huecos (los libres se ven punteados) y el equipo. Eliges un objeto y su ficha te dice qué hace,
  con tres botones: **usar** (o empuñar, guardar, encender), **soltar** al suelo (y recogerlo luego)
  y **desechar**, que pide una segunda pulsación. También con flechas, Enter, [X] y Supr, o con el
  mando. **Cada hueco es un objeto**, no una unidad, y cada objeto tiene un máximo que baja con la
  dificultad. Las teclas 1-4 usan el objeto al primer toque (o empuñan el arma de ese hueco).
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
  del Level 31, al que los suyos no atacan—, y **73 logros**. Se eligen en un carrusel al darle a
  Jugar.

## Idiomas

El juego está en **español e inglés**. Se cambia en Ajustes → Idioma, sobre la marcha y sin perder
la partida. En inglés el juego se llama *The Buzz*.

## Controles

Son las teclas por defecto: todas se pueden cambiar en **Ajustes → Controles**, donde también
está el esquema del mando.

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
| `K` / `J` | Cámara del M.E.G. · misión actual (modo Agente) |
| `H` | Gestos (del 1 al 8) |
| `Y` | Hablar por voz (mantener, jugando con amigos) |
| `Enter` | Chat (jugando con amigos) |
| `B` | Abrir / cerrar la mochila |
| `ESC` | Pausa y ajustes |

## Cómo está hecho

Un solo archivo. La única dependencia para jugar en solitario es Three.js 0.150.1 desde CDN; el
multijugador carga además PeerJS, pero **sólo si le das a «Jugar con amigos»**, así que sin internet
el juego normal sigue funcionando igual:

- El laberinto sale de un *recursive backtracker* con *braiding* para abrir salas.
- Las texturas del entorno se pintan en canvas de 384 px (moqueta con fibras, papel pintado con
  costuras y humedades, hormigón con grietas ramificadas, madera con nudos…).
- Los personajes son sprites de 48×72 dibujados por código a 1 píxel: un esqueleto 2D (cadera,
  rodilla, hombro, codo) del que salen los fotogramas de andar y correr en cada dirección, y un
  último pase que pone el contorno y la luz. Los muñecos 3D opcionales son vóxeles pintados con
  la misma paleta y ropa, animados por procedimiento.
- El audio es WebAudio puro: el zumbido de los fluorescentes son tres osciladores filtrados.
- Las entidades comparten un *flow field* recalculado desde el jugador cada 0,35 s.

Los detalles y las trampas están en la [guía](GUIA.md).

## Créditos

Niveles, entidades y salidas basados en el lore público de la
[Backrooms Wiki](https://backrooms-wiki.wikidot.com/), publicada bajo
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Los textos de este juego son
propios; ninguno reproduce los artículos originales.
