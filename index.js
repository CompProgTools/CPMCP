#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";
import path from "path";

const server = new McpServer({
  name: "CPMCP",
  version: "1.0.0"
});

const inputSchema = {
  testcases: z.string().describe(
    "A string like '5 sumproblem.txt' or just '5'. The first token is the number of testcases. The second is optional path to a problem file."
  )
};

server.registerTool(
  "generateCPTestcases",
  {
    title: "Competitive Programming MCP",
    description:
      "Generate random testcases for a CP problem from constraints and problem description in a problem.txt file",
    inputSchema
  },
  async ({ testcases }) => {
    let tokens = testcases.trim().split(/\s+/);
    let numTestcases = parseInt(tokens[0]);
    let filename = tokens[1];

    if (isNaN(numTestcases) || numTestcases <= 0) {
      throw new Error("Please provide a valid positive integer for number of testcases");
    }

    let filepath;

    if (filename) {
      if (path.isAbsolute(filename)) {
        filepath = filename;
      } else {
        filepath = path.resolve(filename);
      }
      if (!fs.existsSync(filepath)) {
        throw new Error(`File "${filepath}" does not exist.`);
      }
    } else {
      const txtFiles = fs
        .readdirSync(".")
        .filter(f => f.endsWith(".txt"))
        .map(f => ({
          name: f,
          mtime: fs.statSync(f).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);

      if (txtFiles.length === 0) {
        throw new Error("No .txt problem files found in the current directory.");
      }
      filepath = path.resolve(txtFiles[0].name);
    }

    const problemContent = fs.readFileSync(filepath, "utf-8");

    return {
      content: [
        {
          type: "text",
          text: `Please analyze this competitive programming problem and generate ${numTestcases} random test cases based on the constraints found in the problem description.

Problem file: ${filepath}

Problem content:
${problemContent}

Please:
1. Extract the constraints from the problem description
2. Generate ${numTestcases} random test cases that satisfy these constraints
3. Format the output as individual test cases, one per line

If you cannot find clear constraints in the problem description, please let me know what constraints you need clarified.`
        }
      ]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);