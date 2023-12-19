import type { MainState } from "./MainState";

export let SETTINGS = {
  declareTimeout: 5,
  dealTimeout: 6,
  organizeHandsTimeout: 7,
};
export function setSettings(newSettings: typeof SETTINGS) {
  SETTINGS = newSettings;
}

export enum PhaseType {
  DealCountdownStart = "DealCountdownStart",
  DealCountdownEnd = "DealCountdownEnd",
  OrganizeHandsCountdownStart = "OrganizeHandsCountdownStart",
  OrganizeHandsCountdownEnd = "OrganizeHandsCountdownEnd",
  DeclareCountdownEnd = "DeclareCountdownEnd",
  DeclareCountdownStart = "DeclareCountdownStart",
  Gameover = "Gameover",
  NewGame = "NewGame",
}

class Timeout {
  phase: PhaseType = PhaseType.Gameover;
  currentTime: number = 0;
  currentMainState: MainState | null = null;
}
export function getCurrentPhase() {
  return TIMEOUT.phase;
}
const TIMEOUT = new Timeout();
let timeoutRef = 0;
export function cancelTimeout() {
  if (timeoutRef) clearTimeout(timeoutRef);
  timeoutRef = 0;
}
export function initCountdown(phase: PhaseType, state: MainState) {
  switch (phase) {
    case PhaseType.Gameover:
    case PhaseType.DeclareCountdownEnd:
    case PhaseType.DealCountdownEnd:
    case PhaseType.OrganizeHandsCountdownEnd:
      return; // exit early for these phases
    case PhaseType.DealCountdownStart:
      TIMEOUT.currentTime = SETTINGS.dealTimeout;
      break;
    case PhaseType.DeclareCountdownStart:
      TIMEOUT.currentTime = SETTINGS.declareTimeout;
      break;
    case PhaseType.OrganizeHandsCountdownStart:
      TIMEOUT.currentTime = SETTINGS.organizeHandsTimeout;
      break;
    default:
      TIMEOUT.currentTime = 0;
      break;
  }
  TIMEOUT.phase = phase;
  TIMEOUT.currentMainState = state;
  console.log(`initCountdown [${phase}]  ${TIMEOUT.currentTime}`);

  runCountdown();
}

// only called from initCountdown
function runCountdown() {
  if (TIMEOUT.currentTime === 0) {
    onExhaustTimeout();
    return;
  }
  console.log(`runnningTimeout [${PhaseType[TIMEOUT.phase]}] ${TIMEOUT.currentTime}`);
  cancelTimeout();
  timeoutRef = setTimeout(() => {
    TIMEOUT.currentTime -= 1;
    runCountdown();
    // console.log(`runnningTimeout [${PhaseType[TIMEOUT.phase]}] ${TIMEOUT.currentTime}`);
  }, 1000) as unknown as number;
}

export function onExhaustTimeout() {
  console.log(`onExhaustTimeout , [${TIMEOUT.phase}],  `);
  if (!TIMEOUT.currentMainState) throw new Error("TIMEOUT.currentMainState is null");

  // cancel all timeout if any
  cancelTimeout();
  TIMEOUT.currentTime = 0;

  let params: EventCallbackParams = { phase: TIMEOUT.phase, state: TIMEOUT.currentMainState, shouldSkip: false };
  if (TIMEOUT.phase === PhaseType.DeclareCountdownStart) {
    TIMEOUT.phase = PhaseType.DeclareCountdownEnd;
    params.phase = PhaseType.DeclareCountdownEnd;
  } else if (TIMEOUT.phase === PhaseType.DealCountdownStart) {
    TIMEOUT.phase = PhaseType.DealCountdownEnd;
    params.phase = PhaseType.DealCountdownEnd;
    params.shouldSkip = true;
    // for deal countdown, we need to skip when timeout is exhausted
  } else if (TIMEOUT.phase === PhaseType.OrganizeHandsCountdownStart) {
    TIMEOUT.phase = PhaseType.OrganizeHandsCountdownEnd;
    params.phase = PhaseType.OrganizeHandsCountdownEnd;
  }

  console.log(`onExhaustTimeout executing , [${TIMEOUT.phase}], `);

  if (!TIMEOUT.currentMainState) throw new Error("TIMEOUT.currentMainState is null");
  emitEvent(params);
}

// ======================== EVENT MAP move to another file ========================
export type EventCallbackParams = { phase: PhaseType; state: MainState; shouldSkip?: boolean };
export type EventCallback = ({ phase, state }: EventCallbackParams) => void;
const eventMap = new Map<PhaseType, Array<EventCallback>>();
export const registerEvent = (phase: PhaseType, callback: EventCallback) => {
  const callbacks = eventMap.get(phase);
  if (callbacks) {
    callbacks.push(callback);
  } else {
    eventMap.set(phase, [callback]);
  }
};

export const removeEvent = (phase: PhaseType, callback: EventCallback) => {
  const callbacks = eventMap.get(phase);
  if (callbacks) {
    const idx = callbacks.indexOf(callback);
    if (idx !== -1) {
      callbacks.splice(idx, 1);
    }
  }
};

export const emitEvent = (params: EventCallbackParams) => {
  console.log(`"emitEvent", [${params.phase}]`);
  const callbacks = eventMap.get(params.phase); // change phase, run all callbacks that match the phase
  if (callbacks) {
    callbacks.forEach((callback) => callback(params));
  }
  initCountdown(params.phase, params.state);
};
