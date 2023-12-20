import { TileAction } from "./TileAction";
import { Suit, Tile } from "./Tiles";

const isPair = (tiles: Tile[]) => {
  if (tiles.length !== 2) return false;
  return tiles[0].id === tiles[1].id;
};
const is1Or9 = (tile: Tile) => {
  const isNumeric = tile.type === Suit.Character || tile.type === Suit.Bamboo || tile.type === Suit.Circle;
  return isNumeric && (tile.value === 1 || tile.value === 9);
};
const isWindOrDragon = (tile: Tile) => {
  return tile.type === Suit.Wind || tile.type === Suit.Dragon;
};

const hooRules = {
  "All Chows": {
    title: "All Chows",
    // point is calculated by wind that match player, pong/kang dragon, flower that match player, animal
    checkFunc: (nextTile: Tile, tiles: Tile[], point: number) => {
      const tileAction = new TileAction(tiles);
      const { foundTiles } = tileAction.findConsecutive(nextTile);
      if (foundTiles.length === 4) {
        const clonedTiles = [...tiles, nextTile];
        // check for pair
        foundTiles.forEach((tiles) => {
          tiles.forEach((tile) => {
            // todo: use binary search
            const idx = clonedTiles.findIndex((t) => t.id === tile);
            clonedTiles.splice(idx, 1);
          });
        });

        // the remaining tiles should be a pair
        return isPair(clonedTiles);
      }
    },
  },
  "All Pong/Kang": {
    title: "All Pong/Kang",
    // point is calculated by wind that match player, pong/kang dragon, flower that match player, animal
    checkFunc: (nextTile: Tile, tiles: Tile[]) => {
      const clonedTiles = [...tiles, nextTile];
      while (clonedTiles.length > 0) {
        const tile = clonedTiles.pop();
        if (!tile) return false;
        const tileAction = new TileAction(tiles);
        const { pong, kang } = tileAction.findSameTile(tile);
        // can be a pair
        if (!pong && !kang) {
          // check for pair
          const idx = clonedTiles.findIndex((t) => t.id === tile.id);
          if (idx === -1) return false; // not pair, nor pong nor kang
          clonedTiles.splice(idx, 1);
          continue;
        }

        const foundTiles = pong[1] || kang[1];
        if (!foundTiles) return false;
        foundTiles.forEach((tile) => {
          const idx = clonedTiles.findIndex((t) => t.id === tile);
          clonedTiles.splice(idx, 1);
        });
      }

      return clonedTiles.length === 0;
    },
  },
  "Four Great Blessing": {
    title: "Four Great Blessing",
    // point is calculated by wind that match player, pong/kang dragon, flower that match player, animal
    checkFunc: (nextTile: Tile, tiles: Tile[]) => {
      tiles.push(nextTile);
      const tileAction = new TileAction(tiles);
      if (tileAction.tiles.Wind.length < 12) return;
      // must have 4 pong/kang
      let foundPongOrKang = 0;
      const clonedtiles = [...tiles];

      while (clonedtiles.length > 0) {
        const tile = clonedtiles.pop();
        // non-wind, just ignore
        if (!tile || tile.type !== Suit.Wind) return false;

        const _tileAction = new TileAction(clonedtiles);
        const { pong, kang } = _tileAction.findSameTile(tile);
        if (pong || kang) foundPongOrKang++;
        const pongOrKang = pong[1] || kang[1];
        if (!pongOrKang) return false;
        pongOrKang.forEach((tileId) => {
          const idx = clonedtiles.findIndex((t) => t.id === tileId);
          clonedtiles.splice(idx, 1);
        });
      }

      return foundPongOrKang === 4;
    },
  },

  "Four Lesser Blessing": {
    title: "Four Lesser Blessing",
    checkFunc: (nextTile: Tile, tiles: Tile[]) => {
      const clonedtiles = [...tiles, nextTile];
      const tileAction = new TileAction(tiles);
      if (tileAction.tiles.Wind.length < 9) return;
      let foundWindPongOrKang = 0;
      let foundNonWindPongOrKang = 0;
      let foundChow = 0;

      while (clonedtiles.length > 0) {
        const tile = clonedtiles.pop();
        if (!tile) return false;
        const _tileAction = new TileAction(clonedtiles);
        const { pong, kang } = _tileAction.findSameTile(tile);
        let chow: number[] | null = null;
        if (pong || kang) {
          if (tile.type === Suit.Wind) foundWindPongOrKang++;
          else foundNonWindPongOrKang++;
        } else {
          if (tile.type === Suit.Wind || tile.type === Suit.Dragon) return false;
          // can be chow
          const { foundTiles } = _tileAction.findConsecutive(tile);
          if (foundTiles.length === 0) continue;
          foundChow++;
          chow = foundTiles[0];
        }

        const pongOrKangOrChow = pong[1] || kang[1] || chow;
        if (!pongOrKangOrChow) return false;
        pongOrKangOrChow.forEach((tileId) => {
          const idx = clonedtiles.findIndex((t) => t.id === tileId);
          clonedtiles.splice(idx, 1);
        });
      }

      return foundWindPongOrKang === 3 && (foundNonWindPongOrKang === 1 || foundChow === 1);
    },
  },

  "Three Great Scholar / Dragons": {
    title: "Three Great Scholar / Dragons",
    checkFunc: (nextTile: Tile, tiles: Tile[]) => {
      const clonedTiles = [...tiles, nextTile];
      const tileAction = new TileAction(tiles);
      if (tileAction.tiles.Dragon.length < 9) return false;
      let foundDragonPongOrKang = 0;
      while (clonedTiles.length > 0) {
        const tile = clonedTiles.pop();
        if (!tile || tile.type !== Suit.Dragon) return false;

        const _tileAction = new TileAction(clonedTiles);
        const { pong, kang } = _tileAction.findSameTile(tile);
        if (tile.type !== Suit.Dragon) continue;
        if (pong || kang) foundDragonPongOrKang++;
        const pongOrKang = pong[1] || kang[1];
        if (!pongOrKang) return false;
        pongOrKang.forEach((tileId) => {
          const idx = clonedTiles.findIndex((t) => t.id === tileId);
          clonedTiles.splice(idx, 1);
        });
      }

      return foundDragonPongOrKang === 3;
    },
  },

  "Three Lesser Scholar / Dragons": {
    title: "Three Lesser Scholar / Dragons",
    checkFunc: (nextTile: Tile, tiles: Tile[]) => {
      const clonedTiles = [...tiles, nextTile];
      const tileAction = new TileAction(tiles);
      if (tileAction.tiles.Dragon.length < 6) return false;
      let foundDragonPongOrKang = 0;
      let foundChow = 0;
      let restTiles: Tile[] = []; // should be pair
      while (clonedTiles.length > 0) {
        const tile = clonedTiles.pop();
        if (!tile || tile.type !== Suit.Dragon) return false;

        const _tileAction = new TileAction(clonedTiles);
        const { pong, kang } = _tileAction.findSameTile(tile);
        let chow: number[] | null = null;
        if (pong || kang) foundDragonPongOrKang++;
        else {
          const { foundTiles } = _tileAction.findConsecutive(tile);
          if (foundTiles.length === 0) {
            restTiles.push(tile); // not chi, not pong, not kang, should be pair
            continue;
          }
          foundChow++;
          chow = foundTiles[0];
        }
        const pongOrKangOrChow = pong[1] || kang[1] || chow;
        if (!pongOrKangOrChow) return false;
        pongOrKangOrChow.forEach((tileId) => {
          const idx = clonedTiles.findIndex((t) => t.id === tileId);
          clonedTiles.splice(idx, 1);
        });
      }

      return foundDragonPongOrKang === 2 && foundChow === 1 && isPair(restTiles);
    },
  },
  "1s & 9s": {
    title: "1s & 9s",
    checkFunc: (nextTile: Tile, tiles: Tile[]) => {
      const clonedTiles = [...tiles, nextTile];

      let restTiles: Tile[] = []; // should be pair
      let foundPong = 0;

      while (clonedTiles.length > 0) {
        const tile = clonedTiles.pop();
        if (!tile) return false;
        if (tile.type !== Suit.Character && tile.type !== Suit.Bamboo && tile.type !== Suit.Circle && tile.value !== 1 && tile.value !== 9) {
          restTiles.push(tile);
          // the rest is not pair, just stop
          if (restTiles.length > 2) return false;
          continue;
        }

        const _tileAction = new TileAction(clonedTiles);
        const { pong } = _tileAction.findSameTile(tile);
        if (pong) {
          const pongOrKang = pong[1];
          if (!pongOrKang) return false;
          foundPong++;
          pongOrKang.forEach((tileId) => {
            const idx = clonedTiles.findIndex((t) => t.id === tileId);
            clonedTiles.splice(idx, 1);
          });
        }
      }

      return foundPong === 3 && isPair(restTiles);
    },
  },

  "Half 1s and 9s": {
    title: "Half 1s and 9s",
    checkFunc: (nextTile: Tile, tiles: Tile[]) => {
      const clonedTiles = [...tiles, nextTile];

      let honourPong = 0;
      let pong1Or9 = 0;
      let restTiles: Tile[] = []; // should be pair

      while (clonedTiles.length > 0) {
        const tile = clonedTiles.pop();
        if (!tile) return false;

        // not wind or dragon and not 1 or 9
        if (!is1Or9(tile) && !isWindOrDragon(tile)) {
          restTiles.push(tile);
          if (restTiles.length > 2) return false; // not pair just stop
          continue;
        }

        const _tileAction = new TileAction(clonedTiles);
        const { pong } = _tileAction.findSameTile(tile);
        if (pong) {
          const pongOrKang = pong[1];
          if (!pongOrKang) return false;

          if (is1Or9(tile)) pong1Or9++;
          else if (isWindOrDragon(tile)) honourPong++;

          pongOrKang.forEach((tileId) => {
            const idx = clonedTiles.findIndex((t) => t.id === tileId);
            clonedTiles.splice(idx, 1);
          });
        }
      }

      return honourPong === 2 && pong1Or9 === 2 && isPair(restTiles);
    },
  },

  "all pair": {
    title: "all pair",
    checkFunc: (nextTile: Tile, tiles: Tile[]) => {
      const clonedTiles = [...tiles, nextTile];

      while (clonedTiles.length > 0) {
        const tile = clonedTiles.pop();
        if (!tile) return false;

        const idx = clonedTiles.findIndex((t) => t.id === tile.id);
        if (idx === -1) return false; // not pair, nor pong nor kang
        clonedTiles.splice(idx, 1);
      }

      return true;
    },
  },
  "13 wonders": {
    title: "13 wonders",
    checkFunc: (nextTile: Tile, tiles: Tile[]) => {
      // sorted, so 1B,9B, 1C,9C, 1O, 9O
      const clonedTiles = [...tiles, nextTile].sort((a, b) => a.id - b.id);
      let result: Tile[] = [];

      let hasDuplicate = false;
      while (clonedTiles.length > 0) {
        const tile = clonedTiles.pop();
        if (!tile) return false;
        if (!is1Or9(tile) && !isWindOrDragon(tile)) return false;

        const idx = clonedTiles.findIndex((t) => t.id === tile.id);
        if (idx >= 0) {
          if (hasDuplicate) return false;
          // found 1 duplicate is fine,
          hasDuplicate = true;
          // just remove the other duplicate and check the rest
          clonedTiles.splice(idx, 1);
        }

        if (result.length % 2 === 0) {
          // get last tile
          const lastTile = result[result.length - 1];
          if (lastTile.name === "1B" && tile.name !== "9B") return false;
          if (lastTile.name === "1C" && tile.name !== "9C") return false;
          if (lastTile.name === "1O" && tile.name !== "9O") return false;
        }
      }

      return true;

      //
    },
  },

  "Half Color": {
    title: "Half Color",
  },

  "Full Color": {
    title: "Full Color", // this is hard
    // point is calculated by wind that match player, pong/kang dragon, flower that match player, animal
    checkFunc: (nextTile: Tile, tiles: Tile[]) => {
      tiles.push(nextTile);
      const tileAction = new TileAction(tiles);
      const allBamboo = tileAction.tiles.Bamboo.length === 14;
      const allCharacter = tileAction.tiles.Character.length === 14;
      const allCircle = tileAction.tiles.Circle.length === 14;
      if (!allBamboo && !allCharacter && !allCircle) return false;

      const clonedTiles = [...tiles];

      while (clonedTiles.length > 0) {
        const tile = clonedTiles.pop();
        if (!tile) return false;
        const tileAction = new TileAction(tiles);
        const { foundTiles } = tileAction.findConsecutive(tile);
        if (foundTiles.length > 0) {
        }

        // const { pong, kang } = tileAction.findSameTile(tile);
      }

      //
    },
  },
};
