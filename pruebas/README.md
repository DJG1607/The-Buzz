# Pruebas

Comprobaciones automáticas del juego. No hace falta instalar nada: sólo Node.

```bash
node pruebas/todo.js            # todas (un par de minutos)
node pruebas/todo.js niveles    # sólo una
```

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
Genera los 26 niveles con 20 semillas cada uno y comprueba que se pueden jugar: que se
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

### `tanda2.js` — unos segundos
Lo añadido en la tanda de la versión 1.5.0: que las armas de mano se repartan entre las
dos manos y golpeen con su propio cooldown; que las cuatro habilidades activas hagan
exactamente lo que dicen (Marcos localiza la salida, Vera se garantiza un buen casillero,
Lázaro reduce el daño a la mitad, el Entrenador aturde en área); que Sin retorno no deje
guardar; y que las paredes atravesables salgan en pares, no toquen el laberinto y
teleporten de verdad.

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
