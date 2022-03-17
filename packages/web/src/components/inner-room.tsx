import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Socket } from "socket.io-client";
import { PointerDef, PointerMap, RoomState } from "common/types";
import { Pointer } from "./pointer";

type Props = {
  socket: Socket;
  roomId: string;
  ptr: Omit<PointerDef, "color">;
};

const xMax = 1000;
const yMax = 1000;

const coerce = (min: number, max: number, value: number) => {
  if (value > max) return max;
  if (value < min) return min;
  return value;
};

const RoomCanvas = styled.div`
  width: ${xMax}px;
  height: ${yMax}px;
  position: relative;
  border: 1px solid black;
`;

export const InnerRoom: React.FC<Props> = ({ socket, ptr: selfPointer }) => {
  const elementRef = useRef<HTMLDivElement>();
  const [pointers, _setPointers] = useState<PointerMap>({});
  const ptrsRef = React.useRef(pointers);
  const setPointers = (data: PointerMap) => {
    ptrsRef.current = data;
    _setPointers(data);
  };

  const listenForMouseEvts = (evt: MouseEvent): any => {
    const x = coerce(0, xMax, evt.clientX);
    const y = coerce(0, yMax, evt.clientY);
    const ptr: PointerDef = {
      ...(ptrsRef.current[selfPointer.id] ?? { ...selfPointer, color: "#000000" }),
      coordinates: [x, y],
    };
    const ptrs = { ...ptrsRef.current };
    ptrs[selfPointer.id] = ptr;
    setPointers(ptrs);
    socket.emit("UPDATE", ptr);
  };

  useEffect(() => {
    socket.connect();
    socket.once("CONNECT", () => {
      console.debug("connected");
    });
    socket.once("INITIAL_STATE", (state: RoomState) => {
      console.info("rcvd init state", state);
      const ptrs: PointerMap = { ...state.pointers, ...pointers };
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
