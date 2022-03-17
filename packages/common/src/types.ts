export type Coordinates = [number, number];
export type PointerDef = PointerBase & {
  coordinates: Coordinates;
};
export type PointerBase = {
  color: string;
  id: string;
};
export type PointerMap = Record<string, PointerDef>;
export type RoomState = {
  pointers: PointerMap;
};

export type PointerUpdate = {
  id: string;
  c: Coordinates;
};
