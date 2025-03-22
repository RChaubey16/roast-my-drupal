import { fetchScrappedDrupalProfile, fetchUserRoast } from "@/lib/roastActions";
import { DRUPAL_URL, extractBetween, getRoastPrompt } from "@/utils/helpers";
import Markdown from "@/components/Markdown";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function RoastPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const scrapedProfile = `${DRUPAL_URL}/u/${slug}`;
  const scrappedProfileData = await fetchScrappedDrupalProfile(scrapedProfile);
  const result = scrappedProfileData.data
    ? extractBetween(scrappedProfileData.data, `${slug}#top`, "News items")
    : "";
  const roastPrompt = getRoastPrompt(result ?? "");
  const { text } = await fetchUserRoast(roastPrompt);

  return (
    <div className="max-w-[700px] w-full flex flex-col items-center">
      <h1 className="my-6 font-roboto text-2xl text-white">
        Let the <span className="text-dodger-blue">ROAST</span> begin🔥
      </h1>
      <article className="prose prose-lg dark:prose-invert w-full text-silver">
        <Markdown text={text} />
      </article>

      <Button type="submit" className="w-fit mt-6">
        <Link href={"/"}>Roast Failed, Try Again</Link>
      </Button>
    </div>
  );
}
