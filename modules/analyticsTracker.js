/**
 * Analytics Tracker Module
 * Erweiterte Tracking- und Reporting-Funktionen für das Autonomous Income System
 */

import fetch from 'node-fetch';

class AnalyticsTracker {
  constructor(config) {
    this.config = config;
    this.googleAnalytics = config.googleAnalytics || {};
    this.customTracking = config.customTracking || {};
    
    // Interne Datenbank für Tracking-Events (in Produktion: echte DB)
    this.events = [];
    this.sessions = {};
    this.conversions = [];
    this.revenue = [];
    this.contentPerformance = {};
    this.opportunityMetrics = {};
  }

  /**
   * Trackt ein Event
   */
  async trackEvent(eventData) {
    const event = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: eventData.type,
      category: eventData.category || 'general',
      action: eventData.action,
      label: eventData.label || '',
      value: eventData.value || 0,
      user_id: eventData.user_id || 'anonymous',
      session_id: eventData.session_id || this.generateSessionId(),
      opportunity_id: eventData.opportunity_id || null,
      content_id: eventData.content_id || null,
      platform: eventData.platform || 'system',
      metadata: eventData.metadata || {}
    };

    // Speichere Event intern
    this.events.push(event);

    // Sende an Google Analytics falls konfiguriert
    if (this.googleAnalytics.enabled && this.googleAnalytics.trackingId) {
      await this.sendToGoogleAnalytics(event);
    }

    // Sende an Custom Tracking Endpoints
    if (this.customTracking.enabled && this.customTracking.endpoints) {
      await this.sendToCustomEndpoints(event);
    }

    return {
      success: true,
      event_id: event.id,
      message: 'Event erfolgreich getrackt'
    };
  }

  /**
   * Trackt eine Conversion
   */
  async trackConversion(conversionData) {
    const conversion = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: conversionData.type, // 'sale', 'lead', 'signup', 'download'
      opportunity_id: conversionData.opportunity_id,
      content_id: conversionData.content_id,
      platform: conversionData.platform,
      value: parseFloat(conversionData.value || 0),
      currency: conversionData.currency || 'EUR',
      user_id: conversionData.user_id || 'anonymous',
      session_id: conversionData.session_id,
      source: conversionData.source || 'direct',
      medium: conversionData.medium || 'organic',
      campaign: conversionData.campaign || '',
      metadata: conversionData.metadata || {}
    };

    this.conversions.push(conversion);

    // Tracke auch als Event
    await this.trackEvent({
      type: 'conversion',
      category: 'revenue',
      action: conversion.type,
      label: conversion.platform,
      value: conversion.value,
      opportunity_id: conversion.opportunity_id,
      content_id: conversion.content_id,
      platform: conversion.platform,
      metadata: conversion
    });

    // Aktualisiere Revenue-Tracking
    if (conversion.value > 0) {
      await this.trackRevenue({
        amount: conversion.value,
        currency: conversion.currency,
        opportunity_id: conversion.opportunity_id,
        conversion_id: conversion.id,
        source: conversion.source
      });
    }

    return {
      success: true,
      conversion_id: conversion.id,
      message: 'Conversion erfolgreich getrackt'
    };
  }

  /**
   * Trackt Revenue
   */
  async trackRevenue(revenueData) {
    const revenue = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      amount: parseFloat(revenueData.amount),
      currency: revenueData.currency || 'EUR',
      opportunity_id: revenueData.opportunity_id,
      conversion_id: revenueData.conversion_id,
      source: revenueData.source || 'direct',
      type: revenueData.type || 'sale', // 'sale', 'commission', 'subscription'
      recurring: revenueData.recurring || false,
      metadata: revenueData.metadata || {}
    };

    this.revenue.push(revenue);

    // Tracke als Event
    await this.trackEvent({
      type: 'revenue',
      category: 'financial',
      action: revenue.type,
      label: revenue.source,
      value: revenue.amount,
      opportunity_id: revenue.opportunity_id,
      metadata: revenue
    });

    return {
      success: true,
      revenue_id: revenue.id,
      message: 'Revenue erfolgreich getrackt'
    };
  }

  /**
   * Trackt Content-Performance
   */
  async trackContentPerformance(contentId, performanceData) {
    if (!this.contentPerformance[contentId]) {
      this.contentPerformance[contentId] = {
        content_id: contentId,
        created_at: new Date().toISOString(),
        metrics: {
          views: 0,
          clicks: 0,
          shares: 0,
          comments: 0,
          likes: 0,
          conversions: 0,
          revenue: 0
        },
        platforms: {},
        history: []
      };
    }

    const content = this.contentPerformance[contentId];
    
    // Aktualisiere Metriken
    Object.keys(performanceData.metrics || {}).forEach(metric => {
      if (content.metrics.hasOwnProperty(metric)) {
        content.metrics[metric] += performanceData.metrics[metric];
      }
    });

    // Plattform-spezifische Daten
    if (performanceData.platform) {
      if (!content.platforms[performanceData.platform]) {
        content.platforms[performanceData.platform] = {
          views: 0,
          clicks: 0,
          shares: 0,
          engagement_rate: 0
        };
      }
      
      Object.keys(performanceData.platform_metrics || {}).forEach(metric => {
        if (content.platforms[performanceData.platform].hasOwnProperty(metric)) {
          content.platforms[performanceData.platform][metric] += performanceData.platform_metrics[metric];
        }
      });
    }

    // Füge zur Historie hinzu
    content.history.push({
      timestamp: new Date().toISOString(),
      ...performanceData
    });

    // Tracke als Event
    await this.trackEvent({
      type: 'content_performance',
      category: 'content',
      action: 'update_metrics',
      label: contentId,
      content_id: contentId,
      platform: performanceData.platform,
      metadata: performanceData
    });

    return {
      success: true,
      content_id: contentId,
      updated_metrics: content.metrics
    };
  }

  /**
   * Trackt Opportunity-Metriken
   */
  async trackOpportunityMetrics(opportunityId, metricsData) {
    if (!this.opportunityMetrics[opportunityId]) {
      this.opportunityMetrics[opportunityId] = {
        opportunity_id: opportunityId,
        created_at: new Date().toISOString(),
        status_changes: [],
        content_generated: 0,
        content_published: 0,
        total_views: 0,
        total_clicks: 0,
        total_conversions: 0,
        total_revenue: 0,
        roi_actual: 0,
        cost_invested: 0,
        platforms_used: [],
        performance_by_platform: {}
      };
    }

    const opportunity = this.opportunityMetrics[opportunityId];
    
    // Aktualisiere Metriken
    Object.keys(metricsData).forEach(key => {
      if (opportunity.hasOwnProperty(key) && typeof opportunity[key] === 'number') {
        opportunity[key] += metricsData[key];
      } else if (key === 'status_change') {
        opportunity.status_changes.push({
          timestamp: new Date().toISOString(),
          from: metricsData.status_change.from,
          to: metricsData.status_change.to,
          reason: metricsData.status_change.reason
        });
      } else if (key === 'platform_performance') {
        const platform = metricsData.platform_performance.platform;
        if (!opportunity.performance_by_platform[platform]) {
          opportunity.performance_by_platform[platform] = {
            views: 0,
            clicks: 0,
            conversions: 0,
            revenue: 0
          };
        }
        
        Object.keys(metricsData.platform_performance.metrics).forEach(metric => {
          if (opportunity.performance_by_platform[platform].hasOwnProperty(metric)) {
            opportunity.performance_by_platform[platform][metric] += metricsData.platform_performance.metrics[metric];
          }
        });
        
        if (!opportunity.platforms_used.includes(platform)) {
          opportunity.platforms_used.push(platform);
        }
      }
    });

    // Berechne ROI
    if (opportunity.cost_invested > 0) {
      opportunity.roi_actual = ((opportunity.total_revenue - opportunity.cost_invested) / opportunity.cost_invested) * 100;
    }

    return {
      success: true,
      opportunity_id: opportunityId,
      updated_metrics: opportunity
    };
  }

  /**
   * Generiert UTM-Links für Tracking
   */
  generateUTMLink(baseUrl, utmParams) {
    const url = new URL(baseUrl);
    
    const utmMapping = {
      source: 'utm_source',
      medium: 'utm_medium',
      campaign: 'utm_campaign',
      term: 'utm_term',
      content: 'utm_content'
    };

    Object.keys(utmParams).forEach(key => {
      const utmKey = utmMapping[key] || key;
      if (utmParams[key]) {
        url.searchParams.set(utmKey, utmParams[key]);
      }
    });

    return url.toString();
  }

  /**
   * Analysiert die Performance über einen Zeitraum
   */
  analyzePerformance(timeframe = '30d', filters = {}) {
    const endDate = new Date();
    const startDate = new Date();
    const days = parseInt(timeframe.replace('d', ''));
    startDate.setDate(endDate.getDate() - days);

    // Filtere Events nach Zeitraum
    const filteredEvents = this.events.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= startDate && eventDate <= endDate;
    });

    // Filtere Conversions
    const filteredConversions = this.conversions.filter(conversion => {
      const conversionDate = new Date(conversion.timestamp);
      return conversionDate >= startDate && conversionDate <= endDate;
    });

    // Filtere Revenue
    const filteredRevenue = this.revenue.filter(rev => {
      const revenueDate = new Date(rev.timestamp);
      return revenueDate >= startDate && revenueDate <= endDate;
    });

    // Basis-Metriken
    const totalEvents = filteredEvents.length;
    const totalConversions = filteredConversions.length;
    const totalRevenue = filteredRevenue.reduce((sum, rev) => sum + rev.amount, 0);
    const conversionRate = totalEvents > 0 ? (totalConversions / totalEvents) * 100 : 0;

    // Events nach Kategorie
    const eventsByCategory = {};
    filteredEvents.forEach(event => {
      if (!eventsByCategory[event.category]) {
        eventsByCategory[event.category] = 0;
      }
      eventsByCategory[event.category]++;
    });

    // Events nach Plattform
    const eventsByPlatform = {};
    filteredEvents.forEach(event => {
      if (!eventsByPlatform[event.platform]) {
        eventsByPlatform[event.platform] = 0;
      }
      eventsByPlatform[event.platform]++;
    });

    // Revenue nach Quelle
    const revenueBySource = {};
    filteredRevenue.forEach(rev => {
      if (!revenueBySource[rev.source]) {
        revenueBySource[rev.source] = 0;
      }
      revenueBySource[rev.source] += rev.amount;
    });

    // Top-Opportunities nach Revenue
    const opportunityRevenue = {};
    filteredRevenue.forEach(rev => {
      if (rev.opportunity_id) {
        if (!opportunityRevenue[rev.opportunity_id]) {
          opportunityRevenue[rev.opportunity_id] = 0;
        }
        opportunityRevenue[rev.opportunity_id] += rev.amount;
      }
    });

    const topOpportunities = Object.entries(opportunityRevenue)
      .map(([id, revenue]) => ({ opportunity_id: parseInt(id), revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Tägliche Performance
    const dailyPerformance = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyPerformance[dateKey] = {
        events: 0,
        conversions: 0,
        revenue: 0
      };
    }

    filteredEvents.forEach(event => {
      const dateKey = event.timestamp.split('T')[0];
      if (dailyPerformance[dateKey]) {
        dailyPerformance[dateKey].events++;
      }
    });

    filteredConversions.forEach(conversion => {
      const dateKey = conversion.timestamp.split('T')[0];
      if (dailyPerformance[dateKey]) {
        dailyPerformance[dateKey].conversions++;
      }
    });

    filteredRevenue.forEach(rev => {
      const dateKey = rev.timestamp.split('T')[0];
      if (dailyPerformance[dateKey]) {
        dailyPerformance[dateKey].revenue += rev.amount;
      }
    });

    return {
      timeframe,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: days
      },
      summary: {
        total_events: totalEvents,
        total_conversions: totalConversions,
        total_revenue: totalRevenue,
        conversion_rate: conversionRate,
        average_revenue_per_conversion: totalConversions > 0 ? totalRevenue / totalConversions : 0,
        events_per_day: totalEvents / days,
        revenue_per_day: totalRevenue / days
      },
      breakdowns: {
        events_by_category: eventsByCategory,
        events_by_platform: eventsByPlatform,
        revenue_by_source: revenueBySource,
        top_opportunities: topOpportunities
      },
      daily_performance: dailyPerformance,
      content_performance: this.getTopContentPerformance(10),
      opportunity_metrics: this.getTopOpportunityMetrics(10)
    };
  }

  /**
   * Erstellt einen detaillierten Performance-Report
   */
  generatePerformanceReport(timeframe = '30d', options = {}) {
    const analysis = this.analyzePerformance(timeframe);
    const {
      includeCharts = true,
      includeRecommendations = true,
      format = 'detailed'
    } = options;

    const report = {
      title: `Autonomous Income System - Performance Report`,
      generated_at: new Date().toISOString(),
      timeframe: timeframe,
      period: analysis.period,
      
      executive_summary: {
        total_revenue: analysis.summary.total_revenue,
        total_conversions: analysis.summary.total_conversions,
        conversion_rate: analysis.summary.conversion_rate,
        key_insights: this.generateKeyInsights(analysis),
        performance_grade: this.calculatePerformanceGrade(analysis)
      },

      detailed_metrics: {
        traffic: {
          total_events: analysis.summary.total_events,
          events_per_day: analysis.summary.events_per_day,
          top_categories: Object.entries(analysis.breakdowns.events_by_category)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5),
          top_platforms: Object.entries(analysis.breakdowns.events_by_platform)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
        },
        
        conversions: {
          total_conversions: analysis.summary.total_conversions,
          conversion_rate: analysis.summary.conversion_rate,
          conversions_by_type: this.getConversionsByType(timeframe),
          conversion_funnel: this.calculateConversionFunnel(timeframe)
        },
        
        revenue: {
          total_revenue: analysis.summary.total_revenue,
          revenue_per_day: analysis.summary.revenue_per_day,
          average_revenue_per_conversion: analysis.summary.average_revenue_per_conversion,
          revenue_by_source: analysis.breakdowns.revenue_by_source,
          revenue_trend: this.calculateRevenueTrend(analysis.daily_performance)
        },
        
        opportunities: {
          top_performing: analysis.breakdowns.top_opportunities,
          total_opportunities_tracked: Object.keys(this.opportunityMetrics).length,
          average_roi: this.calculateAverageROI(),
          opportunity_success_rate: this.calculateOpportunitySuccessRate()
        },
        
        content: {
          top_performing_content: analysis.content_performance,
          total_content_pieces: Object.keys(this.contentPerformance).length,
          average_engagement_rate: this.calculateAverageEngagementRate(),
          content_roi: this.calculateContentROI()
        }
      },

      trends: {
        daily_performance: analysis.daily_performance,
        growth_rate: this.calculateGrowthRate(analysis.daily_performance),
        seasonality: this.detectSeasonality(analysis.daily_performance),
        forecasts: this.generateForecasts(analysis.daily_performance)
      }
    };

    if (includeRecommendations) {
      report.recommendations = this.generateRecommendations(analysis);
    }

    if (includeCharts) {
      report.charts = this.generateChartData(analysis);
    }

    return report;
  }

  /**
   * Sendet Event an Google Analytics
   */
  async sendToGoogleAnalytics(event) {
    try {
      // Google Analytics 4 Measurement Protocol
      const measurementId = this.googleAnalytics.trackingId;
      const apiSecret = this.googleAnalytics.apiSecret;
      
      if (!measurementId || !apiSecret) {
        console.warn('Google Analytics nicht vollständig konfiguriert');
        return false;
      }

      const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;
      
      const payload = {
        client_id: event.user_id,
        events: [{
          name: event.action,
          parameters: {
            event_category: event.category,
            event_label: event.label,
            value: event.value,
            custom_parameter_1: event.opportunity_id,
            custom_parameter_2: event.content_id,
            custom_parameter_3: event.platform
          }
        }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('Fehler beim Senden an Google Analytics:', error);
      return false;
    }
  }

  /**
   * Sendet Event an Custom Tracking Endpoints
   */
  async sendToCustomEndpoints(event) {
    if (!this.customTracking.endpoints || this.customTracking.endpoints.length === 0) {
      return true;
    }

    const promises = this.customTracking.endpoints.map(async (endpoint) => {
      try {
        const response = await fetch(endpoint.url, {
          method: endpoint.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...endpoint.headers
          },
          body: JSON.stringify({
            event,
            timestamp: new Date().toISOString()
          })
        });

        return response.ok;
      } catch (error) {
        console.error(`Fehler beim Senden an ${endpoint.url}:`, error);
        return false;
      }
    });

    const results = await Promise.all(promises);
    return results.every(result => result);
  }

  /**
   * Hilfsmethoden für Report-Generierung
   */

  generateKeyInsights(analysis) {
    const insights = [];
    
    if (analysis.summary.conversion_rate > 5) {
      insights.push('Überdurchschnittliche Conversion-Rate von ' + analysis.summary.conversion_rate.toFixed(2) + '%');
    } else if (analysis.summary.conversion_rate < 1) {
      insights.push('Conversion-Rate unter 1% - Optimierung erforderlich');
    }
    
    if (analysis.summary.revenue_per_day > 100) {
      insights.push('Starke tägliche Revenue-Generierung von €' + analysis.summary.revenue_per_day.toFixed(2));
    }
    
    const topPlatform = Object.entries(analysis.breakdowns.events_by_platform)
      .sort(([,a], [,b]) => b - a)[0];
    if (topPlatform) {
      insights.push(`${topPlatform[0]} ist die stärkste Traffic-Quelle mit ${topPlatform[1]} Events`);
    }
    
    return insights;
  }

  calculatePerformanceGrade(analysis) {
    let score = 0;
    
    // Conversion Rate (0-30 Punkte)
    if (analysis.summary.conversion_rate >= 5) score += 30;
    else if (analysis.summary.conversion_rate >= 2) score += 20;
    else if (analysis.summary.conversion_rate >= 1) score += 10;
    
    // Revenue per Day (0-30 Punkte)
    if (analysis.summary.revenue_per_day >= 200) score += 30;
    else if (analysis.summary.revenue_per_day >= 100) score += 20;
    else if (analysis.summary.revenue_per_day >= 50) score += 10;
    
    // Event Volume (0-20 Punkte)
    if (analysis.summary.events_per_day >= 1000) score += 20;
    else if (analysis.summary.events_per_day >= 500) score += 15;
    else if (analysis.summary.events_per_day >= 100) score += 10;
    
    // Diversification (0-20 Punkte)
    const platformCount = Object.keys(analysis.breakdowns.events_by_platform).length;
    if (platformCount >= 5) score += 20;
    else if (platformCount >= 3) score += 15;
    else if (platformCount >= 2) score += 10;
    
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'F';
  }

  getConversionsByType(timeframe) {
    const endDate = new Date();
    const startDate = new Date();
    const days = parseInt(timeframe.replace('d', ''));
    startDate.setDate(endDate.getDate() - days);

    const conversionsByType = {};
    this.conversions
      .filter(conv => new Date(conv.timestamp) >= startDate && new Date(conv.timestamp) <= endDate)
      .forEach(conv => {
        if (!conversionsByType[conv.type]) {
          conversionsByType[conv.type] = 0;
        }
        conversionsByType[conv.type]++;
      });

    return conversionsByType;
  }

  calculateConversionFunnel(timeframe) {
    // Vereinfachter Conversion Funnel
    const endDate = new Date();
    const startDate = new Date();
    const days = parseInt(timeframe.replace('d', ''));
    startDate.setDate(endDate.getDate() - days);

    const filteredEvents = this.events.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= startDate && eventDate <= endDate;
    });

    const views = filteredEvents.filter(e => e.type === 'view' || e.category === 'content').length;
    const clicks = filteredEvents.filter(e => e.type === 'click' || e.action === 'click').length;
    const conversions = this.conversions.filter(conv => {
      const convDate = new Date(conv.timestamp);
      return convDate >= startDate && convDate <= endDate;
    }).length;

    return {
      views,
      clicks,
      conversions,
      view_to_click_rate: views > 0 ? (clicks / views) * 100 : 0,
      click_to_conversion_rate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      overall_conversion_rate: views > 0 ? (conversions / views) * 100 : 0
    };
  }

  calculateRevenueTrend(dailyPerformance) {
    const days = Object.keys(dailyPerformance).sort();
    if (days.length < 2) return 0;

    const firstHalf = days.slice(0, Math.floor(days.length / 2));
    const secondHalf = days.slice(Math.floor(days.length / 2));

    const firstHalfRevenue = firstHalf.reduce((sum, day) => sum + dailyPerformance[day].revenue, 0);
    const secondHalfRevenue = secondHalf.reduce((sum, day) => sum + dailyPerformance[day].revenue, 0);

    const firstHalfAvg = firstHalfRevenue / firstHalf.length;
    const secondHalfAvg = secondHalfRevenue / secondHalf.length;

    return firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
  }

  getTopContentPerformance(limit = 10) {
    return Object.values(this.contentPerformance)
      .sort((a, b) => (b.metrics.revenue + b.metrics.conversions * 10) - (a.metrics.revenue + a.metrics.conversions * 10))
      .slice(0, limit)
      .map(content => ({
        content_id: content.content_id,
        total_score: content.metrics.revenue + content.metrics.conversions * 10,
        ...content.metrics
      }));
  }

  getTopOpportunityMetrics(limit = 10) {
    return Object.values(this.opportunityMetrics)
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);
  }

  calculateAverageROI() {
    const opportunities = Object.values(this.opportunityMetrics);
    if (opportunities.length === 0) return 0;

    const totalROI = opportunities.reduce((sum, opp) => sum + opp.roi_actual, 0);
    return totalROI / opportunities.length;
  }

  calculateOpportunitySuccessRate() {
    const opportunities = Object.values(this.opportunityMetrics);
    if (opportunities.length === 0) return 0;

    const successfulOpportunities = opportunities.filter(opp => opp.total_revenue > opp.cost_invested);
    return (successfulOpportunities.length / opportunities.length) * 100;
  }

  calculateAverageEngagementRate() {
    const content = Object.values(this.contentPerformance);
    if (content.length === 0) return 0;

    const totalEngagement = content.reduce((sum, c) => {
      const views = c.metrics.views || 1;
      const engagements = c.metrics.clicks + c.metrics.shares + c.metrics.comments + c.metrics.likes;
      return sum + (engagements / views);
    }, 0);

    return (totalEngagement / content.length) * 100;
  }

  calculateContentROI() {
    const content = Object.values(this.contentPerformance);
    if (content.length === 0) return 0;

    const totalRevenue = content.reduce((sum, c) => sum + c.metrics.revenue, 0);
    const estimatedCost = content.length * 50; // Geschätzte Kosten pro Content-Stück

    return estimatedCost > 0 ? ((totalRevenue - estimatedCost) / estimatedCost) * 100 : 0;
  }

  calculateGrowthRate(dailyPerformance) {
    const days = Object.keys(dailyPerformance).sort();
    if (days.length < 7) return 0;

    const lastWeek = days.slice(-7);
    const previousWeek = days.slice(-14, -7);

    const lastWeekRevenue = lastWeek.reduce((sum, day) => sum + dailyPerformance[day].revenue, 0);
    const previousWeekRevenue = previousWeek.reduce((sum, day) => sum + dailyPerformance[day].revenue, 0);

    return previousWeekRevenue > 0 ? ((lastWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100 : 0;
  }

  detectSeasonality(dailyPerformance) {
    // Vereinfachte Saisonalitätserkennung
    const days = Object.keys(dailyPerformance).sort();
    const weekdayPerformance = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const weekdayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    days.forEach(day => {
      const date = new Date(day);
      const weekday = date.getDay();
      weekdayPerformance[weekday] += dailyPerformance[day].revenue;
      weekdayCounts[weekday]++;
    });

    const avgByWeekday = {};
    Object.keys(weekdayPerformance).forEach(day => {
      avgByWeekday[day] = weekdayCounts[day] > 0 ? weekdayPerformance[day] / weekdayCounts[day] : 0;
    });

    return avgByWeekday;
  }

  generateForecasts(dailyPerformance) {
    const days = Object.keys(dailyPerformance).sort();
    if (days.length < 7) return null;

    const recentRevenue = days.slice(-7).map(day => dailyPerformance[day].revenue);
    const avgDailyRevenue = recentRevenue.reduce((sum, rev) => sum + rev, 0) / recentRevenue.length;

    return {
      next_7_days: avgDailyRevenue * 7,
      next_30_days: avgDailyRevenue * 30,
      confidence: recentRevenue.length >= 7 ? 'medium' : 'low'
    };
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.summary.conversion_rate < 2) {
      recommendations.push({
        type: 'conversion_optimization',
        priority: 'high',
        title: 'Conversion-Rate optimieren',
        description: 'Die aktuelle Conversion-Rate ist unter 2%. Überprüfen Sie Landing Pages und Call-to-Actions.',
        action: 'A/B-Test verschiedene Landing Page Varianten'
      });
    }

    const topPlatforms = Object.entries(analysis.breakdowns.events_by_platform)
      .sort(([,a], [,b]) => b - a);
    
    if (topPlatforms.length === 1) {
      recommendations.push({
        type: 'diversification',
        priority: 'medium',
        title: 'Plattform-Diversifikation',
        description: 'Sie sind zu abhängig von einer einzigen Plattform. Diversifizieren Sie Ihre Traffic-Quellen.',
        action: 'Erweitern Sie auf 2-3 zusätzliche Plattformen'
      });
    }

    if (analysis.summary.revenue_per_day < 50) {
      recommendations.push({
        type: 'revenue_growth',
        priority: 'high',
        title: 'Revenue-Steigerung',
        description: 'Tägliche Einnahmen sind unter €50. Fokussieren Sie sich auf höherwertige Opportunities.',
        action: 'Analysieren Sie Top-Performer und skalieren Sie erfolgreiche Strategien'
      });
    }

    return recommendations;
  }

  generateChartData(analysis) {
    return {
      daily_revenue: {
        type: 'line',
        data: Object.entries(analysis.daily_performance).map(([date, data]) => ({
          date,
          revenue: data.revenue
        }))
      },
      conversion_funnel: {
        type: 'funnel',
        data: analysis.detailed_metrics?.conversions?.conversion_funnel || {}
      },
      platform_distribution: {
        type: 'pie',
        data: Object.entries(analysis.breakdowns.events_by_platform).map(([platform, count]) => ({
          platform,
          count
        }))
      },
      revenue_by_source: {
        type: 'bar',
        data: Object.entries(analysis.breakdowns.revenue_by_source).map(([source, revenue]) => ({
          source,
          revenue
        }))
      }
    };
  }

  // Utility-Methoden
  generateEventId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  generateSessionId() {
    return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default AnalyticsTracker;
