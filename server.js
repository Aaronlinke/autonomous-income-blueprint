#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cron from 'node-cron';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Konfiguration laden
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Datenbank initialisieren
const db = new sqlite3.Database(join(__dirname, 'agent.db'));

// Tabellen erstellen
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    potential_revenue REAL,
    risk_score REAL,
    effort_score REAL,
    roi_estimate REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME,
    data TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opportunity_id INTEGER,
    metric_name TEXT,
    metric_value REAL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT UNIQUE,
    api_key TEXT,
    additional_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// OpenAI Client (falls API-Key vorhanden)
let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

class AutonomousIncomeAgent {
  constructor() {
    this.opportunities = [];
    this.performanceData = {};
    this.isRunning = false;
  }

  // Opportunity-Finder Algorithmus
  async findOpportunities() {
    console.log('🔍 Suche nach neuen Einkommensmöglichkeiten...');
    
    const opportunities = [];

    try {
      // 1. Trend-Analyse durch Web-Scraping
      const trendOpportunities = await this.analyzeTrends();
      opportunities.push(...trendOpportunities);

      // 2. Affiliate-Netzwerk Analyse (simuliert, da keine echten API-Keys)
      const affiliateOpportunities = await this.analyzeAffiliateNetworks();
      opportunities.push(...affiliateOpportunities);

      // 3. Digitale Produkt-Marktanalyse
      const productOpportunities = await this.analyzeDigitalProductMarkets();
      opportunities.push(...productOpportunities);

      // 4. Content-Gap Analyse
      const contentOpportunities = await this.analyzeContentGaps();
      opportunities.push(...contentOpportunities);

      // Opportunities bewerten und speichern
      for (const opp of opportunities) {
        await this.evaluateAndStoreOpportunity(opp);
      }

      console.log(`✅ ${opportunities.length} neue Opportunities gefunden und analysiert`);
      return opportunities;

    } catch (error) {
      console.error('❌ Fehler bei der Opportunity-Suche:', error);
      return [];
    }
  }

  // Trend-Analyse durch Web-Scraping
  async analyzeTrends() {
    const trends = [];
    
    try {
      // Beispiel: Reddit Trends analysieren
      const response = await axios.get('https://www.reddit.com/r/Entrepreneur/hot.json', {
        headers: { 'User-Agent': 'AutonomousIncomeAgent/1.0' }
      });

      const posts = response.data.data.children.slice(0, 10);
      
      for (const post of posts) {
        const postData = post.data;
        if (postData.score > 100 && postData.title.toLowerCase().includes('passive income')) {
          trends.push({
            title: `Reddit Trend: ${postData.title.substring(0, 50)}...`,
            description: `Trending topic auf r/Entrepreneur mit ${postData.score} Upvotes`,
            category: 'social_media_trend',
            source: 'reddit',
            potential_revenue: this.estimateRevenue(postData.score, 'social_trend'),
            risk_score: 0.3,
            effort_score: 0.6,
            data: JSON.stringify(postData)
          });
        }
      }
    } catch (error) {
      console.log('⚠️ Reddit API nicht verfügbar, verwende simulierte Trends');
      // Fallback: Simulierte Trends
      trends.push({
        title: 'KI-Tools für Content-Erstellung',
        description: 'Wachsender Markt für KI-basierte Content-Tools',
        category: 'digital_product',
        source: 'trend_analysis',
        potential_revenue: 2500,
        risk_score: 0.2,
        effort_score: 0.7,
        data: JSON.stringify({ trend_strength: 'high', competition: 'medium' })
      });
    }

    return trends;
  }

  // Affiliate-Netzwerk Analyse (simuliert)
  async analyzeAffiliateNetworks() {
    const affiliateOpps = [];

    // Simulierte Affiliate-Opportunities
    const simulatedPrograms = [
      {
        title: 'Software-Tools Affiliate Programm',
        description: 'Hochkonvertierende Software-Tools mit 30% Provision',
        category: 'affiliate_marketing',
        source: 'affiliate_network',
        potential_revenue: 1800,
        risk_score: 0.15,
        effort_score: 0.4,
        data: JSON.stringify({ 
          commission_rate: 0.30, 
          conversion_rate: 0.05,
          avg_order_value: 120
        })
      },
      {
        title: 'Online-Kurse Affiliate Nische',
        description: 'Bildungsbereich mit steigender Nachfrage',
        category: 'affiliate_marketing',
        source: 'affiliate_network',
        potential_revenue: 3200,
        risk_score: 0.25,
        effort_score: 0.6,
        data: JSON.stringify({ 
          commission_rate: 0.40, 
          conversion_rate: 0.03,
          avg_order_value: 200
        })
      }
    ];

    affiliateOpps.push(...simulatedPrograms);
    return affiliateOpps;
  }

  // Digitale Produkt-Marktanalyse
  async analyzeDigitalProductMarkets() {
    const productOpps = [];

    // Simulierte Marktanalyse für digitale Produkte
    const productIdeas = [
      {
        title: 'Notion-Templates für Produktivität',
        description: 'Spezialisierte Templates für Remote-Worker',
        category: 'digital_product',
        source: 'market_analysis',
        potential_revenue: 1500,
        risk_score: 0.2,
        effort_score: 0.5,
        data: JSON.stringify({ 
          market_size: 'medium', 
          competition: 'low',
          profit_margin: 0.85
        })
      },
      {
        title: 'KI-Prompt Bibliothek',
        description: 'Sammlung optimierter Prompts für verschiedene KI-Tools',
        category: 'digital_product',
        source: 'market_analysis',
        potential_revenue: 2800,
        risk_score: 0.3,
        effort_score: 0.4,
        data: JSON.stringify({ 
          market_size: 'large', 
          competition: 'medium',
          profit_margin: 0.90
        })
      }
    ];

    productOpps.push(...productIdeas);
    return productOpps;
  }

  // Content-Gap Analyse
  async analyzeContentGaps() {
    const contentOpps = [];

    // Simulierte Content-Gap Analyse
    if (openaiClient) {
      try {
        const completion = await openaiClient.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "user",
            content: "Identifiziere 2 Content-Lücken im Bereich passives Einkommen, die sich für Affiliate-Marketing eignen. Antworte im JSON-Format mit title, description, potential_revenue (Zahl), risk_score (0-1), effort_score (0-1)."
          }],
          max_tokens: 500
        });

        const aiResponse = completion.choices[0].message.content;
        try {
          const aiOpportunities = JSON.parse(aiResponse);
          if (Array.isArray(aiOpportunities)) {
            contentOpps.push(...aiOpportunities.map(opp => ({
              ...opp,
              category: 'content_gap',
              source: 'ai_analysis',
              data: JSON.stringify({ generated_by: 'openai' })
            })));
          }
        } catch (parseError) {
          console.log('⚠️ KI-Antwort konnte nicht geparst werden');
        }
      } catch (error) {
        console.log('⚠️ OpenAI API nicht verfügbar');
      }
    }

    // Fallback: Simulierte Content-Gaps
    if (contentOpps.length === 0) {
      contentOpps.push({
        title: 'YouTube-Automation Guides',
        description: 'Detaillierte Anleitungen für YouTube-Kanal Automatisierung',
        category: 'content_gap',
        source: 'gap_analysis',
        potential_revenue: 2100,
        risk_score: 0.25,
        effort_score: 0.7,
        data: JSON.stringify({ search_volume: 'high', competition: 'low' })
      });
    }

    return contentOpps;
  }

  // Revenue-Schätzung
  estimateRevenue(metric, type) {
    const baseRevenue = {
      'social_trend': 500,
      'affiliate': 1000,
      'digital_product': 800,
      'content_gap': 600
    };

    const base = baseRevenue[type] || 500;
    const multiplier = Math.log10(metric + 1) / 2;
    return Math.round(base * (1 + multiplier));
  }

  // Opportunity bewerten und speichern
  async evaluateAndStoreOpportunity(opportunity) {
    return new Promise((resolve, reject) => {
      // ROI berechnen
      const roi = (opportunity.potential_revenue * (1 - opportunity.risk_score)) / 
                  (opportunity.effort_score * 1000);
      
      const stmt = db.prepare(`
        INSERT INTO opportunities (title, description, category, potential_revenue, 
                                 risk_score, effort_score, roi_estimate, data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        opportunity.title,
        opportunity.description,
        opportunity.category,
        opportunity.potential_revenue,
        opportunity.risk_score,
        opportunity.effort_score,
        roi,
        opportunity.data
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });

      stmt.finalize();
    });
  }

  // Top Opportunities abrufen
  async getTopOpportunities(limit = 10) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM opportunities 
        WHERE status = 'pending' 
        ORDER BY roi_estimate DESC, potential_revenue DESC 
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Opportunity genehmigen
  async approveOpportunity(id) {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE opportunities 
        SET status = 'approved', approved_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // Performance-Daten simulieren
  async simulatePerformance(opportunityId) {
    const metrics = [
      { name: 'clicks', value: Math.floor(Math.random() * 1000) + 100 },
      { name: 'conversions', value: Math.floor(Math.random() * 50) + 5 },
      { name: 'revenue', value: Math.floor(Math.random() * 500) + 50 }
    ];

    for (const metric of metrics) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO performance_metrics (opportunity_id, metric_name, metric_value)
          VALUES (?, ?, ?)
        `, [opportunityId, metric.name, metric.value], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  // Agent starten
  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Autonomous Income Agent gestartet');

    // Initiale Opportunity-Suche
    await this.findOpportunities();

    // Cron-Job für regelmäßige Suche (alle 4 Stunden)
    cron.schedule('0 */4 * * *', async () => {
      if (this.isRunning) {
        await this.findOpportunities();
      }
    });

    console.log('⏰ Automatische Suche alle 4 Stunden aktiviert');
  }

  // Agent stoppen
  stop() {
    this.isRunning = false;
    console.log('⏹️ Autonomous Income Agent gestoppt');
  }
}

// MCP Server Setup
const server = new Server(
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

// Agent-Instanz
const agent = new AutonomousIncomeAgent();

// MCP Tools definieren
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'find_opportunities',
        description: 'Sucht nach neuen Einkommensmöglichkeiten',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_top_opportunities',
        description: 'Ruft die besten Opportunities ab',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Anzahl der Opportunities',
              default: 10,
            },
          },
        },
      },
      {
        name: 'approve_opportunity',
        description: 'Genehmigt eine Opportunity zur Umsetzung',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'ID der Opportunity',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_performance',
        description: 'Ruft Performance-Daten ab',
        inputSchema: {
          type: 'object',
          properties: {
            opportunity_id: {
              type: 'number',
              description: 'ID der Opportunity',
            },
          },
        },
      },
      {
        name: 'start_agent',
        description: 'Startet den autonomen Agenten',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'stop_agent',
        description: 'Stoppt den autonomen Agenten',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Tool-Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'find_opportunities':
        const opportunities = await agent.findOpportunities();
        return {
          content: [
            {
              type: 'text',
              text: `🎯 ${opportunities.length} neue Opportunities gefunden!\n\n${opportunities.map(opp => 
                `• ${opp.title}\n  💰 Potenzial: €${opp.potential_revenue}\n  📊 ROI: ${((opp.potential_revenue * (1 - opp.risk_score)) / (opp.effort_score * 1000)).toFixed(2)}\n`
              ).join('\n')}`,
            },
          ],
        };

      case 'get_top_opportunities':
        const topOpps = await agent.getTopOpportunities(args.limit || 10);
        return {
          content: [
            {
              type: 'text',
              text: `🏆 Top ${topOpps.length} Opportunities:\n\n${topOpps.map((opp, i) => 
                `${i+1}. ${opp.title}\n   💰 €${opp.potential_revenue} | 🎯 ROI: ${opp.roi_estimate.toFixed(2)} | 📊 Risk: ${(opp.risk_score * 100).toFixed(0)}%\n   📝 ${opp.description}\n   🆔 ID: ${opp.id}\n`
              ).join('\n')}`,
            },
          ],
        };

      case 'approve_opportunity':
        const changes = await agent.approveOpportunity(args.id);
        if (changes > 0) {
          // Performance-Simulation starten
          await agent.simulatePerformance(args.id);
          return {
            content: [
              {
                type: 'text',
                text: `✅ Opportunity ${args.id} wurde genehmigt und ist jetzt aktiv!\n🚀 Performance-Tracking gestartet.`,
              },
            ],
          };
        } else {
          throw new Error(`Opportunity ${args.id} nicht gefunden`);
        }

      case 'get_performance':
        const perfData = await new Promise((resolve, reject) => {
          db.all(`
            SELECT metric_name, metric_value, recorded_at 
            FROM performance_metrics 
            WHERE opportunity_id = ? 
            ORDER BY recorded_at DESC
          `, [args.opportunity_id], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });

        return {
          content: [
            {
              type: 'text',
              text: `📊 Performance für Opportunity ${args.opportunity_id}:\n\n${perfData.map(metric => 
                `• ${metric.metric_name}: ${metric.metric_value} (${new Date(metric.recorded_at).toLocaleString()})`
              ).join('\n') || 'Noch keine Performance-Daten verfügbar'}`,
            },
          ],
        };

      case 'start_agent':
        await agent.start();
        return {
          content: [
            {
              type: 'text',
              text: '🚀 Autonomous Income Agent erfolgreich gestartet!\n⏰ Automatische Opportunity-Suche alle 4 Stunden aktiviert.',
            },
          ],
        };

      case 'stop_agent':
        agent.stop();
        return {
          content: [
            {
              type: 'text',
              text: '⏹️ Autonomous Income Agent gestoppt.',
            },
          ],
        };

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} nicht gefunden`);
    }
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, error.message);
  }
});

// Express Server für Dashboard API
const app = express();
app.use(cors());
app.use(express.json());

// API Endpoints
app.get('/api/opportunities', async (req, res) => {
  try {
    const opportunities = await agent.getTopOpportunities(20);
    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/opportunities/:id/approve', async (req, res) => {
  try {
    const changes = await agent.approveOpportunity(req.params.id);
    if (changes > 0) {
      await agent.simulatePerformance(req.params.id);
      res.json({ success: true, message: 'Opportunity genehmigt' });
    } else {
      res.status(404).json({ error: 'Opportunity nicht gefunden' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/performance/:id', async (req, res) => {
  try {
    const perfData = await new Promise((resolve, reject) => {
      db.all(`
        SELECT metric_name, metric_value, recorded_at 
        FROM performance_metrics 
        WHERE opportunity_id = ? 
        ORDER BY recorded_at DESC
      `, [req.params.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(perfData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agent/start', async (req, res) => {
  try {
    await agent.start();
    res.json({ success: true, message: 'Agent gestartet' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agent/stop', (req, res) => {
  try {
    agent.stop();
    res.json({ success: true, message: 'Agent gestoppt' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Server starten
const PORT = process.env.PORT || 3001;

if (process.argv.includes('--mcp')) {
  // MCP Server Modus
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('🔌 MCP Server gestartet');
} else {
  // HTTP Server Modus
  app.listen(PORT, () => {
    console.log(`🌐 Dashboard API Server läuft auf Port ${PORT}`);
  });
  
  // Agent automatisch starten
  await agent.start();
}
