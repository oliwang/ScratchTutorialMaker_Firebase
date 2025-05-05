
"use client";

import { useAtom } from "jotai";
import { tutorialDataAtom, uploadedFileAtom } from "@/store/atoms"; // Import uploadedFileAtom
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
import { AlertCircle, FileText, Image as ImageIcon, Music, DownloadCloud, BookOpen, Loader2, FileJson, Package, Download } from "lucide-react"; // Added Package, Download
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import Image from 'next/image';
import * as React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import JSZip from "jszip"; // Import JSZip for downloading assets
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Import Table components

// Helper to determine resource type icon (updated to use asset type)
const getAssetIcon = (assetType: 'image' | 'sound') => {
    if (assetType === 'image') {
        return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
    }
    if (assetType === 'sound') {
        return <Music className="h-4 w-4 text-muted-foreground" />;
    }
    // Default icon for unknown types (shouldn't happen with current AssetInfo)
    return <FileText className="h-4 w-4 text-muted-foreground" />;
};


const formatTutorialForExport = (data: NonNullable<ReturnType<typeof useAtom<typeof tutorialDataAtom>>[0]['data']>): string => {
    let content = `Project Name: ${data.projectName}\n\n`;
    content += `Description: ${data.projectDescription}\n\n`;

    // Content formatting for resources and steps remains the same...
    content += `Resources:\n`;
     (data.resources ?? []).forEach(resource => { // Handle potentially undefined resources
        content += `- ${resource}\n`;
    });
    content += '\n';

    content += `Tutorial Steps:\n\n`;
     (data.tutorialSteps ?? []).forEach((section, index) => { // Handle potentially undefined tutorialSteps
        content += `Section ${index + 1}: ${section.functionality}\n`;
        section.steps.forEach((step, stepIndex) => {
            content += `  Step ${stepIndex + 1}: ${step}\n`;
        });
        content += '\n';
    });


     if (data.projectJsonContent) {
        content += `--- Project.json Content ---\n\n`;
        // Truncate if too long? Consider adding a note instead of full content.
        content += data.projectJsonContent.substring(0, 5000) + (data.projectJsonContent.length > 5000 ? "\n... (truncated)" : "");
        content += '\n\n--- End Project.json Content ---\n';
     }

     // Add asset list to export
     if (data.assets && data.assets.length > 0) {
         content += `Assets:\n`;
         data.assets.forEach(asset => {
             content += `- ${asset.name} (${asset.type}, ${asset.md5ext})\n`;
         });
         content += '\n';
     }


    return content;
};

// Helper function to trigger file download
const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export function TutorialDisplay() {
    const [tutorialState] = useAtom(tutorialDataAtom);
    const [uploadedFile] = useAtom(uploadedFileAtom); // Get the uploaded file
    const { toast } = useToast();
    const [isExporting, setIsExporting] = React.useState(false);
    const [isDownloadingAll, setIsDownloadingAll] = React.useState(false);
    const [isDownloadingSingle, setIsDownloadingSingle] = React.useState<string | null>(null); // Store md5ext of asset being downloaded

     const handleExport = async () => {
        if (tutorialState.status !== 'success' || !tutorialState.data) return;
        // Export logic remains the same...
         setIsExporting(true);
        toast({ title: "Exporting to Google Docs..." });
        try {
            const contentToExport = formatTutorialForExport(tutorialState.data);
            const result = await exportToGoogleDocs(contentToExport);
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
                 duration: 9000,
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

    // Function to handle downloading a single asset
    const handleDownloadSingleAsset = async (md5ext: string, assetName: string) => {
        if (!uploadedFile) {
            toast({ title: "Error", description: "Uploaded project file not found.", variant: "destructive" });
            return;
        }
        setIsDownloadingSingle(md5ext);
        try {
            const zip = await JSZip.loadAsync(uploadedFile);
            const assetFile = zip.file(md5ext);
            if (assetFile) {
                const blob = await assetFile.async('blob');
                 // Attempt to create a more user-friendly filename
                 const extension = md5ext.split('.').pop() || 'bin';
                 const friendlyName = assetName.replace(/[^a-zA-Z0-9_-]/g, '_') || md5ext.split('.')[0]; // Sanitize name
                downloadBlob(blob, `${friendlyName}.${extension}`);
                toast({ title: "Download Started", description: `Downloading ${assetName}` });
            } else {
                throw new Error(`Asset ${md5ext} not found in the project file.`);
            }
        } catch (error) {
            console.error(`Error downloading asset ${md5ext}:`, error);
            const errorMessage = error instanceof Error ? error.message : "Could not download asset.";
            toast({ title: "Download Failed", description: errorMessage, variant: "destructive" });
        } finally {
            setIsDownloadingSingle(null);
        }
    };

    // Function to handle downloading all assets as a zip
    const handleDownloadAllAssets = async () => {
        if (!uploadedFile || tutorialState.status !== 'success' || !tutorialState.data?.assets || tutorialState.data.assets.length === 0) {
            toast({ title: "No Assets", description: "No assets found to download or project not loaded.", variant: "destructive" });
            return;
        }
        setIsDownloadingAll(true);
        toast({ title: "Preparing Download", description: "Zipping assets..." });

        try {
            const inputZip = await JSZip.loadAsync(uploadedFile);
            const outputZip = new JSZip();
            const assetsToInclude = tutorialState.data.assets;

            for (const asset of assetsToInclude) {
                const assetFile = inputZip.file(asset.md5ext);
                if (assetFile) {
                     // Use a more friendly filename within the zip
                    const extension = asset.dataFormat || asset.md5ext.split('.').pop() || 'bin';
                    const friendlyName = asset.name.replace(/[^a-zA-Z0-9_-]/g, '_') || asset.md5ext.split('.')[0]; // Sanitize name
                    outputZip.file(`${friendlyName}.${extension}`, assetFile.async('blob'));
                } else {
                     console.warn(`Asset ${asset.md5ext} listed in JSON but not found in sb3 file.`);
                 }
            }

            const zipBlob = await outputZip.generateAsync({ type: "blob" });
             const projectName = tutorialState.data.projectName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'scratch_project';
            downloadBlob(zipBlob, `${projectName}_assets.zip`);
            toast({ title: "Download Started", description: "Downloading all assets as a zip file." });

        } catch (error) {
            console.error("Error creating zip file for all assets:", error);
            const errorMessage = error instanceof Error ? error.message : "Could not create zip file.";
            toast({ title: "Download Failed", description: errorMessage, variant: "destructive" });
        } finally {
            setIsDownloadingAll(false);
        }
    };

    // --- Loading State ---
    if (tutorialState.status === "loading") {
        return (
            <Card>
                <CardHeader>
                     <Skeleton className="h-6 w-3/4" />
                     <Skeleton className="h-4 w-1/2 mt-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                     {/* Loading indicator */}
                     <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-3 text-muted-foreground">Processing project...</p>
                    </div>
                    {/* Skeleton for Resources */}
                     <Separator className="my-4"/>
                     <Skeleton className="h-5 w-1/4 mb-2" />
                     <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-8 w-24 rounded-full" />
                        <Skeleton className="h-8 w-20 rounded-full" />
                        <Skeleton className="h-8 w-28 rounded-full" />
                    </div>
                    {/* Skeleton for Tutorial Steps */}
                     <Separator className="my-4"/>
                     <Skeleton className="h-5 w-1/3 mb-4" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                     {/* Skeleton for project.json */}
                     <Separator className="my-4"/>
                     <Skeleton className="h-10 w-full" />
                     {/* Skeleton for Assets Table */}
                     <Separator className="my-4"/>
                     <Skeleton className="h-5 w-1/4 mb-4" />
                     <Skeleton className="h-10 w-full mb-2" />
                     <Skeleton className="h-10 w-full mb-2" />
                     <Skeleton className="h-10 w-full mb-2" />
                     <Skeleton className="h-10 w-36 mt-4" /> {/* Skeleton for Download All button */}
                </CardContent>
                 <CardFooter>
                    <Skeleton className="h-10 w-36" /> {/* Skeleton for Export button */}
                </CardFooter>
            </Card>
        );
    }

     // --- Error State ---
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

    // --- Success State ---
    if (tutorialState.status === "success" && tutorialState.data) {
        const { projectName, projectDescription, resources, tutorialSteps, projectJsonContent, assets } = tutorialState.data;
        return (
            <Card className="bg-card border border-border shadow-lg transition-all duration-300 ease-in-out animate-in fade-in-50">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-primary">{projectName}</CardTitle>
                    <CardDescription className="text-base">{projectDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     {/* Resources Section (kept for compatibility/future use) */}
                    {resources && resources.length > 0 && (
                        <>
                            <Separator />
                             <div>
                                <h3 className="text-lg font-medium mb-3 text-foreground">Project Metadata Resources</h3>
                                <div className="flex flex-wrap gap-2">
                                    {resources.map((resource, index) => (
                                        <Badge key={index} variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5 text-sm">
                                            <FileText className="h-4 w-4 text-muted-foreground" /> {/* Using default icon */}
                                            {resource}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                     {/* Assets Table Section */}
                    {assets && assets.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <h3 className="text-lg font-medium mb-3 text-foreground">Project Assets</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">Icon</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Filename</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assets.map((asset) => (
                                            <TableRow key={asset.md5ext}>
                                                <TableCell>{getAssetIcon(asset.type)}</TableCell>
                                                <TableCell className="font-medium">{asset.name}</TableCell>
                                                <TableCell>{asset.type}</TableCell>
                                                <TableCell className="text-muted-foreground">{asset.md5ext}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDownloadSingleAsset(asset.md5ext, asset.name)}
                                                        disabled={!uploadedFile || isDownloadingSingle === asset.md5ext || isDownloadingAll}
                                                        title={`Download ${asset.name}`}
                                                    >
                                                        {isDownloadingSingle === asset.md5ext ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Download className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Button
                                    onClick={handleDownloadAllAssets}
                                    disabled={!uploadedFile || isDownloadingAll || isDownloadingSingle !== null}
                                    className="mt-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                                >
                                    {isDownloadingAll ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Zipping...
                                        </>
                                    ) : (
                                        <>
                                            <Package className="mr-2 h-4 w-4" />
                                            Download All Assets (.zip)
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}

                     {/* Tutorial Steps Section */}
                     <Separator />
                    <div>
                        <h3 className="text-lg font-medium mb-3 text-foreground">Step-by-Step Tutorial</h3>
                        {tutorialSteps && tutorialSteps.length > 0 ? (
                             <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                                {tutorialSteps.map((section, index) => (
                                    <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
                                        <AccordionTrigger className="text-base font-medium hover:no-underline py-4 text-left">
                                            <BookOpen className="h-5 w-5 mr-2 text-primary" />
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
                 <CardFooter className="flex justify-between items-center"> {/* Use flex justify-between */}
                     <Button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground"
                     >
                         {isExporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exporting to Docs...
                            </>
                        ) : (
                             <>
                                <DownloadCloud className="mr-2 h-4 w-4" />
                                Export to Google Docs
                            </>
                         )}
                    </Button>
                     {/* Placeholder for potential future actions */}
                     <div></div>
                </CardFooter>
            </Card>
        );
    }

    // Fallback if state is somehow unexpected (shouldn't happen)
    return null;
}
