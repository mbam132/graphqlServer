import { hashSync, compareSync, genSaltSync } from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '@prisma/client'
import { builder } from '../builder'
import { prisma } from '../db'
import {
  SubscriptionAction,
  SubscriptionEvent,
  UserSubscription,
} from '../pubsub'

const tokenDurationInMinutes = 10

const UserObject = builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeInt('id'),
    name: t.exposeString('name', { nullable: true }),
    email: t.exposeString('email'),
  }),
})

const UserCreateInput = builder.inputType('UserCreateInput', {
  fields: (t) => ({
    email: t.string({ required: true }),
    name: t.string(),
  }),
})

type IUserAuth = {
  user: User
  jwt: string
}

const UserAuth = builder.objectRef<IUserAuth>('UserAuth')

builder.objectType(UserAuth, {
  fields: (t) => ({
    user: t.prismaField({
      type: 'User',
      resolve: (_, payload) => payload.user,
    }),
    jwt: t.exposeString('jwt'),
  }),
})

builder.queryFields((t) => ({
  allUsers: t.prismaField({
    type: ['User'],
    errors: {
      types: [Error],
    },
    resolve: (query) => {
      console.log('All users fetched')
      return prisma.user.findMany({ ...query })
    },
  }),
}))

builder.mutationFields((t) => ({
  createUser: t.prismaField({
    type: 'User',
    errors: {
      types: [Error],
    },
    args: {
      data: t.arg({
        type: UserCreateInput,
        required: true,
      }),
    },
    resolve: async (query, parent, args, ctx) => {
      const createdUser = await prisma.user.create({
        ...query,
        data: {
          email: args.data.email,
          name: args.data.name,
        },
      })

      const subscriptionPayload: UserSubscription = {
        user: createdUser,
        action: SubscriptionAction.CREATED,
      }

      ctx.pubsub.publish('user-action', subscriptionPayload)
      return createdUser
    },
  }),
  login: t.field({
    type: UserAuth,
    errors: {
      types: [Error],
    },
    args: {
      email: t.arg({
        type: 'String',
        required: true,
      }),
      password: t.arg({
        type: 'String',
        required: true,
      }),
    },
    resolve: async (query, args, ctx, info) => {
      try {
        const user = await prisma.user.findFirst({
          where: {
            email: args.email,
          },
        })

        if (!user) {
          throw new Error("The credentials don't match with any existing user")
        }

        const passwordMatches = compareSync(args.password, user?.password)

        if (!passwordMatches) {
          throw new Error("The credentials don't match with any existing user")
        }

        const token = jwt.sign(
          {
            exp: Date.now() + tokenDurationInMinutes + 60 * 1000,
            data: {
              email: user.email,
              name: user.name,
            },
          },
          process.env.TOKEN_HASHING_SECRET as string,
        )

        const subscriptionPayload: UserSubscription = {
          user,
          action: SubscriptionAction.LOGGED_IN,
        }

        ctx.pubsub.publish('user-action', subscriptionPayload)

        return { user: user as User, jwt: token }
      } catch (error) {
        // @ts-ignore
        throw new Error(error.message)
      }
    },
  }),
  signUp: t.prismaField({
    type: 'User',
    errors: {
      types: [Error],
    },
    args: {
      email: t.arg({
        type: 'String',
        required: true,
      }),
      password: t.arg({
        type: 'String',
        required: true,
      }),
      name: t.arg({
        type: 'String',
      }),
    },
    resolve: async (query, parent, args, ctx) => {
      const salt = genSaltSync(11)
      const hashedPassword = hashSync(args.password, salt)

      const createdUser = await prisma.user.create({
        data: {
          email: args.email,
          name: args.name,
          password: hashedPassword,
        },
      })

      const subscriptionPayload: UserSubscription = {
        user: createdUser,
        action: SubscriptionAction.SIGNED_UP,
      }

      ctx.pubsub.publish('user-action', subscriptionPayload)
      return createdUser
    },
  }),
  deleteUser: t.prismaField({
    type: 'User',
    errors: {
      types: [Error],
    },
    args: {
      id: t.arg.int(),
      email: t.arg.string(),
    },
    resolve: async (query, parent, args, ctx) => {
      const selectByEmail: boolean =
        args.email !== undefined && args.email !== null
      const selectById: boolean =
        !selectByEmail && args.id !== undefined && args.id !== null

      if (!selectByEmail && !selectById) {
        throw new Error('No valid input to delete a user')
      }

      const deletedUser = await prisma.user.delete({
        where: {
          email: (selectByEmail ? args.email : undefined) as string | undefined,
          id: (selectById ? args.id : undefined) as number | undefined,
        },
      })

      const subscriptionPayload: UserSubscription = {
        user: deletedUser,
        action: SubscriptionAction.DELETED,
      }
      ctx.pubsub.publish('user-action', subscriptionPayload)

      return deletedUser
    },
  }),
}))

builder.enumType(SubscriptionAction, {
  name: 'SubscriptionAction',
})

const subscriptionEvent = builder
  .interfaceRef<SubscriptionEvent>('SubscriptionEvent')
  .implement({
    fields: (t) => ({
      action: t.field({
        type: SubscriptionAction,
        resolve: (payload) => payload.action,
      }),
    }),
  })

const USubscription = builder.objectRef<UserSubscription>('UserSubscription')

USubscription.implement({
  interfaces: [subscriptionEvent],
  fields: (t) => ({
    user: t.field({
      type: UserObject,
      resolve: (payload) => payload.user,
    }),
  }),
})

builder.subscriptionType({
  fields: (t) => ({
    userUpdate: t.field({
      type: USubscription,
      subscribe: (
        root,
        args,
        ctx, // @ts-ignore
      ) => ctx.pubsub.subscribe('user-action'),
      resolve: async (payload: UserSubscription): Promise<UserSubscription> => {
        try {
          await prisma.userActionsLog.create({
            data: {
              email: payload?.user?.email,
              action: payload?.action,
            },
          })
        } catch (error) {
          console.error('Error persiting into UserActionsLog table')
          if (error instanceof Error) {
            console.error(error.message)
          }
        } finally {
          const stringToLog =
            payload.action &&
            `A user was ${
              payload?.action === 'CREATED' ? 'created' : 'deleted'
            }`
          if (stringToLog) {
            console.log(stringToLog)
          }
          console.log('A subscription was sent')
          return payload as UserSubscription
        }
      },
    }),
  }),
})
