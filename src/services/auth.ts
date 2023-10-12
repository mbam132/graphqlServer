import jwt from 'jsonwebtoken'
import { User } from '@prisma/client'

interface ITokenIsValid {
  result: boolean
  payload: User
}

const tokenDurationInMinutes = 30

function getDecodedToken(token: string) {
  return jwt.verify(token, process.env.TOKEN_HASHING_SECRET as string)
}

function tokenIsValid(token: string): ITokenIsValid {
  try {
    const decodedToken: any = getDecodedToken(token)

    const validToken: boolean =
      decodedToken.exp > Date.now() && Object.keys(decodedToken.data).length > 0
    return {
      result: validToken,
      payload: decodedToken.data,
    }
  } catch (error) {
    return {
      result: false,
      payload: {} as User,
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
