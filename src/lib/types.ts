import { z } from "zod";

// TODO - update with the real schema definition.

export const WorkoutFormSchema = z.object({
  description: z.string().max(60),
  targetDistance: z.number().min(100).max(10000),
  effort: z.enum(["easy", "moderate", "hard"]),
});

export const WorkoutSetSchema = z.object({
  type: z.enum(["warmup", "main", "cooldown"]),
  repetitions: z.number(),
  distance: z.number(),
  stroke: z.string(),
  effort: z.string(),
  interval: z.string(),
});

export const WorkoutResponseSchema = z.object({
  description: z.string(),
  sets: z.array(WorkoutSetSchema),
  totalDistance: z.number(),
});

export type WorkoutFormData = z.infer<typeof WorkoutFormSchema>;
export type WorkoutSet = z.infer<typeof WorkoutSetSchema>;
export type WorkoutResponse = z.infer<typeof WorkoutResponseSchema>;
