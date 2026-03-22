import { cn } from "@/lib/utils"
import { BrailleSpinner } from "@/components/ui/braille-spinner"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("flex items-center bg-muted/50 font-mono text-muted-foreground/30", className)}
      {...props}
    >
      <BrailleSpinner className="ml-2" />
    </div>
  )
}

export { Skeleton }
