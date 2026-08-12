import type { Metadata } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import "pretendard/dist/web/static/pretendard-dynamic-subset.css";
import "./globals.css";
import PageBasePath from "./page-base-path";
import NovaAiChat from "./nova-ai-chat";

export const metadata: Metadata = {
  title: "NOVA — Precision sound, quietly designed",
  description: "정교한 사운드와 조용한 디자인이 만나는 프리미엄 헤드폰 스토어, NOVA.",
  openGraph: {
    title: "NOVA — Precision sound, quietly designed",
    description: "정교한 사운드와 조용한 디자인이 만나는 프리미엄 헤드폰 스토어, NOVA.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "NOVA — Precision sound, quietly designed",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body><PageBasePath />{children}<NovaAiChat /></body></html>;
}
