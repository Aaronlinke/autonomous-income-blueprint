/**
 * Gumroad API Integration Module
 * Ermöglicht die Verwaltung digitaler Produkte und das Tracking von Verkäufen
 */

import fetch from 'node-fetch';

class GumroadIntegration {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = 'https://api.gumroad.com/v2';
    this.headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Überprüft die Verbindung zur Gumroad API
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/user`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const userData = await response.json();
      return {
        success: true,
        user: userData.user,
        message: `Erfolgreich verbunden mit Gumroad-Account: ${userData.user.name}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Fehler beim Verbinden mit Gumroad API'
      };
    }
  }

  /**
   * Ruft alle Produkte des Benutzers ab
   */
  async getProducts() {
    try {
      const response = await fetch(`${this.baseURL}/products`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        products: data.products || [],
        count: data.products?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        products: []
      };
    }
  }

  /**
   * Ruft Details eines spezifischen Produkts ab
   */
  async getProduct(productId) {
    try {
      const response = await fetch(`${this.baseURL}/products/${productId}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        product: data.product
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        product: null
      };
    }
  }

  /**
   * Aktiviert ein Produkt
   */
  async enableProduct(productId) {
    try {
      const response = await fetch(`${this.baseURL}/products/${productId}/enable`, {
        method: 'PUT',
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return {
        success: true,
        message: `Produkt ${productId} wurde aktiviert`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Aktivieren des Produkts ${productId}`
      };
    }
  }

  /**
   * Deaktiviert ein Produkt
   */
  async disableProduct(productId) {
    try {
      const response = await fetch(`${this.baseURL}/products/${productId}/disable`, {
        method: 'PUT',
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return {
        success: true,
        message: `Produkt ${productId} wurde deaktiviert`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Deaktivieren des Produkts ${productId}`
      };
    }
  }

  /**
   * Ruft alle Verkäufe ab
   */
  async getSales(options = {}) {
    try {
      let url = `${this.baseURL}/sales`;
      const params = new URLSearchParams();
      
      if (options.after) params.append('after', options.after);
      if (options.before) params.append('before', options.before);
      if (options.page) params.append('page', options.page);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        sales: data.sales || [],
        count: data.sales?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        sales: []
      };
    }
  }

  /**
   * Ruft Details eines spezifischen Verkaufs ab
   */
  async getSale(saleId) {
    try {
      const response = await fetch(`${this.baseURL}/sales/${saleId}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        sale: data.sale
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        sale: null
      };
    }
  }

  /**
   * Ruft Auszahlungsinformationen ab
   */
  async getPayouts() {
    try {
      const response = await fetch(`${this.baseURL}/payouts`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        payouts: data.payouts || [],
        count: data.payouts?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        payouts: []
      };
    }
  }

  /**
   * Analysiert die Performance der Produkte
   */
  async analyzeProductPerformance() {
    try {
      const [productsResult, salesResult] = await Promise.all([
        this.getProducts(),
        this.getSales()
      ]);

      if (!productsResult.success || !salesResult.success) {
        throw new Error('Fehler beim Abrufen der Daten für die Performance-Analyse');
      }

      const products = productsResult.products;
      const sales = salesResult.sales;

      // Berechne Performance-Metriken für jedes Produkt
      const productPerformance = products.map(product => {
        const productSales = sales.filter(sale => sale.product_id === product.id);
        const totalRevenue = productSales.reduce((sum, sale) => sum + parseFloat(sale.price || 0), 0);
        const totalSales = productSales.length;

        return {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price || 0),
          totalSales,
          totalRevenue,
          averageRevenue: totalSales > 0 ? totalRevenue / totalSales : 0,
          isPublished: product.published,
          url: product.short_url
        };
      });

      // Sortiere nach Gesamtumsatz
      productPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue);

      return {
        success: true,
        performance: productPerformance,
        summary: {
          totalProducts: products.length,
          totalSales: sales.length,
          totalRevenue: productPerformance.reduce((sum, p) => sum + p.totalRevenue, 0),
          topProduct: productPerformance[0] || null
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        performance: []
      };
    }
  }

  /**
   * Identifiziert potenzielle Opportunities basierend auf Gumroad-Daten
   */
  async identifyOpportunities() {
    try {
      const performanceResult = await this.analyzeProductPerformance();
      
      if (!performanceResult.success) {
        throw new Error('Fehler bei der Performance-Analyse');
      }

      const opportunities = [];
      const { performance, summary } = performanceResult;

      // Opportunity 1: Unterperformende Produkte reaktivieren
      const inactiveProducts = performance.filter(p => !p.isPublished && p.totalSales > 0);
      if (inactiveProducts.length > 0) {
        opportunities.push({
          type: 'product_reactivation',
          title: 'Inaktive Produkte mit Verkaufshistorie reaktivieren',
          description: `${inactiveProducts.length} deaktivierte Produkte haben bereits Verkäufe generiert und könnten reaktiviert werden.`,
          potential_revenue: inactiveProducts.reduce((sum, p) => sum + (p.averageRevenue * 10), 0), // Schätzung: 10 weitere Verkäufe
          products: inactiveProducts.map(p => ({ id: p.id, name: p.name })),
          action: 'enable_products'
        });
      }

      // Opportunity 2: Preisoptimierung für Top-Performer
      const topPerformers = performance.filter(p => p.totalSales >= 5).slice(0, 3);
      if (topPerformers.length > 0) {
        opportunities.push({
          type: 'price_optimization',
          title: 'Preisoptimierung für Top-Performer',
          description: `${topPerformers.length} Produkte zeigen starke Performance und könnten für Preistests geeignet sein.`,
          potential_revenue: topPerformers.reduce((sum, p) => sum + (p.totalRevenue * 0.2), 0), // Schätzung: 20% Umsatzsteigerung
          products: topPerformers.map(p => ({ id: p.id, name: p.name, currentPrice: p.price })),
          action: 'price_test'
        });
      }

      // Opportunity 3: Neue Produkte in erfolgreichen Kategorien
      if (summary.topProduct && summary.topProduct.totalRevenue > 100) {
        opportunities.push({
          type: 'product_expansion',
          title: 'Produkterweiterung in erfolgreicher Kategorie',
          description: `Basierend auf dem Erfolg von "${summary.topProduct.name}" könnten ähnliche Produkte entwickelt werden.`,
          potential_revenue: summary.topProduct.totalRevenue * 0.5, // Schätzung: 50% des Top-Produkts
          reference_product: {
            id: summary.topProduct.id,
            name: summary.topProduct.name,
            revenue: summary.topProduct.totalRevenue
          },
          action: 'create_similar_product'
        });
      }

      return {
        success: true,
        opportunities,
        count: opportunities.length,
        summary
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

export default GumroadIntegration;
