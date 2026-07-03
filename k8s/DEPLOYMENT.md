# 多节点部署说明

## 架构说明

本部署方案为每个 Kubernetes 节点创建独立的 Deployment 和 Service，实现节点隔离：

- **Master01**: Deployment + Service (NodePort: 30801)
- **Node01**: Deployment + Service (NodePort: 30802)
- **Node02**: Deployment + Service (NodePort: 30803)

## 部署结构

```
┌─────────────────────────────────────────────────────────┐
│                   Kubernetes Cluster                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Master01   │  │   Node01    │  │   Node02    │     │
│  │ 192.168.48.30│  │192.168.48.31│  │192.168.48.32│     │
│  │             │  │             │  │             │     │
│  │ Deployment  │  │ Deployment  │  │ Deployment  │     │
│  │   Pod:1     │  │   Pod:1     │  │   Pod:1     │     │
│  │             │  │             │  │             │     │
│  │ NodePort    │  │ NodePort    │  │ NodePort    │     │
│  │  :30801     │  │  :30802     │  │  :30803     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 访问方式

### 按节点访问

| 节点 | 服务名 | NodePort | 访问地址 |
|------|--------|----------|----------|
| Master01 | dim-master01 | 30801 | http://192.168.48.30:30801 |
| Node01 | dim-node01 | 30802 | http://192.168.48.31:30802 |
| Node02 | dim-node02 | 30803 | http://192.168.48.32:30803 |

### 验证命令

```bash
# 查看 Pod 状态
kubectl get pods -n docker-images-manager -o wide

# 查看 Service
kubectl get svc -n docker-images-manager

# 查看 Endpoints
kubectl get endpoints -n docker-images-manager

# 测试 Master01
curl http://192.168.48.30:30801/refresh/ -X POST -H "Content-Type: application/json"

# 测试 Node01
curl http://192.168.48.31:30802/refresh/ -X POST -H "Content-Type: application/json"

# 测试 Node02
curl http://192.168.48.32:30803/refresh/ -X POST -H "Content-Type: application/json"
```

## 技术实现

### 1. Deployment 配置

每个节点的 Deployment 使用 `nodeSelector` 指定运行节点：

```yaml
nodeSelector:
  kubernetes.io/hostname: master01  # 或 node01, node02
```

### 2. Pod 标签

每个 Pod 带有节点标签：

```yaml
labels:
  app: docker-images-manager
  node: master01  # 或 node01, node02
```

### 3. Service 选择器

每个 Service 只选择对应节点的 Pod：

```yaml
selector:
  app: docker-images-manager
  node: master01  # 精确匹配
```

## 部署步骤

```bash
# 1. 删除旧的 DaemonSet（如果存在）
kubectl delete daemonset docker-images-manager -n docker-images-manager

# 2. 部署新的 Deployments
kubectl apply -f deployments.yaml

# 3. 部署 Services
kubectl apply -f services-nodeport.yaml

# 4. 验证部署
kubectl get pods -n docker-images-manager -o wide
kubectl get svc -n docker-images-manager
kubectl get endpoints -n docker-images-manager
```

## 优势

✅ **节点隔离**: 每个 Service 只访问对应节点的 Pod  
✅ **独立管理**: 可以单独扩缩容每个节点的副本数  
✅ **灵活配置**: 可以为不同节点配置不同的资源限制  
✅ **易于调试**: 问题定位更清晰  

## 扩展节点

如果要添加新节点，需要：

1. 在 `deployments.yaml` 中添加新节点的 Deployment
2. 在 `services-nodeport.yaml` 中添加新节点的 Service
3. 指定新的 NodePort 端口

示例（添加 node03）：

```yaml
# deployments.yaml 添加
apiVersion: apps/v1
kind: Deployment
metadata:
  name: docker-images-manager-node03
  namespace: docker-images-manager
  labels:
    app: docker-images-manager
    node: node03
spec:
  replicas: 1
  selector:
    matchLabels:
      app: docker-images-manager
      node: node03
  template:
    metadata:
      labels:
        app: docker-images-manager
        node: node03
    spec:
      nodeSelector:
        kubernetes.io/hostname: node03
      # ... 其他配置

# services-nodeport.yaml 添加
apiVersion: v1
kind: Service
metadata:
  name: dim-node03
  namespace: docker-images-manager
spec:
  type: NodePort
  selector:
    app: docker-images-manager
    node: node03
  ports:
    - nodePort: 30804  # 新端口
      port: 80
      targetPort: 8000
```

## 注意事项

1. **NodePort 范围**: Kubernetes 默认 NodePort 范围为 30000-32767
2. **端口冲突**: 确保每个 Service 使用不同的 NodePort
3. **防火墙**: 确保节点防火墙允许 NodePort 端口访问
4. **节点标签**: 确保节点存在且标签正确（kubernetes.io/hostname）
