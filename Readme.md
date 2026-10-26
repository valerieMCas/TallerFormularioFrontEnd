# Taller: Formularios con validaciones

Formulario de registro construido en cinco niveles, solo con HTML, CSS y JavaScript.

## Estructura

registro/
  index.html       Formulario final (niveles 2 a 5)
  estilos.css      Estilos, errores y foco visible
  app.js           Eventos, envío con fetch, correo asíncrono y teléfonos dinámicos
  validaciones.js  Módulo con todas las reglas (funciones puras)
nativo/
  index.html       Versión del nivel 1: solo validación nativa del navegador

**Cómo abrirlo:** abrir la carpeta en VS Code y usar Live Server sobre `registro/index.html`. 

## Nivel 1 · HTML puro

### Expresión de la contraseña: `(?=.*[A-Za-z])(?=.*\d).{8,}`

- `(?=.*[A-Za-z])` es un *lookahead*: revisa, sin consumir caracteres, que en algún punto haya **al menos una letra**.
- `(?=.*\d)` otro lookahead: exige **al menos un dígito**.
- `.{8,}` cualquier carácter, **8 o más veces**.
- En el atributo `pattern`, el navegador agrega `^` y `$` automáticamente, así que la regla se aplica al valor completo.

### ¿Qué pasa si borras el atributo `name` de un campo y envías? ¿Por qué?

El formulario se envía, pero ese campo **no aparece en la petición**. El navegador (y `FormData`) solo incluye los controles que tienen `name`: el `name` es la clave con la que viaja el dato (`clave=valor`). El `id` sirve para la etiqueta y para JavaScript, pero no para el envío. El campo se sigue validando si tiene `required`, pero su valor nunca llega al servidor.

---

## Nivel 2 · Estilos de error y mensajes propios

### Código de los TODO de `mensajePara` (versión del nivel 2)

```js
if (v.rangeOverflow) return `El valor máximo es ${input.max}.`;
if (v.patternMismatch) return 'Incluye al menos una letra y un número.';
if (v.stepMismatch) return 'Escribe un número entero.';
```

### `:user-invalid` vs `:invalid`

Con `:invalid`, apenas carga la página todos los campos obligatorios aparecen en rojo, porque vacíos ya son inválidos, aunque la persona todavía no haya escrito nada. Con `:user-invalid`, el borde rojo solo aparece **después de que la persona interactúa** con el campo (lo edita y sale, o intenta enviar).

Es mejor `:user-invalid`: no regaña antes de tiempo, no genera ansiedad y el error aparece cuando tiene sentido corregirlo.

---

## Nivel 3 · Envío con fetch + FormData

### ¿Por qué se escucha `submit` en el formulario y no `click` en el botón?

Porque un formulario se puede enviar de varias formas: haciendo clic en el botón, **presionando Enter** dentro de un campo o con `form.requestSubmit()`. El evento `submit` se dispara en todos esos casos; `click` solo cuando se hace clic. Si escucháramos `click`, al presionar Enter el formulario se enviaría sin pasar por nuestra validación y recargaría la página.

### Prueba con URL rota (`/no-existe`)

El servidor responde **404**. `fetch` no falla por eso (solo falla si no hay red), pero `res.ok` es `false`, así que lanzamos un error, el usuario ve «No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.», el botón vuelve a activarse y los datos escritos se conservan. El detalle técnico queda en la consola con `console.error`.

---

## Nivel 4 · Validación avanzada en JavaScript puro

### ¿Qué ventaja tiene que las reglas sean funciones puras?

- **Reutilizables:** el mismo `validaciones.js` sirve para otro formulario o incluso para el backend en Node.
- **Fáciles de probar:** se les pasa un valor y se revisa el resultado, sin necesidad de un navegador ni del DOM.
- **Predecibles:** con la misma entrada siempre devuelven lo mismo, sin efectos secundarios.
- **Un solo lugar de verdad:** si cambia una regla, se cambia en un solo sitio.

### ¿Por qué «el correo ya existe» no se puede validar solo con atributos HTML?

Los atributos HTML (`required`, `type`, `pattern`, `min`…) solo revisan el valor **localmente**, con reglas fijas escritas en la página. Saber si un correo ya está registrado depende de **datos que están en el servidor** y que cambian con el tiempo, así que hay que hacer una consulta asíncrona. Por eso se usa una promesa (simulada con `setTimeout`) y *debounce* para no consultar en cada tecla.

---

## Nivel 5 · Seguridad y usabilidad

### Parte A · La validación del frontend no es seguridad

1. Al borrar `min` y `max` del campo Edad en DevTools y enviar `5`, el formulario **sí lo envía y llega al servidor**.
2. Con `fetch` desde la consola, enviando `{ email: 'no-es-correo', edad: -3 }`, el servidor **acepta los datos y los devuelve** con un id, sin pasar por ninguna validación.

**Qué demuestra:** todo lo que corre en el navegador está bajo control del usuario. Cualquiera puede editar el HTML, desactivar JavaScript o enviar peticiones directamente. La validación del frontend sirve para la **usabilidad** (avisar rápido y claro), no para la **seguridad**.

**Qué debe hacer el backend:**

- **Revalidar** todos los datos con el mismo esquema de reglas (por eso conviene tenerlas como funciones puras reutilizables).
- Usar **consultas parametrizadas** para la base de datos. En una consulta parametrizada el SQL y los datos viajan por separado:

```sql
-- Inseguro: el texto del usuario se pega dentro del SQL
"SELECT * FROM usuarios WHERE email = '" + email + "'"

-- Seguro: el SQL tiene un marcador y el dato se envía aparte
SELECT * FROM usuarios WHERE email = ?
```

Así, si alguien escribe `' OR '1'='1`, la base de datos lo trata como un texto que se compara con el correo, **nunca como código SQL**, y no puede alterar la consulta (SQL injection).

### Parte B · Mostrar datos sin abrir la puerta a XSS

Escribiendo `<b>Ana</b>` como nombre:

- Con `innerHTML`: el saludo se ve **«Hola, Ana» en negrita**. El navegador interpretó la etiqueta como HTML. Con eso, un atacante podría inyectar etiquetas o scripts (por ejemplo `<img src=x onerror=alert(1)>`): eso es **XSS**.
- Con `textContent`: el saludo se ve literalmente **«Hola, &lt;b&gt;Ana&lt;/b&gt;»**. El texto se muestra tal cual, sin interpretarse.

**Revisión del código:** el saludo usa `textContent`. El único `innerHTML` del proyecto está en `app.js`, al crear las filas de teléfono, y es seguro porque el único dato variable es el `id` (`tel-1`, `tel-2`…) generado por nuestro propio contador, nunca texto escrito por el usuario.

### Parte C · Prueba de usabilidad con un compañero

Tarea dada: «Crea una cuenta con estos datos» (incluyendo edad 16 a propósito). Luego, la misma tarea solo con teclado (Tab, Mayús + Tab, Espacio, Enter).

| Observación | Campo | Problema | Corrección aplicada |
|---|---|---|---|
| 1 | | | |
| 2 | | | |

Correcciones de usabilidad ya incluidas en el código:

- Foco visible (`:focus-visible`) en todos los controles para navegar con teclado.
- Al quitar un teléfono, el foco vuelve al botón «Agregar teléfono» en vez de perderse.
- Al enviar con errores, todos los campos con problema se marcan y el foco va al primero.
- Todos los mensajes dicen cómo corregir («Usa al menos 8 caracteres»), no solo «Inválido».