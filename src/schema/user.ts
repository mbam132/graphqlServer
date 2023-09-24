import { builder } from '../builder'
import { prisma } from '../db'
import { PostCreateInput } from './post'

builder.prismaObject('User', {
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
      ctx.pubsub.publish('user', { user: createdUser })
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
    resolve: (query, parent, args) => {
      const selectByEmail: boolean =
        args.email !== undefined && args.email !== null
      const selectById: boolean =
        !selectByEmail && args.id !== undefined && args.id !== null

      if (!selectByEmail && !selectById) {
        throw new Error('No valid input to delete a user')
      }

      return prisma.user.delete({
        where: {
          email: (selectByEmail ? args.email : undefined) as string | undefined,
          id: (selectById ? args.id : undefined) as number | undefined,
        },
      })
    },
  }),
}))

interface UserSubscription {
  user: any
}

const subscriptionEvent =
  builder.objectRef<UserSubscription>('UserSubscription')

subscriptionEvent.implement({
  fields: (t) => ({
    user: t.prismaField({
      type: 'User',
      nullable: true,
      resolve: (query, event) => {
        //preprocessing of subscription result can be done here
        return event.user
      },
    }),
  }),
})

builder.subscriptionType({
  fields: (t) => ({
    createdUser: t.field({
      type: subscriptionEvent,
      subscribe: (root, args, ctx) => ctx.pubsub.subscribe('user'),
      resolve: (event) => event,
    }),
  }),
})
