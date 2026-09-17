# EdgeOne Speedtest

基于 [LibreSpeed](https://github.com/librespeed/speedtest) 的网页版网络速度测试工具，部署在 EdgeOne 上。

![测速结果示例](/assets/screenshot.png)

## 部署方法

```bash
edgeone pages deploy -n speedtest
```

## 测速原理

### 下载测试
- **文件**：`assets/garbage.bin`（24 MiB 随机数据）
- **原理**：多线程 Range 请求，命中 CDN 缓存
- **配置**：`edgeone.json` 为 `/assets/*` 配置长期缓存

### 上传测试
- **文件**：`empty.txt`（1 字节空文件）
- **原理**：POST 请求上传小文件，测量上行速度
- **配置**：随机参数防止缓存

### 延迟测试
- **端点**：`backend/empty.php`（不存在的文件）
- **原理**：CDN 返回 404 响应，跳过动态处理
- **配置**：路由到优化的 404 函数，返回最小化响应

### 延迟优化
通过使用 ESA 模式（不存在的文件返回 404），延迟从 568ms 优化到 80ms。

## 新增功能：独立Ping测试

### Ping Tester

独立的延迟测试库，可直接测试用户浏览器到 EdgeOne 节点的 HTTP 延迟。

#### 使用方法

```html
<script src="ping-tester.js"></script>
<script>
  const tester = new PingTester();
  const results = await tester.test();
  console.log('延迟:', results.averageLatency + 'ms');
</script>
```

#### API

```javascript
// 快速测试
import { testEdgeOneLatency } from './ping-tester.js';
const results = await testEdgeOneLatency();

// 自定义配置
const tester = new PingTester({
  url: 'your-endpoint-url',
  pingCount: 5,
  timeout: 5000
});
```

#### 演示

查看 [simple-ping-test.html](simple-ping-test.html) 了解基础用法。

### 特性

- **真实测量**：从用户浏览器直接测试 HTTP 延迟
- **独立运行**：无需修改现有测速代码
- **精度优化**：使用 Performance API 提高测量精度
- **轻量级**：文件大小仅 ~5KB

## 文件结构

```
eo-speedtest/
├── index.html              # 主页面
├── speedtest.js           # LibreSpeed主脚本
├── speedtest_worker.js    # 测速工作脚本（已优化）
├── ping-tester.js         # 独立延迟测试库
├── simple-ping-test.html  # Ping测试演示
├── edgeone.json           # EdgeOne配置
├── assets/
│   ├── garbage.bin        # 24MB测速文件（下载测试）
│   └── screenshot.png    # 示例截图
├── edge-functions/
│   └── optimized-404.js  # 优化的404响应（ping测试）
└── empty.txt             # 1字节文件（上传测试）
```

## 配置说明

| 测试类型 | 使用文件/端点 | 原理 |
|---------|-------------|------|
| 下载测试 | `assets/garbage.bin` | 大文件多线程下载，CDN缓存 |
| 上传测试 | `empty.txt` | 小文件上传，测量上行速度 |
| 延迟测试 | `backend/empty.php` | 不存在的文件，返回优化404 |

## 许可证

基于 [LibreSpeed](https://github.com/librespeed/speedtest)，遵循其开源许可证。