import { builder } from '../builder'
import { prisma } from '../db'
import {
  SubscriptionAction,
  SubscriptionEvent,
  UserSubscription,
} from '../pubsub'

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

      ctx.pubsub.publish('user-persisting-action', subscriptionPayload)
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
      ctx.pubsub.publish('user-persisting-action', subscriptionPayload)

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
      // @ts-ignore
      subscribe: (
        root,
        args,
        ctx, // @ts-ignore
      ) => ctx.pubsub.subscribe('user-persisting-action'),
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
