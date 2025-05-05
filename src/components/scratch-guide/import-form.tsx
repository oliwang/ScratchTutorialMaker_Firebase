"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useTransition } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { tutorialDataAtom } from "@/store/atoms";
// import { summarizeScratchProject } from "@/ai/flows/summarize-scratch-project"; // Removed
// import { generateTutorialSteps } from "@/ai/flows/generate-tutorial-steps"; // Removed
import { getScratchProjectFromUrl } from "@/services/scratch"; // Use the implemented function
import type { ScratchProject } from "@/services/scratch";
// import type { GenerateTutorialStepsOutput } from "@/ai/flows/generate-tutorial-steps"; // Removed
import { Loader2, Upload, Link2 } from "lucide-react";

// Mock GenerateTutorialStepsOutput type since the flow is removed
interface GenerateTutorialStepsOutput {
    tutorialSteps: Array<{ functionality: string; steps: string[] }>;
}


const formSchema = z.object({
  importType: z.enum(["url", "file"]).default("url"),
  url: z.string().url({ message: "Please enter a valid Scratch project URL." }).optional(),
  file: z.instanceof(File).optional(),
}).refine(data => {
  if (data.importType === "url") {
    // Basic check for scratch.mit.edu or turbowarp.org URLs
    return !!data.url && (data.url.includes('scratch.mit.edu/projects/') || data.url.includes('turbowarp.org'));
  }
  if (data.importType === "file") {
    // In a real scenario, you'd add file validation here (size, type)
    return !!data.file;
  }
  return false;
}, {
  message: "Please provide a valid Scratch project URL or an .sb3 file.",
  path: ["url"], // Apply error to url field for visibility, adjust as needed
});

export function ImportForm() {
  const [isPending, startTransition] = useTransition();
  const [, setTutorialData] = useAtom(tutorialDataAtom);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("url");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      importType: "url",
      url: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      setTutorialData({ status: "loading", data: null, error: null });
      try {
        let scratchProject: ScratchProject;
        let fetchSource = "";
        let sb3FileBlob: Blob | null = null; // Variable to hold the fetched .sb3 blob

        if (values.importType === "url" && values.url) {
           fetchSource = "URL";
           toast({ title: "Fetching project details and file from URL...", description: "This may take a moment." });
           // Use the updated function that returns both metadata and the blob
           const { projectData, sb3Blob } = await getScratchProjectFromUrl(values.url);
           scratchProject = projectData;
           sb3FileBlob = sb3Blob; // Store the fetched blob
           toast({ title: "Project details and file fetched successfully.", description: `Project: ${scratchProject.name}` });
           console.log(`Fetched metadata for project ID ${scratchProject.id}. SB3 file blob size: ${sb3FileBlob?.size || 0} bytes.`);
           // TODO: You can now use sb3FileBlob for further processing if needed (e.g., pass to AI, parse resources)

        } else if (values.importType === "file" && values.file) {
           fetchSource = "File";
           toast({ title: "Processing uploaded .sb3 file..." });
          // Simulate processing for file upload (replace with actual parsing if needed)
          await new Promise(resolve => setTimeout(resolve, 500)); // Short delay simulation
          scratchProject = {
             id: 'local-file', // Placeholder ID for file uploads
             name: values.file.name.replace('.sb3', ''),
             description: "Project uploaded from file.", // Placeholder description
             resources: [], // Placeholder resources - could be extracted by parsing sb3
           };
           // You have the file object here: values.file
           // TODO: Process the uploaded file (values.file) if needed.
           console.log(`Processing uploaded SB3 file: ${values.file.name}, size: ${values.file.size} bytes.`);
           toast({ title: "File processed.", description: `Project: ${scratchProject.name}` });
        } else {
          throw new Error("Invalid import method or missing data.");
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
              functionality: "Making the Cat Move (Mock Data)",
              steps: ["Select the Cat sprite.", "Go to the 'Motion' blocks category.", "Drag out a 'move 10 steps' block.", "Click the block to make the cat move."]
            },
            {
              functionality: "Adding Sound (Mock Data)",
              steps: ["Go to the 'Sound' blocks category.", "Drag out a 'play sound Meow until done' block.", "Attach it under the 'move 10 steps' block."]
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
                resources: scratchProject.resources.length > 0 ? scratchProject.resources : ['sprite1', 'backdrop1'], // Example placeholder if empty
                tutorialSteps: mockTutorialResult.tutorialSteps, // Use mock data
            },
            error: null,
        });
        toast({
            title: "Tutorial Generated (Using Mock Data)",
            description: `Based on project: ${scratchProject.name}`,
        });


      } catch (error) {
        console.error(`Error during ${values.importType} import/generation process:`, error);
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
        <h2 className="text-2xl font-semibold text-primary mb-4">Import Scratch Project</h2>
        <Tabs value={activeTab} onValueChange={(value) => {
             setActiveTab(value);
             form.setValue("importType", value as "url" | "file");
             form.clearErrors(); // Clear errors when switching tabs
             // Clear the other field's value
             if (value === 'url') form.setValue('file', undefined);
             if (value === 'file') form.setValue('url', '');
            }} defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="url"><Link2 className="mr-2 h-4 w-4" /> Import from URL</TabsTrigger>
            <TabsTrigger value="file"><Upload className="mr-2 h-4 w-4" /> Upload .sb3 File</TabsTrigger>
          </TabsList>
          <TabsContent value="url">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scratch Project URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://scratch.mit.edu/projects/..."
                      {...field}
                      value={field.value ?? ''} // Ensure value is controlled
                      disabled={isPending || activeTab !== 'url'}
                      onChange={(e) => {
                        field.onChange(e);
                        if (e.target.value) form.setValue("file", undefined); // Clear file if URL is typed
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the URL of a public Scratch project (e.g., from scratch.mit.edu or turbowarp.org).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          <TabsContent value="file">
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
                      disabled={isPending || activeTab !== 'file'}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        onChange(file); // RHF's onChange for file input
                        if (file) form.setValue("url", ''); // Clear URL if file is selected
                      }}
                      onBlur={onBlur}
                      name={name}
                      ref={ref}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload your Scratch project file.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

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
