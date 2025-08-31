import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import express from 'express';

// Create the schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create GraphQL server
export const createGraphQLServer = async () => {
  const apolloServer = new ApolloServer({
    schema,
    introspection: process.env.NODE_ENV !== 'production',
  });

  return apolloServer;
};

// Setup GraphQL as standalone server
export const startGraphQLServer = async () => {
  const server = await createGraphQLServer();
  
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async ({ req }) => {
      // You can add authentication logic here
      const token = req.headers.authorization;
      return { token };
    },
  });

  console.log(`🚀 GraphQL Server ready at ${url}`);
  return server;
};