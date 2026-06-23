import { z } from "zod";

export const ClassifierInputSchema = z.object({
  subject: z.string(),
  body: z.string(),
  from: z.string().optional(),
});

export const ClassifierOutputSchema = z.object({
  priority: z.enum(["high", "normal", "low"]),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});

export type ClassifierInput = z.infer<typeof ClassifierInputSchema>;
export type ClassifierOutput = z.infer<typeof ClassifierOutputSchema>;
