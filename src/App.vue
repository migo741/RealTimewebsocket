<template>
  <main class="customer-service-workbench">
    <aside class="conversation-panel">
      <header class="panel-header">
        <h2>会话列表</h2>
      </header>

      <div class="panel-content conversation-list-content">
        <p v-if="mockConversations.length === 0">暂时没有会话</p>

        <div v-else class="conversation-list">
          <article
            v-for="conversation in mockConversationsRef"
            :class="{
              'conversation-card--active': conversation.conversationId === currentConversationId,
            }"
            @click="currentConversationId = conversation.conversationId"
            :key="conversation.conversationId"
            class="conversation-card"
          >
            <div class="conversation-card-header">
              <h3>{{ conversation.customerName }}</h3>
              <time :datetime="conversation.updatedAt">{{ conversation.updatedAt }}</time>
            </div>

            <div class="conversation-card-summary">
              <span class="last-message">{{ conversation.lastMessage }}</span>
              <span v-if="conversation.unreadCount > 0" class="unread-count">
                {{ conversation.unreadCount }} 条未读
              </span>
            </div>
          </article>
        </div>
      </div>
    </aside>

    <section class="chat-panel">
      <header class="panel-header">
        <h1 v-if="!currentCustomer">当前会话</h1>
        <h1 v-else>{{ currentCustomer.customerName }}</h1>
      </header>

      <div class="panel-content">
        <p v-if="!currentConversationId">请从左侧选择一个会话</p>
        <div
          v-else-if="currentConversationId && !currentConversation.length"
          class="chat-message-container"
        >
          <p>暂无会话内容</p>
        </div>
        <div v-else class="chat-message-container">
          <div
            class="chat-message-item"
            :class="{ 'chat-message-item--right': message.sender !== 'customer' }"
            v-for="message in currentConversation"
            :key="message.messageId"
          >
            <span
              :class="{
                'chat-message-item--customer': message.sender === 'customer',
                'chat-message-item--yourself': message.sender === 'yourself',
                'chat-message-item--assistant': message.sender === 'assistant',
              }"
              >{{ message.content }}</span
            >
          </div>
        </div>
      </div>

      <div class="conversation-list-footer">
        <form>
          <textarea v-model="sendMessage" rows="1" placeholder="输入消息"></textarea>
          <button type="button" @click="handleSendMessage">发送</button>
        </form>
      </div>
    </section>

    <aside class="customer-panel">
      <header class="panel-header">
        <h2>客户信息</h2>
      </header>

      <div class="panel-content">
        <p>选择会话后查看客户信息</p>
      </div>
    </aside>
  </main>
</template>

<script setup lang="ts">
import type { ConversationSummary, sessionMessage } from './content'
import { mockConversations, mockSessionMessages } from './content'
import { ref, computed } from 'vue'

const currentConversationId = ref<ConversationSummary['conversationId'] | null>(null)
const sendMessage = ref<string>('')
const mockSessionMessagesRef = ref<sessionMessage[]>(mockSessionMessages)
const mockConversationsRef = ref<ConversationSummary[]>(mockConversations)
const currentCustomer = computed<ConversationSummary | null>(() => {
  return (
    mockConversationsRef.value.find(
      (conversation: ConversationSummary) =>
        conversation.conversationId === currentConversationId.value,
    ) || null
  )
})
const currentConversation = computed<sessionMessage[]>(() => {
  return mockSessionMessagesRef.value.filter(
    (msg: sessionMessage) => msg.conversationId === currentConversationId.value,
  )
})

const handleSendMessage = () => {
  if (!sendMessage.value || !currentConversationId.value || sendMessage.value.trim() === '') return
  const res: sessionMessage = {
    messageId: mockSessionMessagesRef.value.length + 1,
    conversationId: currentConversationId.value,
    content: sendMessage.value.trim(),
    createdAt: new Date().toISOString(), //TODO: 时间戳
    sender: 'yourself',
  }
  let i = 0
  let AIID = mockSessionMessagesRef.value.length + 2
  const str = 'AI建议可以先查看产品说明书，如果还有问题，可以联系客服'
  const mockAssistantMessage: sessionMessage = {
    messageId: AIID,
    conversationId: currentConversationId.value || 0,
    content: '',
    createdAt: new Date().toISOString(), //TODO: 时间戳
    sender: 'assistant',
  }
  let timerId = setInterval(() => {
    if (i === str.length) {
      return
    }
    const AIMsg = mockSessionMessagesRef.value.find((msg) => msg.messageId === AIID)
    AIMsg.content += str[i]
    i++
  }, 500)

  mockSessionMessagesRef.value.push(res)
  mockSessionMessagesRef.value.push(mockAssistantMessage)

  const conversation = mockConversationsRef.value.find(
    (conversation: ConversationSummary) =>
      conversation.conversationId === currentConversationId.value,
  )
  if (conversation) {
    conversation.updatedAt = res.createdAt
    conversation.lastMessage = currentConversation.value.at(-1)?.content || ''
  }
  sendMessage.value = ''
}
</script>

<style scoped lang="scss">
$color-text: #1f2937;
$color-heading: #111827;
$color-muted: #6b7280;
$color-subtle: #9ca3af;
$color-border: #e5e7eb;
$color-canvas: #f3f4f6;
$color-chat-background: #f9fafb;
$color-surface: #ffffff;
$color-accent: #2563eb;
$color-chat-messageBackground-yourself: #83ea83;
$color-chat-messageBackground-customer: #eee6e6;
$color-chat-messageBackground-assistant: #a8c7f4;

:global(*) {
  box-sizing: border-box;
}

:global(html),
:global(body),
:global(#app) {
  width: 100%;
  height: 100%;
  margin: 0;
}

:global(body) {
  color: $color-text;
  background: $color-canvas;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

.customer-service-workbench {
  display: grid;
  grid-template-columns:
    clamp(220px, 20vw, 280px)
    minmax(0, 1fr)
    clamp(240px, 22vw, 320px);
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: $color-canvas;
}

.conversation-panel,
.chat-panel,
.customer-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: $color-surface;
}

.conversation-panel {
  border-right: 1px solid $color-border;
}

.chat-panel {
  background: $color-chat-background;
}

.customer-panel {
  border-left: 1px solid $color-border;
}

.panel-header {
  display: flex;
  min-height: 64px;
  flex: 0 0 auto;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid $color-border;
  background: $color-surface;

  h1,
  h2 {
    margin: 0;
    color: $color-heading;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
  }
}

.panel-content {
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding: 24px;
  .chat-message-container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    .chat-message-item {
      display: flex;
      &--right {
        justify-content: flex-end;
      }
      &--customer {
        padding: 10px;
        border-radius: 10px;
        color: $color-text;
        background: $color-chat-messageBackground-customer;
      }
      &--yourself {
        padding: 10px;
        border-radius: 10px;
        color: $color-text;
        background: $color-chat-messageBackground-yourself;
      }
      &--assistant {
        padding: 10px;
        border-radius: 10px;
        color: $color-text;
        background: $color-chat-messageBackground-assistant;
      }
    }
  }

  p {
    margin: 0;
    color: $color-muted;
    font-size: 14px;
    line-height: 1.6;
  }
}

.conversation-list-content {
  padding: 16px;
}

.conversation-list-footer {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-end;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid $color-border;
  background: $color-surface;

  form {
    display: flex;
    min-width: 0;
    flex: 1;
    align-items: flex-end;
    gap: 12px;
  }

  input,
  textarea {
    min-width: 0;
    flex: 1;
    margin: 0;
    padding: 8px 12px;
    border: 1px solid $color-border;
    border-radius: 8px;
    color: $color-text;
    background: $color-surface;
    font: inherit;
    font-size: 14px;
    line-height: 1.5;

    &::placeholder {
      color: $color-subtle;
    }

    &:focus {
      border-color: $color-accent;
      outline: 2px solid rgba($color-accent, 0.2);
    }
  }

  textarea {
    min-height: 40px;
    max-height: 120px;
    resize: vertical;
  }

  button {
    height: 40px;
    flex: 0 0 auto;
    padding: 0 16px;
    border: 0;
    border-radius: 8px;
    color: $color-surface;
    background: $color-accent;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }
  }
}

.conversation-list {
  display: grid;
  gap: 12px;

  .conversation-card--active {
    border: 1px solid rgba(250, 94, 94, 0.8);
    box-shadow:
      0 0 6px rgba(250, 94, 94, 0.6),
      0 0 16px rgba(250, 94, 94, 0.35);
  }
}

.conversation-card {
  min-width: 0;
  padding: 16px;
  border: 1px solid $color-border;
  border-radius: 8px;
  background: $color-surface;
  cursor: pointer;

  &-header,
  &-summary {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 12px;
    justify-content: space-between;
  }

  &-header {
    margin-bottom: 10px;

    h3 {
      min-width: 0;
      margin: 0;
      overflow: hidden;
      color: $color-heading;
      font-size: 15px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    time {
      flex: 0 0 auto;
      color: $color-subtle;
      font-size: 11px;
    }
  }

  &-summary {
    .last-message {
      min-width: 0;
      overflow: hidden;
      color: $color-muted;
      font-size: 13px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .unread-count {
      flex: 0 0 auto;
      padding: 2px 8px;
      border-radius: 999px;
      color: $color-surface;
      background: $color-accent;
      font-size: 11px;
      font-weight: 600;
      line-height: 1.5;
    }
  }
}
</style>
