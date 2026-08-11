import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NOVA — Quiet technology for moving minds",
  description: "정교한 성능과 조용한 디자인이 만나는 프리미엄 테크 스토어, NOVA.",
  openGraph: {
    title: "NOVA — Quiet technology for moving minds",
    description: "정교한 성능과 조용한 디자인이 만나는 프리미엄 테크 스토어, NOVA.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "NOVA — Quiet technology for moving minds",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body className={geist.variable}>{children}</body></html>;
}
