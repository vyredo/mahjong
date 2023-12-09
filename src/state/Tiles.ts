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

export class BambooSuit {
  name = "";
  type = Suit.Bamboo;
  constructor(public value: to9) {
    this.name = value + "B";
  }
}

export class CharacterSuit {
  name = "";
  type = Suit.Character;
  constructor(public value: to9) {
    this.name = value + "C";
  }
}
export class CircleSuit {
  name = "";
  type = Suit.Circle;
  constructor(public value: to9) {
    this.name = value + "C";
  }
}

export class WindSuit {
  name = "";
  type = Suit.Wind;
  static allTypes: WindType[] = ["East", "South", "West", "North"];
  constructor(public value: WindType) {
    this.name = value + "W";
  }
}

export class BlackFlowerSuit {
  name = "";
  type = Suit.BlackFlower;
  static allTypes = ["Spring", "Summer", "Autumn", "Winter"];
  constructor(public value: "Spring" | "Summer" | "Autumn" | "Winter") {
    this.name = value + "BF";
  }
}

export class RedFlowerSuit {
  static allTypes = ["Plum", "Orchid", "Chrysanthemum", "Bamboo"];
  name = "";
  type = Suit.RedFlower;
  constructor(public value: "Plum" | "Orchid" | "Chrysanthemum" | "Bamboo") {
    this.name = value + "RF";
  }
}

export class AnimalSuit {
  static allTypes = ["Rooster", "Cat", "Mouse", "Centipede"];
  name = "";
  type = Suit.Animal;
  constructor(public value: "Rooster" | "Cat" | "Mouse" | "Centipede") {
    this.name = value + "AN";
  }
}

export class DragonSuit {
  static allTypes = ["Red", "Green", "White"];
  name = "";
  type = Suit.Dragon;
  constructor(public value: "Red" | "Green" | "White") {
    this.name = value + "D";
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
        new (val: any): any;
      }
    ) => {
      const val = arr[idx];
      if (!val) return;

      tiles.push(new construct(val));
    };

    for (let i = 0; i < 10; i++) {
      // decorative tiles
      createAndPushTiles(i, BlackFlowerSuit.allTypes, BlackFlowerSuit);
      createAndPushTiles(i, RedFlowerSuit.allTypes, RedFlowerSuit);
      createAndPushTiles(i, AnimalSuit.allTypes, AnimalSuit);

      // 4 tiles per each type
      for (let j = 0; j < 4; j++) {
        // non-number tiles
        createAndPushTiles(i, WindSuit.allTypes, WindSuit);
        createAndPushTiles(i, DragonSuit.allTypes, DragonSuit);

        if (i !== 0) {
          // number tiles
          tiles.push(new CircleSuit(i as to9));
          tiles.push(new CharacterSuit(i as to9));
          tiles.push(new BambooSuit(i as to9));
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

  constructor() {}
}
