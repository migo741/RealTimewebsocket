<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTable, { type Column, type ColumnKey, type SortState } from './DataTable.vue'

type User = {
  id: number
  name: string
  age: number
  city: string
  status: 'active' | 'disabled'
}

const source: User[] = [
  { id: 1, name: '张三', age: 28, city: '杭州', status: 'active' },
  { id: 2, name: '李四', age: 22, city: '宁波', status: 'disabled' },
  { id: 3, name: '王五', age: 35, city: '上海', status: 'active' },
  { id: 4, name: '赵六', age: 19, city: '成都', status: 'active' },
]

const columns: Column<User, 'action'>[] = [
  { key: 'name', title: '姓名', width: 180 },
  { key: 'age', title: '年龄', sortable: true, align: 'right', width: 120 },
  { key: 'city', title: '城市' },
  { key: 'status', title: '状态', sortable: true, width: 120 },
  { key: 'action', title: '操作', align: 'right', width: 120 },
]

const loading = ref(false)
const empty = ref(false)
const selectedKeys = ref<number[]>([])
const sort = ref<SortState<ColumnKey<User, 'action'>> | null>(null)

const rows = computed(() => {
  if (empty.value) return []
  const current = sort.value
  if (!current || current.key === 'action') return source
  const key = current.key
  return [...source].sort((left, right) => {
    const delta = left[key] > right[key] ? 1 : left[key] < right[key] ? -1 : 0
    return current.order === 'asc' ? delta : -delta
  })
})

const sortLabel = computed(() => {
  if (!sort.value) return '未排序'
  const title = columns.find((column) => column.key === sort.value?.key)?.title ?? sort.value.key
  return `${title} ${sort.value.order === 'asc' ? '升序' : '降序'}`
})

function editUser(user: User) {
  window.alert(`编辑 ${user.name}`)
}
</script>

<template>
  <main class="preview">
    <header class="preview__header">
      <div>
        <h1>用户列表</h1>
        <p>点击年龄或状态排序，勾选行后看下方已选 id。加载中不会显示空状态。</p>
      </div>
      <div class="preview__actions">
        <button type="button" @click="loading = !loading">
          {{ loading ? '结束加载' : '显示加载' }}
        </button>
        <button type="button" @click="empty = !empty">
          {{ empty ? '恢复数据' : '清空数据' }}
        </button>
      </div>
    </header>

    <DataTable
      :data="rows"
      :columns="columns"
      row-key="id"
      v-model:selected-keys="selectedKeys"
      v-model:sort="sort"
      :loading="loading"
    >
      <template #cell-name="{ row }">
        <span class="person">
          <span class="person__avatar">{{ row.name.slice(0, 1) }}</span>
          {{ row.name }}
        </span>
      </template>
      <template #cell-status="{ value }">
        <span class="tag" :data-status="value">{{ value === 'active' ? '启用' : '停用' }}</span>
      </template>
      <template #cell-action="{ row }">
        <button type="button" class="text-button" @click="editUser(row)">编辑</button>
      </template>
      <template #empty>没有符合条件的用户</template>
    </DataTable>

    <footer class="preview__meta">
      <span>排序：{{ sortLabel }}</span>
      <span>已选 {{ selectedKeys.length }} 人：{{ selectedKeys.join('、') || '无' }}</span>
    </footer>
  </main>
</template>

<style scoped lang="scss">
.preview {
  max-width: 880px;
  margin: 0 auto;
  padding: 32px 24px 48px;
  color: #1f2937;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;

  h1 {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 650;
  }

  p {
    margin: 0;
    color: #6b7280;
    font-size: 14px;
  }
}

.preview__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.preview__actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;

  button {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #fff;
    color: inherit;
    font: inherit;
    font-size: 13px;
    cursor: pointer;

    &:hover {
      background: #f9fafb;
    }
  }
}

.preview__meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 12px;
  color: #6b7280;
  font-size: 13px;
}

.person {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.person__avatar {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 650;
}

.tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 999px;
  background: #dcfce7;
  color: #166534;
  font-size: 12px;
  font-weight: 600;

  &[data-status='disabled'] {
    background: #f3f4f6;
    color: #6b7280;
  }
}

.text-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #2563eb;
  font: inherit;
  cursor: pointer;
}
</style>
