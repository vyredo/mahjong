import { MainState, MainStateManager } from "./MainState";
import * as Countdown from "./Countdown";
import { PlayerStateManager } from "./PlayerState";
import { EventCallback, EventMainStateManager, PhaseType } from "./EventManager";

export class Game {
  state = new MainState();
  init() {
    MainStateManager.init(this.state);
  }
  // getter and setter for countdown settings
  countdownSettings(settings?: typeof Countdown.SETTINGS) {
    if (!settings) {
      return Countdown.SETTINGS;
    }
    Countdown.setSettings(settings);
  }

  onNewGame(callback: EventCallback) {
    EventMainStateManager.registerCallback(PhaseType.NewGame, callback);
  }
  onGameEnd(callback: EventCallback) {
    EventMainStateManager.registerCallback(PhaseType.Gameover, callback);
  }

  onShuffe(callback: EventCallback) {
    EventMainStateManager.registerCallback(PhaseType.OrganizeHandsCountdownStart, callback);
  }
  removeShuffe(callback: EventCallback) {
    EventMainStateManager.removeCallback(PhaseType.OrganizeHandsCountdownStart, callback);
  }

  onDealStart(callback: EventCallback) {
    EventMainStateManager.registerCallback(PhaseType.DealCountdownStart, callback);
  }
  removeDealStart(callback: EventCallback) {
    EventMainStateManager.removeCallback(PhaseType.DealCountdownStart, callback);
  }

  onDealEnd(callback: EventCallback) {
    EventMainStateManager.registerCallback(PhaseType.DealCountdownEnd, callback);
  }
  removeDealEnd(callback: EventCallback) {
    EventMainStateManager.removeCallback(PhaseType.DealCountdownEnd, callback);
  }

  // player deal
  playerDeal(params: Parameters<typeof PlayerStateManager.discardTileToTable>) {
    PlayerStateManager.discardTileToTable(...params);
  }

  // player declares
  playerDeclare(params: Parameters<typeof PlayerStateManager.declareAction>) {
    PlayerStateManager.declareAction(...params);
  }
}
