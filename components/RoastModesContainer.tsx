"use client";

import { useState } from "react";
import { roastModes } from "@/data/roastModes";
import RoastMode from "./RoastMode";

export interface ActiveMode {
  id: number;
  mode: string;
}

const INITIAL_MODE: ActiveMode = {
  id: -1,
  mode: "",
};

export default function RoastModesContainer() {
  const [activeMode, setActiveMode] = useState<ActiveMode>(INITIAL_MODE);

  return (
    <div className="w-42 md:w-fit mt-10">
      <hr className="mb-10 border-t-1 border-tundora rounded-2xl" />

      <h3 className="mb-4 font-roboto text-lg text-center text-ring">
        Roast modes
      </h3>

      <div className="flex flex-col md:flex-row gap-3 font-lato">
        {roastModes.map((roastMode) => (
          <RoastMode
            key={roastMode.id}
            id={roastMode.id}
            mode={roastMode.mode}
            activeMode={activeMode}
            modeClickHandler={setActiveMode}
          />
        ))}
      </div>
    </div>
  );
}
