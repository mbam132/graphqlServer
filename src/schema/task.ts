import { builder } from '../builder'
import { prisma } from '../db'

const taskObject = builder.prismaObject('Task', {
  fields: (t) => ({
    id: t.exposeInt('id'),
    name: t.exposeString('name'),
    minutesEstimate: t.exposeFloat('minutesEstimate', { nullable: true }),
    list: t.relation('list'),
    listId: t.exposeInt('listId'),
  }),
})

const TaskCreateInput = builder.inputType('TaskCreateInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    minutesEstimates: t.float({ required: false }),
    listId: t.int({ required: true }),
  }),
})

builder.mutationFields((t) => ({
  createTask: t.prismaField({
    type: 'Task',
    errors: {
      types: [Error],
    },
    args: {
      data: t.arg({
        type: TaskCreateInput,
        required: true,
      }),
    },
    resolve: async (query, parent, args, ctx) => {
      try {
        const createdTask = await prisma.task.create({
          ...query,
          data: {
            name: args.data.name,
            listId: args.data.listId,
            minutesEstimate: args.data.minutesEstimates,
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
