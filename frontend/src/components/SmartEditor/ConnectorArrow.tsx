import React, { useState, useLayoutEffect, useRef } from "react";

interface ConnectorArrowProps {
  startRef: React.RefObject<HTMLElement | null>;
  endRef: React.RefObject<HTMLElement | null>;
  color?: string;
  strokeWidth?: number;
}

const ConnectorArrow: React.FC<ConnectorArrowProps> = ({
  startRef,
  endRef,
  color = "#000000",
  strokeWidth = 1,
}) => {
  const [coords, setCoords] = useState({ x: 0, y1: 0, y2: 0 });
  const requestRef = useRef<number>(null);

  const updatePosition = () => {
    if (startRef.current && endRef.current) {
      const startRect = startRef.current.getBoundingClientRect();
      const endRect = endRef.current.getBoundingClientRect();

      const parentRect = startRef.current
        .closest(".editor-container")
        ?.getBoundingClientRect() || { top: 0, left: 0 };

      setCoords({
        x: (startRect.left + startRect.right) / 2 - parentRect.left,
        y1: startRect.bottom - parentRect.top,
        y2: endRect.top - parentRect.top,
      });
    }
    requestRef.current = requestAnimationFrame(updatePosition);
  };

  useLayoutEffect(() => {
    requestRef.current = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  if (coords.y2 <= coords.y1) return null;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
        overflow: "visible",
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="5"
          orient="auto"
        >
          <path d="M1,1 L9,5 L1,9 L3,5 Z" fill={color} />
        </marker>
        <filter id="arrowGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow layer */}
      <line
        x1={coords.x}
        y1={coords.y1 + 8}
        x2={coords.x}
        y2={coords.y2 - 8}
        stroke={color}
        strokeWidth={strokeWidth + 4}
        strokeOpacity={0.2}
        strokeLinecap="round"
      />

      {/* Main arrow */}
      <line
        x1={coords.x}
        y1={coords.y1 + 8}
        x2={coords.x}
        y2={coords.y2 - 8}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        markerEnd="url(#arrowhead)"
        filter="url(#arrowGlow)"
      />
    </svg>
  );
};

export default ConnectorArrow;
