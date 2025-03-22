"use client";

import { FormEvent, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DRUPAL_URL, removeExtraSpaces } from "@/utils/helpers";
import { extractProfileName, validateForm } from "@/lib/profileFormActions";
import RoastModesContainer from "./RoastModesContainer";

// Lazy load the Server Component
const ProfileFormDescription = dynamic(
  () => import("./ProfileFormDescription"),
  {
    ssr: true, // Ensures it renders server-side
  }
);
export interface ProfileState {
  type: "url" | "username" | "";
  value: string;
}

export interface ActiveMode {
  id: number;
  mode: string;
}

const INITIAL_MODE: ActiveMode = {
  id: -1,
  mode: "",
};

// Helper functions
const showErrorToast = (message: string) => {
  toast(message, { action: { label: "Close", onClick: () => {} } });
};

export default function ProfileForm() {
  const [profile, setProfile] = useState<ProfileState>({ type: "", value: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMode, setActiveMode] = useState<ActiveMode>(INITIAL_MODE);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const trimmedValue = removeExtraSpaces(profile.value);
      const validation = await validateForm(trimmedValue);

      if (!validation.isValid) {
        showErrorToast(validation.message!);
        setIsSubmitting(false);
        return;
      }

      setProfile({
        type: trimmedValue.startsWith(DRUPAL_URL) ? "url" : "username",
        value: trimmedValue,
      });

      const profileName = await extractProfileName(profile);
      // TODO: Handler the roast mode on roast page.
      router.push(
        `/roast/${profileName}${
          activeMode.id > 0 ? `?mode=${activeMode.mode}` : ""
        }`
      );
    } catch (error) {
      showErrorToast("An error occurred while processing your request");
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-[600px] w-full flex flex-col items-center"
    >
      <h1 className="font-roboto text-34 font-normal text-silver text-center">
        Roast My <span className="text-dodger-blue">Drupal</span>
      </h1>
      <div className="max-w-[520px] w-full mt-8 mb-6 flex flex-col md:flex-row items-center gap-4">
        <input
          type="text"
          value={profile.value}
          onChange={(e) =>
            setProfile((prevProfile) => ({
              ...prevProfile,
              type: e.target.value.includes("https") ? "url" : "username",
              value: e.target.value,
            }))
          }
          placeholder="Enter your Drupal profile, and let the roast begin!"
          className="w-full py-2.5 px-3 rounded-md focus:outline-none bg-tundora text-sm font-normal text-silver"
          aria-label="Drupal profile URL or username"
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-26 motion-preset-seesaw"
        >
          {isSubmitting ? (
            <ClipLoader
              color={"#FFFFFF"}
              loading={isSubmitting}
              size={22}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          ) : (
            "Roast away"
          )}
        </Button>
      </div>
      <ProfileFormDescription />
      <RoastModesContainer
        activeMode={activeMode}
        setActiveMode={setActiveMode}
      />
    </form>
  );
}
