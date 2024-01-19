import { EventCallbackParams, EventMainStateManager } from "./EventManager";
import type { MainState } from "./MainState";
import { PhaseType } from "./Types";

export let SETTINGS = {
  declareTimeout: 5,
  dealTimeout: 6,
  organizeHandsTimeout: 7,
};
export function setSettings(newSettings: typeof SETTINGS) {
  SETTINGS = newSettings;
}
console.log(PhaseType);
class Timeout {
  phase = PhaseType.Gameover;
  currentTime: number = 0;
  currentMainState: MainState | null = null;
  currentTimeoutId = 0;
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
  state.phase = phase;
  TIMEOUT.currentMainState = state;
  console.log(`initCountdown [${phase}]  ${TIMEOUT.currentTime}`);

  const id = Date.now();
  if (id > TIMEOUT.currentTimeoutId) {
    TIMEOUT.currentTimeoutId = id;
  } else {
    console.error("old id is trying to modify the currenttimeout");
  }

  runCountdown(id);
}

// only called from initCountdown
function runCountdown(id: number) {
  if (TIMEOUT.currentTime === 0) {
    console.log(`timeout is 0 ${id} [${PhaseType[TIMEOUT.phase]}] ${TIMEOUT.currentTime}`);
    cancelTimeout();
    onExhaustTimeout(id);
    return;
  }

  console.log(`runnningTimeout ${id} [${PhaseType[TIMEOUT.phase]}] ${TIMEOUT.currentTime}`);
  cancelTimeout();
  timeoutRef = setTimeout(() => {
    TIMEOUT.currentTime -= 1;
    runCountdown(id);
    // console.log(`runnningTimeout [${PhaseType[TIMEOUT.phase]}] ${TIMEOUT.currentTime}`);
  }, 1000) as unknown as number;
}

export function onExhaustTimeout(id: number) {
  if (id < TIMEOUT.currentTimeoutId) {
    console.error("receiving timeout from previous phase, ignore");
    return;
  }
  console.log(`onExhaustTimeout , [${TIMEOUT.phase}],  ${id}`);
  if (!TIMEOUT.currentMainState) throw new Error("TIMEOUT.currentMainState is null");

  // cancel all timeout if any
  cancelTimeout();
  TIMEOUT.currentTime = 0;

  let shouldSkip = false;
  let params: EventCallbackParams = { phase: TIMEOUT.phase, state: TIMEOUT.currentMainState };
  if (TIMEOUT.phase === PhaseType.DeclareCountdownStart) {
    TIMEOUT.phase = PhaseType.DeclareCountdownEnd;
    TIMEOUT.currentMainState.phase = PhaseType.DeclareCountdownEnd;
    params.phase = PhaseType.DeclareCountdownEnd;
  } else if (TIMEOUT.phase === PhaseType.DealCountdownStart) {
    TIMEOUT.phase = PhaseType.DealCountdownEnd;
    TIMEOUT.currentMainState.phase = PhaseType.DealCountdownEnd;
    params.phase = PhaseType.DealCountdownEnd;
    shouldSkip = true;
    // for deal countdown, we need to skip when timeout is exhausted
  } else if (TIMEOUT.phase === PhaseType.OrganizeHandsCountdownStart) {
    TIMEOUT.phase = PhaseType.OrganizeHandsCountdownEnd;
    TIMEOUT.currentMainState.phase = PhaseType.OrganizeHandsCountdownEnd;
    params.phase = PhaseType.OrganizeHandsCountdownEnd;
  }

  if (!TIMEOUT.currentMainState) throw new Error("TIMEOUT.currentMainState is null");
  console.log(`onExhaustTimeout executing , [${TIMEOUT.phase}], ${id} `);
  EventMainStateManager.emitEvent(params.phase, params.state, { shouldSkip, caller: `onExhaustTime ${TIMEOUT} ${id}` });
}
