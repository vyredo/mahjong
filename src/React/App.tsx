import { useEffect, useRef, useState } from "react";
import { TileSet } from "../Engine/Tiles";
import { MainState, MainStateManager } from "../Engine/MainState";
import { EventMainStateManager } from "../Engine/EventManager";
import { PlayerState } from "../Engine/PlayerState";

function PlayerHand(player: PlayerState) {
  return (
    <div style={{ display: "flex", gap: 5, margin: 10 }}>
      {player.hands.map((tile) => (
        <div
          onMouseEnter={() => {
            console.log(tile);
          }}
          style={{ border: "1px solid black" }}
        >
          {tile.name}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [count, setCount] = useState(0);

  const mainStateRef = useRef<MainState>();

  useEffect(() => {
    const players: PlayerState[] = [
      new PlayerState("Player 1"),
      new PlayerState("Player 2"),
      new PlayerState("Player 3"),
      new PlayerState("Player 4"),
    ];

    // mounted
    TileSet.init();

    const mainState = (mainStateRef.current = new MainState());
    mainState.persistentState.players = players;
    MainStateManager.startFirstGame(mainState);
    EventMainStateManager.onAnyEventCallback((event, state) => {
      console.log(event, state);
    });
    return () => {
      // unmounted
    };
  }, []);

  if (!mainStateRef.current) return null;
  const mainState = mainStateRef.current as MainState;
  return (
    <>
      <div></div>
      <h1>Vite + React</h1>
      <div>
        {mainState.persistentState.players.map((player) => {
          return (
            <div>
              <div>
                {player.name ?? player.playerConnId} <span>total hand: {player.hands.length}</span>
              </div>
              <PlayerHand {...player} />
            </div>
          );
        })}
      </div>
    </>
  );
}

export default App;
