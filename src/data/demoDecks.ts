import { WatermarkZone, WATERMARK_PRESETS } from '../utils/pdfEngine';

export interface DemoDeckInfo {
  id: string;
  title: string;
  subtitle: string;
  pageCount: number;
  watermarkType: string;
  badgePreview: string;
  defaultZone: WatermarkZone;
}

export const DEMO_DECKS: DemoDeckInfo[] = [
  {
    id: 'ai_cloud_gamma',
    title: 'NextGen AI Cloud Infrastructure',
    subtitle: 'Gamma AI Presentation with bottom-right badge',
    pageCount: 5,
    watermarkType: 'Made with GAMMA badge',
    badgePreview: 'Made with GAMMA',
    defaultZone: WATERMARK_PRESETS.gamma_bottom_right,
  },
  {
    id: 'growth_qbr_canva',
    title: 'Enterprise Q4 Growth Strategy',
    subtitle: 'Corporate deck with bottom footer branding bar',
    pageCount: 4,
    watermarkType: 'Canva / Footer Branding',
    badgePreview: 'Canva Presentation',
    defaultZone: WATERMARK_PRESETS.canva_footer,
  },
  {
    id: 'defense_aiot',
    title: 'AIoT Autonomous Border Defense',
    subtitle: 'Technical research deck with Gamma badges',
    pageCount: 6,
    watermarkType: 'Gamma Badge',
    badgePreview: 'Made with GAMMA',
    defaultZone: WATERMARK_PRESETS.gamma_bottom_right,
  },
];

/**
 * Generates high-res canvas slides for demo decks
 */
export function generateDemoDeckCanvases(deckId: string): { original: HTMLCanvasElement; cleaned: HTMLCanvasElement }[] {
  const result: { original: HTMLCanvasElement; cleaned: HTMLCanvasElement }[] = [];

  const slideConfigs = getDeckSlides(deckId);

  slideConfigs.forEach((config) => {
    // 1. Draw Original (with watermark)
    const canvasOrig = document.createElement('canvas');
    canvasOrig.width = 1920;
    canvasOrig.height = 1080;
    const ctxOrig = canvasOrig.getContext('2d');
    if (!ctxOrig) return;

    config.draw(ctxOrig, true);

    // 2. Draw Cleaned (without watermark)
    const canvasClean = document.createElement('canvas');
    canvasClean.width = 1920;
    canvasClean.height = 1080;
    const ctxClean = canvasClean.getContext('2d');
    if (!ctxClean) return;

    config.draw(ctxClean, false);

    result.push({
      original: canvasOrig,
      cleaned: canvasClean,
    });
  });

  return result;
}

interface SlideConfig {
  draw: (ctx: CanvasRenderingContext2D, includeWatermark: boolean) => void;
}

function getDeckSlides(deckId: string): SlideConfig[] {
  if (deckId === 'growth_qbr_canva') {
    return [
      {
        draw: (ctx, wm) => {
          // Slide 1: QBR Title
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 1920, 1080);
          // Accent glow
          const grad = ctx.createRadialGradient(960, 400, 50, 960, 400, 800);
          grad.addColorStop(0, '#1e3a8a');
          grad.addColorStop(1, '#0f172a');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 1920, 1080);

          ctx.fillStyle = '#60a5fa';
          ctx.font = 'bold 24px system-ui, sans-serif';
          ctx.fillText('EXECUTIVE QUARTERLY BRIEFING', 120, 420);

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 84px system-ui, sans-serif';
          ctx.fillText('Global Growth & Expansion', 120, 520);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '400 32px system-ui, sans-serif';
          ctx.fillText('Q4 Performance Metrics & Strategic Horizon 2027', 120, 600);

          if (wm) drawCanvaFooter(ctx);
        },
      },
      {
        draw: (ctx, wm) => {
          // Slide 2: Metrics
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, 1920, 1080);

          ctx.fillStyle = '#1e293b';
          ctx.font = '900 54px system-ui, sans-serif';
          ctx.fillText('Key Financial Highlights', 120, 160);

          // 3 Metric Cards
          const metrics = [
            { label: 'Annual Recurring Revenue', val: '$148M', change: '+34% YoY' },
            { label: 'Net Revenue Retention', val: '128%', change: 'Top Decile' },
            { label: 'Operating Margin', val: '24.6%', change: '+520 bps' },
          ];

          metrics.forEach((m, idx) => {
            const x = 120 + idx * 560;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            roundRect(ctx, x, 280, 520, 460, 16);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#64748b';
            ctx.font = '600 22px system-ui, sans-serif';
            ctx.fillText(m.label, x + 40, 360);

            ctx.fillStyle = '#0f172a';
            ctx.font = '900 76px system-ui, sans-serif';
            ctx.fillText(m.val, x + 40, 480);

            ctx.fillStyle = '#16a34a';
            ctx.font = 'bold 24px system-ui, sans-serif';
            ctx.fillText(m.change, x + 40, 560);
          });

          if (wm) drawCanvaFooter(ctx);
        },
      },
      {
        draw: (ctx, wm) => {
          // Slide 3: Global Expansion
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, 1920, 1080);

          ctx.fillStyle = '#1e293b';
          ctx.font = '900 54px system-ui, sans-serif';
          ctx.fillText('Regional Execution Map', 120, 160);

          ctx.fillStyle = '#64748b';
          ctx.font = '400 24px system-ui, sans-serif';
          ctx.fillText('Accelerated penetration into APAC and EMEA enterprise sectors', 120, 210);

          // Two big panels
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2;
          roundRect(ctx, 120, 280, 800, 520, 16);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 32px system-ui, sans-serif';
          ctx.fillText('EMEA Headquarters (London / Zurich)', 160, 360);
          ctx.fillStyle = '#475569';
          ctx.font = '400 22px system-ui, sans-serif';
          ctx.fillText('• 42 new Tier-1 Enterprise contracts signed', 160, 430);
          ctx.fillText('• Data residency compliance achieved in 14 countries', 160, 490);
          ctx.fillText('• Customer acquisition cost lowered by 18%', 160, 550);

          roundRect(ctx, 980, 280, 820, 520, 16);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 32px system-ui, sans-serif';
          ctx.fillText('APAC Innovation Center (Singapore / Tokyo)', 1020, 360);
          ctx.fillStyle = '#475569';
          ctx.font = '400 22px system-ui, sans-serif';
          ctx.fillText('• 89% customer satisfaction score across financial clients', 1020, 430);
          ctx.fillText('• Strategic partnership with key regional hyperscalers', 1020, 490);
          ctx.fillText('• Localized support coverage across 6 timezones', 1020, 550);

          if (wm) drawCanvaFooter(ctx);
        },
      },
      {
        draw: (ctx, wm) => {
          // Slide 4: Roadmap
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, 1920, 1080);

          ctx.fillStyle = '#1e293b';
          ctx.font = '900 54px system-ui, sans-serif';
          ctx.fillText('Strategic Priorities & FY27 Horizon', 120, 160);

          const pillars = [
            { num: '01', title: 'AI Acceleration', body: 'Deploy proprietary autonomous workflow agents across core product suite.' },
            { num: '02', title: 'Enterprise Security', body: 'Achieve FedRAMP High and SOC2 Type III global certification.' },
            { num: '03', title: 'Capital Efficiency', body: 'Maintain Rule of 40 standard with sustainable free cash flow margins.' },
          ];

          pillars.forEach((p, idx) => {
            const y = 280 + idx * 180;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            roundRect(ctx, 120, y, 1680, 140, 12);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#2563eb';
            ctx.font = '900 36px system-ui, sans-serif';
            ctx.fillText(p.num, 160, y + 80);

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 30px system-ui, sans-serif';
            ctx.fillText(p.title, 260, y + 80);

            ctx.fillStyle = '#475569';
            ctx.font = '400 22px system-ui, sans-serif';
            ctx.fillText(p.body, 680, y + 80);
          });

          if (wm) drawCanvaFooter(ctx);
        },
      },
    ];
  }

  // Default: NextGen AI Cloud (Gamma Style)
  return [
    {
      draw: (ctx, wm) => {
        // Slide 1: Cover
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, 1920, 1080);

        // Tech mesh grid background
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 1920; x += 120) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 1080);
          ctx.stroke();
        }
        for (let y = 0; y < 1080; y += 120) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(1920, y);
          ctx.stroke();
        }

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('PRODUCT RELEASE // 2026.4', 140, 420);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 86px system-ui, sans-serif';
        ctx.fillText('Autonomous AI Cloud', 140, 520);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 32px system-ui, sans-serif';
        ctx.fillText('Distributed edge compute & zero-latency vector execution', 140, 600);

        if (wm) drawGammaBadge(ctx, true);
      },
    },
    {
      draw: (ctx, wm) => {
        // Slide 2: Problem
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 1920, 1080);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('CHALLENGE STATEMENT', 140, 160);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 56px system-ui, sans-serif';
        ctx.fillText('Legacy Cloud Bottlenecks in the LLM Era', 140, 230);

        const cards = [
          { title: 'Inference Latency Spikes', desc: 'Centralized GPU clusters introduce 400ms+ roundtrip transit times for real-time speech and agents.' },
          { title: 'Astronomical Egress Costs', desc: 'High-frequency streaming context windows generate unsustainable multi-million cloud egress bills.' },
          { title: 'Cold-Start Penalties', desc: 'Large 70B parameter weight swapping stalls microservices and drops live streaming sessions.' },
        ];

        cards.forEach((c, idx) => {
          const x = 140 + idx * 560;
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          roundRect(ctx, x, 320, 520, 480, 16);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.font = '900 40px monospace';
          ctx.fillText(`0${idx + 1}`, x + 40, 400);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 28px system-ui, sans-serif';
          ctx.fillText(c.title, x + 40, 470);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '400 22px/1.6 system-ui, sans-serif';
          wrapText(ctx, c.desc, x + 40, 530, 440, 36);
        });

        if (wm) drawGammaBadge(ctx, true);
      },
    },
    {
      draw: (ctx, wm) => {
        // Slide 3: Architecture
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 1920, 1080);

        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('ARCHITECTURE BLUEPRINT', 140, 160);

        ctx.fillStyle = '#0f172a';
        ctx.font = '900 56px system-ui, sans-serif';
        ctx.fillText('Multi-Region Distributed Sensory Fabric', 140, 230);

        const layers = [
          { name: 'Layer 1: Edge Ingestion Gateways', detail: 'Sub-millisecond QUIC/WebTransport terminators with localized token quantization.' },
          { name: 'Layer 2: Autonomous Speculative Routing', detail: 'Dynamic neural dispatcher routing requests to optimal GPU memory banks.' },
          { name: 'Layer 3: Ephemeral Key-Value Cache Mesh', detail: 'Peer-to-peer NVMe flash synchronizing cross-node context vectors.' },
          { name: 'Layer 4: Zero-Trust Defense Envelope', detail: 'Hardware enclave attestation protecting confidential inference loads.' },
        ];

        layers.forEach((l, idx) => {
          const y = 320 + idx * 130;
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2;
          roundRect(ctx, 140, y, 1640, 105, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0284c7';
          ctx.font = 'bold 24px system-ui, sans-serif';
          ctx.fillText(l.name, 180, y + 45);

          ctx.fillStyle = '#64748b';
          ctx.font = '400 20px system-ui, sans-serif';
          ctx.fillText(l.detail, 180, y + 80);
        });

        if (wm) drawGammaBadge(ctx, false);
      },
    },
    {
      draw: (ctx, wm) => {
        // Slide 4: Results & Benchmark
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 1920, 1080);

        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('VERIFIED BENCHMARKS', 140, 160);

        ctx.fillStyle = '#0f172a';
        ctx.font = '900 56px system-ui, sans-serif';
        ctx.fillText('10x Latency Reduction at 65% Lower Cost', 140, 230);

        // Big Stat left
        ctx.fillStyle = '#0369a1';
        roundRect(ctx, 140, 320, 520, 480, 16);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 130px system-ui, sans-serif';
        ctx.fillText('18ms', 180, 500);

        ctx.fillStyle = '#e0f2fe';
        ctx.font = 'bold 32px system-ui, sans-serif';
        ctx.fillText('P99 Time to First Token', 180, 570);

        ctx.fillStyle = '#bae6fd';
        ctx.font = '400 22px system-ui, sans-serif';
        ctx.fillText('Benchmarked across 4 continents over 50M concurrent tokens.', 180, 630);

        // Right 2 comparison blocks
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        roundRect(ctx, 700, 320, 1080, 220, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 28px system-ui, sans-serif';
        ctx.fillText('Sustained GPU Utilization: 94.2%', 740, 390);
        ctx.fillStyle = '#64748b';
        ctx.font = '400 22px system-ui, sans-serif';
        ctx.fillText('Eliminates idling pipelines via dynamic asynchronous batch scheduling.', 740, 450);

        roundRect(ctx, 700, 580, 1080, 220, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 28px system-ui, sans-serif';
        ctx.fillText('Zero Data Center Cold Restarts', 740, 650);
        ctx.fillStyle = '#64748b';
        ctx.font = '400 22px system-ui, sans-serif';
        ctx.fillText('Instant warm-pool migration without breaking active user websockets.', 740, 710);

        if (wm) drawGammaBadge(ctx, false);
      },
    },
    {
      draw: (ctx, wm) => {
        // Slide 5: Final CTA
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, 1920, 1080);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('PRODUCTION ROLLOUT', 140, 400);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 76px system-ui, sans-serif';
        ctx.fillText('Available in General Availability', 140, 500);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 30px system-ui, sans-serif';
        ctx.fillText('Start deploying in your region with our single CLI command.', 140, 570);

        if (wm) drawGammaBadge(ctx, true);
      },
    },
  ];
}

function drawGammaBadge(ctx: CanvasRenderingContext2D, darkTheme: boolean) {
  const badgeW = 210;
  const badgeH = 48;
  const bx = 1920 - badgeW - 55;
  const by = 1080 - badgeH - 42;

  ctx.save();
  ctx.fillStyle = darkTheme ? '#1e293b' : '#162033';
  ctx.strokeStyle = darkTheme ? 'rgba(148, 163, 184, 0.4)' : 'rgba(51, 65, 85, 0.6)';
  ctx.lineWidth = 1.5;

  roundRect(ctx, bx, by, badgeW, badgeH, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '400 17px system-ui, sans-serif';
  ctx.fillText('Made with', bx + 22, by + 30);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText('GAMMA', bx + 110, by + 30);
  ctx.restore();
}

function drawCanvaFooter(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 1020, 1920, 60);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('CONFIDENTIAL · CANVA PRESENTATION TEMPLATE · FOR INTERNAL REVIEW ONLY', 120, 1056);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
}
