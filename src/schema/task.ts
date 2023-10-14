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

      const sortedTasksByDate: Task[] = (dbRequestResult?.tasks as Task[]).sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )

      return sortedTasksByDate
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

      const createdTask = await prisma.task.create({
        ...query,
        data: {
          name: args.name,
          userEmail: tokenPayload.email,
        },
      })
      return createdTask
    },
  }),
  modifyTask: t.field({
    type: 'Boolean',
    errors: {
      types: [Error],
    },
    authScopes: {
      LOGGED_IN: true,
      SUPERUSER: false,
    },
    args: {
      completed: t.arg({
        type: 'Boolean',
        required: true,
      }),
      id: t.arg({
        type: 'Int',
        required: true,
      }),
    },
    resolve: async (query, args, ctx) => {
      // @ts-ignore
      const token = ctx.req?.req?.headers?.authorization?.split('Bearer ')[1]
      const { payload: tokenPayload } = tokenIsValid(token)

      const updatedTask = await prisma.task.update({
        where: {
          userEmail: tokenPayload.email,
          id: args.id,
        },
        data: {
          completed: args.completed,
        },
      })

      return updatedTask.completed
    },
  }),
  deleteTask: t.prismaField({
    type: 'Task',
    errors: {
      types: [Error],
    },
    authScopes: {
      LOGGED_IN: true,
      SUPERUSER: false,
    },
    args: {
      id: t.arg({
        type: 'Int',
        required: true,
      }),
    },
    resolve: async (query, parent, args, ctx) => {
      // @ts-ignore
      const token = ctx.req?.req?.headers?.authorization?.split('Bearer ')[1]
      const { payload: tokenPayload } = tokenIsValid(token)

      const deletedUser = await prisma.task.delete({
        where: {
          id: args.id,
          userEmail: tokenPayload.email,
        },
      })

      return deletedUser
    },
  }),
}))
