
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
import { generateAnalysis } from "@/services/llm-provider";

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
      toast({ title: "Processing Scratch Project..." }); // Inform user processing started

      try {
        let scratchProject: ScratchProject;
        let projectJson: any = null;
        let projectJsonContent: string | null = null;
        let assets: AssetInfo[] = []; // Initialize assets array

        if (values.file) {
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
        // toast({ title: "Generating tutorial steps (Mock Data)..." }); // Commented out, AI disabled
        // await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay (reduced)
        const tutorialSteps = await generateAnalysis(projectJsonContent);

         setTutorialData({
            status: "success",
            data: {
                projectName: scratchProject.name,
                projectDescription: scratchProject.description,
                resources: scratchProject.resources, // Keep original resources field
                projectJsonContent: projectJsonContent,
                assets: assets, // Store the extracted assets
                llmAnalysis: tutorialSteps,
            },
            error: null,
        });
        toast({
            title: "Tutorial Generated",
            description: `Loaded project: ${scratchProject.name}`,
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
