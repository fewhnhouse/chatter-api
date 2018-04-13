import express from "express";
import { graphqlExpress, graphiqlExpress } from "apollo-server-express";
import { makeExecutableSchema, addMockFunctionsToSchema } from "graphql-tools";
import bodyParser from "body-parser";
import { createServer } from "http";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { execute, subscribe } from "graphql";
import { Resolvers } from "./data/resolvers";
import { Schema } from "./data/schema";
import { Mocks } from "./data/mocks";
import { executableSchema } from "./data/schema";
const GRAPHQL_PORT = 7070;
const GRAPHQL_PATH = "/graphql";
const SUBSCRIPTIONS_PATH = "/subscriptions";

const app = express();

// `context` must be an object and can't be undefined when using connectors
app.use(
  "/graphql",
  bodyParser.json(),
  graphqlExpress({
    schema: executableSchema,
    context: {} // at least(!) an empty object
  })
);
app.use(
  "/graphiql",
  graphiqlExpress({
    endpointURL: GRAPHQL_PATH,
    subscriptionsEndpoint: `ws://localhost:${GRAPHQL_PORT}${SUBSCRIPTIONS_PATH}`
  })
);
const graphQLServer = createServer(app);
graphQLServer.listen(GRAPHQL_PORT, () => {
  console.log(
    `GraphQL Server is now running on http://localhost:${GRAPHQL_PORT}${GRAPHQL_PATH}`
  );
  console.log(
    `GraphQL Subscriptions are now running on ws://localhost:${GRAPHQL_PORT}${SUBSCRIPTIONS_PATH}`
  );
});
// eslint-disable-next-line no-unused-vars
const subscriptionServer = SubscriptionServer.create(
  {
    schema: executableSchema,
    execute,
    subscribe
  },
  {
    server: graphQLServer,
    path: SUBSCRIPTIONS_PATH
  }
);
