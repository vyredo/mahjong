import { MainState } from "./MainState";

export class EventMainStateManager {
  static mapConnIdToWs: Map<string, WebSocket> = new Map();
  //   static broadcastEvent(event: string, data: MainState, playerConnId: string) {
  //     const ws = EventStateManager.mapConnIdToWs.get(playerConnId);
  //     if (!ws) {
  //       throw new Error(`cannot find ws for ${playerConnId}`);
  //     }

  //     const msg = JSON.stringify({ event, data });
  //     ws.send(msg);
  //   }

  static callbacks = new Map<string, Array<(event: string, s: MainState) => void>>();
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
  }
}
