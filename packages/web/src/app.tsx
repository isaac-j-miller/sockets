import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Room } from "./components/room";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/ui/room/:roomId" element={<Room />} />
      </Routes>
    </BrowserRouter>
  );
};
