type ConversationSummary = {
  conversationId: number
  customerName: string
  lastMessage: string
  updatedAt: string
  unreadCount: number
}

const mockConversations: ConversationSummary[] = [
  {
    conversationId: 1,
    customerName: '张三',
    lastMessage: '什么时候见面',
    updatedAt: '2026-09-22T10:30:00Z',
    unreadCount: 6,
  },
  {
    conversationId: 2,
    customerName: '李四',
    lastMessage: '你好',
    updatedAt: '2026-09-21T10:30:00Z',
    unreadCount: 1,
  },
  {
    conversationId: 3,
    customerName: '王五',
    lastMessage: '问题已经解决了，谢谢',
    updatedAt: '2026-09-20T16:45:00Z',
    unreadCount: 0,
  },
]

type sessionMessage = {
  messageId: number
  conversationId: number
  content: string
  createdAt: string
  sender: 'yourself' | 'customer' | 'assistant'
}

const mockSessionMessages: sessionMessage[] = [
  {
    messageId: 1,
    conversationId: 1,
    content: '你觉得这个产品怎么样？',
    createdAt: '2026-09-22T10:30:00Z',
    sender: 'yourself',
  },
  {
    messageId: 2,
    conversationId: 1,
    content: '我觉得很好，性价比很高',
    createdAt: '2026-09-22T10:31:00Z',
    sender: 'customer',
  },
]

export type { ConversationSummary, sessionMessage }
export { mockConversations, mockSessionMessages }
