import { ReactNode, SVGProps } from "react";
import Link from "next/link";

interface RoastLayoutProps {
  children: ReactNode;
}

export function HomeVariant(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      {...props}
    >
      <path fill="currentColor" d="m12 3l8 6v12h-5v-7H9v7H4V9z"></path>
    </svg>
  );
}

export default function RoastLayout({ children }: RoastLayoutProps) {
  return (
    <>
      <nav className="container-padding py-6 flex justify-center">
        <Link href="/" className="text-3xl text-gray-400 hover:text-dodger-blue">
          <HomeVariant />
        </Link>
      </nav>

      <main className="container-padding h-full min-h-screen flex justify-center mb-14">
        {children}
      </main>
    </>
  );
}
