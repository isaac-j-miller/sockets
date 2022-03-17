import { Socket } from "socket.io";
import { PointerDef, PointerMap } from "common/types";
import { isValidRoomId, getColor } from "common/util/room-id";

type ServerRoomState = {
  pointers: {
    [userid in string]: {
      socket: Socket;
      pointer: PointerDef;
    };
  };
};

const rooms: Record<string, ServerRoomState> = {};

const getPointer = (userId: string): PointerDef => ({
  id: userId,
  coordinates: [0, 0],
  color: getColor(),
});

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

  socket.on("UPDATE", (update: PointerDef) => {
    console.log(`rcvd update from ${roomId}:${update.id}`);
    rooms[roomId].pointers[update.id].pointer.coordinates = update.coordinates;
    Object.values(rooms[roomId].pointers).forEach(ptr => {
      if (ptr.pointer?.id !== userId) {
        console.info(`emitting update to ${roomId}:${ptr.pointer.id}`);
        ptr.socket.emit("UPDATE", update);
      }
    });
  });
};
