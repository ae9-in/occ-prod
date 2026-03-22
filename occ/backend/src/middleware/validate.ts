import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject } from "zod";

export function validate<T extends AnyZodObject>(schema: T, target: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(result.error);
    }
<<<<<<< HEAD
    (req as any)[target] = result.data;
=======
    req[target] = result.data;
>>>>>>> 195ade86229f0bea32bcd45b1d312f7ac145fcdd
    next();
  };
}
