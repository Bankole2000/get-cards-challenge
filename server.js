// Imports
const express = require("express");
const expressGraphQL = require("express-graphql");
const fetch = require('node-fetch');
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLEnumType, 
  GraphQLFloat
} = require("graphql");

// Set port and Create Express app;
const PORT = process.env.PORT || 5000;
const app = express();

// Create Schema + Types
const Type = new GraphQLEnumType({
  name: "Type", 
  description: "The type of action, whether it's buy or sell", 
  values: {
    buy: {
      value: "buy"
    }, 
    sell: {
      value: "sell"
    }
  }, 
})

const RootQueryType = new GraphQLObjectType({
  name: "Query", 
  description: "Root Query", 
  fields: () => ({
    calculatePrice: {
      type: GraphQLFloat, 
      description: "Calculate Bitcoin Exchange Rate for buying or selling", 
      args: {
        type: {
          type: new GraphQLNonNull(Type),
        }, 
        margin: {
          type: new GraphQLNonNull(GraphQLFloat)
        }, 
        exchangeRate: {
          type: new GraphQLNonNull(GraphQLFloat)
        }
      }, 
      resolve: async(parent, {type, margin, exchangeRate}, context, info) => {
        const res = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json');
        const data = await res.json();
        const { bpi: { USD: { rate }}} = data;
        const currentExchangeRate = parseFloat(rate);
        const computedUSDRate = type === "sell" ? currentExchangeRate - ((currentExchangeRate * margin)/ 100) : currentExchangeRate + ((currentExchangeRate * margin)/ 100);
        const computedNGNRate = computedUSDRate * exchangeRate
        return computedNGNRate;
      }
    }
  })
});

const schema = new GraphQLSchema({
  query: RootQueryType, 
})

// Register Schema + Endpoint
app.use("/graphiql",
  expressGraphQL.graphqlHTTP({
    schema, 
    graphiql: true
  })
)

// Start the server
app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});