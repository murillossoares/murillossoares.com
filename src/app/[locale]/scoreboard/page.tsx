import ScoreboardClient from "./ScoreboardClient";
export default function ScoreboardPage({ params }: { params: { locale: string } }) {
  return <ScoreboardClient locale={params.locale} />;
}
