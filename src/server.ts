import { createYoga } from 'graphql-yoga'
import { createServer } from 'http'
import { schema } from './schema'
import { pubsub } from './pubsub'

const yoga = createYoga({
  graphqlEndpoint: '/',
  schema,
  context: (req) => {
    return {
      req,
      pubsub,
    }
  },
})

const server = createServer(yoga)

server.listen(4000, () => {
  console.log(`\
🚀 Server ready at: http://127.0.0.1:4000
⭐️ See sample queries: http://pris.ly/e/ts/graphql#using-the-graphql-api
  `)
})
