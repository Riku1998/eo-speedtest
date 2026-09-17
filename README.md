# EdgeOne Speedtest

一个基于 [LibreSpeed](https://github.com/librespeed/speedtest) 的网页版网络速度测试工具，可以快速部署在 EdgeOne 上，用于测试网络的下载速度、上传速度、延迟和抖动。

![测速结果示例](/assets/screenshot.png)

## 部署方法

clone 项目并进入项目目录：
``` sh
edgeone pages deploy -n speedtest
```

即可完成部署。

## 下载测速原理（本 fork 的修改）

原 LibreSpeed 依赖后端动态接口（`garbage.php` / `empty.php`）生成数据流，而纯静态的 EdgeOne Pages 没有这些接口：下载测速会反复请求不存在的路径、拿到 404 小页面，导致**下载速度严重偏低、上传正常**。

本 fork 改为**纯静态 + CDN 缓存下载**，链路为「用户 → 就近 EdgeOne CDN 节点 → 缓存测速文件」：

- `assets/garbage.bin`：24 MiB 随机不可压缩数据，作为测速文件（单文件低于 EdgeOne Pages 25 MB 限制）；
- 下载测试对**恒定 URL** 发起**多线程 Range 请求**（默认 6 线程、每段 12 MiB，按 Range 循环下载同一文件），URL 不带随机缓存破坏参数，保证每次请求都命中 EdgeOne 边缘缓存；
- `edgeone.json`：为 `/assets/*` 配置 `Cache-Control: max-age=31536000` 与边缘缓存 TTL，让测速文件长期缓存在全国 CDN 节点；
- 上传/延迟/抖动沿用 LibreSpeed 逻辑（上传测本地上行进度，不受服务端影响）。

如需调整下载参数：修改 `speedtest_worker.js` 中的 `dl_file_size_mb`（须与实际文件大小一致）和 `dl_range_mb`。

## 延迟和抖动优化（关键改进）

### 问题发现

通过对比测试发现显著性能差异：
- **EO测速** (https://speedtest-eo.riku1998.cn/) 平均延迟：568.61ms，抖动：514.83ms
- **ESA测速** (https://speedtest.riku1998.cn/) 平均延迟：68.58ms，抖动：12.86ms

**EO测速比ESA测速慢8.29倍，抖动高达40倍！**

### 根本原因分析

1. **节点位置差异**：
   - ESA IP：120.226.190.41（湖南移动本地节点）
   - EO IP：211.136.106.223（远方节点）
   - 用户实测ping数据：ESA 3-4ms，EO 25-26ms

2. **免费版EdgeOne限制**：
   - 免费版可能没有长沙CDN节点
   - 路由到更远的节点（上海或北京）

### 优化方案演进

#### 第一阶段：Edge Function vs 静态文件（已废弃）
- **测试发现**：原始Edge Function (123.05ms) 比静态文件 empty.txt (147.05ms) 更快
- **创建优化**：`ping-optimized.js` 返回最小化204响应
- **结论**：Edge Function有冷启动延迟，优化有限

#### 第二阶段：ESA模式复制（当前使用）
- **发现**：ESA使用不存在的 `backend/empty.php` 文件
- **原理**：CDN返回404页面，跳过动态处理
- **实现**：
  - 修改 `speedtest_worker.js` 中 `url_ping: "backend/empty.php"`
  - 配置 `edgeone.json` 路由 `backend/empty.php` 到 `optimized-404` 函数
  - `optimized-404.js` 返回最小化404响应

#### 第三阶段：配置优化
1. **统一文件路径**：删除重复的 `garbage.bin`，统一使用 `assets/garbage.bin`
2. **清理无用文件**：
   - `edge-functions/ping.js`、`ping-optimized.js`（过时）
   - `test_image.html`（仅测试用）
   - `deploy_optimization.sh`（过时部署脚本）

### 当前配置
- **Ping端点**：`backend/empty.php`（ESA风格，返回最小化404响应）
- **下载文件**：`assets/garbage.bin`（24MB测速文件）
- **备用方案**：`empty.txt`（1字节静态文件）
- **延迟优化效果**：从568ms优化到80ms（湖南长沙移动网络实测）

### 性能对比表格

| 指标 | EO测速 (优化前) | ESA测速 | EO测速 (当前优化后) |
|------|----------------|---------|-------------------|
| 平均延迟 | 568.61 ms | 68.58 ms | ~80 ms |
| 抖动 (std dev) | 514.83 ms | 12.86 ms | ~20 ms |
| 性能倍数 | 8.29x slower | 1x | ~1.2x |

### 剩余挑战
- **节点位置限制**：免费版EdgeOne在湖南长沙可能无本地节点
- **网络路由差异**：EO和ESA使用不同网络路径
- **物理延迟差距**：EO IPv4 ping 25-26ms vs ESA IPv4 ping 3-4ms

### 后续优化方向
1. **CDN节点优化**：检查EdgeOne节点分布，考虑付费版或补充CDN
2. **混合部署**：Ping端点部署在本地服务器，测速文件使用CDN
3. **算法调优**：调整测速权重和连接参数

## 许可证

本项目基于 [LibreSpeed](https://github.com/librespeed/speedtest)，遵循其开源许可证。