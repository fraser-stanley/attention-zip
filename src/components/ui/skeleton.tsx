import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("flex items-center bg-muted/50 font-mono text-muted-foreground/30", className)}
      {...props}
    >
      <span className="ml-2 animate-[blink_1s_step-end_infinite]">&#x2588;</span>
    </div>
  )
}

export { Skeleton }
