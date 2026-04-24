import { z } from 'zod';

export const subscriptionSchema = z.object({
  schoolId: z.string(),
  plan: z.enum(['starter', 'growth', 'pro', 'elite']),
  status: z.enum(['active', 'expired', 'cancelled', 'pending']),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  amount: z.number(),
  transactionId: z.string().optional(),
});

export type Subscription = z.infer<typeof subscriptionSchema> & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};
