import ProfileForm from "@/components/ProfileForm";
import RoastModesContainer from "@/components/RoastModesContainer";

export default function Home() {
  return (
    <main className="container-padding h-[100vh] flex flex-col items-center justify-center">
      <ProfileForm />
      <RoastModesContainer />
    </main>
  );
}
