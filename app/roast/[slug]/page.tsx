import { fetchUserRoast } from "@/app/actions";
import {
  DRUPAL_URL,
  extractBetween,
  fetchScrappedDrupalProfile,
  getRoastPrompt,
} from "@/utils/helpers";
import React from "react";
import ReactMarkdown from "react-markdown";

export default async function RoastPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // const roastPrompt = getRoastPrompt(`${DRUPAL_URL}/u/${slug}`);

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
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-4">{children}</p>,
              strong: ({ children }) => (
                <strong className="font-bold text-dodger-blue">
                  {children}
                </strong>
              ),
              em: ({ children }) => <em className="italic ">{children}</em>,
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold mb-4">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-bold mb-3">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-bold mb-2">{children}</h3>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-300 pl-4 py-2 my-4 bg-gray-50 dark:bg-gray-800 rounded italic">
                  {children}
                </blockquote>
              ),
            }}
          >
            {text}
          </ReactMarkdown>
        </article>
      </div>
    </main>
  );
}
