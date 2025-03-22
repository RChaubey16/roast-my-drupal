import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container-padding h-[100vh] flex flex-col items-center justify-center gap-6">
      <Image
        src="/404.svg"
        alt="A person running away from code"
        width={300}
        height={300}
        priority
      />
      <p className="md:max-w-2xl text-xl text-center text-white font-medium">
        Look at you running away from the roast... just like you run away from
        fixing Drupal core bugs.
      </p>
      <Button type="submit" className="w-fit mt-6">
        <Link href={"/"}>Face the Roast 🔥</Link>
      </Button>
    </main>
  );
}
