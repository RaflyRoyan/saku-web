import type { Config, Context } from "@netlify/functions";
import { app } from "../../server/app";

export default (req: Request, context: Context) => app.fetch(req, { context });

export const config: Config = {
  path: "/api/*",
};
