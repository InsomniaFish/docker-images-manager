# Docker 镜像管理器 - 项目说明

## 📋 项目概述

这是一个基于 Django 框架开发的 Docker 镜像管理工具，提供直观的 Web 界面来查看、管理和删除主机上的 Docker 镜像。

## 🎯 核心功能

### 1. 镜像列表展示
- ✅ 自动扫描并列出所有 Docker 镜像
- ✅ 显示镜像详细信息：
  - 镜像名称（repository:tag）
  - 镜像 ID（短格式）
  - 镜像大小（自动格式化为 KB/MB/GB）
  - 创建时间
  - 使用状态（是否被容器使用）
  - 使用该镜像的容器数量

### 2. 镜像状态管理
- ✅ 实时检测镜像是否正在被容器使用
- ✅ 显示使用该镜像的容器数量
- ✅ 状态标识：
  - 🟢 使用中（绿色）- 有容器正在运行
  - 🔴 未使用（红色）- 无容器使用

### 3. 批量删除功能
- ✅ 勾选方式选择要删除的镜像
- ✅ 快捷选择功能：
  - 全选：选择所有镜像
  - 取消全选：清空所有选择
  - 选择未使用：智能选择所有未使用的镜像（推荐）
- ✅ 批量删除确认对话框
- ✅ 强制删除选项（可删除正在使用的镜像）
- ✅ 删除结果实时反馈

### 4. 实时刷新
- ✅ 一键刷新镜像列表
- ✅ AJAX 无刷新更新
- ✅ 实时统计信息更新

### 5. 统计信息
- ✅ 总镜像数量
- ✅ 正在使用的镜像数量
- ✅ 未使用的镜像数量
- ✅ 所有镜像的总大小

## 📁 项目结构

```
docker-images-manager/
├── docker_manager/              # Django 项目配置目录
│   ├── __init__.py
│   ├── settings.py             # 项目设置
│   ├── urls.py                 # 主 URL 路由
│   └── wsgi.py                 # WSGI 配置
│
├── images/                      # 镜像管理应用
│   ├── __init__.py
│   ├── apps.py                 # 应用配置
│   ├── models.py               # 数据模型
│   ├── views.py                # 视图处理
│   ├── urls.py                 # URL 路由
│   ├── docker_utils.py         # Docker 操作工具函数
│   └── templates/
│       └── images/
│           └── image_list.html # 主页面模板
│
├── static/                      # 静态文件目录
│   ├── css/
│   │   └── style.css           # 样式文件
│   └── js/
│       └── main.js             # 前端交互脚本
│
├── manage.py                    # Django 管理脚本
├── requirements.txt             # Python 依赖
├── README.md                    # 项目说明
├── INSTALL.sh                   # 安装指南
├── start.sh                     # 启动脚本
├── Dockerfile                   # Docker 镜像构建文件
├── docker-compose.yml           # Docker Compose 配置
└── .gitignore                   # Git 忽略文件
```

## 🔧 技术栈

### 后端
- **框架**: Django 4.2+
- **Docker 交互**: docker-py 6.0+
- **语言**: Python 3.8+
- **数据库**: SQLite（默认，可配置其他数据库）

### 前端
- **JavaScript**: 原生 ES6+
- **CSS**: CSS3 + Flexbox + Grid
- **AJAX**: Fetch API
- **UI**: 自定义响应式设计

## 🚀 快速开始

### 方法一：直接运行（推荐开发环境）

```bash
# 1. 安装依赖
pip3 install -r requirements.txt

# 2. 数据库迁移
python3 manage.py makemigrations
python3 manage.py migrate

# 3. 启动服务
python3 manage.py runserver 0.0.0.0:8000

# 4. 访问应用
# 浏览器打开：http://localhost:8000
```

### 方法二：使用 Docker Compose（推荐生产环境）

```bash
# 1. 构建并启动
docker-compose up -d

# 2. 访问应用
# 浏览器打开：http://localhost:8000

# 3. 查看日志
docker-compose logs -f

# 4. 停止服务
docker-compose down
```

## 📖 API 接口说明

### 1. 首页 - 镜像列表
**GET /**
- 功能：显示所有 Docker 镜像
- 返回：HTML 页面

### 2. 删除镜像
**POST /delete/**
- 功能：删除选中的镜像
- 请求体：
```json
{
    "image_ids": ["image_id1", "image_id2"],
    "force": false
}
```
- 返回：
```json
{
    "success": true,
    "message": "成功删除 2 个镜像",
    "messages": ["abc123: 删除成功", "def456: 删除成功"]
}
```

### 3. 刷新镜像列表
**POST /refresh/**
- 功能：刷新镜像列表（AJAX）
- 返回：JSON 格式的镜像列表和统计信息

## 💡 使用技巧

### 1. 安全删除
- 优先使用"选择未使用"功能
- 避免强制删除正在使用的镜像
- 删除前仔细检查选中的镜像

### 2. 批量操作
- 可以先"全选"，然后手动取消需要保留的镜像
- 使用"选择未使用"快速清理无用镜像

### 3. 状态查看
- 绿色"使用中"标识表示镜像正在被容器使用
- 红色"未使用"标识表示镜像可以安全删除
- 容器数量显示使用该镜像的容器总数

## ⚠️ 注意事项

### 1. Docker 权限
确保运行 Django 的用户有权限访问 Docker 守护进程：
```bash
# 将用户添加到 docker 组
sudo usermod -aG docker $USER

# 重新登录生效
```

### 2. 生产环境配置
修改 `docker_manager/settings.py`：
```python
# 修改 SECRET_KEY
SECRET_KEY = 'your-secret-key-here'

# 限制允许的主机
ALLOWED_HOSTS = ['your-domain.com', 'localhost', '127.0.0.1']

# 关闭 DEBUG
DEBUG = False
```

### 3. 数据库配置
默认使用 SQLite，如需使用其他数据库：
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'docker_manager',
        'USER': 'postgres',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### 4. 强制删除风险
⚠️ **警告**：强制删除正在使用的镜像可能导致：
- 容器无法启动
- 运行中的容器异常
- 数据丢失

请谨慎使用强制删除功能！

## 🔍 故障排除

### 问题 1：无法连接到 Docker
**错误**：`无法连接到 Docker 守护进程`

**解决方案**：
```bash
# 检查 Docker 服务状态
sudo systemctl status docker

# 启动 Docker 服务
sudo systemctl start docker

# 检查用户权限
groups $USER

# 添加用户到 docker 组
sudo usermod -aG docker $USER
```

### 问题 2：权限错误
**错误**：`Permission denied`

**解决方案**：
```bash
# 使用 sudo 运行
sudo python3 manage.py runserver

# 或者设置正确的权限
sudo chmod 666 /var/run/docker.sock
```

### 问题 3：端口被占用
**错误**：`Address already in use`

**解决方案**：
```bash
# 使用其他端口
python3 manage.py runserver 0.0.0.0:8080

# 或者查找并终止占用端口的进程
sudo lsof -i :8000
sudo kill -9 <PID>
```

### 问题 4：依赖安装失败
**错误**：`pip install` 失败

**解决方案**：
```bash
# 升级 pip
python3 -m pip install --upgrade pip

# 使用国内镜像
pip3 install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

## 📊 性能优化

### 1. 大量镜像优化
当主机上有大量镜像时（100+），可以考虑：
- 使用分页显示
- 添加搜索过滤功能
- 实现懒加载

### 2. 数据库优化
- 使用 PostgreSQL 替代 SQLite
- 添加数据库索引
- 实现缓存机制

## 🛡️ 安全建议

1. **访问控制**：添加用户认证系统
2. **HTTPS**：生产环境使用 HTTPS
3. **防火墙**：限制访问 IP
4. **日志审计**：记录所有删除操作
5. **定期备份**：备份重要数据

## 📝 开发计划

### 已实现
- ✅ 镜像列表展示
- ✅ 镜像状态检测
- ✅ 批量删除
- ✅ 强制删除
- ✅ 实时刷新
- ✅ 响应式 UI

### 计划中
- ⏳ 用户认证系统
- ⏳ 镜像搜索和过滤
- ⏳ 镜像详情页面
- ⏳ 容器管理功能
- ⏳ 镜像拉取功能
- ⏳ 操作日志记录
- ⏳ 多语言支持

## 📄 许可证

MIT License - 自由使用、修改和分发

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题或建议，请提交 Issue。
