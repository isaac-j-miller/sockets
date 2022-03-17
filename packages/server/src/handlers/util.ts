import { Request, RequestHandler, Response } from "express";

export const wrapper = (hlr: (req: Request, res: Response) => Promise<void>): RequestHandler => {
  return (request: Request, response: Response) => {
    hlr(request, response).catch(err => {
      console.error(err);
      response.status(500);
      response.send(err);
    });
  };
};
