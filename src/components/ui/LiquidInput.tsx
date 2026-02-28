import React from "react";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

interface LiquidInputProps extends HTMLMotionProps<"input"> {
  label?: string;
  error?: string;
}

export const LiquidInput = React.forwardRef<HTMLInputElement, LiquidInputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-text-muted ml-1">
            {label}
          </label>
        )}
        <motion.input
          ref={ref}
          whileFocus={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className={`input-liquid ${error ? "border-error/50 focus:border-error" : ""} ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-error ml-1">{error}</span>}
      </div>
    );
  },
);

LiquidInput.displayName = "LiquidInput";
