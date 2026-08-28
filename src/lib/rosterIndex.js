export { buildPools } from './assignment'

export function buildRosterById(roster) {
  return Object.fromEntries(roster.map((p) => [p.id, p]))
}
