import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-calm flex items-center justify-center relative">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-16">
          Clarity
        </h1>
        
        <Button 
          size="lg" 
          onClick={() => navigate('/dashboard')}
          className="bg-gradient-focus hover:brightness-125 hover:shadow-glow hover:scale-110 hover:-translate-y-1 transform transition-all duration-500 ease-spring text-6xl py-12 px-24"
        >
          Start Here
        </Button>
      </div>
    </div>
  );
}