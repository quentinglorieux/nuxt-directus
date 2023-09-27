import { defu } from 'defu'
import type {
  DirectusPasswordForgotCredentials,
  DirectusPasswordReset,
  LoginOptions
} from '../types'
import {
  passwordRequest as sdkPasswordRequest,
  passwordReset as sdkPasswordReset,
} from '@directus/sdk'

export function useDirectusAuth<TSchema extends Object> () {
  const client = (useStaticToken: boolean | string = false) => {
    return useDirectusRest<TSchema>({
      useStaticToken
    })
  }
  const { useNuxtCookies } = useRuntimeConfig().public.directus.authConfig

  const { readMe, setUser, user } = useDirectusUser()
  const { tokens } = useDirectusTokens()

  async function login (
    identifier: string, password: string, options?: LoginOptions
  ) {
    try {
      const defaultOptions = {
        mode: useNuxtCookies ? 'json' : 'cookie'
      }
      const params = defu(options, defaultOptions) as LoginOptions

      const authResponse = await client().login(identifier, password, params)
      const userData = await readMe({ useStaticToken: false })
      setUser(userData)

      return {
        access_token: authResponse.access_token,
        refresh_token: authResponse.refresh_token,
        expires_at: authResponse.expires_at,
        expires: authResponse.expires
      }
    } catch (error: any) {
      if (error && error.message) {
        // eslint-disable-next-line no-console
        console.error("Couldn't login user", error.errors)
      } else {
        // eslint-disable-next-line no-console
        console.error(error)
      }
    }
  }

  async function refreshTokens () {
    try {
      const authResponse = await client().refresh()
      const userData = await readMe({ useStaticToken: false })
      setUser(userData)

      return {
        access_token: authResponse.access_token,
        refresh_token: authResponse.refresh_token,
        expires_at: authResponse.expires_at,
        expires: authResponse.expires
      }
    } catch (error: any) {
      if (error && error.message) {
        // eslint-disable-next-line no-console
        console.error("Couldn't refresh tokens", error.errors)
      } else {
        // eslint-disable-next-line no-console
        console.error(error)
      }
    }
  }

  async function logout () {
    try {
      await client().logout()
      user.value = undefined
      user.value = undefined
    } catch (error: any) {
      if (error && error.message) {
        // eslint-disable-next-line no-console
        console.error("Couldn't logut user", error.errors)
      } else {
        // eslint-disable-next-line no-console
        console.error(error)
      }
    }
  }

  async function passwordRequest (
    options: DirectusPasswordForgotCredentials
  ) {
    try {
      await client(options.useStaticToken).request(sdkPasswordRequest(options.email, options.reset_url))
    } catch (error: any) {
      if (error && error.message) {
        // eslint-disable-next-line no-console
        console.error("Couldn't request password reset", error.errors)
      } else {
        // eslint-disable-next-line no-console
        console.error(error)
      }
    }
  }

  async function passwordReset (
    options: DirectusPasswordReset
  ) {
    try {
      await client(options.useStaticToken).request(sdkPasswordReset(options.token, options.password))
    } catch (error: any) {
      if (error && error.message) {
        // eslint-disable-next-line no-console
        console.error("Couldn't reset password", error.errors)
      } else {
        // eslint-disable-next-line no-console
        console.error(error)
      }
    }
  }

  return {
    user,
    tokens,
    login,
    refreshTokens,
    logout,
    passwordRequest,
    passwordReset
  }
}
