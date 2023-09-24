# GraphQL & Prisma Server

The server has implemented the following features:

- Create, Delete, and Read operations
- Subscription to when a resource is created

If you want to replicate the project:

- Specify a database configuration in /prisma/schema.prisma
- Run the database migration

For covering errors in your queries, you need to make use of GraphQL fragments, e.g:

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
