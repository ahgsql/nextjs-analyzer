const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const { logError, logInfo } = require('../../utils');

/**
 * Zaman İçinde Değişim Analizi Modülü
 */
module.exports = {
  name: 'history',
  description: 'Next.js projelerinin zaman içindeki değişimlerini analiz eder',
  
  /**
   * Analiz işlemini gerçekleştirir
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @param {Object} options - Analiz seçenekleri
   * @returns {Object} - Analiz sonuçları
   */
  async analyze(analyzer, options) {
    // Git geçmişini kontrol et
    const hasGit = this.checkGitRepository(analyzer.projectPath);
    
    if (!hasGit) {
      return {
        results: {
          error: 'Git deposu bulunamadı. Tarihsel analiz için Git gereklidir.'
        },
        metadata: {
          hasGit: false
        }
      };
    }
    
    // Commit geçmişini al
    const commitHistory = this.getCommitHistory(analyzer.projectPath);
    
    // Versiyon karşılaştırması yap
    const versionComparison = await this.compareVersions(analyzer, commitHistory, options);
    
    // Trend analizi yap
    const trendAnalysis = this.analyzeTrends(versionComparison);
    
    return {
      results: {
        commitHistory,
        versionComparison,
        trendAnalysis
      },
      metadata: {
        hasGit: true,
        totalCommits: commitHistory.length,
        analyzedCommits: versionComparison.length,
        firstCommitDate: commitHistory.length > 0 ? commitHistory[commitHistory.length - 1].date : null,
        lastCommitDate: commitHistory.length > 0 ? commitHistory[0].date : null
      }
    };
  },
  
  /**
   * Git deposunu kontrol eder
   * @param {string} projectPath - Proje yolu
   * @returns {boolean} - Git deposu var mı?
   */
  checkGitRepository(projectPath) {
    try {
      const gitDir = path.join(projectPath, '.git');
      return fs.existsSync(gitDir);
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Commit geçmişini alır
   * @param {string} projectPath - Proje yolu
   * @returns {Array<Object>} - Commit geçmişi
   */
  getCommitHistory(projectPath) {
    try {
      // Son 20 commit'i al
      const command = 'git log -n 20 --pretty=format:"%h|%an|%ad|%s" --date=short';
      const output = execSync(command, { cwd: projectPath, encoding: 'utf8' });
      
      return output.split('\n').map(line => {
        const [hash, author, date, message] = line.split('|');
        return { hash, author, date, message };
      });
    } catch (error) {
      logError('Commit geçmişi alınırken hata oluştu:', error);
      return [];
    }
  },
  
  /**
   * Versiyonları karşılaştırır
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @param {Array<Object>} commitHistory - Commit geçmişi
   * @param {Object} options - Analiz seçenekleri
   * @returns {Array<Object>} - Versiyon karşılaştırması
   */
  async compareVersions(analyzer, commitHistory, options) {
    const versionComparison = [];
    
    // Analiz edilecek commit sayısını belirle
    const maxCommits = options.maxCommits || 5;
    const commitsToAnalyze = commitHistory.slice(0, Math.min(maxCommits, commitHistory.length));
    
    // Mevcut durumu kaydet
    const currentBranch = this.getCurrentBranch(analyzer.projectPath);
    
    try {
      // Her commit için analiz yap
      for (const commit of commitsToAnalyze) {
        logInfo(`${commit.hash} commit'i analiz ediliyor...`);
        
        // Commit'e geçiş yap
        this.checkoutCommit(analyzer.projectPath, commit.hash);
        
        // Analiz sonuçlarını al
        const analysisResults = await this.analyzeCommit(analyzer, commit);
        
        versionComparison.push({
          commit,
          results: analysisResults
        });
      }
    } catch (error) {
      logError('Versiyon karşılaştırması yapılırken hata oluştu:', error);
    } finally {
      // Orijinal branch'e geri dön
      this.checkoutBranch(analyzer.projectPath, currentBranch);
    }
    
    return versionComparison;
  },
  
  /**
   * Mevcut branch'i alır
   * @param {string} projectPath - Proje yolu
   * @returns {string} - Mevcut branch
   */
  getCurrentBranch(projectPath) {
    try {
      const command = 'git rev-parse --abbrev-ref HEAD';
      return execSync(command, { cwd: projectPath, encoding: 'utf8' }).trim();
    } catch (error) {
      logError('Mevcut branch alınırken hata oluştu:', error);
      return 'master'; // Varsayılan olarak master'a dön
    }
  },
  
  /**
   * Belirli bir commit'e geçiş yapar
   * @param {string} projectPath - Proje yolu
   * @param {string} commitHash - Commit hash'i
   */
  checkoutCommit(projectPath, commitHash) {
    try {
      const command = `git checkout ${commitHash} --force`;
      execSync(command, { cwd: projectPath, encoding: 'utf8' });
    } catch (error) {
      logError(`${commitHash} commit'ine geçiş yapılırken hata oluştu:`, error);
      throw error;
    }
  },
  
  /**
   * Belirli bir branch'e geçiş yapar
   * @param {string} projectPath - Proje yolu
   * @param {string} branch - Branch adı
   */
  checkoutBranch(projectPath, branch) {
    try {
      const command = `git checkout ${branch} --force`;
      execSync(command, { cwd: projectPath, encoding: 'utf8' });
    } catch (error) {
      logError(`${branch} branch'ine geçiş yapılırken hata oluştu:`, error);
    }
  },
  
  /**
   * Belirli bir commit'i analiz eder
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @param {Object} commit - Commit bilgisi
   * @returns {Object} - Analiz sonuçları
   */
  async analyzeCommit(analyzer, commit) {
    try {
      // Yeni bir analyzer instance oluştur
      const commitAnalyzer = analyzer.clone();
      
      // Analiz işlemini başlat
      await commitAnalyzer.analyze();
      
      // Temel metrikleri topla
      const metrics = {
        componentCount: commitAnalyzer.components.size,
        serverComponentCount: Array.from(commitAnalyzer.components.values()).filter(c => c.type === 'server').length,
        clientComponentCount: Array.from(commitAnalyzer.components.values()).filter(c => c.type === 'client').length,
        routeCount: 0,
        apiRouteCount: 0,
        pageRouteCount: 0,
        dynamicRouteCount: 0,
        staticRouteCount: 0
      };
      
      // Route sayılarını hesapla
      if (commitAnalyzer.appDir) {
        const appFiles = fs.existsSync(commitAnalyzer.appDir) ? 
          fs.readdirSync(commitAnalyzer.appDir, { recursive: true }) : [];
        
        metrics.routeCount += appFiles.filter(file => 
          file.endsWith('page.js') || file.endsWith('page.tsx') || 
          file.endsWith('route.js') || file.endsWith('route.tsx')
        ).length;
        
        metrics.apiRouteCount += appFiles.filter(file => 
          file.endsWith('route.js') || file.endsWith('route.tsx')
        ).length;
        
        metrics.pageRouteCount += appFiles.filter(file => 
          file.endsWith('page.js') || file.endsWith('page.tsx')
        ).length;
        
        metrics.dynamicRouteCount += appFiles.filter(file => 
          (file.includes('[') && file.includes(']')) && 
          (file.endsWith('page.js') || file.endsWith('page.tsx') || 
           file.endsWith('route.js') || file.endsWith('route.tsx'))
        ).length;
      }
      
      if (commitAnalyzer.pagesDir) {
        const pagesFiles = fs.existsSync(commitAnalyzer.pagesDir) ? 
          fs.readdirSync(commitAnalyzer.pagesDir, { recursive: true }) : [];
        
        metrics.routeCount += pagesFiles.filter(file => 
          (file.endsWith('.js') || file.endsWith('.tsx')) && 
          !file.startsWith('_')
        ).length;
        
        metrics.apiRouteCount += pagesFiles.filter(file => 
          (file.startsWith('api/') || file.includes('/api/')) && 
          (file.endsWith('.js') || file.endsWith('.tsx'))
        ).length;
        
        metrics.pageRouteCount += pagesFiles.filter(file => 
          !(file.startsWith('api/') || file.includes('/api/')) && 
          !file.startsWith('_') && 
          (file.endsWith('.js') || file.endsWith('.tsx'))
        ).length;
        
        metrics.dynamicRouteCount += pagesFiles.filter(file => 
          (file.includes('[') && file.includes(']')) && 
          (file.endsWith('.js') || file.endsWith('.tsx'))
        ).length;
      }
      
      metrics.staticRouteCount = metrics.routeCount - metrics.dynamicRouteCount;
      
      return {
        metrics,
        analyzer: commitAnalyzer
      };
    } catch (error) {
      logError(`${commit.hash} commit'i analiz edilirken hata oluştu:`, error);
      return {
        error: error.message
      };
    }
  },
  
  /**
   * Trend analizi yapar
   * @param {Array<Object>} versionComparison - Versiyon karşılaştırması
   * @returns {Object} - Trend analizi
   */
  analyzeTrends(versionComparison) {
    // Trend analizi için versiyon karşılaştırmasını ters çevir (en eskiden en yeniye)
    const sortedVersions = [...versionComparison].reverse();
    
    // Metrik değişimlerini hesapla
    const metricChanges = {};
    const metrics = [
      'componentCount',
      'serverComponentCount',
      'clientComponentCount',
      'routeCount',
      'apiRouteCount',
      'pageRouteCount',
      'dynamicRouteCount',
      'staticRouteCount'
    ];
    
    // Her metrik için değişimleri hesapla
    metrics.forEach(metric => {
      metricChanges[metric] = [];
      
      for (let i = 0; i < sortedVersions.length; i++) {
        const version = sortedVersions[i];
        
        if (version.results && version.results.metrics) {
          const value = version.results.metrics[metric];
          
          // Değişim yüzdesini hesapla
          let changePercent = 0;
          if (i > 0 && sortedVersions[i-1].results && sortedVersions[i-1].results.metrics) {
            const prevValue = sortedVersions[i-1].results.metrics[metric];
            if (prevValue > 0) {
              changePercent = ((value - prevValue) / prevValue) * 100;
            }
          }
          
          metricChanges[metric].push({
            commit: version.commit,
            value,
            changePercent: i > 0 ? changePercent : 0
          });
        }
      }
    });
    
    // Büyüme trendlerini analiz et
    const growthTrends = {};
    
    metrics.forEach(metric => {
      const values = metricChanges[metric].map(change => change.value);
      
      if (values.length >= 2) {
        const firstValue = values[0];
        const lastValue = values[values.length - 1];
        
        const totalGrowth = lastValue - firstValue;
        const totalGrowthPercent = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
        
        // Büyüme hızını hesapla
        const growthRate = totalGrowthPercent / (values.length - 1);
        
        // Büyüme trendini belirle
        let trend = 'stable';
        if (growthRate > 10) trend = 'rapid-growth';
        else if (growthRate > 5) trend = 'steady-growth';
        else if (growthRate < -10) trend = 'rapid-decline';
        else if (growthRate < -5) trend = 'steady-decline';
        else if (Math.abs(growthRate) <= 2) trend = 'stable';
        
        growthTrends[metric] = {
          firstValue,
          lastValue,
          totalGrowth,
          totalGrowthPercent,
          growthRate,
          trend
        };
      } else {
        growthTrends[metric] = {
          trend: 'unknown',
          reason: 'Yeterli veri yok'
        };
      }
    });
    
    return {
      metricChanges,
      growthTrends
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
      if (results.results.error) {
        return `# Zaman İçinde Değişim Analizi\n\nHata: ${results.results.error}\n`;
      }
      
      let output = '# Zaman İçinde Değişim Analizi\n\n';
      
      // Özet
      output += '## Özet\n\n';
      output += `Toplam ${results.metadata.totalCommits} commit incelendi, ${results.metadata.analyzedCommits} commit analiz edildi.\n`;
      output += `İlk commit tarihi: ${results.metadata.firstCommitDate}\n`;
      output += `Son commit tarihi: ${results.metadata.lastCommitDate}\n\n`;
      
      // Commit geçmişi
      output += '## Commit Geçmişi\n\n';
      results.results.commitHistory.slice(0, 10).forEach(commit => {
        output += `- **${commit.hash}** (${commit.date}) - ${commit.author}: ${commit.message}\n`;
      });
      
      if (results.results.commitHistory.length > 10) {
        output += `- ... ve ${results.results.commitHistory.length - 10} commit daha\n`;
      }
      
      output += '\n';
      
      // Metrik değişimleri
      output += '## Metrik Değişimleri\n\n';
      
      const metrics = [
        { key: 'componentCount', name: 'Toplam Komponent Sayısı' },
        { key: 'serverComponentCount', name: 'Server Komponent Sayısı' },
        { key: 'clientComponentCount', name: 'Client Komponent Sayısı' },
        { key: 'routeCount', name: 'Toplam Route Sayısı' },
        { key: 'apiRouteCount', name: 'API Route Sayısı' },
        { key: 'pageRouteCount', name: 'Sayfa Route Sayısı' },
        { key: 'dynamicRouteCount', name: 'Dinamik Route Sayısı' },
        { key: 'staticRouteCount', name: 'Statik Route Sayısı' }
      ];
      
      metrics.forEach(metric => {
        const changes = results.results.trendAnalysis.metricChanges[metric.key];
        const trend = results.results.trendAnalysis.growthTrends[metric.key];
        
        if (changes && changes.length > 0) {
          output += `### ${metric.name}\n\n`;
          
          // Trend özeti
          if (trend && trend.trend !== 'unknown') {
            output += `Trend: **${this.getTrendName(trend.trend)}**\n`;
            output += `İlk değer: ${trend.firstValue}, Son değer: ${trend.lastValue}\n`;
            output += `Toplam büyüme: ${trend.totalGrowth} (${trend.totalGrowthPercent.toFixed(2)}%)\n`;
            output += `Büyüme hızı: ${trend.growthRate.toFixed(2)}% / commit\n\n`;
          }
          
          // Değişim detayları
          output += 'Değişim Detayları:\n\n';
          changes.forEach(change => {
            const changeSymbol = change.changePercent > 0 ? '📈' : (change.changePercent < 0 ? '📉' : '➖');
            const changeText = change.changePercent !== 0 ? ` (${change.changePercent > 0 ? '+' : ''}${change.changePercent.toFixed(2)}%)` : '';
            
            output += `- ${change.commit.hash} (${change.commit.date}): ${change.value}${changeText} ${changeSymbol}\n`;
          });
          
          output += '\n';
        }
      });
      
      return output;
    },
    
    /**
     * HTML formatında görselleştirme
     * @param {Object} results - Analiz sonuçları
     * @returns {string} - HTML formatında görselleştirme
     */
    html(results) {
      if (results.results.error) {
        return `
<div class="history-container">
  <h2>Zaman İçinde Değişim Analizi</h2>
  <div class="error-message">
    <p>Hata: ${results.results.error}</p>
  </div>
</div>`;
      }
      
      // Chart.js için veri hazırla
      const metrics = [
        { key: 'componentCount', name: 'Toplam Komponent Sayısı', color: '#0070f3' },
        { key: 'serverComponentCount', name: 'Server Komponent Sayısı', color: '#ff0080' },
        { key: 'clientComponentCount', name: 'Client Komponent Sayısı', color: '#f5a623' },
        { key: 'routeCount', name: 'Toplam Route Sayısı', color: '#7928ca' },
        { key: 'apiRouteCount', name: 'API Route Sayısı', color: '#00a8ff' },
        { key: 'pageRouteCount', name: 'Sayfa Route Sayısı', color: '#ff4d4d' },
        { key: 'dynamicRouteCount', name: 'Dinamik Route Sayısı', color: '#50e3c2' },
        { key: 'staticRouteCount', name: 'Statik Route Sayısı', color: '#3291ff' }
      ];
      
      // Grafik verilerini hazırla
      const chartData = {};
      
      metrics.forEach(metric => {
        const changes = results.results.trendAnalysis.metricChanges[metric.key];
        
        if (changes && changes.length > 0) {
          chartData[metric.key] = {
            labels: changes.map(change => change.commit.date),
            datasets: [{
              label: metric.name,
              data: changes.map(change => change.value),
              borderColor: metric.color,
              backgroundColor: `${metric.color}33`,
              borderWidth: 2,
              fill: true,
              tension: 0.4
            }]
          };
        }
      });
      
      // HTML oluştur
      let html = `
<div class="history-container">
  <h2>Zaman İçinde Değişim Analizi</h2>
  
  <!-- Özet -->
  <div class="section">
    <h3>Özet</h3>
    <div class="summary">
      <p>Toplam <strong>${results.metadata.totalCommits}</strong> commit incelendi, <strong>${results.metadata.analyzedCommits}</strong> commit analiz edildi.</p>
      <p>İlk commit tarihi: <strong>${results.metadata.firstCommitDate}</strong></p>
      <p>Son commit tarihi: <strong>${results.metadata.lastCommitDate}</strong></p>
    </div>
  </div>
  
  <!-- Commit Geçmişi -->
  <div class="section">
    <h3>Commit Geçmişi</h3>
    <div class="commit-history">
      <ul class="commit-list">`;
      
      results.results.commitHistory.slice(0, 10).forEach(commit => {
        html += `
        <li class="commit-item">
          <span class="commit-hash">${commit.hash}</span>
          <span class="commit-date">${commit.date}</span>
          <span class="commit-author">${commit.author}</span>
          <span class="commit-message">${commit.message}</span>
        </li>`;
      });
      
      if (results.results.commitHistory.length > 10) {
        html += `
        <li class="commit-item more-commits">
          ... ve ${results.results.commitHistory.length - 10} commit daha
        </li>`;
      }
      
      html += `
      </ul>
    </div>
  </div>
  
  <!-- Metrik Değişimleri -->
  <div class="section">
    <h3>Metrik Değişimleri</h3>`;
      
      metrics.forEach(metric => {
        const changes = results.results.trendAnalysis.metricChanges[metric.key];
        const trend = results.results.trendAnalysis.growthTrends[metric.key];
        
        if (changes && changes.length > 0) {
          html += `
    <div class="metric-section">
      <h4>${metric.name}</h4>`;
          
          // Trend özeti
          if (trend && trend.trend !== 'unknown') {
            const trendClass = this.getTrendClass(trend.trend);
            const trendName = this.getTrendName(trend.trend);
            
            html += `
      <div class="trend-summary ${trendClass}">
        <p class="trend-label">Trend: <strong>${trendName}</strong></p>
        <p>İlk değer: <strong>${trend.firstValue}</strong>, Son değer: <strong>${trend.lastValue}</strong></p>
        <p>Toplam büyüme: <strong>${trend.totalGrowth}</strong> (${trend.totalGrowthPercent.toFixed(2)}%)</p>
        <p>Büyüme hızı: <strong>${trend.growthRate.toFixed(2)}%</strong> / commit</p>
      </div>`;
          }
          
          // Grafik
          html += `
      <div class="chart-container">
        <canvas id="chart-${metric.key}"></canvas>
      </div>
      
      <div class="change-details">
        <h5>Değişim Detayları</h5>
        <ul class="change-list">`;
          
          changes.forEach(change => {
            const changeClass = change.changePercent > 0 ? 'increase' : (change.changePercent < 0 ? 'decrease' : 'stable');
            const changeSymbol = change.changePercent > 0 ? '📈' : (change.changePercent < 0 ? '📉' : '➖');
            const changeText = change.changePercent !== 0 ? ` (${change.changePercent > 0 ? '+' : ''}${change.changePercent.toFixed(2)}%)` : '';
            
            html += `
          <li class="change-item ${changeClass}">
            <span class="change-commit">${change.commit.hash} (${change.commit.date})</span>
            <span class="change-value">${change.value}${changeText} ${changeSymbol}</span>
          </li>`;
          });
          
          html += `
        </ul>
      </div>
    </div>`;
        }
      });
      
      html += `
  </div>
  
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  <script>`;
      
      // Her metrik için grafik oluştur
      metrics.forEach(metric => {
        if (chartData[metric.key]) {
          html += `
    // ${metric.name} grafiği
    const ${metric.key}ChartCtx = document.getElementById('chart-${metric.key}').getContext('2d');
    new Chart(${metric.key}ChartCtx, {
      type: 'line',
      data: ${JSON.stringify(chartData[metric.key])},
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '${metric.name} Değişimi'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });`;
        }
      });
      
      html += `
  </script>
  
  <style>
    .history-container {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .commit-list {
      list-style: none;
      padding: 0;
      margin: 0;
      background-color: #f9f9f9;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .commit-item {
      padding: 10px 15px;
      border-bottom: 1px solid #eaeaea;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .commit-item:last-child {
      border-bottom: none;
    }
    
    .commit-hash {
      font-family: monospace;
      color: #0070f3;
      font-weight: bold;
    }
    
    .commit-date {
      color: #666;
    }
    
    .commit-author {
      font-weight: bold;
    }
    
    .metric-section {
      margin-bottom: 40px;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .trend-summary {
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .trend-rapid-growth {
      background-color: #d4edda;
      color: #155724;
    }
    
    .trend-steady-growth {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .trend-stable {
      background-color: #e8eaf6;
      color: #3f51b5;
    }
    
    .trend-steady-decline {
      background-color: #fff3cd;
      color: #856404;
    }
    
    .trend-rapid-decline {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    .chart-container {
      height: 300px;
      margin-bottom: 20px;
    }
    
    .change-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .change-item {
      padding: 8px 0;
      border-bottom: 1px solid #eaeaea;
      display: flex;
      justify-content: space-between;
    }
    
    .change-item:last-child {
      border-bottom: none;
    }
    
    .change-item.increase .change-value {
      color: #2e7d32;
    }
    
    .change-item.decrease .change-value {
      color: #c62828;
    }
    
    .change-item.stable .change-value {
      color: #3f51b5;
    }
    
    .change-commit {
      font-family: monospace;
    }
    
    .error-message {
      padding: 20px;
      background-color: #f8d7da;
      color: #721c24;
      border-radius: 8px;
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
    },
    
    /**
     * Trend sınıfını döndürür
     * @param {string} trend - Trend
     * @returns {string} - Trend sınıfı
     */
    getTrendClass(trend) {
      const classes = {
        'rapid-growth': 'trend-rapid-growth',
        'steady-growth': 'trend-steady-growth',
        'stable': 'trend-stable',
        'steady-decline': 'trend-steady-decline',
        'rapid-decline': 'trend-rapid-decline',
        'unknown': ''
      };
      
      return classes[trend] || '';
    },
    
    /**
     * Trend adını döndürür
     * @param {string} trend - Trend
     * @returns {string} - Trend adı
     */
    getTrendName(trend) {
      const names = {
        'rapid-growth': 'Hızlı Büyüme',
        'steady-growth': 'Düzenli Büyüme',
        'stable': 'Stabil',
        'steady-decline': 'Düzenli Azalma',
        'rapid-decline': 'Hızlı Azalma',
        'unknown': 'Bilinmiyor'
      };
      
      return names[trend] || 'Bilinmiyor';
    }
  }
};
