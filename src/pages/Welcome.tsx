import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-calm flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-8">
            Clarity
          </h1>
        </div>

        <Button 
          size="lg" 
          onClick={() => navigate('/dashboard')}
          className="shine-button bg-gradient-focus hover:bg-gradient-focus/90 hover:shadow-glow hover:scale-105 transform transition-all duration-300 text-lg py-6 px-12"
        >
          <Plus className="w-5 h-5 mr-2" />
          Start Here!
        </Button>
      </div>
    </div>
  );
}