"use client";

import { useHover } from "@use-gesture/react";
import { motion } from "framer-motion";
import {
  useEffect,
  type ComponentType,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useAtomValue } from "jotai";
import { HStack } from "../../../styled-system/jsx";
import { Input, Button } from "@/components/ui";
import { useSearchBar } from "./useSearchBar";
import { SearchScopeMenu } from "../SearchScopeMenu/SearchScopeMenu";
import { flowDraggingAtom } from "@/state/searchbar";
import { reactFlowTheme } from "@/theme/react-flow";
import {
  outlineHoverClass,
  searchBarHiddenClass,
  searchBarShellClass,
  searchBarSvgClass,
  searchButtonClass,
  searchInputClass,
} from "@/components/ui";
import { fixturePromptAtom } from "@/state/fixturePromptAtom";
import { graphPlayingAtom } from "@/state/graphPlayback";
import { useAtom } from "jotai";
import { useSearchScopeMenu } from "../SearchScopeMenu/useSearchScopeMenu";

type Props = {
  onReplay?: (query?: string) => void;
  outlineLockDelayMs?: number;
};

const MotionStack = motion.create(HStack as ComponentType<any>);
const MotionButton = motion.create(Button);
const MotionRect = motion.rect;

const OUTLINE_INSET = 8;
// Match the SearchBar shell radius (var(--radii-l3) = 6px)
const OUTLINE_RADIUS = 6;
const OUTLINE_COLOR = reactFlowTheme.edge.stroke;
/* hover segment length controls scope menu width */
export const HOVER_SEGMENT_LENGTH = 400;
export const OUTLINE_INSET_PX = OUTLINE_INSET;

export default function SearchBar({ onReplay, outlineLockDelayMs }: Props) {
  const flowDragging = useAtomValue(flowDraggingAtom);
  const prompt = useAtomValue(fixturePromptAtom);
  const [playing, setPlaying] = useAtom(graphPlayingAtom);
  const menuState = useSearchScopeMenu({
    outlineInset: OUTLINE_INSET,
    segmentLength: HOVER_SEGMENT_LENGTH,
  });
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
    perimeter,
    size,
    triggerReplay,
    setValue,
    value,
  } = useSearchBar({
    hoverSegmentLength: HOVER_SEGMENT_LENGTH,
    outlineInset: OUTLINE_INSET,
    outlineLockDelay: outlineLockDelayMs,
    onReplay,
    menuState,
  });

  const hidden = flowDragging;

  const svgWidth = size.width;
  const svgHeight = size.height;
  const contentWidth = Math.max(0, svgWidth - OUTLINE_INSET_PX * 2);
  const contentHeight = Math.max(0, svgHeight - OUTLINE_INSET_PX * 2);
  const segmentLength = Math.min(
    HOVER_SEGMENT_LENGTH,
    contentWidth || HOVER_SEGMENT_LENGTH,
  );
  const dashGap = Math.max(
    1,
    Math.max(perimeter - segmentLength, segmentLength),
  );

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

  useEffect(() => {
    setValue(prompt);
  }, [prompt, setValue]);

  return (
    <MotionStack
      ref={containerRef}
      {...bindHover()}
      data-focused={focused}
      data-hidden={hidden}
      data-testid="searchbar"
      className={
        hidden
          ? [searchBarShellClass, searchBarHiddenClass]
              .filter(Boolean)
              .join(" ")
          : searchBarShellClass
      }
      onPointerMove={(event: ReactPointerEvent<HTMLDivElement>) =>
        handlePointerMove({ clientX: event.clientX, clientY: event.clientY })
      }
      onPointerEnter={(event: ReactPointerEvent<HTMLDivElement>) =>
        handlePointerMove({ clientX: event.clientX, clientY: event.clientY })
      }
      onPointerLeave={handlePointerLeave}
      animate={{}}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 28,
      }}
    >
      {svgWidth > 0 && svgHeight > 0 && (
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={searchBarSvgClass}
          style={{
            top: -OUTLINE_INSET,
            left: -OUTLINE_INSET,
          }}
          shapeRendering="geometricPrecision"
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
              stroke={OUTLINE_COLOR}
              strokeWidth="1.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              strokeDasharray={`${segmentLength} ${dashGap}`}
              initial={{ opacity: 0, strokeDashoffset: -hoverOffset }}
              animate={{
                opacity: 1,
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
              className={outlineHoverClass}
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
              stroke={OUTLINE_COLOR}
              strokeWidth="1.8"
              vectorEffect="non-scaling-stroke"
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
              stroke={OUTLINE_COLOR}
              strokeWidth="1.8"
            />
          )}
        </svg>
      )}

      <SearchScopeMenu state={menuState} />

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
        className={searchInputClass}
      />

      <MotionButton
        variant="surface"
        onClick={() => setPlaying((p) => !p)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
        className={searchButtonClass}
      >
        {playing ? "Pause" : "Play"}
      </MotionButton>
    </MotionStack>
  );
}
