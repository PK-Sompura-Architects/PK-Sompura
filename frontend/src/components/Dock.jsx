import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Grid, Mail, MapPin } from 'lucide-react';
import './Dock.css';

const BASE_SIZE = 50;
const MAX_SIZE = 70;
const FALLOFF = 150;

/**
 * macOS-style magnifying dock. The magnification is written straight to
 * each item's style inside one rAF, and CSS transitions do the smoothing —
 * previously this pulled in `motion` (129kB) for the same effect.
 */
export default function Dock() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const panelRef = useRef(null);
  const itemsRef = useRef([]);
  const raf = useRef(0);

  const items = [
    { icon: <img src="/LOGO_2.png" alt="" />, label: 'Dashboard', path: '/' },
    { icon: <Grid size={22} strokeWidth={1.5} />, label: 'Projects', path: '/projects' },
    { icon: <MapPin size={22} strokeWidth={1.5} />, label: 'Across India', path: '/about' },
    { icon: <Mail size={22} strokeWidth={1.5} />, label: 'Inquiry', path: '/inquiry' },
  ];

  const applySizes = useCallback((pointerX) => {
    itemsRef.current.forEach((el) => {
      if (!el) return;
      let size = BASE_SIZE;
      if (pointerX !== null) {
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(pointerX - (rect.left + rect.width / 2));
        if (dist < FALLOFF) {
          const t = 1 - dist / FALLOFF;
          size = BASE_SIZE + (MAX_SIZE - BASE_SIZE) * t * t;
        }
      }
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
    });
  }, []);

  const handleMove = useCallback((e) => {
    const x = e.clientX;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => applySizes(x));
  }, [applySizes]);

  const handleLeave = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => applySizes(null));
  }, [applySizes]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <nav className="dock-outer" aria-label="Primary">
      <div
        ref={panelRef}
        className="dock-panel"
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      >
        {items.map((item, i) => (
          <button
            key={item.path}
            type="button"
            ref={(el) => { itemsRef.current[i] = el; }}
            className="dock-item"
            style={{ width: BASE_SIZE, height: BASE_SIZE }}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            aria-current={pathname === item.path ? 'page' : undefined}
          >
            <span className="dock-icon">{item.icon}</span>
            <span className="dock-label" aria-hidden="true">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
