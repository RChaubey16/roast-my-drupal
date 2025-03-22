import { DRUPAL_URL } from "@/utils/helpers";

export default function ProfileFormDescription() {
  return (
    <div>
      <p className="text-base font-medium text-silver text-center">
        Drop your Drupal profile URL or username here and let the roasting begin!
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
  );
}
