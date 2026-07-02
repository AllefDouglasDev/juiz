import type { Metadata } from "next";
import { PlayersScreen } from "@/components/players/players-screen";

export const metadata: Metadata = {
  title: "Jogadores",
};

export default function PlayersPage() {
  return <PlayersScreen />;
}
