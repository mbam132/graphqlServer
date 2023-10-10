import SchemaBuilder from '@pothos/core'
import ErrorsPlugin from '@pothos/plugin-errors'
import ScopeAuthPlugin from '@pothos/plugin-scope-auth'
import PrismaPlugin from '@pothos/plugin-prisma'
import type PrismaTypes from '@pothos/plugin-prisma/generated'
import { DateTimeResolver } from 'graphql-scalars'
import { prisma } from './db'
import { pubsub } from './pubsub'
import { tokenIsValid } from './services/auth'
import { IScopes } from './types'

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes
  Context: { pubsub: typeof pubsub }
  Scalars: {
    DateTime: {
      Input: Date
      Output: Date
    }
  }
  AuthScopes: {
    SUPERUSER: boolean
    LOGGED_IN: boolean
  }
}>({
  plugins: [ScopeAuthPlugin, PrismaPlugin, ErrorsPlugin],
  authScopes: async (context: any) => {
    const token = context.req?.req?.headers?.authorization?.split('Bearer ')[1]
    const { result: theTokenIsValid, payload } = tokenIsValid(token)

    if (!theTokenIsValid) {
      return {
        SUPERUSER: false,
        LOGGED_IN: false,
      }
    }

    return {
      SUPERUSER: payload.authScope === IScopes.SUPERUSER,
      LOGGED_IN: true,
    }
  },
  errorOptions: { defaultTypes: [] },
  prisma: {
    client: prisma,
  },
})

builder.objectType(Error, {
  name: 'Error',
  fields: (t) => ({
    message: t.exposeString('message'),
  }),
})

builder.queryType({})
builder.mutationType({})

builder.addScalarType('DateTime', DateTimeResolver, {})
