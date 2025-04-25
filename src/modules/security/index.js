const fs = require('fs-extra');
const path = require('path');
const { findFiles, getRelativePath, i18n } = require('../../utils');

/**
 * Güvenlik Analizi Modülü
 */
module.exports = {
  name: i18n.t('modules.security.name'),
  description: i18n.t('modules.security.description'),
  
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
              issue: i18n.t('modules.security.serverComponent.issues.sensitiveEnvVars'),
              severity: 'high',
              recommendation: i18n.t('modules.security.serverComponent.recommendations.sensitiveEnvVars')
            });
          }
        }
        
        // SQL injection riski
        if ((content.includes('sql') || content.includes('query') || content.includes('SELECT') || content.includes('INSERT')) && 
            (content.includes('${') || content.includes("${") || content.includes('`') || content.includes("'"))) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.security.serverComponent.issues.sqlInjection'),
            severity: 'critical',
            recommendation: i18n.t('modules.security.serverComponent.recommendations.sqlInjection')
          });
        }
        
        // Dosya sistemi erişimi
        if ((content.includes('fs.') || content.includes('readFile') || content.includes('writeFile')) && 
            (content.includes('req.') || content.includes('params.') || content.includes('query.'))) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.security.serverComponent.issues.fileSystemAccess'),
            severity: 'critical',
            recommendation: i18n.t('modules.security.serverComponent.recommendations.fileSystemAccess')
          });
        }
        
        // eval kullanımı
        if (content.includes('eval(') || content.includes('new Function(')) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.security.serverComponent.issues.evalUsage'),
            severity: 'critical',
            recommendation: i18n.t('modules.security.serverComponent.recommendations.evalUsage')
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
          title: i18n.t('modules.security.serverComponent.recommendations.title'),
          description: i18n.t('modules.security.serverComponent.recommendations.description')
        },
        {
          title: i18n.t('modules.security.serverComponent.recommendations.envVars.title'),
          description: i18n.t('modules.security.serverComponent.recommendations.envVars.description')
        },
        {
          title: i18n.t('modules.security.serverComponent.recommendations.dataValidation.title'),
          description: i18n.t('modules.security.serverComponent.recommendations.dataValidation.description')
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
            issue: i18n.t('modules.security.apiRoute.issues.corsConfig'),
            severity: 'medium',
            recommendation: i18n.t('modules.security.apiRoute.recommendations.corsConfig')
          });
        } else if (content.includes('Access-Control-Allow-Origin: *') || 
                  content.includes("Access-Control-Allow-Origin', '*'") || 
                  content.includes('origin: "*"') || 
                  content.includes("origin: '*'")) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.security.apiRoute.issues.corsWildcard'),
            severity: 'medium',
            recommendation: i18n.t('modules.security.apiRoute.recommendations.corsWildcard')
          });
        }
        
        // Rate limiting kontrolü
        if (!content.includes('rate-limit') && 
            !content.includes('rateLimit') && 
            !content.includes('throttle') && 
            !content.includes('limiter')) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.security.apiRoute.issues.rateLimiting'),
            severity: 'medium',
            recommendation: i18n.t('modules.security.apiRoute.recommendations.rateLimiting')
          });
        }
        
        // Authentication kontrolü
        if ((content.includes('delete') || content.includes('update') || content.includes('create') || 
             content.includes('DELETE') || content.includes('PUT') || content.includes('POST')) && 
            (!content.includes('auth') && !content.includes('session') && !content.includes('token') && 
             !content.includes('jwt') && !content.includes('cookie'))) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.security.apiRoute.issues.authentication'),
            severity: 'high',
            recommendation: i18n.t('modules.security.apiRoute.recommendations.authentication')
          });
        }
        
        // Input validation kontrolü
        if ((content.includes('req.body') || content.includes('req.query') || content.includes('req.params')) && 
            (!content.includes('validate') && !content.includes('schema') && !content.includes('joi') && 
             !content.includes('yup') && !content.includes('zod'))) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.security.apiRoute.issues.inputValidation'),
            severity: 'high',
            recommendation: i18n.t('modules.security.apiRoute.recommendations.inputValidation')
          });
        }
        
        // HTTP method kontrolü
        if (!content.includes('req.method') && !content.includes('request.method')) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.security.apiRoute.issues.httpMethod'),
            severity: 'medium',
            recommendation: i18n.t('modules.security.apiRoute.recommendations.httpMethod')
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
          title: i18n.t('modules.security.apiRoute.recommendations.title'),
          description: i18n.t('modules.security.apiRoute.recommendations.description')
        },
        {
          title: i18n.t('modules.security.apiRoute.recommendations.cors.title'),
          description: i18n.t('modules.security.apiRoute.recommendations.cors.description')
        },
        {
          title: i18n.t('modules.security.apiRoute.recommendations.rateLimiting.title'),
          description: i18n.t('modules.security.apiRoute.recommendations.rateLimiting.description')
        },
        {
          title: i18n.t('modules.security.apiRoute.recommendations.auth.title'),
          description: i18n.t('modules.security.apiRoute.recommendations.auth.description')
        },
        {
          title: i18n.t('modules.security.apiRoute.recommendations.inputValidation.title'),
          description: i18n.t('modules.security.apiRoute.recommendations.inputValidation.description')
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
              issue: i18n.t('modules.security.general.issues.oldNextVersion', { version: dependencies.next }),
              severity: 'high',
              recommendation: i18n.t('modules.security.general.recommendations.oldNextVersion')
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
                issue: i18n.t('modules.security.general.issues.insecurePackage', { package: pkg, version: version }),
                severity: info.severity,
                recommendation: i18n.t('modules.security.general.recommendations.insecurePackage', { package: pkg, minVersion: info.maxVersion })
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
              issue: i18n.t('modules.security.general.issues.envNotIgnored', { file: envFile }),
              severity: 'critical',
              recommendation: i18n.t('modules.security.general.recommendations.envNotIgnored', { file: envFile })
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
                  issue: i18n.t('modules.security.general.issues.sensitiveEnvVar', { key: key }),
                  severity: 'medium',
                  recommendation: i18n.t('modules.security.general.recommendations.sensitiveEnvVar', { file: envFile })
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
            issue: i18n.t('modules.security.general.issues.cspMissing'),
            severity: 'medium',
            recommendation: i18n.t('modules.security.general.recommendations.cspMissing')
          });
        }
        
        // Güvensiz external scripts
        if (content.includes('dangerouslyAllowSVG') || content.includes('dangerouslyAllowHTML')) {
          issues.push({
            file: 'next.config.js',
            issue: i18n.t('modules.security.general.issues.unsafeConfig'),
            severity: 'medium',
            recommendation: i18n.t('modules.security.general.recommendations.unsafeConfig')
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
          title: i18n.t('modules.security.general.recommendations.dependencies.title'),
          description: i18n.t('modules.security.general.recommendations.dependencies.description')
        },
        {
          title: i18n.t('modules.security.general.recommendations.envSecurity.title'),
          description: i18n.t('modules.security.general.recommendations.envSecurity.description')
        },
        {
          title: i18n.t('modules.security.general.recommendations.csp.title'),
          description: i18n.t('modules.security.general.recommendations.csp.description')
        },
        {
          title: i18n.t('modules.security.general.recommendations.safeConfig.title'),
          description: i18n.t('modules.security.general.recommendations.safeConfig.description')
        },
        {
          title: i18n.t('modules.security.general.recommendations.securityAudits.title'),
          description: i18n.t('modules.security.general.recommendations.securityAudits.description')
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
      let output = `# ${i18n.t('modules.security.visualize.title')}\n\n`;
      
      // Özet
      output += `## ${i18n.t('modules.security.visualize.summary')}\n\n`;
      output += `${i18n.t('modules.security.visualize.totalIssues', { count: results.metadata.totalIssues })}:\n`;
      output += `- ${i18n.t('modules.security.visualize.criticalIssues')}: ${results.metadata.criticalIssues}\n`;
      output += `- ${i18n.t('modules.security.visualize.highIssues')}: ${results.metadata.highIssues}\n`;
      output += `- ${i18n.t('modules.security.visualize.mediumIssues')}: ${results.metadata.mediumIssues}\n`;
      output += `- ${i18n.t('modules.security.visualize.lowIssues')}: ${results.metadata.lowIssues}\n\n`;
      
      // Server Component Güvenliği
      output += `## ${i18n.t('modules.security.serverComponent.title')}\n\n`;
      
      if (results.results.serverComponentSecurity.issues.length === 0) {
        output += `${i18n.t('modules.security.serverComponent.noIssues')}\n\n`;
      } else {
        output += `### ${i18n.t('modules.security.visualize.detectedIssues')}\n\n`;
        results.results.serverComponentSecurity.issues.forEach(issue => {
          output += `- **${issue.file}** (${issue.severity.toUpperCase()})\n`;
          output += `  - ${i18n.t('modules.security.visualize.issue')}: ${issue.issue}\n`;
          output += `  - ${i18n.t('modules.security.visualize.recommendation')}: ${issue.recommendation}\n\n`;
        });
      }
      
      output += `### ${i18n.t('modules.security.visualize.recommendations')}\n\n`;
      results.results.serverComponentSecurity.recommendations.forEach(recommendation => {
        output += `- **${recommendation.title}**\n`;
        output += `  - ${recommendation.description}\n\n`;
      });
      
      // API Route Güvenliği
      output += `## ${i18n.t('modules.security.apiRoute.title')}\n\n`;
      
      if (results.results.apiRouteSecurity.issues.length === 0) {
        output += `${i18n.t('modules.security.apiRoute.noIssues')}\n\n`;
      } else {
        output += `### ${i18n.t('modules.security.visualize.detectedIssues')}\n\n`;
        results.results.apiRouteSecurity.issues.forEach(issue => {
          output += `- **${issue.file}** (${issue.severity.toUpperCase()})\n`;
          output += `  - ${i18n.t('modules.security.visualize.issue')}: ${issue.issue}\n`;
          output += `  - ${i18n.t('modules.security.visualize.recommendation')}: ${issue.recommendation}\n\n`;
        });
      }
      
      output += `### ${i18n.t('modules.security.visualize.recommendations')}\n\n`;
      results.results.apiRouteSecurity.recommendations.forEach(recommendation => {
        output += `- **${recommendation.title}**\n`;
        output += `  - ${recommendation.description}\n\n`;
      });
      
      // Genel Güvenlik
      output += `## ${i18n.t('modules.security.general.title')}\n\n`;
      
      if (results.results.generalSecurity.issues.length === 0) {
        output += `${i18n.t('modules.security.general.noIssues')}\n\n`;
      } else {
        output += `### ${i18n.t('modules.security.visualize.detectedIssues')}\n\n`;
        results.results.generalSecurity.issues.forEach(issue => {
          output += `- **${issue.file}** (${issue.severity.toUpperCase()})\n`;
          output += `  - ${i18n.t('modules.security.visualize.issue')}: ${issue.issue}\n`;
          output += `  - ${i18n.t('modules.security.visualize.recommendation')}: ${issue.recommendation}\n\n`;
        });
      }
      
      output += `### ${i18n.t('modules.security.visualize.recommendations')}\n\n`;
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
  <h2>${i18n.t('modules.security.visualize.title')}</h2>
  
  <!-- Özet -->
  <div class="section">
    <h3>${i18n.t('modules.security.visualize.summary')}</h3>
    <div class="summary">
      <p>${i18n.t('modules.security.visualize.totalIssues', { count: results.metadata.totalIssues })}:</p>
      <ul class="summary-list">
        <li class="severity-critical">${i18n.t('modules.security.visualize.criticalIssues')}: ${results.metadata.criticalIssues}</li>
        <li class="severity-high">${i18n.t('modules.security.visualize.highIssues')}: ${results.metadata.highIssues}</li>
        <li class="severity-medium">${i18n.t('modules.security.visualize.mediumIssues')}: ${results.metadata.mediumIssues}</li>
        <li class="severity-low">${i18n.t('modules.security.visualize.lowIssues')}: ${results.metadata.lowIssues}</li>
      </ul>
    </div>
  </div>
  
  <!-- Server Component Güvenliği -->
  <div class="section">
    <h3>${i18n.t('modules.security.serverComponent.title')}</h3>`;
      
      if (results.results.serverComponentSecurity.issues.length === 0) {
        html += `
    <div class="success-message">
      <p>✅ ${i18n.t('modules.security.serverComponent.noIssues')}</p>
    </div>`;
      } else {
        html += `
    <div class="subsection">
      <h4>${i18n.t('modules.security.visualize.detectedIssues')}</h4>
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
      <h4>${i18n.t('modules.security.visualize.recommendations')}</h4>
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
    <h3>${i18n.t('modules.security.apiRoute.title')}</h3>`;
      
      if (results.results.apiRouteSecurity.issues.length === 0) {
        html += `
    <div class="success-message">
      <p>✅ ${i18n.t('modules.security.apiRoute.noIssues')}</p>
    </div>`;
      } else {
        html += `
    <div class="subsection">
      <h4>${i18n.t('modules.security.visualize.detectedIssues')}</h4>
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
      <h4>${i18n.t('modules.security.visualize.recommendations')}</h4>
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
    <h3>${i18n.t('modules.security.general.title')}</h3>`;
      
      if (results.results.generalSecurity.issues.length === 0) {
        html += `
    <div class="success-message">
      <p>✅ ${i18n.t('modules.security.general.noIssues')}</p>
    </div>`;
      } else {
        html += `
    <div class="subsection">
      <h4>${i18n.t('modules.security.visualize.detectedIssues')}</h4>
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
      <h4>${i18n.t('modules.security.visualize.recommendations')}</h4>
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
