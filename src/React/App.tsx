import React, { useCallback, useEffect, useRef, useState } from "react";
import { type BaseSuit, Suit, Tile, TileSet } from "../Engine/Tiles";
import { MainState, MainStateManager } from "../Engine/MainState";
import { EventMainStateManager } from "../Engine/EventManager";
import { PlayerState, PlayerStateManager } from "../Engine/PlayerState";
import { PhaseType } from "../Engine/Types";

const TileDiv: React.FC<{ tile: Tile; canSelect?: boolean; onSelected?: (t: Tile) => void; selected?: number; selectedTile?: Tile }> = ({
  tile,
  canSelect,
  onSelected,
  selectedTile,
}) => {
  if (!tile) {
    console.error("tile is null");
    return;
  }

  const handleClick = useCallback(() => {
    if (canSelect) {
      onSelected?.(tile);
    }
  }, []);

  // 6c -447.5
  let backgroundPosition = `-${tile.imageIdx * tile.position.x}px ${tile.position.y}px`;
  if (tile.type === Suit.BlackFlower || tile.type === Suit.RedFlower || tile.type === Suit.Animal) {
    backgroundPosition = `${tile.position.x}px ${tile.imageIdx * -(tile as BaseSuit).position.verticalSpace!}px`;
  }

  return (
    <div style={{ position: "relative" }}>
      {selectedTile === tile && (
        <div
          onClick={handleClick}
          style={{ cursor: "pointer", position: "absolute", width: "100%", height: "100%", backgroundColor: "yellow", opacity: 0.5 }}
        ></div>
      )}
      <div
        onMouseEnter={() => {
          console.log(tile);
        }}
        onClick={handleClick}
        style={{
          cursor: canSelect ? "pointer" : "default",
          border: "1px solid black",
          backgroundPosition,
          backgroundImage: `url(${tile.imageSrc})`,
          width: tile.dimension.width,
          height: tile.dimension.height,
          fontWeight: 800,
          color: "red",
        }}
      >
        {tile.name}
      </div>
    </div>
  );
};

function PlayerHand(player: PlayerState) {
  console.log("PLAYER HAND >>>> ", JSON.stringify(player.hands.map((t) => t.id)));

  const [selectedTiles, setSelectedTiles] = useState<Tile[]>([]);

  useEffect(() => {
    console.log("selectedTiles", selectedTiles);
    if (selectedTiles.length === 2) {
      PlayerStateManager.swapTile(player, selectedTiles[0], selectedTiles[1]);
      setSelectedTiles([]);
    }
  }, [selectedTiles]);

  return (
    <div style={{ display: "flex", gap: 5, margin: 10 }}>
      <div>
        <p>Concealed Tile</p>
        <div style={{ display: "flex", gap: 5, margin: 10 }}>
          {player.hands.map((tile, index) => (
            <TileDiv
              key={tile.id + index}
              tile={tile}
              selectedTile={selectedTiles[0]}
              canSelect={true}
              onSelected={(tile) => {
                setSelectedTiles((ts) => ts.concat(tile));
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <p>Reveal Tile</p>
        <div style={{ display: "flex", gap: 5, margin: 10 }}>
          {player.revealedTiles.map(({ tiles, type }) => (
            <>
              <div>{type}</div>
              {tiles.map((t, index) => (
                <TileDiv key={t.id + index} tile={t} />
              ))}
            </>
          ))}
        </div>
      </div>

      <div>
        <p>Flower Tile</p>
        <div style={{ display: "flex", gap: 5, margin: 10 }}>
          {player.flowerTiles.map((t, idx) => (
            <TileDiv key={t.id + idx} tile={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

let isGameStarted = false;
function startGame() {
  if (isGameStarted) return;
  isGameStarted = true;

  // mounted
  TileSet.init();

  const mainState = new MainState();

  MainStateManager.init(mainState);
  MainStateManager.startFirstGame(mainState!);

  return mainState;
}

// in dev mode, react run 2x, causing weird bug
let HAS_RUN: boolean = false;
function App() {
  const mainStateRef = useRef<MainState>();
  const [, setRerender] = useState<any>();
  const [phase, setPhase] = useState<string>("");
  const [tileFromCollection, setTileFromCollection] = useState<any>(null);

  useEffect(() => {
    if (HAS_RUN) return;

    HAS_RUN = true;
    // @ts-expect-error asdf, todo: remove this
    window.mainState = mainStateRef.current = startGame();
    EventMainStateManager.onAnyEventCallback(({ phase, state, meta }) => {
      if (phase === PhaseType.getTileFromCollection) {
        console.log("what is current tile from collection", meta?.tileFromCollection);
        setTileFromCollection(meta?.tileFromCollection);
      }
      console.log("onAnyEventCallback", phase, state, meta);
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
  console.log(mainState);
  return (
    <>
      <div></div>
      <div className="table-container">
        <h3>Table</h3>
        <div>
          Declaration phase: <strong>{phase}</strong>
        </div>
        <div className="UI" style={{ display: "flex" }}>
          <div className="table" style={{ width: 500, height: 500, border: "1px solid black" }}>
            <div>Tile Taken from collection</div>
            {tileFromCollection && <TileDiv tile={tileFromCollection} />}

            <div>
              {mainState.currentDiscardedTile?.tile && (
                <>
                  <div>Tile Discarded from player ${mainState.turn.playerToDeal}</div>
                  <TileDiv tile={mainState.currentDiscardedTile.tile} />
                </>
              )}
            </div>
          </div>
          <div className="player-hands">
            {mainState.persistentState.players.map((player) => {
              return (
                <div key={player.playerConnId}>
                  <div>
                    {player.name ?? player.playerConnId} <span>total hand: {player.hands.length}</span>
                  </div>
                  <PlayerHand {...player} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
