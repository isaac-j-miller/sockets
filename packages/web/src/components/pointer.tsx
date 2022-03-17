import React from "react";
import styled from "styled-components";

type Props = {
  coordinates: [number, number];
  id: string;
  color: string;
};

const size = 10;

const Ptr = styled.div<{ color: string }>`
  position: absolute;
  width: ${size}px;
  height: ${size}px;
  display: block;
  transform: translate("-50%", "-50%");
  border-radius: 100%;
  border: solid black 1px;
  background-color: ${props => props.color};
`;

export const Pointer: React.FC<Props> = ({ coordinates, id, color }) => {
  return (
    <Ptr
      style={{ left: `${coordinates[0] - size}px`, top: `${coordinates[1] - size}px` }}
      color={color}
      id={`ptr#${id}`}
    ></Ptr>
  );
};
