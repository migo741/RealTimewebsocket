Vue3 通用 DataTable 组件封装练习

难度：较高｜目标：提升组件 API 设计、状态边界与 TypeScript 泛型能力

题目定位：这是一个经典后台系统场景。重点不在“把表格渲染出来”，而在于设计一个可复用、类型安全、职责清晰且不过度抽象的 DataTable 组件。

1. 题目背景

用户列表、订单列表、商品列表等业务页面通常都有表格，但列结构、单元格展示、排序方式和选中逻辑并不一致。你需要封装一个通用 DataTable，使业务页面可以复用稳定的表格能力，同时保留足够的定制空间。

期望的调用体验示例：

<DataTable
  :data="users"
  :columns="columns"
  row-key="id"
  v-model:selected-keys="selectedKeys"
  :loading="loading"
  @sort-change="handleSortChange"
>
  <template #cell-name="{ row }">
    <UserAvatar :src="row.avatar" />
    {{ row.name }}
  </template>

  <template #cell-action="{ row }">
    <button @click="editUser(row)">编辑</button>
  </template>
</DataTable>

2. 核心需求

2.1 基础列配置

调用方通过 columns 描述表格列，普通列默认读取 row[column.key] 渲染。

const columns = [
  { key: 'name', title: '姓名' },
  { key: 'age', title: '年龄', sortable: true },
  { key: 'action', title: '操作' },
]

要求：column.key 不能简单写成 string。

目标：让 key 尽量与行数据类型建立 TypeScript 约束，错误字段名应尽可能在编译期暴露。

思考点：action 这类“虚拟列”并不一定存在于 User 类型里，应如何设计类型才能兼容？

2.2 自定义单元格

普通文本可以默认渲染，但实际业务会出现头像 + 姓名、金额格式化、状态 Tag、操作按钮等复杂内容。调用方必须能够覆盖某一列的渲染。

<template #cell-name="{ row, value }">
  ...
</template>

需要判断：自定义单元格使用 slot、columns.render，还是两者结合。

如果选择 slot，需要设计 slot 的命名规则和作用域参数。

思考每种方案在模板能力、类型安全、可读性和扩展性上的取舍。

2.3 支持排序，但 DataTable 不负责业务请求

当用户点击可排序列时，DataTable 负责维护或展示必要的 UI 状态，并向外通知排序变化。

{
  key: 'age',
  order: 'asc'
}

DataTable 不能直接调用 axios/fetch 请求业务接口。

父组件可以选择本地排序，也可以根据 sort-change 重新请求服务端。

需要明确：排序状态是受控还是非受控；如果允许两种模式，API 应如何设计而不混乱？

2.4 多选与 v-model:selected-keys

表格支持行勾选和表头全选，并通过 selectedKeys 与父组件同步。

const selectedKeys = ref<number[]>([])

禁止把选择状态只藏在 DataTable 内部，父组件必须可以读取和控制。

分页后旧页 selectedKeys 是否保留，需要先定义语义，再实现。

“全选”必须明确是当前页全选，还是所有服务端数据全选。

DataTable 不应在语义不明确的情况下擅自删除父组件已有的选中项。

2.5 rowKey 设计

禁止直接使用数组 index 作为稳定唯一标识。组件应支持字段名或函数两种 rowKey 形式。

<DataTable row-key="id" />

<DataTable :row-key="row => row.userId" />

字段模式应尽量受 keyof T 约束。

函数模式允许处理复合主键或派生唯一标识。

思考 rowKey 返回值允许 number、string，还是更宽的类型。

2.6 Loading / Empty 状态

组件需要区分加载中、空数据和正常数据三种视觉状态，并允许调用方覆盖默认 UI。

<template #loading>...</template>
<template #empty>...</template>

loading === true 时不应错误展示 empty。

默认 UI 与自定义 slot 需要有清晰优先级。

3. 设计限制

禁止把 DataTable 写成“万能超级组件”。

不要为了支持每种业务都堆 showXxx / enableXxx / xxxPosition 等大量布尔配置。

业务接口、业务权限、业务路由、业务文案等不应进入基础 DataTable。

如果某类变化属于结构变化，优先考虑 slot / 组合，而不是不断增加 props。

先定义组件边界，再写实现；不要从 template 反向拼 API。

关键判断：组件的目标不是“能支持所有需求”，而是稳定承载真正共性的部分，并把业务差异留给调用方。

4. 第一阶段任务：只设计 API，不写实现

第一步禁止直接开始写 DataTable.vue。先站在组件使用者角度，把 API 设计清楚。

type User = {
  id: number
  name: string
  age: number
  status: 'active' | 'disabled'
}

你需要产出以下内容：

Column<T> 类型设计。

DataTableProps<T> 类型设计。

DataTableEmits<T> 类型设计。

理想的 <DataTable /> 调用代码。

解释 selectedKeys、sort state、rowKey 分别由谁拥有。

解释为什么某些扩展能力应该用 slot，而不是继续加 props。

5. 评审标准

维度

主要检查点

常见问题

组件边界

是否只承担表格通用能力

在组件内部请求业务接口、处理业务权限

Props / Emits / Slots

变化类型是否匹配正确的 API

所有能力都塞进 props

状态归属

排序、选择状态的 owner 是否明确

父子组件同时修改同一状态

TypeScript

Column<T>、rowKey 是否真正利用泛型

大量 string / any 导致类型约束失效

扩展性

新增业务列时是否无需修改 DataTable

新增一种展示就改 DataTable 源码

抽象程度

既能复用，又不过度设计

万能组件、配置项爆炸

6. 自测问题

为什么 column.key 不能直接定义为 string？

虚拟操作列 action 不属于 keyof User 时，你打算怎么表示？

slot 和 render function 各自适合什么场景？

DataTable 是否应该直接对 data 做 sort()？为什么？

分页后 selectedKeys 应该如何处理？这个决定应该由谁做？

为什么 index 不适合作为 rowKey？

如果未来需要“状态列”“金额列”“操作列”，你是否必须修改 DataTable 内部？

你的 API 是否已经出现大量布尔 props？如果是，是否意味着边界出了问题？