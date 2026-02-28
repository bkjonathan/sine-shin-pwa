import React from "react";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

interface LiquidButtonProps extends Omit<
  HTMLMotionProps<"button">,
  "children"
> {
  variant?: "primary" | "ghost" | "default";
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({
  variant = "default",
  children,
  icon,
  className = "",
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case "primary":
        return "btn-liquid-primary";
      case "ghost":
        return "btn-liquid-ghost";
      default:
        return "";
    }
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`btn-liquid ${getVariantClass()} ${className}`}
      {...props}
    >
      {icon && <span className="flex items-center justify-center">{icon}</span>}
      {children}
    </motion.button>
  );
};
