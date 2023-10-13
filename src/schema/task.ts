import { builder } from '../builder'
import { prisma } from '../db'
import { tokenIsValid } from '../services/auth'
import { Task } from '@prisma/client'

const taskObject = builder.prismaObject('Task', {
  fields: (t) => ({
    id: t.exposeInt('id'),
    name: t.exposeString('name'),
    completed: t.exposeBoolean('completed'),
    user: t.relation('user'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})

builder.queryFields((t) => ({
  authGetTasks: t.prismaField({
    type: ['Task'],
    errors: {
      types: [Error],
    },
    authScopes: {
      LOGGED_IN: true,
      SUPERUSER: false,
    },
    resolve: async (query, parent, args, ctx) => {
      // @ts-ignore
      const token = ctx.req?.req?.headers?.authorization?.split('Bearer ')[1]
      const { payload: tokenPayload } = tokenIsValid(token)

      const dbRequestResult = await prisma.user.findFirst({
        where: {
          email: tokenPayload.email,
        },
        include: {
          tasks: true,
        },
      })

      return dbRequestResult?.tasks as Task[]
    },
  }),
}))

builder.mutationFields((t) => ({
  createTask: t.prismaField({
    type: 'Task',
    errors: {
      types: [Error],
    },
    authScopes: {
      LOGGED_IN: true,
      SUPERUSER: false,
    },
    args: {
      name: t.arg({
        type: 'String',
        required: true,
      }),
    },
    resolve: async (query, parent, args, ctx) => {
      // @ts-ignore
      const token = ctx.req?.req?.headers?.authorization?.split('Bearer ')[1]
      const { payload: tokenPayload } = tokenIsValid(token)

      try {
        const createdTask = await prisma.task.create({
          ...query,
          data: {
            name: args.name,
            userEmail: tokenPayload.email,
          },
        })
        return createdTask
      } catch (error) {
        // @ts-ignore
        throw new Error(error.message)
      }
    },
  }),
}))
