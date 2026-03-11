import { createActor, type ActorRefFrom } from "xstate";
import { createSearchScopeMachine } from "./searchScopeMachine";

type Vec2 = { x: number; y: number };

export type ScopeEngineInput = {
  pointer: Vec2 | null;
  pointerAbs: Vec2 | null;
  anchorLocalX: number;
  anchorAbsX: number;
  position: { left: number; top: number };
  size: { width: number; height: number };
  outlineInset: number;
  segmentLength?: number;
  menuHover: boolean;
  hoverEngaged: boolean;
  flowDragging: boolean;
  now: number;
};

export type ScopeEngineSnapshot = {
  visible: boolean;
  offsetLeft: number;
  offsetTop: number;
  width: number;
  exitTriggered: boolean;
  pointerWithinBand: boolean;
  pointerAbove: boolean;
};

const HORIZONTAL_MARGIN = 160;
const HOLD_GRACE_MS = 360;
const POINTER_STALE_MS = 260;
const MENU_HEIGHT_ESTIMATE = 140;
const OUTSIDE_MARGIN = 48;
export const SHOW_DELAY_MS = 140;

export class SearchScopeEngine {
  private actor: ActorRefFrom<ReturnType<typeof createSearchScopeMachine>>;

  private lastBandAt: number | null = null;
  private lastTriggerAt: number | null = null;
  private lastVisibleAt: number | null = null;
  private lastPointerY: number | null = null;
  private lastPointerAt: number | null = null;
  private lastAboveAt: number | null = null;
  private ensureLogBuffers() {
    if (typeof window === "undefined") return null;
    const w = window as any;
    w.__scopeMachineLog = w.__scopeMachineLog ?? [];
    w.__scopeObserverLog = w.__scopeObserverLog ?? [];
    w.__scopeMachineObservers = w.__scopeMachineObservers ?? [];
    return w;
  }

  private log(payload: unknown) {
    const w = this.ensureLogBuffers();
    if (!w) return;
    const entry = payload as any;
    w.__scopeMachineLog.push(entry);
    w.__scopeObserverLog.push(entry);
    const observers = w.__scopeMachineObservers;
    if (Array.isArray(observers)) {
      for (const obs of observers) {
        try {
          obs(entry);
        } catch {
          // ignore observer errors
        }
      }
    }
  }

  constructor() {
    this.actor = createActor(createSearchScopeMachine());
    this.actor.start();
  }

  forceHide() {
    this.lastVisibleAt = null;
    this.actor.send({ type: "FORCE_HIDE" });
  }

  getLastPointerAt() {
    return this.lastPointerAt;
  }

  stop() {
    this.actor.stop();
  }

  update(input: ScopeEngineInput): ScopeEngineSnapshot {
    const {
      pointer,
      pointerAbs,
      anchorLocalX,
      anchorAbsX,
      position,
      size,
      outlineInset,
      segmentLength,
      menuHover,
      hoverEngaged,
      flowDragging,
      now,
    } = input;

    const contentWidth = Math.max(0, size.width - outlineInset * 2);
    const menuWidth =
      Math.min(Math.max(0, segmentLength ?? contentWidth), contentWidth) ||
      contentWidth;

    const movingUp =
      pointer !== null &&
      this.lastPointerY !== null &&
      pointer.y < this.lastPointerY - 1;
    const movingDown =
      pointer !== null &&
      this.lastPointerY !== null &&
      pointer.y > this.lastPointerY + 1;

    this.lastPointerY = pointer?.y ?? null;
    this.lastPointerAt = pointer !== null ? now : this.lastPointerAt;

    const barBottom = position.top + size.height - outlineInset * 2;
    const TRIGGER_ZONE_INSIDE = 6;
    const TRIGGER_ZONE_BELOW = 24;

    const horizontalBandHalf = menuWidth / 2 + HORIZONTAL_MARGIN;
    const pointerWithinBandX =
      pointerAbs !== null &&
      pointerAbs.x >= anchorAbsX - horizontalBandHalf &&
      pointerAbs.x <= anchorAbsX + horizontalBandHalf;
    const pointerAbove =
      pointerAbs !== null &&
      pointerAbs.y < barBottom - TRIGGER_ZONE_INSIDE - 10;
    const pointerWithinBand =
      pointerAbs !== null &&
      pointerAbs.y >= barBottom - TRIGGER_ZONE_INSIDE &&
      pointerAbs.y <= barBottom + TRIGGER_ZONE_BELOW &&
      pointerWithinBandX;

    if (pointerWithinBand) {
      this.lastBandAt = now;
    }
    const bandRecent = this.lastBandAt !== null && now - this.lastBandAt < 260;

    const pastTrigger =
      pointerAbs !== null && pointerAbs.y >= barBottom - 4;
    if (pastTrigger) {
      this.lastTriggerAt = now;
    }
    const triggerRecent =
      this.lastTriggerAt !== null && now - this.lastTriggerAt < 200;

    if (pointerAbove) {
      if (this.lastAboveAt === null) {
        this.lastAboveAt = now;
      }
    } else {
      this.lastAboveAt = null;
    }
    const abovePersistMs =
      this.lastAboveAt !== null ? now - this.lastAboveAt : 0;

    const anchorAbsXClamped = anchorAbsX;
    const viewportWidth =
      typeof window !== "undefined" && window.innerWidth
        ? window.innerWidth
        : size.width;

    const desiredLeft = anchorAbsXClamped - menuWidth / 2;
    const clampedLeft = Math.max(
      0,
      Math.min(desiredLeft, viewportWidth - menuWidth),
    );
    const top = position.top + size.height - outlineInset + 8;
    const menuRight = clampedLeft + menuWidth;
    const menuBottom = top + MENU_HEIGHT_ESTIMATE;

    const pointerWithinBarBounds =
      pointer !== null &&
      pointer.y >= 0 &&
      pointer.y <= size.height &&
      pointerAbs !== null &&
      pointerAbs.x >= position.left &&
      pointerAbs.x <= position.left + size.width;

    const pointerOutsideMenuBounds =
      pointerAbs !== null &&
      (pointerAbs.x < clampedLeft - OUTSIDE_MARGIN ||
        pointerAbs.x > menuRight + OUTSIDE_MARGIN ||
        pointerAbs.y < top - OUTSIDE_MARGIN ||
        pointerAbs.y > menuBottom + OUTSIDE_MARGIN);
    const pointerFarFromBar =
      pointerAbs !== null &&
      (pointerAbs.x < position.left - OUTSIDE_MARGIN ||
        pointerAbs.x > position.left + size.width + OUTSIDE_MARGIN ||
        pointerAbs.y < position.top - OUTSIDE_MARGIN ||
        pointerAbs.y >
          position.top + size.height + MENU_HEIGHT_ESTIMATE + OUTSIDE_MARGIN);
    const pointerStale =
      pointerAbs === null &&
      (this.lastPointerAt === null || now - this.lastPointerAt > POINTER_STALE_MS);

    const preSnapshot = this.actor.getSnapshot();
    const machineVisible = preSnapshot.matches("visible");

    const pointerNearInteraction =
      pointerAbs !== null &&
      pointerAbs.x >= position.left - OUTSIDE_MARGIN &&
      pointerAbs.x <= position.left + size.width + OUTSIDE_MARGIN &&
      pointerAbs.y >= position.top - OUTSIDE_MARGIN &&
      pointerAbs.y <= menuBottom + OUTSIDE_MARGIN;

    const shouldHold =
      menuHover ||
      (machineVisible && (pointerWithinBarBounds || pointerNearInteraction)) ||
      (pointerWithinBand && !pointerAbove) ||
      bandRecent;
    const recentlyVisible =
      this.lastVisibleAt !== null && now - this.lastVisibleAt < HOLD_GRACE_MS;

    const wantShow =
      hoverEngaged &&
      pointerWithinBand &&
      (pastTrigger || triggerRecent);

    const shouldHideBounds =
      !menuHover && !pointerWithinBarBounds && pointerOutsideMenuBounds && !pointerWithinBand;
    const shouldHideFar = pointerFarFromBar && !menuHover;
    const exitTriggered =
      !flowDragging &&
      (shouldHideFar || shouldHideBounds || pointerStale || !shouldHold);

    const desiredVisible = machineVisible
      ? !flowDragging && !exitTriggered
      : !flowDragging &&
        (menuHover || wantShow) &&
        !exitTriggered;

    this.log({
      t: now,
      phase: "event",
      event: {
        type: "UPDATE",
        visible: desiredVisible,
        left: clampedLeft,
        top,
        width: menuWidth,
      },
      state: preSnapshot.value,
      context: preSnapshot.context,
    });

    this.actor.send({
      type: "UPDATE",
      visible: desiredVisible,
      left: clampedLeft,
      top,
      width: menuWidth,
    });

    const actorSnapshot = this.actor.getSnapshot();
    this.log({
      t: now,
      phase: "transition",
      state: actorSnapshot.value,
      context: actorSnapshot.context,
    });
    const visible = actorSnapshot.matches("visible");
    const latchedLeft =
      actorSnapshot.context.latchedLeft ?? actorSnapshot.context.lastLeft ?? clampedLeft;

    if (visible) {
      this.lastVisibleAt = now;
    } else if (exitTriggered) {
      this.lastVisibleAt = null;
    }

    return {
      visible,
      offsetLeft: latchedLeft,
      offsetTop: top,
      width: menuWidth,
      exitTriggered,
      pointerWithinBand,
      pointerAbove,
    };
  }
}
