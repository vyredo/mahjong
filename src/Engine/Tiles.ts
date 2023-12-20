import { LinkedList } from "linked-list-typescript";
import { MainState } from "./MainState";
import { PlayerStateManager } from "./PlayerState";
import BambooSheet from "../assets/images/tiles/bamboos.jpg";
import CharacterSheet from "../assets/images/tiles/characters.jpg";
import CircleSheet from "../assets/images/tiles/circles.jpg";
import WindSheet from "../assets/images/tiles/winds.jpg";
import DragonSheet from "../assets/images/tiles/dragons.jpg";
import RedBlackFlowerSheet from "../assets/images/tiles/RedBlackFlower.jpg";
import FlowerAnimal from "../assets/images/tiles/FlowerAnimal.jpg";

console.log("what is BambooSheet", BambooSheet);
export enum Suit {
  Bamboo = "Bamboo",
  Character = "Character",
  Circle = "Circle",
  Wind = "Wind",
  Dragon = "Dragon",
  BlackFlower = "BlackFlower",
  RedFlower = "RedFlower",
  Animal = "Animal",
}

export type Tile = DragonSuit | AnimalSuit | RedFlowerSuit | BlackFlowerSuit | WindSuit | CircleSuit | CharacterSuit | BambooSuit;
export type to9 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type WindType = "East" | "South" | "West" | "North";

/**
 * id: 1 Bamboo, 2 Character, 3 Circle, 4 Wind, 5 Dragon, 6 BlackFlower, 7 RedFlower, 8 Animal
 * value: 1-9  , 1-9       , 1-9    , 1-4  , 1-3    , 1-4         , 1-4        , 1-4
 * variant: 4 for each types except BlackFlower, RedFlower, Animal
 *
 * example: 142 -> Bamboo val=4 variant=2
 * example: 412 -> Wind val=East variant=2
 */
export class BaseSuit {
  name = "";
  imageSrc = "";
  imageIdx = 0;
  dimension = { width: 0, height: 0 };
  position: { x: number; y: number; verticalSpace?: number } = { x: 0, y: 0, verticalSpace: 0 };
}

export class BambooSuit extends BaseSuit {
  type = Suit.Bamboo;
  imageSrc = BambooSheet;
  dimension = { width: 78, height: 100 };
  position = { x: 78.25, y: -2 };
  constructor(public value: to9, public id: number) {
    super();
    this.name = value + "B";
    this.imageIdx = value - 1;
  }
}

export class CharacterSuit extends BaseSuit {
  type = Suit.Character;
  imageSrc = CharacterSheet;
  dimension = { width: 78, height: 100 };
  position = { x: 79.5, y: -5 };
  constructor(public value: to9, public id: number) {
    super();
    this.name = value + "C";
    this.imageIdx = value - 1;
  }
}
export class CircleSuit extends BaseSuit {
  type = Suit.Circle;
  imageSrc = CircleSheet;
  dimension = { width: 78, height: 100 };
  position = { x: 78, y: -5 };
  constructor(public value: to9, public id: number) {
    super();
    this.name = value + "O";
    this.imageIdx = value - 1;
  }
}

export class WindSuit extends BaseSuit {
  type = Suit.Wind;
  imageSrc = WindSheet;
  dimension = { width: 78, height: 100 };
  position = { x: 76.5, y: -5 };
  static allTypes: WindType[] = ["East", "West", "South", "North"];
  constructor(public value: WindType, public id: number) {
    super();
    this.name = value + "W";
    const valueIdx = WindSuit.allTypes.indexOf(value);
    this.imageIdx = valueIdx;
  }
}

export class BlackFlowerSuit extends BaseSuit {
  type = Suit.BlackFlower;
  imageSrc = RedBlackFlowerSheet;
  dimension = { width: 78, height: 100 };
  position = { x: 79.5, y: -5, verticalSpace: 108 };
  static allTypes = ["Spring", "Summer", "Autumn", "Winter"];
  constructor(public value: "Spring" | "Summer" | "Autumn" | "Winter", public id: number) {
    super();
    this.name = value + "BF";
    const valueIdx = BlackFlowerSuit.allTypes.indexOf(value);
    this.imageIdx = valueIdx;
  }
}

export class RedFlowerSuit extends BaseSuit {
  type = Suit.RedFlower;
  imageSrc = FlowerAnimal;
  dimension = { width: 78, height: 100 };
  position = { x: 79.5, y: -5, verticalSpace: 108 };
  static allTypes = ["Plum", "Orchid", "Chrysanthemum", "Bamboo"];
  constructor(public value: "Plum" | "Orchid" | "Chrysanthemum" | "Bamboo", public id: number) {
    super();
    this.name = value + "RF";
    const valueIdx = RedFlowerSuit.allTypes.indexOf(value);
    this.imageIdx = valueIdx;
  }
}

export class AnimalSuit extends BaseSuit {
  type = Suit.Animal;
  imageSrc = FlowerAnimal;
  dimension = { width: 78, height: 100, verticalSpace: 108 };
  position = { x: 79.5, y: -5 };
  static allTypes = ["Rooster", "Cat", "Mouse", "Centipede"];
  constructor(public value: "Rooster" | "Cat" | "Mouse" | "Centipede", public id: number) {
    super();
    this.name = value + "AN";
    const valueIdx = AnimalSuit.allTypes.indexOf(value);
    this.imageIdx = valueIdx;
  }
}

export class DragonSuit extends BaseSuit {
  type = Suit.Dragon;
  imageSrc = DragonSheet;
  dimension = { width: 78, height: 100 };
  position = { x: 77, y: -1 };
  static allTypes = ["Red", "Green", "White"];
  constructor(public value: "Red" | "Green" | "White", public id: number) {
    super();
    this.name = value + "D";
    const valueIdx = DragonSuit.allTypes.indexOf(value);
    this.imageIdx = valueIdx;
  }
}

// 148 tiles
export class TileSet {
  static tiles: Tile[] = [];
  static init() {
    const tiles = [];

    const createAndPushTiles = (
      idx: number,
      arr: string[],
      construct: {
        new (val: any, id: number): any;
      },
      n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
      variant: 1 | 2 | 3 | 4
    ) => {
      const val = arr[idx - 1];
      if (!val) return;

      const id = (n: number) => Number("" + n + (idx + 1) + variant);

      tiles.push(new construct(val, id(n)));
    };

    for (let i = 1; i <= 9; i++) {
      // decorative tiles
      createAndPushTiles(i, BlackFlowerSuit.allTypes, BlackFlowerSuit, 6, 1);
      createAndPushTiles(i, RedFlowerSuit.allTypes, RedFlowerSuit, 7, 1);
      createAndPushTiles(i, AnimalSuit.allTypes, AnimalSuit, 8, 1);

      // 4 variant per each type
      for (let j = 1; j <= 4; j++) {
        const id = (n: number) => Number("" + n + i + j);
        // non-number tiles
        createAndPushTiles(i, WindSuit.allTypes, WindSuit, 4, j as 1 | 2 | 3 | 4);
        createAndPushTiles(i, DragonSuit.allTypes, DragonSuit, 5, j as 1 | 2 | 3 | 4);

        if (i !== 0) {
          // number tiles
          tiles.push(new CircleSuit(i as to9, id(3)));
          tiles.push(new CharacterSuit(i as to9, id(2)));
          tiles.push(new BambooSuit(i as to9, id(1)));
        }
      }
    }
    if (tiles.length !== 148) {
      throw new Error("Wrong number of tiles");
    }
    // assign to Tileset
    TileSet.tiles = tiles;
    return tiles;
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

    TileSet.tileMustbe148(state);
    return shuffleTileset;
  }

  static shufflePlayerTiles(state: MainState) {
    const players = state.persistentState.players;
    players.forEach((player) => {
      const modifiedTableTiles = PlayerStateManager.initHand(player, state.tableTiles.toArray());
      state.tableTiles = new LinkedList(...modifiedTableTiles);
    });
    TileSet.tileMustbe148(state);
  }
  constructor() {}
}
