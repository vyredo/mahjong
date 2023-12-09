import { MainState, MainStateManager } from "./MainState";
import { TileAction, validDeclarationReturn } from "./TileAction";
import { Suit, Tile } from "./Tiles";
import { v4 as uuidv4 } from "uuid";

export class PlayerState {
  name?: string;

  hands: Tile[] = []; // concealed hands
  flowerTiles: Tile[] = []; // flower are not part of 13 tiles
  revealedTiles: {
    type: "pong" | "kang" | "chi";
    tiles: Tile[];
  }[] = []; // revealed tiles

  isBanker: boolean = false;
  playerWind: "East" | "South" | "West" | "North" | null = null;
  canDeclare = false;
  validActions: validDeclarationReturn | null = null;
  constructor(public playerConnId = uuidv4()) {}
}

export class PlayerStateManager {
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

  static validateTiles(p: PlayerState) {
    // both revealed and concealed should combine to 13 or 14
    const concealed = p.hands.length;
    const revealed = p.revealedTiles.reduce((acc, curr) => {
      return acc + curr.tiles.length;
    }, 0);
    const total = revealed + concealed;

    if (total !== 13 && total !== 14) {
      console.log(p);
      console.log("revealed", JSON.stringify(p.revealedTiles));
      throw new Error(`revealed and concealed should combine to 13 or 14, ${p.name} has ${total} tiles`);
    }
  }

  static revealFlowerTile(p: PlayerState, flowerTile: Tile) {
    // if flower or animal immediately add to flowerTile
    if (flowerTile.type === Suit.RedFlower || flowerTile.type === Suit.BlackFlower || flowerTile.type === Suit.Animal) {
      p.flowerTiles.push(flowerTile);
    }
    PlayerStateManager.validateTiles(p);

    // get new tile from table
  }

  static includeTileFromTable(p: PlayerState, tile: Tile) {
    // if flower or animal immediately add to flowerTile
    if (tile.type === Suit.RedFlower || tile.type === Suit.BlackFlower || tile.type === Suit.Animal) {
      throw new Error("SHould not get flower or animal here");
    }

    p.hands.push(tile);
    PlayerStateManager.validateTiles(p);
  }

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

  static declareAction(
    p: PlayerState,
    state: MainState,
    type: "hoo" | "pong" | "kang" | "chi" = "chi",
    tiles?: [string, string, string] | [string, string, string, string]
  ) {
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

    state.declare.playerDeclarations.push({ value, type, tiles, player: p });
  }

  static revealTile(p: PlayerState, tilesStr: [string, string, string] | [string, string, string, string], type: "pong" | "kang" | "chi") {
    const tile1idx = p.hands.findIndex((t) => t.name === tilesStr[0]);
    console.log("tiles", p.name, tilesStr);

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

    // remove from hands

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
    console.log("revealedTiles", revealedTilesNum);
    console.log(p.name, p.hands.length, revealedTilesNum, p.hands.length + revealedTilesNum);

    // PlayerStateManager.validateTiles(p);
    // reveal tile will remove valid actions
    PlayerStateManager.removeValidActions(p);
  }

  static removeValidActions(p: PlayerState) {
    p.validActions = null;
  }
}
