你是一名资深 Vue3 工程师和前端导师。请为我设计一组「Vue3 Composable 设计专题」练习题。

## 一、我的当前水平

我的情况如下：

* JavaScript：中级
* Vue3：中级，已经有实际项目经验
* TypeScript：初级到中级，正在提升
* 熟悉 Composition API
* 熟悉 ref、reactive、computed、watch、watchEffect、nextTick
* 理解 Vue3 基本响应式机制
* 知道 track、trigger、scheduler、ReactiveEffect 的基本职责，但源码级时序还不算完全熟练
* 理解组件更新是异步批量调度，而响应式状态本身是同步修改
* 已经学习过 props、emit、provide/inject、Pinia 等组件通信方式
* 目前希望从「会写 Vue」提升到「会设计 Vue 代码」

我目前比较需要加强的地方：

1. Composable 的状态作用域
2. 函数内部状态与模块级共享状态的区别
3. Composable 中副作用的生命周期管理
4. watch / watchEffect 的合理使用
5. 请求、定时器、事件监听等资源的 cleanup
6. ref、getter、普通值作为 composable 参数时应该如何设计
7. Composable 的 API 设计
8. 多个 composable 之间如何组合
9. Vue3 + TypeScript 在 composable 中的实际使用
10. 避免为了“封装”而封装

---

## 二、出题目标

这套题的核心目标不是考 Vue API 记忆，而是训练：

「面对真实需求，我应该如何设计一个合理的 Composable？」

同时通过题目继续打牢 Vue3 基本功。

题目应该让我不断思考：

* 状态应该放在哪里？
* 这份状态应该共享还是隔离？
* 哪些数据应该是 ref？
* 哪些应该是 computed？
* 什么东西需要 watch？
* 什么东西根本不应该 watch？
* 副作用什么时候创建？
* 什么时候销毁？
* composable 应该接收什么参数？
* composable 应该返回什么？
* 调用方能不能直接修改内部状态？
* 一个 composable 应该承担多少职责？

---

## 三、题目数量

只出 **5 道题**。

不要超过 5 道。

我希望少而精，每一道都是 Vue3 / Composable 中非常经典、非常有代表性的场景。

不要为了凑难度设计冷门、偏门、炫技题。

---

## 四、难度设计

5 道题必须循序渐进。

大致按照：

第 1 题：
基础 Composable 状态封装。

第 2 题：
独立状态 vs 共享状态、状态作用域。

第 3 题：
响应式参数、watch、生命周期、副作用 cleanup。

第 4 题：
多个状态和操作组合起来的真实业务 Composable。

第 5 题：
异步请求型 Composable，作为本专题综合题。

整体难度：

中等 → 中等偏上 → 较高。

不要一开始就考特别复杂的架构设计。

---

## 五、建议覆盖的经典场景

题目可以从这些经典场景中选择最合适的 5 个，但不要机械照搬：

* useCounter
* useToggle
* useLocalStorage
* useEventListener
* useMouse
* usePagination
* useSearch
* useUserList
* useRequest / useFetch
* useSSE

优先选择真实项目中高频出现、能训练基本功的场景。

不要使用特别偏门的 composable。

---

## 六、必须覆盖的知识

5 道题整体上应该覆盖：

### 1. 状态作用域

让我真正理解：

```ts
const state = ref(...)

export function useX() {
  return state
}
```

和：

```ts
export function useX() {
  const state = ref(...)
  return state
}
```

在架构上的区别。

---

### 2. 响应式输入

至少有一道题要求思考这种 API：

```ts
useSomething(id)
```

其中调用方可能传：

```ts
123

ref(123)

computed(() => xxx)

() => props.id
```

让我思考：

Composable 是否需要支持响应式输入？

是否需要使用：

```ts
MaybeRef
MaybeRefOrGetter
toValue
```

但不要把题目变成 Vue API 背诵。

---

### 3. watch 与 computed

题目中要存在一些需要我自己判断：

应该使用：

```ts
computed
```

还是：

```ts
watch
```

还是：

```ts
watchEffect
```

甚至：

什么都不用。

不要直接告诉我应该使用哪个。

---

### 4. 生命周期与资源释放

至少一道题涉及真实副作用，例如：

* EventListener
* Timer
* AbortController
* SSE

要求考虑：

```ts
onUnmounted
onScopeDispose
```

或者其他合理 cleanup 机制。

重点训练：

「创建资源的人应该负责释放资源」。

---

### 5. 异步请求与竞态

最后一道综合题必须包含：

```text
请求 A 发出
↓
参数变化
↓
请求 B 发出
↓
B 先回来
↓
A 后回来
```

让我自己解决 stale response / race condition。

可以涉及 AbortController。

但不要一上来加入：

* 超复杂缓存系统
* LRU
* 请求合并框架
* RxJS
* 状态机

这些不属于当前阶段重点。

---

### 6. TypeScript

题目需要自然加入 TS 要求，例如：

```ts
useRequest<T>()
```

或者 composable 参数 / 返回值类型设计。

但不要设计纯 TypeScript 类型体操题。

TS 应该服务于 Vue API 设计，而不是喧宾夺主。

---

## 七、每一道题的格式

每道题必须包含：

### 题目背景

模拟一个真实 Vue3 项目需求。

### 已有代码 / 初始条件

给我必要的代码骨架。

不要给完整答案。

### 核心需求

清楚列出必须实现什么。

### 设计约束

例如：

* 不允许使用 Pinia
* 两个组件状态必须独立
* 必须正确清理副作用
* 参数变化后需要响应
* 不允许组件直接操作某些内部状态

### 思考问题

给出 3～5 个真正值得思考的问题。

例如：

* 为什么状态放函数外会产生问题？
* 参数应该接收 Ref 还是普通值？
* loading 应该由调用方修改吗？
* watch 应该写在哪里？
* 请求完成顺序发生变化怎么办？

这些问题不要直接给答案。

### 验收场景

告诉我实现完成后应该满足哪些行为。

例如：

```text
组件 A 调用 useX()
组件 B 调用 useX()

修改 A
→ B 不受影响
```

通过行为来验证我的设计是否正确。

---

## 八、非常重要的教学要求

不要在题目下面直接给答案。

不要给完整实现代码。

不要在题目中暗示标准答案。

不要告诉我：

「这里应该用 watch」
「这里应该用 computed」
「这里应该使用 AbortController」

这些应该让我自己判断。

如果确实需要提示，只提供需求和现象。

---

## 九、禁止出的题

不要出：

* Vue 源码实现题
* 手写 reactive
* 手写 computed
* 手写 scheduler
* 冷门 Vue API 题
* 单纯 API 背诵题
* 极端性能优化题
* 纯 TS 类型体操
* 为了展示高级而设计的过度架构题
* 与真实 Vue 项目距离很远的玩具题

---

## 十、最终目标

完成这 5 道题之后，我应该明显加强：

```text
Vue3 响应式基本功
+
Composable 设计能力
+
状态作用域意识
+
副作用生命周期意识
+
Vue3 + TypeScript
+
异步请求处理能力
```

尤其希望让我真正建立下面这种思维：

「Composable 不是把代码从组件复制到 useXXX.ts，而是在设计状态、响应式依赖、副作用和生命周期的边界。」

请先在内部规划这 5 道题之间的递进关系，避免知识点重复。

最终只输出练习题，不输出答案、参考实现或评分标准。
