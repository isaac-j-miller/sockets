import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import cookie from "cookie";
import { v4 } from "uuid";

import { isValidRoomId } from "common/util/room-id";
import { PointerBase, PointerDef } from "common/types";
import { InnerRoom } from "./inner-room";

const getSelfPointer = (): Omit<PointerDef, "color"> => {
  const docCookie = document.cookie;
  const parsed = cookie.parse(docCookie);
  const pointerCookie = parsed.pointer;
  if (pointerCookie) {
    const parsedPointer: PointerBase = JSON.parse(pointerCookie);
    return {
      ...parsedPointer,
      coordinates: [0, 0],
    };
  }
  const cookieVals = {
    id: v4(),
  };
  document.cookie = cookie.serialize("pointer", JSON.stringify(cookieVals), {
    sameSite: true,
  });
  return {
    coordinates: [0, 0],
    ...cookieVals,
  };
};

const selfPointer = getSelfPointer();
export const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const valid = isValidRoomId(roomId);
  const socket = useMemo(() => {
    if (!valid) return undefined;
    return io("http://localhost:3000", {
      path: "/socket",
      extraHeaders: {
        "room-id": roomId,
        "user-id": selfPointer.id,
      },
    });
  }, [roomId, valid]);
  if (!valid) {
    console.error(`invalid room id: ${roomId}`);
    return <div>error</div>;
  }
  if (!socket) return <div></div>;
  return <InnerRoom socket={socket} roomId={roomId} ptr={selfPointer} />;
};
