import {genkit} from 'genkit';
// import {googleAI} from '@genkit-ai/googleai'; // Removed

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    // googleAI({ // Removed
    //   apiKey: process.env.GOOGLE_GENAI_API_KEY,
    // }),
  ],
  // Setting a default model might cause issues if no model plugins are loaded.
  // Consider removing this or conditionally setting it based on loaded plugins.
  // model: 'googleai/gemini-2.0-flash',
});
