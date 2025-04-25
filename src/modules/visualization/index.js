const fs = require('fs-extra');
const path = require('path');
const { logSuccess, logError } = require('../../utils');

/**
 * Gelişmiş Görselleştirme Modülü
 */
module.exports = {
  name: 'visualization',
  description: 'Next.js analiz sonuçlarını gelişmiş görselleştirmelerle sunar',
  
  /**
   * Analiz işlemini gerçekleştirir
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @param {Object} options - Analiz seçenekleri
   * @returns {Object} - Analiz sonuçları
   */
  async analyze(analyzer, options) {
    // Tüm modül sonuçlarını topla
    const allModuleResults = analyzer.getAllModuleResults();
    
    // Grafik verilerini oluştur
    const chartData = this.generateChartData(allModuleResults);
    
    // Filtreleme seçeneklerini oluştur
    const filterOptions = this.generateFilterOptions(allModuleResults);
    
    return {
      results: {
        chartData,
        filterOptions,
        allModuleResults
      },
      metadata: {
        totalModules: Object.keys(allModuleResults).length,
        totalIssues: this.countTotalIssues(allModuleResults)
      }
    };
  },
  
  /**
   * Grafik verilerini oluşturur
   * @param {Object} allModuleResults - Tüm modül sonuçları
   * @returns {Object} - Grafik verileri
   */
  generateChartData(allModuleResults) {
    const moduleNames = Object.keys(allModuleResults);
    const issueCountsByModule = {};
    const issueTypeDistribution = {};
    const severityDistribution = {};
    
    // Modül başına sorun sayılarını hesapla
    for (const moduleName of moduleNames) {
      const moduleResults = allModuleResults[moduleName];
      
      // Modül başına sorun sayısı
      let issueCount = 0;
      
      // Sorun türlerini ve önem derecelerini topla
      if (moduleResults.results) {
        // Component modülü
        if (moduleName === 'component' && moduleResults.results.serverComponents) {
          issueCount += moduleResults.results.serverComponents.length;
          issueTypeDistribution['Server Component'] = (issueTypeDistribution['Server Component'] || 0) + moduleResults.results.serverComponents.length;
        }
        
        // Code quality modülü
        if (moduleName === 'code-quality' && moduleResults.results.unusedComponents) {
          issueCount += moduleResults.results.unusedComponents.length;
          issueTypeDistribution['Unused Component'] = (issueTypeDistribution['Unused Component'] || 0) + moduleResults.results.unusedComponents.length;
        }
        
        // Routing modülü
        if (moduleName === 'routing' && moduleResults.results.routes) {
          const dynamicRoutes = moduleResults.results.routes.filter(r => r.isDynamic);
          issueCount += dynamicRoutes.length;
          issueTypeDistribution['Dynamic Route'] = (issueTypeDistribution['Dynamic Route'] || 0) + dynamicRoutes.length;
        }
        
        // Performance modülü
        if (moduleName === 'performance') {
          if (moduleResults.results.imageOptimization && moduleResults.results.imageOptimization.nonOptimizedImages) {
            issueCount += moduleResults.results.imageOptimization.nonOptimizedImages.length;
            issueTypeDistribution['Non-Optimized Image'] = (issueTypeDistribution['Non-Optimized Image'] || 0) + moduleResults.results.imageOptimization.nonOptimizedImages.length;
          }
          
          if (moduleResults.results.bundleSize) {
            if (moduleResults.results.bundleSize.largeComponents) {
              issueCount += moduleResults.results.bundleSize.largeComponents.length;
              issueTypeDistribution['Large Component'] = (issueTypeDistribution['Large Component'] || 0) + moduleResults.results.bundleSize.largeComponents.length;
            }
            
            if (moduleResults.results.bundleSize.largeImports) {
              issueCount += moduleResults.results.bundleSize.largeImports.length;
              issueTypeDistribution['Large Import'] = (issueTypeDistribution['Large Import'] || 0) + moduleResults.results.bundleSize.largeImports.length;
            }
          }
        }
        
        // Data fetching modülü
        if (moduleName === 'data-fetching') {
          if (moduleResults.results.cacheStrategies && moduleResults.results.cacheStrategies.issues) {
            issueCount += moduleResults.results.cacheStrategies.issues.length;
            issueTypeDistribution['Cache Strategy Issue'] = (issueTypeDistribution['Cache Strategy Issue'] || 0) + moduleResults.results.cacheStrategies.issues.length;
          }
        }
        
        // Security modülü
        if (moduleName === 'security') {
          if (moduleResults.results.serverComponentSecurity && moduleResults.results.serverComponentSecurity.issues) {
            issueCount += moduleResults.results.serverComponentSecurity.issues.length;
            
            // Önem derecelerine göre dağılım
            moduleResults.results.serverComponentSecurity.issues.forEach(issue => {
              if (issue.severity) {
                severityDistribution[issue.severity] = (severityDistribution[issue.severity] || 0) + 1;
              }
            });
            
            issueTypeDistribution['Server Security Issue'] = (issueTypeDistribution['Server Security Issue'] || 0) + moduleResults.results.serverComponentSecurity.issues.length;
          }
          
          if (moduleResults.results.apiRouteSecurity && moduleResults.results.apiRouteSecurity.issues) {
            issueCount += moduleResults.results.apiRouteSecurity.issues.length;
            
            // Önem derecelerine göre dağılım
            moduleResults.results.apiRouteSecurity.issues.forEach(issue => {
              if (issue.severity) {
                severityDistribution[issue.severity] = (severityDistribution[issue.severity] || 0) + 1;
              }
            });
            
            issueTypeDistribution['API Security Issue'] = (issueTypeDistribution['API Security Issue'] || 0) + moduleResults.results.apiRouteSecurity.issues.length;
          }
          
          if (moduleResults.results.generalSecurity && moduleResults.results.generalSecurity.issues) {
            issueCount += moduleResults.results.generalSecurity.issues.length;
            
            // Önem derecelerine göre dağılım
            moduleResults.results.generalSecurity.issues.forEach(issue => {
              if (issue.severity) {
                severityDistribution[issue.severity] = (severityDistribution[issue.severity] || 0) + 1;
              }
            });
            
            issueTypeDistribution['General Security Issue'] = (issueTypeDistribution['General Security Issue'] || 0) + moduleResults.results.generalSecurity.issues.length;
          }
        }
        
        // SEO modülü
        if (moduleName === 'seo') {
          if (moduleResults.results.metaTags && moduleResults.results.metaTags.issues) {
            issueCount += moduleResults.results.metaTags.issues.length;
            issueTypeDistribution['Meta Tag Issue'] = (issueTypeDistribution['Meta Tag Issue'] || 0) + moduleResults.results.metaTags.issues.length;
          }
          
          if (moduleResults.results.semanticHtml && moduleResults.results.semanticHtml.issues) {
            issueCount += moduleResults.results.semanticHtml.issues.length;
            issueTypeDistribution['Semantic HTML Issue'] = (issueTypeDistribution['Semantic HTML Issue'] || 0) + moduleResults.results.semanticHtml.issues.length;
          }
          
          if (moduleResults.results.accessibility && moduleResults.results.accessibility.issues) {
            issueCount += moduleResults.results.accessibility.issues.length;
            issueTypeDistribution['Accessibility Issue'] = (issueTypeDistribution['Accessibility Issue'] || 0) + moduleResults.results.accessibility.issues.length;
          }
        }
      }
      
      issueCountsByModule[moduleName] = issueCount;
    }
    
    return {
      issueCountsByModule,
      issueTypeDistribution,
      severityDistribution
    };
  },
  
  /**
   * Filtreleme seçeneklerini oluşturur
   * @param {Object} allModuleResults - Tüm modül sonuçları
   * @returns {Object} - Filtreleme seçenekleri
   */
  generateFilterOptions(allModuleResults) {
    const moduleNames = Object.keys(allModuleResults);
    const issueTypes = new Set();
    const severities = new Set();
    const files = new Set();
    
    // Tüm modülleri tara
    for (const moduleName of moduleNames) {
      const moduleResults = allModuleResults[moduleName];
      
      if (moduleResults.results) {
        // Component modülü
        if (moduleName === 'component' && moduleResults.results.serverComponents) {
          issueTypes.add('Server Component');
          moduleResults.results.serverComponents.forEach(component => {
            files.add(component.file);
          });
        }
        
        // Code quality modülü
        if (moduleName === 'code-quality' && moduleResults.results.unusedComponents) {
          issueTypes.add('Unused Component');
          moduleResults.results.unusedComponents.forEach(component => {
            files.add(component.path);
          });
        }
        
        // Security modülü
        if (moduleName === 'security') {
          if (moduleResults.results.serverComponentSecurity && moduleResults.results.serverComponentSecurity.issues) {
            issueTypes.add('Server Security Issue');
            moduleResults.results.serverComponentSecurity.issues.forEach(issue => {
              if (issue.severity) severities.add(issue.severity);
              if (issue.file) files.add(issue.file);
            });
          }
          
          if (moduleResults.results.apiRouteSecurity && moduleResults.results.apiRouteSecurity.issues) {
            issueTypes.add('API Security Issue');
            moduleResults.results.apiRouteSecurity.issues.forEach(issue => {
              if (issue.severity) severities.add(issue.severity);
              if (issue.file) files.add(issue.file);
            });
          }
          
          if (moduleResults.results.generalSecurity && moduleResults.results.generalSecurity.issues) {
            issueTypes.add('General Security Issue');
            moduleResults.results.generalSecurity.issues.forEach(issue => {
              if (issue.severity) severities.add(issue.severity);
              if (issue.file) files.add(issue.file);
            });
          }
        }
        
        // SEO modülü
        if (moduleName === 'seo') {
          if (moduleResults.results.metaTags && moduleResults.results.metaTags.issues) {
            issueTypes.add('Meta Tag Issue');
            moduleResults.results.metaTags.issues.forEach(issue => {
              if (issue.file) files.add(issue.file);
            });
          }
          
          if (moduleResults.results.semanticHtml && moduleResults.results.semanticHtml.issues) {
            issueTypes.add('Semantic HTML Issue');
            moduleResults.results.semanticHtml.issues.forEach(issue => {
              if (issue.file) files.add(issue.file);
            });
          }
          
          if (moduleResults.results.accessibility && moduleResults.results.accessibility.issues) {
            issueTypes.add('Accessibility Issue');
            moduleResults.results.accessibility.issues.forEach(issue => {
              if (issue.file) files.add(issue.file);
            });
          }
        }
      }
    }
    
    return {
      modules: moduleNames,
      issueTypes: Array.from(issueTypes),
      severities: Array.from(severities),
      files: Array.from(files)
    };
  },
  
  /**
   * Toplam sorun sayısını hesaplar
   * @param {Object} allModuleResults - Tüm modül sonuçları
   * @returns {number} - Toplam sorun sayısı
   */
  countTotalIssues(allModuleResults) {
    let totalIssues = 0;
    
    for (const moduleName in allModuleResults) {
      const moduleResults = allModuleResults[moduleName];
      
      if (moduleResults.metadata && moduleResults.metadata.totalIssues) {
        totalIssues += moduleResults.metadata.totalIssues;
      } else if (moduleResults.results) {
        // Component modülü
        if (moduleName === 'component' && moduleResults.results.serverComponents) {
          totalIssues += moduleResults.results.serverComponents.length;
        }
        
        // Code quality modülü
        if (moduleName === 'code-quality' && moduleResults.results.unusedComponents) {
          totalIssues += moduleResults.results.unusedComponents.length;
        }
        
        // Security modülü
        if (moduleName === 'security') {
          if (moduleResults.results.serverComponentSecurity && moduleResults.results.serverComponentSecurity.issues) {
            totalIssues += moduleResults.results.serverComponentSecurity.issues.length;
          }
          
          if (moduleResults.results.apiRouteSecurity && moduleResults.results.apiRouteSecurity.issues) {
            totalIssues += moduleResults.results.apiRouteSecurity.issues.length;
          }
          
          if (moduleResults.results.generalSecurity && moduleResults.results.generalSecurity.issues) {
            totalIssues += moduleResults.results.generalSecurity.issues.length;
          }
        }
        
        // SEO modülü
        if (moduleName === 'seo') {
          if (moduleResults.results.metaTags && moduleResults.results.metaTags.issues) {
            totalIssues += moduleResults.results.metaTags.issues.length;
          }
          
          if (moduleResults.results.semanticHtml && moduleResults.results.semanticHtml.issues) {
            totalIssues += moduleResults.results.semanticHtml.issues.length;
          }
          
          if (moduleResults.results.accessibility && moduleResults.results.accessibility.issues) {
            totalIssues += moduleResults.results.accessibility.issues.length;
          }
        }
      }
    }
    
    return totalIssues;
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
      let output = '# Gelişmiş Görselleştirme\n\n';
      
      // Özet
      output += '## Özet\n\n';
      output += `Toplam ${results.metadata.totalModules} modül ve ${results.metadata.totalIssues} sorun tespit edildi.\n\n`;
      
      // Modül başına sorun sayıları
      output += '## Modül Başına Sorun Sayıları\n\n';
      
      for (const [moduleName, issueCount] of Object.entries(results.results.chartData.issueCountsByModule)) {
        output += `- ${moduleName}: ${issueCount} sorun\n`;
      }
      
      output += '\n';
      
      // Sorun türü dağılımı
      output += '## Sorun Türü Dağılımı\n\n';
      
      for (const [issueType, count] of Object.entries(results.results.chartData.issueTypeDistribution)) {
        output += `- ${issueType}: ${count} sorun\n`;
      }
      
      output += '\n';
      
      // Önem derecesi dağılımı
      if (Object.keys(results.results.chartData.severityDistribution).length > 0) {
        output += '## Önem Derecesi Dağılımı\n\n';
        
        for (const [severity, count] of Object.entries(results.results.chartData.severityDistribution)) {
          output += `- ${severity}: ${count} sorun\n`;
        }
        
        output += '\n';
      }
      
      // Filtreleme seçenekleri
      output += '## Filtreleme Seçenekleri\n\n';
      
      output += '### Modüller\n\n';
      results.results.filterOptions.modules.forEach(module => {
        output += `- ${module}\n`;
      });
      
      output += '\n### Sorun Türleri\n\n';
      results.results.filterOptions.issueTypes.forEach(issueType => {
        output += `- ${issueType}\n`;
      });
      
      if (results.results.filterOptions.severities.length > 0) {
        output += '\n### Önem Dereceleri\n\n';
        results.results.filterOptions.severities.forEach(severity => {
          output += `- ${severity}\n`;
        });
      }
      
      output += '\n### Dosyalar\n\n';
      results.results.filterOptions.files.slice(0, 10).forEach(file => {
        output += `- ${file}\n`;
      });
      
      if (results.results.filterOptions.files.length > 10) {
        output += `- ... ve ${results.results.filterOptions.files.length - 10} dosya daha\n`;
      }
      
      return output;
    },
    
    /**
     * HTML formatında görselleştirme
     * @param {Object} results - Analiz sonuçları
     * @returns {string} - HTML formatında görselleştirme
     */
    html(results) {
      // Chart.js için veri hazırla
      const moduleNames = Object.keys(results.results.chartData.issueCountsByModule);
      const issueCounts = Object.values(results.results.chartData.issueCountsByModule);
      
      const issueTypes = Object.keys(results.results.chartData.issueTypeDistribution);
      const issueTypeCounts = Object.values(results.results.chartData.issueTypeDistribution);
      
      const severities = Object.keys(results.results.chartData.severityDistribution);
      const severityCounts = Object.values(results.results.chartData.severityDistribution);
      
      // Renk paleti
      const colors = [
        '#0070f3', '#ff0080', '#f5a623', '#7928ca', '#00a8ff',
        '#ff4d4d', '#50e3c2', '#3291ff', '#ff0080', '#7928ca'
      ];
      
      // Modül başına sorun sayıları için veri
      const moduleChartData = {
        labels: moduleNames,
        datasets: [{
          label: 'Sorun Sayısı',
          data: issueCounts,
          backgroundColor: colors.slice(0, moduleNames.length)
        }]
      };
      
      // Sorun türü dağılımı için veri
      const issueTypeChartData = {
        labels: issueTypes,
        datasets: [{
          label: 'Sorun Sayısı',
          data: issueTypeCounts,
          backgroundColor: colors.slice(0, issueTypes.length)
        }]
      };
      
      // Önem derecesi dağılımı için veri
      const severityChartData = {
        labels: severities,
        datasets: [{
          label: 'Sorun Sayısı',
          data: severityCounts,
          backgroundColor: {
            'critical': '#ff4d4d',
            'high': '#f5a623',
            'medium': '#ffcc00',
            'low': '#50e3c2'
          }
        }]
      };
      
      // HTML oluştur
      let html = `
<div class="visualization-container">
  <h2>Gelişmiş Görselleştirme</h2>
  
  <!-- Özet -->
  <div class="section">
    <h3>Özet</h3>
    <div class="summary">
      <p>Toplam <strong>${results.metadata.totalModules}</strong> modül ve <strong>${results.metadata.totalIssues}</strong> sorun tespit edildi.</p>
    </div>
  </div>
  
  <!-- Grafikler -->
  <div class="section">
    <h3>Grafikler</h3>
    
    <div class="chart-container">
      <h4>Modül Başına Sorun Sayıları</h4>
      <div class="chart">
        <canvas id="moduleChart"></canvas>
      </div>
    </div>
    
    <div class="chart-container">
      <h4>Sorun Türü Dağılımı</h4>
      <div class="chart">
        <canvas id="issueTypeChart"></canvas>
      </div>
    </div>`;
      
      if (severities.length > 0) {
        html += `
    <div class="chart-container">
      <h4>Önem Derecesi Dağılımı</h4>
      <div class="chart">
        <canvas id="severityChart"></canvas>
      </div>
    </div>`;
      }
      
      html += `
  </div>
  
  <!-- Filtreleme -->
  <div class="section">
    <h3>Filtreleme</h3>
    
    <div class="filter-container">
      <div class="filter-group">
        <label for="moduleFilter">Modül:</label>
        <select id="moduleFilter" class="filter-select">
          <option value="all">Tümü</option>`;
      
      results.results.filterOptions.modules.forEach(module => {
        html += `
          <option value="${module}">${module}</option>`;
      });
      
      html += `
        </select>
      </div>
      
      <div class="filter-group">
        <label for="issueTypeFilter">Sorun Türü:</label>
        <select id="issueTypeFilter" class="filter-select">
          <option value="all">Tümü</option>`;
      
      results.results.filterOptions.issueTypes.forEach(issueType => {
        html += `
          <option value="${issueType}">${issueType}</option>`;
      });
      
      html += `
        </select>
      </div>`;
      
      if (results.results.filterOptions.severities.length > 0) {
        html += `
      <div class="filter-group">
        <label for="severityFilter">Önem Derecesi:</label>
        <select id="severityFilter" class="filter-select">
          <option value="all">Tümü</option>`;
        
        results.results.filterOptions.severities.forEach(severity => {
          html += `
          <option value="${severity}">${severity}</option>`;
        });
        
        html += `
        </select>
      </div>`;
      }
      
      html += `
      <div class="filter-group">
        <label for="fileFilter">Dosya:</label>
        <select id="fileFilter" class="filter-select">
          <option value="all">Tümü</option>`;
      
      results.results.filterOptions.files.forEach(file => {
        html += `
          <option value="${file}">${file}</option>`;
      });
      
      html += `
        </select>
      </div>
      
      <button id="applyFilter" class="filter-button">Filtrele</button>
    </div>
    
    <div id="filteredResults" class="filtered-results">
      <p>Filtreleme yapmak için yukarıdaki seçenekleri kullanın.</p>
    </div>
  </div>
  
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  <script>
    // Modül başına sorun sayıları grafiği
    const moduleChartCtx = document.getElementById('moduleChart').getContext('2d');
    new Chart(moduleChartCtx, {
      type: 'bar',
      data: ${JSON.stringify(moduleChartData)},
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Modül Başına Sorun Sayıları'
          }
        }
      }
    });
    
    // Sorun türü dağılımı grafiği
    const issueTypeChartCtx = document.getElementById('issueTypeChart').getContext('2d');
    new Chart(issueTypeChartCtx, {
      type: 'pie',
      data: ${JSON.stringify(issueTypeChartData)},
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right'
          },
          title: {
            display: true,
            text: 'Sorun Türü Dağılımı'
          }
        }
      }
    });`;
      
      if (severities.length > 0) {
        html += `
    
    // Önem derecesi dağılımı grafiği
    const severityChartCtx = document.getElementById('severityChart').getContext('2d');
    new Chart(severityChartCtx, {
      type: 'pie',
      data: ${JSON.stringify(severityChartData)},
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right'
          },
          title: {
            display: true,
            text: 'Önem Derecesi Dağılımı'
          }
        }
      }
    });`;
      }
      
      html += `
    
    // Filtreleme işlevi
    document.getElementById('applyFilter').addEventListener('click', function() {
      const moduleFilter = document.getElementById('moduleFilter').value;
      const issueTypeFilter = document.getElementById('issueTypeFilter').value;
      const severityFilter = document.getElementById('severityFilter')?.value;
      const fileFilter = document.getElementById('fileFilter').value;
      
      const filteredResults = document.getElementById('filteredResults');
      filteredResults.innerHTML = '<p>Filtreleme sonuçları yükleniyor...</p>';
      
      // Gerçek uygulamada burada AJAX isteği yapılabilir
      // Bu örnekte sadece filtreleme seçeneklerini gösteriyoruz
      setTimeout(() => {
        filteredResults.innerHTML = \`
          <h4>Filtreleme Sonuçları</h4>
          <ul>
            <li><strong>Modül:</strong> \${moduleFilter === 'all' ? 'Tümü' : moduleFilter}</li>
            <li><strong>Sorun Türü:</strong> \${issueTypeFilter === 'all' ? 'Tümü' : issueTypeFilter}</li>
            \${severityFilter ? \`<li><strong>Önem Derecesi:</strong> \${severityFilter === 'all' ? 'Tümü' : severityFilter}</li>\` : ''}
            <li><strong>Dosya:</strong> \${fileFilter === 'all' ? 'Tümü' : fileFilter}</li>
          </ul>
          <p>Bu filtreleme kriterlerine göre sonuçlar burada gösterilecektir.</p>
        \`;
      }, 500);
    });
  </script>
  
  <style>
    .visualization-container {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .chart-container {
      margin-bottom: 30px;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .chart {
      height: 300px;
    }
    
    .filter-container {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 20px;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .filter-group {
      display: flex;
      flex-direction: column;
      min-width: 200px;
    }
    
    .filter-select {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-top: 5px;
    }
    
    .filter-button {
      padding: 8px 16px;
      background-color: #0070f3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      align-self: flex-end;
      margin-top: auto;
    }
    
    .filtered-results {
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  </style>
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
