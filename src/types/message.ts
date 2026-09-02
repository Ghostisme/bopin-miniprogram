/**
 * 消息 / 会话相关类型
 *
 * 消息页由两部分组成：顶部「剩余通知次数」额度提示 + 下方会话列表。
 * 额度机制是平台的付费/裂变钩子（截图中「消息通知次数还剩 0 次」），故单独建模。
 */

/** 会话对方身份：系统通知 / 商家 / 客服 */
export type ConversationRole = 'system' | 'merchant' | 'service'

/**
 * 会话列表项。
 * 一条会话聚合了对方信息 + 最后一条消息摘要 + 未读数，供列表直接渲染，无需再查详情。
 */
export interface Conversation {
  id: string
  /** 对方角色，决定头像默认图与是否可跳转沟通 */
  role: ConversationRole
  /** 对方名称 */
  name: string
  /** 对方头像 */
  avatar: string
  /** 最后一条消息内容摘要 */
  lastMessage: string
  /** 最后消息时间戳（ms），列表按此倒序 */
  lastTime: number
  /** 未读条数，>0 时红点 / 数字角标 */
  unread: number
}

/**
 * 消息额度信息。
 *
 * 平台限制免费用户可发起的沟通次数，用完需付费/做任务解锁。
 * remaining 为 0 时，消息页会弹出「次数不够」引导弹窗（见截图）。
 */
export interface MessageQuota {
  /** 剩余可用通知次数 */
  remaining: number
  /** 总额度，用于展示「x/total」进度 */
  total: number
}

/**
 * 单条消息
 * 用于聊天对话页面
 */
export interface Message {
  id: string
  /** 所属会话ID */
  conversationId: string
  /** 消息内容 */
  content: string
  /** 消息类型 */
  type: 'text' | 'image' | 'system'
  /** 是否是我发送的 */
  fromMe: boolean
  /** 创建时间 */
  createdAt: number
}
