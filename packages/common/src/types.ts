export type Coordinates = [number, number];
export type PointerDef = PointerBase & {
  color: string;
  coordinates: Coordinates;
};
export type PointerBase = {
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
