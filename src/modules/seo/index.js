const fs = require('fs-extra');
const path = require('path');
const { findFiles, getRelativePath } = require('../../utils');

/**
 * SEO Analizi Modülü
 */
module.exports = {
  name: 'seo',
  description: 'Next.js projelerinde SEO analizi yapar',
  
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
            issue: 'Title tag eksik',
            recommendation: 'Sayfaya title tag ekleyin. Bu, SEO için çok önemlidir.'
          });
        }
        
        // Meta description kontrolü
        if (!content.includes('description') && 
            !content.includes('next-seo') && 
            !content.includes('NextSeo')) {
          issues.push({
            file: relativePath,
            issue: 'Meta description eksik',
            recommendation: 'Sayfaya meta description ekleyin. Bu, arama sonuçlarında görüntülenen açıklamadır.'
          });
        }
        
        // Open Graph meta tag kontrolü
        if (!content.includes('og:') && 
            !content.includes('openGraph') && 
            !content.includes('next-seo') && 
            !content.includes('NextSeo')) {
          issues.push({
            file: relativePath,
            issue: 'Open Graph meta tag\'leri eksik',
            recommendation: 'Sosyal medya paylaşımları için Open Graph meta tag\'leri ekleyin.'
          });
        }
        
        // Twitter Card meta tag kontrolü
        if (!content.includes('twitter:') && 
            !content.includes('twitter') && 
            !content.includes('next-seo') && 
            !content.includes('NextSeo')) {
          issues.push({
            file: relativePath,
            issue: 'Twitter Card meta tag\'leri eksik',
            recommendation: 'Twitter paylaşımları için Twitter Card meta tag\'leri ekleyin.'
          });
        }
        
        // Canonical URL kontrolü
        if (!content.includes('canonical') && 
            !content.includes('next-seo') && 
            !content.includes('NextSeo')) {
          issues.push({
            file: relativePath,
            issue: 'Canonical URL eksik',
            recommendation: 'Duplicate content sorunlarını önlemek için canonical URL ekleyin.'
          });
        }
        
        // Robots meta tag kontrolü
        if (content.includes('noindex') || content.includes('nofollow')) {
          issues.push({
            file: relativePath,
            issue: 'Robots meta tag\'i sayfanın indekslenmesini engelliyor',
            recommendation: 'Eğer bu sayfa indekslenmeli ise, noindex ve nofollow değerlerini kaldırın.'
          });
        }
        
        // Viewport meta tag kontrolü
        if (!content.includes('viewport') && 
            !content.includes('next-seo') && 
            !content.includes('NextSeo') && 
            path.basename(filePath) !== 'next-seo.config.js') {
          issues.push({
            file: relativePath,
            issue: 'Viewport meta tag eksik',
            recommendation: 'Mobil uyumluluk için viewport meta tag ekleyin.'
          });
        }
        
        // Lang attribute kontrolü
        if (!content.includes('lang=') && 
            !content.includes('locale') && 
            path.basename(filePath) !== 'next-seo.config.js') {
          issues.push({
            file: relativePath,
            issue: 'HTML lang attribute eksik',
            recommendation: 'Erişilebilirlik ve SEO için HTML lang attribute ekleyin.'
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
          title: 'next-seo Kullanımı',
          description: 'next-seo paketi, Next.js projelerinde SEO yönetimini kolaylaştırır. Bu paketi kullanarak, tüm meta tag\'leri merkezi bir şekilde yönetebilirsiniz.'
        },
        {
          title: 'Dinamik Meta Tag\'ler',
          description: 'Dinamik içerikli sayfalar için, sayfa içeriğine göre dinamik meta tag\'ler oluşturun. Bu, arama motorlarının sayfanızı daha iyi anlamasını sağlar.'
        },
        {
          title: 'Structured Data',
          description: 'JSON-LD formatında structured data ekleyin. Bu, arama sonuçlarında zengin snippet\'ler görüntülenmesini sağlar.'
        },
        {
          title: 'Hreflang Tag\'leri',
          description: 'Çok dilli siteler için hreflang tag\'leri ekleyin. Bu, arama motorlarının doğru dildeki sayfayı göstermesini sağlar.'
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
            issue: 'Birden fazla H1 tag\'i kullanılmış',
            recommendation: 'Her sayfada sadece bir H1 tag\'i kullanın. Bu, sayfa yapısını daha iyi tanımlar.'
          });
        }
        
        if (hasH2BeforeH1) {
          issues.push({
            file: relativePath,
            issue: 'H2 tag\'i H1\'den önce kullanılmış',
            recommendation: 'Heading hiyerarşisini düzgün kullanın. H1 tag\'i sayfanın en üstünde olmalıdır.'
          });
        }
        
        if (hasH3BeforeH2) {
          issues.push({
            file: relativePath,
            issue: 'H3 tag\'i H2\'den önce kullanılmış',
            recommendation: 'Heading hiyerarşisini düzgün kullanın. H3 tag\'leri H2\'lerden sonra gelmelidir.'
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
            issue: 'Semantik HTML tag\'leri kullanılmamış',
            recommendation: 'div ve span yerine semantik HTML5 tag\'lerini (header, nav, main, article, section, aside, footer) kullanın.'
          });
        }
        
        // Image alt attribute kontrolü
        const imgTags = content.match(/<img[^>]*>/g) || [];
        const imgTagsWithoutAlt = imgTags.filter(tag => !tag.includes('alt='));
        
        if (imgTagsWithoutAlt.length > 0) {
          issues.push({
            file: relativePath,
            issue: 'Image tag\'lerinde alt attribute eksik',
            recommendation: 'Tüm image tag\'lerine alt attribute ekleyin. Bu, erişilebilirlik ve SEO için önemlidir.'
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
            issue: 'Jenerik link text\'leri kullanılmış',
            recommendation: '"here", "click", "link", "read more" gibi jenerik link text\'leri yerine, daha açıklayıcı link text\'leri kullanın.'
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
          title: 'Semantik HTML Kullanımı',
          description: 'Semantik HTML tag\'leri, sayfanızın yapısını daha iyi tanımlar ve arama motorlarının içeriğinizi daha iyi anlamasını sağlar.'
        },
        {
          title: 'Heading Hiyerarşisi',
          description: 'Düzgün bir heading hiyerarşisi kullanın. Her sayfada bir H1 tag\'i olmalı ve diğer heading\'ler hiyerarşik olarak sıralanmalıdır.'
        },
        {
          title: 'Alt Attribute',
          description: 'Tüm image tag\'lerine alt attribute ekleyin. Bu, görsel içeriğin metin alternatifini sağlar ve erişilebilirlik için önemlidir.'
        },
        {
          title: 'Açıklayıcı Link Text\'leri',
          description: 'Link text\'leri, link\'in nereye gittiğini açıkça belirtmelidir. "here", "click" gibi jenerik text\'ler yerine, daha açıklayıcı text\'ler kullanın.'
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
            issue: 'ARIA attribute\'leri eksik',
            recommendation: 'Erişilebilirlik için ARIA attribute\'leri ve role\'ler ekleyin.'
          });
        }
        
        // Form label kontrolü
        const inputTags = content.match(/<input[^>]*>/g) || [];
        const inputTagsWithoutId = inputTags.filter(tag => !tag.includes('id='));
        const hasFormWithoutLabels = inputTagsWithoutId.length > 0 && !content.includes('<label');
        
        if (hasFormWithoutLabels) {
          issues.push({
            file: relativePath,
            issue: 'Form input\'ları için label eksik',
            recommendation: 'Tüm form input\'ları için label ekleyin ve for attribute ile input\'a bağlayın.'
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
            issue: 'Düşük kontrast oranı',
            recommendation: 'Metin ve arka plan arasında yeterli kontrast oranı sağlayın. WCAG 2.1 AA standardına göre, normal metin için en az 4.5:1, büyük metin için en az 3:1 kontrast oranı olmalıdır.'
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
            issue: 'Klavye navigasyonu eksik',
            recommendation: 'onClick event\'leri için klavye event\'leri de ekleyin. Bu, klavye kullanıcıları için erişilebilirliği artırır.'
          });
        }
        
        // tabIndex kontrolü
        if (content.includes('tabIndex="-1"') || content.includes('tabindex="-1"')) {
          issues.push({
            file: relativePath,
            issue: 'tabIndex="-1" kullanımı',
            recommendation: 'tabIndex="-1" kullanımı, elementi klavye navigasyonundan çıkarır. Bu, erişilebilirlik sorunlarına neden olabilir.'
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
          title: 'ARIA Attribute\'leri',
          description: 'ARIA attribute\'leri, web sayfanızın erişilebilirliğini artırır. Bu attribute\'ler, ekran okuyucuların içeriğinizi daha iyi anlamasını sağlar.'
        },
        {
          title: 'Form Label\'ları',
          description: 'Tüm form input\'ları için label ekleyin. Bu, kullanıcıların input\'ların ne için olduğunu anlamasını sağlar.'
        },
        {
          title: 'Kontrast Oranı',
          description: 'Metin ve arka plan arasında yeterli kontrast oranı sağlayın. Bu, görme zorluğu olan kullanıcılar için önemlidir.'
        },
        {
          title: 'Klavye Navigasyonu',
          description: 'Tüm interaktif elementlerin klavye ile erişilebilir olduğundan emin olun. Bu, fare kullanamayan kullanıcılar için önemlidir.'
        },
        {
          title: 'Erişilebilirlik Testleri',
          description: 'Uygulamanızı düzenli olarak erişilebilirlik testlerine tabi tutun. axe, Lighthouse gibi araçlar kullanabilirsiniz.'
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
      let output = '# SEO Analizi\n\n';
      
      // Özet
      output += '## Özet\n\n';
      output += `Toplam ${results.metadata.totalIssues} SEO sorunu tespit edildi:\n`;
      output += `- Meta Tag Sorunları: ${results.metadata.metaTagIssues}\n`;
      output += `- Semantik HTML Sorunları: ${results.metadata.semanticHtmlIssues}\n`;
      output += `- Erişilebilirlik Sorunları: ${results.metadata.accessibilityIssues}\n\n`;
      
      // Meta Tag Sorunları
      output += '## Meta Tag Sorunları\n\n';
      
      if (results.results.metaTags.issues.length === 0) {
        output += 'Meta tag sorunu tespit edilmedi. Harika!\n\n';
      } else {
        results.results.metaTags.issues.forEach(issue => {
          output += `- **${issue.file}**\n`;
          output += `  - Sorun: ${issue.issue}\n`;
          output += `  - Öneri: ${issue.recommendation}\n\n`;
        });
      }
      
      output += '### Meta Tag Önerileri\n\n';
      results.results.metaTags.recommendations.forEach(recommendation => {
        output += `- **${recommendation.title}**\n`;
        output += `  - ${recommendation.description}\n\n`;
      });
      
      // Semantik HTML Sorunları
      output += '## Semantik HTML Sorunları\n\n';
      
      if (results.results.semanticHtml.issues.length === 0) {
        output += 'Semantik HTML sorunu tespit edilmedi. Harika!\n\n';
      } else {
        results.results.semanticHtml.issues.forEach(issue => {
          output += `- **${issue.file}**\n`;
          output += `  - Sorun: ${issue.issue}\n`;
          output += `  - Öneri: ${issue.recommendation}\n\n`;
        });
      }
      
      output += '### Semantik HTML Önerileri\n\n';
      results.results.semanticHtml.recommendations.forEach(recommendation => {
        output += `- **${recommendation.title}**\n`;
        output += `  - ${recommendation.description}\n\n`;
      });
      
      // Erişilebilirlik Sorunları
      output += '## Erişilebilirlik Sorunları\n\n';
      
      if (results.results.accessibility.issues.length === 0) {
        output += 'Erişilebilirlik sorunu tespit edilmedi. Harika!\n\n';
      } else {
        results.results.accessibility.issues.forEach(issue => {
          output += `- **${issue.file}**\n`;
          output += `  - Sorun: ${issue.issue}\n`;
          output += `  - Öneri: ${issue.recommendation}\n\n`;
        });
      }
      
      output += '### Erişilebilirlik Önerileri\n\n';
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
  <h2>SEO Analizi</h2>
  
  <!-- Özet -->
  <div class="section">
    <h3>Özet</h3>
    <div class="summary">
      <p>Toplam <strong>${results.metadata.totalIssues}</strong> SEO sorunu tespit edildi:</p>
      <ul class="summary-list">
        <li>Meta Tag Sorunları: ${results.metadata.metaTagIssues}</li>
        <li>Semantik HTML Sorunları: ${results.metadata.semanticHtmlIssues}</li>
        <li>Erişilebilirlik Sorunları: ${results.metadata.accessibilityIssues}</li>
      </ul>
    </div>
  </div>
  
  <!-- Meta Tag Sorunları -->
  <div class="section">
    <h3>Meta Tag Sorunları</h3>`;
      
      if (results.results.metaTags.issues.length === 0) {
        html += `
    <div class="success-message">
      <p>✅ Meta tag sorunu tespit edilmedi. Harika!</p>
    </div>`;
      } else {
        html += `
    <div class="subsection">
      <h4>Tespit Edilen Sorunlar</h4>
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
      <h4>Meta Tag Önerileri</h4>
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
    <h3>Semantik HTML Sorunları</h3>`;
      
      if (results.results.semanticHtml.issues.length === 0) {
        html += `
    <div class="success-message">
      <p>✅ Semantik HTML sorunu tespit edilmedi. Harika!</p>
    </div>`;
      } else {
        html += `
    <div class="subsection">
      <h4>Tespit Edilen Sorunlar</h4>
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
      <h4>Semantik HTML Önerileri</h4>
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
    <h3>Erişilebilirlik Sorunları</h3>`;
      
      if (results.results.accessibility.issues.length === 0) {
        html += `
    <div class="success-message">
      <p>✅ Erişilebilirlik sorunu tespit edilmedi. Harika!</p>
    </div>`;
      } else {
        html += `
    <div class="subsection">
      <h4>Tespit Edilen Sorunlar</h4>
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
      <h4>Erişilebilirlik Önerileri</h4>
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
