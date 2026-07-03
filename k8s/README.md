# Kubernetes 部署指南

## 快速部署

### 1. 部署到 K8s 集群

```bash
# 进入 k8s 目录
cd k8s

# 部署所有资源
kubectl apply -f daemonset.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml  # 可选，如果需要 Ingress 访问
```

### 2. 查看部署状态

```bash
# 查看命名空间
kubectl get namespace docker-images-manager

# 查看 DaemonSet
kubectl get daemonset -n docker-images-manager

# 查看 Pod 状态
kubectl get pods -n docker-images-manager -o wide

# 查看 Service
kubectl get svc -n docker-images-manager
```

### 3. 访问服务

#### 方式一：NodePort 访问
```bash
# 获取任意节点 IP
kubectl get nodes -o wide

# 访问地址：http://<NODE-IP>:30800
# 例如：http://192.168.1.100:30800
```

#### 方式二：Port-Forward 访问（本地测试）
```bash
# 选择一个 Pod
kubectl get pods -n docker-images-manager

# 端口转发
kubectl port-forward pod/<POD-NAME> -n docker-images-manager 8000:8000

# 访问 http://localhost:8000
```

#### 方式三：Ingress 访问（如果部署了 Ingress）
```bash
# 配置 hosts（如果需要）
echo "<INGRESS-IP> docker-images.local" | sudo tee -a /etc/hosts

# 访问 https://docker-images.local
```

## 配置说明

### DaemonSet 配置

- **Namespace**: `docker-images-manager`
- **ServiceAccount**: 自动创建并配置 RBAC 权限
- **Security Context**:
  - 非 root 用户运行（UID: 1000）
  - 禁止特权升级
  - 丢弃所有 capabilities
- **资源限制**:
  - CPU: 100m - 500m
  - 内存：128Mi - 512Mi
- **健康检查**:
  - Liveness Probe: 30 秒间隔
  - Readiness Probe: 15 秒间隔

### 卷挂载

- `/var/run/docker.sock`: 只读挂载，用于访问 Docker API
- `/app/data`: emptyDir，用于临时数据存储（内存模式）

### 节点亲和性

- 只部署在 Linux 节点
- 容忍 master/control-plane 节点的 taint

## 自定义配置

### 修改镜像

编辑 `daemonset.yaml`:
```yaml
spec:
  template:
    spec:
      containers:
        - name: docker-images-manager
          image: your-registry/docker-images-manager:tag
```

### 修改 NodePort

编辑 `service.yaml`:
```yaml
spec:
  ports:
    - nodePort: 30800  # 修改为你想要的端口
```

### 修改资源限制

编辑 `daemonset.yaml`:
```yaml
resources:
  requests:
    cpu: 200m      # 根据实际需求调整
    memory: 256Mi
  limits:
    cpu: 1000m
    memory: 1Gi
```

## 卸载

```bash
# 删除所有资源
kubectl delete -f daemonset.yaml
kubectl delete -f service.yaml
kubectl delete -f ingress.yaml

# 或者删除整个命名空间
kubectl delete namespace docker-images-manager
```

## 故障排查

### 查看 Pod 日志
```bash
kubectl logs -n docker-images-manager <POD-NAME>
```

### 查看 Pod 详情
```bash
kubectl describe pod -n docker-images-manager <POD-NAME>
```

### 进入容器调试
```bash
kubectl exec -it -n docker-images-manager <POD-NAME> -- /bin/bash
```

### 检查 Docker socket 权限
```bash
kubectl exec -n docker-images-manager <POD-NAME> -- id
kubectl exec -n docker-images-manager <POD-NAME> -- ls -la /var/run/docker.sock
```

## 注意事项

1. **Docker Socket 权限**: 容器需要访问宿主机的 `/var/run/docker.sock`
2. **安全性**: 使用非 root 用户运行，但访问 Docker socket 仍有较高权限
3. **资源消耗**: 每个节点运行一个 Pod，注意资源占用
4. **网络策略**: 确保节点防火墙允许 NodePort 端口访问
5. **持久化**: 当前使用 emptyDir，重启后数据会丢失（内存模式）

## 生产环境建议

1. **镜像仓库**: 使用私有镜像仓库
2. **TLS 加密**: 配置 Ingress TLS
3. **网络策略**: 配置 NetworkPolicy 限制访问
4. **监控告警**: 集成 Prometheus 监控
5. **日志收集**: 集成 ELK/Loki 日志系统
6. **备份策略**: 如果需要持久化，使用 PersistentVolume
