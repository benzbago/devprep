import { z } from 'zod';

export const draftInputSchema = z.object({
  challengeId: z.string().trim().min(1, 'Choose a challenge').max(100),
  title: z.string().trim().min(1, 'Enter a title').max(120),
  code: z.string().max(50_000, 'Code must be 50,000 characters or fewer'),
});

export type DraftInput = z.infer<typeof draftInputSchema>;
