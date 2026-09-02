/**
 * 消息 mock 数据
 *
 * 覆盖消息页两部分：额度（quota）+ 会话列表（conversations）。
 * 额度默认给 0，用于还原截图「消息通知次数还剩 0 次」及触发「次数不够」引导弹窗。
 */

import type { Conversation, MessageQuota } from '@/types'

/**
 * 消息额度。
 * remaining=0 是刻意设置：还原截图默认态，并让「次数不够」弹窗有触发条件。
 * total 用于展示「已用/总量」进度，真实项目由后端下发。
 */
export const MOCK_QUOTA: MessageQuota = {
  remaining: 0,
  total: 3,
}

/** 会话列表。按 lastTime 倒序（新→旧），列表层不再排序，直接渲染 */
export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c_1',
    role: 'system',
    name: '系统通知',
    avatar: '',
    lastMessage: '您好，欢迎使用播聘，完善简历可提升通告匹配度',
    lastTime: Date.now() - 1000 * 60 * 5,
    unread: 2,
  },
  {
    id: 'c_2',
    role: 'merchant',
    name: '杭州星耀文化传媒',
    avatar: '',
    lastMessage: '在的，我们这边带货主播还在招，方便发下你的资料吗？',
    lastTime: Date.now() - 1000 * 60 * 60 * 3,
    unread: 1,
  },
  {
    id: 'c_3',
    role: 'merchant',
    name: '上海耀阳网络科技',
    avatar: '',
    lastMessage: '好的，那我们约个时间线上聊一下',
    lastTime: Date.now() - 1000 * 60 * 60 * 26,
    unread: 0,
  },
  {
    id: 'c_4',
    role: 'service',
    name: '官方客服',
    avatar: '',
    lastMessage: '您的实名认证已通过审核',
    lastTime: Date.now() - 1000 * 60 * 60 * 48,
    unread: 0,
  },
]
