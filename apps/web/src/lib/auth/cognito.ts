import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from 'amazon-cognito-identity-js'

// Environment config — these must be set as NEXT_PUBLIC_ env vars
const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? ''
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? ''

function getUserPool(): CognitoUserPool {
  if (!USER_POOL_ID || !CLIENT_ID) {
    throw new Error('Cognito configuration missing: NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_CLIENT_ID must be set')
  }
  return new CognitoUserPool({
    UserPoolId: USER_POOL_ID,
    ClientId: CLIENT_ID,
  })
}

function getCognitoUser(email: string): CognitoUser {
  return new CognitoUser({
    Username: email,
    Pool: getUserPool(),
  })
}

export interface AuthTokens {
  idToken: string
  accessToken: string
  refreshToken: string
}

export interface SignUpResult {
  userConfirmed: boolean
  userSub: string
}

/**
 * Sign up a new user with email, password, and full name.
 */
export function signUp(email: string, password: string, fullName: string): Promise<SignUpResult> {
  const pool = getUserPool()
  const attributes = [
    new CognitoUserAttribute({ Name: 'email', Value: email }),
    new CognitoUserAttribute({ Name: 'name', Value: fullName }),
  ]

  return new Promise((resolve, reject) => {
    pool.signUp(email, password, attributes, [], (err, result) => {
      if (err) {
        reject(err)
        return
      }
      if (!result) {
        reject(new Error('Sign up failed: no result'))
        return
      }
      resolve({
        userConfirmed: result.userConfirmed,
        userSub: result.userSub,
      })
    })
  })
}

/**
 * Confirm email with verification code sent after sign-up.
 */
export function confirmSignUp(email: string, code: string): Promise<void> {
  const user = getCognitoUser(email)

  return new Promise((resolve, reject) => {
    user.confirmRegistration(code, true, (err) => {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}

/**
 * Resend the email verification code.
 */
export function resendConfirmationCode(email: string): Promise<void> {
  const user = getCognitoUser(email)

  return new Promise((resolve, reject) => {
    user.resendConfirmationCode((err) => {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}

/**
 * Sign in with email and password using SRP auth flow.
 */
export function signIn(email: string, password: string): Promise<AuthTokens> {
  const user = getCognitoUser(email)
  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  })

  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: (session: CognitoUserSession) => {
        resolve({
          idToken: session.getIdToken().getJwtToken(),
          accessToken: session.getAccessToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
        })
      },
      onFailure: (err: Error) => {
        reject(err)
      },
    })
  })
}

/**
 * Sign out the current user (clears local session).
 */
export function signOut(): void {
  const pool = getUserPool()
  const user = pool.getCurrentUser()
  if (user) {
    user.signOut()
  }
}

/**
 * Get current session tokens. Automatically refreshes if expired.
 * Returns null if no user is signed in.
 */
export function getCurrentSession(): Promise<AuthTokens | null> {
  const pool = getUserPool()
  const user = pool.getCurrentUser()

  if (!user) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err) {
        // Session expired or invalid — treat as signed out
        resolve(null)
        return
      }
      if (!session || !session.isValid()) {
        resolve(null)
        return
      }
      resolve({
        idToken: session.getIdToken().getJwtToken(),
        accessToken: session.getAccessToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
      })
    })
  })
}

/**
 * Get the current user's email from the ID token.
 * Returns null if not signed in.
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  const session = await getCurrentSession()
  if (!session) return null

  try {
    const payload = JSON.parse(atob(session.idToken.split('.')[1]))
    return payload.email ?? null
  } catch {
    return null
  }
}

/**
 * Get the current user's name from the ID token.
 * Returns null if not signed in.
 */
export async function getCurrentUserName(): Promise<string | null> {
  const session = await getCurrentSession()
  if (!session) return null

  try {
    const payload = JSON.parse(atob(session.idToken.split('.')[1]))
    return payload.name ?? null
  } catch {
    return null
  }
}

/**
 * Initiate forgot password flow — sends verification code to email.
 */
export function forgotPassword(email: string): Promise<void> {
  const user = getCognitoUser(email)

  return new Promise((resolve, reject) => {
    user.forgotPassword({
      onSuccess: () => {
        resolve()
      },
      onFailure: (err: Error) => {
        reject(err)
      },
    })
  })
}

/**
 * Confirm new password with verification code from forgot password flow.
 */
export function confirmPassword(email: string, code: string, newPassword: string): Promise<void> {
  const user = getCognitoUser(email)

  return new Promise((resolve, reject) => {
    user.confirmPassword(code, newPassword, {
      onSuccess: () => {
        resolve()
      },
      onFailure: (err: Error) => {
        reject(err)
      },
    })
  })
}
