import { MainState, MainStateManager } from "./MainState";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function main() {
  const state = new MainState();

  MainStateManager.init(state);

  await sleep(4000);

  //   console.log("declare phase", phase);
  //   if (phase) {
  //     state.persistentState.players.forEach((p) => {
  //       console.log("valid actions", p.name, p.validActions);
  //     });
  //   }
}
main();
