import type { Metadata } from "next";
import { CollectionBrowser } from "@/components/collection/collection-browser";

export const metadata: Metadata = {
  title: "The whole collection",
  description:
    "All eleven whole spices we carry, with origins, harvest windows and prices. Filter by district, heat level or price.",
};

export default function CollectionPage() {
  return <CollectionBrowser />;
}
