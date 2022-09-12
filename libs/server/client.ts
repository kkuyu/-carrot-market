import { PrismaClient } from "@prisma/client";

declare const global: Global & { client?: PrismaClient };

export let client: PrismaClient;

if (typeof window === "undefined") {
  if (process.env["NODE_ENV"] === "production") {
    client = new PrismaClient();
  } else {
    if (!global.client) global.client = new PrismaClient();
    client = global.client;
  }
}

export default client;
