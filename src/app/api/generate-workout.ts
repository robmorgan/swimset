import type { NextApiRequest, NextApiResponse } from "next";

type WorkoutSet = {
  type: "warmup" | "main" | "cooldown";
  sets: number;
  distance: number;
  stroke: string;
  effort: string;
  interval: string;
};

type WorkoutResponse = {
  description: string;
  sets: WorkoutSet[];
  totalDistance: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { description, targetDistance, effort } = req.body;

  try {
    // Here you would make the actual call to the GPT API
    // This is where you'd implement your GPT prompt
    const response = await fetch("YOUR_GPT_API_ENDPOINT", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GPT_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a swimming coach assistant that creates structured workouts. 
          Generate a swimming workout with the following requirements:
          - Total distance: ${targetDistance}m
          - Overall effort level: ${effort}
          - Must include warmup, main set, and cool down
          - Return the response in JSON format with sets, intervals, and proper structure`,
          },
          {
            role: "user",
            content: `Create a swimming workout for: ${description}`,
          },
        ],
      }),
    });

    const data = await response.json();

    // Process the GPT response and format it
    // This is where you'd parse the GPT response into the WorkoutResponse type

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error generating workout:", error);
    return res.status(500).json({ message: "Error generating workout" });
  }
}
