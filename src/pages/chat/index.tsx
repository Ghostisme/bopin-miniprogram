/**
 * 聊天对话页面
 *
 * 功能：
 * - 显示与某个用户的聊天记录
 * - 发送文字消息
 * - 消息气泡区分左右（对方/自己）
 * - 底部输入框固定
 *
 * 对应设计稿中的聊天详情页面
 */

import { useState, useEffect } from 'react'
import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import type { Message } from '@/types'
import { fetchChatMessages, sendMessage } from '@/services'
import { getStorage, setActiveRole, tokenKeyForRole } from '@/utils/storage'
import './index.scss'

/**
 * 聊天对话页面组件
 */
export default function ChatPage() {
  const router = useRouter()
  const conversationId = router.params.id // 会话ID

  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)

  /**
   * 加载聊天记录
   */
  const loadMessages = async () => {
    if (!conversationId) return

    setLoading(true)
    try {
      const data = await fetchChatMessages(conversationId)
      setMessages(data)
    } catch {
      Taro.redirectTo({ url: '/pages/role-login/index?role=anchor' })
    } finally {
      setLoading(false)
    }
  }

  // 页面加载时获取聊天记录
  useEffect(() => {
    setActiveRole('anchor')
    if (!getStorage<string | undefined>(tokenKeyForRole('anchor'), undefined)) {
      Taro.redirectTo({ url: '/pages/role-login/index?role=anchor' })
      return
    }
    loadMessages()
  }, [conversationId])

  /**
   * 发送消息
   */
  const handleSend = async () => {
    const text = inputText.trim()
    if (!text) return

    // 乐观更新：立即添加到列表
    const newMessage: Message = {
      id: Date.now().toString(),
      conversationId: conversationId!,
      content: text,
      type: 'text',
      fromMe: true,
      createdAt: Date.now(),
    }
    setMessages((prev) => [...prev, newMessage])
    setInputText('')

    try {
      // 调用发送接口
      await sendMessage(conversationId!, text)
      // 刷新消息列表（获取服务端返回的消息ID）
      await loadMessages()
    } catch (error) {
      Taro.showToast({ title: '发送失败', icon: 'error' })
      // 移除乐观添加的消息
      setMessages((prev) => prev.filter((m) => m.id !== newMessage.id))
    }
  }

  /**
   * 格式化消息时间
   */
  const formatMessageTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // 今天：显示时分
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }

    // 昨天
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }

    // 更早：显示日期
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }

  return (
    <View className="chat-page">
      {/* 消息列表区 */}
      <ScrollView
        scrollY
        className="chat-page__messages"
        scrollIntoView={`msg-${messages[messages.length - 1]?.id}`}
        scrollWithAnimation
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            id={`msg-${msg.id}`}
            className={`chat-page__msg-item ${msg.fromMe ? 'is-mine' : 'is-other'}`}
          >
            {/* 消息时间（间隔较长时显示） */}
            <View className="chat-page__msg-time">
              <Text>{formatMessageTime(msg.createdAt)}</Text>
            </View>

            <View className="chat-page__msg-content">
              {/* 头像 */}
              {!msg.fromMe && (
                <View className="chat-page__avatar">
                  <Text className="chat-page__avatar-text">对</Text>
                </View>
              )}

              {/* 消息气泡 */}
              <View className="chat-page__bubble">
                <Text className="chat-page__bubble-text">{msg.content}</Text>
              </View>

              {/* 我的头像 */}
              {msg.fromMe && (
                <View className="chat-page__avatar is-mine">
                  <Text className="chat-page__avatar-text">我</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {loading && (
          <View className="chat-page__loading">
            <Text>加载中...</Text>
          </View>
        )}
      </ScrollView>

      {/* 底部输入区 */}
      <View className="chat-page__input-bar">
        <Input
          className="chat-page__input"
          placeholder="输入消息..."
          value={inputText}
          onInput={(e) => setInputText(e.detail.value)}
          onConfirm={handleSend}
          confirmType="send"
        />
        <View
          className={`chat-page__send-btn ${inputText.trim() ? 'is-active' : ''}`}
          onClick={handleSend}
        >
          <Text>发送</Text>
        </View>
      </View>
    </View>
  )
}
