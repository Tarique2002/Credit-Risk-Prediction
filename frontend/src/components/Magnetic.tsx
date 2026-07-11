import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import clsx from "clsx";

export interface MagneticProps {
  children: React.ReactNode;
  strength?: number;        // Strength of magnetic pull (default: 0.35)
  innerStrength?: number;   // Strength of inner elements relative to parent (default: 0.5)
  rotation?: number;        // Max cursor-based rotation in degrees (default: 5, 0 to disable)
  scale?: number;           // Scale factor on hover (default: 1.04)
  ease?: string;            // Return ease animation (default: "elastic.out(1, 0.5)")
  duration?: number;        // Mouse move tracking speed/duration (default: 0.5)
  returnDuration?: number;  // Time to return to origin on leave (default: 0.8)
  disabled?: boolean;       // Disable magnetic effect manually
  className?: string;       // Custom CSS class for the outer wrapper
  innerClassName?: string;  // Custom CSS class for the inner translated wrapper
  as?: React.ElementType; // HTML tag to use for the outer wrapper (default: "div")
}

export const Magnetic: React.FC<MagneticProps> = ({
  children,
  strength = 0.35,
  innerStrength = 0.5,
  rotation = 5,
  scale = 1.04,
  ease = "elastic.out(1, 0.5)",
  duration = 0.5,
  returnDuration = 0.8,
  disabled = false,
  className,
  innerClassName,
  as: Tag = "div",
}) => {
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    const content = contentRef.current;

    if (!trigger || !content || disabled) return;

    // 1. Check device capabilities & accessibility settings
    const checkDevice = () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches || 
                       window.matchMedia("(pointer: coarse)").matches;
      const isTablet = window.matchMedia("(min-width: 768px) and (max-width: 1024px)").matches;
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      return { isMobile, isTablet, prefersReducedMotion };
    };

    const { isMobile, isTablet, prefersReducedMotion } = checkDevice();

    // Determine working strengths based on device/accessibility constraints
    let activeStrength = strength;
    let activeRotation = rotation;
    let activeScale = scale;

    if (prefersReducedMotion) {
      activeStrength = 0;
      activeRotation = 0;
      // Keep subtle scale if desired, but respect standard transitions
    } else if (isMobile) {
      // Mobile: Disable magnetic movement, keep very subtle tap/hover scale
      activeStrength = 0;
      activeRotation = 0;
      activeScale = Math.min(scale, 1.02);
    } else if (isTablet) {
      // Tablet: Reduce strength by 40%
      activeStrength = strength * 0.6;
      activeRotation = rotation * 0.6;
      activeScale = Math.min(scale, 1.03);
    }

    // 2. Identify inner parallax elements
    // We target elements with [data-magnetic-inner] or [data-magnetic-speed]
    // If none are present, we automatically target direct children of the content wrapper
    const getInnerElements = (): Array<{ el: HTMLElement; factor: number }> => {
      const annotated = content.querySelectorAll<HTMLElement>("[data-magnetic-inner], [data-magnetic-speed]");
      if (annotated.length > 0) {
        return Array.from(annotated).map((el) => {
          const speedAttr = el.getAttribute("data-magnetic-speed");
          const factor = speedAttr ? parseFloat(speedAttr) : activeStrength * innerStrength;
          return { el, factor };
        });
      }

      // Fallback: direct children of the content wrapper
      return Array.from(content.children).map((child) => {
        const el = child as HTMLElement;
        return { el, factor: activeStrength * innerStrength };
      });
    };

    let innerElements: Array<{ el: HTMLElement; factor: number }> = [];
    let cachedRect: DOMRect | null = null;

    const handleMouseEnter = () => {
      // Cache DOM measurements to avoid layout thrashing on mousemove
      cachedRect = trigger.getBoundingClientRect();
      innerElements = getInnerElements();

      // Ensure will-change is applied for GPU rendering optimization
      content.style.willChange = "transform";
      innerElements.forEach(({ el }) => {
        el.style.willChange = "transform";
      });

      // Scale up parent
      gsap.to(content, {
        scale: activeScale,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!cachedRect) {
        cachedRect = trigger.getBoundingClientRect();
      }

      // Calculate relative distance of mouse from the center of the trigger area
      const centerX = cachedRect.left + cachedRect.width / 2;
      const centerY = cachedRect.top + cachedRect.height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      // Translate parent element
      const targetX = mouseX * activeStrength;
      const targetY = mouseY * activeStrength;

      // Subtle rotation around the center
      const targetRot = activeRotation ? (mouseX / (cachedRect.width / 2)) * activeRotation : 0;

      // Animate parent/content element
      gsap.to(content, {
        x: targetX,
        y: targetY,
        rotation: targetRot,
        duration: duration,
        ease: "power2.out",
        overwrite: "auto",
        force3D: true, // Use translate3d
      });

      // Animate inner parallax layers
      innerElements.forEach(({ el, factor }) => {
        // To achieve target absolute movement of (mouseX * factor), 
        // we calculate relative movement because the child is nested inside the content wrapper.
        // childRelativeMovement = absoluteTarget - parentTarget
        const childX = mouseX * (factor - activeStrength);
        const childY = mouseY * (factor - activeStrength);

        gsap.to(el, {
          x: childX,
          y: childY,
          duration: duration,
          ease: "power2.out",
          overwrite: "auto",
          force3D: true,
        });
      });
    };

    const handleMouseLeave = () => {
      // Clean up will-change to release system resources
      content.style.willChange = "";
      innerElements.forEach(({ el }) => {
        el.style.willChange = "";
      });

      cachedRect = null;

      // Smooth return to initial state with spring easing
      gsap.to(content, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: returnDuration,
        ease: ease,
        overwrite: "auto",
        force3D: true,
      });

      // Return inner elements to initial state
      innerElements.forEach(({ el }) => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: returnDuration,
          ease: ease,
          overwrite: "auto",
          force3D: true,
        });
      });
    };

    // Attach listeners
    trigger.addEventListener("mouseenter", handleMouseEnter);
    trigger.addEventListener("mousemove", handleMouseMove);
    trigger.addEventListener("mouseleave", handleMouseLeave);

    // Cleanup
    return () => {
      trigger.removeEventListener("mouseenter", handleMouseEnter);
      trigger.removeEventListener("mousemove", handleMouseMove);
      trigger.removeEventListener("mouseleave", handleMouseLeave);

      // Kill active tweens on this component instance
      gsap.killTweensOf(content);
      if (innerElements.length > 0) {
        innerElements.forEach(({ el }) => gsap.killTweensOf(el));
      }
    };
  }, [strength, innerStrength, rotation, scale, ease, duration, returnDuration, disabled]);

  // Use the Tag wrapper to establish the trigger zone, and target contentRef for translation.
  // Using inline-flex to keep standard flow behavior intact.
  return (
    <Tag
      ref={triggerRef as any}
      className={clsx("inline-flex items-center justify-center cursor-pointer", className)}
      style={{ touchAction: "none" }}
    >
      <div
        ref={contentRef}
        className={clsx("w-full h-full flex items-center justify-center", innerClassName)}
      >
        {children}
      </div>
    </Tag>
  );
};

export default Magnetic;
