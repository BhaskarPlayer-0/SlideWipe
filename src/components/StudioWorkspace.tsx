import React, { useState, useRef, useEffect } from 'react';
import {
  PageItem,
  WatermarkZone,
  WATERMARK_PRESETS,
  applyWatermarkRemoval,
  cloneCanvas,
  createPdfFromPages,
  exportPagesAsZip,
  triggerDownload,
} from '../utils/pdfEngine';
import {
  Download,
  Split,
  Eye,
  EyeOff,
  Maximize2,
  Sliders,
  Sparkles,
  RotateCw,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  RefreshCw,
  Upload,
  Layers,
  FileDown,
  Archive,
  ArrowUp,
  ArrowDown,
  X,
  Palette,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudioWorkspaceProps {
  documentName: string;
  pages: PageItem[];
  onUpdatePages: (pages: PageItem[]) => void;
  onNewFile: () => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  documentName,
  pages,
  onUpdatePages,
  onNewFile,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [splitView, setSplitView] = useState<boolean>(true);
  const [sliderPos, setSliderPos] = useState<number>(75); // percent
  const [showBoxOutline, setShowBoxOutline] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = fit
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportDpi, setExportDpi] = useState<number>(2); // 1=72, 2=150, 3=300

  // Active watermark zone configuration
  const [activeZone, setActiveZone] = useState<WatermarkZone>(WATERMARK_PRESETS.gamma_bottom_right);
  const [applyScope, setApplyScope] = useState<'all' | 'current' | 'selected'>('all');

  const stageRef = useRef<HTMLDivElement>(null);
  const splitDragRef = useRef<boolean>(false);
  const currentPage = pages[currentPageIndex] || pages[0];

  // Dragging slider handlers
  const handleSplitDown = (e: React.PointerEvent) => {
    splitDragRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleSplitMove = (e: React.PointerEvent) => {
    if (!splitDragRef.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  const handleSplitUp = () => {
    splitDragRef.current = false;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPrev();
      } else if (e.key === 'f' || e.key === 'F') {
        if (!e.metaKey && !e.ctrlKey) toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, pages.length]);

  const goToNext = () => {
    setCurrentPageIndex((prev) => (prev < pages.length - 1 ? prev + 1 : prev));
  };

  const goToPrev = () => {
    setCurrentPageIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      stageRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Re-apply watermark removal across specified scope
  const reapplyWatermark = (zoneToApply: WatermarkZone = activeZone) => {
    const updated = pages.map((page, idx) => {
      const shouldApply =
        applyScope === 'all' ||
        (applyScope === 'current' && idx === currentPageIndex) ||
        (applyScope === 'selected' && page.selected);

      if (!shouldApply) return page;

      // Start fresh from original canvas
      const newCleaned = cloneCanvas(page.originalCanvas);
      applyWatermarkRemoval(newCleaned, zoneToApply);

      return {
        ...page,
        cleanedCanvas: newCleaned,
        watermarkZones: [zoneToApply],
      };
    });

    onUpdatePages(updated);
  };

  // Change preset
  const handleSelectPreset = (key: string) => {
    const preset = WATERMARK_PRESETS[key];
    if (preset) {
      setActiveZone(preset);
      reapplyWatermark(preset);
    }
  };

  // Page Operations: Reorder, Rotate, Delete, Duplicate
  const handleRotatePage = (index: number) => {
    const updated = [...pages];
    const page = updated[index];
    const newRot = ((page.rotation || 0) + 90) % 360;
    updated[index] = { ...page, rotation: newRot };
    onUpdatePages(updated);
  };

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) return;
    const updated = pages.filter((_, i) => i !== index);
    onUpdatePages(updated);
    if (currentPageIndex >= updated.length) {
      setCurrentPageIndex(updated.length - 1);
    }
  };

  const handleDuplicatePage = (index: number) => {
    const page = pages[index];
    const copy: PageItem = {
      ...page,
      id: `${page.id}_copy_${Date.now()}`,
      originalCanvas: cloneCanvas(page.originalCanvas),
      cleanedCanvas: cloneCanvas(page.cleanedCanvas),
    };
    const updated = [...pages];
    updated.splice(index + 1, 0, copy);
    onUpdatePages(updated);
  };

  const handleMovePage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === pages.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...pages];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onUpdatePages(updated);
    setCurrentPageIndex(targetIdx);
  };

  const handleToggleSelect = (index: number) => {
    const updated = [...pages];
    updated[index] = { ...updated[index], selected: !updated[index].selected };
    onUpdatePages(updated);
  };

  const handleSelectAll = (select: boolean) => {
    const updated = pages.map((p) => ({ ...p, selected: select }));
    onUpdatePages(updated);
  };

  // Export handlers
  const handleDownloadPdf = async () => {
    setIsExporting(true);
    setExportStatus('Compiling clean multi-page PDF...');

    try {
      const pdfBlob = await createPdfFromPages(pages, { dpiScale: exportDpi });
      const cleanName = documentName
        ? documentName.replace(/\.pdf$/i, '') + '_Clean.pdf'
        : 'presentation_cleaned.pdf';

      triggerDownload(pdfBlob, cleanName);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setExportStatus('Download completed!');
      setShowExportModal(false);
      setTimeout(() => setExportStatus(''), 3000);
    } catch (err) {
      console.error('PDF export failed:', err);
      setExportStatus('Failed to generate PDF. Please retry.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    setExportStatus('Packaging all slides as high-res PNG ZIP...');

    try {
      const zipBlob = await exportPagesAsZip(pages, documentName);
      const zipName = documentName
        ? documentName.replace(/\.pdf$/i, '') + '_Clean_Slides.zip'
        : 'cleaned_slides.zip';

      triggerDownload(zipBlob, zipName);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      setExportStatus('ZIP download ready!');
      setShowExportModal(false);
      setTimeout(() => setExportStatus(''), 3000);
    } catch (err) {
      console.error('ZIP export failed:', err);
      setExportStatus('Failed to generate ZIP.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCurrentPng = () => {
    if (!currentPage) return;
    const dataUrl = currentPage.cleanedCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Slide_${String(currentPageIndex + 1).padStart(2, '0')}_Clean.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full flex flex-col flex-1 gap-4 font-sans select-none">
      {/* Top Application Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 sm:px-5 rounded-xl shadow-lg">
        {/* Document metadata */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNewFile}
            className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Open a different PDF file"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Open New PDF</span>
          </button>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white truncate max-w-[200px] sm:max-w-xs">
                {documentName || 'Presentation Deck'}
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {pages.length} Pages Cleaned
              </span>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Clean PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Studio Body: 3-column Layout */}
      <div className="grid grid-cols-12 gap-4 flex-1 items-start">
        {/* Left Column: Page Thumbnails & Page Management (3 cols) */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-3 max-h-[820px] overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-300">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400">
              Slides ({pages.length})
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                onClick={() => handleSelectAll(true)}
                className="text-sky-400 hover:text-sky-300 cursor-pointer"
              >
                All
              </button>
              <span className="text-slate-600">·</span>
              <button
                onClick={() => handleSelectAll(false)}
                className="text-slate-400 hover:text-slate-300 cursor-pointer"
              >
                None
              </button>
            </div>
          </div>

          {/* Thumbnails scroll area */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
            {pages.map((p, idx) => {
              const isCurrent = currentPageIndex === idx;
              return (
                <div
                  key={p.id}
                  onClick={() => setCurrentPageIndex(idx)}
                  className={`group relative rounded-lg border-2 p-1.5 transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/50'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                  }`}
                >
                  <div className="relative aspect-[16/9] w-full rounded overflow-hidden bg-slate-950">
                    <img
                      src={p.cleanedCanvas.toDataURL()}
                      alt={`Slide ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />

                    {/* Page Number Badge */}
                    <span className="absolute bottom-1 left-1 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>

                    {/* Cleaned Badge */}
                    <span className="absolute bottom-1 right-1 bg-emerald-950/90 text-emerald-300 border border-emerald-800/60 text-[9px] font-mono px-1 rounded flex items-center gap-0.5">
                      ✓ Clean
                    </span>
                  </div>

                  {/* Per-Slide Action Buttons */}
                  <div className="flex items-center justify-between pt-1 px-1 text-[11px] text-slate-400">
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={p.selected || false}
                        onChange={() => handleToggleSelect(idx)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0"
                      />
                      <span className="text-[10px]">Select</span>
                    </label>

                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMovePage(idx, 'up');
                        }}
                        disabled={idx === 0}
                        title="Move slide up"
                        className="p-1 hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMovePage(idx, 'down');
                        }}
                        disabled={idx === pages.length - 1}
                        title="Move slide down"
                        className="p-1 hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotatePage(idx);
                        }}
                        title="Rotate slide 90° clockwise"
                        className="p-1 hover:text-sky-400 cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicatePage(idx);
                        }}
                        title="Duplicate slide"
                        className="p-1 hover:text-indigo-400 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(idx);
                        }}
                        disabled={pages.length <= 1}
                        title="Delete slide"
                        className="p-1 hover:text-red-400 disabled:opacity-20 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Interactive Stage & Comparison Canvas (6 cols) */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-3">
          {/* Stage Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs">
            {/* Slide Index Navigator */}
            <div className="flex items-center gap-1.5 font-mono">
              <button
                onClick={goToPrev}
                disabled={currentPageIndex === 0}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 py-1 bg-slate-800 rounded text-slate-200">
                <span className="text-sky-400 font-bold">{currentPageIndex + 1}</span> / {pages.length}
              </span>
              <button
                onClick={goToNext}
                disabled={currentPageIndex === pages.length - 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Comparison toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSplitView(!splitView)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  splitView
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Toggle Before / After Split Slider"
              >
                <Split className="w-3.5 h-3.5" />
                <span>Split Slider</span>
              </button>

              <button
                onClick={() => setShowBoxOutline(!showBoxOutline)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  showBoxOutline
                    ? 'bg-slate-800 text-sky-400 border-sky-600/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Highlight active watermark eraser boundary"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Eraser Box</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                title="Fullscreen presentation mode (F)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Slide Stage */}
          <div
            ref={stageRef}
            onPointerMove={splitView ? handleSplitMove : undefined}
            onPointerUp={splitView ? handleSplitUp : undefined}
            className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center select-none"
          >
            {currentPage && (
              <>
                {/* Clean Layer (Base) */}
                <img
                  src={currentPage.cleanedCanvas.toDataURL()}
                  alt="Clean Slide"
                  className="w-full h-full object-contain pointer-events-none"
                />

                {/* Before (Original) Layer clipped by Split Slider */}
                {splitView && (
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                  >
                    <img
                      src={currentPage.originalCanvas.toDataURL()}
                      alt="Original Slide"
                      className="w-full h-full object-contain"
                    />

                    {/* Original Banner Tag */}
                    <div className="absolute top-3 right-3 bg-red-950/90 text-red-300 border border-red-700/60 px-2 py-0.5 rounded text-[10px] font-mono shadow">
                      Original Watermark
                    </div>
                  </div>
                )}

                {/* Split Handle Divider */}
                {splitView && (
                  <div
                    style={{ left: `${sliderPos}%` }}
                    onPointerDown={handleSplitDown}
                    className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_12px_rgba(0,0,0,0.8)] flex items-center justify-center -translate-x-1/2"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-white shadow-xl flex items-center justify-center text-white text-[9px] font-bold">
                      ↔
                    </div>
                  </div>
                )}

                {/* Highlighted Watermark Eraser Box */}
                {showBoxOutline && (
                  <div
                    style={{
                      left: `${activeZone.xPercent}%`,
                      top: `${activeZone.yPercent}%`,
                      width: `${activeZone.widthPercent}%`,
                      height: `${activeZone.heightPercent}%`,
                    }}
                    className="absolute border-2 border-dashed border-sky-400 bg-sky-500/15 pointer-events-none rounded transition-all z-10 flex items-center justify-center"
                  >
                    <span className="text-[9px] font-mono font-bold bg-sky-950/90 text-sky-300 px-1 rounded shadow">
                      Eraser Zone
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick Stage Sub-bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-mono text-[11px]">
              Drag the white divider handle to compare Before & After removal
            </span>
            <button
              onClick={handleExportCurrentPng}
              className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              Download This Slide (PNG)
            </button>
          </div>
        </div>

        {/* Right Column: Watermark Eraser & Inpaint Controls (3 cols) */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-5 text-xs text-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sliders className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-sm text-white">Watermark Eraser Tools</h3>
            </div>
            <p className="text-slate-400 text-[11px]">
              Target and heal branding badges across your presentation.
            </p>
          </div>

          {/* Preset Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Quick Badge Presets
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                onClick={() => handleSelectPreset('gamma_bottom_right')}
                className={`px-3 py-2 rounded-lg border text-left font-medium transition-all cursor-pointer flex items-center justify-between ${
                  activeZone.name === WATERMARK_PRESETS.gamma_bottom_right.name
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Gamma Badge (Bottom-Right)</span>
                <span className="text-[10px] font-mono text-sky-400">Default</span>
              </button>

              <button
                onClick={() => handleSelectPreset('canva_footer')}
                className={`px-3 py-2 rounded-lg border text-left font-medium transition-all cursor-pointer flex items-center justify-between ${
                  activeZone.name === WATERMARK_PRESETS.canva_footer.name
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Canva / Bottom Footer Strip</span>
                <span className="text-[10px] font-mono text-slate-400">Margin</span>
              </button>

              <button
                onClick={() => handleSelectPreset('gamma_bottom_left')}
                className={`px-3 py-2 rounded-lg border text-left font-medium transition-all cursor-pointer flex items-center justify-between ${
                  activeZone.name === WATERMARK_PRESETS.gamma_bottom_left.name
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Badge (Bottom-Left)</span>
                <span className="text-[10px] font-mono text-slate-400">Corner</span>
              </button>

              <button
                onClick={() => handleSelectPreset('confidential_stamp_top_right')}
                className={`px-3 py-2 rounded-lg border text-left font-medium transition-all cursor-pointer flex items-center justify-between ${
                  activeZone.name === WATERMARK_PRESETS.confidential_stamp_top_right.name
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Stamp (Top-Right)</span>
                <span className="text-[10px] font-mono text-slate-400">Header</span>
              </button>
            </div>
          </div>

          {/* Inpaint / Healing Algorithm */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Inpaint / Healing Engine
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  const updated = { ...activeZone, mode: 'smart-inpaint' as const };
                  setActiveZone(updated);
                  reapplyWatermark(updated);
                }}
                className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                  activeZone.mode === 'smart-inpaint'
                    ? 'bg-blue-600 text-white border-blue-500 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 mx-auto mb-1 text-sky-300" />
                Adaptive Inpaint
              </button>

              <button
                onClick={() => {
                  const updated = { ...activeZone, mode: 'color-fill' as const, customColor: '#ffffff' };
                  setActiveZone(updated);
                  reapplyWatermark(updated);
                }}
                className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                  activeZone.mode === 'color-fill'
                    ? 'bg-blue-600 text-white border-blue-500 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Palette className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-300" />
                Solid Fill
              </button>
            </div>

            {/* Custom color input if solid fill */}
            {activeZone.mode === 'color-fill' && (
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={activeZone.customColor || '#ffffff'}
                  onChange={(e) => {
                    const updated = { ...activeZone, customColor: e.target.value };
                    setActiveZone(updated);
                    reapplyWatermark(updated);
                  }}
                  className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={activeZone.customColor || '#ffffff'}
                  onChange={(e) => {
                    const updated = { ...activeZone, customColor: e.target.value };
                    setActiveZone(updated);
                    reapplyWatermark(updated);
                  }}
                  className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded text-xs font-mono text-white flex-1"
                />
              </div>
            )}
          </div>

          {/* Scope Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Apply Eraser Scope
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setApplyScope('all')}
                className={`py-1.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  applyScope === 'all'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Pages
              </button>
              <button
                onClick={() => setApplyScope('current')}
                className={`py-1.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  applyScope === 'current'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Current
              </button>
              <button
                onClick={() => setApplyScope('selected')}
                className={`py-1.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  applyScope === 'selected'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Selected
              </button>
            </div>
          </div>

          {/* Coordinate Sliders */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Position & Size Fine-Tuning
              </label>
              <button
                onClick={() => handleSelectPreset('gamma_bottom_right')}
                className="text-[10px] text-sky-400 hover:text-sky-300 cursor-pointer"
              >
                Reset
              </button>
            </div>

            <div className="space-y-2 text-[11px]">
              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>Horizontal (X): {activeZone.xPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="95"
                  step="0.5"
                  value={activeZone.xPercent}
                  onChange={(e) => {
                    const updated = { ...activeZone, xPercent: parseFloat(e.target.value) };
                    setActiveZone(updated);
                    reapplyWatermark(updated);
                  }}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>Vertical (Y): {activeZone.yPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="96"
                  step="0.5"
                  value={activeZone.yPercent}
                  onChange={(e) => {
                    const updated = { ...activeZone, yPercent: parseFloat(e.target.value) };
                    setActiveZone(updated);
                    reapplyWatermark(updated);
                  }}
                  className="w-full accent-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block mb-0.5">Width: {activeZone.widthPercent}%</span>
                  <input
                    type="range"
                    min="3"
                    max="100"
                    step="0.5"
                    value={activeZone.widthPercent}
                    onChange={(e) => {
                      const updated = { ...activeZone, widthPercent: parseFloat(e.target.value) };
                      setActiveZone(updated);
                      reapplyWatermark(updated);
                    }}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Height: {activeZone.heightPercent}%</span>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    step="0.5"
                    value={activeZone.heightPercent}
                    onChange={(e) => {
                      const updated = { ...activeZone, heightPercent: parseFloat(e.target.value) };
                      setActiveZone(updated);
                      reapplyWatermark(updated);
                    }}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                Export Clean Presentation
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Resolution / Print Quality
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setExportDpi(1)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                      exportDpi === 1
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    Compact (72 DPI)
                  </button>
                  <button
                    onClick={() => setExportDpi(2)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                      exportDpi === 2
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    Standard (150 DPI)
                  </button>
                  <button
                    onClick={() => setExportDpi(3)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                      exportDpi === 3
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    Print HD (300 DPI)
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-1">
                <div className="text-slate-400">Pages to export:</div>
                <div className="font-bold text-white">
                  {pages.length} Slides (16:9 Widescreen, Watermarks Removed)
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Clean PDF</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExportZip}
                disabled={isExporting}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Archive className="w-4 h-4 text-sky-400" />
                <span>Export All Slides as ZIP (PNG Images)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
