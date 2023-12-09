import { Suit, Tile, TileSet, WindSuit, WindType } from "./Tiles";
import { PlayerState, PlayerStateManager } from "./PlayerState";
import { LinkedList } from "linked-list-typescript";
import { v4 as uuidv4 } from "uuid";
import { EventMainStateManager } from "./EventState";
import { TileAction } from "./TileAction";

enum Phase {
  Shuffle,
  Deal, // time for players to deal
  PostDeal,
  Declare, // time for players to declare chi or pong or Kang
  PostDeclare,
}

export class MainState {
  persistentState = {
    id: uuidv4(),
    gameTotalRound: 1,
    firstBankerIdx: null as 0 | 1 | 2 | 3 | null, // 0, 1, 2, 3
    players: [] as PlayerState[],
  };
  countdown = {
    // after first shuffle
    playerBeforeFirstTurnCountdown: 30, // seconds
    playerTurnCountdown: 15, // seconds
    playerDeclareCountdown: 5, // seconds
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
    // check how many player can declare, if none , then move to next player
    // if has player declare, then has all of them declare,
    // otherwise wait for timeout
    playerDeclarations: {
      type: "chi" | "pong" | "kang" | "hoo";
      value: number;
      tiles?: [string, string, string, string] | [string, string, string];
      player: PlayerState;
    }[];
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
  phase: Phase = Phase.Shuffle;

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
    MainStateManager.resetPlayerCountdown(state.countdown.playerBeforeFirstTurnCountdown);
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

    EventMainStateManager.emitEvent("init", state);
  }

  static tileMustbe148(state: MainState) {
    const players = state.persistentState.players;
    const playerTiles = players.map((player) => player.hands.length).reduce((a, b) => a + b, 0);
    const playerConcealedTiles = players.map((player) => player.revealedTiles.length).reduce((a, b) => a + b, 0);
    const flowerTiles = players.map((player) => player.flowerTiles.length).reduce((a, b) => a + b, 0);
    const tableTiles = state.tableTiles.length;
    const tableDiscardedTiles = state.tableDiscardedTiles.length;
    const currentDiscardedTile = state.currentDiscardedTile ? 1 : 0;

    if (playerTiles + tableTiles + tableDiscardedTiles + flowerTiles + playerConcealedTiles + currentDiscardedTile != 148) {
      throw new Error("tileMustbe148");
    }
  }

  static shuffleTableTiles(state: MainState) {
    const tileset = TileSet.tiles.slice();
    const shuffleTileset = new LinkedList<Tile>();
    while (tileset.length > 0) {
      const idx = Math.round(Date.now() + Math.random()) % tileset.length;
      const tile = tileset.splice(idx, 1)[0];
      shuffleTileset.append(tile);
    }

    // change this to linkedlist
    state.tableTiles = shuffleTileset;

    MainStateManager.tileMustbe148(state);
    return shuffleTileset;
  }

  static firstGame(state: MainState) {
    MainStateManager.reset(state);
    MainStateManager.shuffleTableTiles(state);

    const dice = MainStateManager.dealDice();
    const bankerIdx = dice.total % 4;
    MainStateManager.assignBankerAndResetPlayerTurn({ initFirstBanker: bankerIdx, state });
    MainStateManager.shufflePlayerTiles(state);

    MainStateManager.nextPlayerTurn({ state, initGame: true });
    EventMainStateManager.emitEvent("firstGame", state);
  }

  static nextGame(state: MainState) {
    if (state.persistentState.firstBankerIdx == null) {
      throw new Error("firstBankerIdx should be assigned");
    }

    // persistanceState should not be reset
    ++state.persistentState.gameTotalRound;

    MainStateManager.reset(state);
    MainStateManager.shuffleTableTiles(state);

    MainStateManager.assignBankerAndResetPlayerTurn({ state });
    MainStateManager.shufflePlayerTiles(state);
    MainStateManager.nextPlayerTurn({ state, initGame: true });

    EventMainStateManager.emitEvent("nextGame", state);
  }

  static resetPlayerCountdown(count: number) {
    // cancel all timeout
    MainStateManager.countdownTimeout = count;
    clearTimeout(MainStateManager.countdownTimeout);
  }

  static takeTileFromTableAndGiveToPlayer(state: MainState): Tile {
    if (state.tableTiles.length === 15) {
      throw new Error("game over " + state.tableTiles.length);
    }

    const tile = state.tableTiles.removeHead();
    const currentPlayer = state.persistentState.players[state.turn.playerToDeal];

    // if flower or animal immediately add to flowerTile
    if (tile.type === Suit.RedFlower || tile.type === Suit.BlackFlower || tile.type === Suit.Animal) {
      EventMainStateManager.emitEvent("takeFlowerTile", state);
      PlayerStateManager.revealFlowerTile(currentPlayer, tile);
      return MainStateManager.takeTileFromTableAndGiveToPlayer(state);
    } else {
      EventMainStateManager.emitEvent("takeTileFromTableAndGiveToPlayer", state);
      PlayerStateManager.includeTileFromTable(currentPlayer, tile);
    }

    PlayerStateManager.validateTiles(currentPlayer);
    return tile;
  }

  static async nextPlayerTurn({
    state,
    initGame,
    forceSkip,
    skipTakeFromTable,
  }: {
    state: MainState;
    initGame?: boolean;
    forceSkip?: boolean;
    skipTakeFromTable?: boolean;
  }) {
    if (forceSkip) {
      // skip current player
      const player = state.persistentState.players[state.turn.playerToDeal];
      const lastTile = player.hands[player.hands.length - 1];
      console.log("forceSkip", player.name, player.hands.length);
      PlayerStateManager.discardTileToTable(player, state, lastTile);
      console.log("after discard", player.name, player.hands.length);

      EventMainStateManager.emitEvent("skipCurrentPlayer", state);
      MainStateManager.playerDeclarationPhase(state);
      return;
    }

    // reset
    state.turn.totalTurn++;
    MainStateManager.resetPlayerCountdown(state.countdown.playerTurnCountdown);

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
      const tile = MainStateManager.takeTileFromTableAndGiveToPlayer(state);
      if (!tile) throw new Error("tile should be assigned" + tile);
    }

    // reset to default value
    state.turn.countdown = state.countdown.playerTurnCountdown;
    await MainStateManager.runPlayerTurnCountdown(state);
    EventMainStateManager.emitEvent("nextPlayerTurn", state);
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
        MainStateManager.nextPlayerTurn({ state, forceSkip: true });
      }
    });
  }

  static async playerDeclarationPhase(state: MainState) {
    // check if player can declare
    if (!state.currentDiscardedTile) throw new Error("tile should be assigned");
    const { tile, prevOwner } = state.currentDiscardedTile;

    let playerCanDeclare = 0;
    state.persistentState.players.forEach((player) => {
      const tileAction = new TileAction(player.hands);

      // don't validate the prevOwner
      if (player === prevOwner) return;

      const result = tileAction.validDeclaration(tile);
      const canDeclare = result.chi[0] || result.pong[0] || result.kang[0] || result.hoo;

      if (canDeclare) {
        player.canDeclare = true;
        player.validActions = result;
        playerCanDeclare++;

        // auto declare the highest value
        // TODO remove auto declare
        if (result.hoo) {
          PlayerStateManager.declareAction(player, state, "hoo");
        } else if (result.kang[0]) {
          PlayerStateManager.declareAction(player, state, "kang", [tile.name, tile.name, tile.name, tile.name]);
        } else if (result.pong[0]) {
          PlayerStateManager.declareAction(player, state, "pong", [tile.name, tile.name, tile.name]);
        } else if (result.chi[0]) {
          PlayerStateManager.declareAction(player, state, "chi", result.chi[1][0]);
        }
      }
    });

    if (playerCanDeclare === 0) {
      // move to next player
      MainStateManager.stopDeclare(state);
      MainStateManager.nextPlayerTurn({ state });
      console.log("no player can declare");
      return;
    }

    // countdown
    state.declare.countdown = state.countdown.playerDeclareCountdown;
    await MainStateManager.runPlayerDeclareCountdown(state);
  }

  static stopDeclare(state: MainState) {
    state.persistentState.players.forEach((player) => {
      player.canDeclare = false;
    });
  }
  static runPlayerDeclareCountdown(state: MainState) {
    return new Promise((resolve) => {
      state.declare.countdown--;
      if (state.declare.countdown >= 0) {
        clearTimeout(MainStateManager.countdownTimeout);
        MainStateManager.countdownTimeout = setTimeout(() => {
          console.log("declaration phase", state.declare.countdown);
          MainStateManager.runPlayerDeclareCountdown(state);
          // check valid move for each player
        }, 1000) as unknown as number;
        return;
      } else {
        // force skip after countdown is 0
        // check the declaration and player action to declare
        let revealTile = false;
        if (state.declare.playerDeclarations.length > 0) {
          // Hoo > Kang > Pong > Chi
          // if multiple player declare, then check the priority
          state.declare.playerDeclarations.sort((a, b) => {
            return b.value - a.value;
          });
          const { player, tiles, type } = state.declare.playerDeclarations[0];
          if (type === "hoo" || tiles == null) {
            throw new Error("hoo should be handled in TileAction, TODO");
          }
          if (!state.currentDiscardedTile?.tile) throw new Error("currentDiscardedTile should be assigned");

          const playerIdx = state.persistentState.players.indexOf(player);
          player.hands.push(state.currentDiscardedTile.tile);
          PlayerStateManager.revealTile(player, tiles, type);

          state.turn.playerToDeal = playerIdx as 0 | 1 | 2 | 3;
          revealTile = true;
          // reset player declaration
          state.declare.playerDeclarations = [];
          state.declare.countdown = state.countdown.playerDeclareCountdown;
        }

        resolve(null);
        MainStateManager.stopDeclare(state);
        MainStateManager.nextPlayerTurn({ state, skipTakeFromTable: revealTile });
      }
    });
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

  static shufflePlayerTiles(state: MainState) {
    const players = state.persistentState.players;
    players.forEach((player) => {
      const modifiedTableTiles = PlayerStateManager.initHand(player, state.tableTiles.toArray());
      state.tableTiles = new LinkedList(...modifiedTableTiles);
    });
    MainStateManager.tileMustbe148(state);
  }
}
