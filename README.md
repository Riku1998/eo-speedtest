# EdgeOne Speedtest

基于 [LibreSpeed](https://github.com/librespeed/speedtest) 的网页版网络速度测试工具，部署在 EdgeOne 上。

![测速结果示例](/assets/screenshot.png)

## 部署方法

```bash
edgeone pages deploy -n speedtest
```

## 下载测速原理

原 LibreSpeed 依赖后端动态接口生成数据流，而纯静态的 EdgeOne Pages 没有这些接口，导致下载速度严重偏低。

本 fork 改为**纯静态 + CDN 缓存下载**：

- `assets/garbage.bin`：24 MiB 随机不可压缩数据
- 下载测试对恒定 URL 发起多线程 Range 请求，命中 EdgeOne 边缘缓存
- `edgeone.json` 为 `/assets/*` 配置长期缓存
- 上传/延迟/抖动沿用 LibreSpeed 逻辑

如需调整下载参数：修改 `speedtest_worker.js` 中的 `dl_file_size_mb` 和 `dl_range_mb`。

## 延迟和抖动优化

### 问题发现

对比测试发现性能差异显著：
- **EO测速**：平均延迟：568.61ms，抖动：514.83ms
- **ESA测速**：平均延迟：68.58ms，抖动：12.86ms

**EO测速比ESA测速慢8.29倍，抖动高达40倍。**

### 优化方案

**第一阶段**：测试 Edge Function vs 静态文件  
发现 Edge Function (123.05ms) 比静态文件 (147.05ms) 更快，但有冷启动延迟。

**第二阶段**：ESA模式复制  
发现 ESA 使用不存在的 `backend/empty.php` 文件，CDN 返回 404 页面，跳过动态处理。

**实现**：
- 修改 `speedtest_worker.js` 中 `url_ping: "backend/empty.php"`
- 配置 `edgeone.json` 路由到 `optimized-404` 函数
- `optimized-404.js` 返回最小化 404 响应

**第三阶段**：配置优化  
- 统一文件路径：删除重复 `garbage.bin`，使用 `assets/garbage.bin`
- 清理无用文件：过时的 Edge Functions 和测试文件

### 当前配置

- **Ping端点**：`backend/empty.php`（返回最小化 404 响应）
- **下载文件**：`assets/garbage.bin`（24MB 测速文件）
- **备用方案**：`empty.txt`（1 字节静态文件）
- **优化效果**：延迟从 568ms 优化到 80ms

### 性能对比

| 指标 | EO测速（优化前） | ESA测速 | EO测速（优化后） |
|------|----------------|---------|----------------|
| 平均延迟 | 568.61 ms | 68.58 ms | ~80 ms |
| 抖动 | 514.83 ms | 12.86 ms | ~20 ms |
| 性能倍数 | 8.29x slower | 1x | ~1.2x |

## 许可证

基于 [LibreSpeed](https://github.com/librespeed/speedtest)，遵循其开源许可证。