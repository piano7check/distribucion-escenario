export const VOICE_ORDER = ['S1', 'S2', 'Mz', 'Ca', 'T1', 'T2', 'Br', 'Bj']

export const VOICE_LABELS = {
  S1: 'Soprano 1',
  S2: 'Soprano 2',
  Mz: 'Mezzosoprano',
  Ca: 'Contralto',
  T1: 'Tenor 1',
  T2: 'Tenor 2',
  Br: 'Barítono',
  Bj: 'Bajo',
  // Plural para distinguirlas de 'Soprano 1/2' y 'Contralto' — son las
  // secciones sin sub-voz de la Segunda Parte y la fila mixta de la Cuarta.
  S: 'Sopranos',
  C: 'Contraltos',
}

// Dos tonos por familia (uno más oscuro, uno más claro) para que las 8 voces
// se distingan entre sí de un vistazo, incluidas Barítono/Bajo — antes eran
// casi el mismo negro.
export const VOICE_COLORS = {
  S1: '#d69e2e',
  S2: '#ecc94b',
  Mz: '#2f855a',
  Ca: '#68d391',
  T1: '#2b6cb0',
  T2: '#4299e1',
  Br: '#4a5568',
  Bj: '#1a202c',
}

export const VOICE_FAMILY = {
  S: ['S1', 'S2'],
  C: ['Mz', 'Ca'],
}

// Voces femeninas (Segunda Parte y las mitades izquierda/derecha del coro
// son solo mujeres) vs. voces masculinas — nunca se mezclan entre sí.
export const FEMALE_VOICES = ['S1', 'S2', 'Mz', 'Ca', 'S', 'C']
export const MALE_VOICES = ['T1', 'T2', 'Br', 'Bj']

export function voicesInSameRegister(voiceCode) {
  return FEMALE_VOICES.includes(voiceCode) ? FEMALE_VOICES : MALE_VOICES
}

// Solo para los slots genéricos (S = Sopranos, C = Contraltos) de la Segunda
// Parte y la fila mixta de la Cuarta — VOICE_COLORS ya cubre las 8 voces
// exactas, así que esto nunca se usa para S1/S2/Mz/Ca/T1/T2/Br/Bj.
const GENERIC_FAMILY_COLORS = {
  S: '#ecc94b',
  C: '#68d391',
}

export function voiceFillColor(voiceCode) {
  return VOICE_COLORS[voiceCode] || GENERIC_FAMILY_COLORS[voiceCode] || '#a0aec0'
}

// Umbral de luminancia perceptual (fórmula YIQ) para decidir si un color de
// relleno necesita texto oscuro o claro encima para mantenerse legible —
// varios colores del set (S2, Ca, T2) son demasiado claros para texto blanco.
export function readableTextColor(hexColor) {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luma > 0.5 ? '#1a202c' : '#ffffff'
}
