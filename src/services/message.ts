/**
 * 消息 service
 *
 * 封装消息页所需的数据读取：会话列表与额度信息。
 * 与 notice service 一致，通过 USE_MOCK 在 mock 与真实接口间切换，
 * 页面只依赖返回的 Promise 语义，不感知底层实现。
 */

import type { Conversation, MessageQuota, Message } from '@/types'
import { USE_MOCK, request, mockResponse } from '@/utils/request'
import { MOCK_CONVERSATIONS, MOCK_QUOTA } from '@/mock/messages'

/**
 * 获取会话列表。
 * mock 数据已按 lastTime 倒序，真实接口也约定由服务端排序，页面无需再排。
 */
export async function fetchConversations(): Promise<Conversation[]> {
  if (USE_MOCK) return mockResponse(MOCK_CONVERSATIONS)
  return request<Conversation[]>({ url: '/messages/conversations' })
}

/**
 * 获取消息额度。
 * remaining 为 0 时页面据此展示「次数不够」引导，是付费/裂变钩子的数据来源。
 */
export async function fetchQuota(): Promise<MessageQuota> {
  if (USE_MOCK) return mockResponse(MOCK_QUOTA)
  return request<MessageQuota>({ url: '/messages/quota' })
}

/**
 * 获取聊天记录
 * @param conversationId 会话ID
 * @returns 消息列表
 */
export async function fetchChatMessages(conversationId: string): Promise<Message[]> {
  if (USE_MOCK) {
    // Mock 数据：生成一些对话
    const mockMessages: Message[] = [
      {
        id: '1',
        conversationId,
        content: '您好，我对这个岗位很感兴趣',
        type: 'text',
        fromMe: true,
        createdAt: Date.now() - 3600000,
      },
      {
        id: '2',
        conversationId,
        content: '你好！感谢关注。请问你有相关经验吗？',
        type: 'text',
        fromMe: false,
        createdAt: Date.now() - 3000000,
      },
      {
        id: '3',
        conversationId,
        content: '我做过半年带货主播，有一定的经验',
        type: 'text',
        fromMe: true,
        createdAt: Date.now() - 2400000,
      },
      {
        id: '4',
        conversationId,
        content: '不错！方便明天下午来公司面试吗？',
        type: 'text',
        fromMe: false,
        createdAt: Date.now() - 1800000,
      },
    ]
    return mockResponse(mockMessages)
  }

  return request<Message[]>({
    url: `/messages/${conversationId}`,
    auth: true,
  })
}

/**
 * 发送消息
 * @param conversationId 会话ID
 * @param content 消息内容
 * @returns 发送成功的消息
 */
export async function sendMessage(
  conversationId: string,
  content: string
): Promise<Message> {
  if (USE_MOCK) {
    const newMessage: Message = {
      id: Date.now().toString(),
      conversationId,
      content,
      type: 'text',
      fromMe: true,
      createdAt: Date.now(),
    }
    return mockResponse(newMessage)
  }

  return request<Message>({
    url: `/messages/${conversationId}`,
    method: 'POST',
    data: { content },
    auth: true,
  })
}
