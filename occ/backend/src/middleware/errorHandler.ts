import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { logger } from "../lib/logger";
import { HttpError } from "../lib/httpError";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    logger.error(error);
    return res.status(503).json({
      success: false,
      message: "Database unavailable",
      errors: []
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error(error);
    return res.status(400).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Invalid request data" : error.message,
      errors: []
    });
  }

  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message = statusCode >= 500 ? "Internal server error" : error instanceof Error ? error.message : "Internal server error";
  const errors = error instanceof HttpError ? error.errors : [];

  logger.error(error);

  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
}
