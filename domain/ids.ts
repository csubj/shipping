export function deterministicPairId(a: string, b: string): string {
  if (a === b) throw new Error("Cannot create pair id from identical ids");
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

export function pairIdsFromKey(key: string): [string, string] {
  const [a, b] = key.split("::");
  return [a, b];
}
