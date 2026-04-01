import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import './ProfileCard.css';

const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v, precision = 3) => parseFloat(v.toFixed(precision));
const adjust = (v, fMin, fMax, tMin, tMax) => round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

const ProfileCardComponent = ({
  avatarUrl,
  name,
  title,
  description,
  className = ''
}) => {
  const wrapRef = useRef(null);
  const shellRef = useRef(null);

  const handlePointerMove = useCallback((event) => {
    const shell = shellRef.current;
    const wrap = wrapRef.current;
    if (!shell || !wrap) return;

    const rect = shell.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const width = shell.clientWidth || 1;
    const height = shell.clientHeight || 1;

    const percentX = clamp((100 / width) * x);
    const percentY = clamp((100 / height) * y);

    const centerX = percentX - 50;
    const centerY = percentY - 50;

    wrap.style.setProperty('--pointer-x', `${percentX}%`);
    wrap.style.setProperty('--pointer-y', `${percentY}%`);
    wrap.style.setProperty('--background-x', `${adjust(percentX, 0, 100, 35, 65)}%`);
    wrap.style.setProperty('--background-y', `${adjust(percentY, 0, 100, 35, 65)}%`);
    wrap.style.setProperty('--rotate-x', `${round(-(centerX / 5))}deg`);
    wrap.style.setProperty('--rotate-y', `${round(centerY / 5)}deg`);
  }, []);

  const handlePointerLeave = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.style.setProperty('--rotate-x', `0deg`);
    wrap.style.setProperty('--rotate-y', `0deg`);
    wrap.style.setProperty('--pointer-x', `50%`);
    wrap.style.setProperty('--pointer-y', `50%`);
  }, []);

  return (
    <div ref={wrapRef} className={`pc-card-wrapper ${className}`}>
      <div className="pc-behind" />
      <div ref={shellRef} 
           className="pc-card-shell"
           onPointerMove={handlePointerMove}
           onPointerLeave={handlePointerLeave}>
        <section className="pc-card">
          <div className="pc-inside">
            <div className="pc-shine" />
            <div className="pc-glare" />
            <div className="pc-content pc-avatar-content">
              <img className="avatar" src={avatarUrl || "/placeholder.jpg"} alt={name} loading="lazy" />
              <div className="pc-details">
                <h3>{name}</h3>
                <p>{title}</p>
                <div className="pc-desc">{description}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default React.memo(ProfileCardComponent);