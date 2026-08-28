// Los ids de apoyo/licencia llevan un sufijo numérico solo para que sean
// únicos internamente (Ap1, Ap2, Ap3, Lic1); en pantalla se muestran como
// en el documento original (Ap, Lic).
export function displayId(person) {
  if (!person) return ''
  const match = /^(Ap|Lic)\d+$/.exec(person.id)
  return match ? match[1] : person.id
}
