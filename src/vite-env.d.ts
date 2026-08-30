/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_OASIS_DEBUG?: "true" | "false";
  readonly VITE_OASIS_OG_IMAGE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
