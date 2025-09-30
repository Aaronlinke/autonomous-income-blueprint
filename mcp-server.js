#!/usr/bin/env node

/**
 * MCP Server für Autonomous Income Agent
 * Ermöglicht die Kommunikation zwischen KI-Assistenten und dem Autonomous Income System
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

class AutonomousIncomeServer {
  constructor() {
    this.server = new Server(
      {
        name: 'autonomous-income-agent',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_opportunities',
            description: 'Ruft alle identifizierten Einkommensmöglichkeiten ab',
            inputSchema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  description: 'Filter nach Status (pending, approved, rejected)',
                  enum: ['pending', 'approved', 'rejected']
                }
              }
            }
          },
          {
            name: 'approve_opportunity',
            description: 'Genehmigt eine Einkommensmöglichkeit zur Umsetzung',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'ID der zu genehmigenden Opportunity'
                }
              },
              required: ['id']
            }
          },
          {
            name: 'reject_opportunity',
            description: 'Lehnt eine Einkommensmöglichkeit ab',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'ID der abzulehnenden Opportunity'
                },
                reason: {
                  type: 'string',
                  description: 'Grund für die Ablehnung'
                }
              },
              required: ['id']
            }
          },
          {
            name: 'start_agent',
            description: 'Startet den autonomen KI-Agenten zur Opportunity-Suche',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'stop_agent',
            description: 'Stoppt den autonomen KI-Agenten',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_agent_status',
            description: 'Ruft den aktuellen Status des KI-Agenten ab',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_performance_stats',
            description: 'Ruft Performance-Statistiken des Systems ab',
            inputSchema: {
              type: 'object',
              properties: {
                timeframe: {
                  type: 'string',
                  description: 'Zeitraum für die Statistiken (7d, 30d, 90d)',
                  enum: ['7d', '30d', '90d'],
                  default: '30d'
                }
              }
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_opportunities':
            return await this.getOpportunities(args.status);
          
          case 'approve_opportunity':
            return await this.approveOpportunity(args.id);
          
          case 'reject_opportunity':
            return await this.rejectOpportunity(args.id, args.reason);
          
          case 'start_agent':
            return await this.startAgent();
          
          case 'stop_agent':
            return await this.stopAgent();
          
          case 'get_agent_status':
            return await this.getAgentStatus();
          
          case 'get_performance_stats':
            return await this.getPerformanceStats(args.timeframe || '30d');
          
          default:
            throw new Error(`Unbekanntes Tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Fehler beim Ausführen von ${name}: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async getOpportunities(status) {
    try {
      let url = `${API_BASE}/opportunities`;
      if (status) {
        url += `?status=${status}`;
      }
      
      const response = await fetch(url);
      const opportunities = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: `Gefundene Opportunities: ${opportunities.length}\n\n` +
                  opportunities.map(opp => 
                    `🎯 **${opp.title}**\n` +
                    `   Potenzial: €${opp.potential_revenue.toLocaleString()}\n` +
                    `   ROI: ${opp.roi_estimate.toFixed(2)}\n` +
                    `   Kategorie: ${opp.category}\n` +
                    `   Status: ${opp.status}\n` +
                    `   Risiko: ${opp.risk_score < 0.3 ? 'Niedrig' : opp.risk_score < 0.6 ? 'Mittel' : 'Hoch'}\n`
                  ).join('\n')
          }
        ]
      };
    } catch (error) {
      throw new Error(`Fehler beim Abrufen der Opportunities: ${error.message}`);
    }
  }

  async approveOpportunity(id) {
    try {
      const response = await fetch(`${API_BASE}/opportunities/${id}/approve`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Opportunity ${id} wurde erfolgreich genehmigt!\n\n` +
                  `Die Umsetzung wird automatisch eingeleitet. Sie erhalten Updates über den Fortschritt.`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Fehler beim Genehmigen der Opportunity: ${error.message}`);
    }
  }

  async rejectOpportunity(id, reason) {
    try {
      const response = await fetch(`${API_BASE}/opportunities/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ Opportunity ${id} wurde abgelehnt.\n\nGrund: ${reason || 'Nicht angegeben'}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Fehler beim Ablehnen der Opportunity: ${error.message}`);
    }
  }

  async startAgent() {
    try {
      const response = await fetch(`${API_BASE}/agent/start`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `🚀 KI-Agent wurde erfolgreich gestartet!\n\n` +
                  `Der Agent sucht nun kontinuierlich nach neuen Einkommensmöglichkeiten und analysiert diese automatisch. ` +
                  `Sie erhalten Benachrichtigungen über neue Opportunities zur Genehmigung.`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Fehler beim Starten des Agenten: ${error.message}`);
    }
  }

  async stopAgent() {
    try {
      const response = await fetch(`${API_BASE}/agent/stop`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `⏹️ KI-Agent wurde gestoppt.\n\n` +
                  `Die autonome Suche nach Einkommensmöglichkeiten wurde pausiert. ` +
                  `Bereits identifizierte Opportunities bleiben verfügbar.`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Fehler beim Stoppen des Agenten: ${error.message}`);
    }
  }

  async getAgentStatus() {
    try {
      const response = await fetch(`${API_BASE}/agent/status`);
      const status = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: `🤖 **Agent Status**\n\n` +
                  `Status: ${status.running ? '🟢 Aktiv' : '🔴 Inaktiv'}\n` +
                  `Letzter Scan: ${status.lastScan ? new Date(status.lastScan).toLocaleString('de-DE') : 'Nie'}\n` +
                  `Nächster Scan: ${status.nextScan ? new Date(status.nextScan).toLocaleString('de-DE') : 'Nicht geplant'}\n` +
                  `Gefundene Opportunities: ${status.totalOpportunities || 0}\n` +
                  `Genehmigte Opportunities: ${status.approvedOpportunities || 0}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Fehler beim Abrufen des Agent-Status: ${error.message}`);
    }
  }

  async getPerformanceStats(timeframe) {
    try {
      const response = await fetch(`${API_BASE}/stats?timeframe=${timeframe}`);
      const stats = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: `📊 **Performance Statistiken (${timeframe})**\n\n` +
                  `💰 Gesamtpotenzial: €${stats.totalPotential?.toLocaleString() || '0'}\n` +
                  `✅ Genehmigte Opportunities: ${stats.approvedCount || 0}\n` +
                  `📈 Durchschnittlicher ROI: ${stats.avgROI?.toFixed(2) || '0.00'}\n` +
                  `🎯 Erfolgsrate: ${stats.successRate?.toFixed(1) || '0.0'}%\n` +
                  `🔍 Neue Opportunities: ${stats.newOpportunities || 0}\n\n` +
                  `**Top Kategorien:**\n` +
                  (stats.topCategories || []).map(cat => 
                    `• ${cat.name}: ${cat.count} Opportunities (€${cat.potential?.toLocaleString() || '0'})`
                  ).join('\n')
          }
        ]
      };
    } catch (error) {
      throw new Error(`Fehler beim Abrufen der Performance-Statistiken: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Autonomous Income MCP Server läuft auf stdio');
  }
}

const server = new AutonomousIncomeServer();
server.run().catch(console.error);
