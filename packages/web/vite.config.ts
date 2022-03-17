import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import tsconfigPaths from "vite-tsconfig-paths";

export default () => {
  return defineConfig({
    plugins: [
      reactRefresh(),
      tsconfigPaths({
        root: "../../",
      }),
    ],
    base: "",
    resolve: {
      alias: {
        common: "packages/common/src",
        web: "packages/web/src",
      },
    },
  });
};
