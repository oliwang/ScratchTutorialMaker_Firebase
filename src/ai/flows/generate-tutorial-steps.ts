// 'use server'; // Keep directive if file is imported by server components

/**
 * @fileOverview Generates tutorial steps for a Scratch project. (DISABLED)
 *
 * - generateTutorialSteps - A function that generates tutorial steps for a Scratch project. (DISABLED)
 * - GenerateTutorialStepsInput - The input type for the generateTutorialSteps function.
 * - GenerateTutorialStepsOutput - The return type for the generateTutorialSteps function.
 */

// import {ai} from '@/ai/ai-instance';
// import {ScratchProject} from '@/services/scratch';
import {z} from 'genkit';

const GenerateTutorialStepsInputSchema = z.object({
  scratchProject: z.object({
    name: z.string().describe('The name of the Scratch project.'),
    description: z.string().describe('The description of the Scratch project.'),
    resources: z.array(z.string()).describe('The resources of the Scratch project.'),
  }).describe('The Scratch project to generate tutorial steps for.'),
});
export type GenerateTutorialStepsInput = z.infer<typeof GenerateTutorialStepsInputSchema>;

const GenerateTutorialStepsOutputSchema = z.object({
  tutorialSteps: z.array(z.object({
    functionality: z.string().describe('The functionality of the step.'),
    steps: z.array(z.string()).describe('The individual steps to achieve the functionality.'),
  })).describe('The step by step tutorial, grouped by functionality.'),
});
export type GenerateTutorialStepsOutput = z.infer<typeof GenerateTutorialStepsOutputSchema>;

export async function generateTutorialSteps(input: GenerateTutorialStepsInput): Promise<GenerateTutorialStepsOutput> {
  // return generateTutorialStepsFlow(input); // Disabled
  console.warn("generateTutorialSteps called, but AI functionality is disabled.");
  // Return mock/empty data or throw an error
  return {
    tutorialSteps: [
       { functionality: "AI Disabled", steps: ["Genkit dependencies have been removed.", "Tutorial generation is currently unavailable."] }
    ]
  };
}

/*
const prompt = ai.definePrompt({
  name: 'generateTutorialStepsPrompt',
  input: {
    schema: z.object({
      scratchProject: z.object({
        name: z.string().describe('The name of the Scratch project.'),
        description: z.string().describe('The description of the Scratch project.'),
        resources: z.array(z.string()).describe('The resources of the Scratch project.'),
      }).describe('The Scratch project to generate tutorial steps for.'),
    }),
  },
  output: {
    schema: z.object({
      tutorialSteps: z.array(z.object({
        functionality: z.string().describe('The functionality of the step.'),
        steps: z.array(z.string()).describe('The individual steps to achieve the functionality.'),
      })).describe('The step by step tutorial, grouped by functionality.'),
    }),
  },
  prompt: `You are an expert in creating tutorials for Scratch projects, especially for young learners. Break down the Scratch project into a sequence of understandable steps, grouped by functionality. Explain each step clearly, using language suitable for young learners.

Scratch Project Name: {{{scratchProject.name}}}
Scratch Project Description: {{{scratchProject.description}}}
Scratch Project Resources: {{#each scratchProject.resources}}{{{this}}}, {{/each}}

Generate a step-by-step tutorial, grouped by functionality, with explanations tailored for young learners.

{{#each tutorialSteps}}
  Functionality: {{{functionality}}}
  Steps:
  {{#each steps}}
    - {{{this}}}
  {{/each}}
{{/each}}
`,
});

const generateTutorialStepsFlow = ai.defineFlow<
  typeof GenerateTutorialStepsInputSchema,
  typeof GenerateTutorialStepsOutputSchema
>({
  name: 'generateTutorialStepsFlow',
  inputSchema: GenerateTutorialStepsInputSchema,
  outputSchema: GenerateTutorialStepsOutputSchema,
}, async input => {
  const {output} = await prompt({
    scratchProject: input.scratchProject,
  });
  return output!;
});
*/
