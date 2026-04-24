import { z } from 'zod';

export const studentSchema = z.object({
  schoolId: z.string(),
  name: z.string().min(2),
  email: z.string().email().optional(),
  rollNumber: z.string(),
  grade: z.string(),
  section: z.string().optional(),
});

export type Student = z.infer<typeof studentSchema> & {
  id: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
};
