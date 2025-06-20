#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';
class SafetyAppMCPServer {
    server;
    baseUrl;
    constructor() {
        this.server = new Server({
            name: "safety-app-server",
            version: "0.1.0",
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.baseUrl = "http://localhost:3000";
        this.setupHandlers();
    }
    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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
                                fullname: {
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
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case "get_reports":
                        return await this.getReports();
                    case "create_report":
                        return await this.createReport(args);
                    case "check_server_status":
                        return await this.checkServerStatus();
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
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
    async getReports() {
        try {
            const response = await axios.get(`${this.baseUrl}/reports/get-all-reports`);
            return {
                content: [
                    {
                        type: "text",
                        text: `Found ${response.data.length} reports:\n${JSON.stringify(response.data, null, 2)}`,
                    },
                ],
            };
        }
        catch (error) {
            throw new Error(`Failed to get reports: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async createReport(args) {
        try {
            const reportData = {
                title: args.title,
                description: args.description,
                severity: args.severity || "medium",
                createdAt: new Date(),
            };
            const response = await axios.post(`${this.baseUrl}/reports/submit-form`, reportData);
            return {
                content: [
                    {
                        type: "text",
                        text: `Report created successfully:\n${JSON.stringify(response.data, null, 2)}`,
                    },
                ],
            };
        }
        catch (error) {
            throw new Error(`Failed to create report: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async checkServerStatus() {
        try {
            const response = await axios.get(`${this.baseUrl}/`);
            return {
                content: [
                    {
                        type: "text",
                        text: `Server is running! Response: ${response.data}`,
                    },
                ],
            };
        }
        catch (error) {
            throw new Error(`Server is not responding: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("Safety App MCP server running on stdio");
    }
}
const server = new SafetyAppMCPServer();
server.run().catch(console.error);
