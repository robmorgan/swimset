"use server";

import { OpenAI } from "openai";
import {
  WorkoutFormData,
  WorkoutResponse,
  WorkoutResponseSchema,
} from "@/lib/types";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateWorkout(data: WorkoutFormData) {
  try {
    const completion = await openai.chat.completions.create({
      //model: "gpt-4-turbo-preview",
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a swimming coach assistant that creates structured workouts.

          When creating a workout, you must follow these rules:
          - Only the main set should be repeated.
          - The warmup should be between 15% and 25% of the total distance respectively.
          - The cooldown should be between 5% of the total distance respectively.
          - The main set should be predominately freestyle.

          You must respond with a JSON object that contains:
          - description: string (the provided description)
          - sets: array of workout sets with the structure:
            {
              type: "warmup" | "main" | "cooldown"
              repetitions: number
              distance: number
              stroke: string
              effort: string
              interval: string
            }
          - totalDistance: number (sum of all sets)`,
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
      response_format: { type: "json_object" },
    });

    const rawResponse = completion.choices[0].message.content;
    if (!rawResponse) {
      throw new Error("No response from GPT");
    }

    // Parse the JSON response
    const jsonResponse = JSON.parse(rawResponse);

    // Validate the response against our schema
    const parsedResponse = WorkoutResponseSchema.parse(jsonResponse);

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

export async function formatWorkout(workout: WorkoutResponse): string {
  const sections = [];

  sections.push(`🏊‍♂️ ${workout.description}\n`);

  // Group sets by type
  const setsByType = workout.sets.reduce((acc, set) => {
    if (!acc[set.type]) {
      acc[set.type] = [];
    }
    acc[set.type].push(set);
    return acc;
  }, {} as Record<string, typeof workout.sets>);

  // Format each section
  if (setsByType.warmup) {
    sections.push("*Warmup*");
    setsByType.warmup.forEach((set) => {
      sections.push(
        `${set.repetitions} x ${set.distance} ${set.stroke}, ${set.effort} — ${set.interval}`
      );
    });
    sections.push("");
  }

  if (setsByType.main) {
    sections.push("*Main Set*");
    setsByType.main.forEach((set) => {
      sections.push(
        `${set.repetitions} x ${set.distance} ${set.stroke}, ${set.effort} — ${set.interval}`
      );
    });
    sections.push("");
  }

  if (setsByType.cooldown) {
    sections.push("*Cool Down*");
    setsByType.cooldown.forEach((set) => {
      sections.push(
        `${set.repetitions} x ${set.distance} ${set.stroke}, ${set.effort} — ${set.interval}`
      );
    });
    sections.push("");
  }

  sections.push(`Total: ${workout.totalDistance}m`);

  return sections.join("\n");
}
