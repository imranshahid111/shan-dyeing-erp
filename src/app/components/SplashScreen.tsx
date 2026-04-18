import { Package } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900 overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="relative flex flex-col items-center">
        {/* Animated Logo Container */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl blur-2xl opacity-50 animate-pulse group-hover:opacity-100 transition-opacity"></div>
          <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
            <Package className="text-white" size={48} />
          </div>
        </div>

        {/* Branding */}
        <div className="mt-8 text-center space-y-2">
          <h1 className="text-3xl font-black text-white tracking-widest animate-fade-in">
            SHAN DYEING <span className="text-blue-500">ERP</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium tracking-[0.3em] uppercase opacity-70">
            Smart Textile Solutions
          </p>
        </div>

        {/* Dynamic Loading Bar */}
        <div className="mt-12 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-progress-fill"></div>
        </div>

        {/* Status Text */}
        <p className="mt-4 text-xs font-medium text-slate-500 animate-pulse">
          Initializing secure environment...
        </p>
      </div>

      <style>{`
        @keyframes progress-fill {
          0% { width: 0%; transform: translateX(-100%); }
          100% { width: 100%; transform: translateX(0%); }
        }
        .animate-progress-fill {
          animation: progress-fill 3s ease-out forwards;
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
