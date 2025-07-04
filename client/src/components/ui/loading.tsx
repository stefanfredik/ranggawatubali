import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  subText?: string;
  className?: string;
  variant?: "default" | "pulse" | "dots" | "gradient";
}

export function Loading({
  size = "md",
  text = "Loading",
  subText,
  className,
  variant = "default",
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  const containerClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const renderLoader = () => {
    switch (variant) {
      case "pulse":
        return (
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"
              style={{ transform: "scale(1.5)" }}
            ></div>
            <Loader2
              className={cn(
                "animate-spin text-primary mx-auto relative z-10",
                sizeClasses[size]
              )}
            />
          </div>
        );
      case "dots":
        return (
          <div className="flex space-x-2 justify-center items-center">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-primary",
                  size === "sm" ? "h-2 w-2" : size === "md" ? "h-3 w-3" : "h-4 w-4"
                )}
                style={{
                  animation: `bounce 1.4s infinite ease-in-out both`,
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </div>
        );
      case "gradient":
        return (
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent, var(--primary) 60%, transparent)",
                transform: "scale(1.5)",
              }}
            ></div>
            <div
              className={cn(
                "rounded-full bg-background flex items-center justify-center relative z-10",
                sizeClasses[size]
              )}
            >
              <Loader2
                className={cn(
                  "animate-spin text-primary",
                  size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-10 w-10"
                )}
              />
            </div>
          </div>
        );
      default:
        return (
          <Loader2
            className={cn(
              "animate-spin text-primary mx-auto",
              sizeClasses[size]
            )}
          />
        );
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl animate-fadeIn flex flex-col items-center justify-center",
        containerClasses[size],
        className
      )}
    >
      {renderLoader()}
      {text && (
        <p
          className={cn(
            "font-medium text-foreground mt-4",
            size === "sm" ? "text-sm" : size === "md" ? "text-base" : "text-lg"
          )}
        >
          {text}
        </p>
      )}
      {subText && (
        <p
          className={cn(
            "text-muted-foreground mt-1",
            size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
          )}
        >
          {subText}
        </p>
      )}
    </div>
  );
}

export function LoadingPage({
  text = "Loading",
  subText = "Menyiapkan halaman...",
  variant = "pulse",
}: {
  text?: string;
  subText?: string;
  variant?: "default" | "pulse" | "dots" | "gradient";
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div
        className="rounded-2xl p-10 animate-fadeIn"
        style={{
          backdropFilter: "blur(15px)",
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Loading size="lg" text={text} subText={subText} variant={variant} />
      </div>
    </div>
  );
}

// Add keyframes for the bounce animation to index.css
// @keyframes bounce {
//   0%, 80%, 100% { transform: scale(0); }
//   40% { transform: scale(1); }
// }