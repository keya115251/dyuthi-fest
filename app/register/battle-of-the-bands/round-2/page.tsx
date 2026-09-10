import { events } from "@/app/data/events";
import { notFound } from "next/navigation";
import Round2Form from "./Round2Form";

export default function Round2Page() {
  const event = events.find((e) => e.slug === "battle-of-the-bands");
  if (!event) notFound();

  return <Round2Form />;
}