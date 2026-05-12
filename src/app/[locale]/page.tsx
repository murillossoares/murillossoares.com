import Dashboard from "@/components/Dashboard";
import BootExperience from "@/components/BootExperience";
import CyberpunkOverlay from "@/components/CyberpunkOverlay";
import MysteryButton from "@/components/MysteryButton";
export default function HomePage({ params }: { params: { locale: string } }) {
  return (
    <BootExperience>
      <Dashboard locale={params.locale} />
      <CyberpunkOverlay />
      <MysteryButton />
    </BootExperience>
  );
}
