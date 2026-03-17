import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border text-sm font-medium whitespace-nowrap outline-none select-none transition-[background-color,color,border-color] duration-150 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] motion-reduce:active:scale-100 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-transparent hover:bg-[var(--primary-hover)]",
        outline:
          "bg-background text-foreground border-border hover:border-foreground hover:bg-foreground hover:text-background aria-expanded:border-foreground aria-expanded:bg-foreground aria-expanded:text-background",
        ghost:
          "bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] text-[color-mix(in_oklch,var(--foreground)_50%,transparent)] border-transparent hover:bg-[color-mix(in_oklch,var(--foreground)_10%,transparent)] hover:text-foreground",
        destructive:
          "bg-[color-mix(in_oklch,var(--destructive)_10%,transparent)] text-destructive border-transparent hover:bg-[color-mix(in_oklch,var(--destructive)_20%,transparent)] focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "bg-transparent text-primary border-transparent underline-offset-4 hover:underline",
      },
      size: {
        default:
          "min-h-[44px] gap-1.5 px-4 py-1.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3 text-[0.8rem] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "min-h-[48px] gap-2 px-5 py-2 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-[44px]",
        "icon-xs":
          "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8",
        "icon-lg": "size-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
