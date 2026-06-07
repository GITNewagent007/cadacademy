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
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003, inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(0,0,0,0.3)",
        background:
          "linear-gradient(145deg, #e2e2e6 0%, #b8b8bd 22%, #9a9a9f 48%, #76767a 72%, #58585c 100%)",
      }}
      className="max-w-6xl -mt-12 mx-auto h-[30rem] md:h-[42rem] w-full p-[10px] md:p-[14px] rounded-[30px] shadow-2xl ring-1 ring-black/20"
    >
      {/* Inner black bezel */}
      <div
        className="h-full w-full rounded-[22px] p-[4px] md:p-[6px]"
        style={{
          background:
            "linear-gradient(145deg, #1f1f22 0%, #0e0e10 60%, #050506 100%)",
          boxShadow:
            "inset 0 1px 2px rgba(255,255,255,0.08), inset 0 -1px 2px rgba(0,0,0,0.6)",
        }}
      >
        <div className="h-full w-full overflow-hidden rounded-[18px] bg-background relative">
          {children}
        </div>
      </div>
    </motion.div>
  );
};
