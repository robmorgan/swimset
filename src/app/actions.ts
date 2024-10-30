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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a swimming coach assistant that creates structured workouts.

          When creating a workout, you must follow these rules:
          - Must include warmup, main set, and cool down set groups. Pre sets are optional.
          - Only the main set should be repeated.
          - The warmup should be between 15% and 25% of the total distance respectively.
          - The cooldown should be between 5% of the total distance respectively.
          - The main set should be predominately freestyle.
          - If the overall effort level is "easy", the main set should be predominately 50m, 75m and 25m strokes.`,
        },
        {
          role: "user",
          content: `Create a swimming workout with:
          - Description: ${data.description}
          - Total distance: ${data.targetDistance}m
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

export async function formatWorkout(workout: Workout): string {
  const sections = [];

  // Add header
  sections.push(`🏊‍♂️ ${workout.description}\n`);

  // Format each set group
  for (const setGroup of workout.setGroups) {
    // Add section title
    sections.push(`*${setGroup.title}*`);

    // If the set group has a repeat, indicate it
    const repeatPrefix = setGroup.repeat ? `${setGroup.repeat}x ` : "";
    if (repeatPrefix) {
      sections.push(`Repeat ${repeatPrefix} times:`);
    }

    // Format each set item
    setGroup.items.forEach((item) => {
      let setText = `${item.repeat ? item.repeat + "x " : ""}${
        item.distance
      }m ${item.stroke}, ${item.effort} — ${item.time}`;
      if (item.note) {
        setText += ` (${item.note})`;
      }
      sections.push(setText);
    });

    sections.push(""); // Add spacing between groups
  }

  // Add total distance and time
  sections.push(`Total: ${workout.totalDistance}m (${workout.totalTime})\n`);

  return sections.join("\n");
}
