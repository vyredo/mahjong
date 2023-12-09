import { PlayerState } from "./PlayerState";
import { BambooSuit, CharacterSuit, CircleSuit, DragonSuit, Suit, Tile, WindSuit } from "./Tiles";

enum ValidSuit {
  Dragon = "Dragon",
  Character = "Character",
  Bamboo = "Bamboo",
  Circle = "Circle",
  Wind = "Wind",
}

export type validDeclarationReturn = {
  hoo: boolean;
  pong: [boolean, [string, string, string] | boolean];
  kang: [boolean, [string, string, string, string] | boolean];
  chi: [boolean, [string, string, string][]];
};

export class TileAction {
  tiles: {
    [key in keyof typeof ValidSuit]: any[];
  } = {
    [ValidSuit.Dragon]: [] as DragonSuit[],
    [ValidSuit.Character]: [] as CharacterSuit[],
    [ValidSuit.Bamboo]: [] as BambooSuit[],
    [ValidSuit.Circle]: [] as CircleSuit[],
    [ValidSuit.Wind]: [] as WindSuit[],
  };

  constructor(tiles: Tile[]) {
    for (const tile of tiles) {
      if (tile.type === Suit.Dragon) this.tiles[ValidSuit.Dragon].push(tile as DragonSuit);
      else if (tile.type === Suit.Character) this.tiles[ValidSuit.Character].push(tile as CharacterSuit);
      else if (tile.type === Suit.Bamboo) this.tiles[ValidSuit.Bamboo].push(tile as BambooSuit);
      else if (tile.type === Suit.Circle) this.tiles[ValidSuit.Circle].push(tile as CircleSuit);
      else if (tile.type === Suit.Wind) this.tiles[ValidSuit.Wind].push(tile as WindSuit);
      // else throw new Error("unknown tile type " + JSON.stringify(tile));
    }
  }

  validDeclaration(nextTile: Tile): validDeclarationReturn {
    const sameTile = this.findSameTile(nextTile);
    const consecutive = this.findConsecutive(nextTile);

    return {
      // todo; check for hoo
      hoo: false,
      pong: sameTile.pong,
      kang: sameTile.kang,
      chi: [consecutive.canChi, consecutive.foundTiles],
    };
  }

  validSuit(tile: Tile) {
    const validSuit = tile.type !== Suit.RedFlower && tile.type !== Suit.Animal && tile.type !== Suit.BlackFlower;
    return validSuit;
  }

  findSameTile(nextTile: Tile): {
    pong: [boolean, [string, string, string] | boolean];
    kang: [boolean, [string, string, string, string] | boolean];
  } {
    if (!this.validSuit(nextTile)) {
      return {
        pong: [false, false],
        kang: [false, false],
      };
    }

    const nextTileType = nextTile.type as unknown as ValidSuit;
    let found = 0;
    for (const item of this.tiles[nextTileType]) {
      if (item.value === nextTile.value) {
        found++;
      }
    }

    return {
      pong: [found >= 2, found >= 2 && [nextTile.name, nextTile.name, nextTile.name]],
      kang: [found === 3, found === 3 && [nextTile.name, nextTile.name, nextTile.name, nextTile.name]],
    };
  }

  findConsecutive(nextTile: Tile): { canChi: boolean; foundTiles: [string, string, string][] } {
    if (
      !this.validSuit(nextTile) ||
      // ignore non numeric tiles
      nextTile.type === Suit.Dragon ||
      nextTile.type === Suit.Wind
    ) {
      return {
        canChi: false,
        foundTiles: [],
      };
    }

    const sameTypeTiles: Tile[] = this.tiles[nextTile.type as unknown as ValidSuit];
    const sorted = sameTypeTiles.sort((a, b) => (a.value as number) - (b.value as number));

    // convert to key-value pair
    const obj = sorted.reduce((prev, curr: Tile) => {
      prev[curr.value as number] = curr.name;
      return prev;
    }, {} as { [key: number]: string });

    let foundTiles: [string, string, string][] = [];
    // middle
    if (obj[(nextTile.value as number) - 1] && obj[(nextTile.value as number) + 1]) {
      foundTiles.push([nextTile.name, obj[(nextTile.value as number) - 1], obj[(nextTile.value as number) + 1]]);
    }
    // right
    if (obj[(nextTile.value as number) - 1] && obj[(nextTile.value as number) - 2]) {
      foundTiles.push([obj[(nextTile.value as number) - 2], obj[(nextTile.value as number) - 1], nextTile.name]);
    }
    // left
    if (obj[(nextTile.value as number) + 1] && obj[(nextTile.value as number) + 2]) {
      foundTiles.push([nextTile.name, obj[(nextTile.value as number) + 1], obj[(nextTile.value as number) + 2]]);
    }

    return {
      canChi: foundTiles.length > 0,
      foundTiles,
    };
  }

  canHoo() {
    // TODO: rules are very complex
  }
}
