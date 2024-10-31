"use server";

import { OpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { WorkoutFormData, WorkoutSchema, Workout } from "@/lib/types";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateWorkout(data: WorkoutFormData) {
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: `You are a swimming coach assistant that creates structured workouts.

          Generate a swimming workout with a total distance of ${data.targetDistance} meters. The workout should be
          divided into sets with a variety of strokes (freestyle, backstroke, breaststroke, and butterfly) and
          distances for each set. Ensure that the sum of all distances in each set equals exactly ${data.targetDistance} meters.
          Each set should be realistic and varied in length, but no individual segment should exceed 400 meters.

          When creating a workout, you must follow these rules:

          1. EXACT DISTANCES
            - Use one of the following formulas to construct each workout:
               - Warmup: 15%, Main set: 70%, Cool down: 15%
               - Warmup: 20%, Main set: 65%, Cool down: 15%
               - Warmup: 25%, Main set: 65%, Cool down: 10%
               - Warmup: 20%, Main set: 75%, Cool down: 5%
               - Warmup: 15%, Pre Set: 15%, Main set: 60%, Cool down: 10%
            - Use only 25m, 50m, 75m, 100m, 125m, 150m, 175m, 200m, 225m, 250m, 300m, 325m, 350m, 400m distances
            - Repeat set items or the main set to ensure the total distance is met

          2. SET STRUCTURE:
            - Only the main set can be repeated (use the 'repeat' field)
            - Warmup and cool down should NOT be repeated
            - Main set should be predominantly freestyle
            - For easy effort sets, use 25m, 50m, 75m distances
            - Must include warmup, main set and cool down. Pre sets are optional.
          `,
        },
        {
          role: "user",
          content: `Create a swimming workout with:
          - Description: ${data.description}
          - Overall effort level: ${data.effort}
          - Must include at least one warmup, main set, and cool down
          - Return ONLY valid JSON, no other text`,
        },
      ],
      response_format: zodResponseFormat(WorkoutSchema, "workout"),
    });

    const parsedResponse = completion.choices[0].message.parsed;
    if (!parsedResponse) {
      throw new Error("No response from GPT");
    }

    // Manually calculate the distance
    parsedResponse.totalDistance = calculateTotalDistance(parsedResponse);

    return {
      success: true as const,
      data: parsedResponse,
    };
  } catch (error) {
    console.error("Error generating workout:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false as const,
        error: "Invalid response format from GPT",
      };
    }
    return {
      success: false as const,
      error: "Failed to generate workout",
    };
  }
}

function calculateTotalDistance(workout: Workout): number {
  return workout.setGroups.reduce((totalDistance, setGroup) => {
    const groupDistance = setGroup.items.reduce((groupSum, item) => {
      const itemDistance = item.distance * (item.repeat || 1);
      return groupSum + itemDistance;
    }, 0);

    return totalDistance + groupDistance * (setGroup.repeat || 1);
  }, 0);
}

// export async function formatWorkout(workout: Workout): string {
//   const sections = [];

//   sections.push(`🏊‍♂️ ${workout.description}\n`);

//   // Group sets by type
//   const setsByType = workout.sets.reduce((acc, set) => {
//     if (!acc[set.type]) {
//       acc[set.type] = [];
//     }
//     acc[set.type].push(set);
//     return acc;
//   }, {} as Record<string, typeof workout.sets>);

//   // Format each section
//   if (setsByType.warmup) {
//     sections.push("*Warmup*");
//     setsByType.warmup.forEach((set) => {
//       sections.push(
//         `${set.repetitions} x ${set.distance} ${set.stroke}, ${set.effort} — ${set.interval}`
//       );
//     });
//     sections.push("");
//   }

//   if (setsByType.main) {
//     sections.push("*Main Set*");
//     setsByType.main.forEach((set) => {
//       sections.push(
//         `${set.repetitions} x ${set.distance} ${set.stroke}, ${set.effort} — ${set.interval}`
//       );
//     });
//     sections.push("");
//   }

//   if (setsByType.cooldown) {
//     sections.push("*Cool Down*");
//     setsByType.cooldown.forEach((set) => {
//       sections.push(
//         `${set.repetitions} x ${set.distance} ${set.stroke}, ${set.effort} — ${set.interval}`
//       );
//     });
//     sections.push("");
//   }

//   sections.push(`Total: ${workout.totalDistance}m`);

//   return sections.join("\n");
// }
