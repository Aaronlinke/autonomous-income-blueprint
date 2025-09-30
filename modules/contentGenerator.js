/**
 * Content Generator Module
 * Automatisierte Content-Erstellung mit OpenAI und anderen KI-Services
 */

import OpenAI from 'openai';

class ContentGenerator {
  constructor(apiKey, config = {}) {
    this.openai = new OpenAI({
      apiKey: apiKey
    });
    
    this.config = {
      model: config.model || 'gpt-4',
      maxTokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.7,
      ...config
    };
  }

  /**
   * Generiert einen Blog-Artikel basierend auf einer Opportunity
   */
  async generateBlogArticle(opportunity, options = {}) {
    try {
      const {
        targetAudience = 'allgemeine Zielgruppe',
        tone = 'professionell und informativ',
        length = 'mittel (800-1200 Wörter)',
        includeAffiliate = true,
        seoKeywords = []
      } = options;

      const prompt = this.createBlogArticlePrompt(opportunity, {
        targetAudience,
        tone,
        length,
        includeAffiliate,
        seoKeywords
      });

      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'Du bist ein erfahrener Content-Marketing-Experte, der hochwertige, SEO-optimierte Blog-Artikel erstellt, die sowohl informativ als auch verkaufsfördernd sind.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      const content = completion.choices[0].message.content;
      
      // Extrahiere Metadaten aus dem generierten Content
      const metadata = this.extractContentMetadata(content);
      
      return {
        success: true,
        content: {
          title: metadata.title || `${opportunity.title}: Ein umfassender Leitfaden`,
          body: content,
          excerpt: metadata.excerpt || content.substring(0, 200) + '...',
          tags: metadata.tags || [opportunity.category, 'online-business', 'einkommensgenerierung'],
          seoKeywords: seoKeywords,
          wordCount: content.split(' ').length,
          readingTime: Math.ceil(content.split(' ').length / 200), // Durchschnittliche Lesegeschwindigkeit
          category: opportunity.category,
          opportunity_id: opportunity.id
        },
        metadata: {
          generated_at: new Date().toISOString(),
          model_used: this.config.model,
          tokens_used: completion.usage?.total_tokens || 0,
          cost_estimate: this.estimateCost(completion.usage?.total_tokens || 0)
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        content: null
      };
    }
  }

  /**
   * Erstellt einen Prompt für Blog-Artikel-Generierung
   */
  createBlogArticlePrompt(opportunity, options) {
    return `
Erstelle einen hochwertigen, SEO-optimierten Blog-Artikel basierend auf folgender Geschäftsmöglichkeit:

**Opportunity Details:**
- Titel: ${opportunity.title}
- Beschreibung: ${opportunity.description}
- Kategorie: ${opportunity.category}
- Potenzial: €${opportunity.potential_revenue}
- ROI-Schätzung: ${opportunity.roi_estimate}

**Content-Anforderungen:**
- Zielgruppe: ${options.targetAudience}
- Ton: ${options.tone}
- Länge: ${options.length}
- SEO-Keywords: ${options.seoKeywords.join(', ') || 'Nicht spezifiziert'}
- Affiliate-Links einbauen: ${options.includeAffiliate ? 'Ja' : 'Nein'}

**Struktur-Anforderungen:**
1. Beginne mit einem fesselnden Titel (markiert mit "# TITEL:")
2. Erstelle eine kurze Zusammenfassung (markiert mit "## ZUSAMMENFASSUNG:")
3. Gliedere den Artikel in logische Abschnitte mit Überschriften
4. Verwende konkrete Beispiele und Zahlen
5. Integriere Call-to-Actions natürlich in den Text
6. Schließe mit einem motivierenden Fazit ab
7. Füge relevante Tags hinzu (markiert mit "## TAGS:")

**Inhaltliche Anforderungen:**
- Biete echten Mehrwert und praktische Tipps
- Verwende eine natürliche, ansprechende Sprache
- Integriere die SEO-Keywords organisch
- Baue Vertrauen durch Expertise und Authentizität auf
- Motiviere zum Handeln ohne aufdringlich zu sein

${options.includeAffiliate ? 
`**Affiliate-Integration:**
- Erwähne relevante Tools und Services natürlich im Kontext
- Verwende Platzhalter wie [AFFILIATE-LINK-TOOL-NAME] für spätere Link-Integration
- Betone den Nutzen, nicht den Verkauf` : ''}

Erstelle jetzt den vollständigen Artikel:
`;
  }

  /**
   * Generiert Social Media Posts basierend auf einer Opportunity
   */
  async generateSocialMediaPosts(opportunity, platforms = ['twitter', 'linkedin', 'facebook']) {
    try {
      const posts = {};
      
      for (const platform of platforms) {
        const prompt = this.createSocialMediaPrompt(opportunity, platform);
        
        const completion = await this.openai.chat.completions.create({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: `Du bist ein Social Media Marketing-Experte, der ansprechende Posts für ${platform} erstellt, die Engagement fördern und zum Handeln motivieren.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: platform === 'twitter' ? 300 : 800,
          temperature: 0.8 // Etwas kreativer für Social Media
        });

        posts[platform] = {
          content: completion.choices[0].message.content,
          platform: platform,
          hashtags: this.extractHashtags(completion.choices[0].message.content),
          characterCount: completion.choices[0].message.content.length,
          generated_at: new Date().toISOString()
        };
      }
      
      return {
        success: true,
        posts,
        opportunity_id: opportunity.id,
        total_posts: platforms.length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        posts: {}
      };
    }
  }

  /**
   * Erstellt einen Prompt für Social Media Posts
   */
  createSocialMediaPrompt(opportunity, platform) {
    const platformSpecs = {
      twitter: {
        limit: '280 Zeichen',
        style: 'kurz, prägnant, mit relevanten Hashtags',
        features: 'Nutze Emojis und max. 3 Hashtags'
      },
      linkedin: {
        limit: '1300 Zeichen optimal',
        style: 'professionell, wertvoll, business-orientiert',
        features: 'Nutze professionelle Sprache und relevante Hashtags'
      },
      facebook: {
        limit: '500 Zeichen optimal',
        style: 'persönlich, storytelling, community-orientiert',
        features: 'Nutze eine persönliche Ansprache und stelle Fragen'
      }
    };

    const spec = platformSpecs[platform] || platformSpecs.facebook;

    return `
Erstelle einen ansprechenden ${platform.toUpperCase()} Post basierend auf dieser Geschäftsmöglichkeit:

**Opportunity:**
- Titel: ${opportunity.title}
- Beschreibung: ${opportunity.description}
- Kategorie: ${opportunity.category}
- Potenzial: €${opportunity.potential_revenue}

**${platform.toUpperCase()} Spezifikationen:**
- Zeichenlimit: ${spec.limit}
- Stil: ${spec.style}
- Besonderheiten: ${spec.features}

**Anforderungen:**
1. Beginne mit einem Hook, der Aufmerksamkeit erregt
2. Biete einen klaren Mehrwert oder Einblick
3. Verwende eine natürliche, authentische Sprache
4. Integriere einen subtilen Call-to-Action
5. Nutze relevante Hashtags (aber nicht zu viele)
6. Halte dich an das Zeichenlimit

Erstelle jetzt den Post:
`;
  }

  /**
   * Generiert Produktbeschreibungen für digitale Produkte
   */
  async generateProductDescription(opportunity, productDetails = {}) {
    try {
      const {
        productType = 'digitales Produkt',
        price = opportunity.potential_revenue / 10, // Schätzung
        features = [],
        benefits = [],
        targetCustomer = 'Online-Unternehmer'
      } = productDetails;

      const prompt = `
Erstelle eine überzeugende Produktbeschreibung für ein digitales Produkt basierend auf dieser Geschäftsmöglichkeit:

**Opportunity Details:**
- Titel: ${opportunity.title}
- Beschreibung: ${opportunity.description}
- Kategorie: ${opportunity.category}

**Produkt Details:**
- Typ: ${productType}
- Geschätzter Preis: €${price}
- Zielkunde: ${targetCustomer}
- Features: ${features.join(', ') || 'Zu definieren'}
- Benefits: ${benefits.join(', ') || 'Zu definieren'}

**Anforderungen:**
1. Erstelle eine fesselnde Headline
2. Beschreibe das Problem, das das Produkt löst
3. Erkläre die Lösung und den Nutzen
4. Liste konkrete Features und Benefits auf
5. Integriere Social Proof Elemente
6. Schließe mit einem starken Call-to-Action ab
7. Verwende überzeugende, aber ehrliche Sprache

Struktur:
- HEADLINE: [Überzeugende Produktüberschrift]
- PROBLEM: [Problembeschreibung]
- LÖSUNG: [Lösungsansatz]
- FEATURES: [Konkrete Features]
- BENEFITS: [Nutzen für den Kunden]
- SOCIAL PROOF: [Vertrauenselemente]
- CALL-TO-ACTION: [Handlungsaufforderung]

Erstelle jetzt die vollständige Produktbeschreibung:
`;

      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'Du bist ein erfahrener Copywriter, der überzeugende Produktbeschreibungen erstellt, die Vertrauen aufbauen und zum Kauf motivieren.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: 0.7
      });

      const content = completion.choices[0].message.content;
      const sections = this.parseProductDescription(content);
      
      return {
        success: true,
        description: {
          full_text: content,
          sections: sections,
          word_count: content.split(' ').length,
          estimated_price: price,
          product_type: productType,
          opportunity_id: opportunity.id
        },
        metadata: {
          generated_at: new Date().toISOString(),
          model_used: this.config.model,
          tokens_used: completion.usage?.total_tokens || 0
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        description: null
      };
    }
  }

  /**
   * Generiert E-Mail-Marketing-Sequenzen
   */
  async generateEmailSequence(opportunity, sequenceType = 'welcome', emailCount = 5) {
    try {
      const emails = [];
      
      for (let i = 1; i <= emailCount; i++) {
        const prompt = this.createEmailPrompt(opportunity, sequenceType, i, emailCount);
        
        const completion = await this.openai.chat.completions.create({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'Du bist ein E-Mail-Marketing-Experte, der ansprechende E-Mail-Sequenzen erstellt, die Vertrauen aufbauen und Conversions fördern.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        });

        const content = completion.choices[0].message.content;
        const emailData = this.parseEmail(content);
        
        emails.push({
          sequence_number: i,
          subject: emailData.subject || `Email ${i}: ${opportunity.title}`,
          body: emailData.body || content,
          send_delay_days: this.calculateSendDelay(sequenceType, i),
          call_to_action: emailData.cta || 'Mehr erfahren',
          generated_at: new Date().toISOString()
        });
      }
      
      return {
        success: true,
        sequence: {
          type: sequenceType,
          opportunity_id: opportunity.id,
          total_emails: emailCount,
          emails: emails
        },
        metadata: {
          generated_at: new Date().toISOString(),
          total_tokens_used: emails.length * 500 // Schätzung
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        sequence: null
      };
    }
  }

  /**
   * Erstellt einen E-Mail-Prompt
   */
  createEmailPrompt(opportunity, sequenceType, emailNumber, totalEmails) {
    const sequenceGoals = {
      welcome: 'Neue Abonnenten begrüßen und Vertrauen aufbauen',
      nurture: 'Leads pflegen und zum Kauf führen',
      onboarding: 'Kunden beim Start unterstützen',
      reactivation: 'Inaktive Abonnenten reaktivieren'
    };

    return `
Erstelle E-Mail ${emailNumber} von ${totalEmails} für eine ${sequenceType}-Sequenz basierend auf dieser Opportunity:

**Opportunity:**
- Titel: ${opportunity.title}
- Beschreibung: ${opportunity.description}
- Kategorie: ${opportunity.category}

**Sequenz-Ziel:** ${sequenceGoals[sequenceType] || 'Engagement fördern'}
**E-Mail Position:** ${emailNumber} von ${totalEmails}

**Anforderungen:**
1. Erstelle eine ansprechende Betreffzeile (markiert mit "BETREFF:")
2. Beginne mit einer persönlichen Anrede
3. Biete wertvollen Inhalt passend zur Sequenz-Position
4. Verwende eine natürliche, authentische Sprache
5. Integriere einen klaren Call-to-Action (markiert mit "CTA:")
6. Halte die E-Mail fokussiert und nicht zu lang

**Sequenz-spezifische Hinweise:**
${this.getSequenceSpecificGuidelines(sequenceType, emailNumber, totalEmails)}

Erstelle jetzt die vollständige E-Mail:
`;
  }

  /**
   * Hilfsmethoden
   */
  
  extractContentMetadata(content) {
    const titleMatch = content.match(/# TITEL:\s*(.+)/);
    const excerptMatch = content.match(/## ZUSAMMENFASSUNG:\s*(.+)/);
    const tagsMatch = content.match(/## TAGS:\s*(.+)/);
    
    return {
      title: titleMatch ? titleMatch[1].trim() : null,
      excerpt: excerptMatch ? excerptMatch[1].trim() : null,
      tags: tagsMatch ? tagsMatch[1].split(',').map(tag => tag.trim()) : []
    };
  }

  extractHashtags(content) {
    const hashtagRegex = /#[\w]+/g;
    return content.match(hashtagRegex) || [];
  }

  parseProductDescription(content) {
    const sections = {};
    const sectionRegex = /(\w+):\s*(.+?)(?=\n\w+:|$)/gs;
    let match;
    
    while ((match = sectionRegex.exec(content)) !== null) {
      sections[match[1].toLowerCase()] = match[2].trim();
    }
    
    return sections;
  }

  parseEmail(content) {
    const subjectMatch = content.match(/BETREFF:\s*(.+)/);
    const ctaMatch = content.match(/CTA:\s*(.+)/);
    
    // Entferne Metadaten aus dem Body
    const body = content
      .replace(/BETREFF:\s*.+\n?/, '')
      .replace(/CTA:\s*.+\n?/, '')
      .trim();
    
    return {
      subject: subjectMatch ? subjectMatch[1].trim() : null,
      cta: ctaMatch ? ctaMatch[1].trim() : null,
      body: body
    };
  }

  calculateSendDelay(sequenceType, emailNumber) {
    const delays = {
      welcome: [0, 1, 3, 7, 14], // Sofort, dann 1, 3, 7, 14 Tage
      nurture: [0, 2, 5, 10, 20], // Längere Abstände für Nurturing
      onboarding: [0, 1, 2, 5, 10], // Schnellere Folge für Onboarding
      reactivation: [0, 3, 7, 14, 30] // Geduldige Reaktivierung
    };
    
    return delays[sequenceType] ? delays[sequenceType][emailNumber - 1] || 0 : emailNumber - 1;
  }

  getSequenceSpecificGuidelines(sequenceType, emailNumber, totalEmails) {
    const guidelines = {
      welcome: {
        1: 'Herzlich willkommen heißen, Erwartungen setzen',
        2: 'Ersten Mehrwert liefern, Vertrauen aufbauen',
        3: 'Erfolgsgeschichten teilen, Community vorstellen',
        4: 'Tieferen Einblick geben, Expertise zeigen',
        5: 'Zum nächsten Schritt einladen, Beziehung festigen'
      },
      nurture: {
        1: 'Problem identifizieren und verstehen',
        2: 'Lösungsansätze aufzeigen, Optionen präsentieren',
        3: 'Detaillierte Lösung vorstellen, Nutzen betonen',
        4: 'Einwände ausräumen, Vertrauen stärken',
        5: 'Zum Kauf einladen, Dringlichkeit schaffen'
      }
    };
    
    return guidelines[sequenceType] ? 
      guidelines[sequenceType][emailNumber] || 'Wertvollen Inhalt liefern und Beziehung stärken' :
      'Wertvollen Inhalt liefern und Beziehung stärken';
  }

  estimateCost(tokens) {
    // Grobe Kostenschätzung basierend auf OpenAI Preisen (Stand 2024)
    const costPerToken = 0.00003; // $0.03 per 1K tokens für GPT-4
    return (tokens * costPerToken).toFixed(4);
  }

  /**
   * Batch-Content-Generierung für mehrere Opportunities
   */
  async generateBatchContent(opportunities, contentTypes = ['blog', 'social', 'email']) {
    const results = {
      success: true,
      generated_content: {},
      errors: [],
      summary: {
        total_opportunities: opportunities.length,
        total_content_pieces: 0,
        estimated_cost: 0
      }
    };

    for (const opportunity of opportunities) {
      results.generated_content[opportunity.id] = {};
      
      try {
        // Blog-Artikel generieren
        if (contentTypes.includes('blog')) {
          const blogResult = await this.generateBlogArticle(opportunity);
          if (blogResult.success) {
            results.generated_content[opportunity.id].blog = blogResult.content;
            results.summary.total_content_pieces++;
            results.summary.estimated_cost += parseFloat(blogResult.metadata.cost_estimate);
          } else {
            results.errors.push(`Blog-Artikel für Opportunity ${opportunity.id}: ${blogResult.error}`);
          }
        }

        // Social Media Posts generieren
        if (contentTypes.includes('social')) {
          const socialResult = await this.generateSocialMediaPosts(opportunity);
          if (socialResult.success) {
            results.generated_content[opportunity.id].social = socialResult.posts;
            results.summary.total_content_pieces += socialResult.total_posts;
          } else {
            results.errors.push(`Social Media für Opportunity ${opportunity.id}: ${socialResult.error}`);
          }
        }

        // E-Mail-Sequenz generieren
        if (contentTypes.includes('email')) {
          const emailResult = await this.generateEmailSequence(opportunity, 'nurture', 3);
          if (emailResult.success) {
            results.generated_content[opportunity.id].email = emailResult.sequence;
            results.summary.total_content_pieces += emailResult.sequence.total_emails;
          } else {
            results.errors.push(`E-Mail-Sequenz für Opportunity ${opportunity.id}: ${emailResult.error}`);
          }
        }

        // Kleine Pause zwischen den Opportunities um Rate Limits zu vermeiden
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.errors.push(`Opportunity ${opportunity.id}: ${error.message}`);
        results.success = false;
      }
    }

    return results;
  }
}

export default ContentGenerator;
