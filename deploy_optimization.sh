#!/bin/bash
# EO测速优化部署脚本
# 用于部署优化后的EO测速代码到EdgeOne Pages

echo "=========================================="
echo "EO测速延迟和抖动优化部署脚本"
echo "=========================================="

# 检查edgeone CLI是否安装
if ! command -v edgeone &> /dev/null; then
    echo "错误：edgeone CLI未安装"
    echo "请先安装：npm install -g @edgeone/cli"
    exit 1
fi

# 检查是否在项目目录中
if [ ! -f "edgeone.json" ]; then
    echo "错误：请在EO测速项目目录中运行此脚本"
    exit 1
fi

echo "1. 验证优化配置..."
echo "   检查empty.txt文件..."
if [ ! -f "empty.txt" ]; then
    echo "   创建empty.txt文件..."
    echo "" > empty.txt
fi

echo "   检查speedtest_worker.js配置..."
if grep -q 'url_ping: "empty.txt"' speedtest_worker.js; then
    echo "   ✓ ping测试已配置为静态文件"
else
    echo "   ✗ ping测试未正确配置"
    exit 1
fi

echo "   检查edgeone.json配置..."
if grep -q '"source": "/empty.txt"' edgeone.json; then
    echo "   ✓ empty.txt缓存配置已设置"
else
    echo "   ✗ empty.txt缓存配置缺失"
    exit 1
fi

echo ""
echo "2. 部署到EdgeOne Pages..."
echo "   执行：edgeone pages deploy -n speedtest"
echo ""
echo "注意：这将更新现有的测速网站"
echo "按Enter键继续部署，或Ctrl+C取消..."

read -r

# 执行部署
edgeone pages deploy -n speedtest

echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "优化验证步骤："
echo "1. 访问 https://speedtest-eo.riku1998.cn/"
echo "2. 运行测速测试，查看延迟和抖动"
echo "3. 对比优化前后的性能："
echo "   优化前：延迟568ms，抖动514ms"
echo "   优化后：预计延迟68-100ms，抖动10-15ms"
echo ""
echo "手动验证命令："
echo 'for i in {1..10}; do echo "Ping \$i: \$(curl -w "%{time_total}\\n" -o /dev/null -s https://speedtest-eo.riku1998.cn/empty.txt) ms"; done'
echo ""
echo "详细优化说明见 OPTIMIZATION_README.md"