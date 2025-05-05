'use server';

/**
 * @fileOverview A Scratch project summarization AI agent.
 *
 * - summarizeScratchProject - A function that handles the summarization of a Scratch project.
 * - SummarizeScratchProjectInput - The input type for the summarizeScratchProject function.
 * - SummarizeScratchProjectOutput - The return type for the summarizeScratchProject function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {ScratchProject, getScratchProjectFromUrl} from '@/services/scratch';

const SummarizeScratchProjectInputSchema = z.object({
  scratchProjectUrl: z
    .string()
    .describe('The URL of the Scratch project to summarize.'),
});
export type SummarizeScratchProjectInput = z.infer<
  typeof SummarizeScratchProjectInputSchema
>;

const SummarizeScratchProjectOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the Scratch project.'),
});
export type SummarizeScratchProjectOutput = z.infer<
  typeof SummarizeScratchProjectOutputSchema
>;

export async function summarizeScratchProject(
  input: SummarizeScratchProjectInput
): Promise<SummarizeScratchProjectOutput> {
  return summarizeScratchProjectFlow(input);
}

const summarizeScratchProjectPrompt = ai.definePrompt({
  name: 'summarizeScratchProjectPrompt',
  input: {
    schema: z.object({
      scratchProjectName: z.string().describe('The name of the Scratch project.'),
      scratchProjectDescription: z
        .string()
        .describe('The description of the Scratch project.'),
      scratchProjectResources: z
        .array(z.string())
        .describe('The resources used in the Scratch project.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A concise summary of the Scratch project.'),
    }),
  },
  prompt: `You are an expert educator specializing in summarizing Scratch projects for young learners.

  Given the following information about a Scratch project, provide a concise summary of its overall functionality, suitable for young learners to understand.

  Project Name: {{{scratchProjectName}}}
  Description: {{{scratchProjectDescription}}}
  Resources: {{#each scratchProjectResources}}{{{this}}}, {{/each}}

  Summary:`,
});

const summarizeScratchProjectFlow = ai.defineFlow<
  typeof SummarizeScratchProjectInputSchema,
  typeof SummarizeScratchProjectOutputSchema
>(
  {
    name: 'summarizeScratchProjectFlow',
    inputSchema: SummarizeScratchProjectInputSchema,
    outputSchema: SummarizeScratchProjectOutputSchema,
  },
  async input => {
    const scratchProject: ScratchProject = await getScratchProjectFromUrl(
      input.scratchProjectUrl
    );

    const {output} = await summarizeScratchProjectPrompt({
      scratchProjectName: scratchProject.name,
      scratchProjectDescription: scratchProject.description,
      scratchProjectResources: scratchProject.resources,
    });
    return output!;
  }
);
