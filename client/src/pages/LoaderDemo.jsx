import React from 'react';
import { AILoader } from '../components/ui/ai-loader';

/**
 * LoaderDemo Page
 * A demonstration page for the premium AILoader component.
 */
export default function LoaderDemo() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-neu-bg shadow-neu p-8 rounded-[2.5rem]">
          <h1 className="text-2xl font-black text-neu-primary font-jakarta uppercase tracking-tighter mb-4">
            AI Loader Integration
          </h1>
          <p className="text-neu-muted mb-8 font-medium">
            This component is a high-fidelity, Neumorphic-aligned loader designed for generative processes.
            It utilizes staggered CSS animations and rotating box-shadows to create a premium "light-field" effect.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-neu-bg shadow-neu-inset rounded-3xl border border-transparent">
              <h3 className="text-xs font-black text-neu-accent uppercase tracking-widest mb-4">Usage Notes</h3>
              <ul className="text-xs space-y-3 text-neu-muted font-bold">
                <li className="flex items-center gap-2">• Responsive size controls via <code>size</code> prop</li>
                <li className="flex items-center gap-2">• Dynamic text sequencing via <code>text</code> prop</li>
                <li className="flex items-center gap-2">• Full-screen overlay with backdrop blur</li>
              </ul>
            </div>
            
            <div className="flex items-center justify-center">
               <button 
                onClick={() => window.location.reload()}
                className="px-8 py-4 bg-neu-bg shadow-neu hover:shadow-neu-inset rounded-2xl text-xs font-black uppercase tracking-widest text-neu-accent transition-all"
               >
                 Replay Full Loader
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* The Loader in action */}
      <AILoader text="Analyzing Market DNA" size={200} />
    </div>
  );
}
