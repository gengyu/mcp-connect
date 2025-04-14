import { PersistenceService } from './persistenceService';
import {spawn, ChildProcess} from 'child_process';
import {
    MCPConfig,
    ConfigService,
    ConfigValidationResult,
    ConfigValidationError,
    ConfigStorageOptions,
    MCPConfigListItem
} from '../types/config';
import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {StdioClientTransport,} from "@modelcontextprotocol/sdk/client/stdio.js";
import {StatusService} from "./statusService.ts";

// import {Transport} from '@modelcontextprotocol/sdk/shared/transport.js';

export class FileConfigService implements ConfigService {
    private runningMCPs: Set<string> = new Set();
    private autoStartEnabled: boolean = true;
    private mcpProcesses: Map<string, Client> = new Map();
    private persistenceService: PersistenceService;
    private statusService: StatusService;

    constructor(options?: ConfigStorageOptions) {
        this.persistenceService = new PersistenceService({
            dataDir: options?.dataDir,
            configFileName: 'config.json'
        });

        this.statusService = new StatusService();

        // 监听MCP自动启动事件
        this.persistenceService.on(PersistenceService.EVENT_MCP_AUTO_START, async (id: string) => {
            if (this.autoStartEnabled) {
                try {
                    const config = await this.loadConfig();
                    if (config.mcpServers[id]?.isRunning) {
                        await this.toggleMCPStatus(id);
                    }
                } catch (error) {
                    console.error(`Failed to auto-start MCP ${id}:`, error);
                }
            }
        });
    }

    async saveConfig(config: MCPConfig): Promise<void> {
        const validation = this.validateConfig(config);
        if (!validation.isValid) {
            throw new ConfigValidationError('Invalid configuration', validation.errors || []);
        }

        try {
            await this.persistenceService.saveData(config);
        } catch (error) {
            throw new Error(`Failed to save config: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async loadConfig(): Promise<MCPConfig> {
        try {
            await this.persistenceService.initialize();
            const config = await this.persistenceService.loadData();
            const validation = this.validateConfig(config);

            if (!validation.isValid) {
                throw new ConfigValidationError('Invalid configuration', validation.errors || []);
            }

            return config;
        } catch (error) {
            if (error instanceof ConfigValidationError) {
                throw error;
            }
            throw new Error(`Failed to load config: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getConfigList(): Promise<MCPConfigListItem[]> {
        try {
            const config = await this.loadConfig();
            const statusMap = await this.statusService.getAllStatus();
            const configList: MCPConfigListItem[] = [];

            Object.entries(config.mcpServers).forEach(([id, serverConfig]) => {
                configList.push({
                    id,
                    name: serverConfig.name || `MCP配置${id}`,
                    isRunning: statusMap[id]?.isRunning || this.runningMCPs.has(id)
                });
            });

            return configList;
        } catch (error) {
            throw new Error(`Failed to get config list: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async toggleMCPStatus(id: string, updateConfig: boolean = true): Promise<boolean> {
        try {
            const config = await this.loadConfig();
            if (!config.mcpServers || !config.mcpServers[id]) {
                throw new Error(`MCP configuration with ID ${id} not found`);
            }

            const currentStatus = await this.statusService.getStatus(id);
            const newStatus = !currentStatus;

            if (currentStatus) {
                this.runningMCPs.delete(id);
                const process = this.mcpProcesses.get(id);
                if (process) {
                    this.mcpProcesses.delete(id);
                    console.log(`Stopping MCP server: ${id}`);
                }
            } else {
                const serverConfig = config.mcpServers[id];
                if (!serverConfig.command) {
                    throw new Error(`MCP server configuration is missing command: ${id}`);
                }

                try {
                    await this.startMCPProcess(id, serverConfig);
                    console.log(`Starting MCP server: ${id}`);
                } catch (err) {
                    console.error(err);
                    this.runningMCPs.delete(id);
                    throw new Error(`Failed to start MCP server: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
            }

            await this.statusService.setStatus(id, newStatus);
            if (updateConfig) {
                await this.saveConfig(config);
            }
            return newStatus;
        } catch (error) {
            throw new Error(`Failed to toggle MCP status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async capabilities(id: string) {
        try {
            const client = this.mcpProcesses.get(id);
            return client?.listTools();
        } catch (error) {
            throw new Error(`Failed to toggle MCP status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async isMCPRunning(id: string): Promise<boolean> {
        return await this.statusService.getStatus(id);
    }


    private async startMCPProcess(id: string, serverConfig: { command: string; args?: string[] }): Promise<void> {
        console.log(`Starting MCP server: id, ${JSON.stringify(serverConfig)}`)

        const transport = new StdioClientTransport({
            command: serverConfig.command,
            args: serverConfig.args,
            stderr: 'pipe'
        });


        if (this.mcpProcesses.get(id)) {
            return;
        }

        const client = new Client({
                name: "example-client",
                version: "1.0.0"
            },
            {
                capabilities: {
                    resources: {},
                    tools: {},
                    prompts: {}
                }
            });


        await client.connect(transport);

        try {
            // List prompts
            const prompts = await client.listTools();
            console.log('prompts', prompts)
        } catch (e) {
            console.error(e);
        }


        // 保存进程引用
        this.mcpProcesses.set(id, client);
        this.runningMCPs.add(id);
    }

    validateConfig(config: MCPConfig): ConfigValidationResult {
        const errors: string[] = [];

        if (!config.serverUrl) {
            errors.push('Server URL is required');
        } else if (!this.isValidUrl(config.serverUrl)) {
            errors.push('Invalid server URL format');
        }

        if (config.transport && !['stdio', 'http'].includes(config.transport)) {
            errors.push('Transport must be either "stdio" or "http"');
        }

        if (config.debug !== undefined && typeof config.debug !== 'boolean') {
            errors.push('Debug must be a boolean value');
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

