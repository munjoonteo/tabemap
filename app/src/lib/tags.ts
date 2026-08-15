const TAG_PALETTE = [
  '#7c3aed',
  '#0369a1',
  '#047857',
  '#b45309',
  '#be185d',
  '#0e7490',
  '#4d7c0f',
  '#9a3412',
  '#1d4ed8',
  '#6d28d9',
  '#065f46',
  '#92400e',
];

export function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}
