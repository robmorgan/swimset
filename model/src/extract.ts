import fs from "fs";
import { z } from "zod";
import Tesseract from "tesseract.js";
import { Workout, SetItem, SetItemSchema, SetGroup } from "./schemas/workout";

// OCR function using tesseract.js
async function extractTextFromImage(imagePath: string): Promise<string> {
  const {
    data: { text },
  } = await Tesseract.recognize(imagePath, "eng");
  return text;
}

export function parseSetItemLine(input: string): SetItem {
  // Regular expression to match the pattern
  //const regex = /(\d+)x(\d+)\s+(\w+)\s+(\d+:\d+)/;

  // Regular expression to search for the pattern anywhere in the string
  const regex = /(\d+)[xX](\d+)\s+(\w+)\s+(\d+:\d+)/;

  // Find the match in the input string
  const match = input.match(regex);

  if (!match) {
    throw new Error("Invalid input string format");
  }

  // Extract and parse the values
  const [, repeatStr, distanceStr, stroke, time] = match;
  const note = ""; // TODO - parse note. I think its the next trailing line?
  const effort = ""; // TODO - parse effort.
  const distance = parseInt(distanceStr, 10);
  const repeat = parseInt(repeatStr, 10);
  return SetItemSchema.parse({ distance, repeat, stroke, effort, time, note });
}

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
      line.includes("WARM UP") ||
      line.includes("PRE SET") ||
      line.includes("MAIN SET") ||
      line.includes("COOL DOWN") ||
      line.includes("SET GROUP")
    ) {
      currentGroup = { title: line.trim(), items: [] };
      // Handle cases like "SET GROUP 1 - 2x"
      if (line.includes("2x")) {
        // override title to "MAIN SET"
        currentGroup.title = "MAIN SET";
        currentGroup.repeat = 2;
      }
      workout.setGroups.push(currentGroup);
    } else if (line.includes("Repeat 1X") || line.includes("Repeat 2X")) {
      // TODO - Repeat 1X or Repeat 2X. How do we modify the current group?
      // Because it comes on a separate line
      if (currentGroup) {
        currentGroup.repeat = parseInt(line.split(" ")[2]);
      }
    } else if (line.includes("X") && line.includes(":")) {
      // Examples:
      // - "@ 1X200 Easy Pull 3:30"
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
