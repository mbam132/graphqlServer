import { builder } from '../builder'
import { prisma } from '../db'

const todoListObject = builder.prismaObject('TodoList', {
  fields: (t) => ({
    id: t.exposeInt('id'),
    name: t.exposeString('name'),
    userEmail: t.exposeString('userEmail'),
    user: t.relation('user'),
    task: t.relation('tasks'),
  }),
})

builder.queryFields((t) => ({
  allTodos: t.prismaField({
    type: ['TodoList'],
    errors: {
      types: [Error],
    },
    resolve: (query) => {
      console.log('All Todos fetched')
      return prisma.todoList.findMany({ ...query })
    },
  }),
}))

const TodoCreateInput = builder.inputType('TodoCreateInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    userEmail: t.string({ required: true }),
  }),
})

builder.mutationFields((t) => ({
  createTodo: t.prismaField({
    type: 'TodoList',
    errors: {
      types: [Error],
    },
    args: {
      data: t.arg({
        type: TodoCreateInput,
        required: true,
      }),
    },
    resolve: async (query, parent, args, ctx) => {
      try {
        const createdTodo = await prisma.todoList.create({
          ...query,
          data: {
            name: args.data.name,
            userEmail: args.data.userEmail,
          },
        })
        return createdTodo
      } catch (error) {
        // @ts-ignore
        throw new Error(error.message)
      }
    },
  }),
}))
