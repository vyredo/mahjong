import { MainState } from "./MainState";

export class EventMainStateManager {
  static mapConnIdToWs: Map<string, WebSocket> = new Map();

  static callbacks = new Map<string, Array<(event: string, s: MainState) => void>>();
  static onAnyEventCallback = (cb: (event: string, s: MainState) => void) => {
    const callbacks = EventMainStateManager.callbacks.get("ANY");
    if (callbacks) {
      callbacks.push(cb);
    } else {
      EventMainStateManager.callbacks.set("ANY", [cb]);
    }
  };
  static registerCallback(event: string, callback: (event: any, s: MainState) => void) {
    const callbacks = EventMainStateManager.callbacks.get(event);
    if (callbacks) {
      callbacks.push(callback);
    } else {
      EventMainStateManager.callbacks.set(event, [callback]);
    }
  }
  static removeCallback(event: string, callback: (event: string, s: MainState) => void) {
    const callbacks = EventMainStateManager.callbacks.get(event);
    if (callbacks) {
      const idx = callbacks.indexOf(callback);
      if (idx !== -1) {
        callbacks.splice(idx, 1);
      }
    }
  }
  static emitEvent(event: string, state: MainState) {
    const callbacks = EventMainStateManager.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(event, state));
    }
    const anyCallbacks = EventMainStateManager.callbacks.get("ANY");
    if (anyCallbacks) {
      anyCallbacks.forEach((callback) => callback(event, state));
    }
  }
}
