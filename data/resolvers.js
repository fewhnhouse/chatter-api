import GraphQLDate from "graphql-date";
import { Group, Message, User } from "./connectors";
export const Resolvers = {
  Date: GraphQLDate,
  Query: {
    group(_, args) {
      return Group.find({ where: args });
    },
    messages(_, args) {
      return Message.findAll({
        where: args,
        order: [["createdAt", "DESC"]]
      });
    },
    user(_, args) {
      return User.findOne({ where: args });
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
      return User.findOne({ where: { id: userId } })
        .then(friends =>
          Group.create({
            name,
            users: [user, ...friends]
          })
        )
        .then(group => group.addUsers({ user, ...friends }))
        .then(() => group);
    },
    deleteGroup(_, { id }) {
      return Group.findOne({ where: id }).then(group => {
        group
          .getUsers()
          .then(users => group.removeUsers(users))
          .then(() => Message.destroy({ where: { groupId: group.id } }))
          .then(() => group.destroy());
      });
    }
  },
  leaveGroup(_, { id, userId }) {
    /*const group = await Group.findOne({ where: id });
    await group.removeUser(userId);
    const users = await group.getUsers();
    if (!users.length) {
      group.destroy();
      //deleteGroup(_, { id });
    }
    return { id };
    */
    return Group.findOne({ where: id }).then(group => {
      group.removeUser(userId).then(() => {
        group.getUsers().then(users => {
          if (!users.length) {
            group.destroy();
            //deleteGroup(_, { id });
          }
          return { id };
        });
      });
    });
    
  },
  updateGroup(_, { id, name }) {
    return Group.findOne({ where: id }).then(group => {
      group.update({ name });
    });
  }
};
export default Resolvers;
