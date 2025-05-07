/**
 * Service for interacting with OpenAI's LLM API
 */

import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'your_api_key_here',
  dangerouslyAllowBrowser: true // In production, API calls should go through your backend
});

/**
 * Generate an analysis of a Scratch project using OpenAI
 * @param projectJson The project.json content from a Scratch project
 * @returns A promise that resolves to the analysis text
 */
export async function generateAnalysis(projectJson: string): Promise<string> {
  try {
    // Extract only necessary parts of the project to reduce token usage
    const parsedProject = JSON.parse(projectJson);
    
    // Build a simplified version of the project to reduce tokens
    const simplifiedProject = {
      meta: parsedProject.meta,
      targets: parsedProject.targets?.map((target: any) => ({
        name: target.name,
        isStage: target.isStage,
        // Count blocks instead of including all block data
        blockCount: target.blocks ? Object.keys(target.blocks).length : 0,
        // Include just a sample of blocks to analyze patterns (first 10)
        blockSample: target.blocks ? 
          Object.values(target.blocks)
            .slice(0, 10)
            .map((block: any) => ({ opcode: block.opcode })) : [],
        // Just count variables instead of including all data
        variableCount: target.variables ? Object.keys(target.variables).length : 0,
        // Just count lists instead of including all data
        listCount: target.lists ? Object.keys(target.lists).length : 0,
      })),
      extensions: parsedProject.extensions
    };
    
    const prompt = `
This is a project.json file from a scratch project (.sb3). Create a step by step tutorial for young learners. You should first provide a general description of the project (what it does), and then provide a section of the features and variables, sprites, etc. Then break down the project into bit-size sections, and provide step by step guide on how to build it. At last, provide ideas for extensions of the current questions.

Here's the simplified representation of the Scratch project.json file:

${JSON.stringify(simplifiedProject, null, 2)}

Format your response in markdown with the following structure:
# Project Overview
(General description of what the project does)

# Project Components
- Sprites: (list and describe key sprites)
- Variables: (list and describe variables)
- Key Blocks Used: (list main block types)

# Tutorial Steps
## Section 1: (Feature or component name)
1. Step 1
2. Step 2
...

## Section 2: (Next feature or component)
1. Step 1
2. Step 2
...

# Extension Ideas
- Idea 1
- Idea 2
...

Keep your explanations clear and appropriate for young learners.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",  // Use the appropriate model (gpt-4o, gpt-3.5-turbo, etc.)
      messages: [
        { role: "system", content: "You are an expert Scratch educator who specializes in analyzing Scratch projects and creating educational content." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    // Return the generated content
    return response.choices[0].message.content || "No analysis generated.";
  } catch (error) {
    console.error("Error in OpenAI analysis:", error);
    throw new Error("Failed to generate analysis with OpenAI");
  }
}

/**
 * Generate tutorial steps for a Scratch project
 * @param projectJson The project.json content from a Scratch project 
 * @returns A promise that resolves to the tutorial steps as markdown text
 */
export async function generateTutorialSteps(projectJson: string): Promise<string> {
  try {
    // For now, this is handled by the same function as the analysis
    // The analysis already includes tutorial steps
    return await generateAnalysis(projectJson);
  } catch (error) {
    console.error("Error generating tutorial steps:", error);
    throw new Error("Failed to generate tutorial steps");
  }
} 