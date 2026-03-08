import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import * as Checkbox from "@/components/ui/checkbox";
import { VStack, HStack } from "../../../styled-system/jsx";
import { useSearchScopeMenu } from "./useSearchScopeMenu";
import { useAtomValue, useSetAtom } from "jotai";
import {
  hoverAnchorAtom,
  hoverOffsetAtom,
  flowDraggingAtom,
  pointerPositionAtom,
  scopeMenuHoverAtom,
} from "@/state/searchbar";
import { useMemo } from "react";
import {
  menuContainerClass,
  menuControlClass,
  menuHeaderClass,
  menuIndicatorClass,
  menuItemClass,
  menuLabelClass,
  menuSubLabelClass,
} from "@/components/ui";

type Props = {
  outlineInset: number;
  segmentLength?: number;
};

const MotionBox = motion.create(VStack);

export function SearchScopeMenu({
  outlineInset,
  segmentLength,
}: Props) {
  const { visible, width, offsetLeft, offsetTop } = useSearchScopeMenu({
    outlineInset,
    segmentLength,
  });
  const flowDragging = useAtomValue(flowDraggingAtom);
  const setMenuHover = useSetAtom(scopeMenuHoverAtom);
  const setHover = useSetAtom(hoverOffsetAtom);
  const setAnchor = useSetAtom(hoverAnchorAtom);
  const setPointer = useSetAtom(pointerPositionAtom);
  const items = useMemo(
    () => [
      { label: "TanStack Query", defaultChecked: true },
      { label: "Redux Toolkit", defaultChecked: true },
      { label: "Zustand", defaultChecked: false },
    ],
    [],
  );

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
          w={`${Math.max(0, Math.min(480, width))}px`}
          px="18px"
          py="16px"
          gap="14px"
          data-testid="searchscope-menu"
          data-left={`${offsetLeft}`}
          data-top={`${offsetTop}`}
          data-width={`${Math.max(0, width)}`}
          zIndex={1}
          className={menuContainerClass}
          style={{
            width: `${Math.max(0, Math.min(480, width))}px`,
            left: `${offsetLeft}px`,
            top: `${offsetTop}px`,
          }}
          onPointerEnter={() => setMenuHover(true)}
  onPointerLeave={() => {
    setMenuHover(false);
    setHover(null);
            setAnchor(null);
            setPointer(null);
          }}
        >
          <VStack gap="16px" alignItems="flex-start" width="100%">
            <HStack
              justify="space-between"
              fontSize="14px"
              w="100%"
              className={menuHeaderClass}
              lineHeight="1.3"
              px="6px"
            >
              <span>Corpus</span>
              <span className={menuSubLabelClass}>Scope</span>
            </HStack>
            <VStack alignItems="flex-start" gap="12px" w="100%">
              {items.map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                  style={{ width: "100%" }}
                >
                  <Checkbox.Root
                    defaultChecked={item.defaultChecked}
                    className={menuItemClass}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control className={menuControlClass}>
                      <Checkbox.Indicator className={menuIndicatorClass} />
                    </Checkbox.Control>
                    <Checkbox.Label className={menuLabelClass}>
                      {item.label}
                    </Checkbox.Label>
                  </Checkbox.Root>
                </motion.div>
              ))}
            </VStack>
          </VStack>
        </MotionBox>
      )}
    </AnimatePresence>
  );

  if (flowDragging) return null;

  if (typeof document === "undefined") return null;

  return createPortal(content, document.body);
}
