"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkoutFormSchema, type WorkoutFormData } from "@/lib/types";
import { generateWorkout, formatWorkout } from "./actions";
import { useToast } from "@/hooks/use-toast";
//import { Toast } from "@/components/ui/toast";
//import { Toaster } from "@/components/ui/toaster"

export default function WorkoutGenerator() {
  const [workout, setWorkout] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<WorkoutFormData>({
    resolver: zodResolver(WorkoutFormSchema),
    defaultValues: {
      description: "",
      targetDistance: 1800,
      effort: "moderate",
    },
  });

  const onSubmit = async (data: WorkoutFormData) => {
    setLoading(true);
    try {
      const result = await generateWorkout(data);

      if (result.success) {
        const formattedWorkout = formatWorkout(result.data);
        setWorkout(formattedWorkout);
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate workout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (workout) {
      navigator.clipboard.writeText(workout);
      toast({
        title: "Copied!",
        description: "Workout copied to clipboard",
      });
    }
  };

  const resetForm = () => {
    setWorkout(null);
    form.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-xl">
        {!workout ? (
          <>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Swimming Workout Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter description"
                            maxLength={60}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetDistance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Distance (meters)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1800"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="effort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effort</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select effort level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Generating..." : "Generate"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </>
        ) : (
          <CardContent className="relative pt-8">
            <div className="flex justify-between items-center mb-4">
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {workout}
            </pre>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
