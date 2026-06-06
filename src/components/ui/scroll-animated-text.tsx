import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollAnimatedTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  gradientColors?: string;
  className?: string;
  textClassName?: string;
}

const ScrollAnimatedText = React.forwardRef<HTMLDivElement, ScrollAnimatedTextProps>(
  (
    {
      text,
      gradientColors = "linear-gradient(90deg, #0052cc, #00b4ff, #0052cc)",
      className,
      textClassName,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
      target: containerRef,
      offset: ["start end", "end start"],
    });

    // Animate background position based on scroll
    const backgroundPosition = useTransform(
      scrollYProgress,
      [0, 1],
      ["0% 0%", "100% 0%"]
    );

    return (
      <div
        ref={containerRef}
        className={cn("flex justify-center items-center", className)}
        {...props}
      >
        <motion.span
          ref={ref}
          className={cn("text-4xl md:text-6xl font-bold drop-shadow-lg", textClassName)}
          style={{
            background: gradientColors,
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundPosition,
            filter: "drop-shadow(0 2px 8px rgba(0, 82, 204, 0.3))",
          }}
        >
          {text}
        </motion.span>
      </div>
    );
  }
);

ScrollAnimatedText.displayName = "ScrollAnimatedText";

export { ScrollAnimatedText };
