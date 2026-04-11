import * as userService from '../services/userService';

interface Context {
  userId?: string;
  userRole?: string;
}

const resolvers = {
  User: {
    __resolveReference: async (reference: { id: string }) => {
      return userService.getUserById(reference.id);
    },
  },

  Query: {
    me: async (_: unknown, __: unknown, context: Context) => {
      if (!context.userId) {
        throw new Error('Not authenticated');
      }
      return userService.getUserProfile(context.userId);
    },

    user: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.userId) {
        throw new Error('Not authenticated');
      }
      if (context.userRole !== 'admin') {
        throw new Error('Forbidden: admin access required');
      }
      return userService.getUserById(id);
    },
  },

  Mutation: {
    register: async (_: unknown, { input }: { input: { email: string; username: string; password: string } }) => {
      return userService.registerUser(input);
    },

    login: async (_: unknown, { input }: { input: { email: string; password: string } }) => {
      return userService.loginUser(input);
    },
  },
};

export default resolvers;
