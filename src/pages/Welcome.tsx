import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-primary/5 flex items-center justify-center relative overflow-hidden">
      {/* Corner design elements */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/10"></div>
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-primary/10"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-primary/10"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/10"></div>
      
      {/* Subtle geometric background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-blue-200/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="relative z-10 text-center animate-bounce-in">
        <div className="mb-24">
          <h1 className="text-8xl font-dm-serif text-primary tracking-tight mb-6 animate-float">
            Clarity
          </h1>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto"></div>
        </div>

        <Button 
          size="lg" 
          onClick={() => navigate('/dashboard')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 ease-out text-xl py-8 px-16 rounded-full border-0 group"
        >
          <span className="group-hover:tracking-wider transition-all duration-300">Start</span>
        </Button>
        
        {/* Subtle breathing dot indicator */}
        <div className="mt-16 flex justify-center">
          <div className="w-2 h-2 bg-primary/40 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}