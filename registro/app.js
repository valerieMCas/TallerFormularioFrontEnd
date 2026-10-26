import {
  validarCampo,
  validarFormulario,
  validarTelefonos,
  formatoTelefono,
} from './validaciones.js';

const form = document.querySelector('#registro');
const boton = form.querySelector('button[type="submit"]');
const mensaje = document.querySelector('#mensaje');
const saludo = document.querySelector('#saludo');
const lista = document.querySelector('#telefonos');

function leerDatos() {
  const fd = new FormData(form);
  const datos = Object.fromEntries(fd);
  datos.telefono = fd.getAll('telefono'); // varios campos con el mismo name
  return datos;
}

function mostrarErrorEn(campo, texto) {
  const error = document.getElementById(`${campo.id}-error`);
  campo.setAttribute('aria-invalid', texto ? 'true' : 'false');
  if (error) error.textContent = texto ?? '';
}

function mostrarError(nombre, texto) {
  mostrarErrorEn(form.elements[nombre], texto);
}

// ----- Parte B: ¿el correo ya existe? -----
const registrados = ['ana@mail.com', 'admin@mail.com'];

const correoDisponible = (email) =>
  new Promise((ok) => {
    console.log('Consultando al servidor:', email);
    setTimeout(() => ok(!registrados.includes(email.toLowerCase())), 600);
  });

const estadoCorreo = { email: '', libre: true, comprobando: false };
const MSG_OCUPADO = 'Este correo ya tiene una cuenta. ¿Quieres iniciar sesión?';

function debounce(fn, ms) {
  let espera;
  return (...args) => {
    clearTimeout(espera);
    espera = setTimeout(() => fn(...args), ms);
  };
}

const revisarCorreo = debounce(async (email) => {
  if (validarCampo('email', { email })) return; // primero el formato
  estadoCorreo.comprobando = true;
  mostrarError('email', 'Comprobando disponibilidad…');
  const libre = await correoDisponible(email);
  estadoCorreo.comprobando = false;
  if (form.elements.email.value !== email) return; // siguió escribiendo
  estadoCorreo.email = email;
  estadoCorreo.libre = libre;
  mostrarError('email', libre ? null : MSG_OCUPADO);
}, 500);

form.elements.email.addEventListener('input', (e) => revisarCorreo(e.target.value));

function errorCorreo(datos) {
  const error = validarCampo('email', datos);
  if (error) return error;
  if (estadoCorreo.email === datos.email && !estadoCorreo.libre) return MSG_OCUPADO;
  return null;
}

// ----- Validar al salir de cada campo -----
form.addEventListener('focusout', (e) => {
  const campo = e.target;
  if (!campo.name) return;
  const datos = leerDatos();

  if (campo.name === 'telefono') {
    mostrarErrorEn(campo, formatoTelefono()(campo.value));
    return;
  }
  if (campo.name === 'email') {
    if (estadoCorreo.comprobando) return;
    mostrarError('email', errorCorreo(datos));
    return;
  }
  mostrarError(campo.name, validarCampo(campo.name, datos));
  if (campo.name === 'password' && datos.confirmar) {
    mostrarError('confirmar', validarCampo('confirmar', datos));
  }
});

// ----- Parte C: teléfonos dinámicos -----
let contadorTel = 0;

function renumerarTelefonos() {
  [...lista.children].forEach((fila, i) => {
    fila.querySelector('label').textContent = `Teléfono ${i + 1}`;
  });
}

document.querySelector('#agregar-telefono').addEventListener('click', () => {
  if (lista.children.length >= 3) return;
  contadorTel += 1;
  const id = `tel-${contadorTel}`;
  const fila = document.createElement('div');
  fila.className = 'fila-telefono';
  // innerHTML es seguro: el único dato variable (id) lo genera nuestro código
  fila.innerHTML = `
    <label for="${id}">Teléfono</label>
    <input id="${id}" name="telefono" type="tel" inputmode="tel"
           autocomplete="tel" aria-describedby="${id}-error">
    <button type="button" class="quitar">Quitar</button>
    <p id="${id}-error" class="error" aria-live="polite"></p>`;
  lista.append(fila);
  renumerarTelefonos();
  fila.querySelector('input').focus();
});

// Delegación de eventos: un solo listener para todos los «Quitar»
lista.addEventListener('click', (e) => {
  if (e.target.matches('.quitar')) {
    e.target.parentElement.remove();
    renumerarTelefonos();
    document.querySelector('#agregar-telefono').focus();
  }
});

// ----- Envío -----
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mensaje.textContent = '';
  saludo.textContent = '';

  const datos = leerDatos();
  const errores = validarFormulario(datos);
  const errEmail = errorCorreo(datos);
  if (errEmail) errores.email = errEmail;

  for (const nombre of ['nombre', 'email', 'password', 'confirmar', 'edad', 'pais', 'terminos']) {
    mostrarError(nombre, errores[nombre] ?? null);
  }

  const inputsTel = [...lista.querySelectorAll('input[name="telefono"]')];
  const erroresTel = validarTelefonos(datos.telefono);
  inputsTel.forEach((input, i) => mostrarErrorEn(input, erroresTel[i]));

  if (Object.keys(errores).length > 0 || erroresTel.some(Boolean)) {
    const primero = [...form.elements].find(
      (el) => el.getAttribute('aria-invalid') === 'true'
    );
    primero?.focus();
    return;
  }

  boton.disabled = true;
  boton.textContent = 'Enviando…';

  try {
    const envio = { ...datos };
    delete envio.confirmar;

    const res = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envio),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const creado = await res.json();

    mensaje.textContent = `¡Cuenta creada! Id: ${creado.id}`;
    saludo.textContent = `Hola, ${datos.nombre}`; // nivel 5B: seguro

    form.reset();
    lista.replaceChildren();
    estadoCorreo.email = '';
    estadoCorreo.libre = true;
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  } catch (err) {
    mensaje.textContent = 'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.';
    console.error('Error al enviar:', err);
  } finally {
    boton.disabled = false;
    boton.textContent = 'Crear cuenta';
  }
});