import { Router, Request, Response, NextFunction } from "express";
import { categoryService } from "../services/categoryService";

const router = Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.getAll();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

export default router;
