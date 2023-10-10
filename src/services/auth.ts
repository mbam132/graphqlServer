import jwt from 'jsonwebtoken'
import { User } from '@prisma/client'
import { IScopes } from '../types'

const tokenDurationInMinutes = 10

function getDecodedToken(token: string) {
  return jwt.verify(token, process.env.TOKEN_HASHING_SECRET as string)
}

function tokenIsValid(token: string) {
  try {
    const decodedToken: any = getDecodedToken(token)
    return {
      result: Object.keys(decodedToken).length > 0,
      payload: decodedToken,
    }
  } catch (error) {
    return {
      result: false,
    }
  }
}

function signToken(userObject: User): string {
  return jwt.sign(
    {
      exp: Date.now() + tokenDurationInMinutes * 60 * 1000,
      data: {
        email: userObject.email,
        name: userObject.name,
        authScope: userObject.authScope,
      },
    },
    process.env.TOKEN_HASHING_SECRET as string,
  )
}

export { signToken, tokenIsValid }
