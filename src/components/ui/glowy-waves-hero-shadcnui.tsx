import { motion, type Variants } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { GradientSlideButton } from "@/components/ui/gradient-slide-button";

type Point = {
  x: number;
  y: number;
};

interface WaveConfig {
  offset: number;
  amplitude: number;
  frequency: number;
  color: string;
  opacity: number;
}

const highlightPills = [
  "Batch Processing",
  "Real-time Data",
  "GPU Optimized",
] as const;

const heroStats: { label: string; value: string }[] = [
  { label: "Supported Banks", value: "300+" },
  { label: "Success Rate", value: "99.9%" },
  { label: "Processing Time", value: "<15m" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, staggerChildren: 0.12 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const statsVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.08 },
  },
};

export function GlowyWavesHero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<Point>({ x: 0, y: 0 });
  const targetMouseRef = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let animationId: number;
    let time = 0;

    const computeThemeColors = () => {
      const rootStyles = getComputedStyle(document.documentElement);

      const resolveColor = (variables: string[], alpha = 1) => {
        const tempEl = document.createElement("div");
        tempEl.style.position = "absolute";
        tempEl.style.visibility = "hidden";
        tempEl.style.width = "1px";
        tempEl.style.height = "1px";
        document.body.appendChild(tempEl);

        let color = `rgba(255, 255, 255, ${alpha})`;

        for (const variable of variables) {
          const value = rootStyles.getPropertyValue(variable).trim();
          if (value) {
            tempEl.style.backgroundColor = `var(${variable})`;
            const computedColor = getComputedStyle(tempEl).backgroundColor;

            if (computedColor && computedColor !== "rgba(0, 0, 0, 0)") {
              if (alpha < 1) {
                const rgbMatch = computedColor.match(
                  /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/
                );
                if (rgbMatch) {
                  color = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
                } else {
                  color = computedColor;
                }
              } else {
                color = computedColor;
              }
              break;
            }
          }
        }

        document.body.removeChild(tempEl);
        return color;
      };

      // Fallback colors if variables aren't defined
      const primary = resolveColor(["--primary"]) !== "rgba(255, 255, 255, 1)" ? resolveColor(["--primary"]) : "#2563eb";

      return {
        backgroundTop: "#ffffff",
        backgroundBottom: "#f8fafc",
        wavePalette: [
          {
            offset: 0,
            amplitude: 70,
            frequency: 0.003,
            color: "rgba(37, 99, 235, 0.8)", // Blue 600
            opacity: 0.45,
          },
          {
            offset: Math.PI / 2,
            amplitude: 90,
            frequency: 0.0026,
            color: "rgba(59, 130, 246, 0.7)", // Blue 500
            opacity: 0.35,
          },
          {
            offset: Math.PI,
            amplitude: 60,
            frequency: 0.0034,
            color: "rgba(30, 41, 59, 0.65)", // Slate 800
            opacity: 0.3,
          },
          {
            offset: Math.PI * 1.5,
            amplitude: 80,
            frequency: 0.0022,
            color: "rgba(148, 163, 184, 0.25)", // Slate 400
            opacity: 0.25,
          },
          {
            offset: Math.PI * 2,
            amplitude: 55,
            frequency: 0.004,
            color: "rgba(15, 23, 42, 0.2)", // Slate 900
            opacity: 0.2,
          },
        ] satisfies WaveConfig[],
      };
    };

    let themeColors = computeThemeColors();

    const handleThemeMutation = () => {
      themeColors = computeThemeColors();
    };

    const observer = new MutationObserver(handleThemeMutation);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const mouseInfluence = prefersReducedMotion ? 10 : 70;
    const influenceRadius = prefersReducedMotion ? 160 : 320;
    const smoothing = prefersReducedMotion ? 0.04 : 0.1;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const recenterMouse = () => {
      const centerPoint = { x: canvas.width / 2, y: canvas.height / 2 };
      mouseRef.current = centerPoint;
      targetMouseRef.current = centerPoint;
    };

    const handleResize = () => {
      resizeCanvas();
      recenterMouse();
    };

    const handleMouseMove = (event: MouseEvent) => {
      targetMouseRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseLeave = () => {
      recenterMouse();
    };

    resizeCanvas();
    recenterMouse();

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const drawWave = (wave: WaveConfig) => {
      ctx.save();
      ctx.beginPath();

      for (let x = 0; x <= canvas.width; x += 4) {
        const dx = x - mouseRef.current.x;
        const dy = canvas.height / 2 - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - distance / influenceRadius);
        const mouseEffect =
          influence *
          mouseInfluence *
          Math.sin(time * 0.001 + x * 0.01 + wave.offset);

        const y =
          canvas.height / 2 +
          Math.sin(x * wave.frequency + time * 0.002 + wave.offset) *
          wave.amplitude +
          Math.sin(x * wave.frequency * 0.4 + time * 0.003) *
          (wave.amplitude * 0.45) +
          mouseEffect;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = wave.color;
      ctx.globalAlpha = wave.opacity;
      ctx.shadowBlur = 35;
      ctx.shadowColor = wave.color;
      ctx.stroke();

      ctx.restore();
    };

    const animate = () => {
      time += 1;

      mouseRef.current.x +=
        (targetMouseRef.current.x - mouseRef.current.x) * smoothing;
      mouseRef.current.y +=
        (targetMouseRef.current.y - mouseRef.current.y) * smoothing;

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, themeColors.backgroundTop);
      gradient.addColorStop(1, themeColors.backgroundBottom);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      themeColors.wavePalette.forEach(drawWave);

      animationId = window.requestAnimationFrame(animate);
    };

    animationId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, []);

  return (
    <section
      className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-background"
      role="region"
      aria-label="Glowing waves hero section"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      />

      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-foreground/[0.035] blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-foreground/[0.025] blur-[120px]" />
        <div className="absolute top-1/2 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/[0.02] blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-12 pb-24 text-center md:px-8 lg:px-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full"
        >
          <motion.div
            variants={itemVariants}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-foreground/70 backdrop-blur"
          >
            <img src="/favicon.svg" alt="Logo" className="h-4 w-4" aria-hidden="true" />
            Resolute Validator v2.0
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-6xl lg:text-8xl"
          >
            From days of work <br />
            <span className="bg-gradient-to-r from-blue-600 via-blue-400 to-slate-900 bg-clip-text text-transparent">
              to minutes of automation.
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mb-10 max-w-3xl text-lg text-gray-600 md:text-2xl"
          >
            The enterprise-grade engine built for speed and absolute accuracy. <br />
            Streamline your financial workflow by processing up to 5,000 bank accounts in minutes.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link to="/validator">
              <GradientSlideButton
                bgColor="#2563eb"
                colorFrom="#ffffff"
                colorTo="#e2e8f0"
                className="rounded-2xl px-8 h-14 text-base font-bold uppercase tracking-[0.1em] shadow-lg shadow-blue-500/20 text-white hover:text-blue-600 gap-2"
              >
                Start Validating
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </GradientSlideButton>
            </Link>
            <Link to="/bank-codes">
              <GradientSlideButton
                colorFrom="#111827"
                colorTo="#374151"
                className="rounded-2xl border border-gray-200 bg-white/60 h-14 px-8 text-base font-bold text-gray-900 backdrop-blur uppercase tracking-[0.1em] hover:text-white"
              >
                Bank Directory
              </GradientSlideButton>
            </Link>
          </motion.div>

          <motion.ul
            variants={itemVariants}
            className="mb-12 flex flex-wrap items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.1em] text-gray-500"
          >
            {highlightPills.map((pill) => (
              <li
                key={pill}
                className="rounded-full border border-gray-100 bg-white/60 px-4 py-2 backdrop-blur"
              >
                {pill}
              </li>
            ))}
          </motion.ul>

          <motion.div
            variants={statsVariants}
            className="grid gap-4 rounded-3xl border border-gray-100 bg-white/60 p-8 backdrop-blur-sm sm:grid-cols-3 shadow-xl shadow-blue-500/5"
          >
            {heroStats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="space-y-1"
              >
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  {stat.label}
                </div>
                <div className="text-3xl font-black text-gray-900">
                  {stat.value}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
