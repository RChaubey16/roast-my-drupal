import { ReactNode } from "react";
import Link from "next/link";
import { HomeVariant } from "@/components/svg_icons/HomeVariant";

interface RoastLayoutProps {
  children: ReactNode;
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
