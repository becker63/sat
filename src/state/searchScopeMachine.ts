import { assign, setup } from "xstate";

type UpdateEvent = {
  type: "UPDATE";
  visible: boolean;
  left: number;
  top: number;
  width: number;
};

type HideEvent = { type: "FORCE_HIDE" };

type Events = UpdateEvent | HideEvent;

type Context = {
  visible: boolean;
  latchedLeft: number | null;
  lastLeft: number | null;
  top: number;
  width: number;
};

export const createSearchScopeMachine = () =>
  setup({
    types: {} as {
      context: Context;
      events: Events;
    },
      actions: {
        assignFromUpdate: assign({
        visible: ({ event }) => (event.type === "UPDATE" ? event.visible : false),
        lastLeft: ({ event, context }) => {
          if (event.type !== "UPDATE") return context.lastLeft;
          if (context.visible) return context.lastLeft;
          return event.left;
        },
        top: ({ event, context }) =>
          event.type === "UPDATE" ? event.top : context.top,
        width: ({ event, context }) =>
          event.type === "UPDATE" ? event.width : context.width,
        latchedLeft: ({ context, event }) => {
          if (event.type !== "UPDATE") return null;
          if (!event.visible) return null;
          return context.latchedLeft ?? context.lastLeft ?? event.left;
        },
      }),
      clearLatch: assign({
        latchedLeft: () => null,
        visible: () => false,
      }),
    },
  }).createMachine({
    id: "searchScopeMenu",
    initial: "hidden",
    context: {
      visible: false,
      latchedLeft: null,
      lastLeft: null,
      top: 0,
      width: 0,
    },
    states: {
      hidden: {
        on: {
          UPDATE: [
            {
              guard: ({ event }) => event.visible,
              target: "visible",
              actions: ["assignFromUpdate"],
            },
            {
              actions: ["assignFromUpdate", "clearLatch"],
            },
          ],
        },
      },
      visible: {
        entry: ["assignFromUpdate"],
        on: {
          UPDATE: [
            {
              guard: ({ event }) => event.visible,
              actions: ["assignFromUpdate"],
            },
            {
              target: "hidden",
              actions: ["clearLatch"],
            },
          ],
          FORCE_HIDE: {
            target: "hidden",
            actions: ["clearLatch"],
          },
        },
      },
    },
  });
