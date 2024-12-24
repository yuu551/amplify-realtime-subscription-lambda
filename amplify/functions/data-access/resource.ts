import { defineFunction } from "@aws-amplify/backend";

export const functionWithDataAccess = defineFunction({
  name: "data-access",
  entry: "./handler.ts"
});
