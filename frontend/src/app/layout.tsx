import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Discover Tunisia | AI Agency Command Center",
  description: "مركز قيادة شركة AI Discover Tunisia لإدارة فريق الذكاء الاصطناعي والمشاريع والمحتوى.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
