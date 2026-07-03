from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
import json

from .docker_utils import get_all_images, delete_images, format_size


def image_list(request):
    """
    显示 Docker 镜像列表页面
    """
    try:
        images = get_all_images()
        
        # 计算总大小
        total_size = sum(img['size'] for img in images)
        total_size_formatted = format_size(total_size)
        
        # 统计正在使用的镜像数量
        used_count = sum(1 for img in images if img['is_used'])
        
        context = {
            'images': images,
            'total_count': len(images),
            'used_count': used_count,
            'unused_count': len(images) - used_count,
            'total_size': total_size_formatted,
        }
        
        return render(request, 'images/image_list.html', context)
    
    except Exception as e:
        error_message = str(e)
        return render(request, 'images/image_list.html', {
            'error': f'获取镜像列表失败：{error_message}',
            'images': [],
            'total_count': 0,
            'used_count': 0,
            'unused_count': 0,
            'total_size': '0 MB',
        })


@require_http_methods(["POST"])
@csrf_exempt
def delete_images_view(request):
    """
    删除选中的 Docker 镜像
    支持批量删除
    """
    try:
        data = json.loads(request.body)
        image_ids = data.get('image_ids', [])
        force = data.get('force', False)
        
        if not image_ids:
            return JsonResponse({
                'success': False,
                'message': '请选择要删除的镜像'
            })
        
        success_count, failed_count, messages_list = delete_images(image_ids, force)
        
        if success_count > 0 and failed_count == 0:
            return JsonResponse({
                'success': True,
                'message': f'成功删除 {success_count} 个镜像',
                'messages': messages_list
            })
        elif success_count > 0 and failed_count > 0:
            return JsonResponse({
                'success': True,
                'partial': True,
                'message': f'删除完成：成功 {success_count} 个，失败 {failed_count} 个',
                'messages': messages_list
            })
        else:
            return JsonResponse({
                'success': False,
                'message': f'删除失败，共 {failed_count} 个镜像删除失败',
                'messages': messages_list
            })
    
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': '无效的请求数据'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'删除失败：{str(e)}'
        })


@require_http_methods(["POST"])
@csrf_exempt
def refresh_images(request):
    """
    刷新镜像列表（用于 AJAX 请求）
    """
    try:
        images = get_all_images()
        
        # 格式化数据
        formatted_images = []
        for img in images:
            # 处理 repository 和 tag，确保 '<none>' 正确显示
            repository = img['repository'] if img['repository'] and img['repository'] != '<none>' else '<none>'
            tag = img['tag'] if img['tag'] and img['tag'] != '<none>' else '<none>'
            
            formatted_images.append({
                'id': img['id'],
                'short_id': img['short_id'],
                'repository': repository,
                'tag': tag,
                'full_name': f"{repository}:{tag}" if repository != '<none>' else '<none>:<none>',
                'size': format_size(img['size']),
                'size_bytes': img['size'],
                'created': img['created'].strftime('%Y-%m-%d %H:%M:%S') if img['created'] else 'Unknown',
                'is_used': img['is_used'],
                'containers_count': img['containers_count'],
                'full_tags': img['full_tags'],
            })
        
        total_size = sum(img['size_bytes'] for img in formatted_images)
        used_count = sum(1 for img in formatted_images if img['is_used'])
        
        return JsonResponse({
            'success': True,
            'images': formatted_images,
            'total_count': len(formatted_images),
            'used_count': used_count,
            'unused_count': len(formatted_images) - used_count,
            'total_size': format_size(total_size),
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'刷新失败：{str(e)}'
        })


@require_http_methods(["POST"])
@csrf_exempt
def pull_images_view(request):
    """
    批量拉取镜像
    """
    try:
        data = json.loads(request.body)
        image_names = data.get('image_names', [])
        
        if not image_names or not isinstance(image_names, list):
            return JsonResponse({
                'success': False,
                'message': '请提供有效的镜像名称列表'
            })
        
        # 过滤空字符串
        image_names = [name.strip() for name in image_names if name.strip()]
        
        if not image_names:
            return JsonResponse({
                'success': False,
                'message': '镜像名称列表不能为空'
            })
        
        from images.docker_utils import pull_images
        
        success_count, failed_count, results = pull_images(image_names)
        
        return JsonResponse({
            'success': success_count > 0 and failed_count == 0,
            'partial': success_count > 0 and failed_count > 0,
            'message': f'拉取完成：成功 {success_count} 个，失败 {failed_count} 个',
            'success_count': success_count,
            'failed_count': failed_count,
            'results': results,
        })
    
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': '无效的请求数据'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'拉取失败：{str(e)}'
        })


@require_http_methods(["POST"])
@csrf_exempt
def search_images_view(request):
    """
    搜索镜像
    """
    try:
        data = json.loads(request.body)
        search_term = data.get('search', '').strip().lower()
        
        if not search_term:
            # 如果搜索词为空，返回所有镜像
            images = get_all_images()
        else:
            # 获取所有镜像并过滤
            all_images = get_all_images()
            images = []
            
            for img in all_images:
                # 在 repository、tag、full_tags、id 中搜索
                searchable_fields = [
                    img.get('repository', '') or '',
                    img.get('tag', '') or '',
                    img.get('short_id', '') or '',
                ]
                
                # 添加所有 full_tags 中的标签
                if img.get('full_tags'):
                    searchable_fields.extend(img['full_tags'])
                
                # 检查是否匹配
                for field in searchable_fields:
                    if search_term in field.lower():
                        images.append(img)
                        break
        
        # 格式化返回结果
        formatted_images = []
        for img in images:
            repository = img['repository'] if img['repository'] and img['repository'] != '<none>' else '<none>'
            tag = img['tag'] if img['tag'] and img['tag'] != '<none>' else '<none>'
            
            formatted_images.append({
                'id': img['id'],
                'short_id': img['short_id'],
                'repository': repository,
                'tag': tag,
                'full_name': f"{repository}:{tag}" if repository != '<none>' else '<none>:<none>',
                'size': format_size(img['size']),
                'size_bytes': img['size'],
                'created': img['created'].strftime('%Y-%m-%d %H:%M:%S') if img['created'] else 'Unknown',
                'is_used': img['is_used'],
                'containers_count': img['containers_count'],
                'full_tags': img['full_tags'],
            })
        
        total_size = sum(img['size_bytes'] for img in formatted_images)
        used_count = sum(1 for img in formatted_images if img['is_used'])
        
        return JsonResponse({
            'success': True,
            'images': formatted_images,
            'total_count': len(formatted_images),
            'used_count': used_count,
            'unused_count': len(formatted_images) - used_count,
            'total_size': format_size(total_size),
            'search_term': search_term,
        })
    
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': '无效的请求数据'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'搜索失败：{str(e)}'
        })

