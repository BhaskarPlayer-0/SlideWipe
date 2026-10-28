import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  PageItem,
  WATERMARK_PRESETS,
  applyWatermarkRemoval,
  cloneCanvas,
} from './utils/pdfEngine';
import { generateDemoDeckCanvases, DEMO_DECKS } from './data/demoDecks';
import { UploadDropzone } from './components/UploadDropzone';
import { StudioWorkspace } from './components/StudioWorkspace';

export default function App() {
  const [documentName, setDocumentName] = useState<string>('');
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');

  /**
   * Handle user uploaded PDF file
   */
  const handleFileSelected = async (file: File) => {
    setIsLoading(true);
    setLoadingProgress('Reading PDF document...');
    setDocumentName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const loadedPages: PageItem[] = [];
      const defaultZone = WATERMARK_PRESETS.gamma_bottom_right;

      for (let i = 1; i <= numPages; i++) {
        setLoadingProgress(`Rendering slide ${i} of ${numPages} and applying smart healing...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        // 1. Original Canvas
        const canvasOrig = document.createElement('canvas');
        canvasOrig.width = viewport.width;
        canvasOrig.height = viewport.height;
        const ctxOrig = canvasOrig.getContext('2d');
        if (!ctxOrig) continue;

        await page.render({
          canvasContext: ctxOrig,
          viewport,
          canvas: canvasOrig,
        } as any).promise;

        // 2. Cleaned Canvas
        const canvasClean = cloneCanvas(canvasOrig);
        applyWatermarkRemoval(canvasClean, defaultZone);

        loadedPages.push({
          id: `page_${i}_${Date.now()}`,
          pageNumber: i,
          originalCanvas: canvasOrig,
          cleanedCanvas: canvasClean,
          rotation: 0,
          selected: false,
          watermarkZones: [defaultZone],
        });
      }

      setPages(loadedPages);
      setLoadingProgress('');
    } catch (err) {
      console.error('Failed to process PDF file:', err);
      alert('Unable to parse the PDF file. Please ensure it is a valid, unencrypted PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle testing with one of the built-in demo decks
   */
  const handleSelectDemoDeck = (deckId: string) => {
    setIsLoading(true);
    const deckInfo = DEMO_DECKS.find((d) => d.id === deckId) || DEMO_DECKS[0];
    setLoadingProgress(`Generating ${deckInfo.title}...`);
    setDocumentName(`${deckInfo.title.replace(/\s+/g, '_')}.pdf`);

    setTimeout(() => {
      const demoCanvases = generateDemoDeckCanvases(deckId);
      const loadedPages: PageItem[] = demoCanvases.map((pair, idx) => ({
        id: `demo_${idx + 1}_${Date.now()}`,
        pageNumber: idx + 1,
        originalCanvas: pair.original,
        cleanedCanvas: pair.cleaned,
        rotation: 0,
        selected: false,
        watermarkZones: [deckInfo.defaultZone],
      }));

      setPages(loadedPages);
      setIsLoading(false);
      setLoadingProgress('');
    }, 150);
  };

  const handleNewFile = () => {
    setPages([]);
    setDocumentName('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Main Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20">
            CP
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
              CleanPDF Studio
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline ml-2 border-l border-slate-700 pl-2">
              Presentation Watermark Remover & Page Editor
            </span>
          </div>
        </div>

        {pages.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewFile}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Upload Another PDF
            </button>
          </div>
        )}
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {pages.length === 0 ? (
          <UploadDropzone
            onFileSelected={handleFileSelected}
            onSelectDemoDeck={handleSelectDemoDeck}
            isLoading={isLoading}
            loadingProgress={loadingProgress}
          />
        ) : (
          <StudioWorkspace
            documentName={documentName}
            pages={pages}
            onUpdatePages={setPages}
            onNewFile={handleNewFile}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-3.5 px-6 text-center text-xs text-slate-500">
        CleanPDF Studio · 100% Client-Side In-Browser Processing · No Files Uploaded to Server
      </footer>
    </div>
  );
}
