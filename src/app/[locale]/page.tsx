import Dashboard from "@/components/Dashboard";
import BootExperience from "@/components/BootExperience";
import CyberpunkOverlay from "@/components/CyberpunkOverlay";
import MysteryButton from "@/components/MysteryButton";
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <BootExperience>
      <Dashboard locale={locale} />
      <CyberpunkOverlay />
      <MysteryButton />
    </BootExperience>
  );
}
