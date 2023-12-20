import { initCountdown } from "./Countdown";
import { MainState } from "./MainState";
import { PhaseType } from "./Types";
console.log("enum PhaseType .>>");

console.log("enum PhaseType", PhaseType);
export type EventCallbackParams = { phase: string | PhaseType; state: MainState; shouldSkip?: boolean };
export type EventCallback = ({ phase, state }: EventCallbackParams) => void;

export class EventMainStateManager {
  static mapConnIdToWs: Map<string, WebSocket> = new Map();

  static callbacks = new Map<string | PhaseType, Array<EventCallback>>();
  static onAnyEventCallback = (cb: EventCallback) => {
    const callbacks = EventMainStateManager.callbacks.get("ANY");
    if (callbacks) {
      callbacks.push(cb);
    } else {
      EventMainStateManager.callbacks.set("ANY", [cb]);
    }
  };

  static registerCallback(event: string, callback: EventCallback) {
    const callbacks = EventMainStateManager.callbacks.get(event);
    if (callbacks) {
      callbacks.push(callback);
    } else {
      EventMainStateManager.callbacks.set(event, [callback]);
    }
  }

  static removeCallback(event: string, callback: EventCallback) {
    const callbacks = EventMainStateManager.callbacks.get(event);
    if (callbacks) {
      const idx = callbacks.indexOf(callback);
      if (idx !== -1) {
        callbacks.splice(idx, 1);
      }
    }
  }

  static emitEvent(event: string, state: MainState) {
    // emit for specicif event, for now only internal MainState use this
    const callbacks = EventMainStateManager.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach((callback) =>
        callback({
          phase: event,
          state,
        })
      );
    }
    const anyCallbacks = EventMainStateManager.callbacks.get("ANY");
    console.log("event", event, "anyCallbacks", state);
    if (anyCallbacks) {
      anyCallbacks.forEach((callback) =>
        callback({
          phase: event,
          state,
        })
      );
    }

    // start countdown
    if (event === PhaseType.DealCountdownStart || event === PhaseType.OrganizeHandsCountdownStart || event === PhaseType.DeclareCountdownStart) {
      initCountdown(event, state);
    }
  }
}
