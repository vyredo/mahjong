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
  EventMainStateManager.emitEvent(params.phase, params.state);
}
