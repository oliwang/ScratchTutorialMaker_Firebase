"use client";

import React, { useState } from "react";
import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, BrainCircuit } from "lucide-react";
import { tutorialDataAtom } from "@/store/atoms";
import { useToast } from "@/hooks/use-toast";
import { analyzeScratchProject } from "@/services/ai-service";

export function ScratchAnalyzer() {
  const [tutorialData] = useAtom(tutorialDataAtom);
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Function to analyze the Scratch project using LLM
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
    setAnalysis("");
    
    try {
      // Call our AI service to analyze the project
      const analysisText = await analyzeScratchProject(tutorialData.data.projectJsonContent);
      setAnalysis(analysisText);
      
      toast({
        title: "Analysis Complete",
        description: "Project analysis has been generated",
      });
    } catch (error) {
      console.error("Error analyzing project:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not generate project analysis",
        variant: "destructive",
      });
      setAnalysis("Error analyzing project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6" />
          Scratch Project Analysis
        </CardTitle>
        <CardDescription>
          Analyze your Scratch project using AI to get insights about its structure and complexity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {analysis ? (
          <Textarea 
            className="font-mono h-[500px] overflow-auto whitespace-pre-wrap"
            value={analysis} 
            readOnly 
          />
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            Click the button below to analyze your project with AI.
          </div>
        )}
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
              Analyzing Project...
            </>
          ) : (
            "Analyze Project"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 