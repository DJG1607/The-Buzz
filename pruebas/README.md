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
varias distancias, y que todos los objetos estén en español y en inglés.

### `armas.js` — unos segundos
Lo añadido en la versión 1.5.0: que las armas de mano se repartan entre las
dos manos y golpeen con su propio cooldown; que las cuatro habilidades activas hagan
exactamente lo que dicen (Marcos localiza la salida, Vera se garantiza un buen casillero,
Lázaro reduce el daño a la mitad, el Entrenador aturde en área); que Sin retorno no deje
guardar; y que las paredes atravesables salgan en pares, no toquen el laberinto y
teleporten de verdad.

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
que no haya baliza y que las paredes de clipping arranquen casi invisibles.

### `multijugador.js` — unos segundos
El multijugador sin PeerJS: carga **tres copias del juego** (anfitrión y dos invitados) y las
conecta con una red de mentira en estrella, como la de verdad. Comprueba que los invitados se
ven entre sí gracias al reenvío, que el modo de sala lo elige sólo el anfitrión, que morir con
amigos te deja caído, que reanimar gasta un botiquín, y que se acaba si nadie llega o no queda
nadie en pie. También el botiquín en solitario, los aspectos y lo que cuesta desbloquearlos,
cambiar e intercambiar teclas y un mando simulado.

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
