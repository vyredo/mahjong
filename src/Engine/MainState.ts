import { Suit, Tile, TileSet, WindSuit, WindType } from "./Tiles";
import { PlayerState, PlayerStateManager } from "./PlayerState";
import { LinkedList } from "linked-list-typescript";
import { v4 as uuidv4 } from "uuid";
import { EventMainStateManager } from "./EventManager";
import { TileAction } from "./TileAction";
import * as Countdown from "./Countdown";

interface Declaration {
  // check how many player can declare, if none , then move to next player
  // if has player declare, then has all of them declare,
  // otherwise wait for timeout
  type: "chi" | "pong" | "kang" | "hoo";
  value: number;
  tiles?: [string, string, string, string] | [string, string, string];
  player: PlayerState;
  playerIdx: 0 | 1 | 2 | 3;
}

export class MainState {
  persistentState = {
    id: uuidv4(),
    gameTotalRound: 1,
    firstBankerIdx: null as 0 | 1 | 2 | 3 | null, // 0, 1, 2, 3
    players: [] as PlayerState[],
  };

  shuffle = {
    countdown: 0,
  };

  turn: {
    // turn 0 is shuffling??
    totalTurn: number; // turn 1 is before banker cast away tile
    playerToDeal: 0 | 1 | 2 | 3;
    countdown: number;
  } = {
    totalTurn: 0,
    playerToDeal: 0,
    countdown: 0,
  };

  declare: {
    playerDeclarations: Declaration[];
    countdown: number;
  } = {
    playerDeclarations: [],
    countdown: 0,
  };

  // tiles
  currentDiscardedTile: {
    tile: Tile;
    prevOwner: PlayerState;
  } | null = null;

  tableTiles: LinkedList<Tile> = new LinkedList(); // convert this to linkedlist so shift() is O(1)
  tableDiscardedTiles: Tile[] = [];

  // phase
  phase: Countdown.PhaseType = Countdown.PhaseType.NewGame;

  prevailingWind: WindType = "East";
  bankerPlayer:
    | {
        player: PlayerState;
        idx: 0 | 1 | 2 | 3;
      }
    | undefined; // banker is decided with dice

  // todo: add history in future
  stateHistories: MainState[] = [];
}

export class MainStateManager {
  static countdownTimeout = 0;

  static reset(state: MainState) {
    // MainStateManager.resetPlayerCountdown(state.countdown.playerBeforeFirstTurnCountdown);
    const persistentState = { ...state.persistentState };
    state = new MainState();
    state.persistentState = persistentState;

    // should persist the order of players, don't create new PlayerState
    state.persistentState.players.forEach((player) => {
      player.hands = [];
      player.revealedTiles = [];
      player.flowerTiles = [];
      player.isBanker = false;
      player.playerWind = null;
    });

    EventMainStateManager.emitEvent("reset", state);
    return state;
  }

  static init(state: MainState) {
    // create players and tiles
    TileSet.init();
    for (let i = 1; i <= 4; i++) {
      const player = new PlayerState();
      player.name = `Player ${i}`;
      state.persistentState.players.push(player);
    }

    Countdown.registerEvent(Countdown.PhaseType.OrganizeHandsCountdownEnd, ({ state }) => {
      // when countdown is over, then move to deal phase
      MainStateManager.DealPhase({ state, initGame: true });
    });
    Countdown.registerEvent(Countdown.PhaseType.DealCountdownEnd, ({ state, shouldSkip }) => {
      console.log(`[DealCountdownEnd], shouldSkip: ${shouldSkip}`);
      if (shouldSkip) {
        // countdown is over, skip player turn
        MainStateManager.forceSkipPlayerTurn(state);
      }

      console.log("running DealPhase");
      // if player click done, then move to declare phase
      MainStateManager.DeclarationPhase(state);
    });
    Countdown.registerEvent(Countdown.PhaseType.DeclareCountdownEnd, ({ state }) => {
      // countdown declare is over, don't autodeclare.
      // some win condition are automatic, TODO:
      const skipTakeFromTable = MainStateManager.executeHighestDeclaration(state);
      MainStateManager.DealPhase({ state, skipTakeFromTable });
    });
    Countdown.registerEvent(Countdown.PhaseType.Gameover, () => {});
    EventMainStateManager.emitEvent("init", state);

    // start first game, refactor the game Phase sequence to be it's own class
    MainStateManager.startFirstGame(state);
  }

  static startFirstGame(state: MainState) {
    MainStateManager.reset(state);
    TileSet.shuffleTableTiles(state);

    const dice = MainStateManager.dealDice();
    const bankerIdx = dice.total % 4;
    MainStateManager.assignBankerAndResetPlayerTurn({ initFirstBanker: bankerIdx, state });
    TileSet.shufflePlayerTiles(state);

    // start countdown for player to organize hands
    Countdown.emitEvent({
      phase: Countdown.PhaseType.OrganizeHandsCountdownStart,
      state,
    });
    EventMainStateManager.emitEvent("firstGame", state);
  }

  static nextGame(state: MainState) {
    if (state.persistentState.firstBankerIdx == null) {
      throw new Error("firstBankerIdx should be assigned");
    }

    // persistanceState should not be reset
    ++state.persistentState.gameTotalRound;

    MainStateManager.reset(state);
    TileSet.shuffleTableTiles(state);

    MainStateManager.assignBankerAndResetPlayerTurn({ state });
    TileSet.shufflePlayerTiles(state);

    // start countdown for player to organize hands
    Countdown.emitEvent({
      phase: Countdown.PhaseType.OrganizeHandsCountdownStart,
      state,
    });
    EventMainStateManager.emitEvent("nextGame", state);
  }

  static forceSkipPlayerTurn(state: MainState) {
    // skip current player
    const player = state.persistentState.players[state.turn.playerToDeal];
    const lastTile = player.hands[player.hands.length - 1];
    console.log("forceSkip", player.name, player.hands.length);
    PlayerStateManager.discardTileToTable(player, state, lastTile);
    console.log("after discard", player.name, player.hands.length);

    EventMainStateManager.emitEvent("skipCurrentPlayer", state);
  }

  static async DealPhase({ state, initGame, skipTakeFromTable }: { state: MainState; initGame?: boolean; skipTakeFromTable?: boolean }) {
    EventMainStateManager.emitEvent("DealPhase", state);

    // reset
    state.turn.totalTurn++;

    // next-player
    if (initGame) {
      // banker is the first one to deal
      if (!state.bankerPlayer) throw new Error("bankerPlayer should be assigned");
      state.turn.playerToDeal = state.bankerPlayer.idx as 0 | 1 | 2 | 3;
    }

    if (!skipTakeFromTable) {
      // take from table for next user
      state.turn.playerToDeal = ((state.turn.playerToDeal + 1) % 4) as 0 | 1 | 2 | 3;
      // getTile for next-player
      PlayerStateManager.getTileFromCollection(state);
    }

    // start countdown for player to deal
    Countdown.emitEvent({
      phase: Countdown.PhaseType.DealCountdownStart,
      state,
    });
  }

  static async runPlayerTurnCountdown(state: MainState) {
    return new Promise((resolve) => {
      state.turn.countdown--;
      if (state.turn.countdown >= 0) {
        clearTimeout(MainStateManager.countdownTimeout);
        MainStateManager.countdownTimeout = setTimeout(() => {
          MainStateManager.runPlayerTurnCountdown(state);
          resolve(null);
          // check valid move for each player
        }, 1000) as unknown as number;
        return;
      } else {
        // force skip after countdown is 0
        resolve(null);
        clearTimeout(MainStateManager.countdownTimeout);
        MainStateManager.forceSkipPlayerTurn(state);
      }
    });
  }

  static async DeclarationPhase(state: MainState) {
    const { tile, prevOwner } = state.currentDiscardedTile!;

    let playerCanDeclare = 0;
    state.persistentState.players.forEach((player) => {
      const tileAction = new TileAction(player.hands);

      // don't validate the prevOwner
      if (player === prevOwner) return;

      const result = tileAction.validDeclaration(tile);
      const canDeclare = result.chi[0] || result.pong[0] || result.kang[0] || result.hoo;

      if (canDeclare) {
        player.validActions = result;
        playerCanDeclare++;

        // auto declare the highest value
        // =========================== TODO remove auto declare ===========================

        if (result.hoo) {
          // hoo does not need tile
          PlayerStateManager.declareAction(player, state, "hoo", [] as any);
          return;
        }

        let tiles: [string, string, string, string] | [string, string, string];
        if (result.kang[0] && result.kang[1]) {
          tiles = result.kang[1];
          PlayerStateManager.declareAction(player, state, "kang", tiles);
        } else if (result.pong[0] && result.pong[1]) {
          tiles = result.pong[1];
          PlayerStateManager.declareAction(player, state, "pong", tiles);
        } else if (result.chi[0] && result.chi[1]) {
          tiles = result.chi[1][0];
          PlayerStateManager.declareAction(player, state, "chi", tiles);
        }

        console.log(`[AUTO DECLARE] done`);
        // auto declare the highest value
        // =========================== TODO remove auto declare ===========================
      }
    });

    if (playerCanDeclare === 0) {
      console.log("No player can declare, move to next player");
      // no player can declare, then move to next player
      Countdown.emitEvent({
        phase: Countdown.PhaseType.DeclareCountdownEnd,
        state,
      });
      return;
    }

    Countdown.emitEvent({
      phase: Countdown.PhaseType.DeclareCountdownStart,
      state,
    });
  }

  static executeHighestDeclaration(state: MainState) {
    // force skip after countdown is 0
    // check the declaration and player action to declare
    if (state.declare.playerDeclarations.length > 0) {
      // Hoo > Kang > Pong > Chi
      // if multiple player declare, then check the priority

      const HooDeclaration: Declaration[] = [];
      const KangDeclaration: Declaration[] = [];
      const PongDeclaration: Declaration[] = [];
      const ChiDeclaration: Declaration[] = [];

      state.declare.playerDeclarations.forEach((declaration) => {
        if (declaration.type === "kang") {
          KangDeclaration.push(declaration);
        } else if (declaration.type === "pong") {
          PongDeclaration.push(declaration);
        } else if (declaration.type === "chi") {
          ChiDeclaration.push(declaration);
        } else if (declaration.type === "hoo") {
          HooDeclaration.push(declaration);
        }
      });

      let targetDeclaration: Declaration | null = null;
      const currentPlayerIdx = state.turn.playerToDeal;

      // handle multiple Pongs, Kangs, Chis. we find the current player first then move to next player
      const findCurrentPlayer = (declarations: typeof MainState.prototype.declare.playerDeclarations, currentPlayerIdx: number): Declaration => {
        const nextDeclaration = declarations.find((declaration) => declaration.playerIdx === currentPlayerIdx);
        if (!nextDeclaration) {
          return findCurrentPlayer(declarations, (currentPlayerIdx + 1) % 4);
        }
        return nextDeclaration;
      };

      if (HooDeclaration.length > 0) {
        // TODO: no Hoo at the moment
      } else if (KangDeclaration.length > 0) {
        targetDeclaration = findCurrentPlayer(KangDeclaration, currentPlayerIdx);
      } else if (PongDeclaration.length > 0) {
        targetDeclaration = findCurrentPlayer(PongDeclaration, currentPlayerIdx);
      } else if (ChiDeclaration.length > 0) {
        targetDeclaration = findCurrentPlayer(ChiDeclaration, currentPlayerIdx);
      }

      if (!targetDeclaration) throw new Error("targetDeclaration should be assigned");

      const { player, tiles, type } = targetDeclaration;
      if (type === "hoo" || tiles == null) {
        throw new Error("hoo should be handled in TileAction, TODO");
      }
      if (!state.currentDiscardedTile?.tile) throw new Error("currentDiscardedTile should be assigned");

      const playerIdx = state.persistentState.players.indexOf(player);
      player.hands.push(state.currentDiscardedTile.tile);
      PlayerStateManager.revealTile(player, tiles, type);

      state.turn.playerToDeal = playerIdx as 0 | 1 | 2 | 3;
      // reset player declaration
      state.declare.playerDeclarations = [];
      return true;
    }

    return false;
  }

  static dealDice() {
    const dice1 = (Math.round(Date.now() + Math.random()) % 6) + 1;
    const dice2 = (Math.round(Date.now() + Math.random()) % 6) + 1;
    const dice3 = (Math.round(Date.now() + Math.random()) % 6) + 1;
    return {
      dices: [dice1, dice2, dice3],
      total: dice1 + dice2 + dice3,
    };
  }

  static assignBankerAndResetPlayerTurn({ initFirstBanker, state }: { initFirstBanker?: number | null; state: MainState }) {
    let bankerIdx = null;

    // only at beginning of game, we need to assign firstBankerIdx
    if (initFirstBanker != null) {
      bankerIdx = Math.round(Date.now() + Math.random()) % 4;
      state.persistentState.firstBankerIdx = bankerIdx as 0 | 1 | 2 | 3;
    } else {
      bankerIdx = (state.persistentState.firstBankerIdx! + state.persistentState.gameTotalRound - 1) % 4;

      // if turn is back to firstBanker, then we need to change prevailingWind to next one
      if (bankerIdx === state.persistentState.firstBankerIdx) {
        const idx = WindSuit.allTypes.indexOf(state.prevailingWind);
        if (idx == -1) throw new Error("prevailingWind should be one of the WindSuit.allTypes");
        state.prevailingWind = WindSuit.allTypes[(idx + 1) % 4];
      }
    }

    const players = state.persistentState.players;

    state.bankerPlayer = {
      player: players[bankerIdx],
      idx: bankerIdx as 0 | 1 | 2 | 3,
    };
    players[bankerIdx].isBanker = true;
    players[bankerIdx].playerWind = "East";
    // assign wind to other players
    for (let i = 0; i < 4; i++) {
      if (i === bankerIdx) continue;
      const player = players[i];
      const windIdx = (i - bankerIdx + 4) % 4;
      player.playerWind = WindSuit.allTypes[windIdx];
    }

    // reset player turn
    state.turn.playerToDeal = bankerIdx as 0 | 1 | 2 | 3;
  }
}
