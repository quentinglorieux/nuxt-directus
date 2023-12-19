import type {
  CookieRef
} from '#app'
import type {
  AuthenticationData,
  DirectusTokens,
  ModuleOptions
} from '../types'
import {
  type Ref,
  useCookie,
  useState
} from '#imports'

/**
 * This expands the default Directus storage implementation for authenticated data. It adds a `store` named export for direct access within the Nuxt app using `useState` under the hood.
 *
 * @param useStaticToken - If `true` or `undefined` it will use the static token from the module config. If `false` it will not use any token. If a string is provided it will use that as the token.
 * @returns Directus SDK native AuthenticationStorage functions
 * @returns `store` for direct access to the stored data
 */
export const useDirectusTokens = (useStaticToken?: boolean | string):DirectusTokens => {
  const directusConfig = useRuntimeConfig().public.directus
  const {
    authStateName,
    useNuxtCookies,
    refreshTokenCookieName,
    cookieHttpOnly: httpOnly,
    cookieSameSite: sameSite,
    cookieSecure: secure
  } = directusConfig.authConfig as ModuleOptions['authConfig']

  const tokens: Ref<AuthenticationData | null> = useState(authStateName)

  function refreshToken (maxAge?: number | undefined): CookieRef<string | null | undefined> {
    const cookie = useCookie<string | null>(refreshTokenCookieName!, { maxAge, httpOnly, sameSite, secure })
    return cookie
  }

  return {
    get: () => {
      if (useStaticToken === true || (!tokens.value?.access_token && useStaticToken !== false)) {
        return {
          access_token: typeof useStaticToken === 'string' ? useStaticToken : directusConfig.staticToken,
          refresh_token: null,
          expires_at: null,
          expires: null
        }
      }

      return {
        access_token: tokens.value?.access_token ?? null,
        refresh_token: useNuxtCookies ? refreshToken().value : tokens.value?.refresh_token,
        expires_at: tokens.value?.expires_at ?? null,
        expires: tokens.value?.expires ?? null
      } as AuthenticationData
    },
    set: (value: AuthenticationData | null) => {
      tokens.value = value
      if (useNuxtCookies) {
        refreshToken(value?.expires || undefined).value = value?.refresh_token
      }
    },
    tokens,
    refreshToken
  }
}
