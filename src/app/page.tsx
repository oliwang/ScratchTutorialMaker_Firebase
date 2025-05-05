import { Header } from "@/components/layout/header";
import { ImportForm } from "@/components/scratch-guide/import-form";
import { TutorialDisplay } from "@/components/scratch-guide/tutorial-display";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardContent className="p-6">
            <ImportForm />
          </CardContent>
        </Card>
        <TutorialDisplay />
      </main>
    </div>
  );
}
