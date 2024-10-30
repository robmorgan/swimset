import { z } from "zod";

// Define a schema for the workout form data
export const WorkoutFormSchema = z.object({
  description: z.string().max(60),
  targetDistance: z.number().min(100).max(10000),
  effort: z.enum(["easy", "moderate", "hard"]),
});

// Define a schema for a single set item
export const SetItemSchema = z.object({
  distance: z.number().int(), // e.g., "50" or "200"
  repeat: z.number().int().nullable(), // e.g., 4
  stroke: z.string(), // e.g., "Pull", "IM", "Free", "Drill"
  effort: z.string(), // e.g., "Easy Effort", "Endurance Effort", "Threshold Effort", "Moderate Effort"
  time: z // e.g., "6:30", "2:00", "1:30"
    .string(),
  note: z.string().optional(), // optional note for special instructions (if any) (e.g: 3/12 kick)
});

// Define a schema for the set group (WARMUP, PRE SET, MAIN SET, COOL DOWN)
export const SetGroupSchema = z.object({
  title: z.enum(["WARMUP", "PRE SET", "MAIN SET", "COOL DOWN"]),
  items: z.array(SetItemSchema),
  repeat: z.number().int().nullable(), // e.g., 2
});

export const WorkoutSchema = z.object({
  description: z.string(),
  totalDistance: z.number(), // e.g., "1800"
  totalTime: z.string(), // e.g., "38 mins"
  setGroups: z.array(SetGroupSchema),
});

export type WorkoutFormData = z.infer<typeof WorkoutFormSchema>;
export type SetItem = z.infer<typeof SetItemSchema>;
export type SetGroup = z.infer<typeof SetGroupSchema>;
export type Workout = z.infer<typeof WorkoutSchema>;
