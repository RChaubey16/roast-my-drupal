import React from 'react';

interface RoastModeProps {
  id: number;
  mode: string;
  activeMode: {
    id: number;
    mode: string;
  };
  modeClickHandler: (args: { id: number; mode: string }) => void;
}

const RoastMode = ({
  id,
  mode,
  activeMode: { id: activeId },
  modeClickHandler,
}: RoastModeProps) => {
  const isModeActive = id === activeId;
  
  const handleClick = () => {
    modeClickHandler({
      id: isModeActive ? -1 : id,
      mode: isModeActive ? "" : mode,
    });
  };

  return (
    <button
      className={`px-3 py-2 text-sm text-silver rounded-3xl cursor-pointer ${
        isModeActive
          ? "bg-roast-mode-active-background border border-roast-mode-active-border"
          : "bg-tundora border border-tundora"
      }`}
      type="button"
      onClick={handleClick}
    >
      {mode}
    </button>
  );
};

export default React.memo(RoastMode);
