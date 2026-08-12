"use client";

import { useEffect } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Keeps legacy absolute links and image URLs working on GitHub project pages. */
export default function PageBasePath() {
  useEffect(() => {
    if (!basePath) return;
    const prefix = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
    const rewrite = (value: string) => value.startsWith("/") && !value.startsWith("//") && !value.startsWith(`${prefix}/`) ? `${prefix}${value}` : value;

    document.querySelectorAll<HTMLImageElement | HTMLAnchorElement>("img[src], a[href]").forEach((element) => {
      const attribute = element instanceof HTMLImageElement ? "src" : "href";
      const current = element.getAttribute(attribute);
      if (current) element.setAttribute(attribute, rewrite(current));
    });
  }, []);

  return null;
}
