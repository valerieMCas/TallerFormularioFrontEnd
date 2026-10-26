export const requerido = (msg = 'Este campo es obligatorio.') =>
  (v) => (v === undefined || v === null || String(v).trim() === '' ? msg : null);

export const longitud = (min, max) =>
  (v) => (v.length < min ? `Usa al menos ${min} caracteres.`
    : v.length > max ? `Usa como máximo ${max} caracteres.` : null);

export const formatoCorreo = () =>
  (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
    ? null
    : 'Escribe un correo válido, por ejemplo ana@mail.com.');

export const letraYNumero = () =>
  (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)
    ? null
    : 'Incluye al menos una letra y un número.');

export const rangoEntero = (min, max) => (v) => {
  const n = Number(v);
  if (!Number.isInteger(n)) return 'Escribe un número entero.';
  if (n < min) return `El valor mínimo es ${min}.`;
  if (n > max) return `El valor máximo es ${max}.`;
  return null;
};

export const igualA = (otroCampo, msg) =>
  (v, datos) => (v === datos[otroCampo] ? null : msg);

export const marcado = (msg = 'Debes aceptar los términos para continuar.') =>
  (v) => (v === 'on' ? null : msg);

export const formatoTelefono = () => (v) => {
  if (String(v).trim() === '') return 'Escribe el teléfono o quita este campo.';
  return /^\+?\d{7,15}$/.test(v)
    ? null
    : 'Escribe de 7 a 15 dígitos, sin espacios (el + es opcional).';
};

// Las 7 reglas del registro en un solo lugar
export const reglas = {
  nombre: [requerido(), longitud(3, 60)],
  email: [requerido(), formatoCorreo()],
  password: [requerido(), longitud(8, 64), letraYNumero()],
  confirmar: [requerido(), igualA('password', 'Las contraseñas no coinciden.')],
  edad: [requerido(), rangoEntero(18, 120)],
  pais: [requerido('Elige un país.')],
  terminos: [marcado()],
};

export function validarCampo(nombre, datos) {
  for (const regla of reglas[nombre] ?? []) {
    const error = regla(datos[nombre] ?? '', datos);
    if (error) return error;
  }
  return null;
}

export function validarFormulario(datos) {
  const errores = {};
  for (const nombre of Object.keys(reglas)) {
    const error = validarCampo(nombre, datos);
    if (error) errores[nombre] = error;
  }
  return errores;
}

export function validarTelefonos(telefonos) {
  const regla = formatoTelefono();
  return telefonos.map((t) => regla(t));
}