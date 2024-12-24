import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a
  .schema({
    DeviceStatus: a
      .model({
        device_Id: a.string(),
        status_code: a.string(),
        status_state: a.string(),
        status_description: a.string(),
        temperature: a.float(),
        humidity: a.float(),
        voltage: a.string(),
        last_updated: a.string(),
      })
  })
  .authorization((allow) => [allow.authenticated()]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
