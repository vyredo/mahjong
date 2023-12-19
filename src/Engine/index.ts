import { Tile, TileSet, WindSuit, WindType } from "./Tiles";
import { MainState, MainStateManager } from "./MainState";

function main() {
  TileSet.init();

  const mainState = new MainState();
  MainStateManager.startFirstGame(mainState);
}
main();
