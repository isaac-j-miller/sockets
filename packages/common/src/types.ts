export type Coordinates = [number, number];
export type PointerDef = PointerBase & {
  color: string;
  coordinates: Coordinates;
  angle: number;
};

export type ProjectileDef = PointerBase & {
  color: string;
  coordinates: Coordinates;
  vector: Coordinates;
  source: string;
};
export type PointerBase = {
  id: string;
};
export type PointerMap = Record<string, PointerDef>;
export type ProjectileMap = Record<string, ProjectileDef>;
export type RoomState = {
  pointers: PointerMap;
};

export type PointerUpdate = {
  id: string;
  c: Coordinates;
};
