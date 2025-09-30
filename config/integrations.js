/**
 * Integration Configuration Manager
 * Verwaltet API-Schlüssel und Konfigurationen für verschiedene Dienste
 */

import fs from 'fs';
import path from 'path';

class IntegrationConfig {
  constructor(configPath = './config/integrations.json') {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  /**
   * Lädt die Konfiguration aus der Datei oder Umgebungsvariablen
   */
  loadConfig() {
    let config = {
      gumroad: {
        accessToken: null,
        enabled: false
      },
      affiliate: {
        impact: {
          apiKey: null,
          enabled: false
        },
        awin: {
          apiKey: null,
          enabled: false
        },
        cj: {
          apiKey: null,
          enabled: false
        },
        custom: []
      },
      openai: {
        apiKey: null,
        enabled: false,
        model: 'gpt-4',
        maxTokens: 2000
      },
      wordpress: {
        url: null,
        username: null,
        password: null,
        enabled: false
      },
      analytics: {
        googleAnalytics: {
          trackingId: null,
          enabled: false
        },
        customTracking: {
          enabled: false,
          endpoints: []
        }
      },
      email: {
        mailchimp: {
          apiKey: null,
          enabled: false
        },
        smtp: {
          host: null,
          port: 587,
          username: null,
          password: null,
          enabled: false
        }
      },
      social: {
        twitter: {
          apiKey: null,
          apiSecret: null,
          accessToken: null,
          accessTokenSecret: null,
          enabled: false
        },
        linkedin: {
          clientId: null,
          clientSecret: null,
          accessToken: null,
          enabled: false
        }
      }
    };

    // Versuche Konfiguration aus Datei zu laden
    try {
      if (fs.existsSync(this.configPath)) {
        const fileConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        config = { ...config, ...fileConfig };
      }
    } catch (error) {
      console.warn('Warnung: Konfigurationsdatei konnte nicht geladen werden:', error.message);
    }

    // Überschreibe mit Umgebungsvariablen (höchste Priorität)
    this.loadFromEnvironment(config);

    return config;
  }

  /**
   * Lädt Konfiguration aus Umgebungsvariablen
   */
  loadFromEnvironment(config) {
    // Gumroad
    if (process.env.GUMROAD_ACCESS_TOKEN) {
      config.gumroad.accessToken = process.env.GUMROAD_ACCESS_TOKEN;
      config.gumroad.enabled = true;
    }

    // Affiliate Networks
    if (process.env.IMPACT_API_KEY) {
      config.affiliate.impact.apiKey = process.env.IMPACT_API_KEY;
      config.affiliate.impact.enabled = true;
    }

    if (process.env.AWIN_API_KEY) {
      config.affiliate.awin.apiKey = process.env.AWIN_API_KEY;
      config.affiliate.awin.enabled = true;
    }

    if (process.env.CJ_API_KEY) {
      config.affiliate.cj.apiKey = process.env.CJ_API_KEY;
      config.affiliate.cj.enabled = true;
    }

    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      config.openai.apiKey = process.env.OPENAI_API_KEY;
      config.openai.enabled = true;
    }

    // WordPress
    if (process.env.WORDPRESS_URL && process.env.WORDPRESS_USERNAME && process.env.WORDPRESS_PASSWORD) {
      config.wordpress.url = process.env.WORDPRESS_URL;
      config.wordpress.username = process.env.WORDPRESS_USERNAME;
      config.wordpress.password = process.env.WORDPRESS_PASSWORD;
      config.wordpress.enabled = true;
    }

    // Google Analytics
    if (process.env.GA_TRACKING_ID) {
      config.analytics.googleAnalytics.trackingId = process.env.GA_TRACKING_ID;
      config.analytics.googleAnalytics.enabled = true;
    }

    // Mailchimp
    if (process.env.MAILCHIMP_API_KEY) {
      config.email.mailchimp.apiKey = process.env.MAILCHIMP_API_KEY;
      config.email.mailchimp.enabled = true;
    }

    // SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD) {
      config.email.smtp.host = process.env.SMTP_HOST;
      config.email.smtp.port = process.env.SMTP_PORT || 587;
      config.email.smtp.username = process.env.SMTP_USERNAME;
      config.email.smtp.password = process.env.SMTP_PASSWORD;
      config.email.smtp.enabled = true;
    }

    // Twitter
    if (process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET && 
        process.env.TWITTER_ACCESS_TOKEN && process.env.TWITTER_ACCESS_TOKEN_SECRET) {
      config.social.twitter.apiKey = process.env.TWITTER_API_KEY;
      config.social.twitter.apiSecret = process.env.TWITTER_API_SECRET;
      config.social.twitter.accessToken = process.env.TWITTER_ACCESS_TOKEN;
      config.social.twitter.accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
      config.social.twitter.enabled = true;
    }

    // LinkedIn
    if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET && process.env.LINKEDIN_ACCESS_TOKEN) {
      config.social.linkedin.clientId = process.env.LINKEDIN_CLIENT_ID;
      config.social.linkedin.clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      config.social.linkedin.accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
      config.social.linkedin.enabled = true;
    }
  }

  /**
   * Speichert die Konfiguration in eine Datei
   */
  saveConfig() {
    try {
      // Erstelle Verzeichnis falls es nicht existiert
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Entferne sensible Daten für die Speicherung
      const sanitizedConfig = this.sanitizeForStorage(this.config);
      
      fs.writeFileSync(this.configPath, JSON.stringify(sanitizedConfig, null, 2));
      return { success: true, message: 'Konfiguration gespeichert' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Entfernt sensible Daten aus der Konfiguration für die Speicherung
   */
  sanitizeForStorage(config) {
    const sanitized = JSON.parse(JSON.stringify(config));
    
    // Entferne API-Schlüssel und Passwörter
    const sensitiveFields = [
      'accessToken', 'apiKey', 'password', 'apiSecret', 
      'accessTokenSecret', 'clientSecret'
    ];

    function removeSensitiveData(obj) {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          removeSensitiveData(obj[key]);
        } else if (sensitiveFields.includes(key)) {
          obj[key] = obj[key] ? '[CONFIGURED]' : null;
        }
      }
    }

    removeSensitiveData(sanitized);
    return sanitized;
  }

  /**
   * Ruft die Konfiguration für einen bestimmten Service ab
   */
  getServiceConfig(serviceName) {
    return this.config[serviceName] || null;
  }

  /**
   * Aktualisiert die Konfiguration für einen Service
   */
  updateServiceConfig(serviceName, newConfig) {
    if (this.config[serviceName]) {
      this.config[serviceName] = { ...this.config[serviceName], ...newConfig };
      return { success: true, message: `${serviceName} Konfiguration aktualisiert` };
    } else {
      return { success: false, error: `Service ${serviceName} nicht gefunden` };
    }
  }

  /**
   * Prüft welche Services konfiguriert und aktiviert sind
   */
  getEnabledServices() {
    const enabled = {};
    
    function checkEnabled(obj, path = '') {
      for (const key in obj) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (obj[key].enabled === true) {
            enabled[currentPath] = true;
          } else {
            checkEnabled(obj[key], currentPath);
          }
        }
      }
    }

    checkEnabled(this.config);
    return enabled;
  }

  /**
   * Generiert eine Übersicht der Konfiguration (ohne sensible Daten)
   */
  getConfigurationOverview() {
    const overview = {
      services: {},
      summary: {
        totalServices: 0,
        enabledServices: 0,
        configuredServices: 0
      }
    };

    const services = [
      'gumroad', 'affiliate', 'openai', 'wordpress', 
      'analytics', 'email', 'social'
    ];

    services.forEach(service => {
      const serviceConfig = this.config[service];
      if (serviceConfig) {
        overview.services[service] = {
          enabled: serviceConfig.enabled || false,
          configured: this.isServiceConfigured(service),
          subservices: {}
        };

        // Prüfe Subservices
        Object.keys(serviceConfig).forEach(subKey => {
          if (typeof serviceConfig[subKey] === 'object' && serviceConfig[subKey] !== null) {
            overview.services[service].subservices[subKey] = {
              enabled: serviceConfig[subKey].enabled || false,
              configured: this.isSubserviceConfigured(service, subKey)
            };
          }
        });

        overview.summary.totalServices++;
        if (overview.services[service].enabled) {
          overview.summary.enabledServices++;
        }
        if (overview.services[service].configured) {
          overview.summary.configuredServices++;
        }
      }
    });

    return overview;
  }

  /**
   * Prüft ob ein Service vollständig konfiguriert ist
   */
  isServiceConfigured(serviceName) {
    const serviceConfig = this.config[serviceName];
    if (!serviceConfig) return false;

    switch (serviceName) {
      case 'gumroad':
        return !!serviceConfig.accessToken;
      
      case 'openai':
        return !!serviceConfig.apiKey;
      
      case 'wordpress':
        return !!(serviceConfig.url && serviceConfig.username && serviceConfig.password);
      
      case 'affiliate':
        return !!(serviceConfig.impact.apiKey || serviceConfig.awin.apiKey || serviceConfig.cj.apiKey);
      
      default:
        return false;
    }
  }

  /**
   * Prüft ob ein Subservice konfiguriert ist
   */
  isSubserviceConfigured(serviceName, subserviceName) {
    const subserviceConfig = this.config[serviceName]?.[subserviceName];
    if (!subserviceConfig) return false;

    // Prüfe auf erforderliche Felder basierend auf dem Service
    const requiredFields = {
      'affiliate.impact': ['apiKey'],
      'affiliate.awin': ['apiKey'],
      'affiliate.cj': ['apiKey'],
      'email.mailchimp': ['apiKey'],
      'email.smtp': ['host', 'username', 'password'],
      'social.twitter': ['apiKey', 'apiSecret', 'accessToken', 'accessTokenSecret'],
      'social.linkedin': ['clientId', 'clientSecret', 'accessToken'],
      'analytics.googleAnalytics': ['trackingId']
    };

    const key = `${serviceName}.${subserviceName}`;
    const required = requiredFields[key] || [];
    
    return required.every(field => !!subserviceConfig[field]);
  }

  /**
   * Validiert die gesamte Konfiguration
   */
  validateConfiguration() {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      services: {}
    };

    // Validiere jeden Service
    Object.keys(this.config).forEach(serviceName => {
      const serviceValidation = this.validateService(serviceName);
      validation.services[serviceName] = serviceValidation;
      
      if (!serviceValidation.valid) {
        validation.valid = false;
        validation.errors.push(...serviceValidation.errors);
      }
      
      validation.warnings.push(...serviceValidation.warnings);
    });

    return validation;
  }

  /**
   * Validiert einen spezifischen Service
   */
  validateService(serviceName) {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };

    const serviceConfig = this.config[serviceName];
    if (!serviceConfig) {
      validation.errors.push(`Service ${serviceName} nicht gefunden`);
      validation.valid = false;
      return validation;
    }

    // Service-spezifische Validierung
    switch (serviceName) {
      case 'gumroad':
        if (serviceConfig.enabled && !serviceConfig.accessToken) {
          validation.errors.push('Gumroad Access Token fehlt');
          validation.valid = false;
        }
        break;

      case 'openai':
        if (serviceConfig.enabled && !serviceConfig.apiKey) {
          validation.errors.push('OpenAI API Key fehlt');
          validation.valid = false;
        }
        break;

      case 'wordpress':
        if (serviceConfig.enabled) {
          if (!serviceConfig.url) {
            validation.errors.push('WordPress URL fehlt');
            validation.valid = false;
          }
          if (!serviceConfig.username || !serviceConfig.password) {
            validation.errors.push('WordPress Zugangsdaten fehlen');
            validation.valid = false;
          }
        }
        break;
    }

    return validation;
  }
}

export default IntegrationConfig;
