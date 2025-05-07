"use client";

import { useAtom } from "jotai";
import { tutorialDataAtom } from "@/store/atoms";
import { TutorialDisplay } from "./tutorial-display";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { InfoIcon, LightbulbIcon } from "lucide-react";
import { markdownToHtml } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ExtendedTutorialDisplay() {
    const [tutorialState] = useAtom(tutorialDataAtom);
    
    // If not in success state, just return the regular TutorialDisplay
    if (tutorialState.status !== 'success' || !tutorialState.data) {
        return <TutorialDisplay />;
    }
    
    const { llmAnalysis } = tutorialState.data;
    
    // If there's no LLM analysis, just return the regular TutorialDisplay
    if (!llmAnalysis) {
        return <TutorialDisplay />;
    }
    
    // Extract Project Overview section
    const overviewMatch = llmAnalysis.match(/# Project Overview([\s\S]*?)(?=# Project Components|# Tutorial Steps|$)/i);
    const overviewContent = overviewMatch ? overviewMatch[1].trim() : "";
    
    // Extract Extension Ideas section
    const extensionsMatch = llmAnalysis.match(/# Extension Ideas([\s\S]*?)(?=$)/i);
    const extensionsContent = extensionsMatch ? extensionsMatch[1].trim() : "";
    
    // Extract Project Components section
    const componentsMatch = llmAnalysis.match(/# Project Components([\s\S]*?)(?=# Tutorial Steps|$)/i);
    const componentsContent = componentsMatch ? componentsMatch[1].trim() : "";
    
    return (
        <>
            {/* Project Overview Section */}
            {overviewContent && (
                <Card className="mb-6 border border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl font-medium flex items-center">
                            <InfoIcon className="h-5 w-5 mr-2 text-primary" />
                            Project Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="prose dark:prose-invert prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: markdownToHtml(overviewContent) }}
                        />
                    </CardContent>
                </Card>
            )}
            
            {/* Project Components Section */}
            {componentsContent && (
                <Card className="mb-6 border border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl font-medium flex items-center">
                            <InfoIcon className="h-5 w-5 mr-2 text-primary" />
                            Project Components
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="prose dark:prose-invert prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: markdownToHtml(componentsContent) }}
                        />
                    </CardContent>
                </Card>
            )}
            
            {/* Regular Tutorial Display */}
            <TutorialDisplay />
            
            {/* Extension Ideas Section */}
            {extensionsContent && (
                <Card className="mt-6 border border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl font-medium flex items-center">
                            <LightbulbIcon className="h-5 w-5 mr-2 text-primary" />
                            Extension Ideas
                        </CardTitle>
                        <CardDescription>
                            Try these ideas to extend and enhance your project.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="prose dark:prose-invert prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: markdownToHtml(extensionsContent) }}
                        />
                    </CardContent>
                </Card>
            )}
        </>
    );
} 