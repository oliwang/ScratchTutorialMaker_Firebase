
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTransition } from "react";
import { useAtom } from "jotai";
import JSZip from "jszip";

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
import { useToast } from "@/hooks/use-toast";
import { tutorialDataAtom, uploadedFileAtom, AssetInfo } from "@/store/atoms"; // Import AssetInfo and uploadedFileAtom
import type { ScratchProject } from "@/services/scratch";
import { Loader2, Upload } from "lucide-react";
import { extractAssetsFromProjectJson } from "@/lib/scratchUtils"; // Import the utility function

// Mock GenerateTutorialStepsOutput type since the flow is removed
interface GenerateTutorialStepsOutput {
    tutorialSteps: Array<{ functionality: string; steps: string[] }>;
}


const formSchema = z.object({
  file: z.instanceof(File).refine(file => file.size > 0, { message: "Please upload an .sb3 file." })
    .refine(file => file.name.endsWith('.sb3'), { message: "File must be an .sb3 file."})
    .refine(file => file.size < 50 * 1024 * 1024, { message: "File size must be less than 50MB."}), // Optional: Add size limit
});

export function ImportForm() {
  const [isPending, startTransition] = useTransition();
  const [, setTutorialData] = useAtom(tutorialDataAtom);
  const [, setUploadedFile] = useAtom(uploadedFileAtom); // Atom setter for the file
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      setTutorialData({ status: "loading", data: null, error: null });
      setUploadedFile(null); // Clear previous file
      try {
        let scratchProject: ScratchProject;
        let projectJson: any = null;
        let projectJsonContent: string | null = null;
        let assets: AssetInfo[] = []; // Initialize assets array

        if (values.file) {
           toast({ title: "Reading .sb3 file..." });
           console.log(`Processing uploaded SB3 file: ${values.file.name}, size: ${values.file.size} bytes.`);
           setUploadedFile(values.file); // Store the file object in the atom

           try {
             const zip = await JSZip.loadAsync(values.file);
             const projectJsonFile = zip.file('project.json');

             if (projectJsonFile) {
               projectJsonContent = await projectJsonFile.async('string');
               projectJson = JSON.parse(projectJsonContent);
               console.log("Successfully parsed project.json");
               toast({ title: "Project data extracted.", description: "Found and parsed project.json." });

               // Extract assets using the utility function
               assets = extractAssetsFromProjectJson(projectJsonContent);
               toast({ title: "Assets identified", description: `Found ${assets.length} assets.` });

             } else {
               throw new Error("project.json not found in the .sb3 file.");
             }
           } catch (zipError) {
             console.error("Error reading or parsing .sb3 file:", zipError);
             const zipErrorMessage = zipError instanceof Error ? zipError.message : "Failed to read the .sb3 file content.";
             throw new Error(`Error processing .sb3 file: ${zipErrorMessage}`);
           }

          scratchProject = {
             id: `local-${values.file.name}-${values.file.lastModified}`,
             name: values.file.name.replace('.sb3', ''),
             description: "Project uploaded from file.",
             resources: [], // Placeholder for potential future use
           };

        } else {
          throw new Error("No .sb3 file provided.");
        }

        // --- AI Generation Simulation (currently disabled) ---
        toast({ title: "Generating tutorial steps (Mock Data)..." });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

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
                resources: scratchProject.resources, // Keep original resources field
                tutorialSteps: mockTutorialResult.tutorialSteps,
                projectJsonContent: projectJsonContent,
                assets: assets, // Store the extracted assets
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
        setUploadedFile(null); // Clear file on error
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

        <FormField
          control={form.control}
          name="file"
          render={({ field: { onChange, onBlur, name, ref } }) => (
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
