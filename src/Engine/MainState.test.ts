import { MainState, MainStateManager } from "./MainState";

class NumberRotate {
  constructor(public currentIndex: number) {}
  next() {
    this.currentIndex = (this.currentIndex + 1) % 4;
    return this.currentIndex;
  }
}

afterEach(() => {
  jest.clearAllTimers();
});

test("firstgame, banker has 14 tiles, others have 13 tiles", () => {
  const state = new MainState();
  MainStateManager.init(state);
  MainStateManager.firstGame(state);

  expect(state.persistentState.firstBankerIdx).not.toBe(null);
  const bankerIdx = state.persistentState.firstBankerIdx;
  const num = new NumberRotate(bankerIdx!);

  const players = state.persistentState.players;
  expect(players[bankerIdx!].hands.length).toBe(14);
  expect(players[num.next()].hands.length).toBe(13);
  expect(players[num.next()].hands.length).toBe(13);
  expect(players[num.next()].hands.length).toBe(13);
});

test("for each new game, order of players, id,  should not be changed", () => {});

test(" for each new game, banker has 14 tiles, others have 13 tiles", () => {
  const state = new MainState();
  MainStateManager.init(state);
  MainStateManager.firstGame(state);

  const bankerIdx = state.persistentState.firstBankerIdx;
  expect(state.persistentState.firstBankerIdx).not.toBe(null);
  const numBanker = new NumberRotate(bankerIdx!);

  for (let i = 0; i < 10; i++) {
    MainStateManager.nextGame(state);
    // banker should be rotated
    expect(state.bankerPlayer?.idx).toBe(numBanker.next());
    const currBankerIdx = state.bankerPlayer?.idx;
    const num = new NumberRotate(currBankerIdx!);

    const players = state.persistentState.players;

    // admin must always have East wind
    expect(players[currBankerIdx!].hands.length).toBe(14);
    expect(players[currBankerIdx!].playerWind).toBe("East");

    let nextPlayer = players[num.next()];
    expect(nextPlayer.hands.length).toBe(13);
    expect(nextPlayer.playerWind).toBe("South");

    nextPlayer = players[num.next()];
    expect(nextPlayer.hands.length).toBe(13);
    expect(nextPlayer.playerWind).toBe("West");

    nextPlayer = players[num.next()];
    expect(nextPlayer.hands.length).toBe(13);
    expect(nextPlayer.playerWind).toBe("North");
  }
});

test("after every 4 game the wind should be changed", () => {
  const state = new MainState();
  MainStateManager.init(state);
  MainStateManager.firstGame(state);
  expect(state.prevailingWind).toBe("East");

  for (let i = 0; i < 4; i++) {
    MainStateManager.nextGame(state);
    expect(state.turn.countdown).toBeLessThan(29); // countdown should be reset
  }
  expect(state.prevailingWind).toBe("South");
  for (let i = 0; i < 4; i++) {
    MainStateManager.nextGame(state);
  }
  expect(state.prevailingWind).toBe("West");
  for (let i = 0; i < 4; i++) {
    MainStateManager.nextGame(state);
  }
  expect(state.prevailingWind).toBe("North");
  for (let i = 0; i < 4; i++) {
    MainStateManager.nextGame(state);
  }
  expect(state.prevailingWind).toBe("East");
  for (let i = 0; i < 4; i++) {
    MainStateManager.nextGame(state);
  }
  expect(state.prevailingWind).toBe("South");
});

test("get flower, player hand should be still 13 discard the flower to table", () => {
  const state = new MainState();
  MainStateManager.init(state);
  MainStateManager.firstGame(state);
  const firstBankerIdx = state.persistentState.firstBankerIdx;
  const numRotate = new NumberRotate(firstBankerIdx!);

  for (let i = 0; i < 60; i++) {
    MainStateManager.nextPlayerTurn({ state, forceSkip: true }); // manually trigger nextPlayerTurn

    const currentPlayer = state.persistentState.players[state.turn.playerToDeal];

    expect(state.turn.countdown).toBeLessThan(29);
    expect(state.turn.playerToDeal).toBe(numRotate.next());
  }
});

test("correctly rotate player for each player turn", () => {
  const state = new MainState();
  MainStateManager.init(state);
  MainStateManager.firstGame(state);
  const firstBankerIdx = state.persistentState.firstBankerIdx;

  const numRotate = new NumberRotate(firstBankerIdx!);

  expect(state.turn.playerToDeal).toBe(firstBankerIdx);
  const currentPlayer = state.persistentState.players[state.turn.playerToDeal];
  expect(currentPlayer.hands.length).toBe(14);

  for (let i = 0; i < 60; i++) {
    MainStateManager.nextPlayerTurn({ state, forceSkip: true }); // manually trigger nextPlayerTurn

    const currentPlayer = state.persistentState.players[state.turn.playerToDeal];

    expect(state.turn.countdown).toBeLessThan(29);
    expect(state.turn.playerToDeal).toBe(numRotate.next());
  }

  clearTimeout(MainStateManager.countdownTimeout);
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
test.only("when countdown is 0, player will discard the just picked tile, and move to next player", async () => {
  const state = new MainState();
  state.countdown.playerTurnCountdown = 3;
  MainStateManager.init(state);
  MainStateManager.firstGame(state);

  const firstBankerIdx = state.persistentState.firstBankerIdx;
  expect(state.turn.playerToDeal).toBe(firstBankerIdx);

  const numRotate = new NumberRotate(firstBankerIdx!);

  await sleep(4000);
  expect(state.turn.playerToDeal).toBe(numRotate.next());
  expect(state.currentDiscardedTile).not.toBe(null);
  // done();
});
