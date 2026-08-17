import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase 클라이언트.
 *
 * 환경변수가 없으면 `null` 이다 — 계정 기능만 조용히 꺼지고 게임은 그대로 돈다.
 * 키 없이 받은 사람도, 로컬에서 클론만 한 경우도 바로 플레이할 수 있어야 한다.
 *
 * anon key 는 브라우저에 그대로 실리는 공개 키다. 실제 보호는 RLS 가 한다
 * (supabase/schema.sql 참고). service_role 키는 여기에 절대 넣지 않는다.
 */

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // OAuth 리다이렉트로 돌아왔을 때 주소의 토큰을 알아서 처리한다
          detectSessionInUrl: true,
        },
      })
    : null

/** 계정 기능을 쓸 수 있는 빌드인지 */
export const authEnabled = supabase !== null

/** 구글 로그인 후 돌아올 주소 — 서브경로 배포라 base 를 붙여야 한다 */
export function redirectTo(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href
}
