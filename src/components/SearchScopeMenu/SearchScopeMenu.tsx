import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { VStack, HStack, HStack as Stack } from "../../../styled-system/jsx";
import { useSearchScopeMenu } from "./useSearchScopeMenu";
import { useSetAtom } from "jotai";
import {
  hoverAnchorAtom,
  hoverOffsetAtom,
  pointerPositionAtom,
  scopeMenuHoverAtom,
} from "@/state/searchbar";

type Props = {
  outlineInset: number;
  segmentLength?: number;
  surfaceStyle?: {
    background: string;
    border: string;
    boxShadow: string;
    borderRadius: string;
    backdropFilter: string;
  };
};

const MotionBox = motion.create(VStack);

export function SearchScopeMenu({
  outlineInset,
  segmentLength,
  surfaceStyle = {
    background: "rgba(0,0,0,0.16)",
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.55)",
    borderRadius: "16px",
    backdropFilter: "blur(10px)",
  },
}: Props) {
  const { visible, width, offsetLeft, offsetTop } = useSearchScopeMenu({
    outlineInset,
    segmentLength,
  });
  const setMenuHover = useSetAtom(scopeMenuHoverAtom);
  const setHover = useSetAtom(hoverOffsetAtom);
  const setAnchor = useSetAtom(hoverAnchorAtom);
  const setPointer = useSetAtom(pointerPositionAtom);

  const content = (
    <AnimatePresence>
      {visible && (
        <MotionBox
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.14, ease: "easeOut" }}
          position="absolute"
          top={`${offsetTop}px`}
          left={`${offsetLeft}px`}
          mt="0"
          w={`${Math.max(0, width)}px`}
          p="12px"
          gap="10px"
          borderRadius={surfaceStyle.borderRadius}
          background={surfaceStyle.background}
          border={surfaceStyle.border}
          backdropFilter={surfaceStyle.backdropFilter}
          boxShadow={surfaceStyle.boxShadow}
          data-testid="searchscope-menu"
          data-left={`${offsetLeft}`}
          data-top={`${offsetTop}`}
          data-width={`${Math.max(0, width)}`}
          zIndex={1}
          style={{
            width: `${Math.max(0, width)}px`,
            left: `${offsetLeft}px`,
            top: `${offsetTop}px`,
            position: "absolute",
            backgroundColor: surfaceStyle.background,
            boxShadow: surfaceStyle.boxShadow,
            backdropFilter: surfaceStyle.backdropFilter,
            WebkitBackdropFilter: surfaceStyle.backdropFilter,
            borderRadius: surfaceStyle.borderRadius,
          }}
          onPointerEnter={() => setMenuHover(true)}
          onPointerLeave={() => {
            setMenuHover(false);
            setHover(null);
            setAnchor(null);
            setPointer(null);
          }}
        >
          <HStack justify="space-between" fontSize="14px" color="#fff">
            <span style={{ color: "#fff" }}>Corpus</span>
          </HStack>
          <VStack alignItems="flex-start" gap="8px">
            {["TanStack Query", "Redux Toolkit", "Zustand"].map((label) => (
              <Stack key={label} alignItems="center" gap="8px" color="#fff">
                <input
                  type="checkbox"
                  defaultChecked={label === "TanStack Query"}
                  style={{
                    width: "14px",
                    height: "14px",
                    accentColor: "#9ad4ff",
                  }}
                />
                <span style={{ fontSize: "13px", color: "#fff" }}>{label}</span>
              </Stack>
            ))}
          </VStack>
        </MotionBox>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;

  return createPortal(content, document.body);
}
