import { MainState, MainStateManager } from "./MainState";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function main() {
  const state = new MainState();
  state.countdown.playerTurnCountdown = 3;
  MainStateManager.init(state);
  MainStateManager.firstGame(state);

  await sleep(4000);
  const phase = state.declare.countdown < 5;

  //   console.log("declare phase", phase);
  //   if (phase) {
  //     state.persistentState.players.forEach((p) => {
  //       console.log("valid actions", p.name, p.validActions);
  //     });
  //   }
}
main();
