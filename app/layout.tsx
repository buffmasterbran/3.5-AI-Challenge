import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "3.5 AI Challenge",
  description: "3.5 AI Challenge",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
