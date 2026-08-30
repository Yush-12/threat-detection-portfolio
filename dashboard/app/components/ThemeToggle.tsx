"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 opacity-50" />
    );
  }

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    // Modern browsers: View Transitions API for a single compositor-level animation
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transition = (document as any).startViewTransition(() => {
        setTheme(nextTheme);
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 350,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      });
    } else {
      // Fallback: instant flip (disableTransitionOnChange handles cleanup)
      setTheme(nextTheme);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-neutral-700 transition-all duration-200 flex items-center justify-center shadow-xs group"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center transition-transform duration-300 group-hover:rotate-45">
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-amber-400 animate-scale-in" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 animate-scale-in" />
        )}
      </div>
    </button>
  );
}
