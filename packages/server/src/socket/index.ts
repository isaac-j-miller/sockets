import { Socket } from "socket.io";
import { PointerDef, PointerMap } from "common/types";
import { isValidRoomId } from "common/util/room-id";

type ServerRoomState = {
  pointers: {
    [userid in string]: {
      socket: Socket;
      pointer?: PointerDef;
    };
  };
};

const rooms: Record<string, ServerRoomState> = {};

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
  if (!rooms[roomId]?.pointers) {
    rooms[roomId] = {
      pointers: {
        [userId]: {
          socket,
        },
      },
    };
  } else {
    rooms[roomId].pointers[userId] = {
      socket,
    };
  }

  if (!rooms[roomId]) {
    rooms[roomId] = {
      pointers: {},
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
    console.log(`rcvd update from ${update.id}`);
    if (rooms[roomId].pointers[update.id].pointer) {
      rooms[roomId].pointers[update.id].pointer!.coordinates = update.coordinates;
    } else {
      rooms[roomId].pointers[update.id].pointer = update;
    }
    console.info("emitting update");
    Object.values(rooms[roomId].pointers).forEach(ptr => {
      if (ptr.pointer?.id !== userId) {
        ptr.socket.emit("UPDATE", update);
      }
    });
  });
  socket.on("INITIAL_SELF_PTR", (evt: PointerDef) => {
    console.log(`rcvd init ptr from ${evt.id}`);
    rooms[roomId].pointers[evt.id].pointer = evt;

    Object.values(rooms[roomId].pointers).forEach(ptr => {
      if (ptr.pointer?.id !== userId) {
        ptr.socket.emit("UPDATE", evt);
      }
    });
  });
};
