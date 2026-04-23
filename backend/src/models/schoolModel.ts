import { z } from 'zod';

export const schoolSchema = z.object({
  name: z.string().min(2, "School name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  contactEmail: z.string().email("Invalid contact email"),
  subscriptionPlan: z.enum(['starter', 'growth', 'pro', 'elite']),
});

export type School = z.infer<typeof schoolSchema> & {
  id: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: Date;
  updatedAt: Date;
};
