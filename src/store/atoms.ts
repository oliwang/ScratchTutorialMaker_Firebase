import { atom } from 'jotai';
import type { GenerateTutorialStepsOutput } from '@/ai/flows/generate-tutorial-steps';

interface TutorialData {
    projectName: string;
    projectDescription: string;
    resources: string[];
    tutorialSteps: GenerateTutorialStepsOutput['tutorialSteps'];
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
