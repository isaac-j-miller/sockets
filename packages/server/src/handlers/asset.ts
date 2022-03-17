import path from "path";
import fs from "fs";
import { promisify } from "util";
import { Request, Response } from "express";
import { ViteDevServer } from "vite";

const readFile = promisify(fs.readFile);

const rootPath = process.env.rootPath ?? path.resolve(__dirname, "../../../..");

function getAssetPath(relativeFilePath: string): string {
  return path.join(rootPath, "packages/web", relativeFilePath);
}

export const getViteAssetHandler = (vite: ViteDevServer, filepath: string) => {
  const assetPath = getAssetPath(filepath);
  return async (req: Request, res: Response) => {
    try {
      let html = await readFile(assetPath, { encoding: "utf-8" });
      html = await vite.transformIndexHtml(req.url, html);
      res.send(html);
    } catch (e) {
      console.error(e as Error);
      res.sendFile(assetPath);
    }
  };
};
