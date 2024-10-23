import { z } from "zod";

// Define a schema for a single set item
export const SetItemSchema = z.object({
  distance: z.number().int(), // e.g., "50" or "200"
  repeat: z.number().int().nullable(), // e.g., 4
  stroke: z.string(), // e.g., "Pull", "IM", "Free", "Drill"
  effort: z.string(), // e.g., "Easy Effort", "Endurance Effort", "Threshold Effort", "Moderate Effort"
  time: z // e.g., "6:30", "2:00", "1:30"
    .string()
    .regex(/^\d{1,2}:\d{2}$/, "Invalid time format. Use mm:ss")
    .transform((timeStr) => {
      const [minutes, seconds] = timeStr.split(":").map(Number);

      // Validate minutes and seconds
      if (minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
        throw new Error(
          "Invalid time values. Minutes and seconds must be between 0 and 59."
        );
      }

      return minutes + ":" + seconds;
    }),
  note: z.string().optional(), // optional note for special instructions (if any) (e.g: 3/12 kick)
});

// Define a schema for the set group (WARMUP, PRE SET, MAIN SET, COOL DOWN)
export const SetGroupSchema = z.object({
  title: z.enum(["WARMUP", "PRE SET", "MAIN SET", "COOL DOWN"]),
  items: z.array(SetItemSchema),
  repeat: z.number().int().nullable(), // e.g., 2
});

// Define the overall workout schema
export const WorkoutSchema = z.object({
  totalDistance: z.string(), // e.g., "2200 metres"
  totalTime: z.string(), // e.g., "38 min"
  setGroups: z.array(SetGroupSchema),
});

// Derive TypeScript types from the Zod schemas
export type SetItem = z.infer<typeof SetItemSchema>;
export type SetGroup = z.infer<typeof SetGroupSchema>;
export type Workout = z.infer<typeof WorkoutSchema>;
