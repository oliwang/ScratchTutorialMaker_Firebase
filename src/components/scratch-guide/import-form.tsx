
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTransition } from "react";
import { useAtom } from "jotai";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Removed Tabs
import { useToast } from "@/hooks/use-toast";
import { tutorialDataAtom } from "@/store/atoms";
// import { summarizeScratchProject } from "@/ai/flows/summarize-scratch-project"; // Removed
// import { generateTutorialSteps } from "@/ai/flows/generate-tutorial-steps"; // Removed
// import { getScratchProjectFromUrl } from "@/services/scratch"; // Removed URL fetch
import type { ScratchProject } from "@/services/scratch";
// import type { GenerateTutorialStepsOutput } from "@/ai/flows/generate-tutorial-steps"; // Removed
import { Loader2, Upload } from "lucide-react"; // Removed Link2

// Mock GenerateTutorialStepsOutput type since the flow is removed
interface GenerateTutorialStepsOutput {
    tutorialSteps: Array<{ functionality: string; steps: string[] }>;
}


const formSchema = z.object({
  // Removed importType and url
  file: z.instanceof(File).refine(file => file.size > 0, { message: "Please upload an .sb3 file." })
    .refine(file => file.name.endsWith('.sb3'), { message: "File must be an .sb3 file."})
    .refine(file => file.size < 50 * 1024 * 1024, { message: "File size must be less than 50MB."}), // Optional: Add size limit
});

export function ImportForm() {
  const [isPending, startTransition] = useTransition();
  const [, setTutorialData] = useAtom(tutorialDataAtom);
  const { toast } = useToast();
  // const [activeTab, setActiveTab] = useState("file"); // Removed activeTab state

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Removed url and importType defaults
      file: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      setTutorialData({ status: "loading", data: null, error: null });
      try {
        let scratchProject: ScratchProject;
        // let fetchSource = ""; // Removed
        // let sb3FileBlob: Blob | null = null; // Removed

        // Only handle file upload now
        if (values.file) {
           // fetchSource = "File"; // Removed
           toast({ title: "Processing uploaded .sb3 file..." });
          // Simulate processing for file upload (replace with actual parsing if needed)
          // In a real scenario, you might parse the file here to extract more data
          await new Promise(resolve => setTimeout(resolve, 500)); // Short delay simulation
          scratchProject = {
             id: `local-${values.file.name}-${values.file.lastModified}`, // More unique placeholder ID
             name: values.file.name.replace('.sb3', ''),
             description: "Project uploaded from file.", // Placeholder description
             resources: [], // Placeholder resources - could be extracted by parsing sb3
           };
           // You have the file object here: values.file
           // TODO: Process the uploaded file (values.file) if needed (e.g., parse for resources).
           console.log(`Processing uploaded SB3 file: ${values.file.name}, size: ${values.file.size} bytes.`);
           toast({ title: "File processed.", description: `Project: ${scratchProject.name}` });
        } else {
          // This case should ideally be prevented by the form validation
          throw new Error("No .sb3 file provided.");
        }

        // --- AI Generation Simulation (currently disabled) ---
        toast({ title: "Generating tutorial steps (Mock Data)..." });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

        // --- Provide Mock Data instead of calling AI ---
        const mockTutorialResult: GenerateTutorialStepsOutput = {
          tutorialSteps: [
            {
              functionality: "Getting Started (Mock Data)",
              steps: ["Open the Scratch editor.", "Find the green flag.", "Click the green flag to start."]
            },
            {
              functionality: "Making the Sprite Move (Mock Data)",
              steps: ["Select a sprite.", "Go to the 'Motion' blocks category.", "Drag out a 'move 10 steps' block.", "Click the block to make the sprite move."]
            },
            {
              functionality: "Adding Sound (Mock Data)",
              steps: ["Go to the 'Sound' blocks category.", "Drag out a 'play sound [sound_name] until done' block.", "Attach it under the 'move 10 steps' block."]
            }
          ]
        };
        // --- End Mock Data ---

         setTutorialData({
            status: "success",
            data: {
                projectName: scratchProject.name,
                projectDescription: scratchProject.description,
                // Use actual resources if parsed, otherwise keep placeholder
                resources: scratchProject.resources.length > 0 ? scratchProject.resources : ['sprite1', 'sound1', 'backdrop1'], // Example placeholder if empty
                tutorialSteps: mockTutorialResult.tutorialSteps, // Use mock data
            },
            error: null,
        });
        toast({
            title: "Tutorial Generated (Using Mock Data)",
            description: `Based on project: ${scratchProject.name}`,
        });


      } catch (error) {
        console.error(`Error during file import/generation process:`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setTutorialData({ status: "error", data: null, error: errorMessage });
        toast({
          title: "Error Processing Project",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
            <Upload className="h-6 w-6"/> Upload Scratch Project
        </h2>

        {/* Removed Tabs component */}

        <FormField
          control={form.control}
          // Use a different key for the file input component if needed, but name should be 'file'
          name="file"
          render={({ field: { onChange, onBlur, name, ref } }) => ( // Destructure carefully for file input
            <FormItem>
              <FormLabel>Scratch Project File (.sb3)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".sb3"
                  disabled={isPending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    onChange(file); // RHF's onChange for file input
                  }}
                  onBlur={onBlur}
                  name={name}
                  ref={ref}
                />
              </FormControl>
              <FormDescription>
                Select your Scratch project file (.sb3 format). Max 50MB.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Generate Tutorial"
          )}
        </Button>
      </form>
    </Form>
  );
}
