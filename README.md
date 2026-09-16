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

- `assets/garbage.bin`：20 MiB 随机不可压缩数据，作为测速文件（单文件低于 EdgeOne Pages 25 MB 限制）；
- 下载测试对**恒定 URL** 发起**多线程 Range 请求**（默认 6 线程、每段 8 MiB，按 Range 循环下载同一文件），URL 不带随机缓存破坏参数，保证每次请求都命中 EdgeOne 边缘缓存；
- `edgeone.json`：为 `/assets/*` 配置 `Cache-Control: max-age=31536000` 与边缘缓存 TTL，让测速文件长期缓存在全国 CDN 节点；
- 上传/延迟/抖动沿用 LibreSpeed 逻辑（上传测本地上行进度，不受服务端影响）。

如需调整下载参数：修改 `speedtest_worker.js` 中的 `dl_file_size_mb`（须与实际文件大小一致）和 `dl_range_mb`。

## 许可证

本项目基于 [LibreSpeed](https://github.com/librespeed/speedtest)，遵循其开源许可证。
