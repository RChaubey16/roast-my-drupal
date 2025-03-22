import { fetchScrappedDrupalProfile, fetchUserRoast } from "@/lib/roastActions";
import {
  DRUPAL_URL,
  extractBetween,
  getRoastPrompt,
} from "@/utils/helpers";
import Markdown from "@/components/Markdown";

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
    <main className="container-padding h-full min-h-screen flex justify-center">
      <div className="max-w-[700px] w-full flex flex-col items-center my-8">
        <article className="prose prose-lg dark:prose-invert w-full text-silver">
          <Markdown text={text}/>
        </article>
      </div>
    </main>
  );
}
