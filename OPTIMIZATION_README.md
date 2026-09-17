# EO测速延迟和抖动优化方案

## 问题分析

通过对比测试发现：
- **EO测速** (https://speedtest-eo.riku1998.cn/) 平均延迟：568.61ms，抖动：514.83ms
- **ESA测速** (https://speedtest.riku1998.cn/) 平均延迟：68.58ms，抖动：12.86ms

**EO测速比ESA测速慢8.29倍，抖动高达40倍！**

## 根本原因

1. **Edge Function冷启动延迟**：EO测速使用`edge-functions/ping.js`作为ping测试端点，每次请求都需要初始化JavaScript执行环境
2. **网络路由差异**：EdgeOne可能使用不同的网络路径，导致额外的延迟
3. **响应不一致性**：Edge Function的响应时间波动较大，导致高抖动

## 优化方案

### 主要优化（已实现）

1. **将ping测试从Edge Function改为静态文件**
   - 修改`speedtest_worker.js`中的`url_ping`设置：
     ```javascript
     // 从：
     url_ping: "ping", // Edge Function
     // 改为：
     url_ping: "empty.txt", // 静态文件
     ```

2. **优化缓存配置**
   - 在`edgeone.json`中添加empty.txt的缓存控制：
     ```json
     {
       "source": "/empty.txt",
       "headers": [
         { "key": "Cache-Control", "value": "no-store" }
       ]
     }
     ```

### 优化原理

- **静态文件响应更快**：不需要JavaScript执行环境初始化
- **响应一致性更好**：静态文件的响应时间更稳定，减少抖动
- **网络路径优化**：使用与下载测试相同的CDN缓存策略

### 预期效果

根据ESA测速的性能表现，优化后预计：
- **延迟降低87.9%**：从568.61ms降低到68-100ms
- **抖动降低97.5%**：从514.83ms降低到10-15ms
- **整体性能提升8倍**：达到与ESA测速相当的水平

## 部署步骤

1. 应用优化后的代码到EO测速项目
2. 重新部署到EdgeOne Pages
3. 验证优化效果

## 验证方法

```bash
# 测试优化后的延迟
curl -w "%{time_total}\n" -o /dev/null -s "https://speedtest-eo.riku1998.cn/empty.txt"

# 对比测试
for i in {1..10}; do 
  echo "Ping $i: $(curl -w "%{time_total}\n" -o /dev/null -s "https://speedtest-eo.riku1998.cn/empty.txt") ms"
done
```

## 性能对比表格

| 指标 | EO测速 (优化前) | ESA测速 | EO测速 (预期优化后) |
|------|----------------|---------|-------------------|
| 平均延迟 | 568.61 ms | 68.58 ms | 68-100 ms |
| 抖动 (std dev) | 514.83 ms | 12.86 ms | ":15 ms |
| 性能倍数 | 8.29x slower | 1x | 1-1.5x |

## 注意事项

1. **确保`empty.txt`文件存在**且内容为空（当前为1字节）
2. **验证CORS配置**：确保empty.txt允许跨域请求
3. **监控实际效果**：部署后需实际测试验证优化效果

## 源代码变更

具体变更见`speedtest_worker.js:50`和`edgeone.json`文件。