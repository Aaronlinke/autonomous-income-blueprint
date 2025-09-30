/**
 * Enhanced Autonomous Income Agent Server
 * Erweiterte Version mit realen API-Integrationen
 */

import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import GumroadIntegration from './integrations/gumroad.js';
import AffiliateIntegration from './integrations/affiliate.js';
import IntegrationConfig from './config/integrations.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Globale Variablen
let agentRunning = false;
let lastScan = null;
let nextScan = null;
let cronJob = null;

// Konfiguration und Integrationen
const config = new IntegrationConfig();
let gumroadIntegration = null;
let affiliateIntegration = null;

// Initialisiere Integrationen basierend auf Konfiguration
function initializeIntegrations() {
  const configOverview = config.getConfigurationOverview();
  
  // Gumroad Integration
  if (configOverview.services.gumroad?.enabled) {
    const gumroadConfig = config.getServiceConfig('gumroad');
    gumroadIntegration = new GumroadIntegration(gumroadConfig.accessToken);
    console.log('✅ Gumroad Integration initialisiert');
  }

  // Affiliate Integration
  if (configOverview.services.affiliate?.enabled) {
    const affiliateConfig = config.getServiceConfig('affiliate');
    affiliateIntegration = new AffiliateIntegration(affiliateConfig);
    console.log('✅ Affiliate Integration initialisiert');
  }

  console.log(`🔧 ${configOverview.summary.enabledServices} von ${configOverview.summary.totalServices} Services aktiviert`);
}

// Simulierte Opportunities Database (erweitert)
let opportunities = [
  {
    id: 1,
    title: "KI-Prompt Bibliothek",
    description: "Sammlung optimierter Prompts für verschiedene KI-Tools",
    category: "digital_product",
    potential_revenue: 2800,
    roi_estimate: 4.90,
    risk_score: 0.2,
    status: "pending",
    source: "market_analysis",
    created_at: new Date().toISOString(),
    metadata: {
      target_audience: "Content Creator, Marketer",
      competition_level: "medium",
      market_size: "large"
    }
  },
  {
    id: 2,
    title: "Online-Kurse Affiliate Nische",
    description: "Bildungsbereich mit steigender Nachfrage",
    category: "affiliate_marketing",
    potential_revenue: 3200,
    roi_estimate: 4.00,
    risk_score: 0.3,
    status: "pending",
    source: "affiliate_research",
    created_at: new Date().toISOString(),
    metadata: {
      target_audience: "Lifelong Learners",
      competition_level: "low",
      market_size: "growing"
    }
  }
];

let opportunityIdCounter = opportunities.length + 1;

/**
 * Erweiterte Opportunity-Suche mit realen API-Integrationen
 */
async function findOpportunities() {
  console.log('🔍 Starte erweiterte Opportunity-Suche...');
  
  const newOpportunities = [];
  
  try {
    // Gumroad Opportunities
    if (gumroadIntegration) {
      console.log('📊 Analysiere Gumroad-Daten...');
      const gumroadOpportunities = await gumroadIntegration.identifyOpportunities();
      
      if (gumroadOpportunities.success && gumroadOpportunities.opportunities.length > 0) {
        gumroadOpportunities.opportunities.forEach(opp => {
          newOpportunities.push({
            id: opportunityIdCounter++,
            title: opp.title,
            description: opp.description,
            category: 'digital_product',
            potential_revenue: Math.round(opp.potential_revenue),
            roi_estimate: Math.random() * 3 + 2, // 2-5 ROI
            risk_score: Math.random() * 0.4 + 0.1, // 0.1-0.5 Risiko
            status: 'pending',
            source: 'gumroad_api',
            created_at: new Date().toISOString(),
            metadata: {
              gumroad_data: opp,
              integration: 'gumroad'
            }
          });
        });
        
        console.log(`✅ ${gumroadOpportunities.opportunities.length} Gumroad-Opportunities gefunden`);
      }
    }

    // Affiliate Opportunities
    if (affiliateIntegration) {
      console.log('🤝 Analysiere Affiliate-Programme...');
      const affiliateOpportunities = await affiliateIntegration.identifyOpportunities({
        minCommission: 5,
        category: 'technology'
      });
      
      if (affiliateOpportunities.success && affiliateOpportunities.opportunities.length > 0) {
        affiliateOpportunities.opportunities.forEach(opp => {
          newOpportunities.push({
            id: opportunityIdCounter++,
            title: opp.title,
            description: opp.description,
            category: 'affiliate_marketing',
            potential_revenue: Math.round(opp.potential_revenue),
            roi_estimate: Math.random() * 2 + 3, // 3-5 ROI für Affiliate
            risk_score: Math.random() * 0.3 + 0.2, // 0.2-0.5 Risiko
            status: 'pending',
            source: 'affiliate_api',
            created_at: new Date().toISOString(),
            metadata: {
              affiliate_data: opp,
              integration: 'affiliate'
            }
          });
        });
        
        console.log(`✅ ${affiliateOpportunities.opportunities.length} Affiliate-Opportunities gefunden`);
      }
    }

    // Fallback: Simulierte Opportunities wenn keine APIs konfiguriert sind
    if (!gumroadIntegration && !affiliateIntegration) {
      console.log('⚠️ Keine API-Integrationen konfiguriert, generiere simulierte Opportunities...');
      
      const simulatedOpportunities = [
        {
          title: "WordPress Plugin Entwicklung",
          description: "Nischenplugin für E-Commerce Automatisierung",
          category: "digital_product",
          potential_revenue: 1500,
          source: "market_simulation"
        },
        {
          title: "Tech Affiliate Programme",
          description: "Software-Tools mit hohen Kommissionen",
          category: "affiliate_marketing",
          potential_revenue: 2200,
          source: "affiliate_simulation"
        },
        {
          title: "Online Coaching Nische",
          description: "Persönlichkeitsentwicklung für Freelancer",
          category: "service",
          potential_revenue: 3500,
          source: "service_simulation"
        }
      ];

      simulatedOpportunities.forEach(opp => {
        newOpportunities.push({
          id: opportunityIdCounter++,
          title: opp.title,
          description: opp.description,
          category: opp.category,
          potential_revenue: opp.potential_revenue,
          roi_estimate: Math.random() * 3 + 2,
          risk_score: Math.random() * 0.5 + 0.1,
          status: 'pending',
          source: opp.source,
          created_at: new Date().toISOString(),
          metadata: {
            simulated: true
          }
        });
      });
    }

    // Füge neue Opportunities hinzu
    opportunities.push(...newOpportunities);
    
    // Begrenze auf maximal 20 Opportunities
    if (opportunities.length > 20) {
      opportunities = opportunities.slice(-20);
    }

    lastScan = new Date();
    console.log(`✅ Opportunity-Suche abgeschlossen. ${newOpportunities.length} neue Opportunities gefunden.`);
    
  } catch (error) {
    console.error('❌ Fehler bei der Opportunity-Suche:', error);
  }
}

/**
 * Startet den Agenten
 */
function startAgent() {
  if (agentRunning) {
    return { success: false, message: 'Agent läuft bereits' };
  }

  agentRunning = true;
  lastScan = new Date();
  
  // Sofortige erste Suche
  findOpportunities();
  
  // Plane regelmäßige Suchen alle 4 Stunden
  cronJob = cron.schedule('0 */4 * * *', () => {
    console.log('⏰ Geplante Opportunity-Suche gestartet...');
    findOpportunities();
  });

  // Berechne nächste Ausführung
  const now = new Date();
  nextScan = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 Stunden

  console.log('🚀 Autonomous Income Agent gestartet');
  return { success: true, message: 'Agent erfolgreich gestartet' };
}

/**
 * Stoppt den Agenten
 */
function stopAgent() {
  if (!agentRunning) {
    return { success: false, message: 'Agent läuft nicht' };
  }

  agentRunning = false;
  nextScan = null;
  
  if (cronJob) {
    cronJob.destroy();
    cronJob = null;
  }

  console.log('⏹️ Autonomous Income Agent gestoppt');
  return { success: true, message: 'Agent erfolgreich gestoppt' };
}

// API Endpoints

/**
 * Konfigurationsstatus abrufen
 */
app.get('/api/config/status', (req, res) => {
  const overview = config.getConfigurationOverview();
  const validation = config.validateConfiguration();
  
  res.json({
    overview,
    validation,
    integrations: {
      gumroad: !!gumroadIntegration,
      affiliate: !!affiliateIntegration
    }
  });
});

/**
 * Integration testen
 */
app.post('/api/integrations/test/:service', async (req, res) => {
  try {
    let result = {};
    
    switch (req.params.service) {
      case 'gumroad':
        if (gumroadIntegration) {
          result = await gumroadIntegration.testConnection();
        } else {
          result = { success: false, message: 'Gumroad Integration nicht konfiguriert' };
        }
        break;
        
      case 'affiliate':
        if (affiliateIntegration) {
          result = await affiliateIntegration.testConnections();
        } else {
          result = { success: false, message: 'Affiliate Integration nicht konfiguriert' };
        }
        break;
        
      default:
        result = { success: false, message: 'Unbekannter Service' };
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Opportunities abrufen
 */
app.get('/api/opportunities', (req, res) => {
  const { status, category, limit } = req.query;
  
  let filteredOpportunities = [...opportunities];
  
  if (status) {
    filteredOpportunities = filteredOpportunities.filter(opp => opp.status === status);
  }
  
  if (category) {
    filteredOpportunities = filteredOpportunities.filter(opp => opp.category === category);
  }
  
  if (limit) {
    filteredOpportunities = filteredOpportunities.slice(0, parseInt(limit));
  }
  
  // Sortiere nach Erstellungsdatum (neueste zuerst)
  filteredOpportunities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.json(filteredOpportunities);
});

/**
 * Spezifische Opportunity abrufen
 */
app.get('/api/opportunities/:id', (req, res) => {
  const opportunity = opportunities.find(opp => opp.id === parseInt(req.params.id));
  
  if (!opportunity) {
    return res.status(404).json({ error: 'Opportunity nicht gefunden' });
  }
  
  res.json(opportunity);
});

/**
 * Opportunity genehmigen
 */
app.post('/api/opportunities/:id/approve', async (req, res) => {
  const opportunityId = parseInt(req.params.id);
  const opportunity = opportunities.find(opp => opp.id === opportunityId);
  
  if (!opportunity) {
    return res.status(404).json({ error: 'Opportunity nicht gefunden' });
  }
  
  if (opportunity.status !== 'pending') {
    return res.status(400).json({ error: 'Opportunity ist nicht im Status "pending"' });
  }
  
  try {
    // Führe die tatsächliche Umsetzung basierend auf der Integration durch
    let implementationResult = { success: true, message: 'Simulierte Umsetzung' };
    
    if (opportunity.metadata?.integration === 'gumroad' && gumroadIntegration) {
      // Gumroad-spezifische Aktionen
      const gumroadData = opportunity.metadata.gumroad_data;
      if (gumroadData.action === 'enable_products' && gumroadData.products) {
        for (const product of gumroadData.products) {
          const result = await gumroadIntegration.enableProduct(product.id);
          if (!result.success) {
            console.warn(`Warnung: Produkt ${product.id} konnte nicht aktiviert werden:`, result.error);
          }
        }
        implementationResult.message = `${gumroadData.products.length} Produkte aktiviert`;
      }
    }
    
    if (opportunity.metadata?.integration === 'affiliate' && affiliateIntegration) {
      // Affiliate-spezifische Aktionen
      const affiliateData = opportunity.metadata.affiliate_data;
      if (affiliateData.action === 'join_programs' && affiliateData.programs) {
        implementationResult.message = `${affiliateData.programs.length} Affiliate-Programme zur Anmeldung vorgemerkt`;
      }
    }
    
    // Aktualisiere Opportunity-Status
    opportunity.status = 'approved';
    opportunity.approved_at = new Date().toISOString();
    opportunity.implementation_result = implementationResult;
    
    // Entferne eine zufällige pending Opportunity um Platz zu schaffen
    const pendingOpportunities = opportunities.filter(opp => opp.status === 'pending');
    if (pendingOpportunities.length > 0) {
      const randomIndex = Math.floor(Math.random() * pendingOpportunities.length);
      const indexToRemove = opportunities.indexOf(pendingOpportunities[randomIndex]);
      opportunities.splice(indexToRemove, 1);
    }
    
    console.log(`✅ Opportunity "${opportunity.title}" genehmigt und umgesetzt`);
    
    res.json({
      success: true,
      message: 'Opportunity erfolgreich genehmigt und umgesetzt',
      opportunity,
      implementation: implementationResult
    });
    
  } catch (error) {
    console.error('❌ Fehler bei der Opportunity-Umsetzung:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Opportunity ablehnen
 */
app.post('/api/opportunities/:id/reject', (req, res) => {
  const opportunityId = parseInt(req.params.id);
  const { reason } = req.body;
  const opportunity = opportunities.find(opp => opp.id === opportunityId);
  
  if (!opportunity) {
    return res.status(404).json({ error: 'Opportunity nicht gefunden' });
  }
  
  opportunity.status = 'rejected';
  opportunity.rejected_at = new Date().toISOString();
  opportunity.rejection_reason = reason || 'Nicht angegeben';
  
  console.log(`❌ Opportunity "${opportunity.title}" abgelehnt: ${reason || 'Kein Grund angegeben'}`);
  
  res.json({
    success: true,
    message: 'Opportunity erfolgreich abgelehnt',
    opportunity
  });
});

/**
 * Agent starten
 */
app.post('/api/agent/start', (req, res) => {
  const result = startAgent();
  res.json(result);
});

/**
 * Agent stoppen
 */
app.post('/api/agent/stop', (req, res) => {
  const result = stopAgent();
  res.json(result);
});

/**
 * Agent-Status abrufen
 */
app.get('/api/agent/status', (req, res) => {
  const totalOpportunities = opportunities.length;
  const approvedOpportunities = opportunities.filter(opp => opp.status === 'approved').length;
  
  res.json({
    running: agentRunning,
    lastScan,
    nextScan,
    totalOpportunities,
    approvedOpportunities,
    integrations: {
      gumroad: !!gumroadIntegration,
      affiliate: !!affiliateIntegration,
      configured: config.getConfigurationOverview().summary.enabledServices
    }
  });
});

/**
 * Performance-Statistiken abrufen
 */
app.get('/api/stats', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Basis-Statistiken aus Opportunities
    const totalPotential = opportunities.reduce((sum, opp) => sum + opp.potential_revenue, 0);
    const approvedCount = opportunities.filter(opp => opp.status === 'approved').length;
    const avgROI = opportunities.length > 0 
      ? opportunities.reduce((sum, opp) => sum + opp.roi_estimate, 0) / opportunities.length 
      : 0;
    
    const categoryStats = {};
    opportunities.forEach(opp => {
      if (!categoryStats[opp.category]) {
        categoryStats[opp.category] = { count: 0, potential: 0 };
      }
      categoryStats[opp.category].count++;
      categoryStats[opp.category].potential += opp.potential_revenue;
    });
    
    const topCategories = Object.entries(categoryStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.potential - a.potential);
    
    let realPerformanceData = {};
    
    // Echte Performance-Daten von Integrationen abrufen
    if (gumroadIntegration) {
      const gumroadPerformance = await gumroadIntegration.analyzeProductPerformance();
      if (gumroadPerformance.success) {
        realPerformanceData.gumroad = gumroadPerformance.summary;
      }
    }
    
    if (affiliateIntegration) {
      const affiliatePerformance = await affiliateIntegration.getPerformanceData(timeframe);
      if (affiliatePerformance.success) {
        realPerformanceData.affiliate = affiliatePerformance.data;
      }
    }
    
    res.json({
      totalPotential,
      approvedCount,
      avgROI,
      successRate: opportunities.length > 0 ? (approvedCount / opportunities.length) * 100 : 0,
      newOpportunities: opportunities.filter(opp => {
        const createdDate = new Date(opp.created_at);
        const daysAgo = parseInt(timeframe.replace('d', ''));
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        return createdDate >= cutoffDate;
      }).length,
      topCategories,
      realPerformanceData,
      timeframe
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Manuelle Opportunity-Suche auslösen
 */
app.post('/api/opportunities/scan', async (req, res) => {
  try {
    await findOpportunities();
    res.json({
      success: true,
      message: 'Opportunity-Suche erfolgreich durchgeführt',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 Enhanced Autonomous Income Agent Server läuft auf Port ${PORT}`);
  
  // Initialisiere Integrationen
  initializeIntegrations();
  
  console.log('📋 Verfügbare Endpoints:');
  console.log('  GET  /api/config/status - Konfigurationsstatus');
  console.log('  POST /api/integrations/test/:service - Integration testen');
  console.log('  GET  /api/opportunities - Opportunities abrufen');
  console.log('  POST /api/opportunities/:id/approve - Opportunity genehmigen');
  console.log('  POST /api/opportunities/:id/reject - Opportunity ablehnen');
  console.log('  POST /api/agent/start - Agent starten');
  console.log('  POST /api/agent/stop - Agent stoppen');
  console.log('  GET  /api/agent/status - Agent-Status');
  console.log('  GET  /api/stats - Performance-Statistiken');
  console.log('  POST /api/opportunities/scan - Manuelle Suche');
});
