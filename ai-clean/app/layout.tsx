import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "斷捨離判斷積木｜Clean Decision Atlas",
  description: "依物品分類選擇適用的斷捨離判斷原則。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
