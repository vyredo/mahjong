import { hooRules } from "./HooRule";
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
  pong: [boolean, [number, number, number] | false];
  kang: [boolean, [number, number, number, number] | false];
  chi: [boolean, [number, number, number][]];
};

export class TileAction {
  allTiles: Tile[] = [];
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
    this.allTiles = tiles;
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
    const hoo = this.canHoo(nextTile);

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
    pong: [boolean, [number, number, number] | false];
    kang: [boolean, [number, number, number, number] | false];
  } {
    if (!this.validSuit(nextTile)) {
      return {
        pong: [false, false],
        kang: [false, false],
      };
    }

    const nextTileType = nextTile.type as unknown as ValidSuit;
    let found = 0;
    // todo: use binary search
    for (const item of this.tiles[nextTileType]) {
      if (item.id === nextTile.id) {
        found++;
      }
    }

    return {
      pong: [found >= 2, found >= 2 && [nextTile.id, nextTile.id, nextTile.id]],
      kang: [found === 3, found === 3 && [nextTile.id, nextTile.id, nextTile.id, nextTile.id]],
    };
  }

  findConsecutive(nextTile: Tile): { canChi: boolean; foundTiles: [number, number, number][] } {
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
    const sorted = sameTypeTiles.sort((a, b) => (a.id as number) - (b.id as number));

    // convert to key-value pair
    const obj = sorted.reduce((prev, curr: Tile) => {
      prev[curr.id as number] = curr.id;
      return prev;
    }, {} as { [key: number]: number });

    // todo: use ID, and binary search
    let foundTiles: [number, number, number][] = [];
    // middle
    if (obj[(nextTile.id as number) - 1] && obj[(nextTile.id as number) + 1]) {
      foundTiles.push([nextTile.id, obj[(nextTile.id as number) - 1], obj[(nextTile.id as number) + 1]]);
    }
    // right
    if (obj[(nextTile.id as number) - 1] && obj[(nextTile.id as number) - 2]) {
      foundTiles.push([obj[(nextTile.id as number) - 2], obj[(nextTile.id as number) - 1], nextTile.id]);
    }
    // left
    if (obj[(nextTile.id as number) + 1] && obj[(nextTile.id as number) + 2]) {
      foundTiles.push([nextTile.id, obj[(nextTile.id as number) + 1], obj[(nextTile.id as number) + 2]]);
    }

    return {
      canChi: foundTiles.length > 0,
      foundTiles,
    };
  }

  canHoo(nextTile: Tile) {
    // TODO: rules are very complex
    let hoo = false;
    Object.keys(hooRules).forEach((key) => {
      console.log(key, hooRules[key as keyof typeof hooRules]);
      const { title, checkFunc } = hooRules[key as keyof typeof hooRules];
      let points = 0;
      // todo: point calculation based on Pong of dragons, pong of wind that match player wind, flower that match player turn, animals

      if (checkFunc(nextTile, this.allTiles, points)) {
        hoo = true;
      }
    });
  }
}
