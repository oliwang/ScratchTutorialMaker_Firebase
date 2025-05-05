import { atom } from 'jotai';
// import type { GenerateTutorialStepsOutput } from '@/ai/flows/generate-tutorial-steps'; // Removed

// Define the structure locally since the flow file is removed
interface TutorialStepSection {
    functionality: string;
    steps: string[];
}

interface TutorialData {
    projectName: string;
    projectDescription: string;
    resources: string[];
    tutorialSteps: TutorialStepSection[]; // Use locally defined type
    projectJsonContent: string | null; // Add field to store project.json content
}

type TutorialState = {
    status: 'idle' | 'loading' | 'success' | 'error';
    data: TutorialData | null;
    error: string | null;
}

export const tutorialDataAtom = atom<TutorialState>({
    status: 'idle',
    data: null,
    error: null,
});
