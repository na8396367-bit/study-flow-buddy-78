import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 flex items-center justify-center relative overflow-hidden">
      {/* Rich background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/30 via-sky-200/20 to-cyan-200/30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-100/30 via-transparent to-transparent"></div>
      </div>

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-200/40 to-sky-300/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-32 w-96 h-96 bg-gradient-to-br from-sky-200/35 to-blue-300/25 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-40 w-80 h-80 bg-gradient-to-br from-cyan-200/30 to-sky-200/35 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-gradient-to-br from-blue-300/40 to-cyan-200/30 rounded-full blur-2xl animate-float" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-48 h-48">
        <div className="w-full h-full border-l-2 border-t-2 border-blue-200/50 relative">
          <div className="absolute top-4 left-4 w-8 h-8 bg-gradient-to-br from-blue-300/70 to-sky-400/50 rounded-full animate-float"></div>
          <div className="absolute top-8 left-12 w-4 h-4 bg-cyan-300/60 rounded-full animate-float" style={{ animationDelay: '0.3s' }}></div>
        </div>
      </div>
      
      <div className="absolute top-0 right-0 w-48 h-48">
        <div className="w-full h-full border-r-2 border-t-2 border-sky-200/50 relative">
          <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-sky-300/70 to-cyan-300/50 rounded-full animate-float" style={{ animationDelay: '0.7s' }}></div>
          <div className="absolute top-8 right-12 w-4 h-4 bg-blue-300/60 rounded-full animate-float" style={{ animationDelay: '1.1s' }}></div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-48 h-48">
        <div className="w-full h-full border-l-2 border-b-2 border-cyan-200/50 relative">
          <div className="absolute bottom-4 left-4 w-8 h-8 bg-gradient-to-br from-cyan-300/70 to-blue-300/50 rounded-full animate-float" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute bottom-8 left-12 w-4 h-4 bg-sky-300/60 rounded-full animate-float" style={{ animationDelay: '0.8s' }}></div>
        </div>
      </div>
      
      <div className="absolute bottom-0 right-0 w-48 h-48">
        <div className="w-full h-full border-r-2 border-b-2 border-sky-200/50 relative">
          <div className="absolute bottom-4 right-4 w-8 h-8 bg-gradient-to-br from-sky-300/70 to-cyan-300/50 rounded-full animate-float" style={{ animationDelay: '0.2s' }}></div>
          <div className="absolute bottom-8 right-12 w-4 h-4 bg-blue-300/60 rounded-full animate-float" style={{ animationDelay: '1.3s' }}></div>
        </div>
      </div>

      {/* Central content with rich backdrop */}
      <div className="relative z-10 text-center">
        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-3xl -m-20"></div>
        <div className="relative z-10 p-20">
          <div className="mb-16">
            <div className="inline-block relative">
              <h1 className="text-9xl font-dm-serif bg-gradient-to-br from-slate-700 via-blue-800 to-cyan-700 bg-clip-text text-transparent tracking-tight mb-6 animate-float relative z-10 font-medium">
                Clarity
              </h1>
              <div className="absolute inset-0 text-9xl font-dm-serif text-blue-200/30 tracking-tight animate-float font-medium" style={{ animationDelay: '0.1s' }}>
                Clarity
              </div>
            </div>
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
              <div className="w-4 h-0.5 bg-sky-300/70"></div>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent"></div>
            </div>
          </div>

          <Button 
            size="lg" 
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-blue-400 via-sky-500 to-cyan-400 hover:from-blue-500 hover:via-sky-600 hover:to-cyan-500 text-white shadow-2xl hover:shadow-blue-300/25 hover:scale-110 transform transition-all duration-500 ease-out text-2xl py-10 px-20 rounded-2xl border-0 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 group-hover:tracking-widest transition-all duration-500 font-medium">Start</span>
          </Button>
          
          {/* Decorative elements around button */}
          <div className="mt-12 flex justify-center space-x-8">
            <div className="w-3 h-3 bg-blue-300/70 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-sky-300/70 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="w-3 h-3 bg-cyan-300/70 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}