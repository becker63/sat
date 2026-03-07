"use client";

import { useHover } from "@use-gesture/react";
import { motion } from "framer-motion";
import { type ComponentType, type PointerEvent as ReactPointerEvent } from "react";
import { HStack } from "../../../styled-system/jsx";
import { Input, Button } from "@/components/ui";
import { useSearchBar } from "./useSearchBar";
import { SearchScopeMenu } from "../SearchScopeMenu/SearchScopeMenu";
import { SURFACE_STYLE } from "./surfaceStyle";

type Props = {
  onReplay?: (query?: string) => void;
  outlineLockDelayMs?: number;
};

const MotionStack = motion.create(HStack as ComponentType<any>);
const MotionButton = motion.create(Button);
const MotionRect = motion.rect;

const OUTLINE_INSET = 8;
const OUTLINE_RADIUS = 24;
/* shorter hover line */
export const HOVER_SEGMENT_LENGTH = 240;
export const OUTLINE_INSET_PX = OUTLINE_INSET;

export default function SearchBar({ onReplay, outlineLockDelayMs }: Props) {
  const {
    containerRef,
    focusOrigin,
    focused,
    handleBlur,
    handleFocus,
    handlePointerLeave,
    handlePointerMove,
    hoverOffset,
    hoverPathRef,
    inputRef,
    outlineLocked,
    size,
    triggerReplay,
    setValue,
    value,
  } = useSearchBar({
    hoverSegmentLength: HOVER_SEGMENT_LENGTH,
    outlineInset: OUTLINE_INSET,
    outlineLockDelay: outlineLockDelayMs,
    onReplay,
  });

  const svgWidth = size.width;
  const svgHeight = size.height;

  const bindHover = useHover(({ hovering, event }) => {
    if (hovering) {
      handlePointerMove({
        clientX: event.clientX,
        clientY: event.clientY,
      });
    } else {
      handlePointerLeave();
    }
  });

  return (
    <MotionStack
      ref={containerRef}
      {...bindHover()}
      data-focused={focused}
      alignItems="center"
      gap="12px"
      w="100%"
      h="100%"
      boxSizing="border-box"
      onPointerMove={(event: ReactPointerEvent<HTMLDivElement>) =>
        handlePointerMove({ clientX: event.clientX, clientY: event.clientY })
      }
      onPointerEnter={(event: ReactPointerEvent<HTMLDivElement>) =>
        handlePointerMove({ clientX: event.clientX, clientY: event.clientY })
      }
      onPointerLeave={handlePointerLeave}
      animate={{
        boxShadow: SURFACE_STYLE.boxShadow,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 28,
      }}
      style={{
        position: "relative",
        display: "flex",
        borderRadius: SURFACE_STYLE.borderRadius,
        padding: "12px 28px",
        background: SURFACE_STYLE.background,
        backdropFilter: SURFACE_STYLE.backdropFilter,
        WebkitBackdropFilter: SURFACE_STYLE.backdropFilter,
        border: SURFACE_STYLE.border,
        boxShadow: SURFACE_STYLE.boxShadow,
        overflow: "visible",
      }}
    >
      {svgWidth > 0 && svgHeight > 0 && (
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{
            position: "absolute",
            top: -OUTLINE_INSET,
            left: -OUTLINE_INSET,
            pointerEvents: "none",
            overflow: "visible",
            zIndex: 0,
          }}
        >
          <rect
            ref={hoverPathRef}
            x="0.5"
            y="0.5"
            width={Math.max(0, svgWidth - 1)}
            height={Math.max(0, svgHeight - 1)}
            rx={OUTLINE_RADIUS}
            ry={OUTLINE_RADIUS}
            fill="none"
            stroke="transparent"
            strokeWidth="1"
          />

          {!focused && hoverOffset !== null && (
            <MotionRect
              data-testid="searchbar-outline-hover"
              data-variant="hover"
              data-offset={hoverOffset}
              x="0.5"
              y="0.5"
              width={Math.max(0, svgWidth - 1)}
              height={Math.max(0, svgHeight - 1)}
              rx={OUTLINE_RADIUS}
              ry={OUTLINE_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ opacity: 0, strokeDashoffset: -hoverOffset }}
              animate={{
                opacity: 1,
                strokeDasharray: `${HOVER_SEGMENT_LENGTH} 9999`,
                strokeDashoffset: -hoverOffset,
              }}
              transition={{
                opacity: { duration: 0.08 },
                strokeDashoffset: {
                  type: "spring",
                  stiffness: 180,
                  damping: 30,
                },
              }}
              style={{
                filter: "drop-shadow(0 0 3px rgba(255,255,255,0.12))",
              }}
            />
          )}

          {focused && !outlineLocked && (
            <MotionRect
              data-testid="searchbar-outline-focus"
              data-variant="focus"
              data-focus-origin={focusOrigin}
              x="0.5"
              y="0.5"
              width={Math.max(0, svgWidth - 1)}
              height={Math.max(0, svgHeight - 1)}
              rx={OUTLINE_RADIUS}
              ry={OUTLINE_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.8"
              initial={{
                pathLength: 0,
                pathOffset: focusOrigin,
              }}
              animate={{
                pathLength: 1,
                pathOffset: 0,
              }}
              transition={{
                duration: 0.28,
                ease: "easeOut",
              }}
            />
          )}

          {outlineLocked && (
            <rect
              data-testid="searchbar-outline-locked"
              data-variant="locked"
              x="0.5"
              y="0.5"
              width={Math.max(0, svgWidth - 1)}
              height={Math.max(0, svgHeight - 1)}
              rx={OUTLINE_RADIUS}
              ry={OUTLINE_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.8"
            />
          )}
        </svg>
      )}

      <SearchScopeMenu
        outlineInset={OUTLINE_INSET}
        segmentLength={HOVER_SEGMENT_LENGTH}
        surfaceStyle={SURFACE_STYLE}
      />

      <Input
        ref={inputRef}
        value={value}
        placeholder="Search symbol..."
        onFocus={() => {
          handleFocus();
        }}
        onBlur={() => {
          handleBlur();
        }}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") triggerReplay();
        }}
        style={{
          flex: "1 1 0",
          minWidth: 0,
          height: "48px",
          background: "transparent",
          border: "none",
          outline: "none",
          color: "#eee",
          fontSize: "16px",
          zIndex: 1,
        }}
      />

      <MotionButton
        variant="surface"
        onClick={triggerReplay}
        whileHover={{
          scale: 1.02,
        }}
        whileTap={{ scale: 0.97 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
        style={{
          flex: "0 0 auto",
          height: "48px",
          padding: "0 24px",
          borderRadius: "10px",
          background: "rgba(70,70,70,0.28)",
          border: "1px solid rgba(255,255,255,0.06)",
          color: "#eee",
          zIndex: 1,
        }}
      >
        Replay
      </MotionButton>
    </MotionStack>
  );
}
