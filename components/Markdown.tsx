import ReactMarkdown from "react-markdown";

export default async function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-4 text-base">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-bold text-dodger-blue/80">{children}</strong>
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
  );
};
