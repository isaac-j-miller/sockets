import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

import { isValidRoomId } from "common/util/room-id";
import { InnerRoom } from "./inner-room";

export const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const valid = isValidRoomId(roomId);
  const socket = useMemo(() => {
    if (!valid) return undefined;
    return io("http://localhost:3000", {
      path: "/socket",
      extraHeaders: {
        "room-id": roomId,
      },
    });
  }, [roomId, valid]);
  if (!valid) {
    console.error(`invalid room id: ${roomId}`);
    return <div>error</div>;
  }
  if (!socket) return <div></div>;
  return <InnerRoom socket={socket} roomId={roomId} />;
};
