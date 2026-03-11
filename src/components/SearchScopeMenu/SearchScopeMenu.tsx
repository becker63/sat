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
  scopeMenuVisibleAtom,
} from "@/state/searchbar";
import { useEffect, useMemo } from "react";
import {
  menuContainerClass,
  menuControlClass,
  menuHeaderClass,
  menuIndicatorClass,
  menuItemClass,
  menuLabelClass,
  menuSubLabelClass,
} from "@/components/ui";

import { fixtureRegistry } from "@/graph/fixtures";
import { selectedFixtureAtom } from "@/state/fixtureAtom";

type Props = {
  outlineInset: number;
  segmentLength?: number;
};

const MotionBox = motion.create(VStack);

export function SearchScopeMenu({ outlineInset, segmentLength }: Props) {
  const { visible, width, offsetLeft, offsetTop } = useSearchScopeMenu({
    outlineInset,
    segmentLength,
  });

  const flowDragging = useAtomValue(flowDraggingAtom);

  const setMenuHover = useSetAtom(scopeMenuHoverAtom);
  const setMenuVisible = useSetAtom(scopeMenuVisibleAtom);
  const setHover = useSetAtom(hoverOffsetAtom);
  const setAnchor = useSetAtom(hoverAnchorAtom);
  const setPointer = useSetAtom(pointerPositionAtom);

  const setFixture = useSetAtom(selectedFixtureAtom);
  const fixtureState = useAtomValue(selectedFixtureAtom);

  const items = useMemo(() => Object.values(fixtureRegistry), []);

  useEffect(() => {
    console.log("Fixture changed:", fixtureState);
  }, [fixtureState]);

  const content = (
    <AnimatePresence>
      {visible && (
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
              {items.map((fixture) => (
                <motion.div
                  key={fixture.id}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.1 }}
                  style={{ width: "100%" }}
                >
                  <Checkbox.Root
                    checked={fixtureState === fixture.id}
                    onCheckedChange={() => {
                      setFixture(
                        fixtureState === fixture.id ? null : fixture.id,
                      );
                    }}
                    className={menuItemClass}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control className={menuControlClass}>
                      <Checkbox.Indicator className={menuIndicatorClass} />
                    </Checkbox.Control>

                    <Checkbox.Label className={menuLabelClass}>
                      {fixture.label}
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
