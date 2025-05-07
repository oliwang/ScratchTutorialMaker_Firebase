"use client";

import React, { useState } from "react";
import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, BrainCircuit } from "lucide-react";
import { tutorialDataAtom } from "@/store/atoms";
import { useToast } from "@/hooks/use-toast";
import { generateAnalysis } from "@/services/llm-provider";
import { ExtendedTutorialDisplay } from "./extended-tutorial-display";

export function CombinedAnalysis() {
  const [tutorialData, setTutorialData] = useAtom(tutorialDataAtom);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Function to analyze the Scratch project and generate tutorial steps using LLM
  const analyzeProject = async () => {
    if (!tutorialData.data?.projectJsonContent) {
      toast({
        title: "Error",
        description: "No project data available to analyze.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Call our LLM service to analyze the project and generate tutorial steps
      const result = await generateAnalysis(tutorialData.data.projectJsonContent);
      
      // Parse the markdown content to extract tutorial steps sections
      const tutorialSections = parseTutorialSections(result);
      
      // Update tutorial data with the generated content
      setTutorialData({
        ...tutorialData,
        data: {
          ...tutorialData.data,
          // Update the tutorial steps with the parsed sections
          tutorialSteps: tutorialSections,
          // Store the full analysis for reference
          llmAnalysis: result,
        }
      });
      
      toast({
        title: "Analysis Complete",
        description: "Project analysis and tutorial steps have been generated",
      });
    } catch (error) {
      console.error("Error analyzing project:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not generate project analysis and tutorial steps",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Parse the markdown content to extract tutorial sections
  const parseTutorialSections = (markdown: string) => {
    // Try to find the "Tutorial Steps" section
    const tutorialMatch = markdown.match(/# Tutorial Steps([\s\S]*?)(?=# Extension Ideas|$)/i);
    
    if (!tutorialMatch) {
      // If no tutorial section found, return empty array
      return [];
    }
    
    const tutorialContent = tutorialMatch[1];
    
    // Find all section headers (## Section X:)
    const sectionRegex = /## ([^\n]+)/g;
    const sections: { functionality: string; steps: string[] }[] = [];
    let sectionMatch;
    let lastIndex = 0;
    
    while ((sectionMatch = sectionRegex.exec(tutorialContent)) !== null) {
      // Save the section name
      const sectionTitle = sectionMatch[1].trim();
      const sectionStartIndex = sectionMatch.index + sectionMatch[0].length;
      
      // Add the last section if this isn't the first match
      if (sections.length > 0) {
        const prevSection = sections[sections.length - 1];
        const sectionContent = tutorialContent.slice(lastIndex, sectionMatch.index).trim();
        
        // Extract numbered steps from the section content
        const steps = extractSteps(sectionContent);
        prevSection.steps = steps;
      }
      
      // Add this section
      sections.push({
        functionality: sectionTitle,
        steps: [] // Will be populated in the next iteration or at the end
      });
      
      lastIndex = sectionStartIndex;
    }
    
    // Handle the last section
    if (sections.length > 0) {
      const lastSection = sections[sections.length - 1];
      const sectionContent = tutorialContent.slice(lastIndex).trim();
      
      // Extract numbered steps from the section content
      const steps = extractSteps(sectionContent);
      lastSection.steps = steps;
    }
    
    return sections;
  };
  
  // Extract numbered steps from section content
  const extractSteps = (content: string) => {
    const steps: string[] = [];
    
    // Look for numbered list items (1. Step description)
    const stepLines = content.split('\n');
    
    for (const line of stepLines) {
      const trimmedLine = line.trim();
      // Match lines that start with a number followed by period and space
      const match = trimmedLine.match(/^\d+\.\s*(.+)$/);
      
      if (match) {
        steps.push(match[1]);
      }
    }
    
    return steps;
  };

  // Status display based on current state
  const renderStatusMessage = () => {
    if (tutorialData.status === "loading") {
      return (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <AlertTitle>Processing Project</AlertTitle>
          <AlertDescription>
            Please wait while we process your Scratch project...
          </AlertDescription>
        </Alert>
      );
    }
    
    if (tutorialData.status === "error") {
      return (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {tutorialData.error || "An unknown error occurred."}
          </AlertDescription>
        </Alert>
      );
    }
    
    if (tutorialData.status !== "success" || !tutorialData.data) {
      return (
        <Alert>
          <AlertTitle>No project loaded</AlertTitle>
          <AlertDescription>
            Please upload a Scratch project (.sb3 file) first to analyze it.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  // If we're in a non-success state, show appropriate message
  if (tutorialData.status !== "success") {
    return renderStatusMessage();
  }

  // If tutorial steps don't exist or are empty, show the generate button
  if (!tutorialData.data?.tutorialSteps || tutorialData.data.tutorialSteps.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6" />
            Generate Tutorial
          </CardTitle>
          <CardDescription>
            {tutorialData.data?.projectName && (
              <span className="font-semibold">Project: {tutorialData.data.projectName}</span>
            )}
            <p className="mt-1">
              Generate a detailed step-by-step tutorial for this Scratch project using AI.
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-muted-foreground">
            Click the button below to analyze your project and generate tutorial steps with AI.
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={analyzeProject} 
            disabled={loading}
            className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Tutorial...
              </>
            ) : (
              "Generate Tutorial"
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // If tutorial steps exist, render the ExtendedTutorialDisplay component
  return <ExtendedTutorialDisplay />;
} 