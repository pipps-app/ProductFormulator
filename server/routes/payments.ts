import { Express } from "express";
import { storage } from "../storage";
import { insertPaymentSchema } from "@shared/schema";

export function registerPaymentRoutes(app: Express) {
  // Record a new payment
  app.post("/api/payments", async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(paymentData);
      
      // Update user subscription based on payment
      await storage.updateUser(paymentData.userId, {
        subscriptionStatus: "active",
        subscriptionPlan: paymentData.subscriptionTier,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
      
      res.json(payment);
    } catch (error) {
      console.error("Payment creation error:", error);
      res.status(400).json({ error: "Invalid payment data" });
    }
  });
  
  // Get payment by transaction ID
  app.get("/api/payments/transaction/:transactionId", async (req, res) => {
    const { transactionId } = req.params;
    const payment = await storage.getPaymentByTransactionId(transactionId);
    
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    
    res.json(payment);
  });
  
  // Get all payments for a user
  app.get("/api/payments/user/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const payments = await storage.getUserPayments(userId);
    res.json(payments);
  });
  
  // Process refund
  app.post("/api/payments/:id/refund", async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { refundAmount } = req.body;
      
      const success = await storage.updatePaymentStatus(paymentId, "refunded", refundAmount);
      
      if (success) {
        const payment = await storage.getPayment(paymentId);
        if (payment) {
          // Downgrade user to free tier
          await storage.updateUser(payment.userId, {
            subscriptionStatus: "inactive",
            subscriptionPlan: "free",
            subscriptionEndDate: new Date()
          });
        }
        
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Payment not found" });
      }
    } catch (error) {
      console.error("Refund error:", error);
      res.status(500).json({ error: "Refund failed" });
    }
  });
}