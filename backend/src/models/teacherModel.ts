import { z } from 'zod';

export const teacherSchema = z.object({
  schoolId: z.string(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string(),
  subject: z.string().optional(),
  userId: z.string().optional(),
});

export type Teacher = z.infer<typeof teacherSchema> & {
  id: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
};
