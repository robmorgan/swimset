import fs from "fs";
import { z } from "zod";
//import Tesseract from "tesseract.js";
//import { createWorker } from "tesseract.js";
import { Tesseract } from "tesseract.js";

// Define a schema for a single set item
const SetItemSchema = z.object({
  distance: z.string(), // e.g., "50"
  repeat: z.number().int().nullable(), // e.g., 4
  type: z.string(), // e.g., "Pull", "IM", "Free"
  effort: z.string(), // e.g., "Easy Effort", "Endurance Effort", "Threshold Effort", "Moderate Effort"
  time: z.string().time(), // e.g., "6:30", "2:00", "1:30"
  note: z.string().optional(), // optional note for special instructions (if any) (e.g: 3/12 kick)
});

// Define a schema for the set group (WARMUP, PRE SET, MAIN SET, COOL DOWN)
const SetGroupSchema = z.object({
  title: z.enum(["WARMUP", "PRE SET", "MAIN SET", "COOL DOWN"]),
  items: z.array(SetItemSchema),
  repeat: z.number().int().nullable(), // e.g., 2
});

// Define the overall workout schema
const WorkoutSchema = z.object({
  totalDistance: z.string(), // e.g., "2200 metres"
  totalTime: z.string(), // e.g., "38 min"
  setGroups: z.array(SetGroupSchema),
});

// OCR function using tesseract.js
async function extractTextFromImage(imagePath: string): Promise<string> {
  const {
    data: { text },
  } = await Tesseract.recognize(imagePath, "eng");
  return text;
}

// async function extractTextFromImage(imagePath: string): Promise<string> {
//   const worker = await createWorker("eng");
//   const ret = await worker.recognize(imagePath, "eng");
//   await worker.terminate();
//   return ret.data.text;
// }

// Parse extracted text into workout structure
function parseWorkoutText(text: string) {
  const lines = text.split("\n");
  const workout = {
    totalDistance: "",
    totalTime: "",
    setGroups: [] as any[],
  };

  let currentGroup: any = null;
  for (const line of lines) {
    // TODO - compute the total distance manually using items
    if (line.includes("metres") || line.includes("yards")) {
      workout.totalDistance = line;
    } else if (line.includes("min")) {
      workout.totalTime = line;
    } else if (
      line.includes("WARMUP") ||
      line.includes("PRE SET") ||
      line.includes("MAIN SET") ||
      line.includes("COOL DOWN")
    ) {
      currentGroup = { title: line.trim(), items: [] };
      workout.setGroups.push(currentGroup);
    } else if (line.includes("X") && line.includes(":")) {
      if (!currentGroup) {
        currentGroup = { title: "MAIN SET", items: [] };
        workout.setGroups.push(currentGroup);
      }
      const parts = line.split(" ");
      const distance = `${parts[0]} ${parts[1]}`;
      const setType = parts[2];
      const effort = parts.slice(3, -1).join(" ");
      const time = parts[parts.length - 1];

      const setItem = { distance, type: setType, effort, time };
      currentGroup.items.push(setItem);
    }
  }
  return workout;
}

// Process images in folder
async function processImagesInFolder(folderPath: string) {
  const files = fs.readdirSync(folderPath);
  const workouts: any[] = [];

  for (const file of files) {
    if (file.endsWith(".jpg") || file.endsWith(".png")) {
      const filePath = `${folderPath}/${file}`;
      const text = await extractTextFromImage(filePath);
      const workoutData = parseWorkoutText(text);

      console.log("Parsed workout data:", workoutData);

      // Validate parsed data with Zod
      try {
        const validatedData = WorkoutSchema.parse(workoutData);
        workouts.push(validatedData);
        console.log("Valid workout:", validatedData);
      } catch (error) {
        console.error("Invalid workout data:", error);
      }
    }
  }

  // Save to JSON file
  fs.writeFileSync("workouts.json", JSON.stringify(workouts, null, 2));
}

// Run the script
processImagesInFolder("./training_data");
