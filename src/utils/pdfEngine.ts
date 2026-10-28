import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Configure pdfjs worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
  }
}

export type InpaintMode = 'smart-inpaint' | 'color-fill' | 'edge-shave' | 'blur';

export interface WatermarkZone {
  id: string;
  name: string;
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  widthPercent: number; // 0 to 100
  heightPercent: number; // 0 to 100
  mode: InpaintMode;
  customColor?: string; // hex or rgb
  feather?: number; // pixels
}

export const WATERMARK_PRESETS: { [key: string]: WatermarkZone } = {
  gamma_bottom_right: {
    id: 'gamma_br',
    name: 'Gamma Badge (Bottom Right)',
    xPercent: 84.0,
    yPercent: 92.0,
    widthPercent: 14.2,
    heightPercent: 6.2,
    mode: 'smart-inpaint',
    feather: 3,
  },
  gamma_bottom_left: {
    id: 'gamma_bl',
    name: 'Branding Badge (Bottom Left)',
    xPercent: 2.0,
    yPercent: 92.0,
    widthPercent: 14.0,
    heightPercent: 6.0,
    mode: 'smart-inpaint',
    feather: 3,
  },
  canva_footer: {
    id: 'canva_footer',
    name: 'Canva / Slidesgo Footer Bar',
    xPercent: 0,
    yPercent: 94.0,
    widthPercent: 100,
    heightPercent: 6.0,
    mode: 'smart-inpaint',
    feather: 2,
  },
  confidential_stamp_top_right: {
    id: 'confidential_tr',
    name: 'Stamp / Watermark (Top Right)',
    xPercent: 78.0,
    yPercent: 2.5,
    widthPercent: 19.5,
    heightPercent: 6.5,
    mode: 'smart-inpaint',
    feather: 2,
  },
};

export interface PageItem {
  id: string;
  pageNumber: number;
  originalCanvas: HTMLCanvasElement;
  cleanedCanvas: HTMLCanvasElement;
  rotation: number; // 0, 90, 180, 270
  selected: boolean;
  watermarkZones: WatermarkZone[];
}

/**
 * Enhanced inpainting & healing engine for canvases.
 * Handles solid backgrounds, delicate gradients, photos, and margin strips.
 */
export function applyWatermarkRemoval(
  canvas: HTMLCanvasElement,
  zone: WatermarkZone
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Compute pixel coordinates
  const x = Math.max(0, Math.floor((zone.xPercent / 100) * width));
  const y = Math.max(0, Math.floor((zone.yPercent / 100) * height));
  const w = Math.min(width - x, Math.ceil((zone.widthPercent / 100) * width));
  const h = Math.min(height - y, Math.ceil((zone.heightPercent / 100) * height));

  if (w <= 0 || h <= 0) return;

  const feather = zone.feather || 3;

  if (zone.mode === 'color-fill' && zone.customColor) {
    ctx.fillStyle = zone.customColor;
    ctx.fillRect(x, y, w, h);
    return;
  }

  if (zone.mode === 'edge-shave') {
    // Fill the zone with the pixel color right at its inner boundary
    const sampleY = Math.max(0, y - 2);
    const sampleData = ctx.getImageData(x, sampleY, w, 2);
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < sampleData.data.length; i += 4) {
      r += sampleData.data[i];
      g += sampleData.data[i + 1];
      b += sampleData.data[i + 2];
      count++;
    }
    const avgR = count > 0 ? Math.round(r / count) : 255;
    const avgG = count > 0 ? Math.round(g / count) : 255;
    const avgB = count > 0 ? Math.round(b / count) : 255;
    ctx.fillStyle = `rgb(${avgR}, ${avgG}, ${avgB})`;
    ctx.fillRect(x, y, w, h);
    return;
  }

  if (zone.mode === 'blur') {
    ctx.save();
    ctx.filter = 'blur(12px)';
    ctx.drawImage(canvas, x, y, w, h, x, y, w, h);
    ctx.restore();
    return;
  }

  // Default: 'smart-inpaint'
  // Sample perimeter pixels (north and west boundary strips)
  const pad = Math.max(4, Math.min(16, Math.floor(h * 0.25)));
  const sampleTopY = Math.max(0, y - pad);
  const sampleLeftX = Math.max(0, x - pad);

  const northData = ctx.getImageData(x, sampleTopY, w, Math.max(1, y - sampleTopY));
  const westData = ctx.getImageData(sampleLeftX, y, Math.max(1, x - sampleLeftX), h);

  let sumR = 0, sumG = 0, sumB = 0, count = 0;
  const colors: [number, number, number][] = [];

  for (let i = 0; i < northData.data.length; i += 4) {
    const r = northData.data[i];
    const g = northData.data[i + 1];
    const b = northData.data[i + 2];
    sumR += r;
    sumG += g;
    sumB += b;
    colors.push([r, g, b]);
    count++;
  }

  for (let i = 0; i < westData.data.length; i += 4) {
    const r = westData.data[i];
    const g = westData.data[i + 1];
    const b = westData.data[i + 2];
    sumR += r;
    sumG += g;
    sumB += b;
    colors.push([r, g, b]);
    count++;
  }

  if (count === 0) return;

  const avgR = Math.round(sumR / count);
  const avgG = Math.round(sumG / count);
  const avgB = Math.round(sumB / count);

  // Check color variance to determine if background is flat or textured/photo
  let variance = 0;
  for (const [r, g, b] of colors) {
    variance += Math.abs(r - avgR) + Math.abs(g - avgG) + Math.abs(b - avgB);
  }
  variance /= count;

  if (variance < 28) {
    // Uniform background (slides usually have solid white, gray, navy, or slate)
    ctx.fillStyle = `rgb(${avgR}, ${avgG}, ${avgB})`;
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  } else {
    // Textured or photographic background: sample adjacent band above or left
    const sourceY = Math.max(0, y - h);
    const sourceHeight = Math.min(h, y - sourceY);

    if (sourceHeight > 0) {
      ctx.drawImage(
        canvas,
        x,
        sourceY,
        w,
        sourceHeight,
        x,
        y,
        w,
        h
      );
    } else {
      ctx.fillStyle = `rgb(${avgR}, ${avgG}, ${avgB})`;
      ctx.fillRect(x, y, w, h);
    }

    // Feather edges gently
    ctx.save();
    ctx.fillStyle = `rgba(${avgR}, ${avgG}, ${avgB}, 0.3)`;
    ctx.filter = `blur(${feather}px)`;
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.restore();
  }
}

/**
 * Clones a canvas accurately
 */
export function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const dest = document.createElement('canvas');
  dest.width = source.width;
  dest.height = source.height;
  const ctx = dest.getContext('2d');
  if (ctx) {
    ctx.drawImage(source, 0, 0);
  }
  return dest;
}

/**
 * Creates high-fidelity multi-page PDF document
 */
export async function createPdfFromPages(
  pages: PageItem[],
  options: {
    dpiScale?: number; // 1 = 72dpi, 2 = 144dpi, 3 = 216dpi (high print)
  } = {}
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (const page of pages) {
    const canvas = page.cleanedCanvas;
    const rotation = page.rotation || 0;

    // Convert canvas with rotation applied if needed
    let finalCanvas = canvas;
    if (rotation !== 0) {
      finalCanvas = document.createElement('canvas');
      if (rotation === 90 || rotation === 270) {
        finalCanvas.width = canvas.height;
        finalCanvas.height = canvas.width;
      } else {
        finalCanvas.width = canvas.width;
        finalCanvas.height = canvas.height;
      }
      const ctx = finalCanvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.translate(finalCanvas.width / 2, finalCanvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
        ctx.restore();
      }
    }

    const pngUrl = finalCanvas.toDataURL('image/png', 0.95);
    const pngImageBytes = await fetch(pngUrl).then((r) => r.arrayBuffer());
    const pngImage = await pdfDoc.embedPng(pngImageBytes);

    // Calculate dimensions maintaining aspect ratio
    // Default 16:9 presentation point size: 960x540 or A4/Letter
    const aspect = finalCanvas.width / finalCanvas.height;
    let ptWidth = 960;
    let ptHeight = 960 / aspect;

    const pdfPage = pdfDoc.addPage([ptWidth, ptHeight]);
    pdfPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: ptWidth,
      height: ptHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

/**
 * Exports all cleaned pages as a ZIP bundle of high-res PNG images
 */
export async function exportPagesAsZip(pages: PageItem[], baseFilename: string): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('cleaned_slides');

  pages.forEach((page, idx) => {
    const dataUrl = page.cleanedCanvas.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const filename = `Slide_${String(idx + 1).padStart(2, '0')}.png`;
    folder?.file(filename, base64Data, { base64: true });
  });

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Direct file download helper
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
