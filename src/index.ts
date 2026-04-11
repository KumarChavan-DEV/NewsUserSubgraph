import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import express from 'express';
import cors from 'cors';
import { connectToDatabase } from './lib/db';
import { verifyToken } from './lib/auth';
import typeDefs from './graphql/typeDefs';
import resolvers from './graphql/resolvers';

async function start() {
  await connectToDatabase();
  console.log('Connected to MongoDB (userdb)');

  const app = express();

  const server = new ApolloServer({
    schema: buildSubgraphSchema([{ typeDefs, resolvers: resolvers as any }]),
  });

  await server.start();

  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        let userId: string | undefined;
        let userRole: string | undefined;

        // Check forwarded headers from gateway first
        const forwardedUserId = req.headers['x-user-id'] as string | undefined;
        const forwardedUserRole = req.headers['x-user-role'] as string | undefined;

        if (forwardedUserId) {
          userId = forwardedUserId;
          userRole = forwardedUserRole;
        } else {
          // Fallback: decode JWT directly (for direct access without gateway)
          const authHeader = req.headers.authorization;
          if (authHeader?.startsWith('Bearer ')) {
            try {
              const decoded = verifyToken(authHeader.slice(7));
              userId = decoded.userId;
              userRole = decoded.role;
            } catch {
              // Invalid token — proceed without auth
            }
          }
        }

        return { userId, userRole };
      },
    })
  );

  const port = parseInt(process.env.PORT || '4001', 10);

  app.listen(port, () => {
    console.log(`User subgraph ready at http://localhost:${port}/graphql`);
  });
}

start().catch((err) => {
  console.error('Failed to start user subgraph:', err);
  process.exit(1);
});
