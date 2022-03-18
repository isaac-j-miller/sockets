import React from "react";
import styled from "styled-components";

type Props = {
  coordinates: [number, number];
  id: string;
  color: string;
  vector: [number, number];
};

const size = 10;

const Ptr = styled.div<{ color: string; angle: number }>`
  position: absolute;
  width: ${size}px;
  height: 1px;
  display: block;
  transform: ${({ angle }) => `translate(-50%, -50%) rotate(${angle}rad)`};
  background-color: ${props => props.color};
`;

export const Projectile: React.FC<Props> = ({ coordinates, id, color, vector }) => {
  const angle = Math.atan(vector[1] / vector[0]);
  return (
    <Ptr
      style={{
        left: `${coordinates[0] - size}px`,
        top: `${coordinates[1] - size}px`,
      }}
      angle={Number.isNaN(angle) ? 0 : angle}
      color={color}
      id={`projectile#${id}`}
    ></Ptr>
  );
};
