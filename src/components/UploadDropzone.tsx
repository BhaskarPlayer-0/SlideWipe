import React, { useRef } from 'react';
import { Upload, Sparkles, Shield, Zap, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { DEMO_DECKS, DemoDeckInfo } from '../data/demoDecks';

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  onSelectDemoDeck: (deckId: string) => void;
  isLoading: boolean;
  loadingProgress: string;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileSelected,
  onSelectDemoDeck,
  isLoading,
  loadingProgress,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
      onFileSelected(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 py-6 px-4">
      {/* Hero Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Universal Presentation Watermark Remover</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Erase Gamma & Presentation Watermarks
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Remove "Made with Gamma" badges, Canva branding strips, and PDF stamps with
          background-adaptive healing. 100% in-browser, private, and instant.
        </p>
      </div>

      {/* Main Drop Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`group relative rounded-2xl border-2 border-dashed transition-all p-10 sm:p-14 text-center cursor-pointer flex flex-col items-center justify-center ${
          isLoading
            ? 'border-blue-500 bg-blue-950/20 pointer-events-none'
            : 'border-slate-800 hover:border-blue-500/80 bg-slate-900/60 hover:bg-slate-900/90 shadow-2xl'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleChange}
          className="hidden"
        />

        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 group-hover:bg-blue-600/20 transition-all mb-5 shadow-inner">
          <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white animate-pulse">
              Processing & Rendering PDF Pages...
            </h3>
            <p className="text-xs font-mono text-sky-400">
              {loadingProgress || 'Extracting vector layers and canvas bitmaps...'}
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              Drop your presentation PDF here, or click to browse
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6">
              Supports presentations exported from Gamma, Canva, Tome, Pitch, PowerPoint, or Google Slides.
            </p>
            <div className="flex items-center gap-3">
              <span className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-colors">
                Select PDF File
              </span>
            </div>
          </>
        )}
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-200 mb-1">100% Client-Side Privacy</div>
            <p className="text-slate-400 leading-relaxed">
              Files are rendered locally in your browser memory. Your confidential slides are never uploaded to any remote server.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex items-start gap-3">
          <Zap className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-200 mb-1">Adaptive Background Healing</div>
            <p className="text-slate-400 leading-relaxed">
              Analyzes perimeter pixels to rebuild subtle gradients, textures, or solid colors with seamless edge feathering.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex items-start gap-3">
          <FileText className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-200 mb-1">Multi-Format Export</div>
            <p className="text-slate-400 leading-relaxed">
              Download clean 16:9 PDF documents in print-ready 300 DPI or export all slides as a PNG zip package.
            </p>
          </div>
        </div>
      </div>

      {/* Try Demo Decks Section */}
      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Don't have a PDF ready? Try a sample presentation</span>
            </h2>
            <p className="text-xs text-slate-400">
              Select any sample deck below to test the watermark removal and comparison tools instantly:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEMO_DECKS.map((deck) => (
            <button
              key={deck.id}
              onClick={() => onSelectDemoDeck(deck.id)}
              className="group text-left bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/60 p-4 rounded-xl transition-all flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-blue-500/10"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 border border-sky-800/40 px-2 py-0.5 rounded">
                    {deck.pageCount} Pages
                  </span>
                  <span className="text-[10px] font-mono text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                    {deck.watermarkType}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                  {deck.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {deck.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 group-hover:text-white">
                <span className="text-[11px] font-medium">Load & Erase Watermark</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
