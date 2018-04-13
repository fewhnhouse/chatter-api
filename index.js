import express from "express";
import { graphqlExpress, graphiqlExpress } from "apollo-server-express";
import { makeExecutableSchema, addMockFunctionsToSchema } from "graphql-tools";
import bodyParser from "body-parser";
import { createServer } from "http";
import { Resolvers } from './data/resolvers';
import { Schema } from "./data/schema";
import { Mocks } from "./data/mocks";
import { executableSchema } from './data/schema';
const GRAPHQL_PORT = 7070;
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
    endpointURL: "/graphql"
  })
);
const graphQLServer = createServer(app);
graphQLServer.listen(GRAPHQL_PORT, () =>
  console.log(
    `GraphQL Server is now running on http://localhost:${GRAPHQL_PORT}/graphql`
  )
);
