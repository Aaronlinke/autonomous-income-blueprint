/**
 * Affiliate Marketing Integration Module
 * Unterstützt verschiedene Affiliate-Netzwerke und -Plattformen
 */

import fetch from 'node-fetch';

class AffiliateIntegration {
  constructor(config) {
    this.config = config;
    this.networks = {
      impact: config.impact || {},
      awin: config.awin || {},
      cj: config.cj || {},
      custom: config.custom || []
    };
  }

  /**
   * Testet die Verbindung zu konfigurierten Affiliate-Netzwerken
   */
  async testConnections() {
    const results = {};

    // Impact.com API Test
    if (this.networks.impact.apiKey) {
      results.impact = await this.testImpactConnection();
    }

    // Awin API Test
    if (this.networks.awin.apiKey) {
      results.awin = await this.testAwinConnection();
    }

    // Commission Junction API Test
    if (this.networks.cj.apiKey) {
      results.cj = await this.testCJConnection();
    }

    return results;
  }

  /**
   * Testet die Impact.com API-Verbindung
   */
  async testImpactConnection() {
    try {
      const response = await fetch('https://api.impact.com/Mediapartners', {
        headers: {
          'Authorization': `Bearer ${this.networks.impact.apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        network: 'Impact.com',
        message: 'Erfolgreich mit Impact.com verbunden'
      };
    } catch (error) {
      return {
        success: false,
        network: 'Impact.com',
        error: error.message
      };
    }
  }

  /**
   * Testet die Awin API-Verbindung
   */
  async testAwinConnection() {
    try {
      const response = await fetch('https://api.awin.com/publishers/me', {
        headers: {
          'Authorization': `Bearer ${this.networks.awin.apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        network: 'Awin',
        message: 'Erfolgreich mit Awin verbunden'
      };
    } catch (error) {
      return {
        success: false,
        network: 'Awin',
        error: error.message
      };
    }
  }

  /**
   * Testet die Commission Junction API-Verbindung
   */
  async testCJConnection() {
    try {
      const response = await fetch('https://api.cj.com/v2/publishers', {
        headers: {
          'Authorization': `Bearer ${this.networks.cj.apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        network: 'Commission Junction',
        message: 'Erfolgreich mit Commission Junction verbunden'
      };
    } catch (error) {
      return {
        success: false,
        network: 'Commission Junction',
        error: error.message
      };
    }
  }

  /**
   * Sucht nach neuen Affiliate-Programmen basierend auf Kriterien
   */
  async searchAffiliatePrograms(criteria = {}) {
    const programs = [];

    // Impact.com Programme suchen
    if (this.networks.impact.apiKey) {
      const impactPrograms = await this.searchImpactPrograms(criteria);
      programs.push(...impactPrograms);
    }

    // Awin Programme suchen
    if (this.networks.awin.apiKey) {
      const awinPrograms = await this.searchAwinPrograms(criteria);
      programs.push(...awinPrograms);
    }

    // Commission Junction Programme suchen
    if (this.networks.cj.apiKey) {
      const cjPrograms = await this.searchCJPrograms(criteria);
      programs.push(...cjPrograms);
    }

    return {
      success: true,
      programs,
      count: programs.length,
      criteria
    };
  }

  /**
   * Sucht Impact.com Programme
   */
  async searchImpactPrograms(criteria) {
    try {
      let url = 'https://api.impact.com/Campaigns';
      const params = new URLSearchParams();

      if (criteria.category) params.append('CategoryId', criteria.category);
      if (criteria.minCommission) params.append('MinimumCommissionRate', criteria.minCommission);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.networks.impact.apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.Campaigns || []).map(campaign => ({
        network: 'Impact.com',
        id: campaign.Id,
        name: campaign.Name,
        advertiser: campaign.AdvertiserName,
        category: campaign.Category,
        commissionRate: campaign.DefaultCommissionRate,
        cookieDuration: campaign.CookieDuration,
        description: campaign.Description,
        url: campaign.Url,
        status: campaign.Status,
        joinDate: campaign.JoinDate
      }));
    } catch (error) {
      console.error('Fehler beim Suchen von Impact.com Programmen:', error);
      return [];
    }
  }

  /**
   * Sucht Awin Programme
   */
  async searchAwinPrograms(criteria) {
    try {
      let url = 'https://api.awin.com/publishers/programmes';
      const params = new URLSearchParams();

      if (criteria.category) params.append('category', criteria.category);
      if (criteria.minCommission) params.append('minCommissionRate', criteria.minCommission);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.networks.awin.apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.programmes || []).map(programme => ({
        network: 'Awin',
        id: programme.id,
        name: programme.name,
        advertiser: programme.advertiser,
        category: programme.primaryCategory,
        commissionRate: programme.commissionRate,
        cookieDuration: programme.cookiePeriod,
        description: programme.description,
        url: programme.clickThroughUrl,
        status: programme.status,
        joinDate: programme.dateJoined
      }));
    } catch (error) {
      console.error('Fehler beim Suchen von Awin Programmen:', error);
      return [];
    }
  }

  /**
   * Sucht Commission Junction Programme
   */
  async searchCJPrograms(criteria) {
    try {
      let url = 'https://api.cj.com/v2/link-search';
      const params = new URLSearchParams();

      if (criteria.category) params.append('category', criteria.category);
      if (criteria.keywords) params.append('keywords', criteria.keywords);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.networks.cj.apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.links || []).map(link => ({
        network: 'Commission Junction',
        id: link.advertiserId,
        name: link.advertiserName,
        advertiser: link.advertiserName,
        category: link.category,
        commissionRate: link.commissionRate,
        description: link.description,
        url: link.clickUrl,
        linkText: link.linkText,
        creativeHeight: link.creativeHeight,
        creativeWidth: link.creativeWidth
      }));
    } catch (error) {
      console.error('Fehler beim Suchen von CJ Programmen:', error);
      return [];
    }
  }

  /**
   * Ruft Performance-Daten für Affiliate-Programme ab
   */
  async getPerformanceData(timeframe = '30d') {
    const performanceData = {};

    // Impact.com Performance
    if (this.networks.impact.apiKey) {
      performanceData.impact = await this.getImpactPerformance(timeframe);
    }

    // Awin Performance
    if (this.networks.awin.apiKey) {
      performanceData.awin = await this.getAwinPerformance(timeframe);
    }

    // Commission Junction Performance
    if (this.networks.cj.apiKey) {
      performanceData.cj = await this.getCJPerformance(timeframe);
    }

    return {
      success: true,
      data: performanceData,
      timeframe
    };
  }

  /**
   * Ruft Impact.com Performance-Daten ab
   */
  async getImpactPerformance(timeframe) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      // Berechne Startdatum basierend auf Zeitraum
      const days = parseInt(timeframe.replace('d', ''));
      startDate.setDate(endDate.getDate() - days);

      const response = await fetch(
        `https://api.impact.com/Reports/Conversions?StartDate=${startDate.toISOString().split('T')[0]}&EndDate=${endDate.toISOString().split('T')[0]}`,
        {
          headers: {
            'Authorization': `Bearer ${this.networks.impact.apiKey}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        conversions: data.Conversions || [],
        totalRevenue: data.Conversions?.reduce((sum, conv) => sum + parseFloat(conv.Revenue || 0), 0) || 0,
        totalCommissions: data.Conversions?.reduce((sum, conv) => sum + parseFloat(conv.Commission || 0), 0) || 0,
        conversionCount: data.Conversions?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ruft Awin Performance-Daten ab
   */
  async getAwinPerformance(timeframe) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      const days = parseInt(timeframe.replace('d', ''));
      startDate.setDate(endDate.getDate() - days);

      const response = await fetch(
        `https://api.awin.com/publishers/transactions?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`,
        {
          headers: {
            'Authorization': `Bearer ${this.networks.awin.apiKey}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        transactions: data.transactions || [],
        totalRevenue: data.transactions?.reduce((sum, trans) => sum + parseFloat(trans.saleAmount || 0), 0) || 0,
        totalCommissions: data.transactions?.reduce((sum, trans) => sum + parseFloat(trans.commissionAmount || 0), 0) || 0,
        conversionCount: data.transactions?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ruft Commission Junction Performance-Daten ab
   */
  async getCJPerformance(timeframe) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      const days = parseInt(timeframe.replace('d', ''));
      startDate.setDate(endDate.getDate() - days);

      const response = await fetch(
        `https://api.cj.com/v2/commissions?date-type=event&start-date=${startDate.toISOString().split('T')[0]}&end-date=${endDate.toISOString().split('T')[0]}`,
        {
          headers: {
            'Authorization': `Bearer ${this.networks.cj.apiKey}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        commissions: data.commissions || [],
        totalRevenue: data.commissions?.reduce((sum, comm) => sum + parseFloat(comm.saleAmount || 0), 0) || 0,
        totalCommissions: data.commissions?.reduce((sum, comm) => sum + parseFloat(comm.commissionAmount || 0), 0) || 0,
        conversionCount: data.commissions?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Identifiziert neue Affiliate-Opportunities
   */
  async identifyOpportunities(criteria = {}) {
    try {
      const [programsResult, performanceResult] = await Promise.all([
        this.searchAffiliatePrograms(criteria),
        this.getPerformanceData('30d')
      ]);

      const opportunities = [];

      // Analysiere verfügbare Programme
      if (programsResult.success && programsResult.programs.length > 0) {
        // Hochkommissions-Programme
        const highCommissionPrograms = programsResult.programs.filter(p => 
          parseFloat(p.commissionRate) >= 10
        );

        if (highCommissionPrograms.length > 0) {
          opportunities.push({
            type: 'high_commission_programs',
            title: 'Hochkommissions-Affiliate-Programme',
            description: `${highCommissionPrograms.length} Programme mit Kommissionsraten von 10% oder höher gefunden.`,
            potential_revenue: highCommissionPrograms.length * 500, // Schätzung
            programs: highCommissionPrograms.slice(0, 5),
            action: 'join_programs'
          });
        }

        // Neue Kategorien
        const categories = [...new Set(programsResult.programs.map(p => p.category))];
        const unexploredCategories = categories.filter(cat => {
          // Prüfe ob Kategorie bereits in Performance-Daten vorhanden
          return !Object.values(performanceResult.data || {}).some(network => 
            network.success && (network.conversions || network.transactions || network.commissions || [])
              .some(item => item.category === cat)
          );
        });

        if (unexploredCategories.length > 0) {
          opportunities.push({
            type: 'new_categories',
            title: 'Neue Affiliate-Kategorien erkunden',
            description: `${unexploredCategories.length} neue Kategorien ohne bisherige Performance gefunden.`,
            potential_revenue: unexploredCategories.length * 300, // Schätzung
            categories: unexploredCategories.slice(0, 5),
            action: 'explore_categories'
          });
        }
      }

      // Analysiere Performance-Daten für Optimierungen
      if (performanceResult.success) {
        const allNetworkData = Object.values(performanceResult.data).filter(d => d.success);
        const totalCommissions = allNetworkData.reduce((sum, d) => sum + (d.totalCommissions || 0), 0);
        const totalConversions = allNetworkData.reduce((sum, d) => sum + (d.conversionCount || 0), 0);

        if (totalCommissions > 0 && totalConversions > 0) {
          const avgCommissionPerConversion = totalCommissions / totalConversions;
          
          opportunities.push({
            type: 'performance_optimization',
            title: 'Performance-Optimierung bestehender Programme',
            description: `Aktuelle Performance: ${totalConversions} Conversions, €${totalCommissions.toFixed(2)} Kommissionen.`,
            potential_revenue: totalCommissions * 0.3, // Schätzung: 30% Steigerung
            currentMetrics: {
              conversions: totalConversions,
              commissions: totalCommissions,
              avgCommissionPerConversion
            },
            action: 'optimize_performance'
          });
        }
      }

      return {
        success: true,
        opportunities,
        count: opportunities.length,
        summary: {
          availablePrograms: programsResult.programs?.length || 0,
          currentPerformance: performanceResult.data
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        opportunities: []
      };
    }
  }
}

export default AffiliateIntegration;
