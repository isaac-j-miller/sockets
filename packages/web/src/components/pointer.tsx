import React from "react";
import styled from "styled-components";

type Props = {
  coordinates: [number, number];
  id: string;
  color: string;
  angle: number;
};

const size = 10;

const Ptr = styled.div<{ color: string; angle: number }>`
  position: absolute;
  width: ${size}px;
  height: ${size * 2}px;
  display: block;
  transform: ${({ angle }) => `translate(-50%, -50%) rotate(${angle}rad)`};
  border-radius: 100%;
  border: solid black 1px;
  background-color: ${props => props.color};
`;

export const Pointer: React.FC<Props> = ({ coordinates, id, color, angle }) => {
  return (
    <Ptr
      style={{
        left: `${coordinates[0] - size}px`,
        top: `${coordinates[1] - size}px`,
      }}
      angle={angle}
      color={color}
      id={`ptr#${id}`}
    ></Ptr>
  );
};
