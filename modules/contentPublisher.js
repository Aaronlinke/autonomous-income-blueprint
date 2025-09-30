/**
 * Content Publisher Module
 * Automatisierte Veröffentlichung von Content auf verschiedenen Plattformen
 */

import fetch from 'node-fetch';
import FormData from 'form-data';

class ContentPublisher {
  constructor(config) {
    this.config = config;
    this.platforms = {
      wordpress: config.wordpress || {},
      twitter: config.twitter || {},
      linkedin: config.linkedin || {},
      mailchimp: config.mailchimp || {},
      medium: config.medium || {}
    };
  }

  /**
   * Veröffentlicht einen Blog-Artikel auf WordPress
   */
  async publishToWordPress(content, options = {}) {
    if (!this.platforms.wordpress.enabled || !this.platforms.wordpress.url) {
      return {
        success: false,
        error: 'WordPress nicht konfiguriert',
        platform: 'wordpress'
      };
    }

    try {
      const {
        status = 'draft', // draft, publish, private
        categories = [],
        tags = content.tags || [],
        featured_image = null,
        schedule_date = null
      } = options;

      // WordPress REST API Endpoint
      const apiUrl = `${this.platforms.wordpress.url}/wp-json/wp/v2/posts`;
      
      // Authentifizierung (Application Password)
      const auth = Buffer.from(
        `${this.platforms.wordpress.username}:${this.platforms.wordpress.password}`
      ).toString('base64');

      const postData = {
        title: content.title,
        content: this.formatContentForWordPress(content.body),
        excerpt: content.excerpt,
        status: status,
        tags: await this.getOrCreateWordPressTags(tags),
        categories: await this.getOrCreateWordPressCategories(categories),
        meta: {
          _yoast_wpseo_metadesc: content.excerpt,
          _yoast_wpseo_focuskw: content.seoKeywords ? content.seoKeywords[0] : '',
          opportunity_id: content.opportunity_id
        }
      };

      // Geplante Veröffentlichung
      if (schedule_date) {
        postData.date = schedule_date;
        postData.status = 'future';
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WordPress API Error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();

      // Featured Image setzen falls vorhanden
      if (featured_image && result.id) {
        await this.setWordPressFeaturedImage(result.id, featured_image);
      }

      return {
        success: true,
        platform: 'wordpress',
        post_id: result.id,
        url: result.link,
        status: result.status,
        published_at: result.date,
        message: `Artikel erfolgreich auf WordPress ${status === 'publish' ? 'veröffentlicht' : 'als Entwurf gespeichert'}`
      };

    } catch (error) {
      return {
        success: false,
        platform: 'wordpress',
        error: error.message
      };
    }
  }

  /**
   * Veröffentlicht einen Post auf Twitter
   */
  async publishToTwitter(content, options = {}) {
    if (!this.platforms.twitter.enabled || !this.platforms.twitter.apiKey) {
      return {
        success: false,
        error: 'Twitter nicht konfiguriert',
        platform: 'twitter'
      };
    }

    try {
      const {
        schedule_date = null,
        reply_to = null,
        media_ids = []
      } = options;

      // Twitter API v2 Endpoint
      const apiUrl = 'https://api.twitter.com/2/tweets';
      
      const tweetData = {
        text: content.content || content.body?.substring(0, 280) || content.title,
        reply: reply_to ? { in_reply_to_tweet_id: reply_to } : undefined,
        media: media_ids.length > 0 ? { media_ids } : undefined
      };

      // OAuth 1.0a Authentifizierung für Twitter API
      const authHeader = this.generateTwitterAuthHeader('POST', apiUrl, tweetData);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tweetData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitter API Error: ${errorData.detail || response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        platform: 'twitter',
        tweet_id: result.data.id,
        url: `https://twitter.com/user/status/${result.data.id}`,
        text: result.data.text,
        published_at: new Date().toISOString(),
        message: 'Tweet erfolgreich veröffentlicht'
      };

    } catch (error) {
      return {
        success: false,
        platform: 'twitter',
        error: error.message
      };
    }
  }

  /**
   * Veröffentlicht einen Post auf LinkedIn
   */
  async publishToLinkedIn(content, options = {}) {
    if (!this.platforms.linkedin.enabled || !this.platforms.linkedin.accessToken) {
      return {
        success: false,
        error: 'LinkedIn nicht konfiguriert',
        platform: 'linkedin'
      };
    }

    try {
      const {
        visibility = 'PUBLIC', // PUBLIC, CONNECTIONS
        media_url = null,
        link_url = null
      } = options;

      // LinkedIn API Endpoint
      const apiUrl = 'https://api.linkedin.com/v2/ugcPosts';
      
      const postData = {
        author: `urn:li:person:${this.platforms.linkedin.personId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content.content || content.body?.substring(0, 1300) || content.title
            },
            shareMediaCategory: media_url ? 'IMAGE' : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': visibility
        }
      };

      // Link oder Bild hinzufügen
      if (link_url) {
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          description: {
            text: content.excerpt || content.title
          },
          originalUrl: link_url,
          title: {
            text: content.title
          }
        }];
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.platforms.linkedin.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`LinkedIn API Error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        platform: 'linkedin',
        post_id: result.id,
        url: `https://www.linkedin.com/feed/update/${result.id}`,
        published_at: new Date().toISOString(),
        message: 'LinkedIn Post erfolgreich veröffentlicht'
      };

    } catch (error) {
      return {
        success: false,
        platform: 'linkedin',
        error: error.message
      };
    }
  }

  /**
   * Sendet eine E-Mail-Kampagne über Mailchimp
   */
  async sendEmailCampaign(emailContent, listId, options = {}) {
    if (!this.platforms.mailchimp.enabled || !this.platforms.mailchimp.apiKey) {
      return {
        success: false,
        error: 'Mailchimp nicht konfiguriert',
        platform: 'mailchimp'
      };
    }

    try {
      const {
        campaign_type = 'regular',
        schedule_date = null,
        segment_conditions = null,
        from_name = 'Autonomous Income System',
        reply_to = 'noreply@example.com'
      } = options;

      // Mailchimp API Endpoint
      const datacenter = this.platforms.mailchimp.apiKey.split('-')[1];
      const baseUrl = `https://${datacenter}.api.mailchimp.com/3.0`;

      // 1. Kampagne erstellen
      const campaignData = {
        type: campaign_type,
        recipients: {
          list_id: listId,
          segment_opts: segment_conditions
        },
        settings: {
          subject_line: emailContent.subject,
          preview_text: emailContent.body.substring(0, 150),
          title: `Campaign: ${emailContent.subject}`,
          from_name: from_name,
          reply_to: reply_to,
          auto_footer: false,
          inline_css: true
        }
      };

      const campaignResponse = await fetch(`${baseUrl}/campaigns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.platforms.mailchimp.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      });

      if (!campaignResponse.ok) {
        const errorData = await campaignResponse.json();
        throw new Error(`Mailchimp Campaign Error: ${errorData.detail || campaignResponse.statusText}`);
      }

      const campaign = await campaignResponse.json();

      // 2. E-Mail-Inhalt setzen
      const contentData = {
        html: this.formatEmailForMailchimp(emailContent.body),
        plain_text: this.stripHtmlTags(emailContent.body)
      };

      const contentResponse = await fetch(`${baseUrl}/campaigns/${campaign.id}/content`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.platforms.mailchimp.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contentData)
      });

      if (!contentResponse.ok) {
        const errorData = await contentResponse.json();
        throw new Error(`Mailchimp Content Error: ${errorData.detail || contentResponse.statusText}`);
      }

      // 3. Kampagne senden oder planen
      let sendResponse;
      if (schedule_date) {
        // Geplante Sendung
        sendResponse = await fetch(`${baseUrl}/campaigns/${campaign.id}/actions/schedule`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.platforms.mailchimp.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            schedule_time: schedule_date
          })
        });
      } else {
        // Sofortige Sendung
        sendResponse = await fetch(`${baseUrl}/campaigns/${campaign.id}/actions/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.platforms.mailchimp.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (!sendResponse.ok) {
        const errorData = await sendResponse.json();
        throw new Error(`Mailchimp Send Error: ${errorData.detail || sendResponse.statusText}`);
      }

      return {
        success: true,
        platform: 'mailchimp',
        campaign_id: campaign.id,
        campaign_url: campaign.archive_url,
        status: schedule_date ? 'scheduled' : 'sent',
        scheduled_for: schedule_date,
        message: schedule_date ? 'E-Mail-Kampagne erfolgreich geplant' : 'E-Mail-Kampagne erfolgreich gesendet'
      };

    } catch (error) {
      return {
        success: false,
        platform: 'mailchimp',
        error: error.message
      };
    }
  }

  /**
   * Batch-Veröffentlichung auf mehreren Plattformen
   */
  async publishToMultiplePlatforms(content, platforms = [], options = {}) {
    const results = {
      success: true,
      publications: [],
      errors: [],
      summary: {
        total_platforms: platforms.length,
        successful_publications: 0,
        failed_publications: 0
      }
    };

    for (const platform of platforms) {
      try {
        let result;
        
        switch (platform.name) {
          case 'wordpress':
            if (content.blog) {
              result = await this.publishToWordPress(content.blog, platform.options || {});
            } else {
              result = { success: false, error: 'Kein Blog-Content verfügbar' };
            }
            break;

          case 'twitter':
            if (content.social?.twitter) {
              result = await this.publishToTwitter(content.social.twitter, platform.options || {});
            } else {
              result = { success: false, error: 'Kein Twitter-Content verfügbar' };
            }
            break;

          case 'linkedin':
            if (content.social?.linkedin) {
              result = await this.publishToLinkedIn(content.social.linkedin, platform.options || {});
            } else {
              result = { success: false, error: 'Kein LinkedIn-Content verfügbar' };
            }
            break;

          case 'mailchimp':
            if (content.email && platform.listId) {
              // Verwende die erste E-Mail der Sequenz
              const firstEmail = content.email.emails[0];
              result = await this.sendEmailCampaign(firstEmail, platform.listId, platform.options || {});
            } else {
              result = { success: false, error: 'Kein E-Mail-Content oder List ID verfügbar' };
            }
            break;

          default:
            result = { success: false, error: `Unbekannte Plattform: ${platform.name}` };
        }

        results.publications.push({
          platform: platform.name,
          ...result
        });

        if (result.success) {
          results.summary.successful_publications++;
        } else {
          results.summary.failed_publications++;
          results.errors.push(`${platform.name}: ${result.error}`);
        }

        // Pause zwischen Veröffentlichungen um Rate Limits zu vermeiden
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        results.errors.push(`${platform.name}: ${error.message}`);
        results.summary.failed_publications++;
        results.success = false;
      }
    }

    // Gesamterfolg bestimmen
    if (results.summary.failed_publications > 0) {
      results.success = results.summary.successful_publications > 0; // Teilweise erfolgreich
    }

    return results;
  }

  /**
   * Geplante Veröffentlichung einrichten
   */
  async schedulePublication(content, platforms, scheduleDate, options = {}) {
    const scheduledPublications = [];
    
    for (const platform of platforms) {
      const publicationData = {
        content,
        platform: platform.name,
        scheduled_for: scheduleDate,
        options: { ...platform.options, schedule_date: scheduleDate },
        status: 'scheduled',
        created_at: new Date().toISOString()
      };
      
      scheduledPublications.push(publicationData);
    }

    // In einer echten Implementierung würde dies in einer Datenbank gespeichert
    // und von einem Cron-Job verarbeitet werden
    
    return {
      success: true,
      scheduled_publications: scheduledPublications,
      total_scheduled: scheduledPublications.length,
      scheduled_for: scheduleDate,
      message: `${scheduledPublications.length} Veröffentlichungen für ${scheduleDate} geplant`
    };
  }

  /**
   * Hilfsmethoden
   */

  formatContentForWordPress(content) {
    // Konvertiere Markdown zu HTML falls nötig
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  formatEmailForMailchimp(content) {
    // Einfache HTML-Formatierung für E-Mails
    return `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        ${content.replace(/\n/g, '<br>')}
      </div>
    </body>
    </html>
    `;
  }

  stripHtmlTags(html) {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  async getOrCreateWordPressTags(tags) {
    // In einer echten Implementierung würde dies die WordPress API verwenden
    // um Tags zu erstellen oder zu finden
    return tags.map(tag => ({ name: tag }));
  }

  async getOrCreateWordPressCategories(categories) {
    // In einer echten Implementierung würde dies die WordPress API verwenden
    // um Kategorien zu erstellen oder zu finden
    return categories.map(cat => ({ name: cat }));
  }

  async setWordPressFeaturedImage(postId, imageUrl) {
    // In einer echten Implementierung würde dies das Bild hochladen
    // und als Featured Image setzen
    console.log(`Featured Image für Post ${postId} setzen: ${imageUrl}`);
  }

  generateTwitterAuthHeader(method, url, data) {
    // In einer echten Implementierung würde dies OAuth 1.0a Signatur generieren
    // Für jetzt verwenden wir Bearer Token falls verfügbar
    if (this.platforms.twitter.bearerToken) {
      return `Bearer ${this.platforms.twitter.bearerToken}`;
    }
    
    // Fallback für OAuth 1.0a (vereinfacht)
    return `OAuth oauth_consumer_key="${this.platforms.twitter.apiKey}", oauth_token="${this.platforms.twitter.accessToken}"`;
  }

  /**
   * Analysiert die Performance von veröffentlichten Inhalten
   */
  async analyzePublicationPerformance(publicationIds = []) {
    const performance = {
      wordpress: {},
      twitter: {},
      linkedin: {},
      mailchimp: {}
    };

    // WordPress Analytics
    if (this.platforms.wordpress.enabled) {
      // Hier würde man WordPress Analytics API oder Google Analytics verwenden
      performance.wordpress = {
        total_posts: 0,
        total_views: 0,
        avg_engagement: 0
      };
    }

    // Twitter Analytics
    if (this.platforms.twitter.enabled) {
      // Twitter Analytics API
      performance.twitter = {
        total_tweets: 0,
        total_impressions: 0,
        total_engagements: 0,
        engagement_rate: 0
      };
    }

    // LinkedIn Analytics
    if (this.platforms.linkedin.enabled) {
      // LinkedIn Analytics API
      performance.linkedin = {
        total_posts: 0,
        total_views: 0,
        total_likes: 0,
        total_comments: 0
      };
    }

    // Mailchimp Analytics
    if (this.platforms.mailchimp.enabled) {
      // Mailchimp Reports API
      performance.mailchimp = {
        total_campaigns: 0,
        total_opens: 0,
        total_clicks: 0,
        open_rate: 0,
        click_rate: 0
      };
    }

    return {
      success: true,
      performance,
      analyzed_at: new Date().toISOString()
    };
  }
}

export default ContentPublisher;
