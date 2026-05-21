// Shared validation rules — used by Login.jsx and Usuarios.jsx

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const MIN_PASSWORD_LENGTH = 6
export const MAX_PASSWORD_LENGTH = 72
export const MIN_NAME_LENGTH = 2
export const MAX_NAME_LENGTH = 60
export const MAX_EMAIL_LENGTH = 120

const BLOCKED_WORDS = [
  // Español
  'puto', 'puta', 'mierda', 'culo', 'coño', 'polla', 'joder', 'gilipollas',
  'marica', 'maricon', 'pendejo', 'pelotudo', 'boludo', 'carajo', 'concha',
  'perra', 'hdp', 'hijo de puta', 'la puta', 'la concha',
  // Inglés
  'fuck', 'shit', 'asshole', 'bitch', 'bastard', 'cunt', 'cock', 'dick',
  'nigger', 'faggot',
]

function containsBlockedWord(value) {
  const normalized = value.toLowerCase()
  return BLOCKED_WORDS.some(word => normalized.includes(word))
}

export function validateEmail(email) {
  const trimmed = (email || '').trim()
  if (!trimmed) return 'El email es obligatorio'
  if (trimmed.length > MAX_EMAIL_LENGTH)
    return `El email no puede superar los ${MAX_EMAIL_LENGTH} caracteres`
  if (!EMAIL_REGEX.test(trimmed))
    return 'Ingresá un correo electrónico válido (ej: usuario@gmail.com)'
  if (containsBlockedWord(trimmed))
    return 'El campo contiene palabras no permitidas'
  return null
}

export function validateNombre(nombre) {
  const trimmed = (nombre || '').trim()
  if (!trimmed) return 'El nombre es obligatorio'
  if (trimmed.length < MIN_NAME_LENGTH)
    return `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`
  if (trimmed.length > MAX_NAME_LENGTH)
    return `El nombre no puede superar los ${MAX_NAME_LENGTH} caracteres`
  if (containsBlockedWord(trimmed))
    return 'El campo contiene palabras no permitidas'
  return null
}

// required: true para crear, false para editar (vacío = no cambiar)
export function validatePassword(password, { required = true } = {}) {
  if (!password || password.length === 0)
    return required ? 'La contraseña es obligatoria' : null
  if (password.length < MIN_PASSWORD_LENGTH)
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
  if (password.length > MAX_PASSWORD_LENGTH)
    return `La contraseña no puede superar los ${MAX_PASSWORD_LENGTH} caracteres`
  return null
}

// Valida el formulario completo; devuelve un objeto { campo: mensaje } o {} si no hay errores
export function validateUserForm(form, isEdit = false) {
  const errors = {}
  const emailErr = validateEmail(form.email)
  if (emailErr) errors.email = emailErr
  const nombreErr = validateNombre(form.nombre)
  if (nombreErr) errors.nombre = nombreErr
  const passwordErr = validatePassword(form.password, { required: !isEdit })
  if (passwordErr) errors.password = passwordErr
  return errors
}
