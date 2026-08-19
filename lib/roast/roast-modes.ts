export type RoastModeId =
  | "default"
  | "chandler-bing"
  | "kevin-hart"
  | "elon-musk"
  | "gordon-ramsay";

export interface RoastMode {
  id: RoastModeId;
  label: string;
  personaPrompt: string;
}

function personaPrompt(name: string, voice: string): string {
  return `Deliver the roast in the comedic style of ${name}: ${voice} This is a style impression for comedic effect only — never present any line as ${name}'s real words or as something they actually said.`;
}

export const ROAST_MODES: Record<RoastModeId, RoastMode> = {
  default: {
    id: "default",
    label: "Default",
    personaPrompt: "",
  },
  "chandler-bing": {
    id: "chandler-bing",
    label: "Chandler Bing",
    personaPrompt: personaPrompt(
      "Chandler Bing",
      "sarcastic, self-deprecating, quick with ironic one-liners, and prone to rhetorical questions like \"Could this BE any more...\"",
    ),
  },
  "kevin-hart": {
    id: "kevin-hart",
    label: "Kevin Hart",
    personaPrompt: personaPrompt(
      "Kevin Hart",
      "high-energy, exaggerated storytelling, punchy escalating bits, and confident bravado undercut by self-aware panic.",
    ),
  },
  "elon-musk": {
    id: "elon-musk",
    label: "Elon Musk",
    personaPrompt: personaPrompt(
      "Elon Musk",
      "deadpan, meme-inflected, prone to grandiose \"first principles\" pronouncements and abrupt tangents.",
    ),
  },
  "gordon-ramsay": {
    id: "gordon-ramsay",
    label: "Gordon Ramsay",
    personaPrompt: personaPrompt(
      "Gordon Ramsay",
      "intense, hyperbolic insult-comedy energy, exasperated exclamations, and kitchen-disaster metaphors adapted to code instead of food.",
    ),
  },
};

/**
 * Resolve a raw mode id (as received from a request) to its `RoastMode`,
 * falling back to `default` for anything unrecognized.
 *
 * Think of this like a coat-check attendant: hand over a valid ticket
 * and you get the matching coat back; hand over a torn, missing, or
 * made-up ticket and you get handed the house default instead of
 * being turned away.
 *
 * @param modeId - The raw mode id from the request, or `null`/`undefined`
 * if none was sent.
 * @returns The matching `RoastMode`, or `ROAST_MODES.default` if
 * `modeId` doesn't match a known mode.
 *
 * @example
 * ```ts
 * resolveRoastMode("kevin-hart"); // ROAST_MODES["kevin-hart"]
 * resolveRoastMode("not-a-mode"); // ROAST_MODES.default
 * ```
 */
export function resolveRoastMode(modeId: string | null | undefined): RoastMode {
  if (modeId && modeId in ROAST_MODES) {
    return ROAST_MODES[modeId as RoastModeId];
  }
  return ROAST_MODES.default;
}
