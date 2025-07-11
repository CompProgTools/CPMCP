#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "CPMCP",
  version: "1.0.0"
});

const inputSchema = {
  testcases: z.string().describe("The number of testcases and if possible the name of the .txt file")
};

const transport = new StdioServerTransport();
await server.connect(transport);