# GraphQL Yoga, Pothos & Prisma Server

The server has implemented the following features:

- Create, Delete, and Read operations
- Subscription to when a user is created or deleted

If you want to replicate the project:

- Specify a database configuration in /prisma/schema.prisma
- Run the database migrations
- run 'npm run dev'

All of the queries and mutations support GraphQL fragments, an e.g:

```
 query {
   allUsers{
     ...on Error{
       message
     }

     ...on QueryAllUsersSuccess{
       data{
         id
         name
         email
       }
     }
   }
 }
```
