import "source-map-support/register";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import { createServer } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import express from "express";
import { socketListener } from "./socket";
import { getViteAssetHandler } from "./handlers/asset";
import { wrapper } from "./handlers/util";

const port = 3000;

async function main() {
  const socketIoOptions = {
    path: "/socket",
  };

  const app = express();

  const root = path.resolve(__dirname, "../../web");
  const common = path.resolve(__dirname, "../../common/src");
  const web = path.resolve(__dirname, "../../web/src");
  const vite = await createServer({
    plugins: [reactRefresh()],
    server: {
      hmr: {
        port: port + 1,
      },
      middlewareMode: "ssr",
      port,
    },
    root,
    resolve: {
      alias: {
        common,
        web,
      },
    },
  });
  app.use(vite.middlewares);
  app.get(["/ui*"], wrapper(getViteAssetHandler(vite, "index.html")));

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, socketIoOptions);
  io.sockets.on("connection", socketListener);
  httpServer.listen(port, () => {
    console.info(`listening on http://localhost:${port}`);
  });
}
void main();
