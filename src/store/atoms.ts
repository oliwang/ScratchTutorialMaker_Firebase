import { atom } from 'jotai';
// import type { GenerateTutorialStepsOutput } from '@/ai/flows/generate-tutorial-steps'; // Removed

// Define the structure locally since the flow file is removed
interface TutorialStepSection {
    functionality: string;
    steps: string[];
}

export interface AssetInfo {
    name: string;        // User-visible name (e.g., "costume1", "meow")
    md5ext: string;      // Actual filename in the zip (e.g., "b7853f557e443df6765ba2e539f40422.svg")
    dataFormat: string;  // File extension (e.g., "svg", "wav")
    type: 'image' | 'sound'; // Type of asset
}


interface TutorialData {
    projectName: string;
    projectDescription: string;
    resources: string[]; // Keep original resources if needed, maybe rename?
    tutorialSteps: TutorialStepSection[]; // Use locally defined type
    projectJsonContent: string | null; // Add field to store project.json content
    assets: AssetInfo[]; // Add field for extracted assets
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


// Atom to store the uploaded .sb3 file object
export const uploadedFileAtom = atom<File | null>(null);
