import { createYoga } from 'graphql-yoga'
import { createServer } from 'http'
import { schema } from './schema'
import { pubsub } from './pubsub'

const yoga = createYoga({
  graphqlEndpoint: '/',
  schema,
  context: (req) => ({
    req,
    pubsub,
  }),
})

const server = createServer(yoga)

const PORT = 4000

server.listen(PORT, () => {
  console.log(`\
🚀 Server ready at port: ${PORT}
  `)
})
