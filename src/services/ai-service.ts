/**
 * Service for interacting with OpenAI to analyze Scratch projects
 */

import { generateAnalysis } from './llm-provider';

/**
 * Analyze a Scratch project using OpenAI
 * @param projectJson The project.json content from a Scratch project
 * @returns A promise that resolves to the analysis text
 */
export async function analyzeScratchProject(projectJson: string): Promise<string> {
  // We now directly use the OpenAI provider
  try {
    return await generateAnalysis(projectJson);
  } catch (error) {
    console.error("Error using OpenAI provider:", error);
    throw new Error("Failed to analyze Scratch project with OpenAI. Please check your API key.");
  }
} 