"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { skills } from "@/lib/skills";
import { ZapIcon } from "@/components/ui/zap";
import { ChartBarIncreasingIcon } from "@/components/ui/chart-bar-increasing";
import { ActivityIcon } from "@/components/ui/activity";
import { LayersIcon } from "@/components/ui/layers";
import { ShieldCheckIcon } from "@/components/ui/shield-check";
import { SparklesIcon } from "@/components/ui/sparkles";
import { UserIcon } from "@/components/ui/user";
import { MenuIcon } from "@/components/ui/menu";
import type { ReactNode } from "react";

type Section = {
  id: string;
  label: string;
  href: string;
  description: string;
  icon: ReactNode;
};

const sections: Section[] = [
  {
    id: "skills",
    label: "Skills",
    href: "/skills",
    description: `${skills.length} skills`,
    icon: <ZapIcon size={18} />,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    description: "Live market data",
    icon: <ChartBarIncreasingIcon size={18} />,
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    href: "/leaderboard",
    description: "Weekly trader rankings",
    icon: <ActivityIcon size={18} />,
  },

  {
    id: "portfolio",
    label: "Portfolio",
    href: "/portfolio",
    description: "Your positions & PnL",
    icon: <LayersIcon size={18} />,
  },
  {
    id: "trust",
    label: "Trust & Safety",
    href: "/trust",
    description: "Wallet presets & scope",
    icon: <ShieldCheckIcon size={18} />,
  },
  {
    id: "about",
    label: "About",
    href: "/",
    description: "Project info",
    icon: <SparklesIcon size={18} />,
  },
];


export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Close overlay on route change
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: close menu on navigation
      close();
    }
  }, [pathname, close]);

  return (
    <>
      {/* Persistent header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-background"
        inert={open ? true : undefined}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-11 items-center justify-between">
            <Link href="/" aria-label="Attention Index home">
              <Image
                src="/attention-index-logo.svg"
                alt="Attention Index"
                width={140}
                height={17}
                className="h-[17px] w-auto dark:invert"
                priority
              />
            </Link>
            <div className="flex items-center gap-1">
              <button
                aria-label="Login"
                className={buttonVariants({ variant: "outline" })}
              >
                <UserIcon size={14} />
                Login
              </button>
              <button
                onClick={() => setOpen(true)}
                aria-label="Open navigation"
                className={buttonVariants({ variant: "default" })}
              >
                <MenuIcon size={14} />
                Index
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen overlay */}
      <div
        inert={!open ? true : undefined}
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-[100] transition-opacity duration-200 ease-out",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/[0.69] backdrop-blur-sm" onClick={close} />

        {/* Content */}
        <div
          className={cn(
            "relative h-full flex flex-col text-white transition-transform duration-200 ease-out",
            open ? "translate-y-0" : "translate-y-4"
          )}
        >
          {/* Section grid */}
          <div className="flex-1 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
                {sections.map((section) => (
                  <Link
                    key={section.id}
                    href={section.href}
                    className="group bg-black p-6 flex flex-col gap-3 transition-colors duration-200 outline-none hover:bg-white hover:text-black focus-visible:bg-white focus-visible:text-black"
                  >
                    <span className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                      {section.icon}
                      {section.label}
                    </span>
                    <p className="text-xs text-white/50 group-hover:text-black/60">
                      {section.description}
                    </p>
                  </Link>
                ))}
              </div>

            </div>
          </div>

          {/* Overlay footer — full-width dithered logo */}
          <div className="mt-auto px-4 sm:px-6 lg:px-8 pb-8">
            <svg
              viewBox="0 0 703 87"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto"
              aria-label="Attention Index"
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
                <path d="M647.282 83.9803L663.88 51.3866L647.899 21.2187L666.69 21.0908L674.241 39.7158L681.77 20.9881L700.561 20.8602L685.108 51.2421L702.149 83.6068L683.357 83.7348L674.751 63.4929L666.073 83.8524L647.282 83.9803Z"/>
                <path d="M613.974 44.6927L627.546 44.6477C627.517 35.8318 626.341 31.0797 621.121 31.097C614.973 31.1174 613.946 36.2248 613.974 44.6927ZM645.678 55.4917L614.01 55.5967L614.023 59.4247C614.055 69.1686 615.463 73.92 620.915 73.9019C625.903 73.8853 627.283 70.2847 627.721 62.3953L645.121 62.3376C644.825 77.9986 636.497 85.4503 620.838 85.5022C597.174 85.5807 595.262 68.8829 595.201 50.323C595.142 32.6911 600.203 19.5663 620.619 19.4986C643.819 19.4216 645.607 34.1478 645.678 55.4917Z"/>
                <path d="M571.784 52.9832C571.767 41.8472 571.289 33.2639 564.909 33.274C558.065 33.2847 557.729 40.7092 557.747 52.1932C557.763 62.2852 558.126 71.9127 565.086 71.9017C570.654 71.893 571.804 65.1632 571.784 52.9832ZM572.181 83.9546L572.169 76.2986L571.937 76.299C570.436 80.4773 566.848 85.587 558.38 85.6003C545.852 85.62 538.993 76.5827 538.957 53.1507C538.926 33.6628 541.804 19.6222 557.116 19.5982C562.336 19.59 568.023 21.437 571.165 28.0441L571.397 28.0438L571.355 1.13179L590.147 1.10227L590.277 83.9262L572.181 83.9546Z"/>
                <path d="M482.569 84.008L482.689 21.2521L500.785 21.2869L500.771 28.7108L501.003 28.7113C503.681 23.1484 509.14 19.6789 516.1 19.6923C526.772 19.7127 532.446 25.0596 532.423 37.1236L532.332 84.1035L513.54 84.0675L513.623 41.2635C513.631 36.7395 511.78 34.068 508.184 34.0611C504.588 34.0542 501.451 36.8322 501.439 42.9802L501.36 84.0441L482.569 84.008Z"/>
                <path d="M453.877 85.1415L453.747 2.31757L473.235 2.28696L473.365 85.1109L453.877 85.1415Z"/>
                <path d="M367.071 84.2776L366.972 21.5216L385.068 21.4932L385.08 28.9172L385.312 28.9168C387.971 23.3447 393.418 20.1315 400.378 20.1206C411.05 20.1038 416.742 25.4309 416.761 37.4948L416.835 84.4748L398.043 84.5043L397.975 41.7004C397.968 37.1764 396.108 34.5113 392.512 34.5169C388.916 34.5226 385.789 37.3115 385.798 43.4595L385.863 84.5234L367.071 84.2776Z"/>
                <path d="M336.173 85.9488C313.205 85.9849 310.283 71.9535 310.254 53.1615C310.224 34.3695 314.378 19.979 336.07 19.9449C358.922 19.909 361.96 33.9403 361.989 52.7322C362.019 71.5242 357.865 85.9147 336.173 85.9488ZM343.198 52.9938C343.173 37.4498 342.005 32.2316 336.205 32.2407C330.637 32.2495 329.022 37.704 329.045 52.9C329.069 68.212 330.702 73.6614 336.27 73.6527C342.07 73.6436 343.222 68.4217 343.198 52.9938Z"/>
                <path d="M283.933 15.0394L283.91 0.655462L302.702 0.625943L302.725 15.0099L283.933 15.0394ZM284.042 84.4074L283.943 21.6514L302.735 21.6219L302.834 84.3778L284.042 84.4074Z"/>
                <path d="M251.717 67.2204L251.664 33.6964L243.892 33.7086L243.872 20.7166L251.644 20.7044L251.615 2.26044L270.407 2.23092L270.436 20.6749L279.136 20.6612L279.156 33.6532L270.456 33.6669L270.506 65.3348C270.513 69.8588 272.023 71.1325 276.547 71.1254C277.359 71.1241 278.403 71.0064 279.215 70.8892L279.235 83.4172C275.639 83.8868 272.044 84.1245 268.448 84.1301C255.34 84.1507 251.74 81.8363 251.717 67.2204Z"/>
                <path d="M191.476 84.553L191.377 21.797L209.473 21.7686L209.485 29.1926L209.717 29.1922C212.376 23.6201 217.823 20.1315 224.783 20.1206C235.455 20.1038 241.147 25.4309 241.166 37.4948L241.24 84.4748L222.448 84.5043L222.381 41.7004C222.374 37.1764 220.513 34.5113 216.917 34.5169C213.321 34.5226 210.194 37.3115 210.203 43.4595L210.268 84.5234L191.476 84.553Z"/>
                <path d="M154.563 45.4254L168.135 45.3567C168.091 36.5408 166.907 31.7907 161.687 31.8172C155.539 31.8483 154.521 36.9575 154.563 45.4254ZM186.286 56.169L154.619 56.3292L154.638 60.1572C154.687 69.9011 156.103 74.65 161.555 74.6224C166.543 74.5971 167.917 70.9941 168.341 63.1039L185.741 63.0158C185.472 78.6774 177.158 86.1435 161.498 86.2228C137.834 86.3426 135.894 69.6482 135.8 51.0884C135.711 33.4566 140.748 20.323 161.164 20.2197C184.364 20.1022 186.178 34.8252 186.286 56.169Z"/>
                <path d="M106.089 68.4489L106.036 34.9249L98.2645 34.9371L98.2441 21.9451L106.016 21.9329L105.987 3.48896L124.779 3.45944L124.808 21.9034L133.508 21.8898L133.528 34.8817L124.828 34.8954L124.878 66.5634C124.885 71.0874 126.395 72.361 130.919 72.3539C131.731 72.3526 132.775 72.235 133.587 72.1177L133.607 84.6457C130.011 85.1153 126.416 85.353 122.82 85.3586C109.712 85.3792 106.112 83.0649 106.089 68.4489Z"/>
                <path d="M71.8192 68.5016L71.7666 34.9777L63.9946 34.9899L63.9742 21.9979L71.7461 21.9857L71.7172 3.54169L90.5092 3.51217L90.5381 21.9562L99.2381 21.9425L99.2585 34.9345L90.5585 34.9481L90.6083 66.6161C90.6154 71.1401 92.1254 72.4137 96.6494 72.4066C97.4614 72.4053 98.5052 72.2877 99.317 72.1704L99.3367 84.6984C95.7414 85.1681 92.1458 85.4057 88.5498 85.4114C75.4418 85.4319 71.8422 83.1176 71.8192 68.5016Z"/>
                <path d="M0.133151 85.8544L21.115 2.9973L45.475 2.95903L66.2531 85.7505L46.0691 85.7822L43.0283 70.011L23.1923 70.0421L20.3171 85.8227L0.133151 85.8544ZM40.1046 54.9355L32.9707 18.0587L32.7387 18.0591L25.9527 54.9578L40.1046 54.9355Z"/>
              </g>
            </svg>
          </div>
        </div>
      </div>

    </>
  );
}
