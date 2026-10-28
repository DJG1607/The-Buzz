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
| `herramientas/` | `anexo.js` regenera el anexo desde el catálogo del juego; `publicar.js` saca la copia que se publica (sin el modo historia, que aún no sale). |

---

## De qué va

Has hecho *noclip* fuera de la realidad y caes en el **Level 0** sin nada en los bolsillos. No hay
final: sólo profundidad. Cada nivel tiene varias salidas, cada una baja a un sitio distinto, y el
único sitio donde se guarda la partida son los puestos abandonados del M.E.G.

## Lo que hay dentro

- **Actualización de Halloween y otoño (5.0)**:
  - **Niveles mucho más grandes**: 1,7 veces de lado, casi el triple de superficie (los asentamientos,
    1,3), con más casilleros, algo más de fauna, una salida más en los grandes y más zonas especiales, y
    más grandes. Los Backrooms del modo historia también crecen.
  - **Sin bordes**: en todos los modos el laberinto sigue hacia donde andes, en cualquier dirección. Lo
    que hay al otro lado del borde es el principio del nivel, sin costuras a la vista, y cada vez que lo
    cruzas la parte del nivel que queda lejos y no se ve se reordena, así que nunca vuelves exactamente
    al mismo sitio. La fauna te sigue por encima de la costura y el plano también.
  - **Halloween y otoño** (de finales de septiembre a noviembre, o siempre o nunca desde Ajustes →
    Gráficos): calabazas talladas con una vela dentro por los niveles, a veces con **caramelos** al lado
    (+8 de cordura); telarañas en las esquinas del techo; y al aire libre, en calles y campos, hojas secas
    por el suelo y cayendo. Los casilleros dan caramelos en vez de parte del Almond Water. Dos logros,
    **Truco o trato** (trece caramelos) y **Noche de calabazas** (veinte calabazas), y el **disfraz de
    calabaza**. En el título caen hojas y un aviso cuenta la actualización.
  - **Las versiones**: la versión del título (y un botón en Ajustes) abre la lista de todas las versiones,
    de la 5.0 a la primera, con lo que trajo cada una.
  - **Interiores de la casa**: moldura en lo alto de las paredes, enchufes, interruptores junto a las
    puertas y cuadros; y ya no se ven flotando la sombra del techo ni lo que va pegado a un muro que la
    cámara quita.
- **Modo historia (5.0) · Capítulo 1: «Estática»** (botón propio en el título). Una historia aparte,
  en español e inglés, con personajes que no salen en ningún otro modo. Wrenfield, Michigan, octubre
  de 2025: hace trece meses Danny Navarro entró en el centro comercial abandonado del pueblo y no
  volvió. Su hermano Owen, de dieciséis años, coge su videocámara y cruza la misma pared. Casa,
  centro comercial, Level 0, Level 1 y las Tuberías; diálogos con decisiones, notas, una videocámara
  con visión nocturna que enseña lo que no se ve (flechas de tinta invisible, y algo con uniforme de
  vigilante que no quiere que lo graben), escondites, persecuciones y un interludio en el que juegas
  con **Danny**, el personaje secreto. Puntos de control en cada tramo. Pensado para adolescentes y
  adultos. Dura alrededor de hora y media, con calma: el paseo nocturno por Maple Street hasta el
  centro comercial (con Earl, el de la gasolinera), una cena con June en su nido, recuerdos de Danny y
  momentos para pararse a mirar. La casa está hecha a escala real, con sus puertas y sus muebles.
  Se juega en **tercera o primera persona** (se elige en Ajustes → Controles). Si te quedas sin
  aliento corriendo, Owen tropieza y se cae, y tarda en levantarse.
- **Música y sonido nuevos (5.0), en todos los modos**: además del acorde de fondo, cada nivel tiene una
  pieza que suena un par de minutos y deja silencios (caja de música, piano de madrugada, sintetizador de
  VHS, pulso grave, abismo, hilo musical, la cinta de June, el final, nana, consola de 8 bits, órgano, lluvia,
  olas, máquinas y jazz roto; cada nivel elige entre varias y cada vuelta cambia de tono y de aire),
  y si algo te persigue entra una capa de percusión. Reverberación según el tamaño del sitio, pasos que
  suenan distinto en moqueta, madera, baldosa, metal, agua o hierba, ruidos lejanos de vez en cuando y,
  en la historia, una voz distinta para cada personaje cuando habla y jadeos cuando te cansas.
- **80 niveles del catálogo de la wiki**: en la 5.0 entraron catorce más, enlazados desde donde la
  wiki dice que se llega: 16 *Altered Topography*, 17 *The Carrier*, 18 *Memories*, 20 *Fun Zone
  Boreas Structure*, 38 *Fold Point*, 39 *Enchanted Forest*, 46 *Arabian Desert*, 48 *The Sunset
  Beach*, 54 *Stairwell of Spirals*, 55 *Pit Stop*, 63 *Tranquility*, 66 *Exhibit*, 70 *Froidetown* y
  75 *Liminality*.
- **Quinto personaje (5.0): Inés**, sanitaria del M.E.G.: empieza con botiquín y vendas, sus vendajes
  curan el doble, las hemorragias le duran la mitad y su habilidad, **Triaje**, cura todo el cuerpo
  de golpe. Se desbloquea al llegar al descenso 4.
- **Armas y equipo nuevos (5.0)**: hacha de bombero, llave inglesa, palo de hockey y táser; y cuatro
  prendas más: linterna frontal (luz sin ocupar una mano), cazadora de cuero, rodilleras y casco de
  moto.
- **Emotes animados (5.0)**: doce gestos (bailar, sentarse, reírse, «ni idea», saludar…) que se ven
  animados en el sprite y en la figura 3D, también los de tus compañeros.
- **Owen, jugable (5.0)**: al acabar el capítulo 1 del modo historia, su protagonista pasa a los demás
  modos. Su habilidad es el **NightShot** de la cámara de Danny (10 s viendo a las entidades a través de
  las paredes) y empieza con dos botellas.
- **Mecánicas nuevas (5.0)**: **agacharse** en sigilo (Z, en todos los modos: más lento y casi sin
  ruido), **botellas vacías** que se lanzan (T) y al romperse atraen a lo que te busca, y en la historia
  **contener la respiración** escondido (mantener Mayús) si llegas jadeando y algo pasa al lado. Owen
  hace fuerza al levantar persianas o girar válvulas, suda cuando va sin aliento y en los niveles húmedos
  gotea el techo. Las cintas VHS suenan a cinta (siseo, zumbido, chasquidos, voces gastadas), los
  espejos de la casa te reflejan y la tele echa dibujos animados.
- **El barrio de Wrenfield (5.0)**: el paseo hasta el Commons es un barrio de verdad. Maple Street tiene
  casas de madera a los dos lados, con porche, frontón y garaje, y la de los Navarro en mitad de la
  calle. Le siguen un parque grande con estanque, templete y columpios (cualquier camino lleva a la
  puerta del norte), una calle de tiendas y el Gas-N-Go. No se va en línea recta: los carteles y el
  objetivo te guían. Los personajes hablan con «voces falsas» de sílabas, cada uno con su tono, y en
  sitios estrechos la cámara pasa sola a primera persona en vez de volverse loca. Farolas en las aceras,
  rayas en la calzada, bordillos, cables de la luz, arbustos, sombras bajo los muebles, el muelle de carga
  con su persiana y más calles de decorado alrededor para que el barrio no se acabe en el vacío.
- **El móvil de Owen (5.0)**: en la historia, la **M** saca un móvil de verdad: chats con foto de cada
  contacto (Maya, mamá, Danny con el «lo siento» que Owen nunca envió, el equipo de cross, papá), en
  los que a veces eliges qué contestar; llamadas entrantes que puedes coger o colgar (y con Maya hablas
  mientras andas); fotos dibujadas con los personajes; las notas que has leído; un mapa con GPS (que en
  los Backrooms se vuelve loco) y la linterna. Mientras lo miras, el juego espera.
- **Grabar pruebas (5.0)**: con la videocámara encendida, clic para grabar. Hay **ocho pruebas** en el
  capítulo (cosas que sólo se ven por el NightShot, el vigilante bajo la farola, las pintadas de Danny…);
  se guardan en las fotos del móvil y grabarlas todas da un logro.
- **La casa de dos plantas (5.0)**: arriba los cuartos y el pasillo; abajo el salón y la cocina, con una
  escalera de verdad (los escalones crujen si bajas de pie cuando mamá está en casa). La puerta de Danny
  está precintada por la policía, con cinta americana y una nota de mamá: hay que arrancarlo. Las fotos
  de los marcos son de la familia.
- **Tutoriales (5.0)**: las mecánicas de la historia se aprenden según aparecen (el móvil, la cámara,
  agacharse, la linterna, correr, esconderse, las botellas y contener el aliento), cada una con una
  tarjeta que para el juego; sólo andar va en un aviso al principio. En la pausa salen los controles de
  la historia (los que ya conoces). Los rótulos de arriba a la izquierda se esconden solos.
- **Accesibilidad (5.0)**: pestaña propia en Ajustes con filtros de **daltonismo** (protanopia,
  deuteranopia, tritanopia y monocromo), tamaño y velocidad del texto, fondo detrás de los subtítulos,
  **sin destellos** (quita parpadeos, fogonazos y temblores), agacharse y correr sin mantener la tecla,
  rótulos de la historia (se esconden, siempre o nunca) y contraste alto.
- **La Noche del Diablo (5.0)**: el paseo hasta el Commons ya no va al grano. Wrenfield está decorado para
  Halloween (calabazas talladas que parpadean, telarañas, fantasmas de sábana colgados de los árboles,
  lápidas de broma, esqueletos, guirnaldas de colores, espantapájaros, hinchables) y se puede explorar:
  **Elm Court**, una calle sin salida con la fiesta de Tyler Brandt (música amortiguada y ventanas de
  colores), la casa encantada de los Henderson (cuidado con el esqueleto), dos chavales empapelando un
  arce que salen corriendo, el cuenco de caramelos de la señora Alvarez y la pasarela rota del arroyo.
  En el parque, el festival de mañana a medio montar y **Pickles**, el gato perdido de los carteles
  (maúlla si estás cerca). Hay **seis recuerdos de Danny** repartidos por el barrio, cada uno con su logro
  y sus consecuencias (Maya recibe el caramelo, Tyler le manda recuerdos…). Si te entretienes, Maya
  escribe. Al llegar, una escena en el muelle de carga en vez de un fundido. Árboles nuevos (con ramas de
  verdad, abedules y otoño) y los postes de la luz en el borde de la acera.
- **Avisos de mensaje (5.0)**: cada mensaje entra con un aviso arriba («Maya · escribiendo…») y, dentro del
  chat, los tres puntitos mientras te escriben; con la tecla del móvil abres ese chat.
- **Baterías (5.0)**: el móvil se gasta poco a poco (más con la pantalla encendida y la linterna) y la
  cámara al usarla; avisan al 20 % y al 5 %, y el móvil se apaga a cero. Las baterías externas recargan.
  Nunca te quedas atascado: si la historia necesita la cámara, aguanta un poco más.
- **La casa, otra vez (5.0)**: la escalera sube por un hueco de verdad en el techo y arriba se ve el hueco
  del suelo con los escalones bajando; Owen sube y baja andando. La cámara en tercera persona ya no salta
  a primera: se queda detrás y los tabiques que estorban desaparecen mientras estorban (como en los
  juegos de vista recortada); los muebles altos no se le meten delante. Agacharse se dibuja de nuevo (en
  cuclillas, con las manos en las rodillas) y las voces se oyen de verdad (y la música baja cuando alguien
  habla).
- **Luz de noche (5.0)**: las lámparas brillan (un halo suave en farolas, porches, fluorescentes, guirnaldas
  y calabazas, en todos los modos). En el barrio, la luna proyecta sombras de casas, árboles y buzones (en
  calidad Alta y Ultra), caen hojas, hay bruma baja en el parque, en Elm Court y en el arroyo, sale humo de
  las chimeneas y de vez en cuando cruzan murciélagos. El cielo tiene nubes que se mueven y una luna con
  halo. Asfalto con grietas, parches y manchas de aceite; césped con briznas y hojas; casas con arbustos,
  cortinas y una lámpara en las ventanas encendidas, cuya luz cae sobre el jardín. En la historia, una
  viñeta suave en los bordes de la pantalla.
- **Interiores y Backrooms (5.0)**: en todos los interiores (la casa, el Commons, los Backrooms y los
  niveles de los demás modos) hay sombra suave donde se juntan paredes, suelo y techo, y cada lámpara deja
  un charco de luz en el suelo y un brillo en el techo, que se apagan con ella. En la historia, el Level 0
  tiene enchufes en las paredes, placas del falso techo caídas (con el agujero negro arriba) y manchas de
  humedad; el Level 1, charcos que brillan, cables colgando y palés; las Tuberías, luces rojas de
  emergencia que laten y vapor saliendo de rejillas del suelo.
- **Animaciones más suaves (5.0)**: andar y correr tienen ahora 8 fotogramas por paso en vez de 4 (el
  jugador, los personajes de la historia, los compañeros y el Acomodador). El paso pesa: el cuerpo sube a
  mitad de zancada y se hunde un poco al pisar, y corriendo levanta polvo (u hojas). Parado un rato, el
  personaje mira a los lados de vez en cuando, y los de la historia también.
- **La cámara de la casa, ahora sí (5.0)**: en la casa la cámara va siempre a la misma distancia detrás de
  Owen y por encima de la altura del techo, mirándole desde arriba como en una casa de muñecas. Nunca se
  acerca ni se aleja sola; las paredes, los marcos y las puertas que se meten en medio desaparecen mientras
  estorban, y lo que cuelga del techo (lámparas, el ventilador) se esconde cuando tapa. Un telón negro
  impide ver el otro piso.
- **De espaldas y de frente (5.0)**: al andar visto desde atrás o de frente, el pie que avanza se levanta
  (desde atrás se le ve la suela), los brazos se balancean y el cuerpo carga el peso en la pierna que apoya.
- **Enemigos (5.0)**: el Acomodador tiene la cara hecha de estática que hierve, da tirones cuando lo miras
  por la cámara, camina con pasos pesados y murmura por una radio vieja; los perros jadean cuando te
  persiguen, se les oyen las patas y les brillan los ojos en la oscuridad.
- **Sonido en el espacio (5.0)**: cada sitio tiene sus ruidos, que llegan de un lugar concreto (bajan con la
  distancia y suenan a la izquierda o a la derecha): en el barrio, perros, búhos, coches y un tren a lo
  lejos, carillones, ráfagas de viento, petardos de la Noche del Diablo y risas; en casa, la madera que cruje,
  las tuberías, el tic-tac del reloj de la cocina y la nevera; en el Commons, goteras, palomas, cristales y
  golpes metálicos; en los Backrooms, fluorescentes que chasquean, pasos lejanos, maquinaria, cadenas,
  vapor y tuberías que golpean. Los pasos sobre el asfalto suenan a asfalto.
- **Cielo (5.0)**: los niveles al aire libre tienen cielo de verdad, con estrellas y luna de noche.
- **Música (5.0)**: la historia tiene su propio tema, un leitmotiv en re menor que suena en el menú (caja de
  música y luego piano sobre cuerdas), en la casa (el tema de Danny, en piano) y en Maple Street (un vals de
  caja de música desafinada). Instrumentos nuevos (cuerdas que vibran, trémolo, coro lejano, trozos de radio
  mal sintonizada, latido y pizzicato), el piano con su martillo, pads que respiran, la música en estéreo y
  con su propia sala. Cuando algo anda cerca y todavía no te persigue entra una capa de tensión (un trémolo
  grave y un latido) que crece cuanto más cerca está; si te persigue, manda la percusión de siempre.
- **Menús (5.0)**: detrás de la pantalla de título la cámara recorre el Lobby a la altura de los ojos, como
  una cinta encontrada (REC, contador, líneas de vídeo y una franja que pasa); el título parpadea como un
  fluorescente; los botones hacen un tic al pasar por encima y el clac de un interruptor al pulsar; las
  pantallas entran con un destello de cinta; el texto largo del principio está plegado en «Cómo funciona», y
  el modo historia se presenta como una cinta de vídeo con su etiqueta. En el menú suena el tema del juego
  (desde el primer clic o tecla). «Sin destellos» y «reducir movimiento» quitan los parpadeos.
- **Sprites retocados (5.0)**: sombra y pliegues en la ropa, raya en el pantalón, brillo en los zapatos,
  volumen en la cara y mechones en el pelo, y una fila nueva de posturas (sin aliento, tropiezo, de
  rodillas, hablar con las manos, brazos cruzados, la mano en la nuca) que usan los personajes de la
  historia cuando hablan o esperan.
- **El resto del catálogo de la wiki** (más los asentamientos **Base Beta**, **Camp Amber** y **Base
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
  Cada uno tiene sus enemigos y su botín. No hace falta instalar nada. Desde la 4.0, la sala puede
  ser una **sala grande** de hasta 10 jugadores (la voz sólo con los tres más cercanos).
- **Sala pública (4.0)**: un botón, sólo tu nombre, y entras en una sala con sitio (hasta 10). El
  personaje se elige ya dentro del juego. Con un **walkie-talkie** (todos bajan con uno) hablas por
  voz con quien lleve otro aunque esté en otro nivel; el chat de texto va con [Enter].
- **Ropa y protecciones (4.0)**: casco, mascarilla, chaleco, traje, guantes y botas en cuatro ranuras.
  Cada prenda se come parte de los golpes a las zonas que cubre, se desgasta y se rompe; se ve en el
  personaje (tuyo y de tus compañeros), y la mochila se ve en cualquiera. Ponerse algo, beber,
  vendarse o recibir un golpe tienen su animación.
- **Versión a la vista**: en Ajustes aparece la versión y un botón para buscar actualizaciones.
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
- **Calidad gráfica que se nota**: Baja, Media, Alta y Ultra no sólo cambian la resolución sino
  también las luces, la distancia de dibujado, el polvo, el grano y el tipo de material (en una
  gráfica integrada a 1080p, Baja pasa de 14 ms a 1 ms por fotograma y Alta de 25 a 16). Y un
  **ajuste automático** baja la resolución solo si el juego va a menos de 40 fps.
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
| `↑ ↑ ↓ ↓ ← → ← → B A` | Modo pruebas (encender / apagar) |

**Modo pruebas.** El código Konami, en cualquier pantalla, lo enciende o lo apaga. Para encenderlo
pide una **contraseña**, escondida en un acertijo de cuatro líneas de código cifradas cada una de una
forma distinta: sin resolverlo no se entra (el navegador la recuerda una vez acertada). Es para buscar
fallos: desbloquea todos los personajes y trajes, enseña el códice y el mapa del descenso enteros,
da fichas del M.E.G. sin límite y cada partida empieza con todo el equipo, las tres armas y cada
objeto a tope (mochila de 30 huecos). En la pausa aparecen **Dame todo**, **Invencible** y
**Viajar a un nivel** (desde el mapa del descenso), y **Salir del modo pruebas**. Mientras está encendido no se ganan logros, y
al apagarlo todo vuelve a estar como estaba: no toca el progreso de verdad. La versión del título
lo avisa («MODO PRUEBAS»).

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

## Privacidad

En la página publicada se cuentan las visitas y las partidas empezadas con
[GoatCounter](https://www.goatcounter.com): sin cookies, sin nombres y sin guardar nada que te
identifique, sólo cifras. Se apaga en **Ajustes → Partida → Contar mi visita**, y no cuenta nada
desde un archivo local ni con el modo pruebas.

## Créditos

Los personajes, el pueblo de Wrenfield y la historia del modo historia son inventados para este
juego.


Niveles, entidades y salidas basados en el lore público de la
[Backrooms Wiki](https://backrooms-wiki.wikidot.com/), publicada bajo
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Los textos de este juego son
propios; ninguno reproduce los artículos originales.

