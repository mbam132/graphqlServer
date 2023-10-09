import jwt from 'jsonwebtoken'
import { User } from '@prisma/client'

const tokenDurationInMinutes = 10

function getDecodedToken(token: string) {
  return jwt.verify(token, process.env.TOKEN_HASHING_SECRET as string)
}

function decodedTokenIsValid(value: any) {
  const tokenIsStillValid: boolean = value.exp > Date.now()
  if (!tokenIsStillValid) {
    throw new Error('The token expired')
  }

  const fieldsAreFilled: boolean =
    value.data.email !== '' && value.data.name !== ''

  if (fieldsAreFilled) {
    return true
  }
  return false
}

function tokenIsValid(token: string) {
  const decodedToken: any = getDecodedToken(token)

  return decodedTokenIsValid(decodedToken)
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

export { tokenIsValid, decodedTokenIsValid, getDecodedToken, signToken }
