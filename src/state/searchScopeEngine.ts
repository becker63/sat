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
  menuShown: boolean;
};

export type ScopeEngineSnapshot = {
  visible: boolean;
  offsetLeft: number;
  offsetTop: number;
  width: number;
  exitTriggered: boolean;
  pointerWithinBand: boolean;
  pointerAbove: boolean;
  dwelling: boolean;
};

const HORIZONTAL_MARGIN = 160;
const MENU_HEIGHT_ESTIMATE = 140;
const OUTSIDE_MARGIN = 48;
export const SHOW_DELAY_MS = 350;

export class SearchScopeEngine {
  private actor: ActorRefFrom<ReturnType<typeof createSearchScopeMachine>>;

  private lastPointerAt: number | null = null;
  private spawnZoneEnteredAt: number | null = null;

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
      menuShown,
    } = input;

    const contentWidth = Math.max(0, size.width - outlineInset * 2);
    const menuWidth =
      Math.min(Math.max(0, segmentLength ?? contentWidth), contentWidth) ||
      contentWidth;

    this.lastPointerAt = pointer !== null ? now : this.lastPointerAt;

    const barBottom = position.top + size.height - outlineInset * 2;
    const TRIGGER_ZONE_INSIDE = 44;
    const TRIGGER_ZONE_BELOW = 40;

    const horizontalBandHalf = menuWidth / 2 + HORIZONTAL_MARGIN;
    const pointerWithinBandX =
      pointerAbs !== null &&
      pointerAbs.x >= anchorAbsX - horizontalBandHalf &&
      pointerAbs.x <= anchorAbsX + horizontalBandHalf;

    const pointerAbove =
      pointerAbs !== null &&
      pointerAbs.y < barBottom - TRIGGER_ZONE_INSIDE;

    const pointerInSpawnZone =
      pointerAbs !== null &&
      pointerAbs.y >= barBottom - TRIGGER_ZONE_INSIDE &&
      pointerAbs.y <= barBottom + TRIGGER_ZONE_BELOW &&
      pointerWithinBandX;

    if (pointerInSpawnZone && hoverEngaged) {
      if (this.spawnZoneEnteredAt === null) {
        this.spawnZoneEnteredAt = now;
      }
    } else {
      this.spawnZoneEnteredAt = null;
    }

    const dwellTime =
      this.spawnZoneEnteredAt !== null ? now - this.spawnZoneEnteredAt : 0;
    const dwellReady = dwellTime >= SHOW_DELAY_MS;

    const viewportWidth =
      typeof window !== "undefined" && window.innerWidth
        ? window.innerWidth
        : size.width;

    const anchorAbsXClamped = anchorAbsX;
    const desiredLeft = anchorAbsXClamped - menuWidth / 2;
    const clampedLeft = Math.max(
      0,
      Math.min(desiredLeft, viewportWidth - menuWidth),
    );
    const top = position.top + size.height - outlineInset + 8;
    const menuBottom = top + MENU_HEIGHT_ESTIMATE;

    const preSnapshot = this.actor.getSnapshot();
    const machineVisible = preSnapshot.matches("visible");

    const menuLeft = position.left + clampedLeft;
    const menuRightEdge = menuLeft + menuWidth;
    const pointerNearMenu =
      pointerAbs !== null &&
      pointerAbs.x >= menuLeft - OUTSIDE_MARGIN &&
      pointerAbs.x <= menuRightEdge + OUTSIDE_MARGIN &&
      pointerAbs.y >= position.top - OUTSIDE_MARGIN &&
      pointerAbs.y <= menuBottom + OUTSIDE_MARGIN;

    const pointerWithinBarBounds =
      pointer !== null &&
      pointer.y >= 0 &&
      pointer.y <= size.height &&
      pointerAbs !== null &&
      pointerAbs.x >= position.left &&
      pointerAbs.x <= position.left + size.width;

    const wantShow = hoverEngaged && dwellReady && !flowDragging;

    const exitTriggered =
      !flowDragging &&
      machineVisible &&
      !menuHover &&
      !pointerWithinBarBounds &&
      !pointerNearMenu &&
      !pointerInSpawnZone;

    const desiredVisible = machineVisible
      ? !exitTriggered
      : wantShow || menuHover;

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

    const dwelling = this.spawnZoneEnteredAt !== null && !dwellReady && hoverEngaged;

    return {
      visible,
      offsetLeft: latchedLeft,
      offsetTop: top,
      width: menuWidth,
      exitTriggered,
      pointerWithinBand: pointerInSpawnZone,
      pointerAbove,
      dwelling,
    };
  }
}
