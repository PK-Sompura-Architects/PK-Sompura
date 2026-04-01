import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import "./Gate.css";

function Gate({ isTriggered }) {
  const leftDoor = useRef(null);
  const rightDoor = useRef(null);
  const gateContainer = useRef(null);
  const lightLayer = useRef(null);
  const corridorGlow = useRef(null);
  const seamRef = useRef(null);

  useEffect(() => {
    // Phase 1 — Fade in the gate initially
    gsap.fromTo(
      gateContainer.current,
      { opacity: 0 },
      { opacity: 1, duration: 1.5, ease: "power2.out" }
    );
  }, []);

  useEffect(() => {
    // Phase 3 — When App.jsx says "Go", play your beautiful timeline
    if (isTriggered) {
      const tl = gsap.timeline();

      tl.to(leftDoor.current, { rotationY: 105, duration: 2.8, ease: "power3.inOut" }, 0)
        .to(rightDoor.current, { rotationY: -105, duration: 2.8, ease: "power3.inOut" }, 0)
        .to(seamRef.current, { opacity: 0, duration: 0.6, ease: "power2.in" }, 0)
        .to(lightLayer.current, { opacity: 0.8, scale: 1.3, duration: 1.8, ease: "power2.out" }, 0.5)
        .to(corridorGlow.current, { opacity: 0.6, duration: 1.8, ease: "power2.out" }, 0.5)
        .to(gateContainer.current, { scale: 1.05, duration: 2.5, ease: "power1.inOut" }, 0.3)
        .to(gateContainer.current, { opacity: 0, duration: 1, ease: "power2.in" }, 2.6);
    }
  }, [isTriggered]);

  return (
    <div className="gate-container" ref={gateContainer} style={{ opacity: 0 }}>
      {/* Interior corridor glow */}
      <div className="corridor-glow" ref={corridorGlow}></div>

      {/* Light behind doors */}
      <div className="light-layer" ref={lightLayer}></div>

      {/* Left door with 3D structure */}
      <div className="door left" ref={leftDoor}>
        <div className="door-face">
          <div className="door-motif top-motif"></div>
          <div className="door-motif bottom-motif"></div>
        </div>
        <div className="door-edge"></div>
        <div className="door-hinge top"></div>
        <div className="door-hinge mid"></div>
        <div className="door-hinge bottom"></div>
      </div>

      {/* Center seam between doors */}
      <div className="door-seam" ref={seamRef}></div>

      {/* Right door with 3D structure */}
      <div className="door right" ref={rightDoor}>
        <div className="door-face">
          <div className="door-motif top-motif"></div>
          <div className="door-motif bottom-motif"></div>
        </div>
        <div className="door-edge"></div>
        <div className="door-hinge top"></div>
        <div className="door-hinge mid"></div>
        <div className="door-hinge bottom"></div>
      </div>
    </div>
  );
}

export default Gate;