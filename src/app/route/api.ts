import { Router } from "express";
import { apiVersioning } from "../middlewares/apiVersioning.js";
import v1Router from "./index.js";
import v2Router from "./v2.js";

const apiRouter = Router();

// Attach version metadata + deprecation headers
apiRouter.use(apiVersioning());

// URL versioning (preferred for explicit routing and docs)
apiRouter.use("/v1", v1Router);
apiRouter.use("/v2", v2Router);

// Header-based versioning fallback for clients that can't change URLs
apiRouter.use((req, res, next) => {
  const version = req.apiVersion ?? 1;

  if (version === 1) return v1Router(req, res, next);
  if (version === 2) return v2Router(req, res, next);

  return next();
});

export default apiRouter;
