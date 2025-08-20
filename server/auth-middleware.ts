import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-change-this";

export interface AuthenticatedRequest extends Request {
  user?: { id: number; role: string };
  userId?: number; // Added for backward compatibility
}

export function requireJWTAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check for token in Authorization header first
  let token = req.headers.authorization?.split(' ')[1];
  
  // If not in header, check cookies as fallback
  if (!token) {
    token = req.cookies?.token;
  }
  
  if (!token) {
    return res.status(401).json({ error: "No authentication token provided" });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    req.user = payload;
    // Also set userId for backward compatibility with existing code
    req.userId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired authentication token" });
  }
}
