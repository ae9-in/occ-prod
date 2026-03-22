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

  if (error instanceof Prisma.PrismaClientValidationError) {
    logger.error(error);
    return res.status(400).json({
      success: false,
<<<<<<< HEAD
      message: "Invalid request data",
      errors: []
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error(error);
    // P2 FIX: Map Prisma error codes to generic messages — never expose raw error.message
    const prismaMessages: Record<string, string> = {
      P2002: "A record with this value already exists",
      P2003: "Related record not found",
      P2025: "Record not found",
      P2014: "This change would violate a required relation",
      P2016: "Query interpretation error"
    };
    return res.status(400).json({
      success: false,
      message: prismaMessages[error.code] || "A database error occurred",
=======
      message: process.env.NODE_ENV === "production" ? "Invalid request data" : error.message,
>>>>>>> 195ade86229f0bea32bcd45b1d312f7ac145fcdd
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
