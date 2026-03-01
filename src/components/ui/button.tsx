import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "border border-white/55 bg-gradient-to-br from-sky-500/95 via-cyan-500/85 to-blue-600/90 text-primary-foreground shadow-[0_18px_36px_-20px_rgba(2,132,199,0.85)] hover:brightness-110",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-white/60 dark:border-white/25 bg-white/45 dark:bg-slate-900/45 text-foreground shadow-[0_14px_30px_-26px_rgba(15,23,42,0.8)] dark:shadow-[0_16px_32px_-26px_rgba(2,6,23,0.95)] backdrop-blur-xl hover:bg-white/65 dark:hover:bg-slate-900/65",
        secondary:
          "border-white/60 dark:border-white/25 bg-white/58 dark:bg-slate-900/58 text-secondary-foreground shadow-[0_12px_28px_-24px_rgba(15,23,42,0.7)] dark:shadow-[0_14px_30px_-24px_rgba(2,6,23,0.95)] backdrop-blur-xl hover:bg-white/70 dark:hover:bg-slate-900/70",
        ghost:
          "text-foreground hover:bg-white/45 dark:hover:bg-slate-900/45 hover:backdrop-blur-md",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-xl px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
