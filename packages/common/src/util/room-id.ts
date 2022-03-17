export function getRandomInRange(range: [number, number]): number {
  const base = Math.random();
  return Math.floor(base * (range[1] + 1 - range[0]) + range[0]);
}

export function generateRoomId() {
  // a-z: 65-90
  // A-Z: 97-122
  // 0-9: 48-57
  const ranges: Array<[number, number]> = [
    [65, 90],
    [97, 122],
    [48, 57],
  ];
  const chars: number[] = [];
  for (let i = 0; i < 6; i++) {
    const rangeIdxToUse = getRandomInRange([0, 2]);
    const range = ranges[rangeIdxToUse];
    const charIdx = getRandomInRange(range);
    chars.push(charIdx);
  }
  return String.fromCharCode(...chars);
}

export function isValidRoomId(roomId: unknown | undefined): roomId is string {
  if (typeof roomId !== "string") {
    return false;
  }
  return !!roomId && roomId.length === 6 && /^(?:[a-z]|[A-Z]|[0-9])+$/.test(roomId);
}

export function getColor(): string {
  const r = getRandomInRange([0, 255]);
  const g = getRandomInRange([0, 255]);
  const b = getRandomInRange([0, 255]);
  return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}
