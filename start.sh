#!/bin/bash

# Docker 镜像管理器启动脚本

echo "🐳 Docker 镜像管理器"
echo "===================="
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误：未找到 Python3，请先安装 Python 3.8+"
    exit 1
fi

echo "✅ Python 版本：$(python3 --version)"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 警告：未找到 Docker，请确保 Docker 已安装并运行"
else
    echo "✅ Docker 版本：$(docker --version)"
fi

# 检查并安装依赖
echo ""
echo "📦 检查依赖..."
if [ ! -f "venv/bin/activate" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

pip install -q -r requirements.txt
echo "✅ 依赖已安装"

# 数据库迁移
echo ""
echo "🗄️ 数据库迁移..."
python manage.py makemigrations --quiet
python manage.py migrate --quiet
echo "✅ 数据库已就绪"

# 启动服务
echo ""
echo "🚀 启动服务..."
echo "访问地址：http://localhost:8000"
echo ""
python manage.py runserver 0.0.0.0:8000
