import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<
  HTMLInputElement, 
  React.ComponentProps<"input"> & { variant?: 'default' | 'glass' | 'neomorphic' | 'flat' }
>(
  ({ className, type, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
      glass: "flex h-10 w-full rounded-md border-0 bg-background bg-opacity-50 backdrop-blur-sm border border-border border-opacity-50 shadow-sm px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
      neomorphic: "flex h-10 w-full rounded-md border-0 neumorphism-inset px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
      flat: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-sm hover:shadow-md transition-shadow"
    }
    
    return (
      <input
        type={type}
        className={cn(
          variantClasses[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
