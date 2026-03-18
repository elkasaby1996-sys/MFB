import { z } from 'zod';

/**
 * Validation schemas for forms throughout the app
 * Uses Zod for type-safe validation
 */

// Transaction validation
export const transactionSchema = z.object({
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }).positive('Amount must be positive'),
  
  category: z.string().min(1, 'Category is required'),
  
  date: z.date({
    required_error: "Date is required",
    invalid_type_error: "Must be a valid date",
  }),
  
  description: z.string().optional(),
  
  type: z.enum(['income', 'expense'], {
    required_error: "Transaction type is required",
  }),
});

// Budget validation
export const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  
  amount: z.number({
    required_error: "Budget amount is required",
  }).positive('Budget must be positive'),
  
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly'], {
    required_error: "Period is required",
  }),
  
  rollover: z.boolean().optional().default(false),
});

// Savings Goal validation
export const savingsGoalSchema = z.object({
  name: z.string()
    .min(1, 'Goal name is required')
    .max(100, 'Goal name too long'),
  
  targetAmount: z.number({
    required_error: "Target amount is required",
  }).positive('Target must be positive'),
  
  deadline: z.date()
    .min(new Date(), 'Deadline must be in the future'),
  
  currentAmount: z.number()
    .min(0, 'Current amount cannot be negative')
    .default(0),
  
  description: z.string().max(500).optional(),
});

// Debt validation
export const debtSchema = z.object({
  name: z.string().min(1, 'Debt name is required'),
  
  type: z.enum(['credit_card', 'loan', 'mortgage', 'other']),
  
  totalAmount: z.number().positive('Total amount must be positive'),
  
  currentBalance: z.number()
    .min(0, 'Balance cannot be negative'),
  
  interestRate: z.number()
    .min(0, 'Interest rate cannot be negative')
    .max(100, 'Interest rate cannot exceed 100%'),
  
  minimumPayment: z.number()
    .min(0, 'Minimum payment cannot be negative'),
});

// Investment validation
export const investmentSchema = z.object({
  symbol: z.string()
    .min(1, 'Symbol is required')
    .max(10, 'Symbol too long'),
  
  quantity: z.number()
    .positive('Quantity must be positive'),
  
  purchasePrice: z.number()
    .positive('Purchase price must be positive'),
  
  purchaseDate: z.date(),
  
  type: z.enum(['stock', 'bond', 'etf', 'crypto', 'mutual_fund', 'other']),
});

// Subscription validation
export const subscriptionSchema = z.object({
  name: z.string().min(1, 'Subscription name is required'),
  
  amount: z.number().positive('Amount must be positive'),
  
  billingCycle: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  
  nextBillingDate: z.date(),
  
  autoRenew: z.boolean().default(true),
});

// Export individual validators
export const validators = {
  transaction: transactionSchema,
  budget: budgetSchema,
  savingsGoal: savingsGoalSchema,
  debt: debtSchema,
  investment: investmentSchema,
  subscription: subscriptionSchema,
};

export default validators;