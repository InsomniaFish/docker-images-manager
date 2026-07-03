from django.db import models


class DockerImage(models.Model):
    """
    Docker 镜像模型 - 用于缓存镜像信息
    """
    repository = models.CharField(max_length=255, blank=True, null=True)
    tag = models.CharField(max_length=128, default='latest')
    image_id = models.CharField(max_length=128, unique=True)
    size = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(null=True, blank=True)
    is_used = models.BooleanField(default=False)
    containers_count = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'docker_images'
        ordering = ['-last_updated']

    def __str__(self):
        if self.repository:
            return f"{self.repository}:{self.tag}"
        return f"{self.image_id[:12]}"

    def get_size_mb(self):
        """返回 MB 为单位的大小"""
        return round(self.size / 1024 / 1024, 2)

    def get_size_gb(self):
        """返回 GB 为单位的大小"""
        return round(self.size / 1024 / 1024 / 1024, 2)

    def get_formatted_size(self):
        """返回格式化后的大小字符串"""
        if self.size >= 1024 * 1024 * 1024:
            return f"{self.get_size_gb()} GB"
        else:
            return f"{self.get_size_mb()} MB"
