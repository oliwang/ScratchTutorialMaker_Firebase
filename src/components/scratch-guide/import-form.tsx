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
import { summarizeScratchProject } from "@/ai/flows/summarize-scratch-project";
import { generateTutorialSteps } from "@/ai/flows/generate-tutorial-steps";
import { getScratchProjectFromUrl } from "@/services/scratch"; // Assuming this is implemented
import type { ScratchProject } from "@/services/scratch";
import type { GenerateTutorialStepsOutput } from "@/ai/flows/generate-tutorial-steps";
import { Loader2, Upload, Link2 } from "lucide-react";

const formSchema = z.object({
  importType: z.enum(["url", "file"]).default("url"),
  url: z.string().url({ message: "Please enter a valid Scratch project URL." }).optional(),
  file: z.instanceof(File).optional(),
}).refine(data => {
  if (data.importType === "url") {
    return !!data.url;
  }
  if (data.importType === "file") {
    // In a real scenario, you'd add file validation here (size, type)
    return !!data.file;
  }
  return false;
}, {
  message: "Please provide either a URL or a file.",
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

        if (values.importType === "url" && values.url) {
          // TODO: Implement getScratchProjectFromUrl or replace with actual logic
          // For now, simulate API call and use placeholder data
          toast({ title: "Fetching project from URL..." });
          // In a real app, call getScratchProjectFromUrl(values.url)
           scratchProject = await getScratchProjectFromUrl(values.url);
           toast({ title: "Project details fetched.", description: `Name: ${scratchProject.name}` });

        } else if (values.importType === "file" && values.file) {
           toast({ title: "Processing uploaded file..." });
          // TODO: Implement file processing logic to extract project data
          // This might involve parsing the .sb3 file content
          // For now, simulate processing and use placeholder data
          await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
          scratchProject = {
             name: values.file.name.replace('.sb3', ''),
             description: "Project uploaded from file.",
             resources: ["sprite1.png", "background.jpg", "sound.mp3"], // Placeholder resources
           };
           toast({ title: "File processed.", description: `Name: ${scratchProject.name}` });
        } else {
          throw new Error("Invalid import method or missing data.");
        }

        // Generate Summary (optional, could be merged with tutorial generation)
        // const summaryResult = await summarizeScratchProject({ scratchProjectUrl: values.url || 'placeholder_for_file' });
        // console.log("Summary:", summaryResult.summary);

        // Generate Tutorial Steps
        toast({ title: "Generating tutorial steps..." });
        const tutorialResult: GenerateTutorialStepsOutput = await generateTutorialSteps({
            scratchProject: {
                name: scratchProject.name,
                description: scratchProject.description,
                resources: scratchProject.resources,
            }
        });

        setTutorialData({
            status: "success",
            data: {
                projectName: scratchProject.name,
                projectDescription: scratchProject.description, // Or use summaryResult.summary
                resources: scratchProject.resources,
                tutorialSteps: tutorialResult.tutorialSteps,
            },
            error: null,
        });
        toast({
            title: "Tutorial Generated Successfully!",
            description: "Scroll down to view the tutorial.",
        });

      } catch (error) {
        console.error("Error generating tutorial:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setTutorialData({ status: "error", data: null, error: errorMessage });
        toast({
          title: "Error",
          description: `Failed to generate tutorial: ${errorMessage}`,
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
                      disabled={isPending || activeTab !== 'url'}
                      onChange={(e) => {
                        field.onChange(e);
                        if (e.target.value) form.setValue("file", undefined); // Clear file if URL is entered
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the URL of the public Scratch project.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          <TabsContent value="file">
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scratch Project File (.sb3)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".sb3"
                      disabled={isPending || activeTab !== 'file'}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        field.onChange(file);
                         if (file) form.setValue("url", undefined); // Clear URL if file is selected
                      }}
                      // We don't use {...field} directly for file inputs due to value control complexities
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
              Generating...
            </>
          ) : (
            "Generate Tutorial"
          )}
        </Button>
      </form>
    </Form>
  );
}
