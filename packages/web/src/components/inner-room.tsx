import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { v4 } from "uuid";
import { Socket } from "socket.io-client";
import { PointerDef, PointerMap, ProjectileDef, ProjectileMap, RoomState } from "common/types";
import { Pointer } from "./pointer";
import { Projectile } from "./projectile";

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
const loop = (min: number, max: number, value: number) => {
  let v = value;
  if (v >= min && v <= max) return v;
  while (v > max) {
    v -= max;
  }
  while (v < min) {
    v += max;
  }
  return v;
};

const RoomCanvas = styled.div`
  width: ${xMax}px;
  height: ${yMax}px;
  position: relative;
  border: 1px solid black;
`;

const verticalSensitivity = 5;
const horizontalSensitivity = 5;
const rotationalSensitivity = Math.PI / 16;

const kInterval = 125;
const jInterval = 250;

export const InnerRoom: React.FC<Props> = ({ socket, ptr: selfPointer }) => {
  const elementRef = useRef<HTMLDivElement>();
  const [pointers, _setPointers] = useState<PointerMap>({});
  const [projectiles, _setProjectiles] = useState<ProjectileMap>({});

  const [jFire, _setJFire] = useState<boolean>(true);
  const jFireRef = React.useRef(jFire);
  const flipJFire = () => {
    jFireRef.current = !jFireRef.current;
    _setJFire(jFireRef.current);
  };
  const [kFire, _setkFire] = useState<boolean>(true);
  const kFireRef = React.useRef(kFire);
  const flipKFire = () => {
    kFireRef.current = !kFireRef.current;
    _setJFire(kFireRef.current);
  };
  const ptrsRef = React.useRef(pointers);
  const setPointers = (data: PointerMap) => {
    ptrsRef.current = data;
    _setPointers(data);
  };

  const projectilesRef = React.useRef(projectiles);
  const setProjectiles = (data: ProjectileMap) => {
    projectilesRef.current = data;
    _setProjectiles(data);
  };
  const createProjectile = (speed: number, color: string) => {
    const { angle, coordinates } = ptrsRef.current[selfPointer.id];
    const projectile: ProjectileDef = {
      id: v4(),
      source: selfPointer.id,
      coordinates,
      color,
      vector: [Math.cos(angle - Math.PI / 2) * speed, Math.sin(angle - Math.PI / 2) * speed],
    };
    // console.log("create projectile",projectile)
    socket.emit("CREATE_PROJECTILE", projectile);
  };

  const listenForKeyEvts = (evt: KeyboardEvent): any => {
    let dX = 0;
    let dY = 0;
    let dR = 0;
    // console.info(`key: ${evt.key}; evt: ${evt.type}`)
    switch (evt.key.toLowerCase()) {
      case "w":
        dY--;
        break;
      case "a":
        dX--;
        break;
      case "s":
        dY++;
        break;
      case "d":
        dX++;
        break;
      case "q":
        dR--;
        break;
      case "e":
        dR++;
        break;
      case "j":
        if (jFireRef.current) {
          createProjectile(4, "#a11702");
          flipJFire();
          setTimeout(flipJFire, jInterval);
        }
        break;
      case "k":
        if (kFireRef.current) {
          createProjectile(8, "#1702a1");
          flipKFire();
          setTimeout(flipKFire, kInterval);
        }
        break;
      default:
        // TODO: other keys
        break;
    }
    const orig = ptrsRef.current[selfPointer.id];
    const newX = coerce(0, xMax, orig.coordinates[0] + dX * horizontalSensitivity);
    const newY = coerce(0, yMax, orig.coordinates[1] + dY * verticalSensitivity);
    const newR = loop(0, 2 * Math.PI, orig.angle + dR * rotationalSensitivity);
    // console.log(orig.angle, dR*rotationalSensitivity, newR)
    const ptr: PointerDef = {
      ...ptrsRef.current[selfPointer.id],
      coordinates: [newX, newY],
      angle: newR,
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
    socket.on("UPDATE_PROJECTILE", (evt: ProjectileDef) => {
      // console.log("update projectile")
      const newProjectiles = { ...projectilesRef.current, [evt.id]: evt };
      setProjectiles(newProjectiles);
    });

    socket.on("DELETE_PROJECTILE", (id: string) => {
      // console.log("delete projectile")
      const newProjectiles = { ...projectilesRef.current };
      delete newProjectiles[id];
      setProjectiles(newProjectiles);
    });
    // elementRef.current!.addEventListener("mousemove", evt => listenForMouseEvts(evt));
    window.addEventListener("keydown", evt => listenForKeyEvts(evt));
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      window.removeEventListener("keydown", evt => listenForKeyEvts(evt));
      // elementRef.current!.removeEventListener("mousemove", listenForMouseEvts);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef, socket]);

  return (
    <RoomCanvas id="room-canvas" ref={elementRef as any}>
      {Object.values(pointers).map(ptrDef => (
        <Pointer key={ptrDef.id} {...ptrDef}></Pointer>
      ))}
      {Object.values(projectiles).map(ptrDef => (
        <Projectile key={ptrDef.id} {...ptrDef}></Projectile>
      ))}
    </RoomCanvas>
  );
};
