import {GraphQLError} from 'graphql';
import {Cat, User, UserInput, UserOutput} from '../../types/DBTypes'; //TokenContent should be used
import fetchData from '../../functions/fetchData';
import {LoginResponse, UserResponse} from '../../types/MessageTypes'; //LoginResponse should be used
import {isLoggedIn} from '../../functions/authorize';
import {MyContext} from '../../types/MyContext';

// TODO: create resolvers based on user.graphql
// note: when updating or deleting a user don't send id to the auth server, it will get it from the token. So token needs to be sent with the request to the auth server
// note2: when updating or deleting a user as admin, you need to send user id (dont delete admin btw) and also check if the user is an admin by checking the role from the user object form context

export default {
  Cat: {
    owner: async (parent: Cat) => {
      return await fetchData<User>(
        `${process.env.AUTH_URL}/users/${parent.owner}`,
      );
    },
  },
  Query: {
    /*
        type Query {
  users: [User]
  userById(id: ID!): User
  checkToken: UserResponse
}*/
    users: async () => {
      return await fetchData<User[]>(`${process.env.AUTH_URL}/users`);
    },
    userById: async (_parent: undefined, args: {id: string}) => {
      return await fetchData<User>(`${process.env.AUTH_URL}/users/${args.id}`);
    },
    checkToken: async (_parent: undefined, context: MyContext) => {
      return await {user: context.userdata?.user};
    },
  },
  Mutation: {
    register: async (_parent: undefined, args: {user: UserInput}) => {
      return await fetchData<UserResponse>(`${process.env.AUTH_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args.user),
      });
    },
    login: async (
      _parent: undefined,
      args: {credentials: {username: string; password: string}},
    ) => {
      return await fetchData<LoginResponse>(
        `${process.env.AUTH_URL}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(args.credentials),
        },
      );
    },
    updateUser: async (
      _parent: undefined,
      args: {user: UserOutput},
      context: MyContext,
    ) => {
      isLoggedIn(context);
      return await fetchData<UserResponse>(`${process.env.AUTH_URL}/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.userdata?.token}`,
        },
        body: JSON.stringify(args.user),
      });
    },
    deleteUser: async (
      _parent: undefined,
      _args: undefined,
      context: MyContext,
    ) => {
      isLoggedIn(context);
      return await fetchData<UserResponse>(`${process.env.AUTH_URL}/users`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${context.userdata?.token}`,
        },
      });
    },
    updateUserAsAdmin: async (
      _parent: undefined,
      args: {user: UserOutput; id: string},
      context: MyContext,
    ) => {
      isLoggedIn(context);
      if (context.userdata?.user.role === 'admin') {
        return await fetchData<UserResponse>(
          `${process.env.AUTH_URL}/users/${args.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${context.userdata?.token}`,
            },
            body: JSON.stringify(args.user),
          },
        );
      } else {
        throw new GraphQLError('Not authorized');
      }
    },
    deleteUserAsAdmin: async (
      _parent: undefined,
      args: {id: string},
      context: MyContext,
    ) => {
      isLoggedIn(context);
      if (context.userdata?.user.role === 'admin') {
        return await fetchData<UserResponse>(
          `${process.env.AUTH_URL}/users/${args.id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${context.userdata?.token}`,
            },
          },
        );
      } else {
        throw new GraphQLError('Not authorized');
      }
    },
  },

  /*
        type Mutation {
  login(credentials: Credentials!): LoginResponsei222jaa!
  aia
  register(user: UserInput!): UserResponse
  updateUser(user: UserModify!): UserResponse
  deleteUser: UserResponse
  """
  Separate mutations for admin because of rest api
  """
  updateUserAsAdmin(user: UserModify!, id: ID!): UserResponse
  """
  Separate mutations for admin because of rest api
  """
  deleteUserAsAdmin(id: ID!): UserResponse
}
}*/
};
