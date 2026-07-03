import docker
from datetime import datetime
from django.utils import timezone


def get_docker_client():
    """获取 Docker 客户端"""
    try:
        client = docker.from_env()
        return client
    except Exception as e:
        raise Exception(f"无法连接到 Docker 守护进程：{str(e)}")


def get_all_images():
    """
    获取所有 Docker 镜像信息
    返回：镜像列表，每个镜像包含以下字段：
    - id: 镜像 ID
    - repository: 仓库名
    - tag: 标签
    - size: 大小（字节）
    - created: 创建时间
    - is_used: 是否被容器使用
    - containers_count: 使用该镜像的容器数量
    """
    client = get_docker_client()
    images = client.images.list()
    
    result = []
    for image in images:
        attrs = image.attrs
        
        # 获取仓库和标签信息
        repo_tags = attrs.get('RepoTags', [])
        if repo_tags and repo_tags[0] != '<none>:<none>':
            repository = repo_tags[0].rsplit(':', 1)[0] if ':' in repo_tags[0] else repo_tags[0]
            tag = repo_tags[0].rsplit(':', 1)[1] if ':' in repo_tags[0] else 'latest'
        else:
            repository = '<none>'  # 使用字符串而不是 None
            tag = '<none>'  # 显示为 <none> 而不是 latest
        
        # 获取镜像 ID
        image_id = attrs.get('Id', '')
        if image_id.startswith('sha256:'):
            image_id = image_id[7:]
        
        # 获取大小
        size = attrs.get('Size', 0)
        
        # 获取创建时间
        created_timestamp = attrs.get('Created', 0)
        created = None
        if created_timestamp:
            try:
                # 如果是字符串（ISO 格式），转换为 datetime
                if isinstance(created_timestamp, str):
                    # 处理 ISO 8601 格式
                    created_timestamp = created_timestamp.replace('Z', '+00:00')
                    created = datetime.fromisoformat(created_timestamp)
                # 如果是数字（时间戳），转换为 datetime
                elif isinstance(created_timestamp, (int, float)):
                    created = datetime.fromtimestamp(created_timestamp)
            except Exception:
                created = None
        
        # 检查是否被容器使用
        containers = client.containers.list(all=True, filters={'ancestor': image.id})
        is_used = len(containers) > 0
        containers_count = len(containers)
        
        result.append({
            'id': image_id,
            'short_id': image.short_id.replace('sha256:', '') if image.short_id.startswith('sha256:') else image.short_id,
            'repository': repository,
            'tag': tag,
            'size': int(size),  # 确保是整数
            'created': created,
            'is_used': is_used,
            'containers_count': int(containers_count),  # 确保是整数
            'full_tags': repo_tags,
        })
    
    return result


def delete_image(image_id, force=False):
    """
    删除 Docker 镜像
    :param image_id: 镜像 ID 或名称:标签
    :param force: 是否强制删除
    :return: (success: bool, message: str)
    """
    try:
        client = get_docker_client()
        
        # 检查是否有容器正在使用该镜像
        if not force:
            containers = client.containers.list(all=True, filters={'ancestor': image_id})
            if containers:
                container_names = [c.name for c in containers]
                return False, f"镜像正在被以下容器使用：{', '.join(container_names)}。请先停止/删除这些容器或使用强制删除。"
        
        # 删除镜像
        client.images.remove(image_id, force=force)
        return True, "镜像删除成功"
    
    except docker.errors.APIError as e:
        return False, f"Docker API 错误：{str(e)}"
    except docker.errors.NotFound:
        return False, "镜像不存在"
    except Exception as e:
        return False, f"删除失败：{str(e)}"


def delete_images(image_ids, force=False):
    """
    批量删除 Docker 镜像
    :param image_ids: 镜像 ID 列表
    :param force: 是否强制删除
    :return: (success_count: int, failed_count: int, messages: list)
    """
    success_count = 0
    failed_count = 0
    messages = []
    
    for image_id in image_ids:
        success, message = delete_image(image_id, force)
        if success:
            success_count += 1
        else:
            failed_count += 1
        messages.append(f"{image_id[:12]}: {message}")
    
    return success_count, failed_count, messages


def pull_image(image_name):
    """
    拉取 Docker 镜像
    :param image_name: 镜像名称（可以是 repository:tag 格式）
    :return: (success: bool, message: str, image_data: dict or None)
    """
    try:
        client = get_docker_client()
        
        # 拉取镜像
        image = client.images.pull(image_name)
        
        # 获取镜像信息
        attrs = image.attrs
        repo_tags = attrs.get('RepoTags', [])
        
        if repo_tags and repo_tags[0] != '<none>:<none>':
            repository = repo_tags[0].rsplit(':', 1)[0] if ':' in repo_tags[0] else repo_tags[0]
            tag = repo_tags[0].rsplit(':', 1)[1] if ':' in repo_tags[0] else 'latest'
        else:
            repository = '<none>'
            tag = '<none>'
        
        image_id = attrs.get('Id', '')
        if image_id.startswith('sha256:'):
            image_id = image_id[7:]
        
        size = attrs.get('Size', 0)
        
        # 检查是否被容器使用
        containers = client.containers.list(all=True, filters={'ancestor': image.id})
        is_used = len(containers) > 0
        containers_count = len(containers)
        
        image_data = {
            'id': image_id,
            'short_id': image.short_id.replace('sha256:', '') if image.short_id.startswith('sha256:') else image.short_id,
            'repository': repository,
            'tag': tag,
            'size': int(size),
            'created': None,
            'is_used': is_used,
            'containers_count': int(containers_count),
            'full_tags': repo_tags,
        }
        
        return True, f"镜像 {image_name} 拉取成功", image_data
    
    except docker.errors.APIError as e:
        return False, f"Docker API 错误：{str(e)}", None
    except docker.errors.ImageNotFound:
        return False, f"镜像 {image_name} 不存在", None
    except Exception as e:
        return False, f"拉取失败：{str(e)}", None


def pull_images(image_names):
    """
    批量拉取 Docker 镜像
    :param image_names: 镜像名称列表
    :return: (success_count: int, failed_count: int, results: list)
    """
    success_count = 0
    failed_count = 0
    results = []
    
    for image_name in image_names:
        success, message, image_data = pull_image(image_name)
        if success:
            success_count += 1
            results.append({
                'image_name': image_name,
                'success': True,
                'message': message,
                'data': image_data,
            })
        else:
            failed_count += 1
            results.append({
                'image_name': image_name,
                'success': False,
                'message': message,
                'data': None,
            })
    
    return success_count, failed_count, results


def format_size(size_bytes):
    """格式化字节大小为人类可读的格式"""
    if size_bytes < 1024 * 1024:
        return f"{round(size_bytes / 1024, 2)} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{round(size_bytes / 1024 / 1024, 2)} MB"
    else:
        return f"{round(size_bytes / 1024 / 1024 / 1024, 2)} GB"
