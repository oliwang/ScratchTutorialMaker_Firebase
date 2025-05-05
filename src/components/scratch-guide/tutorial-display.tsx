
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
import { AlertCircle, FileText, Image as ImageIcon, Music, DownloadCloud, BookOpen, Loader2, FileJson, Package, Download, Eye, ListTree, X as XIcon } from "lucide-react"; // Added Package, Download, Eye, ListTree, XIcon
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import Image from 'next/image';
import * as React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import JSZip from "jszip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"; // Import Dialog components

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

// Asset Preview Component
interface AssetPreviewProps {
    assetInfo: AssetInfo | null;
    uploadedFile: File | null;
    onClose: () => void;
}

function AssetPreview({ assetInfo, uploadedFile, onClose }: AssetPreviewProps) {
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        let objectUrl: string | null = null;

        const loadPreview = async () => {
            if (!assetInfo || !uploadedFile) return;

            setIsLoading(true);
            setError(null);
            setPreviewUrl(null); // Clear previous preview

            try {
                const zip = await JSZip.loadAsync(uploadedFile);
                const assetFile = zip.file(assetInfo.md5ext);
                if (!assetFile) {
                    throw new Error(`Asset ${assetInfo.md5ext} not found in project.`);
                }

                const blob = await assetFile.async('blob');
                objectUrl = URL.createObjectURL(blob);
                setPreviewUrl(objectUrl);

            } catch (err) {
                console.error("Error loading asset preview:", err);
                const message = err instanceof Error ? err.message : "Failed to load preview.";
                setError(message);
                toast({ title: "Preview Error", description: message, variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        loadPreview();

        // Cleanup function to revoke the object URL
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                // console.log("Revoked preview URL:", objectUrl); // For debugging
            }
        };
    }, [assetInfo, uploadedFile, toast]); // Rerun when asset or file changes

    if (!assetInfo) return null; // Should not happen if Dialog is controlled properly

    return (
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Preview: {assetInfo.name}</DialogTitle>
                 {/* Close button provided by DialogContent */}
            </DialogHeader>
            <div className="flex-grow overflow-auto p-4 flex items-center justify-center bg-muted/30 rounded">
                {isLoading && (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span>Loading preview...</span>
                    </div>
                )}
                {error && (
                    <div className="text-destructive text-center">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                        <p>Error loading preview:</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                {previewUrl && !isLoading && !error && (
                    <>
                        {assetInfo.type === 'image' && (
                            <Image
                                src={previewUrl}
                                alt={`Preview of ${assetInfo.name}`}
                                width={500} // Adjust as needed, consider container size
                                height={400} // Adjust as needed
                                style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
                                unoptimized // Necessary for blob URLs
                            />
                        )}
                        {assetInfo.type === 'sound' && (
                            <audio controls src={previewUrl} className="w-full">
                                Your browser does not support the audio element.
                            </audio>
                        )}
                    </>
                )}
            </div>
             {/* DialogClose is implicitly handled by the 'X' button in DialogContent */}
        </DialogContent>
    );
}


export function TutorialDisplay() {
    const [tutorialState] = useAtom(tutorialDataAtom);
    const [uploadedFile] = useAtom(uploadedFileAtom);
    const { toast } = useToast();
    const [isExporting, setIsExporting] = React.useState(false);
    const [isDownloadingAll, setIsDownloadingAll] = React.useState(false);
    const [isDownloadingSingle, setIsDownloadingSingle] = React.useState<string | null>(null);
    const [previewAsset, setPreviewAsset] = React.useState<AssetInfo | null>(null); // State for asset preview dialog
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false); // State to control Dialog visibility

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

     const handlePreviewAsset = (asset: AssetInfo) => {
        setPreviewAsset(asset);
        setIsPreviewOpen(true); // Open the dialog
    };

    const handleClosePreview = () => {
        setIsPreviewOpen(false);
        // Delay clearing the asset slightly to allow fade-out animation if needed
        setTimeout(() => setPreviewAsset(null), 300);
    };

    // Group assets by type
    const groupedAssets = React.useMemo(() => {
        if (tutorialState.status !== 'success' || !tutorialState.data?.assets) {
            return { image: [], sound: [] };
        }
        return tutorialState.data.assets.reduce((acc, asset) => {
            if (!acc[asset.type]) {
                acc[asset.type] = [];
            }
            acc[asset.type].push(asset);
            return acc;
        }, { image: [] as AssetInfo[], sound: [] as AssetInfo[] });
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
                             <Accordion type="single" collapsible className="w-full">
                                 <AccordionItem value="project-assets" className="border-b-0">
                                    <AccordionTrigger className="text-lg font-medium hover:no-underline py-4 text-left flex items-center gap-2">
                                         <ListTree className="h-5 w-5 text-primary" /> Project Assets ({assets.length})
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-4 px-1 space-y-4">
                                        {/* Image Assets Table */}
                                         {groupedAssets.image.length > 0 && (
                                             <div className="mb-4">
                                                <h4 className="text-md font-medium mb-2 flex items-center gap-1.5"><ImageIcon className="h-4 w-4"/> Images ({groupedAssets.image.length})</h4>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-[120px]">Name</TableHead>
                                                            <TableHead>Filename</TableHead>
                                                            <TableHead className="text-right w-[100px]">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {groupedAssets.image.map((asset) => (
                                                            <TableRow key={asset.md5ext}>
                                                                <TableCell className="font-medium truncate max-w-[100px]" title={asset.name}>{asset.name}</TableCell>
                                                                <TableCell className="text-muted-foreground truncate max-w-[150px]" title={asset.md5ext}>{asset.md5ext}</TableCell>
                                                                <TableCell className="text-right space-x-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon" // Changed to icon
                                                                        onClick={() => handlePreviewAsset(asset)}
                                                                        disabled={!uploadedFile}
                                                                        title={`Preview ${asset.name}`}
                                                                        className="h-8 w-8" // Adjust size if needed
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon" // Changed to icon
                                                                        onClick={() => handleDownloadSingleAsset(asset.md5ext, asset.name)}
                                                                        disabled={!uploadedFile || isDownloadingSingle === asset.md5ext || isDownloadingAll}
                                                                        title={`Download ${asset.name}`}
                                                                        className="h-8 w-8" // Adjust size if needed
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
                                         )}

                                         {/* Sound Assets Table */}
                                         {groupedAssets.sound.length > 0 && (
                                             <div className="mb-4">
                                                <h4 className="text-md font-medium mb-2 flex items-center gap-1.5"><Music className="h-4 w-4"/> Sounds ({groupedAssets.sound.length})</h4>
                                                <Table>
                                                     <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-[120px]">Name</TableHead>
                                                            <TableHead>Filename</TableHead>
                                                            <TableHead className="text-right w-[100px]">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {groupedAssets.sound.map((asset) => (
                                                            <TableRow key={asset.md5ext}>
                                                                <TableCell className="font-medium truncate max-w-[100px]" title={asset.name}>{asset.name}</TableCell>
                                                                <TableCell className="text-muted-foreground truncate max-w-[150px]" title={asset.md5ext}>{asset.md5ext}</TableCell>
                                                                 <TableCell className="text-right space-x-1">
                                                                     <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handlePreviewAsset(asset)}
                                                                        disabled={!uploadedFile}
                                                                        title={`Preview ${asset.name}`}
                                                                        className="h-8 w-8"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
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
                                         )}

                                        {/* Download All Button */}
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

             {/* Asset Preview Dialog */}
             <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <AssetPreview
                    assetInfo={previewAsset}
                    uploadedFile={uploadedFile}
                    onClose={handleClosePreview}
                />
            </Dialog>
            </>
        );
    }

    return null;
}
