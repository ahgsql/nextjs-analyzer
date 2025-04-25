const fs = require('fs-extra');
const path = require('path');
const { findFiles, getRelativePath } = require('../../utils');

/**
 * Güvenlik Analizi Modülü
 */
module.exports = {
  name: 'security',
  description: 'Next.js projelerinde güvenlik analizi yapar',
  
  /**
   * Analiz işlemini gerçekleştirir
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @param {Object} options - Analiz seçenekleri
   * @returns {Object} - Analiz sonuçları
   */
  async analyze(analyzer, options) {
    // Server component güvenlik kontrolü
    const serverComponentSecurity = await this.checkServerComponentSecurity(analyzer);
    
    // API route güvenlik kontrolü
    const apiRouteSecurity = await this.checkApiRouteSecurity(analyzer);
    
    // Genel güvenlik kontrolü
    const generalSecurity = await this.checkGeneralSecurity(analyzer);
    
    return {
      results: {
        serverComponentSecurity,
        apiRouteSecurity,
        generalSecurity
      },
      metadata: {
        totalIssues: 
          serverComponentSecurity.issues.length + 
          apiRouteSecurity.issues.length + 
          generalSecurity.issues.length,
        criticalIssues: 
          serverComponentSecurity.issues.filter(i => i.severity === 'critical').length +
          apiRouteSecurity.issues.filter(i => i.severity === 'critical').length +
          generalSecurity.issues.filter(i => i.severity === 'critical').length,
        highIssues: 
          serverComponentSecurity.issues.filter(i => i.severity === 'high').length +
          apiRouteSecurity.issues.filter(i => i.severity === 'high').length +
          generalSecurity.issues.filter(i => i.severity === 'high').length,
        mediumIssues: 
          serverComponentSecurity.issues.filter(i => i.severity === 'medium').length +
          apiRouteSecurity.issues.filter(i => i.severity === 'medium').length +
          generalSecurity.issues.filter(i => i.severity === 'medium').length,
        lowIssues: 
          serverComponentSecurity.issues.filter(i => i.severity === 'low').length +
          apiRouteSecurity.issues.filter(i => i.severity === 'low').length +
          generalSecurity.issues.filter(i => i.severity === 'low').length
      }
    };
  },
  
  /**
   * Server component güvenlik kontrolü yapar
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @returns {Object} - Server component güvenlik sonuçları
   */
  async checkServerComponentSecurity(analyzer) {
    const issues = [];
    
    // Server component'leri bul
    const serverComponents = Array.from(analyzer.components.entries())
      .filter(([_, component]) => component.type === 'server')
      .map(([filePath, _]) => filePath);
    
    for (const filePath of serverComponents) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = getRelativePath(filePath, analyzer.projectPath);
        
        // Doğrudan process.env kullanımı
        if (content.includes('process.env') && !content.includes('process.env.NODE_ENV')) {
          const matches = content.match(/process\.env\.([A-Z0-9_]+)/g) || [];
          const envVars = matches.map(match => match.replace('process.env.', ''));
          
          if (envVars.some(v => v.includes('SECRET') || v.includes('KEY') || v.includes('TOKEN') || v.includes('PASSWORD'))) {
            issues.push({
              file: relativePath,
              issue: 'Hassas çevresel değişkenler doğrudan server component\'te kullanılıyor',
              severity: 'high',
              recommendation: 'Hassas bilgileri içeren çevresel değişkenleri doğrudan client\'a göndermekten kaçının. Bunun yerine, API route\'lar kullanarak bu bilgileri güvenli bir şekilde işleyin.'
            });
          }
        }
        
        // SQL injection riski
        if ((content.includes('sql') || content.includes('query') || content.includes('SELECT') || content.includes('INSERT')) && 
            (content.includes('${') || content.includes("${") || content.includes('`') || content.includes("'"))) {
          issues.push({
            file: relativePath,
            issue: 'Olası SQL injection riski',
            severity: 'critical',
            recommendation: 'SQL sorgularında kullanıcı girdilerini doğrudan kullanmak yerine, parametreli sorgular veya ORM kullanın.'
          });
        }
        
        // Dosya sistemi erişimi
        if ((content.includes('fs.') || content.includes('readFile') || content.includes('writeFile')) && 
            (content.includes('req.') || content.includes('params.') || content.includes('query.'))) {
          issues.push({
            file: relativePath,
            issue: 'Kullanıcı girdisi ile dosya sistemi erişimi',
            severity: 'critical',
            recommendation: 'Kullanıcı girdilerini dosya yollarında kullanmak tehlikelidir. Girdileri doğrulayın ve güvenli hale getirin.'
          });
        }
        
        // eval kullanımı
        if (content.includes('eval(') || content.includes('new Function(')) {
          issues.push({
            file: relativePath,
            issue: 'eval() veya new Function() kullanımı',
            severity: 'critical',
            recommendation: 'eval() ve new Function() kullanımından kaçının, çünkü bunlar kod enjeksiyonu saldırılarına açıktır.'
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
          title: 'Server Component Güvenliği',
          description: 'Server component\'ler, hassas bilgileri içerebilir. Bu bilgilerin client\'a sızdırılmamasına dikkat edin.'
        },
        {
          title: 'Çevresel Değişkenler',
          description: 'Server component\'lerde kullanılan çevresel değişkenler, client bundle\'a dahil edilmez. Ancak, bu değişkenleri doğrudan JSX içinde kullanmak, bu bilgilerin client\'a sızmasına neden olabilir.'
        },
        {
          title: 'Veri Doğrulama',
          description: 'Server component\'lerde kullanıcı girdilerini her zaman doğrulayın ve temizleyin.'
        }
      ]
    };
  },
  
  /**
   * API route güvenlik kontrolü yapar
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @returns {Object} - API route güvenlik sonuçları
   */
  async checkApiRouteSecurity(analyzer) {
    const issues = [];
    
    // API route'ları bul
    const apiRoutes = [];
    
    // Pages Router API routes
    if (analyzer.pagesDir) {
      const apiDir = path.join(analyzer.pagesDir, 'api');
      if (fs.existsSync(apiDir)) {
        apiRoutes.push(...findFiles(apiDir));
      }
    }
    
    // App Router API routes (route.js files)
    if (analyzer.appDir) {
      const appFiles = findFiles(analyzer.appDir);
      apiRoutes.push(...appFiles.filter(file => path.basename(file) === 'route.js' || path.basename(file) === 'route.ts'));
    }
    
    for (const filePath of apiRoutes) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = getRelativePath(filePath, analyzer.projectPath);
        
        // CORS kontrolü
        if (!content.includes('Access-Control-Allow-Origin') && 
            !content.includes('cors') && 
            !content.includes('next-cors')) {
          issues.push({
            file: relativePath,
            issue: 'CORS yapılandırması eksik',
            severity: 'medium',
            recommendation: 'API route\'larda CORS yapılandırması ekleyin. next-cors veya manuel olarak Access-Control-Allow-Origin header\'ı ekleyin.'
          });
        } else if (content.includes('Access-Control-Allow-Origin: *') || 
                  content.includes("Access-Control-Allow-Origin', '*'") || 
                  content.includes('origin: "*"') || 
                  content.includes("origin: '*'")) {
          issues.push({
            file: relativePath,
            issue: 'CORS yapılandırması çok geniş (wildcard *)',
            severity: 'medium',
            recommendation: 'Wildcard (*) yerine, belirli domain\'lere izin verin.'
          });
        }
        
        // Rate limiting kontrolü
        if (!content.includes('rate-limit') && 
            !content.includes('rateLimit') && 
            !content.includes('throttle') && 
            !content.includes('limiter')) {
          issues.push({
            file: relativePath,
            issue: 'Rate limiting eksik',
            severity: 'medium',
            recommendation: 'API route\'larda rate limiting ekleyin. express-rate-limit veya benzer bir kütüphane kullanabilirsiniz.'
          });
        }
        
        // Authentication kontrolü
        if ((content.includes('delete') || content.includes('update') || content.includes('create') || 
             content.includes('DELETE') || content.includes('PUT') || content.includes('POST')) && 
            (!content.includes('auth') && !content.includes('session') && !content.includes('token') && 
             !content.includes('jwt') && !content.includes('cookie'))) {
          issues.push({
            file: relativePath,
            issue: 'Veri değiştiren API endpoint\'inde authentication kontrolü eksik',
            severity: 'high',
            recommendation: 'Veri değiştiren API endpoint\'lerinde authentication kontrolü ekleyin.'
          });
        }
        
        // Input validation kontrolü
        if ((content.includes('req.body') || content.includes('req.query') || content.includes('req.params')) && 
            (!content.includes('validate') && !content.includes('schema') && !content.includes('joi') && 
             !content.includes('yup') && !content.includes('zod'))) {
          issues.push({
            file: relativePath,
            issue: 'Input validation eksik',
            severity: 'high',
            recommendation: 'API route\'larda input validation ekleyin. Joi, Yup, Zod gibi kütüphaneler kullanabilirsiniz.'
          });
        }
        
        // HTTP method kontrolü
        if (!content.includes('req.method') && !content.includes('request.method')) {
          issues.push({
            file: relativePath,
            issue: 'HTTP method kontrolü eksik',
            severity: 'medium',
            recommendation: 'API route\'larda HTTP method kontrolü ekleyin. Örneğin: if (req.method !== "POST") { return res.status(405).end(); }'
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
          title: 'API Route Güvenliği',
          description: 'API route\'lar, uygulamanızın dış dünyaya açılan kapılarıdır. Bu nedenle, güvenlik önlemlerini dikkatli bir şekilde uygulamalısınız.'
        },
        {
          title: 'CORS Yapılandırması',
          description: 'CORS yapılandırması, API\'nize hangi domain\'lerden erişilebileceğini kontrol eder. Wildcard (*) kullanmak yerine, belirli domain\'lere izin verin.'
        },
        {
          title: 'Rate Limiting',
          description: 'Rate limiting, API\'nize yapılan istekleri sınırlar ve DDoS saldırılarına karşı koruma sağlar.'
        },
        {
          title: 'Authentication ve Authorization',
          description: 'Veri değiştiren API endpoint\'lerinde her zaman authentication ve authorization kontrolü yapın.'
        },
        {
          title: 'Input Validation',
          description: 'Kullanıcı girdilerini her zaman doğrulayın ve temizleyin. Bu, injection saldırılarına karşı koruma sağlar.'
        }
      ]
    };
  },
  
  /**
   * Genel güvenlik kontrolü yapar
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @returns {Object} - Genel güvenlik sonuçları
   */
  async checkGeneralSecurity(analyzer) {
    const issues = [];
    
    // package.json kontrolü
    const packageJsonPath = path.join(analyzer.projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Bağımlılıkları kontrol et
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Eski Next.js sürümü
        if (dependencies.next) {
          const nextVersion = dependencies.next.replace('^', '').replace('~', '');
          const majorVersion = parseInt(nextVersion.split('.')[0]);
          if (majorVersion < 12) {
            issues.push({
              file: 'package.json',
              issue: `Eski Next.js sürümü kullanılıyor (${dependencies.next})`,
              severity: 'high',
              recommendation: 'Güvenlik güncellemeleri için Next.js\'i en son sürüme yükseltin.'
            });
          }
        }
        
        // Güvensiz paketler
        const insecurePackages = {
          'serialize-javascript': { maxVersion: '3.1.0', severity: 'high' },
          'lodash': { maxVersion: '4.17.19', severity: 'medium' },
          'axios': { maxVersion: '0.21.1', severity: 'medium' },
          'node-fetch': { maxVersion: '2.6.1', severity: 'medium' },
          'minimist': { maxVersion: '1.2.5', severity: 'medium' }
        };
        
        for (const [pkg, info] of Object.entries(insecurePackages)) {
          if (dependencies[pkg]) {
            const version = dependencies[pkg].replace('^', '').replace('~', '');
            const versionParts = version.split('.').map(Number);
            const maxVersionParts = info.maxVersion.split('.').map(Number);
            
            let isVulnerable = false;
            for (let i = 0; i < versionParts.length; i++) {
              if (versionParts[i] < maxVersionParts[i]) {
                isVulnerable = true;
                break;
              } else if (versionParts[i] > maxVersionParts[i]) {
                break;
              }
            }
            
            if (isVulnerable) {
              issues.push({
                file: 'package.json',
                issue: `Güvenlik açığı olan paket: ${pkg}@${version}`,
                severity: info.severity,
                recommendation: `${pkg} paketini en az ${info.maxVersion} sürümüne yükseltin.`
              });
            }
          }
        }
      } catch (error) {
        // package.json okunamadıysa devam et
      }
    }
    
    // .env dosyalarını kontrol et
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
    for (const envFile of envFiles) {
      const envPath = path.join(analyzer.projectPath, envFile);
      if (fs.existsSync(envPath)) {
        try {
          const content = fs.readFileSync(envPath, 'utf8');
          
          // .env dosyası .gitignore'da mı?
          const gitignorePath = path.join(analyzer.projectPath, '.gitignore');
          let isIgnored = false;
          
          if (fs.existsSync(gitignorePath)) {
            const gitignore = fs.readFileSync(gitignorePath, 'utf8');
            isIgnored = gitignore.split('\n').some(line => 
              line.trim() === envFile || line.trim() === '*.env' || line.trim() === '.env*'
            );
          }
          
          if (!isIgnored && envFile !== '.env.example' && envFile !== '.env.sample') {
            issues.push({
              file: envFile,
              issue: `${envFile} dosyası .gitignore'da değil`,
              severity: 'critical',
              recommendation: `${envFile} dosyasını .gitignore'a ekleyin. Hassas bilgiler repository'de saklanmamalıdır.`
            });
          }
          
          // Hassas bilgiler
          const sensitiveKeys = ['SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'CREDENTIAL'];
          const lines = content.split('\n');
          
          for (const line of lines) {
            if (line.trim() && !line.startsWith('#')) {
              const [key, value] = line.split('=');
              if (key && value && sensitiveKeys.some(sk => key.includes(sk))) {
                issues.push({
                  file: envFile,
                  issue: `Hassas bilgi içeren çevresel değişken: ${key}`,
                  severity: 'medium',
                  recommendation: `${envFile} dosyasını .gitignore'a ekleyin ve hassas bilgileri güvenli bir şekilde yönetin.`
                });
              }
            }
          }
        } catch (error) {
          // .env dosyası okunamadıysa devam et
        }
      }
    }
    
    // next.config.js kontrolü
    const nextConfigPath = path.join(analyzer.projectPath, 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      try {
        const content = fs.readFileSync(nextConfigPath, 'utf8');
        
        // Content Security Policy kontrolü
        if (!content.includes('Content-Security-Policy') && !content.includes('contentSecurityPolicy')) {
          issues.push({
            file: 'next.config.js',
            issue: 'Content Security Policy (CSP) eksik',
            severity: 'medium',
            recommendation: 'next.config.js dosyasında Content Security Policy ekleyin. Bu, XSS saldırılarına karşı koruma sağlar.'
          });
        }
        
        // Güvensiz external scripts
        if (content.includes('dangerouslyAllowSVG') || content.includes('dangerouslyAllowHTML')) {
          issues.push({
            file: 'next.config.js',
            issue: 'Güvensiz yapılandırma: dangerouslyAllowSVG veya dangerouslyAllowHTML',
            severity: 'medium',
            recommendation: 'Bu yapılandırmalar XSS saldırılarına açık olabilir. Mümkünse kullanmaktan kaçının.'
          });
        }
      } catch (error) {
        // next.config.js okunamadıysa devam et
      }
    }
    
    return {
      issues,
      recommendations: [
        {
          title: 'Bağımlılık Güvenliği',
          description: 'Bağımlılıklarınızı düzenli olarak güncelleyin ve güvenlik açıklarını kontrol edin. npm audit veya yarn audit komutlarını kullanabilirsiniz.'
        },
        {
          title: 'Çevresel Değişken Güvenliği',
          description: '.env dosyalarını her zaman .gitignore\'a ekleyin ve hassas bilgileri güvenli bir şekilde yönetin.'
        },
        {
          title: 'Content Security Policy',
          description: 'Content Security Policy (CSP), XSS saldırılarına karşı güçlü bir koruma sağlar. next.config.js dosyasında CSP başlıklarını yapılandırın.'
        },
        {
          title: 'Güvenli Yapılandırma',
          description: 'dangerouslyAllowSVG, dangerouslyAllowHTML gibi güvensiz yapılandırmalardan kaçının.'
        },
        {
          title: 'Düzenli Güvenlik Denetimleri',
          description: 'Uygulamanızı düzenli olarak güvenlik açıklarına karşı denetleyin ve güncel tutun.'
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
      let output = '# Güvenlik Analizi\n\n';
      
      // Özet
      output += '## Özet\n\n';
      output += `Toplam ${results.metadata.totalIssues} güvenlik sorunu tespit edildi:\n`;
      output += `- Kritik: ${results.metadata.criticalIssues}\n`;
      output += `- Yüksek: ${results.metadata.highIssues}\n`;
      output += `- Orta: ${results.metadata.mediumIssues}\n`;
      output += `- Düşük: ${results.metadata.lowIssues}\n\n`;
      
      // Server Component Güvenliği
      output += '## Server Component Güvenliği\n\n';
      
      if (results.results.serverComponentSecurity.issues.length === 0) {
        output += 'Server component\'lerde güvenlik sorunu tespit edilmedi. Harika!\n\n';
      } else {
        output += '### Tespit Edilen Sorunlar\n\n';
        results.results.serverComponentSecurity.issues.forEach(issue => {
          output += `- **${issue.file}** (${issue.severity.toUpperCase()})\n`;
          output += `  - Sorun: ${issue.issue}\n`;
          output += `  - Öneri: ${issue.recommendation}\n\n`;
        });
      }
      
      output += '### Öneriler\n\n';
      results.results.serverComponentSecurity.recommendations.forEach(recommendation => {
        output += `- **${recommendation.title}**\n`;
        output += `  - ${recommendation.description}\n\n`;
      });
      
      // API Route Güvenliği
      output += '## API Route Güvenliği\n\n';
      
      if (results.results.apiRouteSecurity.issues.length === 0) {
        output += 'API route\'larda güvenlik sorunu tespit edilmedi. Harika!\n\n';
      } else {
        output += '### Tespit Edilen Sorunlar\n\n';
        results.results.apiRouteSecurity.issues.forEach(issue => {
          output += `- **${issue.file}** (${issue.severity.toUpperCase()})\n`;
          output += `  - Sorun: ${issue.issue}\n`;
          output += `  - Öneri: ${issue.recommendation}\n\n`;
        });
      }
      
      output += '### Öneriler\n\n';
      results.results.apiRouteSecurity.recommendations.forEach(recommendation => {
        output += `- **${recommendation.title}**\n`;
        output += `  - ${recommendation.description}\n\n`;
      });
      
      // Genel Güvenlik
      output += '## Genel Güvenlik\n\n';
      
      if (results.results.generalSecurity.issues.length === 0) {
        output += 'Genel güvenlik sorunu tespit edilmedi. Harika!\n\n';
      } else {
        output += '### Tespit Edilen Sorunlar\n\n';
        results.results.generalSecurity.issues.forEach(issue => {
          output += `- **${issue.file}** (${issue.severity.toUpperCase()})\n`;
          output += `  - Sorun: ${issue.issue}\n`;
          output += `  - Öneri: ${issue.recommendation}\n\n`;
        });
      }
      
      output += '### Öneriler\n\n';
      results.results.generalSecurity.recommendations.forEach(recommendation => {
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
<div class="security-container">
  <h2>Güvenlik Analizi</h2>
  
  <!-- Özet -->
  <div class="section">
    <h3>Özet</h3>
    <div class="summary">
      <p>Toplam <strong>${results.metadata.totalIssues}</strong> güvenlik sorunu tespit edildi:</p>
      <ul class="summary-list">
        <li class="severity-critical">Kritik: ${results.metadata.criticalIssues}</li>
        <li class="severity-high">Yüksek: ${results.metadata.highIssues}</li>
        <li class="severity-medium">Orta: ${results.metadata.mediumIssues}</li>
        <li class="severity-low">Düşük: ${results.metadata.lowIssues}</li>
      </ul>
    </div>
  </div>
  
  <!-- Server Component Güvenliği -->
  <div class="section">
    <h3>Server Component Güvenliği</h3>`;
      
      if (results.results.serverComponentSecurity.issues.length === 0) {
        html += `
    <div class="success-message">
      <p>✅ Server component'lerde güvenlik sorunu tespit edilmedi. Harika!</p>
    </div>`;
      } else {
        html += `
    <div class="subsection">
      <h4>Tespit Edilen Sorunlar</h4>
      <ul class="issue-list">`;
        
        results.results.serverComponentSecurity.issues.forEach(issue => {
          html += `
        <li class="issue-item severity-${issue.severity}">
          <div class="issue-header">
            <span class="issue-file">${issue.file}</span>
            <span class="issue-severity">${issue.severity.toUpperCase()}</span>
          </div>
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
      <h4>Öneriler</h4>
      <ul class="recommendation-list">`;
      
      results.results.serverComponentSecurity.recommendations.forEach(recommendation => {
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
  
  <!-- API Route Güvenliği -->
  <div class="section">
    <h3>API Route Güvenliği</h3>`;
      
      if (results.results.apiRouteSecurity.issues.length === 0) {
        html += `
    <div class="success-message">
      <p>✅ API route'larda güvenlik sorunu tespit edilmedi. Harika!</p>
    </div>`;
      } else {
        html += `
    <div class="subsection">
      <h4>Tespit Edilen Sorunlar</h4>
      <ul class="issue-list">`;
        
        results.results.apiRouteSecurity.issues.forEach(issue => {
          html += `
        <li class="issue-item severity-${issue.severity}">
          <div class="issue-header">
            <span class="issue-file">${issue.file}</span>
            <span class="issue-severity">${issue.severity.toUpperCase()}</span>
          </div>
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
      <h4>Öneriler</h4>
      <ul class="recommendation-list">`;
      
      results.results.apiRouteSecurity.recommendations.forEach(recommendation => {
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
  
  <!-- Genel Güvenlik -->
  <div class="section">
    <h3>Genel Güvenlik</h3>`;
      
      if (results.results.generalSecurity.issues.length === 0) {
        html += `
    <div class="success-message">
      <p>✅ Genel güvenlik sorunu tespit edilmedi. Harika!</p>
    </div>`;
      } else {
        html += `
    <div class="subsection">
      <h4>Tespit Edilen Sorunlar</h4>
      <ul class="issue-list">`;
        
        results.results.generalSecurity.issues.forEach(issue => {
          html += `
        <li class="issue-item severity-${issue.severity}">
          <div class="issue-header">
            <span class="issue-file">${issue.file}</span>
            <span class="issue-severity">${issue.severity.toUpperCase()}</span>
          </div>
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
      <h4>Öneriler</h4>
      <ul class="recommendation-list">`;
      
      results.results.generalSecurity.recommendations.forEach(recommendation => {
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
