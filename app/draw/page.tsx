import type { Metadata } from "next";
import { DrawScreen } from "@/components/draw/draw-screen";

export const metadata: Metadata = {
  title: "Sortear Times",
};

export default function DrawPage() {
  return <DrawScreen />;
}
