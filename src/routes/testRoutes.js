import express from "express";
import { clearDatabase } from "../controllers/testController.js";

const router = express.Router();

if (process.env.NODE_ENV !== "production") {
  router.delete("/clear", clearDatabase);
}

export default router;
