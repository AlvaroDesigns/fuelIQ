/**
 * Helper to parse power rating (kW) from OSM tags / description
 */
export function parseEVMaxPower(tags: Record<string, string>): number {
  const raw = `${tags['socket:type2:output'] || ''} ${tags['socket:type2_combo:output'] || ''} ${tags.capacity || ''} ${tags.description || ''} ${tags.name || ''}`;

  const kwMatch = raw.match(/(\d{2,3})\s*kW/i);
  if (kwMatch) {
    return parseInt(kwMatch[1], 10);
  }

  const op = `${tags.operator || ''} ${tags.brand || ''}`.toUpperCase();
  if (op.includes('IONITY')) return 350;
  if (op.includes('TESLA')) return 250;
  if (op.includes('ZUNDER')) return 300;
  if (op.includes('IBERDROLA') && op.includes('PULSE')) return 180;
  if (op.includes('ENDESA')) return 150;
  if (op.includes('REPSOL')) return 150;

  return 22;
}
