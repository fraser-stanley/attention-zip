"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { TextMorph } from "@/components/text-morph";
import { skills } from "@/lib/skills";
import { Button } from "@/components/ui/button";
import { ZapIcon, type ZapHandle } from "@/components/ui/zap";
import { ChartBarIncreasingIcon, type ChartBarIncreasingIconHandle } from "@/components/ui/chart-bar-increasing";
import { ActivityIcon, type ActivityIconHandle } from "@/components/ui/activity";
import { LayersIcon, type LayersIconHandle } from "@/components/ui/layers";
import { SparklesIcon, type SparklesIconHandle } from "@/components/ui/sparkles";
import { useWallet, truncateAddress } from "@/lib/wallet-context";
import { WalletConnectModal } from "@/components/wallet-connect-modal";
import { WalletMenu } from "@/components/wallet-menu";

type IconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

type Section = {
  id: string;
  label: string;
  href: string;
  description: string;
};


const allSections: Section[] = [
  { id: "home", label: "Home", href: "/", description: "Project info" },
  { id: "skills", label: "Skills", href: "/skills", description: `${skills.length} skills` },
  { id: "dashboard", label: "Dashboard", href: "/dashboard", description: "Live market data" },
  { id: "leaderboard", label: "Leaderboard", href: "/leaderboard", description: "Weekly trader rankings" },
  { id: "portfolio", label: "Portfolio", href: "/portfolio", description: "Your positions & PnL" },
];

const headerActionClass =
  "px-0 !font-display !text-[0.75rem] !font-normal uppercase !tracking-[0.08em] !leading-[1.1]";

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [portfolioPromptDismissed, setPortfolioPromptDismissed] = useState(false);
  const { address, hydrated, isConnected } = useWallet();
  const router = useRouter();
  const close = useCallback(() => {
    setOpen(false);
  }, []);
  const navigateWithClose = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      close();
      setTimeout(() => router.push(href), 100);
    },
    [close, router]
  );
  const handleOverlayBackgroundClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest("a, button, [role='button']")) return;
      close();
    },
    [close]
  );

  const homeRef = useRef<SparklesIconHandle>(null);
  const skillsRef = useRef<ZapHandle>(null);
  const dashboardRef = useRef<ChartBarIncreasingIconHandle>(null);
  const leaderboardRef = useRef<ActivityIconHandle>(null);
  const portfolioRef = useRef<LayersIconHandle>(null);
  const iconRefs: Record<string, React.RefObject<IconHandle | null>> = {
    home: homeRef, skills: skillsRef, dashboard: dashboardRef,
    leaderboard: leaderboardRef, portfolio: portfolioRef,
  };

  const iconComponents: Record<string, React.ReactNode> = {
    home: <SparklesIcon ref={homeRef} size={18} />,
    skills: <ZapIcon ref={skillsRef} size={18} />,
    dashboard: <ChartBarIncreasingIcon ref={dashboardRef} size={18} />,
    leaderboard: <ActivityIcon ref={leaderboardRef} size={18} />,
    portfolio: <LayersIcon ref={portfolioRef} size={18} />,
  };

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Close overlay on route change
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      const frame = window.requestAnimationFrame(() => {
        close();
      });

      return () => window.cancelAnimationFrame(frame);
    }
  }, [pathname, close]);

  useEffect(() => {
    if (pathname === "/portfolio" && !address) {
      return;
    }

    if (!portfolioPromptDismissed) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPortfolioPromptDismissed(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [address, pathname, portfolioPromptDismissed]);

  useEffect(() => {
    if (
      !hydrated ||
      address ||
      pathname !== "/portfolio" ||
      walletModalOpen ||
      portfolioPromptDismissed
    ) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setWalletModalOpen(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [address, hydrated, pathname, portfolioPromptDismissed, walletModalOpen]);

  function handleWalletModalClose() {
    if (!address && pathname === "/portfolio") {
      setPortfolioPromptDismissed(true);
    }

    setWalletModalOpen(false);
  }

  return (
    <>
      {/* Persistent header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-background"
        inert={open || walletMenuOpen ? true : undefined}
      >
        <div className="mx-auto max-w-7xl px-4 pb-1 sm:px-6 lg:px-8">
          <div className="flex h-11 items-center justify-between py-[2px]">
            <Link
              href="/"
              onClick={() => {
                close();
                setWalletModalOpen(false);
              }}
              className="type-label text-foreground py-3"
            >
              attention.zip
            </Link>
            <div className="flex items-center gap-6">
              {isConnected && address ? (
                  <Button
                    type="button"
                    variant="quiet"
                    onClick={() => setWalletMenuOpen((v) => !v)}
                    className={headerActionClass}
                  >
                    <TextMorph>{truncateAddress(address)}</TextMorph>
                  </Button>
              ) : (
                <Button
                  type="button"
                  variant="quiet"
                  onClick={() => {
                    setPortfolioPromptDismissed(false);
                    setOpen(false);
                    setWalletModalOpen(true);
                  }}
                  className={headerActionClass}
                >
                  <TextMorph>Portfolio</TextMorph>
                </Button>
              )}
              <Button
                type="button"
                variant="quiet"
                onClick={() => setOpen(true)}
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                className={cn(headerActionClass, "text-foreground hover:opacity-70")}
              >
                Menu
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen overlay */}
      <div
        inert={!open ? true : undefined}
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-[100]",
          open
            ? "pointer-events-auto"
            : "pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/[0.58] transition-[opacity,backdrop-filter] duration-200 ease-out",
            open ? "opacity-100 backdrop-blur-[6px]" : "opacity-0 backdrop-blur-0"
          )}
          onClick={close}
        />

        {/* Content */}
        <div
          className={cn(
            "relative h-full flex flex-col text-white transition-[transform,opacity] duration-100 ease-out",
            open ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          )}
          onClick={handleOverlayBackgroundClick}
        >
          {/* Section grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
                {allSections.map((section) => (
                  <Link
                    key={section.id}
                    href={section.href}
                    onClick={(e) => {
                      if (section.id === "portfolio" && !isConnected) {
                        e.preventDefault();
                        close();
                        setTimeout(() => setWalletModalOpen(true), 100);
                      } else {
                        navigateWithClose(e, section.href);
                      }
                    }}
                    className="group bg-black p-6 flex flex-col gap-3 transition-colors duration-200 outline-none hover:bg-white hover:text-black focus-visible:bg-white focus-visible:text-black focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    onMouseEnter={() => iconRefs[section.id]?.current?.startAnimation()}
                    onMouseLeave={() => iconRefs[section.id]?.current?.stopAnimation()}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="type-label text-[0.875rem]">
                          {section.label}
                        </span>
                        <p className="type-caption font-mono text-white/50 group-hover:text-black/60">
                          {section.description}
                        </p>
                      </div>
                      <span className="text-white/50 group-hover:text-black/60 [&_svg]:size-7">{iconComponents[section.id]}</span>
                    </div>
                  </Link>
                ))}
              </div>

            </div>
          </div>

          {/* Overlay footer — full-width dithered logo */}
          <div className="mt-auto px-4 sm:px-6 lg:px-8 pb-8">
            <svg
              viewBox="0 0 607 107"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto"
              aria-hidden="true"
            >
              <defs>
                <filter id="dither-logo" x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.65"
                    numOctaves="4"
                    seed="0"
                    result="noise"
                  >
                    <animate
                      attributeName="seed"
                      values="0;100"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </feTurbulence>
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="noise"
                    scale="3"
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
              </defs>
              <g fill="black" filter="url(#dither-logo)">
                <path d="M586.862 19.0801C601.262 19.0801 606.303 30.5999 606.303 54.5996C606.303 79.4394 598.383 87.3602 586.383 87.3604C580.263 87.3604 575.102 85.0802 572.822 78.3604H572.582V106.8H550.982V20.7598H571.862V29.6396H572.103C574.623 22.56 579.543 19.0801 586.862 19.0801ZM27.3604 19.0801C42.4801 19.0801 53.04 23.1602 53.04 39.96V71.6396C53.04 77.7595 53.2802 82.3197 55.0801 85.6797H34.2002C33.3603 83.3999 33.2398 81.1201 32.8799 78.3604H32.6396C30.2396 84.1201 24.5999 87.3604 18 87.3604C4.92008 87.3604 5.78063e-05 79.3202 0 68.2803C0 56.2803 4.20006 50.6404 18 47.4004L26.5195 45.3604C31.1995 44.2804 32.8798 42.2401 32.8799 38.2803C32.8799 34.3204 31.0801 32.2804 27.3604 32.2803C23.1604 32.2803 21.3603 34.0801 21.2402 40.9199H2.51953C2.51961 22.2001 17.5204 19.0801 27.3604 19.0801ZM159.623 19.0801C176.903 19.0801 185.663 26.7603 185.663 50.2803V56.8799H153.623V65.4004C153.623 72.4801 156.504 74.1602 159.504 74.1602C163.344 74.16 165.623 71.7595 165.623 62.8799H185.063C184.703 78.7199 177.503 87.3604 159.623 87.3604C138.863 87.3602 132.023 77.88 132.023 53.2803C132.023 28.4404 140.063 19.0802 159.623 19.0801ZM344.529 19.0801C369.849 19.0801 372.13 34.5603 372.13 53.2803C372.13 70.2002 368.889 87.3604 344.529 87.3604C319.21 87.3602 316.93 71.88 316.93 53.1602C316.93 36.2402 320.17 19.0803 344.529 19.0801ZM84.96 20.7598H100.212V1.67969H121.812V20.7598H130.332V35.2793H121.812V66.2393C121.812 69.9592 123.492 71.2793 126.972 71.2793H130.332V85.6797C126.372 86.1597 122.291 86.3994 118.571 86.3994C105.492 86.3994 100.212 84.2395 100.212 69.8398V35.2793H84.96V66.2393C84.96 69.9592 86.6401 71.2793 90.1201 71.2793H93.4805V85.6797C89.5205 86.1597 85.4397 86.3994 81.7197 86.3994C68.6401 86.3994 63.3604 84.2395 63.3604 69.8398V35.2793H56.1602V20.7598H63.3604V1.67969H84.96V20.7598ZM276.78 20.7598H285.301V35.2793H276.78V66.2393C276.78 69.9592 278.46 71.2793 281.94 71.2793H285.301V85.6797C281.341 86.1597 277.26 86.3994 273.54 86.3994C260.46 86.3994 255.181 84.2396 255.181 69.8398V35.2793H247.98V20.7598H255.181V1.67969H276.78V20.7598ZM227.557 19.0801C237.037 19.0801 244.476 22.8 244.477 36.7197V85.6797H222.877V42.8398C222.877 37.44 221.437 35.1602 217.597 35.1602C213.757 35.1602 212.316 37.4401 212.316 42.8398V85.6797H190.717V20.7598H211.597V28.6797H211.837C214.597 22.32 219.997 19.0801 227.557 19.0801ZM310.871 85.6797H289.271V20.7598H310.871V85.6797ZM414.689 19.0801C424.169 19.0801 431.609 22.8 431.609 36.7197V85.6797H410.01V42.8398C410.01 37.44 408.569 35.1602 404.729 35.1602C400.89 35.1602 399.449 37.4401 399.449 42.8398V85.6797H377.85V20.7598H398.729V28.6797H398.97C401.73 22.32 407.13 19.0801 414.689 19.0801ZM460.553 85.6797H440.393V61.9199H460.553V85.6797ZM516.045 36.8398L491.805 68.8799H516.645V85.6797H466.725V68.8799L490.005 37.5596H467.805V20.7598H516.045V36.8398ZM543.645 85.6797H522.045V20.7598H543.645V85.6797ZM344.529 33C339.73 33.0002 338.529 36.8407 338.529 53.2803C338.529 69.5997 339.73 73.4402 344.529 73.4404C349.449 73.4404 350.529 69.6001 350.529 53.2803C350.529 36.8403 349.449 33 344.529 33ZM32.6396 54.3604C31.3196 56.1599 28.56 55.9205 25.3203 57.3604C21.9604 58.9203 20.8799 61.44 20.8799 65.7598C20.8799 70.0798 22.9202 72.8398 26.1602 72.8398C30.96 72.8398 32.8799 69.36 32.8799 62.1602V54.3604H32.6396ZM578.582 35.1602C573.662 35.1604 572.582 39.2406 572.582 53.1602C572.582 67.1997 573.662 71.28 578.582 71.2803C583.742 71.2803 584.702 67.2001 584.702 53.1602C584.702 39.2402 583.742 35.1602 578.582 35.1602ZM159.504 32.2803C155.064 32.2803 153.623 35.4002 153.623 42.2402V45.1201H165.504V42.2402C165.504 35.4005 164.184 32.2805 159.504 32.2803ZM310.871 16.0801H289.271V0H310.871V16.0801ZM543.645 16.0801H522.045V0H543.645V16.0801Z"/>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <WalletMenu open={walletMenuOpen} onClose={() => setWalletMenuOpen(false)} />
      <WalletConnectModal open={walletModalOpen} onClose={handleWalletModalClose} />
    </>
  );
}
