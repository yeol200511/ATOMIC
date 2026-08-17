/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase 프로젝트 URL — 없으면 계정 기능이 꺼진다 */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon public key (공개 키. service_role 을 넣지 않는다) */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
