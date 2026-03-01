import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Clock, Sparkles, ArrowRight } from "lucide-react";

interface OnboardingOverlayProps {
  onComplete: () => void;
  onLoadSampleData: () => void;
}

const steps = [
  {
    icon: BookOpen,
    title: "Welcome to Clarity",
    description: "Your intelligent study scheduler that creates optimized study plans based on your availability and priorities.",
  },
  {
    icon: Calendar,
    title: "Add Your Tasks",
    description: "Click 'Create' to add assignments with due dates, difficulty, and estimated time. Clarity will schedule them for you.",
  },
  {
    icon: Clock,
    title: "Set Your Availability",
    description: "Open Settings to define when you're free to study. Use natural language like '9 to 5' or '2pm-6pm'.",
  },
  {
    icon: Sparkles,
    title: "Get Your Smart Schedule",
    description: "Clarity automatically generates an optimized study plan considering priorities, difficulty, and your energy levels.",
  },
];

export function OnboardingOverlay({ onComplete, onLoadSampleData }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);

  const isLast = step === steps.length - 1;
  const StepIcon = steps[step].icon;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? "bg-primary w-6" : i < step ? "bg-primary/50" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <StepIcon className="w-8 h-8 text-primary" />
        </div>

        <h2 className="text-2xl font-medium text-foreground">{steps[step].title}</h2>
        <p className="text-muted-foreground leading-relaxed">{steps[step].description}</p>

        <div className="flex flex-col gap-3 pt-2">
          {isLast ? (
            <>
              <Button onClick={onComplete} className="w-full gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => { onLoadSampleData(); onComplete(); }} className="w-full text-sm">
                Load sample data to explore
              </Button>
            </>
          ) : (
            <Button onClick={() => setStep(step + 1)} className="w-full gap-2">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          <button
            onClick={onComplete}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
