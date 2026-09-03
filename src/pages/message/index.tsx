/**
 * 消息页
 *
 * 对应截图「消息」tab。顶部额度提示 + 会话列表。
 * 额度为0时页面据此展示「次数不够」引导,是付费/裂变钩子。
 */

import { useState } from 'react'
import { Image, View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { Conversation, MessageQuota } from '@/types'
import { fetchConversations, fetchQuota } from '@/services'
import { formatRelativeTime, formatBadge } from '@/utils/format'
import { CONVERSATION_ROLE_LABEL } from '@/constants'
import { getStorage, setActiveRole, tokenKeyForRole } from '@/utils/storage'
import EmptyState from '@/components/EmptyState'
import './index.scss'

export default function MessagePage() {
  const [quota, setQuota] = useState<MessageQuota | null>(null)
  const [list, setList] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)

  useDidShow(async () => {
    setActiveRole('anchor')
    if (!getStorage<string | undefined>(tokenKeyForRole('anchor'), undefined)) {
      Taro.redirectTo({ url: '/subpages/feature/role-login/index?role=anchor' })
      return
    }
    setLoading(true)
    try {
      const [q, c] = await Promise.all([fetchQuota(), fetchConversations()])
      setQuota(q)
      setList(c)
    } catch {
      Taro.redirectTo({ url: '/subpages/feature/role-login/index?role=anchor' })
    } finally {
      setLoading(false)
    }
  })

  /**
   * 点击会话项，跳转到聊天页面
   */
  const handleConversationClick = (conversationId: string) => {
    Taro.navigateTo({ url: `/subpages/feature/chat/index?id=${conversationId}` })
  }

  return (
    <View className="message-page">
      {/* 顶部额度提示 */}
      {quota && (
        <View className="message-page__quota">
          <Text className="message-page__quota-text">
            消息通知次数还剩 {quota.remaining} 次
          </Text>
          {quota.remaining === 0 && (
            <Text className="message-page__quota-link">去获取</Text>
          )}
        </View>
      )}

      {/* 会话列表 */}
      <View className="message-page__list">
        {loading ? (
          <EmptyState loading />
        ) : list.length === 0 ? (
          <EmptyState text="暂无消息" hint="沟通通告后会话将出现在这里" />
        ) : (
          list.map((item) => (
            <View
              key={item.id}
              className="message-page__item"
              onClick={() => handleConversationClick(item.id)}
            >
              <View className="message-page__avatar">
                {item.avatar ? (
                  <Image src={item.avatar} className="message-page__avatar-img" />
                ) : (
                  <Text className="message-page__avatar-text">
                    {item.name[0]}
                  </Text>
                )}
                {item.unread > 0 && (
                  <View className="message-page__badge">
                    {formatBadge(item.unread)}
                  </View>
                )}
              </View>
              <View className="message-page__content">
                <View className="message-page__row">
                  <Text className="message-page__name">{item.name}</Text>
                  <Text className="message-page__time">
                    {formatRelativeTime(item.lastTime)}
                  </Text>
                </View>
                <Text className="message-page__last-msg">{item.lastMessage}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  )
}
