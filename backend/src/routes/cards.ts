import { Router, Request, Response, NextFunction } from "express";
import { cardService } from "../services/cardService";
import { AppError } from "../middleware/errorHandler";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = req.query as { categoryId?: string };
    const cards = await cardService.getCards({ categoryId });
    res.json(cards);
  } catch (err) {
    next(err);
  }
});

router.get(
  "/difficult",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const cards = await cardService.getDifficultCards();
      res.json(cards);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/search",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q } = req.query as { q?: string };
      if (!q) {
        res.json([]);
        return;
      }
      const cards = await cardService.searchCards(q);
      res.json(cards);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/review",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { known } = req.body as { known: boolean };

      if (typeof known !== "boolean") {
        throw new AppError(400, "Field 'known' must be a boolean");
      }

      const card = await cardService.reviewCard(id, known);
      res.json(card);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
