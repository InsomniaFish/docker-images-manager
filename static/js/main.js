// Docker 镜像管理 - 前端交互脚本

document.addEventListener('DOMContentLoaded', function() {
    // 获取 DOM 元素
    const headerCheckbox = document.getElementById('header-checkbox');
    const selectAllBtn = document.getElementById('select-all');
    const selectNoneBtn = document.getElementById('select-none');
    const selectUnusedBtn = document.getElementById('select-unused');
    const deleteBtn = document.getElementById('delete-btn');
    const pullBtn = document.getElementById('pull-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const searchInput = document.getElementById('search-input');
    const selectedInfo = document.getElementById('selected-info');
    const selectedCountSpan = document.getElementById('selected-count');
    const selectedSizeSpan = document.getElementById('selected-size');
    const deleteModal = document.getElementById('delete-modal');
    const pullModal = document.getElementById('pull-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const forceDeleteCheckbox = document.getElementById('force-delete');
    const imagesToDeleteDiv = document.getElementById('images-to-delete');
    const deleteWarning = document.getElementById('delete-warning');
    const pullImagesInput = document.getElementById('pull-images-input');
    const pullProgress = document.getElementById('pull-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const cancelPullBtn = document.getElementById('cancel-pull-btn');
    const confirmPullBtn = document.getElementById('confirm-pull-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    // 取消删除按钮
    cancelDeleteBtn.addEventListener('click', function() {
        deleteModal.style.display = 'none';
        forceDeleteCheckbox.checked = false;
    });

    // 搜索功能 - 点击按钮执行搜索
    const searchBtn = document.getElementById('search-btn');

    // 点击搜索按钮执行搜索
    searchBtn.addEventListener('click', function() {
        const searchTerm = searchInput.value.trim();
        performSearch(searchTerm);
    });

    // 回车键执行搜索
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.trim();
            performSearch(searchTerm);
        }
    });

    // 执行搜索
    function performSearch(searchTerm) {
        fetch('/search/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                search: searchTerm
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateTable(data.images);
                updateStats(data);
                
                // 显示搜索结果提示
                if (searchTerm) {
                    showMessage(`找到 ${data.total_count} 个匹配的镜像`, 'info');
                }
            } else {
                showMessage('搜索失败：' + data.message, 'error');
            }
        })
        .catch(error => {
            showMessage('搜索失败：' + error, 'error');
        });
    }

    // 更新选中统计信息
    function updateSelectedInfo() {
        const checkboxes = document.querySelectorAll('.image-checkbox:checked');
        const count = checkboxes.length;
        
        let totalSize = 0;
        checkboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            const sizeCell = row.cells[3];
            const sizeText = sizeCell.textContent.trim();
            const sizeBytes = parseSizeToBytes(sizeText);
            totalSize += sizeBytes;
        });
        
        selectedCountSpan.textContent = count;
        selectedSizeSpan.textContent = formatBytes(totalSize);
        
        if (count > 0) {
            selectedInfo.style.display = 'block';
        } else {
            selectedInfo.style.display = 'none';
        }
        
        return count;
    }

    // 解析大小字符串为字节数
    function parseSizeToBytes(sizeStr) {
        const units = {
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024
        };
        
        for (const [unit, multiplier] of Object.entries(units)) {
            if (sizeStr.includes(unit)) {
                const number = parseFloat(sizeStr.replace(unit, '').trim());
                return number * multiplier;
            }
        }
        return 0;
    }

    // 格式化字节数为人类可读格式
    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 全选/取消全选
    headerCheckbox.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.image-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
        updateSelectedInfo();
        updateRowSelection();
    });

    // 单个复选框变化
    document.querySelectorAll('.image-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectedInfo();
            updateRowSelection();
            updateHeaderCheckbox();
        });
    });

    // 更新行选中状态
    function updateRowSelection() {
        document.querySelectorAll('tbody tr').forEach(row => {
            const checkbox = row.querySelector('.image-checkbox');
            if (checkbox) {
                if (checkbox.checked) {
                    row.classList.add('selected');
                } else {
                    row.classList.remove('selected');
                }
            }
        });
    }

    // 更新表头复选框状态
    function updateHeaderCheckbox() {
        const checkboxes = document.querySelectorAll('.image-checkbox');
        const checkedBoxes = document.querySelectorAll('.image-checkbox:checked');
        headerCheckbox.checked = checkboxes.length === checkedBoxes.length && checkboxes.length > 0;
    }

    // 全选按钮
    selectAllBtn.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.image-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        updateSelectedInfo();
        updateRowSelection();
        updateHeaderCheckbox();
    });

    // 取消全选按钮
    selectNoneBtn.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.image-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        updateSelectedInfo();
        updateRowSelection();
        updateHeaderCheckbox();
    });

    // 选择未使用按钮
    selectUnusedBtn.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.image-checkbox');
        checkboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            const statusBadge = row.querySelector('.status-badge');
            if (statusBadge && statusBadge.classList.contains('status-unused')) {
                checkbox.checked = true;
            } else {
                checkbox.checked = false;
            }
        });
        updateSelectedInfo();
        updateRowSelection();
        updateHeaderCheckbox();
    });

    // 删除按钮
    deleteBtn.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.image-checkbox:checked');
        
        if (checkboxes.length === 0) {
            showMessage('请先选择要删除的镜像', 'warning');
            return;
        }
        
        // 收集选中的镜像信息
        const selectedImages = [];
        let hasUsedImages = false;
        
        checkboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            const imageId = row.dataset.imageId;
            const nameCell = row.cells[1].textContent.trim();
            const statusBadge = row.querySelector('.status-badge');
            const isUsed = statusBadge && statusBadge.classList.contains('status-used');
            
            selectedImages.push({
                id: imageId,
                name: nameCell,
                isUsed: isUsed
            });
            
            if (isUsed) {
                hasUsedImages = true;
            }
        });
        
        // 显示删除确认对话框
        showDeleteModal(selectedImages, hasUsedImages);
    });

    // 显示删除确认对话框
    function showDeleteModal(images, hasUsedImages) {
        imagesToDeleteDiv.innerHTML = '';
        
        images.forEach(img => {
            const div = document.createElement('div');
            div.className = 'images-list-item';
            div.textContent = img.name;
            if (img.isUsed) {
                div.style.color = '#dc3545';
                div.style.fontWeight = 'bold';
            }
            imagesToDeleteDiv.appendChild(div);
        });
        
        if (hasUsedImages) {
            deleteWarning.style.display = 'block';
        } else {
            deleteWarning.style.display = 'none';
        }
        
        deleteModal.style.display = 'flex';
    }

    // 关闭删除确认对话框
    window.closeDeleteModal = function() {
        deleteModal.style.display = 'none';
        forceDeleteCheckbox.checked = false;
    };

    // 打开拉取镜像对话框
    pullBtn.addEventListener('click', function() {
        pullModal.style.display = 'flex';
        pullImagesInput.value = '';
        pullProgress.style.display = 'none';
        progressFill.style.width = '0%';
        confirmPullBtn.disabled = false;
        cancelPullBtn.disabled = false;
        pullImagesInput.focus();
    });

    // 关闭拉取镜像对话框
    function closePullModal() {
        pullModal.style.display = 'none';
        pullImagesInput.value = '';
        pullProgress.style.display = 'none';
        progressFill.style.width = '0%';
        confirmPullBtn.disabled = false;
        cancelPullBtn.disabled = false;
    }

    cancelPullBtn.addEventListener('click', closePullModal);

    // 点击遮罩层关闭对话框
    pullModal.addEventListener('click', function(e) {
        if (e.target === pullModal.querySelector('.modal-overlay')) {
            closePullModal();
        }
    });

    // 确认拉取镜像
    confirmPullBtn.addEventListener('click', function() {
        const input = pullImagesInput.value.trim();
        if (!input) {
            showMessage('请输入至少一个镜像名称', 'warning');
            return;
        }

        // 解析镜像名称列表（按行分割）
        const imageNames = input.split('\n').map(line => line.trim()).filter(line => line);
        
        if (imageNames.length === 0) {
            showMessage('请输入至少一个镜像名称', 'warning');
            return;
        }

        // 禁用按钮
        confirmPullBtn.disabled = true;
        cancelPullBtn.disabled = true;
        pullProgress.style.display = 'block';

        // 发送拉取请求
        fetch('/pull/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image_names: imageNames
            })
        })
        .then(response => response.json())
        .then(data => {
            // 更新进度
            const total = imageNames.length;
            const pulled = data.success_count + data.failed_count;
            const progress = Math.round((pulled / total) * 100);
            progressFill.style.width = progress + '%';
            progressText.textContent = `拉取完成：成功 ${data.success_count} 个，失败 ${data.failed_count} 个`;

            // 显示结果消息
            if (data.success) {
                showMessage(data.message, 'success');
            } else if (data.partial) {
                showMessage(data.message, 'warning');
                // 显示详细的失败信息
                data.results.forEach(result => {
                    if (!result.success) {
                        showMessage(`${result.image_name}: ${result.message}`, 'error');
                    }
                });
            } else {
                showMessage(data.message, 'error');
            }

            // 延迟关闭对话框并刷新
            setTimeout(() => {
                closePullModal();
                // 刷新表格
                fetch('/refresh/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                .then(response => response.json())
                .then(refreshData => {
                    if (refreshData.success) {
                        updateTable(refreshData.images);
                        updateStats(refreshData);
                    }
                });
            }, 2000);
        })
        .catch(error => {
            showMessage('拉取失败：' + error, 'error');
            closePullModal();
        });
    });

    // 确认删除
    confirmDeleteBtn.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.image-checkbox:checked');
        const imageIds = Array.from(checkboxes).map(cb => cb.value);
        const force = forceDeleteCheckbox.checked;
        
        // 发送删除请求
        fetch('/delete/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image_ids: imageIds,
                force: force
            })
        })
        .then(response => response.json())
        .then(data => {
            closeDeleteModal();
            
            if (data.success) {
                if (data.messages) {
                    data.messages.forEach(msg => {
                        showMessage(msg, data.partial ? 'warning' : 'success');
                    });
                } else {
                    showMessage(data.message, 'success');
                }
                
                // 局部刷新表格，而不是重新加载整个页面
                setTimeout(() => {
                    // 调用刷新接口获取最新数据
                    fetch('/refresh/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    })
                    .then(response => response.json())
                    .then(refreshData => {
                        if (refreshData.success) {
                            // 重置全选框状态
                            headerCheckbox.checked = false;
                            updateTable(refreshData.images);
                            updateStats(refreshData);
                        }
                    });
                }, 1000);
            } else {
                showMessage(data.message, 'error');
            }
        })
        .catch(error => {
            closeDeleteModal();
            showMessage('删除失败：' + error, 'error');
        });
    });

    // 刷新按钮
    refreshBtn.addEventListener('click', function() {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<span class="loading"></span> 刷新中...';
        
        fetch('/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateTable(data.images);
                updateStats(data);
                showMessage('刷新成功', 'success');
            } else {
                showMessage(data.message, 'error');
            }
        })
        .catch(error => {
            showMessage('刷新失败：' + error, 'error');
        })
        .finally(() => {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '🔄 刷新';
        });
    });

    // 更新表格
    function updateTable(images) {
        const tbody = document.getElementById('images-table-body');
        tbody.innerHTML = '';
        
        if (images.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-message">暂无镜像数据，请确认 Docker 服务正常运行</td>
                </tr>
            `;
            return;
        }
        
        images.forEach(img => {
            const tr = document.createElement('tr');
            tr.dataset.imageId = img.id;
            
            const statusClass = img.is_used ? 'status-used' : 'status-unused';
            const statusText = img.is_used ? '✓ 使用中' : '○ 未使用';
            const containersCount = img.containers_count > 0 ? img.containers_count : 0;
            
            // 处理 repository 和 tag 的显示
            const isNone = !img.repository || img.repository === '<none>';
            const displayName = isNone ? '<none>:<none>' : `${img.repository}:${img.tag}`;
            
            tr.innerHTML = `
                <td>
                    <input type="checkbox" class="image-checkbox" value="${img.id}" 
                           ${img.is_used ? 'title="正在被容器使用"' : ''}>
                </td>
                <td>
                    <div class="image-name">
                    </div>
                </td>
                <td><code>${img.short_id}</code></td>
                <td>${img.size}</td>
                <td>${img.created}</td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <span class="containers-count">${containersCount}</span>
                </td>
            `;
            
            // 使用 textContent 安全地设置镜像名称，避免 HTML 转义问题
            const imageDiv = tr.querySelector('.image-name');
            const strong = document.createElement('strong');
            strong.textContent = displayName;
            imageDiv.appendChild(strong);
            
            tbody.appendChild(tr);
        });
        
        // 重新绑定事件
        document.querySelectorAll('.image-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                updateSelectedInfo();
                updateRowSelection();
                updateHeaderCheckbox();
            });
        });
        
        // 确保所有 checkbox 都是未选中状态
        document.querySelectorAll('.image-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        updateSelectedInfo();
        updateRowSelection();
    }

    // 更新统计信息
    function updateStats(data) {
        document.getElementById('total-count').textContent = data.total_count;
        document.getElementById('used-count').textContent = data.used_count;
        document.getElementById('unused-count').textContent = data.unused_count;
        document.getElementById('total-size').textContent = data.total_size;
    }

    // 显示消息提示
    function showMessage(message, type = 'info') {
        const container = document.getElementById('message-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        container.appendChild(messageDiv);
        
        // 3 秒后自动消失
        setTimeout(() => {
            messageDiv.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                container.removeChild(messageDiv);
            }, 300);
        }, 3000);
    }

    // 点击模态框外部关闭
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal || e.target.classList.contains('modal-overlay')) {
            closeDeleteModal();
        }
    });

    // ESC 键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && deleteModal.style.display === 'flex') {
            closeDeleteModal();
        }
    });
});
