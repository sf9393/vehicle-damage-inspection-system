import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vantage — Vehicle Damage Inspection",
  description: "AI-assisted vehicle damage inspection with human review.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://sf9393.github.io/vehicle-damage-inspection-system"),
  openGraph: {
    title: "Vantage — Vehicle Damage Inspection",
    description: "AI-assisted vehicle damage inspection with human review.",
    images: ["og.png"],
  },
  twitter: { card: "summary_large_image", images: ["og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
