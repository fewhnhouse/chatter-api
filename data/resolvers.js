import GraphQLDate from "graphql-date";

import { Group, Message, User } from "./connectors";

export const Resolvers = {
  Date: GraphQLDate,
  PageInfo: {
    hasNextPage(connection, args) {
      return connection.hasNextPage();
    },
    hasPreviousPage(connection, args) {
      return connection.hasPreviousPage();
    }
  },

  Query: {
    group(_, args) {
      return Group.find({ where: args });
    },

    messages(group, { first, last, before, after }) {
      //base query -- get messages from right grp
      const where = { groupId: group.id };
      // because we return messages from newest -> oldest
      // before actually means newer (id > cursor)
      // after actually means older (id < cursor)
      if (before) {
        where.id = { $gt: Buffer.from(before, "base64").toString() };
      }

      if (after) {
        where.id = { $lt: Buffer.from(after, "base64".toString()) };
      }

      return Message.findAll({
        where,
        order: [["id", "DESC"]],
        limit: first || last
      }).then(messages => {
        const edges = messages.map(message => ({
          cursor: Buffer.from(message.id.toString()).toString("base64"), //this is the base64 encoded id of the message as cursor
          node: message //this is the message itself
        }));

        return {
          edges,
          pageInfo: {
            hasNextPage() {
              if (messages.length < (last || first)) {
                return Promise.resolve(false);
              }

              return Message.findOne({
                where: {
                  groupId: group.id,
                  id: {
                    [before ? "$gt" : "$lt"]: messages[messages.length - 1].id
                  }
                },
                order: [["id", "DESC"]]
              }).then(message => !!message);
            },
            hasPreviousPage() {
              return Message.findOne({
                where: {
                  groupId: group.id,
                  id: where.id
                },
                order: [["id"]]
              }).then(message => !!message);
            }
          }
        };
      });
    },

    user(_, args) {
      return User.findOne({ where: args });
    }
  },

  Mutation: {
    createMessage(_, { text, userId, groupId }) {
      return Message.create({
        userId,
        text,
        groupId
      });
    },

    createGroup(_, { name, userIds, userId }) {
      return User.findOne({ where: { id: userId } }).then(user =>
        user.getFriends({ where: { id: { $in: userIds } } }).then(friends =>
          Group.create({
            name,
            users: [user, ...friends]
          }).then(group => group.addUsers([user, ...friends]).then(() => group))
        )
      );
    },

    deleteGroup(_, { id }) {
      return Group.find({ where: id }).then(group =>
        group
          .getUsers()
          .then(users => group.removeUsers(users))
          .then(() => Message.destroy({ where: { groupId: group.id } }))
          .then(() => group.destroy())
      );
    },

    leaveGroup(_, { id, userId }) {
      return Group.findOne({ where: { id } }).then(group =>
        group
          .removeUser(userId)
          .then(() => group.getUsers())
          .then(users => {
            // if the last user is leaving, remove the group
            if (!users.length) {
              group.destroy();
            }
            return { id };
          })
      );
    },
    updateGroup(_, { id, name }) {
      return Group.findOne({ where: { id } }).then(group =>
        group.update({ name })
      );
    }
  },

  Group: {
    users(group) {
      return group.getUsers();
    },
    messages(group) {
      return Message.findAll({
        where: { groupId: group.id },

        order: [["createdAt", "DESC"]]
      });
    }
  },

  Message: {
    to(message) {
      return message.getGroup();
    },
    from(message) {
      return message.getUser();
    }
  },

  User: {
    messages(user) {
      return Message.findAll({
        where: { userId: user.id },
        order: [["createdAt", "DESC"]]
      });
    },
    groups(user) {
      return user.getGroups();
    },
    friends(user) {
      return user.getFriends();
    }
  }
};

export default Resolvers;
