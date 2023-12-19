import { MainState, MainStateManager } from "./MainState";
import * as Countdown from "./Countdown";
import { PlayerStateManager } from "./PlayerState";

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

  onNewGame(callback: Countdown.EventCallback) {
    Countdown.registerEvent(Countdown.PhaseType.NewGame, callback);
  }
  onGameEnd(callback: Countdown.EventCallback) {
    Countdown.registerEvent(Countdown.PhaseType.Gameover, callback);
  }

  onShuffe(callback: Countdown.EventCallback) {
    Countdown.registerEvent(Countdown.PhaseType.OrganizeHandsCountdownStart, callback);
  }
  removeShuffe(callback: Countdown.EventCallback) {
    Countdown.removeEvent(Countdown.PhaseType.OrganizeHandsCountdownStart, callback);
  }

  onDealStart(callback: Countdown.EventCallback) {
    Countdown.registerEvent(Countdown.PhaseType.DealCountdownStart, callback);
  }
  removeDealStart(callback: Countdown.EventCallback) {
    Countdown.removeEvent(Countdown.PhaseType.DealCountdownStart, callback);
  }

  onDealEnd(callback: Countdown.EventCallback) {
    Countdown.registerEvent(Countdown.PhaseType.DealCountdownEnd, callback);
  }
  removeDealEnd(callback: Countdown.EventCallback) {
    Countdown.removeEvent(Countdown.PhaseType.DealCountdownEnd, callback);
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
