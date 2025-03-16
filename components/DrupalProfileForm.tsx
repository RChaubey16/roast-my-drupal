"use client";

import { FormEvent, useState } from "react";
import PuffLoader from "react-spinners/PuffLoader";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { removeExtraSpaces, validateDrupalUrl } from "@/utils/helpers";

interface ProfileState {
  type: "url" | "username" | "";
  value: string;
}

const DRUPAL_URL = "https://www.drupal.org";
const ERROR_MESSAGE = "Please enter a valid Drupal profile URL or username";

export default function DrupalProfileForm() {
  const [profile, setProfile] = useState<ProfileState>({
    type: "",
    value: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const trimmedValue = removeExtraSpaces(profile.value);
    if (!trimmedValue) {
      toast(ERROR_MESSAGE, {
        action: {
          label: "Close",
          onClick: () => {},
        },
      });
      setIsSubmitting(false);
      return;
    }

    try {
      if (
        trimmedValue.includes("https") &&
        !trimmedValue.startsWith(DRUPAL_URL)
      ) {
        toast("Please enter a valid Drupal.org URL", {
          action: {
            label: "Close",
            onClick: () => {},
          },
        });
        setIsSubmitting(false);
      } else if (trimmedValue.startsWith(DRUPAL_URL)) {
        if (!validateDrupalUrl(trimmedValue)) {
          toast("Please enter a valid Drupal.org URL", {
            action: {
              label: "Close",
              onClick: () => {},
            },
          });
          setIsSubmitting(false);
          return;
        }
        setProfile((prevProfile) => ({
          ...prevProfile,
          type: "url",
          value: trimmedValue,
        }));
      } else {
        setProfile((prevProfile) => ({
          ...prevProfile,
          type: "username",
          value: trimmedValue,
        }));
      }

      // TODO: Handle form submission
      console.log("Submitted profile:", profile);
    } catch (error) {
      toast("An error occurred while processing your request", {
        action: {
          label: "Close",
          onClick: () => {},
        },
      });
    } finally {
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
          className="w-full md:w-26"
        >
          {isSubmitting ? (
            <PuffLoader
              color={"#FFFFFF"}
              loading={isSubmitting}
              size={30}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          ) : (
            "Roast away"
          )}
        </Button>
      </div>

      <div>
        <p className="text-base font-medium text-silver text-center">
          Drop your Drupal profile URL or username here and let the roasting
          begin!
        </p>
        <p className="mt-2 text-sm font-extralight text-silver text-center">
          Example:{" "}
          <span className="font-normal italic text-dodger-blue">
            {`${DRUPAL_URL}/u/drupaldev123`}
          </span>{" "}
          or just{" "}
          <span className="font-normal italic text-dodger-blue">
            drupaldev123
          </span>
        </p>
      </div>
    </form>
  );
}
