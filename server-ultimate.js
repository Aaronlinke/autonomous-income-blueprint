/**
 * Ultimate Autonomous Income Agent Server
 * Vollständiges System mit Workflow-Management und automatischer Umsetzung
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';

// Module importieren
import GumroadIntegration from './integrations/gumroad.js';
import AffiliateIntegration from './integrations/affiliate.js';
import IntegrationConfig from './config/integrations.js';
import ContentGenerator from './modules/contentGenerator.js';
import ContentPublisher from './modules/contentPublisher.js';
import AnalyticsTracker from './modules/analyticsTracker.js';
import WorkflowManager from './modules/workflowManager.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Konfiguration laden
const config = new IntegrationConfig();

// Module initialisieren
const gumroad = new GumroadIntegration(config.getServiceConfig('gumroad'));
const affiliate = new AffiliateIntegration(config.getServiceConfig('affiliate'));
const contentGenerator = new ContentGenerator(config.getServiceConfig('openai'));
const contentPublisher = new ContentPublisher(config.getServiceConfig('wordpress'));
const analyticsTracker = new AnalyticsTracker(config.getServiceConfig('analytics'));
const workflowManager = new WorkflowManager({
  openai: config.getServiceConfig('openai'),
  publishing: config.getServiceConfig('wordpress'),
  analytics: config.getServiceConfig('analytics')
});

// Simulierte Datenbank für Opportunities
let opportunities = [
  {
    id: 1,
    title: 'KI-Prompt Bibliothek',
    category: 'Digital Product',
    description: 'Umfassende Sammlung von ChatGPT-Prompts für verschiedene Anwendungsfälle',
    estimated_revenue: 2800,
    estimated_cost: 150,
    roi: 4.90,
    risk_level: 'Niedrig',
    time_to_implement: '3-5 Tage',
    status: 'pending',
    created_at: new Date().toISOString(),
    metadata: {
      target_audience: 'Content Creator, Marketer',
      competition_level: 'Mittel',
      market_demand: 'Hoch'
    }
  },
  {
    id: 2,
    title: 'Online-Kurse Affiliate Nische',
    category: 'Affiliate Marketing',
    description: 'Bewerbung von Online-Kursen in der digitalen Marketing Nische',
    estimated_revenue: 3200,
    estimated_cost: 200,
    roi: 4.00,
    risk_level: 'Niedrig',
    time_to_implement: '2-3 Tage',
    status: 'pending',
    created_at: new Date().toISOString(),
    metadata: {
      commission_rate: 0.3,
      affiliate_network: 'Digistore24',
      target_keywords: ['online marketing', 'digital courses']
    }
  },
  {
    id: 3,
    title: 'WordPress Plugin Entwicklung',
    category: 'Digital Product',
    description: 'Einfaches SEO-Plugin für WordPress mit Grundfunktionen',
    estimated_revenue: 1500,
    estimated_cost: 300,
    roi: 3.50,
    risk_level: 'Mittel',
    time_to_implement: '7-10 Tage',
    status: 'pending',
    created_at: new Date().toISOString(),
    metadata: {
      technical_complexity: 'Mittel',
      market_saturation: 'Hoch',
      unique_selling_point: 'Einfache Bedienung'
    }
  }
];

// Agent-Status
let agentStatus = {
  active: false,
  last_scan: null,
  opportunities_found: opportunities.length,
  total_revenue_potential: opportunities.reduce((sum, opp) => sum + opp.estimated_revenue, 0),
  average_roi: opportunities.reduce((sum, opp) => sum + opp.roi, 0) / opportunities.length,
  services_active: 1, // OpenAI ist standardmäßig aktiv
  total_services: 7
};

console.log('🤖 Ultimate Autonomous Income Agent gestartet');
console.log('📊 Analytics Tracker initialisiert');
console.log('🔄 Workflow Manager initialisiert');
console.log('🎯 Content Generator bereit');
console.log('📤 Content Publisher bereit');
console.log(`⚙️ ${agentStatus.services_active}/${agentStatus.total_services} Services aktiv`);

// === API ENDPOINTS ===

// Agent Status
app.get('/api/agent/status', (req, res) => {
  res.json({
    success: true,
    agent: agentStatus,
    integrations: config.getEnabledServices(),
    workflow_status: workflowManager.getWorkflowStatus()
  });
});

// Agent starten/stoppen
app.post('/api/agent/toggle', (req, res) => {
  agentStatus.active = !agentStatus.active;
  agentStatus.last_scan = agentStatus.active ? new Date().toISOString() : null;
  
  if (agentStatus.active) {
    console.log('🚀 Agent aktiviert - Kontinuierliche Opportunity-Suche gestartet');
    // Simuliere neue Opportunity-Erkennung
    setTimeout(() => {
      findNewOpportunities();
    }, 5000);
  } else {
    console.log('⏸️ Agent deaktiviert');
  }
  
  res.json({
    success: true,
    message: agentStatus.active ? 'Agent erfolgreich gestartet' : 'Agent erfolgreich gestoppt',
    agent: agentStatus
  });
});

// Opportunities abrufen
app.get('/api/opportunities', (req, res) => {
  res.json({
    success: true,
    opportunities: opportunities,
    total: opportunities.length,
    pending: opportunities.filter(opp => opp.status === 'pending').length,
    approved: opportunities.filter(opp => opp.status === 'approved').length,
    implemented: opportunities.filter(opp => opp.status === 'implemented').length
  });
});

// Opportunity genehmigen und Workflow starten
app.post('/api/opportunities/:id/approve', async (req, res) => {
  try {
    const opportunityId = parseInt(req.params.id);
    const approvalData = req.body || {};
    
    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity nicht gefunden'
      });
    }

    // Status auf approved setzen
    opportunity.status = 'approved';
    opportunity.approved_at = new Date().toISOString();
    opportunity.approval_data = approvalData;

    console.log(`✅ Opportunity genehmigt: ${opportunity.title}`);

    // Workflow starten
    const workflowResult = await workflowManager.executeOpportunity(opportunity, approvalData);

    // Tracke Genehmigung
    await analyticsTracker.trackEvent({
      type: 'opportunity_approved',
      category: 'business',
      action: 'approve_opportunity',
      label: opportunity.title,
      value: opportunity.estimated_revenue,
      opportunity_id: opportunity.id,
      metadata: { 
        category: opportunity.category,
        roi: opportunity.roi,
        workflow_started: workflowResult.success
      }
    });

    // Simuliere neue Opportunity nach Genehmigung
    setTimeout(() => {
      addNewOpportunity();
    }, 2000);

    res.json({
      success: true,
      message: `Opportunity "${opportunity.title}" genehmigt und Workflow gestartet`,
      opportunity: opportunity,
      workflow: workflowResult
    });

  } catch (error) {
    console.error('Fehler beim Genehmigen der Opportunity:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Genehmigen der Opportunity',
      error: error.message
    });
  }
});

// Opportunity ablehnen
app.post('/api/opportunities/:id/reject', async (req, res) => {
  try {
    const opportunityId = parseInt(req.params.id);
    const { reason } = req.body;
    
    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity nicht gefunden'
      });
    }

    // Status auf rejected setzen
    opportunity.status = 'rejected';
    opportunity.rejected_at = new Date().toISOString();
    opportunity.rejection_reason = reason || 'Nicht spezifiziert';

    console.log(`❌ Opportunity abgelehnt: ${opportunity.title}`);

    // Tracke Ablehnung
    await analyticsTracker.trackEvent({
      type: 'opportunity_rejected',
      category: 'business',
      action: 'reject_opportunity',
      label: opportunity.title,
      opportunity_id: opportunity.id,
      metadata: { 
        category: opportunity.category,
        reason: opportunity.rejection_reason
      }
    });

    res.json({
      success: true,
      message: `Opportunity "${opportunity.title}" abgelehnt`,
      opportunity: opportunity
    });

  } catch (error) {
    console.error('Fehler beim Ablehnen der Opportunity:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Ablehnen der Opportunity',
      error: error.message
    });
  }
});

// Workflow-Status abrufen
app.get('/api/workflows', (req, res) => {
  const workflowStatus = workflowManager.getWorkflowStatus();
  res.json({
    success: true,
    workflows: workflowStatus
  });
});

// Workflow-Details abrufen
app.get('/api/workflows/:id', (req, res) => {
  const workflowId = req.params.id;
  const workflow = workflowManager.activeWorkflows.get(workflowId) || 
                   workflowManager.completedWorkflows.find(w => w.id === workflowId) ||
                   workflowManager.failedWorkflows.find(w => w.id === workflowId);
  
  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow nicht gefunden'
    });
  }

  res.json({
    success: true,
    workflow: workflow
  });
});

// Content generieren (manuell)
app.post('/api/content/generate', async (req, res) => {
  try {
    const { type, topic, wordCount, tone } = req.body;
    
    const content = await contentGenerator.generateContent({
      type: type || 'blog_post',
      topic: topic || 'Passives Einkommen',
      wordCount: wordCount || 1000,
      tone: tone || 'professional'
    });

    // Tracke Content-Generierung
    await analyticsTracker.trackEvent({
      type: 'content_generated',
      category: 'content',
      action: 'manual_generation',
      label: type,
      metadata: { topic, wordCount, tone }
    });

    res.json({
      success: true,
      content: content,
      message: 'Content erfolgreich generiert'
    });

  } catch (error) {
    console.error('Fehler beim Generieren von Content:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Generieren von Content',
      error: error.message
    });
  }
});

// Content veröffentlichen (manuell)
app.post('/api/content/publish', async (req, res) => {
  try {
    const { platform, content, title, scheduleTime } = req.body;
    
    const result = await contentPublisher.publishContent({
      platform: platform || 'wordpress',
      content: content,
      title: title || 'Neuer Artikel',
      scheduleTime: scheduleTime
    });

    // Tracke Content-Veröffentlichung
    await analyticsTracker.trackEvent({
      type: 'content_published',
      category: 'content',
      action: 'manual_publishing',
      label: platform,
      metadata: { title, scheduled: !!scheduleTime }
    });

    res.json({
      success: true,
      result: result,
      message: 'Content erfolgreich veröffentlicht'
    });

  } catch (error) {
    console.error('Fehler beim Veröffentlichen von Content:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Veröffentlichen von Content',
      error: error.message
    });
  }
});

// Analytics-Daten abrufen
app.get('/api/analytics', (req, res) => {
  const timeframe = req.query.timeframe || '30d';
  const analysis = analyticsTracker.analyzePerformance(timeframe);
  
  res.json({
    success: true,
    analytics: analysis,
    timeframe: timeframe
  });
});

// Performance-Report generieren
app.get('/api/analytics/report', (req, res) => {
  const timeframe = req.query.timeframe || '30d';
  const options = {
    includeCharts: req.query.charts !== 'false',
    includeRecommendations: req.query.recommendations !== 'false',
    format: req.query.format || 'detailed'
  };
  
  const report = analyticsTracker.generatePerformanceReport(timeframe, options);
  
  res.json({
    success: true,
    report: report
  });
});

// Event tracken
app.post('/api/analytics/track', async (req, res) => {
  try {
    const eventData = req.body;
    const result = await analyticsTracker.trackEvent(eventData);
    
    res.json({
      success: true,
      result: result,
      message: 'Event erfolgreich getrackt'
    });

  } catch (error) {
    console.error('Fehler beim Tracken des Events:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Tracken des Events',
      error: error.message
    });
  }
});

// Conversion tracken
app.post('/api/analytics/conversion', async (req, res) => {
  try {
    const conversionData = req.body;
    const result = await analyticsTracker.trackConversion(conversionData);
    
    res.json({
      success: true,
      result: result,
      message: 'Conversion erfolgreich getrackt'
    });

  } catch (error) {
    console.error('Fehler beim Tracken der Conversion:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Tracken der Conversion',
      error: error.message
    });
  }
});

// UTM-Link generieren
app.post('/api/analytics/utm', (req, res) => {
  try {
    const { baseUrl, utmParams } = req.body;
    
    if (!baseUrl) {
      return res.status(400).json({
        success: false,
        message: 'baseUrl ist erforderlich'
      });
    }

    const utmLink = analyticsTracker.generateUTMLink(baseUrl, utmParams || {});
    
    res.json({
      success: true,
      utm_link: utmLink,
      message: 'UTM-Link erfolgreich generiert'
    });

  } catch (error) {
    console.error('Fehler beim Generieren des UTM-Links:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Generieren des UTM-Links',
      error: error.message
    });
  }
});

// === HILFSFUNKTIONEN ===

// Neue Opportunities finden (simuliert)
function findNewOpportunities() {
  if (!agentStatus.active) return;
  
  const newOpportunityTemplates = [
    {
      title: 'Cryptocurrency Newsletter',
      category: 'Content Creation',
      description: 'Wöchentlicher Newsletter mit Krypto-Marktanalysen',
      estimated_revenue: 1800,
      estimated_cost: 100,
      risk_level: 'Mittel'
    },
    {
      title: 'Social Media Templates Pack',
      category: 'Digital Product',
      description: 'Canva-Templates für Social Media Posts',
      estimated_revenue: 950,
      estimated_cost: 80,
      risk_level: 'Niedrig'
    },
    {
      title: 'Fitness App Affiliate',
      category: 'Affiliate Marketing',
      description: 'Bewerbung von Fitness-Apps mit hohen Provisionen',
      estimated_revenue: 2200,
      estimated_cost: 150,
      risk_level: 'Niedrig'
    }
  ];
  
  // Zufällige neue Opportunity hinzufügen
  const template = newOpportunityTemplates[Math.floor(Math.random() * newOpportunityTemplates.length)];
  addNewOpportunity(template);
  
  // Nächste Suche planen
  setTimeout(() => {
    if (agentStatus.active) {
      findNewOpportunities();
    }
  }, 30000); // Alle 30 Sekunden neue Opportunity
}

// Neue Opportunity hinzufügen
function addNewOpportunity(template = null) {
  const defaultTemplate = {
    title: 'E-Commerce Dropshipping Guide',
    category: 'Digital Product',
    description: 'Kompletter Leitfaden für erfolgreiches Dropshipping',
    estimated_revenue: 1200,
    estimated_cost: 120,
    risk_level: 'Mittel'
  };
  
  const opportunityTemplate = template || defaultTemplate;
  const roi = (opportunityTemplate.estimated_revenue - opportunityTemplate.estimated_cost) / opportunityTemplate.estimated_cost;
  
  const newOpportunity = {
    id: opportunities.length + 1,
    title: opportunityTemplate.title,
    category: opportunityTemplate.category,
    description: opportunityTemplate.description,
    estimated_revenue: opportunityTemplate.estimated_revenue,
    estimated_cost: opportunityTemplate.estimated_cost,
    roi: parseFloat(roi.toFixed(2)),
    risk_level: opportunityTemplate.risk_level,
    time_to_implement: '2-4 Tage',
    status: 'pending',
    created_at: new Date().toISOString(),
    metadata: {
      target_audience: 'Entrepreneurs, Online Marketer',
      competition_level: 'Mittel',
      market_demand: 'Hoch'
    }
  };
  
  opportunities.unshift(newOpportunity); // Am Anfang hinzufügen
  
  // Update Agent Status
  agentStatus.opportunities_found = opportunities.length;
  agentStatus.total_revenue_potential = opportunities.reduce((sum, opp) => sum + opp.estimated_revenue, 0);
  agentStatus.average_roi = opportunities.reduce((sum, opp) => sum + opp.roi, 0) / opportunities.length;
  agentStatus.last_scan = new Date().toISOString();
  
  console.log(`🎯 Neue Opportunity gefunden: ${newOpportunity.title} (ROI: ${newOpportunity.roi}x)`);
}

// Cron Jobs für automatische Aufgaben
cron.schedule('0 */4 * * *', () => {
  if (agentStatus.active) {
    console.log('🔄 Automatische Opportunity-Suche gestartet');
    findNewOpportunities();
  }
});

// Performance-Report täglich generieren
cron.schedule('0 9 * * *', async () => {
  console.log('📊 Generiere täglichen Performance-Report');
  const report = analyticsTracker.generatePerformanceReport('7d');
  console.log(`📈 Wöchentliche Performance: €${report.detailed_metrics.revenue.total_revenue} Revenue`);
});

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 Ultimate Autonomous Income Agent läuft auf Port ${PORT}`);
  console.log(`📊 Dashboard verfügbar unter: http://localhost:${PORT}`);
  console.log(`🎯 API-Endpunkte: ${PORT}/api/*`);
  console.log('');
  console.log('🤖 Agent bereit für autonome Einkommensgenerierung!');
  console.log('💰 Warten auf Opportunity-Genehmigungen...');
});

export default app;
