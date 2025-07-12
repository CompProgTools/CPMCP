#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";

const server = new McpServer({
  name: "CPMCP",
  version: "1.0.0"
});

const inputSchema = {
  testcases: z.string().describe(
    "A string like '5 sumproblem.txt' or just '5'. The first token is the number of testcases. The second is optional filename."
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

    if (!filename) {
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
      filename = txtFiles[0].name;
    }

    const rawText = fs.readFileSync(filename, "utf-8");
    let constraintsSection = "";
    const constraintsRegex = /constraints([\s\S]*)/i;
    const m = rawText.match(constraintsRegex);
    if (m) {
      constraintsSection = m[1];
    }

    const variableConstraints = {};
    const regex = /(\d+)\s*≤\s*(\w+)\s*≤\s*([0-9\^]+)/g;
    let match;
    while ((match = regex.exec(constraintsSection)) !== null) {
      const lower = parseInt(match[1]);
      const varName = match[2];
      const upperRaw = match[3];
      let upper;
      if (upperRaw.includes("^")) {
        const parts = upperRaw.split("^");
        upper = Math.pow(Number(parts[0]), Number(parts[1]));
      } else {
        upper = parseInt(upperRaw);
      }
      variableConstraints[varName] = { lower, upper };
    }

    if (Object.keys(variableConstraints).length === 0) {
      throw new Error("No constraints found in problem file. Please ensure your problem file has a 'Constraints' section with bounds like '1 ≤ n ≤ 10^5'.");
    }

    const testcasesArr = [];
    for (let i = 0; i < numTestcases; i++) {
      let testcase = "";
      for (const [varName, bounds] of Object.entries(variableConstraints)) {
        const val = getRandomInt(bounds.lower, bounds.upper);
        testcase += `${val} `;
      }
      testcasesArr.push(testcase.trim());
    }

    return {
      content: [
        {
          type: "text",
          text:
            `✅ Problem file: ${filename}\n\n` +
            `Constraints found:\n` +
            `${JSON.stringify(variableConstraints, null, 2)}\n\n` +
            `Generated testcases:\n` +
            testcasesArr.join("\n")
        }
      ]
    };
  }
);

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const transport = new StdioServerTransport();
await server.connect(transport);