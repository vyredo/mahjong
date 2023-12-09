import { Tile, TileSet, WindSuit, WindType } from "./state/Tiles";
import { MainState, MainStateManager } from "./state/MainState";

function main() {
  TileSet.init();

  const mainState = new MainState();
  MainStateManager.firstGame(mainState);
}
main();
