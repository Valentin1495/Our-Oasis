/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_OASIS_DEBUG?: "true" | "false";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
