import { SessionData } from "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      session: SessionData & {
        userId?: number;
      };
    }
  }
}