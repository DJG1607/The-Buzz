# Pruebas

Comprobaciones automáticas del juego. No hace falta instalar nada: sólo Node.

```bash
node pruebas/todo.js                 # todas, completas (7-8 minutos): antes de commitear
node pruebas/todo.js rapido          # todas, versión corta (~1 minuto): mientras tocas algo
node pruebas/todo.js niveles         # sólo una
node pruebas/todo.js rapido mundo    # sólo una, versión corta
```

La versión rápida hace las mismas comprobaciones con menos semillas y menos vueltas en las
tres pruebas pesadas (`niveles`, `mundo` e `inventario`). Lo único que se salta es que
todos los destinos de cada nivel lleguen a salir, porque eso necesita muchas semillas.

Termina con código 0 si todo va bien y 1 si algo falla.

---

## Qué mira cada una

### `sintaxis.js` — un segundo
Que el archivo compile y **que no haya nada definido dos veces**. Esto último parece
una tontería y no lo es: en JavaScript gana la última definición, y el juego tuvo
meses dos `rollDice` y dos `lootForRoll`. La copia vieja estaba más abajo, así que era
la que mandaba: el modificador de dado de la dificultad no hacía nada y los casilleros
repartían premios que no cabían en la mochila. Nada de eso se veía jugando.

También comprueba el `<meta charset>`, la versión de Three.js y que no haya aparecido
ninguna dependencia externa.

### `niveles.js` — un par de minutos
Genera los 51 niveles con 20 semillas cada uno y comprueba que se pueden jugar: que se
llega a las salidas y a los contenedores, que no apareces dentro de una pared ni con una
entidad encima, y que ningún mueble deja trozos del mapa incomunicados.

Después revisa el grafo de saltos (ninguna salida a un nivel inexistente, ningún nivel
inalcanzable), que **todos los destinos declarados lleguen a aparecer** y que la amenaza
media suba con el campo `risk`.

> Si ves «Level 1: 2 de 6 salidas», tranquilo: cada partida coloca sólo 2-4 al azar.
> Es a propósito. Lo que importa es la línea de destinos: `6/6 aparecen`.

### `combate.js` — unos segundos
Que **huir siga funcionando**: la velocidad sostenible del jugador es ~4,3 m/s y sólo el
Hound y el Wretch la superan; los dos se cansan a los 7 s y bajan por debajo de andar.
Si tocas una velocidad de persecución, esta prueba te dice si te has pasado.

Después, los ataques especiales: que todas las entidades tengan el suyo en los dos
idiomas, que quiten exactamente el porcentaje de vida que dice su ficha y que **ninguno
mate de un golpe estando sano**. Y que los que atacan a distancia avisen antes y se
puedan esquivar, que el Smiler sólo reaccione a luz o ruido y que el Duller alcance a
través de la pared.

### `objetos.js` — unos segundos
El botín (que un 6 nunca salga muerto), el dado de la dificultad, que el plano y la
grabadora caduquen al bajar de nivel pero la brújula no, la luz de las bengalas medida a
varias distancias, y que todos los objetos estén en español y en inglés. Desde la 3.0, los
diez objetos nuevos: que existan con su icono, que los tres del modo Agente no salgan en los
casilleros, y el efecto de cada uno (Firesalt, repelente, raciones, leche, marshmallows, suelas,
baliza, radio y cámara).

### `armas.js` — unos segundos
Lo añadido en la versión 1.5.0: que las armas de mano se repartan entre las
dos manos y golpeen con su propio cooldown; que las cuatro habilidades activas hagan
exactamente lo que dicen (Marcos localiza la salida, Vera se garantiza un buen casillero,
Lázaro reduce el daño a la mitad, el Entrenador aturde en área); que Sin retorno no deje
guardar; y que las paredes atravesables salgan en pares, no toquen el laberinto y
teleporten de verdad. Desde la 3.0, que las armas se
gasten y se rompan (el bate, justo a los 24 golpes), que la cinta americana las arregle y que
soltarlas no les devuelva el aguante.

### `curacion.js` — unos segundos
Tres arreglos y un añadido de la versión 1.5.1. El más sutil: **`wipeProgress()` borraba
`localStorage` pero no `G.codex` en memoria**, así que el primer objeto o entidad que
vieras en la siguiente partida volvía a guardar el códice viejo por encima del que
acababas de borrar — el bug no se notaba hasta la *segunda* vez que mirabas el códice.
También prueba que curar una zona concreta del maniquí no toca las demás (y que la tecla
R sigue curando la peor, sin romper eso), que `renderCodex()` no revienta con los iconos
nuevos, y que la música/ambiente calculan bien su modo y su sabor por nivel — el propio
sonido no se puede verificar en un test, así que esto comprueba los números que lo deciden
(la raíz baja y los intervalos se cierran cuanto más peligroso es el nivel) y que la
generación de audio en 10 niveles reales no lanza ninguna excepción.

### `mundo.js` — un par de minutos (unos segundos en la rápida)
Lo de la versión 1.6.0. Que el dado sólo vacíe casilleros con un 1 natural y que lo que no cabe se
quede dentro; que las diez entidades avisen y peguen con su especial (y los Facelings no
contra el Entrenador); la fauna de varios niveles contra la wiki; que la brújula pierda
señal con la distancia y no dé metros; que haya 1-3 salidas y lejos, y que cruzarlas se
corte al soltar E, alejarte o que te agarren. Lo más pesado es el **reordenamiento**: cada
nivel con varias semillas, reordenado cuatro veces, comprobando con un BFS que nada queda
incomunicado, que no se empareda ningún casillero y que cada muro tiene su bloque en 3D.
Y el **modo aleatorio**: que las salidas vayan a sitios fuera del grafo normal, que el
destino anunciado sea el que te encuentras, que la fauna se baraje de verdad y que el
catálogo normal quede intacto al salir. Al final, un barrido del código contra el bug del
idioma: ningún `textContent = "…"` sin `tx()`, ninguna muerte sólo en español y los controles
de la pausa con su `data-en`.

### `inventario.js` — un minuto (unos segundos en la rápida)
Lo de la versión 1.7.0: que ningún nivel pase del techo de entidades de su dificultad (ni a
descenso 21) ni de 4 por especie; que dos entidades no carguen su especial a la vez y
haya pausa entre uno y otro; que cada hueco sea un objeto y respete su máximo, que baja
con la dificultad; soltar, recoger y desechar; el uso de una pulsación; los ajustes
repartidos en pestañas; y en el código, que el brillo de las salidas no tape al jugador,
que no haya baliza y que las paredes de clipping arranquen casi invisibles. Desde la 3.0.1,
el cajón de la mochila: que todo lo que se clica en el HUD pida el ratón (`pointer-events:auto`;
sin eso los botones de usar, soltar y desechar no hacían nada), sus tres acciones con la
confirmación de desechar, empuñar y guardar armas, las flechas, Enter y Esc, y lo mismo con un
mando simulado (B, cruceta, A, X, Y). Desde la 3.0.2, el modo pruebas: que el código Konami
pida la contraseña sólo completo y en orden, que el acertijo se resuelva con sus pistas (en los
dos idiomas) y dé la contraseña, que ésta no esté escrita en el juego, que desbloquee personajes y trajes, que no dé logros ni
gaste fichas de verdad, que cada partida empiece con todo, la invencibilidad, viajar a un nivel,
y que al apagarlo todo vuelva a estar como antes.

### `mundo.js` — calidad gráfica (desde 3.0.5)
Que cada nivel de calidad pida más que el anterior, que el recorte de distancia no se note en
ninguno de los 66 niveles (lo que se deja de dibujar ya lo tapa la niebla), el material sencillo,
cuándo se pinta el grano, la resolución dinámica y que la viñeta ya no use «multiplicar».

### `multijugador.js` — unos segundos
El multijugador sin PeerJS: carga **tres copias del juego** (anfitrión y dos invitados) y las
conecta con una red de mentira en estrella, como la de verdad. Comprueba que los invitados se
ven entre sí gracias al reenvío, que el modo de sala lo elige sólo el anfitrión, que morir con
amigos te deja caído, que reanimar gasta un botiquín, y que se acaba si nadie llega o no queda
nadie en pie. También el botiquín en solitario, los aspectos y lo que cuesta desbloquearlos,
cambiar e intercambiar teclas y un mando simulado. Desde la 3.0.1, la sala: que el compañero se vea
desde tu cámara (de frente si viene hacia ti), que no salgan clones, que una sala vacía se cierre
a los diez minutos y que el invitado vuelva a solitario si el anfitrión deja de dar señales. Desde la 3.0.3,
entrar en una sala con un `Peer` de mentira: que el anfitrión recupere la sala si pierde el
servidor (sin abrirla dos veces), que el que no consigue entrar recupere sus botones y sepa por qué,
que el invitado empiece en la semilla del anfitrión y que cada partida traiga una nueva, que un compañero caído se tumbe (y no se aplaste), que cambiar a 3D con la sala abierta los rehaga y que se vea lo que llevan en las manos, los objetos que se sueltan (que los vean los compañeros, con su desgaste, que recogerlos los quite
para todos, y que el que llega después los vea), el límite de 40 s con su aviso a los 8, que use su propia lista de STUN (no los TURN de PeerJS, que ya no existen) y deje sitio para un TURN, que salir tú mismo no dé el falso aviso del anfitrión y que el latido y los diez
minutos vayan por reloj real. Desde la 3.0, los gestos (que lleguen a los
demás por la centralita, con su bocadillo), el volumen de la voz según la distancia y las
paredes, y que el aviso de «tengo voz» se reenvíe.

### `agente.js` — unos segundos
El modo Agente del M.E.G. de principio a fin: que haya tablón en las bases (también en la
Base Omicron, nueva) y no fuera de ellas, que ofrezca tres encargos distintos, y cada uno de
los ocho tipos cumplido con la lógica real (reconocimiento sin contar dos veces el mismo nivel,
documentar la entidad correcta, balizas separadas más de 25 m, el maletín y el explorador
lejos de donde apareces…). También cobrar, la intendencia, los cuatro trajes y que el encargo a
medias se guarde con la partida.

### `ropa.js` — unos segundos
La ropa de la 4.0: la tabla de seis prendas (con inglés y su letra), que cada una se coma su parte del golpe sólo en las zonas
que cubre, que se desgaste y se rompa, que protejan menos gastadas, ponerse y quitarse (cambiar una prenda
devuelve la anterior, sin sitio no te la quitas, soltar y recoger conservan el desgaste), guardar y cargar
(también un guardado raro o antiguo), la firma del aspecto y la limpieza de la que llega de otro jugador, la
mochila en cualquier personaje, las animaciones (y que se avise a los compañeros), los logros nuevos y la versión: `4.0`
exacto, comparar números y buscar la publicada (sin caché y sin romperse desde un archivo local) y el aviso de versión ajena.

### `salagrande.js` — unos segundos
La sala grande: el aforo (4 y 10, con el aviso de «llena» y la reconexión del que ya estaba), el tamaño que
conoce el invitado, el reenvío adelgazado (lejos una de cada tres, otro nivel una de cada seis, lo cercano entero) con
nueve invitados repartidos, que el mensaje corto pese menos y conserve lo que se sabía del jugador, que en sala normal todo
siga igual, y la voz: sólo los más cercanos, sin cortar y volver a llamar al cuarto por nada, y rechazar llamadas de más.

### `salapublica.js` — unos segundos
La sala pública y el walkie con un `Peer` de mentira: que sólo pida nombre, que reclame «publica-1» y la abra
como anfitrión (sala grande, directo al juego y personaje pedido dentro, sin poder saltarlo con Escape), que el
que llega entre como invitado cuando ya hay anfitrión y espere al nivel, que una sala llena o muda lleve a la
siguiente (de la 1 a la 6, en orden) y que al acabarlas lo diga, que un fallo de red no pruebe las seis, que salir cancele la
búsqueda, que si cae el anfitrión la partida siga y se vuelva a buscar sala sin pedir otra vez personaje, y que las
salas con nombre no cambien. Del walkie: que exista, salga de casilleros y tienda, que todos bajen con uno en
multijugador, que la posición diga si lo llevas, que se oiga en otro nivel sólo si los dos lo llevan, y que en sala grande entre en
el reparto de voces. Y que la pista del chat de texto se vea con sala.

### `estadisticas.js` — unos segundos
El contador de visitas (GoatCounter): que sólo cuente en la página publicada (no desde un archivo local, localhost,
127.0.0.1 ni `.localhost`), que se apague desde Ajustes y con el modo pruebas, que cargue el script con el código de
sitio correcto y una sola vez, que apunte partida (solitario y multijugador) y sala pública, que un fallo de GoatCounter no
rompa el juego, y que la opción esté con su explicación en los dos idiomas y el script no esté fijo en el HTML.

### `historia.js` — medio minuto (un par en la completa)
El modo historia: que el capítulo 1 tenga sus tramos con título en los dos idiomas, que los personajes sean
exclusivos (ni Owen ni Danny en la selección; ningún nombre repetido con los otros modos) y que Danny sólo se juegue
en el interludio; que cada mapa se monte y se llegue a todo (menos lo que está detrás de una puerta que nunca se
abre); que ninguna frase del guion se quede sin traducir y que el recuento de notas cuadre. Y lo más útil: **un bot
juega el capítulo entero** sin navegador (pasa textos, elige, usa lo que hay, va adonde le esperan, se esconde) y
tiene que llegar a la pantalla final pasando por todos los tramos en orden; en la completa lo hace tres veces,
con la primera, la segunda y la tercera respuesta en cada pregunta. También mira lo de la segunda tanda: que la
casa vaya a escala con puertas de dos celdas, que haya ajuste de primera persona (y que deje mirar más
arriba), que quedarse sin aliento corriendo tumbe a Owen y lo levante por fases (y que perseguido sólo tropiece),
que cada personaje tenga su voz, y la música: que todas las piezas generen notas, que todos los niveles de los
otros modos tengan pieza y no todos la misma, y que cada mapa de la historia tenga la suya.
Y la tercera tanda: hacer fuerza (postura y que se acabe sola), contener la respiración escondido (jadeando
al lado del Acomodador te oye; conteniéndote no), que una botella rota atraiga a los enemigos, las teclas de
agacharse y lanzar, el sonido de las cintas, los espejos y la tele, que cada nivel tenga al menos dos piezas
posibles y que Owen se desbloquee en los demás modos al acabar el capítulo, con su NightShot. Y el barrio:
que de casa al Commons no se vaya en línea recta, que haya casas a los dos lados con la de los Navarro en mitad
de la calle, que el parque sea grande, que estén las tiendas y la gasolinera, y que agacharse tenga sus dibujos.
Y la sexta tanda: el móvil (chats con su contacto y en los dos idiomas, el borrador de Danny, las fotos, que se
abra, se navegue con Enter/Esc y se cierre, y que la tecla de primera persona ahora sea la del móvil), los
tutoriales (abren una tarjeta, se apuntan, no se repiten y están todos en su sitio del guion), las ocho pruebas
para grabar (cada una registrada en el capítulo, más su logro), la casa de dos plantas (escaleras, hueco,
precinto en la puerta de Danny y que andando hacia la escalera se cambie de piso; la prueba de los mapas cuenta
como alcanzable lo que se llega subiendo o bajando) y las filas de Accesibilidad con los cuatro filtros de
daltonismo. Y la séptima: que ninguna cámara de escena esté metida en una pared, que Elm Court sea un fondo de
saco (no un atajo al Commons) y la pasarela no se cruce, que haya Halloween por todo el barrio, la gente nueva
con su aspecto y su voz, los seis recuerdos y Pickles con sus logros, los postes al borde de la acera, que la
escalera tenga sus huecos y Owen la suba de verdad, que las baterías se gasten (y la cámara aguante si el
guion la necesita), que los mensajes tarden según lo largos que son y que las voces tengan formantes y la
música se aparte. Y la octava, los gráficos de noche: que la calle tenga cientos de halos, luna, hojas, bruma,
murciélagos, asfalto y humo en las chimeneas, que en los demás modos las lámparas también brillen, que
todos los interiores tengan sombra en las esquinas y charcos de luz, y que las Tuberías tengan sus luces
rojas y su vapor. En `figuras.js`, que el atlas de cada persona tenga 16 columnas (8 de andar, 8 de
correr) y que el paso tenga 8 fases. Y la novena: que la cámara de la casa vaya siempre a la misma distancia
y por encima del techo, el telón entre plantas, que cada sitio tenga sus ruidos (y existan), que salgan de un
sitio con panorámica, y los pasos, la radio, la cara de estática, el jadeo y los ojos de los enemigos. Y la
décima, música y menús: que el leitmotiv quepa en sus compases y se oiga en el menú, la casa y la calle, que
existan los instrumentos nuevos y todos los que usan las piezas, el estéreo y la sala, que la tensión suba
con un perro a 4 m (y no con el Acomodador invisible), que en el menú suene música y que la cámara del
título recorra el Lobby sin pegarse a las paredes. Y lo de la actualización de Halloween y otoño: en
`historia.js`, que los Backrooms de la historia sean más grandes y que la casa tenga sus molduras, enchufes y
cuadros (y que se escondan con su muro); en `mundo.js`, que todos los niveles crezcan, que no tengan borde
(la costura cosida, nada incomunicado, el jugador y la fauna al pasar), que lo lejano se reordene, que salgan
más zonas especiales, las calabazas, las hojas, los caramelos, los logros y el disfraz, la lista de versiones y
que `herramientas/publicar.js` saque la copia sin el modo historia.

### `figuras.js` — unos segundos
Los sprites: el tamaño de cada atlas (8 fotogramas, andar y correr), que el ciclo sea neutro,
zancada, neutro, zancada y que correr abra más la zancada, que `finishHD()` ponga el contorno y
la luz, que el plano no deforme los píxeles y que por defecto se jueguen los sprites.
La ropa: que cada personaje lleve al menos tres prendas y no haya dos iguales, y que un
aspecto cambie la ropa entera sin quitar la coleta. Los muñecos: que la rejilla sólo genere
las caras de fuera, que cada personaje tenga sus piezas articuladas y su ropa en 3D (chaleco,
patines, mochila, coleta), que cada animal tenga las suyas, y las animaciones: quieto, andando
y corriendo (piernas, rodillas, codos, inclinación), las posturas especiales y que la
velocidad se mida por el movimiento, sin contar los teletransportes.

---

## `banco.js`

No es una prueba: es lo que permite cargar el juego **sin navegador**. Le monta un DOM y
un Three.js de mentira y le saca por dentro las variables, porque el juego va envuelto en
una IIFE y desde fuera no se ve nada.

Si añades una prueba que necesite una función del juego que ahora no se exporta, métela
en la lista `EXPORTA` de arriba del archivo.

Dos detalles que ahorran disgustos:

- Casi todo Three.js es un simulacro que responde a cualquier cosa. Las excepciones son
  `Vector3` y `PointLight`, que son de verdad porque hay pruebas que miden posiciones y
  luces. **Los materiales no lo son**, así que cosas como `material.transparent` no se
  pueden comprobar desde el banco: para eso se lee el código fuente.
- Si el juego revienta al arrancar, el banco lo detecta mirando `window.__zerr`. El
  propio juego se traga esos errores y pinta un cartel, así que por consola no salen.
