import ScoreboardClient from "./ScoreboardClient";
export default async function ScoreboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ScoreboardClient locale={locale} />;
}
