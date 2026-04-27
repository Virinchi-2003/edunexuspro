import { z } from 'zod';

export const principalSchema = z.object({
  schoolId: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  userId: z.string().optional(), // Firebase UID if linked
});

export type Principal = z.infer<typeof principalSchema> & {
  id: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
};
