import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { functionWithDataAccess } from "./functions/data-access/resource";
import * as cdk from "aws-cdk-lib";

const backend = defineBackend({
  auth,
  data,
  functionWithDataAccess,
});

// Appsyncのエンドポイントを環境変数として追加
backend.functionWithDataAccess.addEnvironment(
  "APPSYNC_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl
);

// Lambda関数にAppsyncへの権限を追加
backend.data.resources.graphqlApi.grant(
  backend.functionWithDataAccess.resources.lambda,
  cdk.aws_appsync.IamResource.all(),
  "appsync:GraphQL"
);