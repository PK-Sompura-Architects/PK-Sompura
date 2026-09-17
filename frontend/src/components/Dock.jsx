'use client';

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Grid, Mail, Users } from 'lucide-react';
import './Dock.css';

// --- Internal Helper Components ---
function DockItem({ children, className = '', onClick, label, isActive, mouseX, spring, distance, magnification, baseItemSize }) {
  const ref = useRef(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, val => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  const size = useSpring(targetSize, spring);

  return (
    <motion.button
      ref={ref}
      type="button"
      style={{ width: size, height: size }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`dock-item ${className}`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      {Children.map(children, child => cloneElement(child, { isHovered }))}
    </motion.button>
  );
}

function DockLabel({ children, className = '', ...rest }) {
  const { isHovered } = rest;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered.on('change', latest => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className={`dock-label ${className}`}
          style={{ x: '-50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = '' }) {
  return <div className={`dock-icon ${className}`}>{children}</div>;
}

// --- Main Exported Component ---
export default function Dock() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const items = [
    {
      icon: <img src="/LOGO_2.png" alt="" />,
      label: 'Dashboard',
      path: '/',
    },
    { icon: <Grid size={22} strokeWidth={1.5} />, label: 'Projects', path: '/projects' },
    { icon: <Users size={22} strokeWidth={1.5} />, label: 'The Lineage', path: '/about' },
    { icon: <Mail size={22} strokeWidth={1.5} />, label: 'Inquiry', path: '/inquiry' },
  ].map(item => ({ ...item, onClick: () => navigate(item.path) }));

  // Animation configuration
  const spring = { mass: 0.1, stiffness: 150, damping: 12 };
  const magnification = 70;
  const distance = 150;
  const panelHeight = 68;
  const dockHeight = 256;
  const baseItemSize = 50;

  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(() => Math.max(dockHeight, magnification + magnification / 2 + 4), [magnification, dockHeight]);
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.nav style={{ height, scrollbarWidth: 'none' }} className="dock-outer" aria-label="Primary">
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className="dock-panel"
        style={{ height: panelHeight }}
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            label={item.label}
            isActive={pathname === item.path}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </motion.nav>
  );
}
