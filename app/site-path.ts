const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Keeps absolute app paths valid both at localhost and under the GitHub Pages
 * project-site path (`/shopping`).
 */
export function withBasePath(path: string) {
  if (!path.startsWith("/")) return path;
  return `${basePath}${path}`;
}
