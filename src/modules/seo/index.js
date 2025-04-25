const fs = require('fs-extra');
const path = require('path');
const { findFiles, getRelativePath, i18n } = require('../../utils');

/**
 * SEO Analizi Modülü
 */
module.exports = {
  name: i18n.t('modules.seo.name'),
  description: i18n.t('modules.seo.description'),
  
  /**
   * Analiz işlemini gerçekleştirir
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @param {Object} options - Analiz seçenekleri
   * @returns {Object} - Analiz sonuçları
   */
  async analyze(analyzer, options) {
    // Meta tag kontrolü
    const metaTagResults = await this.checkMetaTags(analyzer);
    
    // Semantik HTML kontrolü
    const semanticHtmlResults = await this.checkSemanticHtml(analyzer);
    
    // Erişilebilirlik kontrolü
    const accessibilityResults = await this.checkAccessibility(analyzer);
    
    return {
      results: {
        metaTags: metaTagResults,
        semanticHtml: semanticHtmlResults,
        accessibility: accessibilityResults
      },
      metadata: {
        totalIssues: 
          metaTagResults.issues.length + 
          semanticHtmlResults.issues.length + 
          accessibilityResults.issues.length,
        metaTagIssues: metaTagResults.issues.length,
        semanticHtmlIssues: semanticHtmlResults.issues.length,
        accessibilityIssues: accessibilityResults.issues.length
      }
    };
  },
  
  /**
   * Meta tag kontrolü yapar
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @returns {Object} - Meta tag sonuçları
   */
  async checkMetaTags(analyzer) {
    const issues = [];
    const pageFiles = [];
    
    // App Router page.js dosyalarını bul
    if (analyzer.appDir) {
      const appFiles = findFiles(analyzer.appDir);
      pageFiles.push(...appFiles.filter(file => 
        path.basename(file) === 'page.js' || 
        path.basename(file) === 'page.tsx' || 
        path.basename(file) === 'layout.js' || 
        path.basename(file) === 'layout.tsx'
      ));
    }
    
    // Pages Router dosyalarını bul
    if (analyzer.pagesDir) {
      const pagesFiles = findFiles(analyzer.pagesDir);
      pageFiles.push(...pagesFiles.filter(file => 
        !path.basename(file).startsWith('_') && 
        !path.basename(file).startsWith('api/') && 
        (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx'))
      ));
    }
    
    // _app.js veya _document.js dosyalarını bul
    if (analyzer.pagesDir) {
      const appFile = path.join(analyzer.pagesDir, '_app.js');
      const appTsFile = path.join(analyzer.pagesDir, '_app.tsx');
      const documentFile = path.join(analyzer.pagesDir, '_document.js');
      const documentTsFile = path.join(analyzer.pagesDir, '_document.tsx');
      
      if (fs.existsSync(appFile)) pageFiles.push(appFile);
      if (fs.existsSync(appTsFile)) pageFiles.push(appTsFile);
      if (fs.existsSync(documentFile)) pageFiles.push(documentFile);
      if (fs.existsSync(documentTsFile)) pageFiles.push(documentTsFile);
    }
    
    // next-seo.config.js dosyasını bul
    const nextSeoConfigFile = path.join(analyzer.projectPath, 'next-seo.config.js');
    if (fs.existsSync(nextSeoConfigFile)) {
      pageFiles.push(nextSeoConfigFile);
    }
    
    // Tüm sayfa dosyalarını kontrol et
    for (const filePath of pageFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = getRelativePath(filePath, analyzer.projectPath);
        
        // Title tag kontrolü
        if (!content.includes('<title') && 
            !content.includes('next-seo') && 
            !content.includes('NextSeo') && 
            !content.includes('Head') && 
            !content.includes('<Head') && 
            !content.includes('useRouter')) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.metaTags.issues.titleMissing'),
            recommendation: i18n.t('modules.seo.metaTags.recommendations.titleTag')
          });
        }
        
        // Meta description kontrolü
        if (!content.includes('description') && 
            !content.includes('next-seo') && 
            !content.includes('NextSeo')) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.metaTags.issues.descriptionMissing'),
            recommendation: i18n.t('modules.seo.metaTags.recommendations.descriptionTag')
          });
        }
        
        // Open Graph meta tag kontrolü
        if (!content.includes('og:') && 
            !content.includes('openGraph') && 
            !content.includes('next-seo') && 
            !content.includes('NextSeo')) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.metaTags.issues.ogMissing'),
            recommendation: i18n.t('modules.seo.metaTags.recommendations.ogTags')
          });
        }
        
        // Twitter Card meta tag kontrolü
        if (!content.includes('twitter:') && 
            !content.includes('twitter') && 
            !content.includes('next-seo') && 
            !content.includes('NextSeo')) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.metaTags.issues.twitterMissing'),
            recommendation: i18n.t('modules.seo.metaTags.recommendations.twitterTags')
          });
        }
        
        // Canonical URL kontrolü
        if (!content.includes('canonical') && 
            !content.includes('next-seo') && 
            !content.includes('NextSeo')) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.metaTags.issues.canonicalMissing'),
            recommendation: i18n.t('modules.seo.metaTags.recommendations.canonicalUrl')
          });
        }
        
        // Robots meta tag kontrolü
        if (content.includes('noindex') || content.includes('nofollow')) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.metaTags.issues.robotsBlocking'),
            recommendation: i18n.t('modules.seo.metaTags.recommendations.robotsTags')
          });
        }
        
        // Viewport meta tag kontrolü
        if (!content.includes('viewport') && 
            !content.includes('next-seo') && 
            !content.includes('NextSeo') && 
            path.basename(filePath) !== 'next-seo.config.js') {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.metaTags.issues.viewportMissing'),
            recommendation: i18n.t('modules.seo.metaTags.recommendations.viewportTag')
          });
        }
        
        // Lang attribute kontrolü
        if (!content.includes('lang=') && 
            !content.includes('locale') && 
            path.basename(filePath) !== 'next-seo.config.js') {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.metaTags.issues.langMissing'),
            recommendation: i18n.t('modules.seo.metaTags.recommendations.langAttribute')
          });
        }
      } catch (error) {
        // Dosya okunamadıysa devam et
        continue;
      }
    }
    
    return {
      issues,
      recommendations: [
        {
          title: i18n.t('modules.seo.metaTags.recommendations.nextSeo.title'),
          description: i18n.t('modules.seo.metaTags.recommendations.nextSeo.description')
        },
        {
          title: i18n.t('modules.seo.metaTags.recommendations.dynamicMetaTags.title'),
          description: i18n.t('modules.seo.metaTags.recommendations.dynamicMetaTags.description')
        },
        {
          title: i18n.t('modules.seo.metaTags.recommendations.structuredData.title'),
          description: i18n.t('modules.seo.metaTags.recommendations.structuredData.description')
        },
        {
          title: i18n.t('modules.seo.metaTags.recommendations.hreflang.title'),
          description: i18n.t('modules.seo.metaTags.recommendations.hreflang.description')
        }
      ]
    };
  },
  
  /**
   * Semantik HTML kontrolü yapar
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @returns {Object} - Semantik HTML sonuçları
   */
  async checkSemanticHtml(analyzer) {
    const issues = [];
    
    // Tüm komponentleri tara
    for (const [filePath, component] of analyzer.components.entries()) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = getRelativePath(filePath, analyzer.projectPath);
        
        // Heading hiyerarşisi kontrolü
        const h1Count = (content.match(/<h1/g) || []).length;
        const hasH2BeforeH1 = content.indexOf('<h2') < content.indexOf('<h1') && content.indexOf('<h1') !== -1 && content.indexOf('<h2') !== -1;
        const hasH3BeforeH2 = content.indexOf('<h3') < content.indexOf('<h2') && content.indexOf('<h2') !== -1 && content.indexOf('<h3') !== -1;
        
        if (h1Count > 1) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.semanticHtml.issues.multipleH1'),
            recommendation: i18n.t('modules.seo.semanticHtml.recommendations.headingHierarchy')
          });
        }
        
        if (hasH2BeforeH1) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.semanticHtml.issues.h2BeforeH1'),
            recommendation: i18n.t('modules.seo.semanticHtml.recommendations.headingHierarchy')
          });
        }
        
        if (hasH3BeforeH2) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.semanticHtml.issues.h3BeforeH2'),
            recommendation: i18n.t('modules.seo.semanticHtml.recommendations.h3AfterH2')
          });
        }
        
        // Semantik tag kontrolü
        const hasSemanticTags = 
          content.includes('<header') || 
          content.includes('<nav') || 
          content.includes('<main') || 
          content.includes('<article') || 
          content.includes('<section') || 
          content.includes('<aside') || 
          content.includes('<footer');
        
        if (!hasSemanticTags && content.includes('<div')) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.semanticHtml.issues.noSemanticTags'),
            recommendation: i18n.t('modules.seo.semanticHtml.recommendations.useSemanticTags')
          });
        }
        
        // Image alt attribute kontrolü
        const imgTags = content.match(/<img[^>]*>/g) || [];
        const imgTagsWithoutAlt = imgTags.filter(tag => !tag.includes('alt='));
        
        if (imgTagsWithoutAlt.length > 0) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.semanticHtml.issues.imgWithoutAlt'),
            recommendation: i18n.t('modules.seo.semanticHtml.recommendations.addAltAttributes')
          });
        }
        
        // Link text kontrolü
        const linkTags = content.match(/<a[^>]*>[^<]*<\/a>/g) || [];
        const genericLinkTexts = linkTags.filter(tag => 
          tag.includes('>here<') || 
          tag.includes('>click<') || 
          tag.includes('>link<') || 
          tag.includes('>read more<') || 
          tag.includes('>more<')
        );
        
        if (genericLinkTexts.length > 0) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.semanticHtml.issues.genericLinkText'),
            recommendation: i18n.t('modules.seo.semanticHtml.recommendations.descriptiveLinkText')
          });
        }
      } catch (error) {
        // Dosya okunamadıysa devam et
        continue;
      }
    }
    
    return {
      issues,
      recommendations: [
        {
          title: i18n.t('modules.seo.semanticHtml.recommendations.semanticHtml.title'),
          description: i18n.t('modules.seo.semanticHtml.recommendations.semanticHtml.description')
        },
        {
          title: i18n.t('modules.seo.semanticHtml.recommendations.headings.title'),
          description: i18n.t('modules.seo.semanticHtml.recommendations.headings.description')
        },
        {
          title: i18n.t('modules.seo.semanticHtml.recommendations.altAttributes.title'),
          description: i18n.t('modules.seo.semanticHtml.recommendations.altAttributes.description')
        },
        {
          title: i18n.t('modules.seo.semanticHtml.recommendations.linkTexts.title'),
          description: i18n.t('modules.seo.semanticHtml.recommendations.linkTexts.description')
        }
      ]
    };
  },
  
  /**
   * Erişilebilirlik kontrolü yapar
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @returns {Object} - Erişilebilirlik sonuçları
   */
  async checkAccessibility(analyzer) {
    const issues = [];
    
    // Tüm komponentleri tara
    for (const [filePath, component] of analyzer.components.entries()) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = getRelativePath(filePath, analyzer.projectPath);
        
        // ARIA attribute kontrolü
        const hasAriaAttributes = content.includes('aria-');
        const hasRoles = content.includes('role=');
        
        if (!hasAriaAttributes && !hasRoles && (content.includes('<button') || content.includes('<input') || content.includes('<select'))) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.accessibility.issues.ariaAttributesMissing'),
            recommendation: i18n.t('modules.seo.accessibility.recommendations.addAriaAttributes')
          });
        }
        
        // Form label kontrolü
        const inputTags = content.match(/<input[^>]*>/g) || [];
        const inputTagsWithoutId = inputTags.filter(tag => !tag.includes('id='));
        const hasFormWithoutLabels = inputTagsWithoutId.length > 0 && !content.includes('<label');
        
        if (hasFormWithoutLabels) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.accessibility.issues.formLabelsMissing'),
            recommendation: i18n.t('modules.seo.accessibility.recommendations.addFormLabels')
          });
        }
        
        // Contrast kontrolü (basit bir kontrol)
        const hasLightColorOnLightBackground = 
          (content.includes('color: #fff') || content.includes('color: white') || content.includes('color: #ffffff')) && 
          (content.includes('background: #f') || content.includes('background-color: #f') || content.includes('bg-white'));
        
        const hasDarkColorOnDarkBackground = 
          (content.includes('color: #000') || content.includes('color: black') || content.includes('color: #333')) && 
          (content.includes('background: #3') || content.includes('background-color: #3') || content.includes('bg-dark'));
        
        if (hasLightColorOnLightBackground || hasDarkColorOnDarkBackground) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.accessibility.issues.lowContrast'),
            recommendation: i18n.t('modules.seo.accessibility.recommendations.improveContrast')
          });
        }
        
        // Keyboard navigation kontrolü
        const hasClickWithoutKeyboard = 
          content.includes('onClick') && 
          !content.includes('onKeyDown') && 
          !content.includes('onKeyPress') && 
          !content.includes('onKeyUp') && 
          !content.includes('<button') && 
          !content.includes('<a');
        
        if (hasClickWithoutKeyboard) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.accessibility.issues.keyboardNavigationMissing'),
            recommendation: i18n.t('modules.seo.accessibility.recommendations.addKeyboardNavigation')
          });
        }
        
        // tabIndex kontrolü
        if (content.includes('tabIndex="-1"') || content.includes('tabindex="-1"')) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.seo.accessibility.issues.negativeTabIndex'),
            recommendation: i18n.t('modules.seo.accessibility.recommendations.avoidNegativeTabIndex')
          });
        }
      } catch (error) {
        // Dosya okunamadıysa devam et
        continue;
      }
    }
    
    return {
      issues,
      recommendations: [
        {
          title: i18n.t('modules.seo.accessibility.recommendations.ariaAttributes.title'),
          description: i18n.t('modules.seo.accessibility.recommendations.ariaAttributes.description')
        },
        {
          title: i18n.t('modules.seo.accessibility.recommendations.formLabels.title'),
          description: i18n.t('modules.seo.accessibility.recommendations.formLabels.description')
        },
        {
          title: i18n.t('modules.seo.accessibility.recommendations.contrast.title'),
          description: i18n.t('modules.seo.accessibility.recommendations.contrast.description')
        },
        {
          title: i18n.t('modules.seo.accessibility.recommendations.keyboardNavigation.title'),
          description: i18n.t('modules.seo.accessibility.recommendations.keyboardNavigation.description')
        },
        {
          title: i18n.t('modules.seo.accessibility.recommendations.accessibilityTests.title'),
          description: i18n.t('modules.seo.accessibility.recommendations.accessibilityTests.description')
        }
      ]
    };
  },
  
  /**
   * Görselleştirme fonksiyonları
   */
  visualize: {
    /**
     * Metin formatında görselleştirme
     * @param {Object} results - Analiz sonuçları
     * @returns {string} - Metin formatında görselleştirme
     */
    text(results) {
      let output = `# ${i18n.t('modules.seo.visualize.title')}\n\n`;
      
      // Özet
      output += `## ${i18n.t('modules.seo.visualize.summary')}\n\n`;
      output += `${i18n.t('modules.seo.visualize.totalIssues', { totalIssues: results.metadata.totalIssues })}\n`;
      output += `- ${i18n.t('modules.seo.visualize.metaTagIssues')}: ${results.metadata.metaTagIssues}\n`;
      output += `- ${i18n.t('modules.seo.visualize.semanticHtmlIssues')}: ${results.metadata.semanticHtmlIssues}\n`;
      output += `- ${i18n.t('modules.seo.visualize.accessibilityIssues')}: ${results.metadata.accessibilityIssues}\n\n`;
      
      // Meta Tag Sorunları
      output += `## ${i18n.t('modules.seo.metaTags.title')}\n\n`;
      
      if (results.results.metaTags.issues.length === 0) {
        output += `${i18n.t('modules.seo.metaTags.noIssues')}\n\n`;
      } else {
        results.results.metaTags.issues.forEach(issue => {
          output += `- **${issue.file}**\n`;
          output += `  - Sorun: ${issue.issue}\n`;
          output += `  - Öneri: ${issue.recommendation}\n\n`;
        });
      }
      
      output += `### ${i18n.t('modules.seo.metaTags.recommendations.title')}\n\n`;
      results.results.metaTags.recommendations.forEach(recommendation => {
        output += `- **${recommendation.title}**\n`;
        output += `  - ${recommendation.description}\n\n`;
      });
      
      // Semantik HTML Sorunları
      output += `## ${i18n.t('modules.seo.semanticHtml.title')}\n\n`;
      
      if (results.results.semanticHtml.issues.length === 0) {
        output += `${i18n.t('modules.seo.semanticHtml.noIssues')}\n\n`;
      } else {
        results.results.semanticHtml.issues.forEach(issue => {
          output += `- **${issue.file}**\n`;
          output += `  - Sorun: ${issue.issue}\n`;
          output += `  - Öneri: ${issue.recommendation}\n\n`;
        });
      }
      
      output += `### ${i18n.t('modules.seo.semanticHtml.recommendations.title')}\n\n`;
      results.results.semanticHtml.recommendations.forEach(recommendation => {
        output += `- **${recommendation.title}**\n`;
        output += `  - ${recommendation.description}\n\n`;
      });
      
      // Erişilebilirlik Sorunları
      output += `## ${i18n.t('modules.seo.accessibility.title')}\n\n`;
      
      if (results.results.accessibility.issues.length === 0) {
        output += `${i18n.t('modules.seo.accessibility.noIssues')}\n\n`;
      } else {
        results.results.accessibility.issues.forEach(issue => {
          output += `- **${issue.file}**\n`;
          output += `  - Sorun: ${issue.issue}\n`;
          output += `  - Öneri: ${issue.recommendation}\n\n`;
        });
      }
      
      output += `### ${i18n.t('modules.seo.accessibility.recommendations.title')}\n\n`;
      results.results.accessibility.recommendations.forEach(recommendation => {
        output += `- **${recommendation.title}**\n`;
        output += `  - ${recommendation.description}\n\n`;
      });
      
      return output;
    },
    
    /**
     * HTML formatında görselleştirme
     * @param {Object} results - Analiz sonuçları
     * @returns {string} - HTML formatında görselleştirme
     */
    html(results) {
      let html = `
<div class="seo-container">
  <h2>${i18n.t('modules.seo.visualize.title')}</h2>
  
  <!-- Özet -->
  <div class="section">
    <h3>${i18n.t('modules.seo.visualize.summary')}</h3>
    <div class="summary">
      <p>${i18n.t('modules.seo.visualize.totalIssues', { totalIssues: `<strong>${results.metadata.totalIssues}</strong>` })}</p>
      <ul class="summary-list">
        <li>${i18n.t('modules.seo.visualize.metaTagIssues')}: ${results.metadata.metaTagIssues}</li>
        <li>${i18n.t('modules.seo.visualize.semanticHtmlIssues')}: ${results.metadata.semanticHtmlIssues}</li>
        <li>${i18n.t('modules.seo.visualize.accessibilityIssues')}: ${results.metadata.accessibilityIssues}</li>
      </ul>
    </div>
  </div>
  
  <!-- Meta Tag Sorunları -->
  <div class="section">
    <h3>${i18n.t('modules.seo.metaTags.title')}</h3>`;
      
      if (results.results.metaTags.issues.length === 0) {
        html += `
    <div class="success-message">
      <p>✅ ${i18n.t('modules.seo.metaTags.noIssues')}</p>
    </div>`;
      } else {
        html += `
    <div class="subsection">
      <h4>${i18n.t('modules.seo.visualize.detectedIssues')}</h4>
      <ul class="issue-list">`;
        
        results.results.metaTags.issues.forEach(issue => {
          html += `
        <li class="issue-item">
          <div class="issue-file">${issue.file}</div>
          <div class="issue-description">${issue.issue}</div>
          <div class="issue-recommendation">${issue.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>
    </div>`;
      }
      
      html += `
    <div class="subsection">
      <h4>${i18n.t('modules.seo.metaTags.recommendations.title')}</h4>
      <ul class="recommendation-list">`;
      
      results.results.metaTags.recommendations.forEach(recommendation => {
        html += `
        <li class="recommendation-item">
          <div class="recommendation-title">${recommendation.title}</div>
          <div class="recommendation-description">${recommendation.description}</div>
        </li>`;
      });
      
      html += `
      </ul>
    </div>
  </div>
  
  <!-- Semantik HTML Sorunları -->
  <div class="section">
    <h3>${i18n.t('modules.seo.semanticHtml.title')}</h3>`;
      
      if (results.results.semanticHtml.issues.length === 0) {
        html += `
    <div class="success-message">
      <p>✅ ${i18n.t('modules.seo.semanticHtml.noIssues')}</p>
    </div>`;
      } else {
        html += `
    <div class="subsection">
      <h4>${i18n.t('modules.seo.visualize.detectedIssues')}</h4>
      <ul class="issue-list">`;
        
        results.results.semanticHtml.issues.forEach(issue => {
          html += `
        <li class="issue-item">
          <div class="issue-file">${issue.file}</div>
          <div class="issue-description">${issue.issue}</div>
          <div class="issue-recommendation">${issue.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>
    </div>`;
      }
      
      html += `
    <div class="subsection">
      <h4>${i18n.t('modules.seo.semanticHtml.recommendations.title')}</h4>
      <ul class="recommendation-list">`;
      
      results.results.semanticHtml.recommendations.forEach(recommendation => {
        html += `
        <li class="recommendation-item">
          <div class="recommendation-title">${recommendation.title}</div>
          <div class="recommendation-description">${recommendation.description}</div>
        </li>`;
      });
      
      html += `
      </ul>
    </div>
  </div>
  
  <!-- Erişilebilirlik Sorunları -->
  <div class="section">
    <h3>${i18n.t('modules.seo.accessibility.title')}</h3>`;
      
      if (results.results.accessibility.issues.length === 0) {
        html += `
    <div class="success-message">
      <p>✅ ${i18n.t('modules.seo.accessibility.noIssues')}</p>
    </div>`;
      } else {
        html += `
    <div class="subsection">
      <h4>${i18n.t('modules.seo.visualize.detectedIssues')}</h4>
      <ul class="issue-list">`;
        
        results.results.accessibility.issues.forEach(issue => {
          html += `
        <li class="issue-item">
          <div class="issue-file">${issue.file}</div>
          <div class="issue-description">${issue.issue}</div>
          <div class="issue-recommendation">${issue.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>
    </div>`;
      }
      
      html += `
    <div class="subsection">
      <h4>${i18n.t('modules.seo.accessibility.recommendations.title')}</h4>
      <ul class="recommendation-list">`;
      
      results.results.accessibility.recommendations.forEach(recommendation => {
        html += `
        <li class="recommendation-item">
          <div class="recommendation-title">${recommendation.title}</div>
          <div class="recommendation-description">${recommendation.description}</div>
        </li>`;
      });
      
      html += `
      </ul>
    </div>
  </div>
</div>`;
      
      return html;
    },
    
    /**
     * JSON formatında görselleştirme
     * @param {Object} results - Analiz sonuçları
     * @returns {string} - JSON formatında görselleştirme
     */
    json(results) {
      return JSON.stringify(results, null, 2);
    }
  }
};
