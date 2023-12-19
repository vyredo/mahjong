import { PlayerState } from "./PlayerState";
import { TileAction } from "./TileAction";
import { BambooSuit, CharacterSuit, CircleSuit, to9 } from "./Tiles";

test("cannot find any valid", () => {
  const tiles = [];
  tiles.push(new CharacterSuit(1));
  tiles.push(new CharacterSuit(2));
  for (let i = 1; i < 9; i++) {
    tiles.push(new CircleSuit(i as to9));
  }
  for (let i = 1; i <= 3; i++) {
    tiles.push(new BambooSuit(i as to9));
  }

  const player = new PlayerState();
  player.hands = tiles;

  const tileAction = new TileAction(tiles);

  let nextTile = new CharacterSuit(9);
  let validMoves = tileAction.validDeclaration(nextTile);
  expect(validMoves.chi[0]).toBe(false);
  expect(validMoves.pong[0]).toBe(false);
  expect(validMoves.kang[0]).toBe(false);
  expect(validMoves.pong[1]).toBe(false);
  expect(validMoves.kang[1]).toBe(false);
});

test("can Chi", () => {
  const tiles = [];
  tiles.push(new CharacterSuit(1));
  tiles.push(new CharacterSuit(2));
  for (let i = 1; i < 9; i++) {
    tiles.push(new CircleSuit(i as to9));
  }
  for (let i = 1; i <= 3; i++) {
    tiles.push(new BambooSuit(i as to9));
  }

  const player = new PlayerState();
  player.hands = tiles;

  const tileAction = new TileAction(tiles);

  let nextTile = new CharacterSuit(3);
  let validMoves = tileAction.validDeclaration(nextTile);
  expect(validMoves.chi[0]).toBe(true);
  expect(validMoves.chi[1].length).toBe(1);

  nextTile = new BambooSuit(3);
  validMoves = tileAction.validDeclaration(nextTile);
  expect(validMoves.chi[0]).toBe(true);
  expect(validMoves.chi[1].length).toBe(1);

  nextTile = new CircleSuit(3);
  validMoves = tileAction.validDeclaration(nextTile);
  expect(validMoves.chi[0]).toBe(true);
  expect(validMoves.chi[1].length).toBe(3);

  nextTile = new CircleSuit(2);
  validMoves = tileAction.validDeclaration(nextTile);
  expect(validMoves.chi[0]).toBe(true);
  expect(validMoves.chi[1].length).toBe(2);
});

test("can Pong and Kang", () => {
  const tiles = [];
  tiles.push(new CharacterSuit(1));
  tiles.push(new CharacterSuit(1));
  tiles.push(new CharacterSuit(1));

  for (let i = 1; i < 9; i++) {
    tiles.push(new CircleSuit(i as to9));
  }
  for (let i = 1; i <= 2; i++) {
    tiles.push(new BambooSuit(i as to9));
  }

  const player = new PlayerState();
  player.hands = tiles;

  const tileAction = new TileAction(tiles);

  let nextTile = new CharacterSuit(1);
  let validMoves = tileAction.validDeclaration(nextTile);
  expect(validMoves.chi[0]).toBe(false);
  expect(validMoves.pong[0]).toBe(true);
  expect(validMoves.kang[0]).toBe(true);
});

test("can Pong and Kang and chi", () => {
  const tiles = [];
  tiles.push(new CircleSuit(1));
  tiles.push(new CircleSuit(1));

  for (let i = 1; i < 9; i++) {
    tiles.push(new CircleSuit(i as to9));
  }
  for (let i = 1; i <= 3; i++) {
    tiles.push(new BambooSuit(i as to9));
  }

  const player = new PlayerState();
  player.hands = tiles;

  const tileAction = new TileAction(tiles);

  let nextTile = new CircleSuit(1);
  let validMoves = tileAction.validDeclaration(nextTile);
  expect(validMoves.chi[0]).toBe(true);
  expect(validMoves.chi[1].length).toBe(1);
  expect(validMoves.pong[0]).toBe(true);
  expect(validMoves.kang[0]).toBe(true);
});
