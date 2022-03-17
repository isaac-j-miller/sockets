import { Socket } from "socket.io";
import { PointerDef, RoomState } from "common/types";
import { isValidRoomId } from "common/util/room-id";

const rooms: Record<string, RoomState> = {};
const clients: Record<string, Socket[]> = {};
export const socketListener = (socket: Socket) => {
  console.log("connected");
  socket.emit("CONNECT");
  const roomId = socket.handshake.headers["room-id"];
  const valid = isValidRoomId(roomId);
  if (!valid) {
    console.error(`invalid roomid: ${roomId}`);
    socket.disconnect(true);
    return;
  }
  if (!clients[roomId]) {
    clients[roomId] = [socket];
  } else {
    clients[roomId].push(socket);
  }

  if (!rooms[roomId]) {
    rooms[roomId] = {
      pointers: {},
    };
  }

  socket.emit("INITIAL_STATE", rooms[roomId]);

  socket.on("UPDATE", (update: PointerDef) => {
    console.log(`rcvd update from ${update.id}`);
    if (!rooms[roomId].pointers[update.id]) {
      rooms[roomId].pointers[update.id] = update;
    } else {
      rooms[roomId].pointers[update.id].coordinates = update.coordinates;
    }
    console.info("emitting update");
    clients[roomId].forEach(client => client.emit("UPDATE", update));
  });
  socket.on("INITIAL_SELF_PTR", (evt: PointerDef) => {
    console.log(`rcvd init ptr from ${evt.id}`);
    rooms[roomId].pointers[evt.id] = evt;
    clients[roomId].forEach(client => client.emit("UPDATE", evt));
  });
};
