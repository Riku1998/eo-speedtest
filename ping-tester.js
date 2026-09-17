/**
 * EdgeOne Ping Tester
 * 独立的延迟和抖动测试库
 * 从用户浏览器直接测试到EdgeOne边缘节点的HTTP延迟
 */

class PingTester {
  constructor(options = {}) {
    this.options = {
      url: 'https://speedtest-eo.riku1998.cn/backend/empty.php',
      pingCount: 10,
      timeout: 10000,
      usePerformanceApi: true,
      ...options
    };
    
    this.results = {
      latencies: [],
      jitters: [],
      averageLatency: null,
      averageJitter: null,
      minLatency: null,
      maxLatency: null,
      success: false,
      error: null
    };
  }

  /**
   * 执行ping测试
   */
  async test() {
    this.results = {
      latencies: [],
      jitters: [],
      averageLatency: null,
      averageJitter: null,
      minLatency: null,
      maxLatency: null,
      success: false,
      error: null
    };

    try {
      // 预测试，确保URL可访问
      await this._preflightCheck();
      
      // 执行多次ping测试
      await this._executePings();
      
      // 计算结果
      this._calculateResults();
      
      this.results.success = true;
      return this.results;
    } catch (error) {
      this.results.error = error.message;
      throw error;
    }
  }

  /**
   * 预测试检查
   */
  async _preflightCheck() {
    try {
      const response = await fetch(this.options.url, {
        method: 'HEAD',
        mode: 'no-cors' // 使用no-cors避免CORS问题
      });
      return true;
    } catch (error) {
      // 即使no-cors失败，我们仍然可以尝试正常请求
      try {
        const response = await fetch(this.options.url, {
          method: 'HEAD'
        });
        return true;
      } catch (secondError) {
        throw new Error(`无法访问测试URL: ${this.options.url} (${secondError.message})`);
      }
    }
  }

  /**
   * 执行多次ping测试
   */
  async _executePings() {
    const latencies = [];
    
    for (let i = 0; i < this.options.pingCount; i++) {
      try {
        const latency = await this._measureSinglePing();
        latencies.push(latency);
        
        // 计算即时抖动（与前一个ping的差异）
        if (latencies.length >= 2) {
          const jitter = Math.abs(latency - latencies[latencies.length - 2]);
          this.results.jitters.push(jitter);
        }
        
        // 短暂暂停，避免请求过密
        if (i < this.options.pingCount - 1) {
          await this._sleep(100);
        }
      } catch (error) {
        console.warn(`第${i + 1}次ping测试失败:`, error.message);
        // 继续测试，除非连续失败多次
      }
    }
    
    this.results.latencies = latencies;
  }

  /**
   * 测量单次ping延迟
   */
  async _measureSinglePing() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
    
    const start = performance.now();
    
    try {
      // 使用HEAD方法，减少数据传输
      const response = await fetch(this.options.url, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store'
        }
      });
      
      const end = performance.now();
      clearTimeout(timeoutId);
      
      let latency = end - start;
      
      // 如果支持Performance API，尝试获取更精确的时间
      if (this.options.usePerformanceApi && performance.getEntries) {
        try {
          const entries = performance.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry && lastEntry.responseStart && lastEntry.requestStart) {
            const perfLatency = lastEntry.responseStart - lastEntry.requestStart;
            if (perfLatency > 0 && perfLatency < latency) {
              latency = perfLatency;
            }
          }
        } catch (e) {
          // Performance API不可用，使用默认测量
        }
      }
      
      return latency;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 计算结果
   */
  _calculateResults() {
    if (this.results.latencies.length === 0) {
      throw new Error('没有有效的ping测试结果');
    }
    
    const latencies = this.results.latencies;
    
    // 计算平均延迟
    const sum = latencies.reduce((a, b) => a + b, 0);
    this.results.averageLatency = sum / latencies.length;
    
    // 计算最小和最大延迟
    this.results.minLatency = Math.min(...latencies);
    this.results.maxLatency = Math.max(...latencies);
    
    // 计算平均抖动
    if (this.results.jitters.length > 0) {
      const jitterSum = this.results.jitters.reduce((a, b) => a + b, 0);
      this.results.averageJitter = jitterSum / this.results.jitters.length;
    } else {
      this.results.averageJitter = 0;
    }
  }

  /**
   * 辅助函数：等待
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取格式化的结果
   */
  getFormattedResults() {
    if (!this.results.success) {
      return { error: this.results.error || '测试未完成' };
    }
    
    return {
      success: true,
      latency: {
        average: Math.round(this.results.averageLatency * 100) / 100,
        min: Math.round(this.results.minLatency * 100) / 100,
        max: Math.round(this.results.maxLatency * 100) / 100,
        unit: 'ms'
      },
      jitter: {
        average: Math.round(this.results.averageJitter * 100) / 100,
        unit: 'ms'
      },
      sampleCount: this.results.latencies.length,
      rawLatencies: this.results.latencies.map(l => Math.round(l *155) / 100)
    };
  }
}

/**
 * 快速测试函数
 */
export async function testEdgeOneLatency(options = {}) {
  const tester = new PingTester(options);
  const results = await tester.test();
  return tester.getFormattedResults();
}

/**
 * 简化API：直接测试延迟
 */
export async function getLatency(url = 'https://speedtest-eo.riku1998.cn/backend/empty.php') {
  const tester = new PingTester({ url });
  const results = await tester.test();
  return results.averageLatency;
}

// 默认导出
export default PingTester;