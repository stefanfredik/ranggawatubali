import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { variant?: 'default' | 'glass' | 'neomorphic' | 'flat' }
>(({ className, variant = 'default', ...props }, ref) => {
  const variantClasses = {
    default: "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
    glass: "inline-flex h-10 items-center justify-center rounded-md bg-background bg-opacity-50 backdrop-blur-sm border border-border border-opacity-50 shadow-sm p-1 text-muted-foreground",
    neomorphic: "inline-flex h-10 items-center justify-center rounded-md neumorphism p-1 text-muted-foreground",
    flat: "inline-flex h-10 items-center justify-center rounded-md flat-card p-1 text-muted-foreground"
  }
  
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
