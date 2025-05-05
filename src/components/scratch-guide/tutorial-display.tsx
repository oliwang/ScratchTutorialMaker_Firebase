
"use client";

import { useAtom } from "jotai";
import { tutorialDataAtom, uploadedFileAtom, AssetInfo } from "@/store/atoms"; // Import AssetInfo
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

    content += `Tutorial Steps:\n\n`;
     (data.tutorialSteps ?? []).forEach((section, index) => {
        content += `Section ${index + 1}: ${section.functionality}\n`;
        section.steps.forEach((step, stepIndex) => {
            content += `  Step ${stepIndex + 1}: ${step}\n`;
        });
        content += '\n';
    });


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

            // Skip blob loading for SVG, we'll show an icon directly
            if (assetInfo.dataFormat === 'svg') {
                setPreviewUrl(null); // Ensure no previous image tries to render
                setIsLoading(false);
                setError(null);
                return;
            }

            setIsLoading(true);
            setError(null);
            setPreviewUrl(null); // Reset preview while loading

            try {
                const zip = await JSZip.loadAsync(uploadedFile);
                const assetFile = zip.file(assetInfo.md5ext);
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


    // Specific handling for SVG: show an icon
    if (assetInfo.dataFormat === 'svg') {
        return (
            <div className="flex items-center justify-center h-10 w-10 rounded bg-muted/50" title={`SVG: ${assetInfo.name}`}>
                 {/* Using a simple inline SVG icon as placeholder */}
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="15" r="2"/><path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22"/></svg>
            </div>
        );
    }

    if (isLoading) {
        return <Skeleton className="h-10 w-10 rounded" />;
    }

    if (error) {
         return <div className="flex items-center justify-center h-10 w-10 rounded bg-muted/50" title={`Error: ${error}`}>
            <TriangleAlert className="h-5 w-5 text-destructive" />
         </div>;
    }

    if (previewUrl) {
        if (assetInfo.type === 'image') {
             // Use Next Image for non-SVG images
            return (
                <Image
                    src={previewUrl}
                    alt={`Preview of ${assetInfo.name}`}
                    width={40} // Small thumbnail size
                    height={40}
                    style={{ objectFit: 'contain', borderRadius: '4px' }}
                    unoptimized // Necessary for blob URLs
                    className="border bg-white" // Added white background for transparency
                />
            );
        }
        if (assetInfo.type === 'sound') {
             // Render a compact audio player
            return (
                <audio controls src={previewUrl} style={{ maxWidth: '100px', height: '30px' }} className="rounded">
                    {/* Fallback text */}
                    Your browser does not support the audio element.
                    <a href={previewUrl} download={assetInfo.name}>Download</a>
                </audio>
            );
        }
    }

     // Fallback or if asset type is unknown or previewUrl is null (and not SVG)
    return <div className="flex items-center justify-center h-10 w-10 rounded bg-muted/50">
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
        const { projectName, projectDescription, resources, tutorialSteps, projectJsonContent, assets } = tutorialState.data;
        const hasAssets = assets && assets.length > 0;

        return (
            <>
            <Card className="bg-card border border-border shadow-lg transition-all duration-300 ease-in-out animate-in fade-in-50">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-primary">{projectName}</CardTitle>
                    <CardDescription className="text-base">{projectDescription}</CardDescription>
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

                     {/* Assets Section - Collapsible */}
                     {hasAssets && (
                         <>
                            <Separator />
                             <Accordion type="single" collapsible className="w-full" defaultValue={undefined}> {/* Default to collapsed */}
                                 <AccordionItem value="project-assets" className="border-b-0">
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
                 <CardFooter className="flex justify-between items-center">
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
                </CardFooter>
            </Card>
            </>
        );
    }

    // If status is idle or somehow falls through, render nothing
    return null;
}
