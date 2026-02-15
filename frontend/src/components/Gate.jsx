import { useRef } from "react";
import { gsap } from "gsap";
import "./Gate.css";

function Gate({ onEnter }) {
  const leftDoor = useRef(null);
  const rightDoor = useRef(null);
  const gateContainer = useRef(null);

  const handleEnter = () => {
    const tl = gsap.timeline({
      onComplete: onEnter
    });

    tl.to(leftDoor.current, {
      rotationY: -105,
      duration: 2.5,
      ease: "power3.inOut"
    }, 0)

    .to(rightDoor.current, {
      rotationY: 105,
      duration: 2.5,
      ease: "power3.inOut"
    }, 0)

    .to(".light-layer", {
      opacity: 0.9,
      duration: 2,
      ease: "power2.out"
    }, 0.5)

    .to(gateContainer.current, {
      opacity: 0,
      duration: 1
    }, 2.6);
  };

  return (
    <div className="gate-container" ref={gateContainer}>
      <div className="light-layer"></div>

      <div className="door left" ref={leftDoor}></div>
      <div className="door right" ref={rightDoor}></div>

      <button className="enter-btn" onClick={handleEnter}>
        Enter
      </button>
    </div>
  );
}

export default Gate;
