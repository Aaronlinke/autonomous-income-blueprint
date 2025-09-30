/**
 * Workflow Manager Module
 * Automatische Umsetzung von genehmigten Opportunities
 */

import ContentGenerator from './contentGenerator.js';
import ContentPublisher from './contentPublisher.js';
import AnalyticsTracker from './analyticsTracker.js';

class WorkflowManager {
  constructor(config) {
    this.config = config;
    this.contentGenerator = new ContentGenerator(config.openai);
    this.contentPublisher = new ContentPublisher(config.publishing);
    this.analyticsTracker = new AnalyticsTracker(config.analytics);
    
    // Workflow-Status Tracking
    this.activeWorkflows = new Map();
    this.completedWorkflows = [];
    this.failedWorkflows = [];
    
    // Workflow-Templates
    this.workflowTemplates = {
      'digital_product': this.createDigitalProductWorkflow.bind(this),
      'affiliate_marketing': this.createAffiliateMarketingWorkflow.bind(this),
      'content_creation': this.createContentCreationWorkflow.bind(this),
      'social_media_campaign': this.createSocialMediaCampaignWorkflow.bind(this),
      'email_sequence': this.createEmailSequenceWorkflow.bind(this)
    };
  }

  /**
   * Startet einen Workflow für eine genehmigte Opportunity
   */
  async executeOpportunity(opportunity, approvalData = {}) {
    try {
      console.log(`🚀 Starte Workflow für Opportunity: ${opportunity.title}`);
      
      // Erstelle Workflow basierend auf Opportunity-Typ
      const workflow = await this.createWorkflowForOpportunity(opportunity, approvalData);
      
      if (!workflow) {
        throw new Error(`Kein Workflow-Template für Typ: ${opportunity.category}`);
      }

      // Registriere Workflow
      const workflowId = this.generateWorkflowId();
      this.activeWorkflows.set(workflowId, {
        id: workflowId,
        opportunity_id: opportunity.id,
        opportunity_title: opportunity.title,
        category: opportunity.category,
        status: 'running',
        steps: workflow.steps,
        current_step: 0,
        started_at: new Date().toISOString(),
        progress: 0,
        results: {},
        errors: []
      });

      // Tracke Workflow-Start
      await this.analyticsTracker.trackEvent({
        type: 'workflow_started',
        category: 'automation',
        action: 'start_execution',
        label: opportunity.title,
        opportunity_id: opportunity.id,
        metadata: { workflow_id: workflowId, category: opportunity.category }
      });

      // Führe Workflow aus
      const result = await this.executeWorkflow(workflowId);
      
      return {
        success: true,
        workflow_id: workflowId,
        message: `Workflow für "${opportunity.title}" erfolgreich gestartet`,
        estimated_completion: this.calculateEstimatedCompletion(workflow),
        result
      };

    } catch (error) {
      console.error('Fehler beim Ausführen der Opportunity:', error);
      
      // Tracke Workflow-Fehler
      await this.analyticsTracker.trackEvent({
        type: 'workflow_error',
        category: 'automation',
        action: 'execution_failed',
        label: opportunity.title,
        opportunity_id: opportunity.id,
        metadata: { error: error.message }
      });

      return {
        success: false,
        error: error.message,
        message: `Fehler beim Ausführen von "${opportunity.title}": ${error.message}`
      };
    }
  }

  /**
   * Erstellt einen Workflow basierend auf der Opportunity
   */
  async createWorkflowForOpportunity(opportunity, approvalData) {
    const category = opportunity.category.toLowerCase().replace(/\s+/g, '_');
    
    if (this.workflowTemplates[category]) {
      return await this.workflowTemplates[category](opportunity, approvalData);
    }
    
    // Fallback: Generischer Content-Workflow
    return await this.createContentCreationWorkflow(opportunity, approvalData);
  }

  /**
   * Workflow-Template: Digitale Produkte
   */
  async createDigitalProductWorkflow(opportunity, approvalData) {
    return {
      type: 'digital_product',
      estimated_duration: 120, // Minuten
      steps: [
        {
          id: 'research',
          name: 'Marktforschung und Zielgruppenanalyse',
          type: 'research',
          duration: 15,
          params: {
            topic: opportunity.title,
            target_audience: approvalData.target_audience || 'allgemein',
            competitors: approvalData.competitors || []
          }
        },
        {
          id: 'content_outline',
          name: 'Inhaltsstruktur erstellen',
          type: 'content_generation',
          duration: 20,
          params: {
            content_type: 'product_outline',
            topic: opportunity.title,
            format: approvalData.format || 'ebook'
          }
        },
        {
          id: 'content_creation',
          name: 'Hauptinhalt erstellen',
          type: 'content_generation',
          duration: 45,
          params: {
            content_type: 'full_content',
            outline_reference: 'content_outline',
            word_count: approvalData.word_count || 5000
          }
        },
        {
          id: 'design_assets',
          name: 'Design-Elemente erstellen',
          type: 'design',
          duration: 25,
          params: {
            cover_design: true,
            infographics: approvalData.include_graphics || false,
            brand_colors: approvalData.brand_colors || ['#3B82F6', '#8B5CF6']
          }
        },
        {
          id: 'product_setup',
          name: 'Produkt auf Gumroad einrichten',
          type: 'platform_integration',
          duration: 10,
          params: {
            platform: 'gumroad',
            price: approvalData.price || opportunity.estimated_revenue / 100,
            description_reference: 'content_outline'
          }
        },
        {
          id: 'marketing_content',
          name: 'Marketing-Materialien erstellen',
          type: 'content_generation',
          duration: 15,
          params: {
            content_type: 'marketing_copy',
            platforms: ['email', 'social', 'blog'],
            product_reference: 'product_setup'
          }
        }
      ]
    };
  }

  /**
   * Workflow-Template: Affiliate Marketing
   */
  async createAffiliateMarketingWorkflow(opportunity, approvalData) {
    return {
      type: 'affiliate_marketing',
      estimated_duration: 60,
      steps: [
        {
          id: 'product_research',
          name: 'Affiliate-Produkt analysieren',
          type: 'research',
          duration: 10,
          params: {
            product_url: approvalData.affiliate_link || opportunity.metadata?.affiliate_link,
            commission_rate: approvalData.commission_rate || 0.1
          }
        },
        {
          id: 'content_strategy',
          name: 'Content-Strategie entwickeln',
          type: 'strategy',
          duration: 10,
          params: {
            content_types: ['blog_post', 'social_posts', 'email_sequence'],
            target_keywords: approvalData.keywords || [],
            content_calendar: true
          }
        },
        {
          id: 'blog_content',
          name: 'Blog-Artikel erstellen',
          type: 'content_generation',
          duration: 25,
          params: {
            content_type: 'blog_post',
            word_count: 1500,
            seo_optimized: true,
            affiliate_integration: 'natural'
          }
        },
        {
          id: 'social_content',
          name: 'Social Media Content erstellen',
          type: 'content_generation',
          duration: 10,
          params: {
            content_type: 'social_posts',
            platforms: ['twitter', 'linkedin', 'facebook'],
            post_count: 10
          }
        },
        {
          id: 'publish_content',
          name: 'Content veröffentlichen',
          type: 'publishing',
          duration: 5,
          params: {
            blog_publish: true,
            social_schedule: true,
            utm_tracking: true
          }
        }
      ]
    };
  }

  /**
   * Workflow-Template: Content Creation
   */
  async createContentCreationWorkflow(opportunity, approvalData) {
    return {
      type: 'content_creation',
      estimated_duration: 45,
      steps: [
        {
          id: 'topic_research',
          name: 'Themen-Recherche',
          type: 'research',
          duration: 10,
          params: {
            topic: opportunity.title,
            depth: 'comprehensive',
            sources: ['web', 'trends', 'competitors']
          }
        },
        {
          id: 'content_generation',
          name: 'Content erstellen',
          type: 'content_generation',
          duration: 25,
          params: {
            content_type: approvalData.content_type || 'blog_post',
            tone: approvalData.tone || 'professional',
            word_count: approvalData.word_count || 1000
          }
        },
        {
          id: 'content_optimization',
          name: 'SEO-Optimierung',
          type: 'optimization',
          duration: 5,
          params: {
            seo_keywords: true,
            meta_description: true,
            readability_check: true
          }
        },
        {
          id: 'content_publishing',
          name: 'Content veröffentlichen',
          type: 'publishing',
          duration: 5,
          params: {
            platforms: approvalData.platforms || ['wordpress'],
            schedule_time: approvalData.schedule_time || 'immediate'
          }
        }
      ]
    };
  }

  /**
   * Workflow-Template: Social Media Campaign
   */
  async createSocialMediaCampaignWorkflow(opportunity, approvalData) {
    return {
      type: 'social_media_campaign',
      estimated_duration: 30,
      steps: [
        {
          id: 'campaign_strategy',
          name: 'Kampagnen-Strategie entwickeln',
          type: 'strategy',
          duration: 10,
          params: {
            platforms: approvalData.platforms || ['twitter', 'linkedin'],
            campaign_duration: approvalData.duration || 7,
            posting_frequency: approvalData.frequency || 'daily'
          }
        },
        {
          id: 'content_batch_creation',
          name: 'Content-Batch erstellen',
          type: 'content_generation',
          duration: 15,
          params: {
            content_type: 'social_posts',
            post_count: approvalData.post_count || 14,
            variety: ['text', 'quote', 'question', 'tip']
          }
        },
        {
          id: 'campaign_scheduling',
          name: 'Kampagne planen',
          type: 'scheduling',
          duration: 5,
          params: {
            schedule_posts: true,
            optimal_timing: true,
            hashtag_research: true
          }
        }
      ]
    };
  }

  /**
   * Workflow-Template: Email Sequence
   */
  async createEmailSequenceWorkflow(opportunity, approvalData) {
    return {
      type: 'email_sequence',
      estimated_duration: 40,
      steps: [
        {
          id: 'sequence_planning',
          name: 'E-Mail-Sequenz planen',
          type: 'strategy',
          duration: 10,
          params: {
            sequence_type: approvalData.sequence_type || 'nurture',
            email_count: approvalData.email_count || 5,
            send_interval: approvalData.interval || 'daily'
          }
        },
        {
          id: 'email_creation',
          name: 'E-Mails erstellen',
          type: 'content_generation',
          duration: 25,
          params: {
            content_type: 'email_sequence',
            personalization: true,
            call_to_action: approvalData.cta || 'learn_more'
          }
        },
        {
          id: 'sequence_setup',
          name: 'Sequenz in Mailchimp einrichten',
          type: 'platform_integration',
          duration: 5,
          params: {
            platform: 'mailchimp',
            automation_trigger: approvalData.trigger || 'signup',
            segmentation: approvalData.segment || 'all_subscribers'
          }
        }
      ]
    };
  }

  /**
   * Führt einen Workflow Schritt für Schritt aus
   */
  async executeWorkflow(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} nicht gefunden`);
    }

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        
        // Aktualisiere Workflow-Status
        workflow.current_step = i;
        workflow.progress = Math.round((i / workflow.steps.length) * 100);
        
        console.log(`📋 Führe Schritt ${i + 1}/${workflow.steps.length} aus: ${step.name}`);
        
        // Tracke Schritt-Start
        await this.analyticsTracker.trackEvent({
          type: 'workflow_step',
          category: 'automation',
          action: 'step_started',
          label: step.name,
          opportunity_id: workflow.opportunity_id,
          metadata: { 
            workflow_id: workflowId, 
            step_id: step.id, 
            step_index: i 
          }
        });

        // Führe Schritt aus
        const stepResult = await this.executeWorkflowStep(step, workflow);
        
        // Speichere Ergebnis
        workflow.results[step.id] = stepResult;
        
        // Tracke Schritt-Abschluss
        await this.analyticsTracker.trackEvent({
          type: 'workflow_step',
          category: 'automation',
          action: 'step_completed',
          label: step.name,
          opportunity_id: workflow.opportunity_id,
          metadata: { 
            workflow_id: workflowId, 
            step_id: step.id, 
            duration: stepResult.duration,
            success: stepResult.success
          }
        });

        // Kurze Pause zwischen Schritten
        await this.sleep(1000);
      }

      // Workflow abgeschlossen
      workflow.status = 'completed';
      workflow.progress = 100;
      workflow.completed_at = new Date().toISOString();
      
      // Verschiebe zu abgeschlossenen Workflows
      this.completedWorkflows.push(workflow);
      this.activeWorkflows.delete(workflowId);

      // Tracke Workflow-Abschluss
      await this.analyticsTracker.trackEvent({
        type: 'workflow_completed',
        category: 'automation',
        action: 'execution_completed',
        label: workflow.opportunity_title,
        opportunity_id: workflow.opportunity_id,
        metadata: { 
          workflow_id: workflowId,
          total_duration: this.calculateWorkflowDuration(workflow),
          steps_completed: workflow.steps.length
        }
      });

      // Tracke Opportunity-Metriken
      await this.analyticsTracker.trackOpportunityMetrics(workflow.opportunity_id, {
        status_change: {
          from: 'approved',
          to: 'implemented',
          reason: 'workflow_completed'
        },
        content_generated: this.countGeneratedContent(workflow.results),
        content_published: this.countPublishedContent(workflow.results)
      });

      console.log(`✅ Workflow ${workflowId} erfolgreich abgeschlossen`);
      
      return {
        success: true,
        workflow_id: workflowId,
        results: workflow.results,
        duration: this.calculateWorkflowDuration(workflow),
        message: `Workflow für "${workflow.opportunity_title}" erfolgreich abgeschlossen`
      };

    } catch (error) {
      // Workflow fehlgeschlagen
      workflow.status = 'failed';
      workflow.errors.push({
        step: workflow.current_step,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      workflow.failed_at = new Date().toISOString();
      
      // Verschiebe zu fehlgeschlagenen Workflows
      this.failedWorkflows.push(workflow);
      this.activeWorkflows.delete(workflowId);

      // Tracke Workflow-Fehler
      await this.analyticsTracker.trackEvent({
        type: 'workflow_failed',
        category: 'automation',
        action: 'execution_failed',
        label: workflow.opportunity_title,
        opportunity_id: workflow.opportunity_id,
        metadata: { 
          workflow_id: workflowId,
          error: error.message,
          failed_at_step: workflow.current_step
        }
      });

      console.error(`❌ Workflow ${workflowId} fehlgeschlagen:`, error);
      
      throw error;
    }
  }

  /**
   * Führt einen einzelnen Workflow-Schritt aus
   */
  async executeWorkflowStep(step, workflow) {
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (step.type) {
        case 'research':
          result = await this.executeResearchStep(step, workflow);
          break;
          
        case 'content_generation':
          result = await this.executeContentGenerationStep(step, workflow);
          break;
          
        case 'design':
          result = await this.executeDesignStep(step, workflow);
          break;
          
        case 'platform_integration':
          result = await this.executePlatformIntegrationStep(step, workflow);
          break;
          
        case 'publishing':
          result = await this.executePublishingStep(step, workflow);
          break;
          
        case 'strategy':
          result = await this.executeStrategyStep(step, workflow);
          break;
          
        case 'optimization':
          result = await this.executeOptimizationStep(step, workflow);
          break;
          
        case 'scheduling':
          result = await this.executeSchedulingStep(step, workflow);
          break;
          
        default:
          result = await this.executeGenericStep(step, workflow);
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        duration,
        result,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Führt einen Research-Schritt aus
   */
  async executeResearchStep(step, workflow) {
    console.log(`🔍 Führe Recherche aus: ${step.params.topic || 'Allgemein'}`);
    
    // Simuliere Recherche-Prozess
    await this.sleep(2000);
    
    return {
      type: 'research',
      topic: step.params.topic,
      findings: [
        'Markt zeigt starkes Wachstum',
        'Zielgruppe ist sehr engagiert',
        'Wenig direkte Konkurrenz identifiziert',
        'Hohe Nachfrage nach Qualitätsinhalten'
      ],
      keywords: ['automation', 'passive income', 'digital products'],
      market_size: 'Mittel bis Groß',
      competition_level: 'Niedrig'
    };
  }

  /**
   * Führt einen Content-Generierungs-Schritt aus
   */
  async executeContentGenerationStep(step, workflow) {
    console.log(`✍️ Generiere Content: ${step.params.content_type}`);
    
    const contentType = step.params.content_type;
    const topic = step.params.topic || workflow.opportunity_title;
    
    // Verwende den ContentGenerator
    const content = await this.contentGenerator.generateContent({
      type: contentType,
      topic: topic,
      wordCount: step.params.word_count || 1000,
      tone: step.params.tone || 'professional',
      includeImages: step.params.include_images || false
    });
    
    return {
      type: 'content',
      content_type: contentType,
      content: content.content,
      metadata: content.metadata,
      word_count: content.wordCount,
      seo_keywords: content.seoKeywords || []
    };
  }

  /**
   * Führt einen Design-Schritt aus
   */
  async executeDesignStep(step, workflow) {
    console.log(`🎨 Erstelle Design-Assets`);
    
    // Simuliere Design-Prozess
    await this.sleep(3000);
    
    return {
      type: 'design',
      assets: [
        {
          type: 'cover',
          url: '/assets/generated/cover_' + Date.now() + '.png',
          dimensions: '1200x800'
        },
        {
          type: 'social_media',
          url: '/assets/generated/social_' + Date.now() + '.png',
          dimensions: '1080x1080'
        }
      ],
      brand_colors: step.params.brand_colors,
      style: 'modern_professional'
    };
  }

  /**
   * Führt einen Platform-Integration-Schritt aus
   */
  async executePlatformIntegrationStep(step, workflow) {
    console.log(`🔗 Integriere mit Platform: ${step.params.platform}`);
    
    const platform = step.params.platform;
    
    // Simuliere Platform-Integration
    await this.sleep(2000);
    
    if (platform === 'gumroad') {
      return {
        type: 'platform_integration',
        platform: 'gumroad',
        product_id: 'gumroad_' + Date.now(),
        product_url: `https://gumroad.com/l/product_${Date.now()}`,
        price: step.params.price || 29.99,
        status: 'published'
      };
    }
    
    if (platform === 'mailchimp') {
      return {
        type: 'platform_integration',
        platform: 'mailchimp',
        campaign_id: 'mc_' + Date.now(),
        automation_id: 'auto_' + Date.now(),
        status: 'active'
      };
    }
    
    return {
      type: 'platform_integration',
      platform: platform,
      integration_id: platform + '_' + Date.now(),
      status: 'connected'
    };
  }

  /**
   * Führt einen Publishing-Schritt aus
   */
  async executePublishingStep(step, workflow) {
    console.log(`📤 Veröffentliche Content`);
    
    const platforms = step.params.platforms || ['wordpress'];
    const contentRef = step.params.content_reference || 'content_generation';
    const content = workflow.results[contentRef]?.content;
    
    if (!content) {
      throw new Error('Kein Content zum Veröffentlichen gefunden');
    }
    
    // Verwende den ContentPublisher
    const publishResults = [];
    
    for (const platform of platforms) {
      const result = await this.contentPublisher.publishContent({
        platform: platform,
        content: content,
        title: workflow.opportunity_title,
        scheduleTime: step.params.schedule_time
      });
      
      publishResults.push(result);
    }
    
    return {
      type: 'publishing',
      platforms: platforms,
      results: publishResults,
      published_at: new Date().toISOString()
    };
  }

  /**
   * Führt einen Strategy-Schritt aus
   */
  async executeStrategyStep(step, workflow) {
    console.log(`🎯 Entwickle Strategie`);
    
    // Simuliere Strategie-Entwicklung
    await this.sleep(1500);
    
    return {
      type: 'strategy',
      strategy_type: step.params.strategy_type || 'content',
      recommendations: [
        'Fokus auf hochwertige, evergreen Inhalte',
        'Multi-Platform-Ansatz für maximale Reichweite',
        'Regelmäßige Performance-Analyse und Optimierung',
        'Community-Building durch Engagement'
      ],
      timeline: step.params.timeline || '30 days',
      success_metrics: ['engagement_rate', 'conversion_rate', 'revenue']
    };
  }

  /**
   * Führt einen Optimization-Schritt aus
   */
  async executeOptimizationStep(step, workflow) {
    console.log(`⚡ Optimiere Content`);
    
    // Simuliere Optimierung
    await this.sleep(1000);
    
    return {
      type: 'optimization',
      optimizations_applied: [
        'SEO-Keywords integriert',
        'Meta-Description optimiert',
        'Readability Score verbessert',
        'Call-to-Actions verstärkt'
      ],
      seo_score: 85,
      readability_score: 'Gut',
      performance_boost: '15%'
    };
  }

  /**
   * Führt einen Scheduling-Schritt aus
   */
  async executeSchedulingStep(step, workflow) {
    console.log(`📅 Plane Content-Veröffentlichung`);
    
    // Simuliere Scheduling
    await this.sleep(1000);
    
    const scheduleCount = step.params.post_count || 7;
    const schedule = [];
    
    for (let i = 0; i < scheduleCount; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      schedule.push({
        date: date.toISOString(),
        platform: step.params.platforms?.[i % step.params.platforms.length] || 'twitter',
        content_id: `scheduled_${Date.now()}_${i}`,
        status: 'scheduled'
      });
    }
    
    return {
      type: 'scheduling',
      scheduled_posts: schedule,
      total_posts: scheduleCount,
      schedule_period: `${scheduleCount} days`
    };
  }

  /**
   * Führt einen generischen Schritt aus
   */
  async executeGenericStep(step, workflow) {
    console.log(`⚙️ Führe generischen Schritt aus: ${step.name}`);
    
    // Simuliere generische Verarbeitung
    await this.sleep(1000);
    
    return {
      type: 'generic',
      step_name: step.name,
      parameters: step.params,
      status: 'completed'
    };
  }

  /**
   * Gibt den Status aller Workflows zurück
   */
  getWorkflowStatus() {
    const active = Array.from(this.activeWorkflows.values()).map(workflow => ({
      id: workflow.id,
      opportunity_title: workflow.opportunity_title,
      category: workflow.category,
      status: workflow.status,
      progress: workflow.progress,
      current_step: workflow.current_step,
      total_steps: workflow.steps.length,
      started_at: workflow.started_at
    }));

    const completed = this.completedWorkflows.map(workflow => ({
      id: workflow.id,
      opportunity_title: workflow.opportunity_title,
      category: workflow.category,
      status: workflow.status,
      completed_at: workflow.completed_at,
      duration: this.calculateWorkflowDuration(workflow)
    }));

    const failed = this.failedWorkflows.map(workflow => ({
      id: workflow.id,
      opportunity_title: workflow.opportunity_title,
      category: workflow.category,
      status: workflow.status,
      failed_at: workflow.failed_at,
      error: workflow.errors[workflow.errors.length - 1]?.error
    }));

    return {
      active: active,
      completed: completed,
      failed: failed,
      statistics: {
        total_workflows: active.length + completed.length + failed.length,
        success_rate: completed.length > 0 ? (completed.length / (completed.length + failed.length)) * 100 : 0,
        average_duration: this.calculateAverageDuration(completed)
      }
    };
  }

  /**
   * Hilfsmethoden
   */
  
  generateWorkflowId() {
    return 'workflow_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  calculateEstimatedCompletion(workflow) {
    const totalMinutes = workflow.estimated_duration;
    const completionTime = new Date();
    completionTime.setMinutes(completionTime.getMinutes() + totalMinutes);
    return completionTime.toISOString();
  }

  calculateWorkflowDuration(workflow) {
    if (!workflow.started_at) return 0;
    
    const endTime = workflow.completed_at || workflow.failed_at || new Date().toISOString();
    const startTime = new Date(workflow.started_at);
    const endTimeDate = new Date(endTime);
    
    return Math.round((endTimeDate - startTime) / 1000 / 60); // Minuten
  }

  calculateAverageDuration(completedWorkflows) {
    if (completedWorkflows.length === 0) return 0;
    
    const totalDuration = completedWorkflows.reduce((sum, workflow) => {
      return sum + this.calculateWorkflowDuration(workflow);
    }, 0);
    
    return Math.round(totalDuration / completedWorkflows.length);
  }

  countGeneratedContent(results) {
    let count = 0;
    Object.values(results).forEach(result => {
      if (result.result?.type === 'content' || result.result?.type === 'design') {
        count++;
      }
    });
    return count;
  }

  countPublishedContent(results) {
    let count = 0;
    Object.values(results).forEach(result => {
      if (result.result?.type === 'publishing') {
        count += result.result.platforms?.length || 0;
      }
    });
    return count;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default WorkflowManager;
