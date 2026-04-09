"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  LayoutDashboard,
  ClipboardList,
  Building2,
  ShieldCheck,
  Zap,
  TrendingUp,
  Users,
  Star,
  ChevronRight,
  Play,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "Visão completa da operação em tempo real com métricas que importam.",
    gradient: "from-[#4fdcff]/20 to-[#4fdcff]/5",
    color: "#4fdcff",
  },
  {
    icon: ClipboardList,
    title: "Pedidos",
    description: "Gestão de pedidos integrada com controle total do fluxo.",
    gradient: "from-[#a78bfa]/20 to-[#a78bfa]/5",
    color: "#a78bfa",
  },
  {
    icon: Building2,
    title: "Cardápio Digital",
    description: "Cardápio digital integrado com atualização em tempo real.",
    gradient: "from-[#34d399]/20 to-[#34d399]/5",
    color: "#34d399",
  },
  {
    icon: ShieldCheck,
    title: "Customizável",
    description:
      "Plataforma adaptada de acordo com a necessidade da sua empresa.",
    gradient: "from-[#f472b6]/20 to-[#f472b6]/5",
    color: "#f472b6",
  },
];

const stats = [
  { value: 2400, suffix: "+", label: "Restaurantes ativos" },
  { value: 1.2, suffix: "M", label: "Pedidos processados", decimal: true },
  { value: 99.9, suffix: "%", label: "Uptime garantido", decimal: true },
  { value: 4.9, suffix: "/5", label: "Avaliação média", decimal: true },
];

const logos = [
  "Burger King",
  "Outback",
  "Madero",
  "Paris 6",
  "Coco Bambu",
  "Spoleto",
  "Giraffas",
  "Habib's",
];

function AnimatedCounter({
  value,
  suffix,
  decimal,
}: {
  value: number;
  suffix: string;
  decimal?: boolean;
}) {
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    let raf = 0;
    const start = 0;
    const duration = 2000;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (value - start) * eased;

      setDisplay(
        decimal
          ? current.toFixed(1)
          : Math.floor(current).toLocaleString("pt-BR")
      );

      if (progress < 1) raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [value, decimal]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

function Entrance({
  show,
  delay = 0,
  className = "",
  children,
}: {
  show: boolean;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${className} transition-[opacity,transform,filter] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform`}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: show ? 1 : 0,
        transform: show
          ? "translate3d(0,0,0) scale(1)"
          : "translate3d(0,34px,0) scale(0.985)",
        filter: show ? "blur(0px)" : "blur(12px)",
      }}
    >
      {children}
    </div>
  );
}

function AnimatedDivider({
  delay,
  show,
}: {
  delay: number;
  show: boolean;
}) {
  return (
    <Entrance show={show} delay={delay}>
      <div className="relative my-20 h-[2px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-[#4fdcff]/8" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#4fdcff]/18 to-transparent" />
        <div className="animate-horizontal-scan absolute left-[-20%] top-1/2 h-[2px] w-[18%] -translate-y-1/2 bg-gradient-to-r from-transparent via-[#7aeaff] to-transparent blur-[2px]" />
      </div>
    </Entrance>
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState({ x: "50%", y: "50%" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setSpotlight({
      x: `${e.clientX - rect.left}px`,
      y: `${e.clientY - rect.top}px`,
    });
  };

  return (
    <div
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen overflow-x-hidden bg-[#020b18] text-white selection:bg-[#4fdcff]/30 selection:text-white"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(255,255,255,0.02)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#4fdcff]/10 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -left-20 bottom-20 h-[400px] w-[400px] rounded-full bg-[#a78bfa]/8 blur-3xl animate-float-reverse" />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(79,220,255,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 90% 50%, rgba(79,220,255,0.03) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-20 mx-auto max-w-[1200px] px-6">
        <Entrance show={mounted} delay={0}>
          <nav className="flex items-center justify-between py-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#4fdcff] to-[#4fdcff]/60 shadow-[0_0_30px_rgba(79,220,255,0.18)]">
                <Zap size={16} className="text-[#020b18]" />
              </div>
              <span className="text-lg font-semibold tracking-tight">Fintex</span>
              <span className="ml-2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
                Beta
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white">
                Documentação
              </button>
              <Link
                href="/app"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                Login
              </Link>
            </div>
          </nav>
        </Entrance>

        <section className="grid gap-16 pb-8 pt-16 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div className="max-w-xl">
            <Entrance show={mounted} delay={120}>
              <div className="mb-8 flex items-center gap-3">
              </div>
            </Entrance>

            <Entrance show={mounted} delay={220}>
              <h1 className="text-[clamp(2.5rem,5.5vw,4rem)] font-bold leading-[1.05] tracking-[-0.04em] text-white">
                Gestão{" "}
                <span className="relative">
                  <span className="relative z-10 bg-gradient-to-r from-[#4fdcff] via-[#4fdcff] to-[#a78bfa] bg-clip-text text-transparent">
                    inteligente
                  </span>
                </span>
                <br />
                para restaurantes
              </h1>
            </Entrance>

            <Entrance show={mounted} delay={340}>
              <p className="mt-7 max-w-md text-[15px] leading-[1.7] text-white/65">
                Centralize toda a operação da sua empresa em um só lugar, com velocidade e clareza no dia a dia!
              </p>
            </Entrance>

            <Entrance show={mounted} delay={460}>
              <div className="mt-10 flex items-center gap-4">
                <Link
  href="/app"
  className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-[#4fdcff] px-7 py-3.5 text-sm font-semibold transition-all duration-300 hover:shadow-[0_0_40px_rgba(79,220,255,0.3)] active:scale-[0.98]"
  style={{ color: "#011b3c" }}
>
                  Acessar painel
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>

                <button className="group flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                    <Play
                      size={10}
                      className="ml-0.5 text-white"
                      fill="currentColor"
                    />
                  </div>
                  Ver demo
                </button>
              </div>
            </Entrance>

            <Entrance show={mounted} delay={580}>
              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-[#020b18]"
                      style={{
                        background: `linear-gradient(135deg, ${
                          ["#4fdcff", "#a78bfa", "#34d399", "#f472b6"][i % 4]
                        }40, ${
                          ["#4fdcff", "#a78bfa", "#34d399", "#f472b6"][i % 4]
                        }10)`,
                      }}
                    />
                  ))}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star
                        key={i}
                        size={12}
                        className="fill-[#fbbf24] text-[#fbbf24]"
                      />
                    ))}
                  </div>
                  <span className="mt-0.5 text-xs text-white/40">
                    Avaliado por <span className="text-white/60">2.400+</span>{" "}
                    restaurantes
                  </span>
                </div>
              </div>
            </Entrance>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full items-stretch">
            {features.map((f, i) => (
              <Entrance key={f.title} show={mounted} delay={220 + i * 110}>
                <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-white/[0.12] hover:bg-white/[0.04] h-full">
                  <div
                    className={`absolute inset-0 bg-gradient-to-b ${f.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                  />
                  <div className="relative z-10">
                    <div
                      className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] transition-all duration-300 group-hover:border-white/[0.15]"
                      style={{
                        background: `linear-gradient(135deg, ${f.color}15, ${f.color}05)`,
                      }}
                    >
                      <f.icon size={18} style={{ color: f.color }} />
                    </div>

                    <h3 className="text-sm font-semibold text-white/90 transition-colors group-hover:text-white">
                      {f.title}
                    </h3>

                    <p className="mt-2 text-[13px] leading-relaxed text-white/35 transition-colors group-hover:text-white/50">
                      {f.description}
                    </p>

                    <div
                      className="mt-4 flex translate-y-2 items-center gap-1 text-xs font-medium opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                      style={{ color: f.color }}
                    >
                      Saiba mais
                      <ChevronRight size={12} />
                    </div>
                  </div>
                </div>
              </Entrance>
            ))}
          </div>
        </section>

        <AnimatedDivider show={mounted} delay={720} />

        <Entrance show={mounted} delay={820}>
          <section className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="group text-center transition-transform duration-300 hover:-translate-y-1"
                style={{ transitionDelay: `${860 + index * 80}ms` }}
              >
                <div className="mb-2 text-3xl font-bold tracking-tight text-white lg:text-4xl">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    decimal={stat.decimal}
                  />
                </div>
                <div className="text-sm text-white/35 transition-colors group-hover:text-white/50">
                  {stat.label}
                </div>
              </div>
            ))}
          </section>
        </Entrance>

        <AnimatedDivider show={mounted} delay={980} />

        <Entrance show={mounted} delay={1080}>
          <section className="pb-20">
            <p className="mb-10 text-center text-xs font-medium uppercase tracking-[0.2em] text-white/25">
              Usado por restaurantes que escalam
            </p>

            <div className="relative overflow-hidden">
              <div className="absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#020b18] to-transparent" />
              <div className="absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#020b18] to-transparent" />
              <div className="flex items-center gap-12 animate-[marquee_20s_linear_infinite]">
                {[...logos, ...logos].map((logo, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 rounded-xl border border-white/[0.04] bg-white/[0.02] px-8 py-3 text-sm font-medium text-white/20 transition-colors hover:border-white/[0.08] hover:text-white/40"
                  >
                    {logo}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Entrance>

        <Entrance show={mounted} delay={1220}>
          <section className="pb-32">
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-12 text-center lg:p-16">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 50% 80% at 50% 0%, rgba(79,220,255,0.06) 0%, transparent 60%)",
                }}
              />
              <div className="relative z-10">
                <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#4fdcff]/20 bg-[#4fdcff]/5 px-4 py-1.5 text-xs font-medium text-[#4fdcff]">
                  <TrendingUp size={12} />
                  Comece agora
                </span>

                <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-white lg:text-4xl">
                  Pronto para transformar
                  <br />
                  <span className="bg-gradient-to-r from-[#4fdcff] to-[#a78bfa] bg-clip-text text-transparent">
                    sua operação?
                  </span>
                </h2>

                <p className="mx-auto mt-5 max-w-md text-base text-white/40">
                  Junte-se a milhares de restaurantes que já usam o Fintex para
                  crescer com controle total.
                </p>

                <div className="mt-8 flex items-center justify-center gap-4">
                  <Link
  href="/app"
  className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-[#4fdcff] px-7 py-3.5 text-sm font-semibold transition-all duration-300 hover:shadow-[0_0_40px_rgba(79,220,255,0.3)] active:scale-[0.98]"
  style={{ color: "#000000" }}
>
                    Começar gratuitamente
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </Link>

                  <button className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-medium text-white/60 transition-all hover:border-white/20 hover:text-white">
                    <Users size={16} />
                    Falar com vendas
                  </button>
                </div>
              </div>
            </div>
          </section>
        </Entrance>

        <Entrance show={mounted} delay={1380}>
          <footer className="flex items-center justify-between border-t border-white/[0.06] py-8">
            <div className="flex items-center gap-2 text-sm text-white/30">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-[#4fdcff] to-[#4fdcff]/60">
                <Zap size={10} className="text-[#020b18]" />
              </div>
              Fintex © 2026
            </div>

            <div className="flex items-center gap-6 text-xs text-white/25">
              <span className="cursor-pointer transition-colors hover:text-white/50">
                Termos
              </span>
              <span className="cursor-pointer transition-colors hover:text-white/50">
                Privacidade
              </span>
              <span className="cursor-pointer transition-colors hover:text-white/50">
                Contato
              </span>
            </div>
          </footer>
        </Entrance>
      </div>

      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @keyframes floatSlow {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, 24px, 0);
          }
        }

        @keyframes floatReverse {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -20px, 0);
          }
        }

        @keyframes horizontalScan {
          0% {
            transform: translateX(0) translateY(-50%);
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          88% {
            opacity: 1;
          }
          100% {
            transform: translateX(620%) translateY(-50%);
            opacity: 0;
          }
        }

        .animate-float-slow {
          animation: floatSlow 8s ease-in-out infinite;
        }

        .animate-float-reverse {
          animation: floatReverse 10s ease-in-out infinite;
        }

        .animate-horizontal-scan {
          animation: horizontalScan 4.8s linear infinite;
        }
      `}</style>
    </div>
  );
}