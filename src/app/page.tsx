"use client"; // Add this directive because we are using hooks (useAtom)

import { useAtom } from "jotai";
import { Header } from "@/components/layout/header";
import { ImportForm } from "@/components/scratch-guide/import-form";
import { Card, CardContent } from "@/components/ui/card";
import { tutorialDataAtom } from "@/store/atoms"; // Import the atom
import { TutorialDisplay } from "@/components/scratch-guide/tutorial-display";
export default function Home() {
  const [tutorialState] = useAtom(tutorialDataAtom); // Read the atom state

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardContent className="p-6">
            <ImportForm />
          </CardContent>
        </Card>
        
        {/* Show combined analysis when project is loaded */}
        {tutorialState.status !== 'idle' && (
          <Card>
            <CardContent className="p-6">
              <TutorialDisplay />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
