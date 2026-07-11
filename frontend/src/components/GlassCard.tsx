import React from "react";
import clsx from "clsx";
import { motion } from "framer-motion";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverEffect?: boolean;
  glowColor?: "cyan" | "green" | "amber" | "red" | "none";
  delay?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  hoverEffect = false,
  glowColor = "none",
  delay = 0,
  ...props
}) => {
  const glowClasses = {
    cyan: "shadow-[0_0_25px_rgba(6,182,212,0.12)] border-[rgba(6,182,212,0.18)]",
    green: "shadow-[0_0_25px_rgba(16,185,129,0.12)] border-[rgba(16,185,129,0.18)]",
    amber: "shadow-[0_0_25px_rgba(217,119,6,0.12)] border-[rgba(217,119,6,0.18)]",
    red: "shadow-[0_0_25px_rgba(220,38,38,0.12)] border-[rgba(220,38,38,0.18)]",
    none: "border-[rgba(255,255,255,0.05)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={hoverEffect ? { 
        y: -4, 
        backgroundColor: "rgba(11, 15, 25, 0.85)", 
        borderColor: "rgba(6, 182, 212, 0.25)",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(6, 182, 212, 0.15)"
      } : undefined}
      className={clsx(
        "glass-panel rounded-3xl p-6 transition-all duration-300",
        hoverEffect && "cursor-pointer",
        glowClasses[glowColor],
        className
      )}
      {...props as any}
    >
      {children}
    </motion.div>
  );
};
