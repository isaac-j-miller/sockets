import React from "react";
import styled from "styled-components";

type Props = {
  coordinates: [number, number];
  id: string;
  color: string;
};

const Ptr = styled.div<{ color: string }>`
  position: absolute;
  width: 10px;
  height: 10px;
  display: block;
  transform: translate("50%", "50%");
  border-radius: 100%;
  border: solid black 1px;
  background-color: ${props => props.color};
`;

export const Pointer: React.FC<Props> = ({ coordinates, id, color }) => {
  return (
    <Ptr
      style={{ left: `${coordinates[0]}px`, top: `${coordinates[1]}px` }}
      color={color}
      id={`ptr#${id}`}
    ></Ptr>
  );
};
