import { initCountdown } from "./Countdown";
import { MainState } from "./MainState";
import { PlayerState } from "./PlayerState";
import { validDeclarationReturn } from "./TileAction";
import { Tile } from "./Tiles";
import { PhaseType } from "./Types";
interface Metadata {
  shouldSkip?: boolean;
  tileFromCollection?: Tile;
  caller?: string;
  declarationResult?: {
    result: validDeclarationReturn;
    player: PlayerState;
  };
}
export type EventCallbackParams = { phase: string | PhaseType; state: MainState; meta?: Metadata };
export type EventCallback = ({ phase, state }: EventCallbackParams) => void;

let caller: string[] = [];
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

  static emitEvent(event: string, state: MainState, meta?: Metadata) {
    // emit for specicif event, for now only internal MainState use this
    const callbacks = EventMainStateManager.callbacks.get(event);

    // update state.phase
    if (state) {
      state.phase = event as PhaseType;
      // need to concat the caller
    }
    if (meta?.caller) {
      caller.push(meta.caller);
    }

    console.log("event", event, "caller: ", JSON.stringify(caller), state);
    const anyCallbacks = EventMainStateManager.callbacks.get("ANY");
    // tell all clients about the event, and the run internal callback
    if (anyCallbacks) {
      anyCallbacks.forEach((callback) =>
        callback({
          phase: event,
          state,
          meta,
        })
      );
    }

    if (callbacks) {
      callbacks.forEach((callback) =>
        callback({
          phase: event,
          state,
          meta,
        })
      );
    }

    // start countdown
    if (event === PhaseType.DealCountdownStart || event === PhaseType.OrganizeHandsCountdownStart || event === PhaseType.DeclareCountdownStart) {
      initCountdown(event, state);
    }
  }
}
