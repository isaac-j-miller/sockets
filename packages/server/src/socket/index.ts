import { Socket } from "socket.io";
import { Coordinates, PointerDef, PointerMap, ProjectileDef } from "common/types";
import { isValidRoomId, getColor } from "common/util/room-id";

type ServerRoomState = {
  pointers: {
    [userid in string]: {
      socket: Socket;
      pointer: PointerDef;
    };
  };
  projectiles: {
    [projectileid in string]: ProjectileDef;
  };
  boundsX: Coordinates;
  boundsY: Coordinates;
};

const rooms: Record<string, ServerRoomState> = {};

const fps = 30;
const msPerFrame = Math.floor(1000 / fps);

const getPointer = (userId: string): PointerDef => ({
  id: userId,
  coordinates: [500, 500],
  color: getColor(),
  angle: 0,
});

const isOutOfBounds = (coords: Coordinates, x: Coordinates, y: Coordinates): boolean => {
  const xOut = coords[0] > x[1] || coords[0] < x[0];
  const yOut = coords[1] > y[1] || coords[1] < y[0];
  return xOut || yOut;
};

const transformRotate = (coords: Coordinates, angle: number, about: Coordinates): Coordinates => {
  const [x, y] = coords;
  const xt1 = x - about[0];
  const yt1 = y - about[1];
  const tX = xt1 * Math.cos(angle) - yt1 * Math.sin(angle) + about[0];
  const tY = xt1 * Math.sin(angle) + yt1 * Math.cos(angle) + about[1];
  const transformed: Coordinates = [tX, tY];
  // console.debug(`trans (${coords.map(c=>c.toPrecision(3))}) @${((angle*360)/(Math.PI*2)).toPrecision(3)}° about (${about.map(c=>c.toPrecision(3))}) -> (${transformed.map(c=>c.toPrecision(3))})`)
  return transformed;
};

const isInRectangle = (
  coords: Coordinates,
  rectangle: {
    height: number;
    width: number;
    centerCoordinates: Coordinates;
    angle: number;
  }
): boolean => {
  const { height, width, centerCoordinates, angle } = rectangle;
  const topLeft: Coordinates = [
    centerCoordinates[0] - width / 2,
    centerCoordinates[1] - height / 2,
  ];
  const topRight: Coordinates = [
    centerCoordinates[0] + width / 2,
    centerCoordinates[1] - height / 2,
  ];
  const bottomLeft: Coordinates = [
    centerCoordinates[0] - width / 2,
    centerCoordinates[1] + height / 2,
  ];
  const transformedCoords = transformRotate(coords, angle, centerCoordinates);
  // const tTl = transformRotate(topLeft, angle, coords)
  // const tTr = transformRotate(topRight, angle, coords)
  // const tBl = transformRotate(bottomLeft, angle, coords)
  const xRange: Coordinates = [topLeft[0], topRight[0]];
  const yRange: Coordinates = [topLeft[1], bottomLeft[1]];
  // console.debug(`coords: (${coords.map(c=>c.toPrecision(3))}), x[${xRange.map(c=>c.toPrecision(3))}], y[${yRange.map(c=>c.toPrecision(3))}]`)
  const outOfBounds = isOutOfBounds(transformedCoords, xRange, yRange);
  return !outOfBounds;
};

const ptrHeight = 20;
const ptrWidth = 10;
const getCollision = (
  coords: Coordinates,
  state: ServerRoomState,
  ignore: string
): string | undefined => {
  for (const ptr of Object.values(state.pointers)) {
    const { angle, coordinates, id } = ptr.pointer;
    if (id === ignore) {
      // eslint-disable-next-line no-continue
      continue;
    }
    const rect = {
      height: ptrHeight,
      width: ptrWidth,
      centerCoordinates: coordinates,
      angle,
    };
    const collision = isInRectangle(coords, rect);
    if (collision) {
      return id;
    }
  }
  return undefined;
};

export const socketListener = (socket: Socket) => {
  console.log("connected");
  socket.emit("CONNECT");
  const roomId = socket.handshake.headers["room-id"];
  const userId = socket.handshake.headers["user-id"];
  const valid = isValidRoomId(roomId);
  if (!valid) {
    console.error(`invalid roomid: ${roomId}`);
    socket.disconnect(true);
    return;
  }
  if (typeof userId !== "string") {
    console.error(`invalid userid: ${roomId}`);
    socket.disconnect(true);
    return;
  }
  if (!rooms[roomId]) {
    rooms[roomId] = {
      pointers: {},
      projectiles: {},
      boundsX: [0, 1000],
      boundsY: [0, 1000],
    };
  }
  if (!rooms[roomId].pointers) {
    rooms[roomId].pointers = {
      [userId]: {
        socket,
        pointer: getPointer(userId),
      },
    };
  } else {
    rooms[roomId].pointers[userId] = {
      pointer: rooms[roomId].pointers[userId]?.pointer ?? getPointer(userId),
      socket,
    };
  }

  const initialState = Object.entries(rooms[roomId].pointers).reduce((acc, curr) => {
    const [key, value] = curr;
    if (value.pointer) {
      acc[key] = value.pointer;
    }
    return acc;
  }, {} as PointerMap);

  socket.emit("INITIAL_STATE", { pointers: initialState });

  const updateProjectile = (projectileId: string, source: string) => {
    const projectile = rooms[roomId].projectiles[projectileId];
    const newCoords: Coordinates = [
      projectile.coordinates[0] + projectile.vector[0],
      projectile.coordinates[1] + projectile.vector[1],
    ];
    if (isOutOfBounds(newCoords, rooms[roomId].boundsX, rooms[roomId].boundsY)) {
      Object.values(rooms[roomId].pointers).forEach(ptr => {
        // console.info(`emitting update to ${roomId}:${ptr.pointer.id}`);
        ptr.socket.emit("DELETE_PROJECTILE", projectileId);
      });
      return;
    }
    const collision = getCollision(newCoords, rooms[roomId], source);
    if (collision) {
      console.info(`Collision with ${collision}`);
      Object.values(rooms[roomId].pointers).forEach(ptr => {
        // console.info(`emitting update to ${roomId}:${ptr.pointer.id}`);
        ptr.socket.emit("DELETE_PROJECTILE", projectileId);
      });
      return;
    }
    // console.info(`${projectile.coordinates} -> ${newCoords}`)
    const update: ProjectileDef = { ...projectile, coordinates: newCoords };
    rooms[roomId].projectiles[projectileId] = update;
    setTimeout(() => {
      updateProjectile(projectileId, source);
    }, msPerFrame);
    Object.values(rooms[roomId].pointers).forEach(ptr => {
      // console.info(`emitting update to ${roomId}:${ptr.pointer.id}`);
      ptr.socket.emit("UPDATE_PROJECTILE", update);
    });
  };

  socket.on("UPDATE", (update: PointerDef) => {
    console.log(`rcvd update from ${roomId}:${update.id}`);
    rooms[roomId].pointers[update.id].pointer.coordinates = update.coordinates;
    rooms[roomId].pointers[update.id].pointer.angle = update.angle;
    Object.values(rooms[roomId].pointers).forEach(ptr => {
      if (ptr.pointer?.id !== userId) {
        console.info(`emitting update to ${roomId}:${ptr.pointer.id}`);
        ptr.socket.emit("UPDATE", update);
      }
    });
  });
  socket.on("CREATE_PROJECTILE", (update: ProjectileDef) => {
    // console.log(`rcvd projectile from ${roomId}:${update.id}`);
    rooms[roomId].projectiles[update.id] = update;
    Object.values(rooms[roomId].pointers).forEach(ptr => {
      // console.info(`emitting update to ${roomId}:${ptr.pointer.id}`);
      ptr.socket.emit("UPDATE_PROJECTILE", update);
    });
    setTimeout(() => {
      updateProjectile(update.id, update.source);
    }, msPerFrame);
  });
};
