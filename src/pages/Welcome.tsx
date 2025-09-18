import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-primary/5 flex items-center justify-center relative overflow-hidden">
      {/* Subtle geometric background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-blue-200/20 rounded-full blur-2xl"></div>
      </div>
      
      <div className="relative z-10 text-center">
        <div className="mb-20">
          <h1 className="text-8xl font-dm-serif text-primary tracking-tight mb-4">
            Clarity
          </h1>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto"></div>
        </div>

        <Button 
          size="lg" 
          onClick={() => navigate('/dashboard')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 ease-out text-xl py-8 px-16 rounded-full border-0"
        >
          Start
        </Button>
      </div>
    </div>
  );
}