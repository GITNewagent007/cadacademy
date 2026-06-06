"use client";
import React, { useRef } from "react";
import { useScroll, useTransform, motion, type MotionValue } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const scaleDimensions = () => (isMobile ? [0.7, 0.95] : [1.0, 1.1]);

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <div
      ref={containerRef}
      className="h-[70rem] md:h-[80rem] flex items-center justify-center relative p-2 md:p-20"
    >
      <div
        className="py-10 md:py-20 w-full relative"
        style={{ perspective: "1000px" }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: React.ReactNode;
}) => {
  return (
    <motion.div style={{ translateY: translate }} className="div max-w-5xl mx-auto text-center">
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="max-w-6xl -mt-12 mx-auto h-[30rem] md:h-[42rem] w-full relative"
    >
      {/* Silver aluminum outer frame */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-200 to-gray-400 rounded-[32px]" />
      
      {/* Inner bezel and glossy edge */}
      <div className="absolute inset-1.5 md:inset-3 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-[28px] border border-gray-600">
        {/* Top shine/gloss effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-gradient-to-b from-white/30 to-transparent rounded-t-[28px] pointer-events-none" />
        
        {/* Subtle edge highlight */}
        <div className="absolute inset-0 rounded-[28px] shadow-inset pointer-events-none border-2 border-gray-500/20" />
      </div>
      
      {/* Inner display frame */}
      <div className="absolute inset-3 md:inset-[18px] rounded-[24px] overflow-hidden bg-background md:rounded-[22px]">
        {children}
      </div>
    </motion.div>
  );
};
