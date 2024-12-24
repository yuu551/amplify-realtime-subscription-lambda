import { defaultProvider } from "@aws-sdk/credential-provider-node";
import axios from "axios";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-universal";

// AppSync Mutationの入力型定義
type DeviceStatusInput = {
  device_Id: string;
  humidity: number;
  temperature: number;
  voltage: string;
  last_updated: string;
  status_code: string;
  status_description: string;
  status_state: string;
};

type CreateDeviceStatusVariables = {
  input: DeviceStatusInput;
};

const CREATE_DEVICE_STATUS = `
  mutation CreateDeviceStatus($input: CreateDeviceStatusInput!) {
    createDeviceStatus(input: $input) {
      id
      device_Id
      humidity
      temperature
      voltage
      last_updated
      status_code
      status_description
      status_state
      createdAt
      updatedAt
    }
  }
`;

async function createSignedRequest(query: string, variables: CreateDeviceStatusVariables) {
  const url = new URL(process.env.APPSYNC_ENDPOINT!);
  const body = { query, variables };

  const request = {
    headers: {
      "Content-Type": "application/json",
      host: url.hostname,
    },
    hostname: url.hostname,
    method: "POST",
    path: url.pathname,
    protocol: url.protocol,
    body: JSON.stringify(body),
  };

  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region: process.env.REGION || "ap-northeast-1",
    service: "appsync",
    sha256: Sha256,
  });

  return { signedRequest: await signer.sign(request), body };
}

function getRandomNumber(
  min: number,
  max: number,
  decimals: number = 1
): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function getRandomDeviceId(): string {
  return `device_${String(Math.floor(Math.random() * 100)).padStart(3, "0")}`;
}

export const handler = async (event: any) => {
  try {
    if (!process.env.APPSYNC_ENDPOINT) {
      throw new Error("APPSYNC_ENDPOINT environment variable is not set");
    }

    const variables = {
      input: {
        device_Id: getRandomDeviceId(), // device_001 ~ device_099
        humidity: getRandomNumber(30, 80, 1), // 30.0 ~ 80.0
        temperature: getRandomNumber(15, 35, 1), // 15.0 ~ 35.0
        voltage: getRandomNumber(11, 13, 1).toString(), // "11.0" ~ "13.0"
        last_updated: new Date().toISOString(),
        status_code: "200",
        status_description: "Normal operation",
        status_state: "NORMAL",
      },
    };

    const { signedRequest, body } = await createSignedRequest(
      CREATE_DEVICE_STATUS,
      variables
    );

    const response = await axios.post(
      `${signedRequest.protocol}//${signedRequest.hostname}${signedRequest.path}`,
      body,
      {
        headers: signedRequest.headers,
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
