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
  const mainStateRef = useRef<MainState>();
  const [, setRerender] = useState<any>();
  const [phase, setPhase] = useState<string>("");

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

    MainStateManager.init(mainState);
    MainStateManager.startFirstGame(mainState);
    EventMainStateManager.onAnyEventCallback(({ phase, state }) => {
      console.log(phase, state);
      setPhase(phase);
      setRerender({});
    });
    setRerender({});
    return () => {
      // unmounted
    };
  }, []);

  if (!mainStateRef.current) return null;
  const mainState = mainStateRef.current as MainState;
  return (
    <>
      <div></div>
      <div className="table-container">
        <h3>Table</h3>
        <div>
          Declaration phase: <strong>{phase}</strong>
        </div>
        <div className="table" style={{ width: 500, height: 500, border: "1px solid black" }}></div>
      </div>
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
