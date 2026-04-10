import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type TileType = "empty" | "road" | "road-h" | "house" | "villa" | "mansion" | "sunflower" | "tree" | "market" | "fountain";

interface Tile {
  id: string;
  type: TileType;
  level: number;
  owner?: string;
  growthStage?: number;
}

interface Player {
  id: string;
  name: string;
  glory: number;
  authority: number;
  resources: number;
  color: string;
}



interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const GRID_W = 12;
const GRID_H = 9;

const HOUSE_IMG = "https://cdn.poehali.dev/projects/c1af5a78-fdc1-454e-bf00-087fd6cf9677/files/d1c50699-e172-4095-99aa-d1655c23e657.jpg";
const VILLA_IMG = "https://cdn.poehali.dev/projects/c1af5a78-fdc1-454e-bf00-087fd6cf9677/files/88f0969a-6754-4d3c-91ab-e193c99d5d89.jpg";
const SUNFLOWER_IMG = "https://cdn.poehali.dev/projects/c1af5a78-fdc1-454e-bf00-087fd6cf9677/files/8f3a9427-731f-4a94-b776-3343a2fa8167.jpg";

const BUILD_ITEMS = [
  { type: "house" as TileType, label: "Дом", cost: 50, glory: 10, emoji: "🏠", desc: "Уровни 1-3, улучшается до виллы" },
  { type: "sunflower" as TileType, label: "Подсолнух", cost: 20, glory: 15, emoji: "🌻", desc: "Выращивай и собирай ресурсы" },
  { type: "market" as TileType, label: "Рынок", cost: 80, glory: 20, emoji: "🏪", desc: "Торгуй с другими игроками" },
  { type: "fountain" as TileType, label: "Фонтан", cost: 40, glory: 12, emoji: "⛲", desc: "Украшает город, даёт авторитет" },
  { type: "tree" as TileType, label: "Дерево", cost: 10, glory: 5, emoji: "🌲", desc: "Зелень для украшения" },
];



function makeTile(type: TileType, level = 1, owner?: string): Tile {
  return { id: Math.random().toString(36).slice(2), type, level, owner };
}

function initGrid(): Tile[] {
  const grid: Tile[] = Array.from({ length: GRID_W * GRID_H }, (_, i) => {
    const row = Math.floor(i / GRID_W);
    const col = i % GRID_W;
    if (row === 4) return { ...makeTile("road-h"), id: `r-${i}` };
    if (col === 5) return { ...makeTile("road"), id: `r-${i}` };
    return makeTile("empty");
  });

  const place = (row: number, col: number, type: TileType, owner?: string) => {
    const idx = row * GRID_W + col;
    if (grid[idx].type === "empty") grid[idx] = makeTile(type, 1, owner);
  };

  place(1, 1, "house", "Вы");
  place(1, 2, "sunflower");
  place(1, 3, "tree");
  place(2, 1, "tree");
  place(2, 2, "market");
  place(5, 7, "house", "Алексей");
  place(6, 7, "sunflower");
  place(6, 8, "fountain");
  place(7, 2, "house", "Мария");
  place(7, 3, "tree");

  return grid;
}

function getInitialPlayers(): Player[] {
  return [
    { id: "me", name: "Вы", glory: 150, authority: 80, resources: 200, color: "#f5c518" },
    { id: "p1", name: "Алексей", glory: 120, authority: 65, resources: 180, color: "#ff6b6b" },
    { id: "p2", name: "Мария", glory: 95, authority: 90, resources: 130, color: "#4ecdc4" },
    { id: "p3", name: "Дмитрий", glory: 200, authority: 110, resources: 90, color: "#a29bfe" },
    { id: "p4", name: "Анна", glory: 75, authority: 45, resources: 220, color: "#fd79a8" },
  ];
}

// ─── Tile Cell ────────────────────────────────────────────────────────────────
function TileCell({ tile, onClick, isSelected }: { tile: Tile; onClick: () => void; isSelected: boolean }) {
  const getContent = () => {
    switch (tile.type) {
      case "house":
        return (
          <div className="w-full h-full relative">
            <img src={HOUSE_IMG} className="w-full h-full object-cover" alt="house" />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center text-[8px] text-yellow-300 font-bold py-0.5 leading-tight">
              {tile.owner || "Ничьё"} Ур.{tile.level}
            </div>
          </div>
        );
      case "villa":
        return (
          <div className="w-full h-full relative">
            <img src={VILLA_IMG} className="w-full h-full object-cover" alt="villa" />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center text-[8px] text-yellow-300 font-bold py-0.5">
              {tile.owner} Вилла
            </div>
          </div>
        );
      case "mansion":
        return (
          <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-amber-900 to-amber-700">
            <span className="text-2xl">🏰</span>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center text-[8px] text-yellow-300 font-bold py-0.5">
              {tile.owner}
            </div>
          </div>
        );
      case "sunflower":
        return (
          <div className="w-full h-full relative sunflower-grow">
            <img src={SUNFLOWER_IMG} className="w-full h-full object-cover" alt="sunflower" />
            {(tile.growthStage || 0) >= 3 && (
              <div className="absolute top-0.5 right-0.5 bg-yellow-400 text-black text-[7px] px-0.5 rounded font-bold">✓</div>
            )}
          </div>
        );
      case "market":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-900 to-orange-700 gap-0">
            <span className="text-xl">🏪</span>
            <span className="text-[7px] text-orange-200 font-bold">Рынок</span>
          </div>
        );
      case "fountain":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
            <span className="text-xl">⛲</span>
            <span className="text-[7px] text-blue-200 font-bold">Фонтан</span>
          </div>
        );
      case "tree":
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-950 to-green-800">
            <span className="text-2xl">🌲</span>
          </div>
        );
      case "road":
      case "road-h":
        return null;
      default:
        return (
          <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-xl text-green-400">+</span>
          </div>
        );
    }
  };

  const isRoad = tile.type === "road" || tile.type === "road-h";
  const cls = isRoad
    ? `tile road${tile.type === "road-h" ? " road-h" : ""}`
    : tile.type === "empty"
    ? "tile empty"
    : "tile";

  return (
    <div
      className={cls}
      style={{
        width: "100%",
        paddingBottom: "100%",
        position: "relative",
        outline: isSelected ? "2px solid #f5c518" : "none",
        outlineOffset: "-2px",
      }}
      onClick={onClick}
    >
      <div style={{ position: "absolute", inset: 0 }}>{getContent()}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const [grid, setGrid] = useState<Tile[]>(initGrid);
  const [players] = useState<Player[]>(getInitialPlayers);
  const [me, setMe] = useState<Player>(getInitialPlayers()[0]);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [selectedBuild, setSelectedBuild] = useState<typeof BUILD_ITEMS[0] | null>(null);
  const [activeTab, setActiveTab] = useState<"game" | "profile" | "shop" | "leaders" | "achievements">("game");
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const notifTimer = useRef<ReturnType<typeof setTimeout>>();

  const showNotif = useCallback((msg: string) => {
    setNotification(msg);
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(null), 3000);
  }, []);

  const addFloat = (col: number, row: number, text: string, color = "#f5c518") => {
    const id = Math.random().toString(36).slice(2);
    setFloatingTexts(prev => [...prev, { id, x: col * 70, y: row * 70, text, color }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(f => f.id !== id)), 1400);
  };

  // Sunflower growth
  useEffect(() => {
    const interval = setInterval(() => {
      setGrid(prev => prev.map(t =>
        t.type === "sunflower" ? { ...t, growthStage: Math.min((t.growthStage || 0) + 1, 5) } : t
      ));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleTileClick = (idx: number) => {
    const tile = grid[idx];
    if (tile.type === "road" || tile.type === "road-h") return;

    if (selectedBuild && tile.type === "empty") {
      if (me.resources < selectedBuild.cost) { showNotif("❌ Не хватает ресурсов!"); return; }
      setGrid(prev => {
        const next = [...prev];
        next[idx] = makeTile(selectedBuild.type, 1, "Вы");
        return next;
      });
      setMe(prev => ({
        ...prev,
        resources: prev.resources - selectedBuild.cost,
        glory: prev.glory + selectedBuild.glory,
        authority: prev.authority + Math.floor(selectedBuild.glory / 3),
      }));
      addFloat(idx % GRID_W, Math.floor(idx / GRID_W), `+${selectedBuild.glory} ⭐`);
      showNotif(`🏗️ Построен ${selectedBuild.label}! +${selectedBuild.glory} слава`);
      return;
    }

    setSelectedTile(prev => prev === idx ? null : idx);
  };

  const handleUpgrade = () => {
    if (selectedTile === null) return;
    const tile = grid[selectedTile];
    if (tile.owner !== "Вы") { showNotif("❌ Не ваша постройка!"); return; }
    const cost = tile.level * 60;
    if (me.resources < cost) { showNotif("❌ Не хватает ресурсов!"); return; }
    setGrid(prev => {
      const next = [...prev];
      const t = { ...next[selectedTile] };
      if (t.type === "house" && t.level >= 3) { t.type = "villa"; t.level = 1; }
      else if (t.type === "villa" && t.level >= 3) { t.type = "mansion"; t.level = 1; }
      else t.level = Math.min(t.level + 1, 3);
      next[selectedTile] = t;
      return next;
    });
    setMe(prev => ({ ...prev, resources: prev.resources - cost, glory: prev.glory + 25, authority: prev.authority + 10 }));
    addFloat(selectedTile % GRID_W, Math.floor(selectedTile / GRID_W), "⬆️ +25⭐", "#4ecdc4");
    showNotif("⬆️ Улучшено! +25 слава, +10 авторитет");
    setSelectedTile(null);
  };

  const handleExplode = () => {
    if (selectedTile === null) return;
    const tile = grid[selectedTile];
    const glory = tile.owner === "Вы" ? 20 : 40;
    setGrid(prev => { const next = [...prev]; next[selectedTile] = makeTile("empty"); return next; });
    setMe(prev => ({ ...prev, glory: prev.glory + glory, authority: prev.authority + 15, resources: prev.resources + 30 }));
    addFloat(selectedTile % GRID_W, Math.floor(selectedTile / GRID_W), `💥 +${glory}⭐`, "#ff4444");
    showNotif(`💥 Взорвано! +${glory} слава, +15 авторитет, +30 ресурсов`);
    setSelectedTile(null);
  };

  const handleHarvest = () => {
    if (selectedTile === null) return;
    const tile = grid[selectedTile];
    if (tile.type !== "sunflower" && tile.type !== "tree") { showNotif("❌ Нечего собирать"); return; }
    const resources = 25 + (tile.growthStage || 0) * 10;
    setGrid(prev => { const next = [...prev]; next[selectedTile] = { ...next[selectedTile], growthStage: 0 }; return next; });
    setMe(prev => ({ ...prev, resources: prev.resources + resources, glory: prev.glory + 15 }));
    addFloat(selectedTile % GRID_W, Math.floor(selectedTile / GRID_W), `+${resources}🪙 +15⭐`, "#4ecdc4");
    showNotif(`🌻 Собрано! +${resources} ресурсов, +15 слава`);
    setSelectedTile(null);
  };

  const sortedPlayers = [...players, { ...me }].sort((a, b) => b.glory - a.glory);
  const selectedT = selectedTile !== null ? grid[selectedTile] : null;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "#111d11", fontFamily: "'Golos Text', sans-serif" }}>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-yellow-900/40 flex-shrink-0" style={{ background: "#0a140a" }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏘️</span>
          <span className="font-oswald text-xl tracking-wider" style={{ color: "#f5c518" }}>ГОРОДОК</span>
        </div>
        <div className="flex items-center gap-2">
          {[
            { icon: "🌟", val: me.glory, color: "#f5c518" },
            { icon: "👑", val: me.authority, color: "#e74c3c" },
            { icon: "🪙", val: me.resources, color: "#4ecdc4" },
          ].map(s => (
            <div key={s.icon} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(245,197,24,0.2)" }}>
              <span>{s.icon}</span>
              <span className="font-bold" style={{ color: s.color }}>{s.val}</span>
            </div>
          ))}
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black text-sm" style={{ background: "#f5c518" }}>
            {me.name[0]}
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex border-b border-yellow-900/30 flex-shrink-0 overflow-x-auto" style={{ background: "#0a140a" }}>
        {([
          ["game", "🏙️", "Город"],
          ["profile", "👤", "Профиль"],
          ["shop", "🛒", "Магазин"],
          ["leaders", "🏆", "Топ"],
          ["achievements", "🎖️", "Достижения"],
        ] as const).map(([tab, icon, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
            style={{
              borderBottomColor: activeTab === tab ? "#f5c518" : "transparent",
              color: activeTab === tab ? "#f5c518" : "#6b7280",
              background: activeTab === tab ? "rgba(245,197,24,0.05)" : "transparent",
            }}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">

        {/* GAME */}
        {activeTab === "game" && (
          <>
            {/* Build sidebar */}
            <div className="w-44 flex-shrink-0 border-r border-yellow-900/30 overflow-y-auto p-2 flex flex-col gap-2" style={{ background: "#0a140a" }}>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold px-1 pt-1">Постройки</p>
              {BUILD_ITEMS.map(item => (
                <div
                  key={item.type}
                  onClick={() => setSelectedBuild(prev => prev?.type === item.type ? null : item)}
                  className="p-2 rounded-lg cursor-pointer transition-all"
                  style={{
                    border: selectedBuild?.type === item.type ? "1px solid #f5c518" : "1px solid rgba(74,120,74,0.3)",
                    background: selectedBuild?.type === item.type ? "rgba(245,197,24,0.08)" : "rgba(22,34,22,0.8)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-lg">{item.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-200">{item.label}</p>
                      <p className="text-[8px]" style={{ color: "#a0844a" }}>🪙{item.cost} | ⭐+{item.glory}</p>
                    </div>
                  </div>
                  <p className="text-[8px] text-gray-600 leading-tight">{item.desc}</p>
                </div>
              ))}
              {selectedBuild && (
                <div className="mt-1 p-2 rounded text-[9px] text-center" style={{ background: "rgba(245,197,24,0.1)", border: "1px solid rgba(245,197,24,0.3)", color: "#f5c518" }}>
                  👆 Нажми пустую клетку
                </div>
              )}
            </div>

            {/* Game field */}
            <div className="flex-1 overflow-auto relative p-3" style={{ background: "linear-gradient(135deg, #1a2e1a 0%, #152215 100%)" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${GRID_W}, 1fr)`,
                  gap: "3px",
                  minWidth: "580px",
                  position: "relative",
                }}
              >
                {grid.map((tile, idx) => (
                  <TileCell key={tile.id} tile={tile} onClick={() => handleTileClick(idx)} isSelected={selectedTile === idx} />
                ))}
              </div>

              {/* Floating texts */}
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                {floatingTexts.map(ft => (
                  <div
                    key={ft.id}
                    className="glory-float absolute font-bold text-xs whitespace-nowrap"
                    style={{ left: ft.x + 48, top: ft.y + 12, color: ft.color, textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}
                  >
                    {ft.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right sidebar: tile actions only */}
            {selectedT && selectedT.type !== "empty" && selectedT.type !== "road" && selectedT.type !== "road-h" && (
              <div className="w-48 flex-shrink-0 border-l border-yellow-900/30 panel-enter p-3" style={{ background: "#0a140a" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "#f5c518" }}>
                  {selectedT.type === "house" ? "🏠 Дом" : selectedT.type === "villa" ? "🏡 Вилла" :
                   selectedT.type === "mansion" ? "🏰 Особняк" : selectedT.type === "sunflower" ? "🌻 Подсолнух" :
                   selectedT.type === "market" ? "🏪 Рынок" : selectedT.type === "fountain" ? "⛲ Фонтан" : "🌲 Дерево"}
                  <span className="text-gray-500 font-normal"> {selectedT.owner && `(${selectedT.owner})`}</span>
                </p>
                <div className="flex flex-col gap-1.5">
                  {selectedT.owner === "Вы" && selectedT.type !== "tree" && selectedT.type !== "mansion" && (
                    <button onClick={handleUpgrade} className="w-full px-2 py-1.5 rounded text-xs font-semibold transition-all" style={{ background: "rgba(29,78,216,0.3)", border: "1px solid rgba(59,130,246,0.4)", color: "#93c5fd" }}>
                      ⬆️ Улучшить ({selectedT.level * 60}🪙)
                    </button>
                  )}
                  {(selectedT.type === "sunflower" || selectedT.type === "tree") && (
                    <button onClick={handleHarvest} className="w-full px-2 py-1.5 rounded text-xs font-semibold transition-all" style={{ background: "rgba(21,128,61,0.3)", border: "1px solid rgba(34,197,94,0.4)", color: "#86efac" }}>
                      🌾 Собрать урожай
                    </button>
                  )}
                  <button onClick={handleExplode} className="w-full px-2 py-1.5 rounded text-xs font-semibold transition-all" style={{ background: "rgba(153,27,27,0.3)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5" }}>
                    💥 Взорвать {selectedT.owner !== "Вы" ? "(+40⭐)" : "(+20⭐)"}
                  </button>
                  <button onClick={() => setSelectedTile(null)} className="w-full px-2 py-1 rounded text-xs transition-all" style={{ background: "rgba(55,65,81,0.3)", color: "#6b7280" }}>
                    ✕ Закрыть
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* PROFILE */}
        {activeTab === "profile" && (
          <div className="flex-1 overflow-y-auto p-6 panel-enter">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-bold text-black shadow-xl pulse-gold" style={{ background: "linear-gradient(135deg, #f5c518, #e8a020)" }}>
                  {me.name[0]}
                </div>
                <div>
                  <h2 className="font-oswald text-3xl" style={{ color: "#f5c518" }}>{me.name}</h2>
                  <p className="text-gray-500 text-sm">Строитель города</p>
                  <div className="flex gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(245,197,24,0.1)", color: "#f5c518", border: "1px solid rgba(245,197,24,0.3)" }}>Ранг: Мастер</span>
                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(231,76,60,0.1)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)" }}>Авторитет: Уважаемый</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { icon: "🌟", label: "Слава", val: me.glory, color: "#f5c518" },
                  { icon: "👑", label: "Авторитет", val: me.authority, color: "#e74c3c" },
                  { icon: "🪙", label: "Ресурсы", val: me.resources, color: "#4ecdc4" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: "#162216", border: "1px solid rgba(74,120,74,0.3)" }}>
                    <span className="text-2xl block mb-1">{s.icon}</span>
                    <p className="font-oswald text-2xl font-bold" style={{ color: s.color }}>{s.val}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-4 mb-4" style={{ background: "#162216", border: "1px solid rgba(74,120,74,0.3)" }}>
                <p className="text-xs text-gray-500 font-bold mb-3">Прогресс</p>
                <div className="space-y-3">
                  {[
                    { label: "Слава", val: me.glory, max: 500, color: "#f5c518" },
                    { label: "Авторитет", val: me.authority, max: 200, color: "#e74c3c" },
                  ].map(p => (
                    <div key={p.label}>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{p.label}</span><span>{p.val}/{p.max}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.4)" }}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((p.val / p.max) * 100, 100)}%`, background: p.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "#162216", border: "1px solid rgba(74,120,74,0.3)" }}>
                <p className="text-xs text-gray-500 font-bold mb-3">Твои постройки ({grid.filter(t => t.owner === "Вы").length})</p>
                <div className="flex flex-wrap gap-2">
                  {grid.filter(t => t.owner === "Вы").map(t => (
                    <div key={t.id} className="rounded-lg p-2 text-center" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(74,120,74,0.2)" }}>
                      <span className="text-lg block">{t.type === "house" ? "🏠" : t.type === "villa" ? "🏡" : t.type === "mansion" ? "🏰" : t.type === "sunflower" ? "🌻" : t.type === "market" ? "🏪" : t.type === "fountain" ? "⛲" : "🌲"}</span>
                      <p className="text-[9px] text-gray-600">Ур.{t.level}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SHOP */}
        {activeTab === "shop" && (
          <div className="flex-1 overflow-y-auto p-6 panel-enter">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-oswald text-2xl mb-1" style={{ color: "#f5c518" }}>🛒 Магазин</h2>
              <p className="text-gray-600 text-sm mb-6">Покупай объекты для строительства и ресурсы</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {BUILD_ITEMS.map(item => (
                  <div
                    key={item.type}
                    onClick={() => { setActiveTab("game"); setSelectedBuild(item); showNotif(`✅ Выбрано: ${item.label} — нажми на поле`); }}
                    className="rounded-xl p-4 cursor-pointer transition-all"
                    style={{ background: "#162216", border: "1px solid rgba(74,120,74,0.3)" }}
                  >
                    <span className="text-4xl block mb-2">{item.emoji}</span>
                    <h3 className="font-bold text-gray-200 mb-1">{item.label}</h3>
                    <p className="text-[11px] text-gray-600 mb-3">{item.desc}</p>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm" style={{ color: "#f5c518" }}>🪙 {item.cost}</span>
                      <span className="text-xs text-green-400">+{item.glory} ⭐</span>
                    </div>
                    <button className="w-full py-1.5 rounded-lg text-xs font-bold transition-all text-black" style={{ background: "#f5c518" }}>
                      Выбрать
                    </button>
                  </div>
                ))}
                <div className="rounded-xl p-4" style={{ background: "#162216", border: "1px solid rgba(74,120,74,0.3)" }}>
                  <span className="text-4xl block mb-2">💰</span>
                  <h3 className="font-bold text-gray-200 mb-1">Ресурсы ×100</h3>
                  <p className="text-[11px] text-gray-600 mb-3">Обменяй 50 славы на 100 ресурсов</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm" style={{ color: "#f5c518" }}>🌟 50 слава</span>
                    <span className="text-xs text-green-400">+100 🪙</span>
                  </div>
                  <button
                    onClick={() => {
                      if (me.glory >= 50) { setMe(p => ({ ...p, glory: p.glory - 50, resources: p.resources + 100 })); showNotif("✅ Куплено 100 ресурсов!"); }
                      else showNotif("❌ Не хватает славы!");
                    }}
                    className="w-full py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                    style={{ background: "rgba(21,128,61,0.6)", border: "1px solid rgba(34,197,94,0.4)" }}
                  >
                    Купить
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LEADERS */}
        {activeTab === "leaders" && (
          <div className="flex-1 overflow-y-auto p-6 panel-enter">
            <div className="max-w-lg mx-auto">
              <h2 className="font-oswald text-2xl mb-1" style={{ color: "#f5c518" }}>🏆 Таблица лидеров</h2>
              <p className="text-gray-600 text-sm mb-6">Соревнуйся с другими игроками</p>
              <div className="space-y-2">
                {sortedPlayers.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all"
                    style={{
                      background: p.name === "Вы" ? "rgba(245,197,24,0.08)" : "#162216",
                      border: p.name === "Вы" ? "1px solid rgba(245,197,24,0.4)" : "1px solid rgba(74,120,74,0.3)",
                    }}
                  >
                    <span className="text-2xl w-8 text-center">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-black flex-shrink-0" style={{ background: p.color }}>
                      {p.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: p.name === "Вы" ? "#f5c518" : "#e5e7eb" }}>{p.name}</p>
                      <p className="text-xs text-gray-600">👑 {p.authority} авт. · 🪙 {p.resources}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-oswald text-xl" style={{ color: "#f5c518" }}>{p.glory}</p>
                      <p className="text-[10px] text-gray-600">слава</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ACHIEVEMENTS */}
        {activeTab === "achievements" && (
          <div className="flex-1 overflow-y-auto p-6 panel-enter">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-oswald text-2xl mb-1" style={{ color: "#f5c518" }}>🎖️ Достижения</h2>
              <p className="text-gray-600 text-sm mb-6">Выполняй задания и получай награды</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: "🏠", title: "Первый дом", desc: "Построй первый дом", done: true, reward: 50 },
                  { icon: "🌻", title: "Фермер", desc: "Вырасти 3 подсолнуха", done: me.glory > 120, reward: 30 },
                  { icon: "💥", title: "Разрушитель", desc: "Взорви 5 построек", done: false, reward: 100 },
                  { icon: "🏡", title: "Вилла мечты", desc: "Улучши дом до виллы", done: grid.some(t => t.type === "villa"), reward: 75 },
                  { icon: "🌟", title: "Звезда города", desc: "Набери 500 славы", done: me.glory >= 500, reward: 200 },
                  { icon: "👑", title: "Авторитет", desc: "Достигни 200 авторитета", done: me.authority >= 200, reward: 150 },
                  { icon: "💬", title: "Болтун", desc: "Напиши 10 сообщений в чат", done: false, reward: 20 },
                  { icon: "🏆", title: "Лидер", desc: "Займи 1-е место в таблице", done: sortedPlayers[0]?.name === "Вы", reward: 500 },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl transition-all" style={{
                    background: a.done ? "rgba(245,197,24,0.06)" : "#162216",
                    border: a.done ? "1px solid rgba(245,197,24,0.3)" : "1px solid rgba(74,120,74,0.2)",
                    opacity: a.done ? 1 : 0.6,
                  }}>
                    <span className={`text-3xl ${a.done ? "" : "grayscale"}`}>{a.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: a.done ? "#fde68a" : "#9ca3af" }}>{a.title}</p>
                      <p className="text-[11px] text-gray-600">{a.desc}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full" style={{
                      background: a.done ? "rgba(245,197,24,0.2)" : "rgba(55,65,81,0.5)",
                      color: a.done ? "#f5c518" : "#6b7280",
                    }}>
                      {a.done ? "✅" : "🔒"} +{a.reward}⭐
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div className="notification fixed bottom-6 left-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl"
          style={{ background: "#0a140a", border: "1px solid rgba(245,197,24,0.5)", color: "#fde68a" }}>
          {notification}
        </div>
      )}

      {/* Important notice */}
      <div className="text-center py-1 text-[10px] text-gray-700 border-t border-yellow-900/20" style={{ background: "#0a140a" }}>
        Это первая версия · кнопки и механики настраиваются
      </div>
    </div>
  );
}