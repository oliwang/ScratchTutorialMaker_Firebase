
"use client";

import { useAtom } from "jotai";
import { tutorialDataAtom } from "@/store/atoms";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { exportToGoogleDocs } from "@/services/google-docs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileText, Image as ImageIcon, Music, DownloadCloud, BookOpen, Loader2, FileJson } from "lucide-react"; // Added Loader2, FileJson
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import Image from 'next/image';
import * as React from 'react'; // Ensure React is imported for useState
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea

// Helper to determine resource type icon
const getResourceIcon = (resourceName: string) => {
    const extension = resourceName.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(extension || '')) {
        return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
    }
    if (['mp3', 'wav', 'ogg'].includes(extension || '')) {
        return <Music className="h-4 w-4 text-muted-foreground" />;
    }
    // Default icon for unknown or other types
    return <FileText className="h-4 w-4 text-muted-foreground" />;
};

const formatTutorialForExport = (data: NonNullable<ReturnType<typeof useAtom<typeof tutorialDataAtom>>[0]['data']>): string => {
    let content = `Project Name: ${data.projectName}\n\n`;
    content += `Description: ${data.projectDescription}\n\n`;

    content += `Resources:\n`;
    data.resources.forEach(resource => {
        content += `- ${resource}\n`;
    });
    content += '\n';

    content += `Tutorial Steps:\n\n`;
    data.tutorialSteps.forEach((section, index) => {
        content += `Section ${index + 1}: ${section.functionality}\n`;
        section.steps.forEach((step, stepIndex) => {
            content += `  Step ${stepIndex + 1}: ${step}\n`;
        });
        content += '\n';
    });

     // Optionally include project.json content in export
     if (data.projectJsonContent) {
        content += `--- Project.json Content ---\n\n`;
        content += data.projectJsonContent;
        content += '\n\n--- End Project.json Content ---\n';
     }


    return content;
};


export function TutorialDisplay() {
    const [tutorialState] = useAtom(tutorialDataAtom);
    const { toast } = useToast();
    const [isExporting, setIsExporting] = React.useState(false);

     const handleExport = async () => {
        if (tutorialState.status !== 'success' || !tutorialState.data) return;

        setIsExporting(true);
        toast({ title: "Exporting to Google Docs..." });
        try {
            const contentToExport = formatTutorialForExport(tutorialState.data);
            const result = await exportToGoogleDocs(contentToExport);
             // Construct the Google Docs URL
            const docUrl = `https://docs.google.com/document/d/${result.documentId}/edit`;

            toast({
                title: "Export Successful!",
                description: (
                 <span>
                    Tutorial exported to Google Docs.
                    <a href={docUrl} target="_blank" rel="noopener noreferrer" className="ml-2 underline text-accent">
                        Open Document
                    </a>
                 </span>
                ),
                 duration: 9000, // Keep toast longer to allow clicking the link
            });
        } catch (error) {
            console.error("Export failed:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: "Export Failed",
                description: `Could not export to Google Docs: ${errorMessage}`,
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    // Removed the 'idle' state check, as this component won't render in that state anymore.
    // if (tutorialState.status === "idle") { ... }

    if (tutorialState.status === "loading") {
        return (
            <Card>
                <CardHeader>
                     <Skeleton className="h-6 w-3/4" />
                     <Skeleton className="h-4 w-1/2 mt-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-3 text-muted-foreground">Generating tutorial...</p>
                    </div>
                    <Separator className="my-4"/>
                     <Skeleton className="h-5 w-1/4 mb-2" />
                     <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-8 w-24 rounded-full" />
                        <Skeleton className="h-8 w-20 rounded-full" />
                        <Skeleton className="h-8 w-28 rounded-full" />
                    </div>
                     <Separator className="my-4"/>
                     <Skeleton className="h-5 w-1/3 mb-4" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                     <Separator className="my-4"/>
                     <Skeleton className="h-10 w-full" /> {/* Skeleton for project.json */}
                </CardContent>
                 <CardFooter>
                    <Skeleton className="h-10 w-36" />
                </CardFooter>
            </Card>
        );
    }

     if (tutorialState.status === "error") {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Generating Tutorial</AlertTitle>
                <AlertDescription>
                    {tutorialState.error || "An unexpected error occurred. Please try again."}
                </AlertDescription>
            </Alert>
        );
    }


    if (tutorialState.status === "success" && tutorialState.data) {
        const { projectName, projectDescription, resources, tutorialSteps, projectJsonContent } = tutorialState.data;
        return (
            <Card className="bg-card border border-border shadow-lg transition-all duration-300 ease-in-out animate-in fade-in-50">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-primary">{projectName}</CardTitle>
                    <CardDescription className="text-base">{projectDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Separator />
                     <div>
                        <h3 className="text-lg font-medium mb-3 text-foreground">Project Resources</h3>
                        {resources && resources.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {resources.map((resource, index) => (
                                    <Badge key={index} variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5 text-sm">
                                        {getResourceIcon(resource)}
                                        {resource}
                                    </Badge>
                                ))}
                            </div>
                         ) : (
                            <p className="text-sm text-muted-foreground italic">No specific resources listed.</p>
                        )}
                    </div>

                     <Separator />

                    <div>
                        <h3 className="text-lg font-medium mb-3 text-foreground">Step-by-Step Tutorial</h3>
                        {tutorialSteps && tutorialSteps.length > 0 ? (
                             <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                                {tutorialSteps.map((section, index) => (
                                    <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
                                        <AccordionTrigger className="text-base font-medium hover:no-underline py-4 text-left">
                                            {`Part ${index + 1}: ${section.functionality}`}
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2 pb-4 px-1">
                                            <ol className="list-decimal list-outside space-y-2 ml-5 text-foreground/90">
                                                {section.steps.map((step, stepIndex) => (
                                                    <li key={stepIndex} className="pl-1">{step}</li>
                                                ))}
                                            </ol>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No tutorial steps generated.</p>
                        )}
                    </div>

                     {/* project.json display section */}
                    {projectJsonContent && (
                        <>
                             <Separator />
                             <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="project-json" className="border-b border-border">
                                    <AccordionTrigger className="text-base font-medium hover:no-underline py-4 text-left flex items-center gap-2">
                                         <FileJson className="h-5 w-5 text-primary" /> Project.json Content
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-4 px-1">
                                        <ScrollArea className="h-72 w-full rounded-md border bg-muted/50 p-4">
                                            <pre className="text-sm whitespace-pre-wrap break-words">
                                                {projectJsonContent}
                                            </pre>
                                        </ScrollArea>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </>
                    )}

                </CardContent>
                 <CardFooter>
                    <Button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground"
                     >
                         {isExporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                             <>
                                <DownloadCloud className="mr-2 h-4 w-4" />
                                Export to Google Docs
                            </>
                         )}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    // Should not be reached if logic in page.tsx is correct, but provides a fallback
    return null;
}
