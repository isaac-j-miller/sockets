import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Socket } from "socket.io-client";
import cookie from "cookie";
import { v4 } from "uuid";
import { PointerDef, PointerBase, PointerMap, RoomState } from "common/types";
import { Pointer } from "./pointer";

type Props = {
  socket: Socket;
  roomId: string;
};

const RoomCanvas = styled.div`
  width: 1000px;
  height: 1000px;
  position: relative;
  border: 1px solid black;
`;

const getSelfPointer = (): PointerDef => {
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
    color: "#000000",
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
let selfPointer = getSelfPointer();

export const InnerRoom: React.FC<Props> = ({ socket }) => {
  const elementRef = useRef<HTMLDivElement>();
  const [pointers, _setPointers] = useState<PointerMap>({});
  const ptrsRef = React.useRef(pointers);
  const setPointers = (data: PointerMap) => {
    ptrsRef.current = data;
    _setPointers(data);
  };

  const listenForMouseEvts = (evt: MouseEvent): any => {
    const x = evt.clientX;
    const y = evt.clientY;
    selfPointer = {
      ...(ptrsRef.current[selfPointer.id] ?? selfPointer),
      coordinates: [x, y],
    };
    const ptrs = { ...ptrsRef.current };
    ptrs[selfPointer.id] = selfPointer;
    setPointers(ptrs);
    socket.emit("UPDATE", selfPointer);
  };

  useEffect(() => {
    socket.connect();
    socket.once("CONNECT", () => {
      console.debug("connected");
    });
    socket.once("INITIAL_STATE", (state: RoomState) => {
      console.info("rcvd init state", state);
      const ptrs: PointerMap = { ...state.pointers, ...pointers };
      if (!ptrs[selfPointer.id]) {
        ptrs[selfPointer.id] = selfPointer;
      }
      setPointers(ptrs);
    });
    socket.on("UPDATE", (evt: PointerDef) => {
      if (evt.id === selfPointer.id) return;
      console.log("rcvd update");
      const newPtrs = { ...ptrsRef.current, [evt.id]: evt };
      setPointers(newPtrs);
    });
    elementRef.current!.addEventListener("mousemove", evt => listenForMouseEvts(evt));
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      elementRef.current!.removeEventListener("mousemove", listenForMouseEvts);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef, socket]);

  return (
    <RoomCanvas id="room-canvas" ref={elementRef as any}>
      {Object.values(pointers).map(ptrDef => (
        <Pointer key={ptrDef.id} {...ptrDef}></Pointer>
      ))}
    </RoomCanvas>
  );
};
