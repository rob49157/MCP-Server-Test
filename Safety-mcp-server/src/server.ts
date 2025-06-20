#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolResult,
  ListToolsResult,
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';

interface ReportData {
   fullName?: String,
    email?: String,
    phone?: String,
    message?: String,
    photo?: String,
}

class SafetyAppMCPServer {
  private server: Server;
  private baseUrl: string;

  constructor() {
    this.server = new Server(
      {
        name: "safety-app-server",
        version: "0.1.0",
      }
    
    );

    this.baseUrl = "http://localhost:3000";
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async (): Promise<ListToolsResult> => {
      return {
        tools: [
          {
            name: "get_reports",
            description: "Get all safety reports from the app",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
             {
                        name: "create_report",
                        description: "Create a new safety report",
                        inputSchema: {
                            type: "object",
                            properties: {
                                fullName: {
                                    type: "string",
                                    description: "Name of the person creating the report",
                                },
                                email: {
                                    type: "string",
                                    description: "email of the person creating the report",
                                },
                                phone: {
                                    type: "string",
                                    description: "phone number of the person creating the report",
                                },
                                message: {
                                    type: "string",
                                    description: "Message describing the issue",
                                
                            },
                            photo:{
                                    type: "string",
                                    description: "Base64 encoded photo of the issue",
                                },
                            },
                            required: ["fullname", "email", "phone", "message", "photo"],
                        },
                    },
          {
            name: "check_server_status",
            description: "Check if the safety app server is running",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_reports":
            return await this.getReports();
          
          case "create_report":
            return await this.createReport(args as ReportData);
          
          case "check_server_status":
            return await this.checkServerStatus();
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async getReports(): Promise<CallToolResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/reports/get-all-reports`);
      return {
        content: [
          {
            type: "text",
            text: `Found ${response.data.length} reports:\n${JSON.stringify(response.data, null, 2)}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      throw new Error(`Failed to get reports: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async createReport(args: ReportData): Promise<CallToolResult> {
    try {
      const reportData = {
        fullName: args.fullName,
        email: args.email,
        phone: args.phone,
        message: args.message
      };

      const response = await axios.post(`${this.baseUrl}/reports/submit-form`, reportData);
      
      return {
        content: [
          {
            type: "text",
            text: `Report created successfully:\n${JSON.stringify(response.data, null, 2)}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      throw new Error(`Failed to create report: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async checkServerStatus(): Promise<CallToolResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/`);
      return {
        content: [
          {
            type: "text",
            text: `Server is running! Response: ${response.data}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      throw new Error(`Server is not responding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Safety App MCP server running on stdio");
  }
}

const server = new SafetyAppMCPServer();
server.run().catch(console.error);