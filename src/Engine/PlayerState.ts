import { EventMainStateManager } from "./EventManager";
import { MainState } from "./MainState";
import { validDeclarationReturn } from "./TileAction";
import { Suit, Tile } from "./Tiles";
import { v4 as uuidv4 } from "uuid";
import * as Countdown from "./Countdown";
import { PhaseType } from "./Types";
export class PlayerState {
  hands: Tile[] = []; // concealed hands
  flowerTiles: Tile[] = []; // flower are not part of 13 tiles
  revealedTiles: {
    type: "pong" | "kang" | "chi";
    tiles: Tile[];
  }[] = []; // revealed tiles

  isBanker: boolean = false;
  playerWind: "East" | "South" | "West" | "North" | null = null;
  validActions: validDeclarationReturn | null = null;
  constructor(public playerConnId = uuidv4(), public name?: string) {
    if (!name) {
      this.name = playerConnId;
    }
  }
}

export enum PlayerEvent {
  dealTile = "dealTile",
  getTileFromCollection = "getTileFromCollection",
  getTileFromDiscardedTable = "getTileFromDiscardedTable",
  discardTileToTable = "discardTileToTable",
  declareAction = "declare",
  revealTile = "revealTile", // pong, chi, kang must be revealed if player pick from table
  initHand = "initHand",
  swapTile = "swapTile",
  findFlowerTile = "findFlowerTile",
}

export class PlayerStateManager {
  // auto
  static initHand(p: PlayerState, tableTiles: Tile[]) {
    const takeTile = () => {
      const idx = Date.now() % tableTiles.length;
      const tile = tableTiles[idx];
      tableTiles.splice(idx, 1);

      if (tile.type === Suit.RedFlower || tile.type === Suit.BlackFlower || tile.type === Suit.Animal) {
        p.flowerTiles.push(tile);
        takeTile();
        return;
      }

      p.hands.push(tile);
    };

    // reset hands
    p.hands = [];
    p.revealedTiles = [];
    p.flowerTiles = [];

    for (let i = 0; i < 13; i++) {
      takeTile();
    }

    return tableTiles; // after modified
  }

  // auto
  static validateTiles(p: PlayerState) {
    // both revealed and concealed should combine to 13 or 14
    const concealed = p.hands.length;
    const revealed = p.revealedTiles.reduce((acc, curr) => {
      return acc + curr.tiles.length;
    }, 0);
    const total = revealed + concealed;

    if (total !== 13 && total !== 14) {
      console.log(`ERROR >> revealed and concealed should combine to 13 or 14, ${p.name} has ${total} tiles`);
      // console.log(p);
      // console.log("revealed", JSON.stringify(p.revealedTiles));
      throw new Error(`revealed and concealed should combine to 13 or 14, ${p.name} has ${total} tiles`);
    }
  }

  // auto
  static revealFlowerTile(p: PlayerState, flowerTile: Tile) {
    // if flower or animal immediately add to flowerTile
    if (flowerTile.type === Suit.RedFlower || flowerTile.type === Suit.BlackFlower || flowerTile.type === Suit.Animal) {
      p.flowerTiles.push(flowerTile);
    }
    PlayerStateManager.validateTiles(p);

    // get new tile from table
  }

  // auto
  static includeTileFromCollection(p: PlayerState, tile: Tile) {
    // if flower or animal immediately add to flowerTile
    if (tile.type === Suit.RedFlower || tile.type === Suit.BlackFlower || tile.type === Suit.Animal) {
      throw new Error("SHould not get flower or animal here");
    }

    p.hands.push(tile);
    PlayerStateManager.validateTiles(p);
  }

  // manual
  static discardTileToTable(p: PlayerState, state: MainState, tile: Tile) {
    const idx = p.hands.findIndex((t) => t === tile);
    if (idx === -1) {
      throw new Error("tile not found");
    }
    p.hands.splice(idx, 1);
    state.currentDiscardedTile = {
      tile,
      prevOwner: p,
    };
    PlayerStateManager.validateTiles(p);
    console.log("currentDiscardedTile ", p.name, tile);
    // player is unable to move after discard
    return tile;
  }

  //manual
  static swapTile(p: PlayerState, tile1: Tile, tile2: Tile) {
    const idx1 = p.hands.findIndex((t) => t === tile1);
    const idx2 = p.hands.findIndex((t) => t === tile2);
    if (idx1 === -1 || idx2 === -1) {
      throw new Error("tile not found");
    }
    p.hands[idx1] = tile2;
    p.hands[idx2] = tile1;
    PlayerStateManager.validateTiles(p);
  }

  // manual
  static declareAction(
    p: PlayerState,
    state: MainState,
    type: "hoo" | "pong" | "kang" | "chi" = "chi",
    tiles: [string, string, string] | [string, string, string, string],
    autoDeclare: boolean = false
  ) {
    // guard, if phase is not declare start ignore all actions
    if (!autoDeclare && Countdown.getCurrentPhase() !== PhaseType.DeclareCountdownStart) {
      return;
    }

    let value = 0;

    if (type === "hoo" && p.validActions?.hoo) {
      value = 10;
    } else if (type === "pong" && p.validActions?.pong) {
      value = 3;
    } else if (type === "kang" && p.validActions?.kang) {
      value = 7;
    } else if (type === "chi" && p.validActions?.chi) {
      value = 1;
    }
    console.log(`[DECLARE] ${p.name} ${type} `);

    const playerIdx = state.persistentState.players.findIndex((p) => p.playerConnId === p.playerConnId) as number;

    // guard idx > 0 and < 4
    if (playerIdx === -1) {
      console.error("playerIdx is -1");
    } else if (playerIdx > 3) {
      console.error("playerIdx is > 3");
    }

    state.declare.playerDeclarations.push({ value, type, tiles, player: p, playerIdx: playerIdx as 0 | 1 | 2 | 3 });
  }

  // auto reveal tile after declartion phase
  static revealTile(p: PlayerState, tilesStr: [string, string, string] | [string, string, string, string], type: "pong" | "kang" | "chi") {
    const tile1idx = p.hands.findIndex((t) => t.name === tilesStr[0]);
    console.log("[REVEALED TILES]", p.name, tilesStr);

    const tile1 = p.hands.splice(tile1idx, 1)[0];
    console.log("tile1idx", tile1idx, p.hands.length);
    const tile2idx = p.hands.findIndex((t) => t.name === tilesStr[1]);
    const tile2 = p.hands.splice(tile2idx, 1)[0];
    console.log("tile2idx", tile2idx, p.hands.length);
    const tile3idx = p.hands.findIndex((t) => t.name === tilesStr[2]);
    const tile3 = p.hands.splice(tile3idx, 1)[0];

    console.log("tile3idx", tile3idx, p.hands.length);
    if (tile1idx === -1 || tile2idx === -1 || tile3idx === -1) {
      console.log(p);
      throw new Error("one of tile is not found");
    }

    const tiles = [tile1, tile2, tile3];
    if (type === "kang") {
      const tile4idx = p.hands.findIndex((t) => t.name === tilesStr[3]);
      if (tile4idx === -1) throw new Error("one of tile is not found");
      const tile4 = p.hands.splice(tile4idx, 1)[0];
      tiles.push(tile4);
    }

    // add to revealed
    p.revealedTiles.push({
      type,
      tiles,
    });
    const revealedTilesNum = p.revealedTiles.reduce((acc, curr) => acc + curr.tiles.length, 0);
    console.log(p.name, p.hands.length, revealedTilesNum, p.hands.length + revealedTilesNum);

    // PlayerStateManager.validateTiles(p);
    // reveal tile will remove valid actions
    PlayerStateManager.removeValidActions(p);
  }

  // auto
  private static removeValidActions(p: PlayerState) {
    p.validActions = null;
  }

  // auto
  public static getTileFromCollection(state: MainState): Tile | void {
    console.log("getTileFromCollection >>>>", state.phase);

    if (state.phase !== PhaseType.DealCountdownStart && state.phase !== PhaseType.findFlowerTile) {
      return;
    }

    if (state.tableTiles.length === 15) {
      throw new Error("game over " + state.tableTiles.length);
    }

    const tile = state.tableTiles.removeHead();
    EventMainStateManager.emitEvent(PlayerEvent.getTileFromCollection, state, {
      tileFromCollection: tile,
      caller: "getTileFromCollection",
    });

    const currentPlayer = state.persistentState.players[state.turn.playerToDeal];

    // if flower or animal immediately add to flowerTile
    if (tile.type === Suit.RedFlower || tile.type === Suit.BlackFlower || tile.type === Suit.Animal) {
      console.log(currentPlayer.name, "takeFlowerTile", tile);
      PlayerStateManager.revealFlowerTile(currentPlayer, tile);

      EventMainStateManager.emitEvent(PlayerEvent.findFlowerTile, state, {
        tileFromCollection: tile,
        caller: "findFlowerTile",
      });
      // TODO: call event here just to inform user that flower tile is taken
      return PlayerStateManager.getTileFromCollection(state);
    } else {
      console.log(currentPlayer.name, "take tile ", tile);

      PlayerStateManager.includeTileFromCollection(currentPlayer, tile);
    }

    PlayerStateManager.validateTiles(currentPlayer);
    return tile;
  }
}
