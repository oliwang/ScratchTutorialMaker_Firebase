"use client";

import { useAtom } from "jotai";
import { tutorialDataAtom, uploadedFileAtom, AssetInfo, Tutorial } from "@/store/atoms"; // Import AssetInfo
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
import { AlertCircle, FileText, Image as ImageIcon, Music, DownloadCloud, BookOpen, Loader2, FileJson, Package, Download, ListTree, TriangleAlert } from "lucide-react"; // Added TriangleAlert
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import Image from 'next/image';
import * as React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import JSZip from "jszip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Import ScratchBlocks component
import ScratchBlocks from "./blocks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper to determine resource type icon
const getAssetIcon = (assetType: 'image' | 'sound') => {
    if (assetType === 'image') {
        return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
    }
    if (assetType === 'sound') {
        return <Music className="h-4 w-4 text-muted-foreground" />;
    }
    return <FileText className="h-4 w-4 text-muted-foreground" />;
};


const formatTutorialForExport = (data: NonNullable<ReturnType<typeof useAtom<typeof tutorialDataAtom>>[0]['data']>): string => {
    let content = `Project Name: ${data.projectName}\n\n`;
    content += `Description: ${data.projectDescription}\n\n`;

    content += `Resources:\n`;
     (data.resources ?? []).forEach(resource => {
        content += `- ${resource}\n`;
    });
    content += '\n';



     if (data.projectJsonContent) {
        content += `--- Project.json Content ---\n\n`;
        content += data.projectJsonContent.substring(0, 5000) + (data.projectJsonContent.length > 5000 ? "\n... (truncated)" : "");
        content += '\n\n--- End Project.json Content ---\n';
     }

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

// Inline Asset Preview Cell Component
interface AssetPreviewCellProps {
    assetInfo: AssetInfo;
    uploadedFile: File | null;
}

function AssetPreviewCell({ assetInfo, uploadedFile }: AssetPreviewCellProps) {
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        let objectUrl: string | null = null;
        let isMounted = true; // Flag to track mount status

        const loadPreview = async () => {
            if (!assetInfo || !uploadedFile) {
                 return;
            }

            setIsLoading(true);
            setError(null);
            setPreviewUrl(null); // Reset preview while loading

            try {
                
                const zip = await JSZip.loadAsync(uploadedFile);
                const assetFile = zip.file(assetInfo.md5ext);
                console.log(assetInfo, assetFile);

                if (!assetFile) {
                    throw new Error(`Asset file not found in zip`);
                }

                const blob = await assetFile.async('blob');
                 if (!isMounted) return; // Don't proceed if unmounted

                objectUrl = URL.createObjectURL(blob);
                 if (!isMounted) { // Check again after async op
                    URL.revokeObjectURL(objectUrl);
                    return;
                 }
                 console.log(assetInfo.dataFormat, objectUrl);
                setPreviewUrl(objectUrl);

            } catch (err) {
                 console.error(`Error loading preview for ${assetInfo.name} (${assetInfo.md5ext}):`, err);
                 if (!isMounted) return;
                 const message = err instanceof Error ? err.message : "Load failed";
                 setError(message);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                 }
            }
        };

        loadPreview();

        // Cleanup function
        return () => {
            isMounted = false; // Set flag on unmount
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
            setPreviewUrl(null); // Clear preview on unmount or re-render
        };
     // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [assetInfo.md5ext, assetInfo.dataFormat, uploadedFile]); // Rerun if asset changes


    

    if (isLoading) {
        return <Skeleton className="h-10 w-10 rounded" />;
    }

    if (error) {
         return <div className="flex items-center justify-center h-10 w-10 rounded bg-muted/50" title={`Error: ${error}`}>
            <TriangleAlert className="h-5 w-5 text-destructive" />
         </div>;
    }

    if (previewUrl) {
        console.log(assetInfo.type, previewUrl);
        if (assetInfo.type === 'image') {
            // Render SVG and other images the same way with img tag for consistency
            return (
                <div className="w-full h-full flex items-center justify-center">
                    <img 
                        src={previewUrl}
                        alt={`Preview of ${assetInfo.name}`}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        className="max-w-full max-h-full"
                    />
                </div>
            );
        }

        if (assetInfo.type === 'sound') {
             // Render a compact audio player
            return (
                <audio 
                    controls 
                    src={previewUrl} 
                    style={{ width: '100%', height: '24px' }} 
                    className="rounded"
                >
                    {/* Fallback text */}
                    Your browser does not support the audio element.
                    <a href={previewUrl} download={assetInfo.name}>Download</a>
                </audio>
            );
        }
    }

     // Fallback or if asset type is unknown or previewUrl is null (and not SVG)
    return <div className="flex items-center justify-center w-12 h-12 rounded">
             <FileText className="h-5 w-5 text-muted-foreground" />
           </div>;
}


export function TutorialDisplay() {
    const [tutorialState] = useAtom(tutorialDataAtom);
    const [uploadedFile] = useAtom(uploadedFileAtom);
    const { toast } = useToast();
    const [isExporting, setIsExporting] = React.useState(false);
    const [isDownloadingAll, setIsDownloadingAll] = React.useState(false);
    const [isDownloadingSingle, setIsDownloadingSingle] = React.useState<string | null>(null);

    const handleExport = async () => {
        if (tutorialState.status !== 'success' || !tutorialState.data) return;
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
                 const extension = md5ext.split('.').pop() || 'bin';
                 const friendlyName = assetName.replace(/[^a-zA-Z0-9_-]/g, '_') || md5ext.split('.')[0];
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

    const handleDownloadAllAssets = async (e?: React.MouseEvent<HTMLButtonElement>) => {
        e?.stopPropagation(); // Prevent accordion from toggling if called from trigger
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
                    const extension = asset.dataFormat || asset.md5ext.split('.').pop() || 'bin';
                    const friendlyName = asset.name.replace(/[^a-zA-Z0-9_-]/g, '_') || asset.md5ext.split('.')[0];
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

     // Group assets by file extension, prioritizing non-SVG images, then SVG, then sounds
    const groupedAssetsByExtension = React.useMemo(() => {
        if (tutorialState.status !== 'success' || !tutorialState.data?.assets) {
            return {};
        }
        const groups = tutorialState.data.assets.reduce((acc, asset) => {
            const extension = asset.dataFormat.toLowerCase() || 'unknown';
            if (!acc[extension]) {
                acc[extension] = [];
            }
            acc[extension].push(asset);
            return acc;
        }, {} as Record<string, AssetInfo[]>);

        // Define order: non-SVG images, SVG, sounds, others
        const desiredOrder = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'wav', 'mp3'];

        // Sort the keys based on the desired order
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const indexA = desiredOrder.indexOf(a);
            const indexB = desiredOrder.indexOf(b);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB; // Both are in desired order
            if (indexA !== -1) return -1; // A is in desired order, B is not
            if (indexB !== -1) return 1;  // B is in desired order, A is not
            return a.localeCompare(b); // Neither in desired order, sort alphabetically
        });

        // Create a new object with sorted keys
        const sortedGroups: Record<string, AssetInfo[]> = {};
        sortedKeys.forEach(key => {
            sortedGroups[key] = groups[key];
        });

        return sortedGroups;
    }, [tutorialState.data?.assets, tutorialState.status]);


    // --- Loading State ---
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
                        <p className="ml-3 text-muted-foreground">Processing project...</p>
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
                     <Skeleton className="h-10 w-full" />
                     <Separator className="my-4"/>
                      {/* Skeleton for Assets Accordion */}
                    <Skeleton className="h-10 w-full mb-4" />
                </CardContent>
                 <CardFooter>
                    <Skeleton className="h-10 w-36" />
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
        const { projectName, projectDescription, resources, llmAnalysis, projectJsonContent, assets } = tutorialState.data;
        const hasAssets = assets && assets.length > 0;

        return (
            <>
            <Card className="bg-card border border-border shadow-lg transition-all duration-300 ease-in-out animate-in fade-in-50">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-primary">{projectName}</CardTitle>
                    <CardDescription className="text-base">
                        {
                            typeof tutorialState.data?.llmAnalysis === 'object'
                            ? tutorialState.data?.llmAnalysis?.description
                            : 'No description available'
                        }  
                    </CardDescription>
                    <CardDescription className="text-base">This tutorial is generated by AI. It may not be 100% accurate. Please verify the information before using it.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Resources Section */}
                    {resources && resources.length > 0 && (
                        <>
                            <Separator />
                             <div>
                                <h3 className="text-lg font-medium mb-3 text-foreground">Project Metadata Resources</h3>
                                <div className="flex flex-wrap gap-2">
                                    {resources.map((resource, index) => (
                                        <Badge key={index} variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5 text-sm">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            {resource}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Parsed Blocks Section collapsible*/}
                    <Separator />
                    <Accordion type="single" collapsible className="w-full" defaultValue={undefined}>
                        <AccordionItem value="parsed-blocks" className="border-b-0">
                            <div className="flex justify-between items-center w-full py-4">
                                <AccordionTrigger className="flex-1 text-lg font-medium hover:no-underline text-left flex items-center gap-2 p-0">
                                    <FileJson className="h-5 w-5 text-primary" /> Parsed Blocks
                                </AccordionTrigger>
                            </div>
                            <AccordionContent className="pt-2 pb-4 px-1">
                                {tutorialState.data?.parsedBlocks && (
                                    <Tabs defaultValue="stage" className="w-full">
                                        <div className="relative w-full overflow-hidden mb-4">
                                            <div className="overflow-x-auto pb-3">
                                                <TabsList className="inline-flex w-max">
                                                    <TabsTrigger value="stage">{tutorialState.data.parsedBlocks.stage.name}</TabsTrigger>
                                                    {tutorialState.data.parsedBlocks.sprites.map((sprite) => (
                                                        <TabsTrigger key={sprite.name} value={sprite.name}>{sprite.name}</TabsTrigger>
                                                    ))}
                                                </TabsList>
                                            </div>
                                        </div>
                                        
                                        {/* Stage Content */}
                                        <TabsContent value="stage" className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-medium mb-2">Costumes</h3>
                                                <div className="flex flex-row flex-wrap items-start gap-4">
                                                    {tutorialState.data.parsedBlocks.stage.costumes.map((costume) => (
                                                        <div key={costume.md5ext} className="flex flex-col items-center">
                                                            <div className="w-16 h-16 flex items-center justify-center rounded-md overflow-hidden">
                                                                <AssetPreviewCell assetInfo={{...costume, type: 'image'}} uploadedFile={uploadedFile} />
                                                            </div>
                                                            <span className="text-xs mt-1 text-center w-20 truncate" title={costume.name}>{costume.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <h3 className="text-lg font-medium mb-2">Sounds</h3>
                                                <div className="flex flex-row flex-wrap items-start gap-4">
                                                    {tutorialState.data.parsedBlocks.stage.sounds.map((sound) => (
                                                        <div key={sound.md5ext} className="flex flex-col items-center">
                                                            <div className="w-32 h-10 flex items-center justify-center overflow-hidden">
                                                                <AssetPreviewCell assetInfo={{...sound, type: 'sound'}} uploadedFile={uploadedFile} />
                                                            </div>
                                                            <span className="text-xs mt-1 text-center w-32 truncate" title={sound.name}>{sound.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <h3 className="text-lg font-medium mb-2">Code Blocks</h3>
                                                <div className="space-y-4">
                                                    {tutorialState.data.parsedBlocks.stage.blocks.map((codeblock) => (
                                                        <ScratchBlocks className="overflow-x-auto" blockStyle="scratch3" key={codeblock}>
                                                            {codeblock}
                                                        </ScratchBlocks>
                                                    ))}
                                                </div>
                                            </div>
                                        </TabsContent>
                                        
                                        {/* Sprite Contents */}
                                        {tutorialState.data.parsedBlocks.sprites.map((sprite) => (
                                            <TabsContent key={sprite.name} value={sprite.name} className="space-y-6">
                                                <div>
                                                    <h3 className="text-lg font-medium mb-2">Costumes</h3>
                                                    <div className="flex flex-row flex-wrap items-start gap-4">
                                                        {sprite.costumes.map((costume) => (
                                                            <div key={costume.md5ext} className="flex flex-col items-center">
                                                                <div className="w-16 h-16 flex items-center justify-center rounded-md overflow-hidden">
                                                                    <AssetPreviewCell assetInfo={{...costume, type: 'image'}} uploadedFile={uploadedFile} />
                                                                </div>
                                                                <span className="text-xs mt-1 text-center w-20 truncate" title={costume.name}>{costume.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <h3 className="text-lg font-medium mb-2">Sounds</h3>
                                                    <div className="flex flex-row flex-wrap items-start gap-4">
                                                        {sprite.sounds.map((sound) => (
                                                            <div key={sound.md5ext} className="flex flex-col items-center">
                                                                <div className="w-32 h-10 flex items-center justify-center overflow-hidden">
                                                                    <AssetPreviewCell assetInfo={{...sound, type: 'sound'}} uploadedFile={uploadedFile} />
                                                                </div>
                                                                <span className="text-xs mt-1 text-center w-32 truncate" title={sound.name}>{sound.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <h3 className="text-lg font-medium mb-2">Code Blocks</h3>
                                                    <div className="space-y-4">
                                                        {sprite.blocks.map((codeblock) => (
                                                            <ScratchBlocks className="overflow-x-auto" blockStyle="scratch3" key={codeblock}>
                                                                {codeblock}
                                                            </ScratchBlocks>
                                                        ))}
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                     

                    {/* Step by step tutorial table section. Table columns: Step Number, Step Title, Step Target, Step Code, Step Explanation. */}
                    <Separator />
                    {/* Use collapsible accordion */}
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="step-by-step-tutorial" className="border-b-0">
                            <div className="flex justify-between items-center w-full py-4">
                                <AccordionTrigger className="flex-1 text-lg font-medium hover:no-underline text-left flex items-center gap-2 p-0">
                                    <FileText className="h-5 w-5 text-primary" /> Step-by-Step Tutorial
                                </AccordionTrigger>
                            </div>
                            <AccordionContent className="pt-2 pb-4 px-1">
                            <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Explanation</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {typeof tutorialState.data?.llmAnalysis === 'object' ? 
                                    tutorialState.data?.llmAnalysis?.steps?.map((step, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{step.title}</TableCell>
                                            <TableCell>{step.target.map((target) => `${target.targetType} ${target.targetName}`).join(', ')}</TableCell>
                                            <TableCell>
                                                <ScratchBlocks className="overflow-x-auto" blockStyle="scratch3">
                                                    {step.code}
                                                </ScratchBlocks>
                                            </TableCell>
                                            <TableCell>{step.explanation}</TableCell>
                                        </TableRow>
                                    ))
                                : null}
                            </TableBody>
                        </Table>

                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Extensions Section */}
                    <Separator />
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="what-next" className="border-b-0">
                            <div className="flex justify-between items-center w-full py-4">
                                <AccordionTrigger className="flex-1 text-lg font-medium hover:no-underline text-left flex items-center gap-2 p-0">
                                    <BookOpen className="h-5 w-5 text-primary" /> What Next?
                                </AccordionTrigger>
                            </div>
                            <AccordionContent className="pt-2 pb-4 px-1">
                                {typeof tutorialState.data?.llmAnalysis === 'object'
                                    ? (
                                        <>
                                            {tutorialState.data?.llmAnalysis?.extensions?.map((extension, index) => (
                                                <p key={index} className="flex items-center gap-1.5 py-1 px-2.5 text-sm">
                                                    {index + 1}. {extension}
                                                </p>
                                            ))}
                                        </>
                                    ) : null
                                }
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                     {/* project.json display section */}
                    {projectJsonContent && (
                        <>
                             <Separator />
                            <Accordion type="single" collapsible className="w-full"> {/* Default to collapsed */}
                                 <AccordionItem value="project-json-content" className="border-b-0">
                                    {/* Modified AccordionTrigger container */}
                                    <div className="flex justify-between items-center w-full py-4">
                                        {/* Accordion Trigger on the left */}
                                        <AccordionTrigger className="flex-1 text-lg font-medium hover:no-underline text-left flex items-center gap-2 p-0">
                                             <ListTree className="h-5 w-5 text-primary" /> Project.json Content
                                        </AccordionTrigger>
                                    </div>
                                    <AccordionContent className="pt-2 pb-4 px-1 space-y-4">
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

                    {/* generated tutorial JSON display section */}
                    {tutorialState.data.llmAnalysis && (
                        <>
                             {/* <Separator /> */}
                            <Accordion type="single" collapsible className="w-full"> {/* Default to collapsed */}
                                 <AccordionItem value="generated-tutorial-json" className="border-b-0">
                                    {/* Modified AccordionTrigger container */}
                                    <div className="flex justify-between items-center w-full py-4">
                                        {/* Accordion Trigger on the left */}
                                        <AccordionTrigger className="flex-1 text-lg font-medium hover:no-underline text-left flex items-center gap-2 p-0">
                                             <ListTree className="h-5 w-5 text-primary" /> Generated Tutorial JSON
                                        </AccordionTrigger>
                                    </div>
                                    <AccordionContent className="pt-2 pb-4 px-1 space-y-4">
                                    <ScrollArea className="h-72 w-full rounded-md border bg-muted/50 p-4">
                                            <pre className="text-sm whitespace-pre-wrap break-words">
                                                {JSON.stringify(tutorialState.data.llmAnalysis, null, 2)}
                                            </pre>
                                        </ScrollArea>
                                        
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </>
                    )}

                    {/* Assets Section - Collapsible */}
                    {hasAssets && (
                         <>
                            {/* <Separator /> */}
                             <Accordion type="single" collapsible className="w-full"> {/* Default to collapsed */}
                                 <AccordionItem value="project-assets-list" className="border-b-0">
                                    {/* Modified AccordionTrigger container */}
                                    <div className="flex justify-between items-center w-full py-4">
                                        {/* Accordion Trigger on the left */}
                                        <AccordionTrigger className="flex-1 text-lg font-medium hover:no-underline text-left flex items-center gap-2 p-0">
                                             <ListTree className="h-5 w-5 text-primary" /> Project Assets ({assets.length})
                                        </AccordionTrigger>
                                        {/* Download All button on the right */}
                                        <Button
                                            variant="outline" // Changed to outline to differentiate
                                            size="sm"
                                            onClick={handleDownloadAllAssets}
                                            disabled={!uploadedFile || isDownloadingAll || isDownloadingSingle !== null}
                                            title="Download All Assets (.zip)"
                                            className="ml-4 flex-shrink-0" // Added margin-left
                                            aria-label="Download All Assets"
                                        >
                                             {isDownloadingAll ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Package className="mr-2 h-4 w-4" />
                                            )}
                                             Download All Assets (.zip)
                                        </Button>
                                    </div>
                                    <AccordionContent className="pt-2 pb-4 px-1 space-y-4">
                                        {Object.entries(groupedAssetsByExtension).map(([extension, assetList]) => (
                                            <div key={extension} className="mb-4">
                                                <h4 className="text-md font-medium mb-2 flex items-center gap-1.5">
                                                    {assetList[0].type === 'image' ? <ImageIcon className="h-4 w-4"/> : <Music className="h-4 w-4"/>}
                                                    {extension.toUpperCase()} Files ({assetList.length})
                                                </h4>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-[50px]">Preview</TableHead>
                                                            <TableHead className="w-[150px]">Name</TableHead>
                                                            <TableHead>Filename</TableHead>
                                                            <TableHead className="text-right w-[60px]">Download</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {assetList.map((asset) => (
                                                            <TableRow key={asset.md5ext}>
                                                                 <TableCell>
                                                                    <AssetPreviewCell assetInfo={asset} uploadedFile={uploadedFile} />
                                                                </TableCell>
                                                                <TableCell className="font-medium truncate max-w-[150px]" title={asset.name}>{asset.name}</TableCell>
                                                                <TableCell className="text-muted-foreground truncate max-w-[200px]" title={asset.md5ext}>{asset.md5ext}</TableCell>
                                                                <TableCell className="text-right">
                                                                     <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleDownloadSingleAsset(asset.md5ext, asset.name)}
                                                                        disabled={!uploadedFile || isDownloadingSingle === asset.md5ext || isDownloadingAll}
                                                                        title={`Download ${asset.name}`}
                                                                        className="h-8 w-8"
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
                                            </div>
                                        ))}
                                        {/* Add Download All Assets button at the end */}
                                        <div className="mt-4 flex justify-end">
                                            <Button
                                                onClick={() => handleDownloadAllAssets()} // No event needed here
                                                disabled={!uploadedFile || isDownloadingAll || isDownloadingSingle !== null}
                                                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
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
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                         </>
                    )}


                    

                </CardContent>
                 {/* <CardFooter className="flex justify-between items-center">
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
                     <div></div>
                </CardFooter> */}
            </Card>
            </>
        );
    }

    // If status is idle or somehow falls through, render nothing
    return null;
}
