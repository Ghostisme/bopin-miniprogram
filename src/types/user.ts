/**
 * 用户与身份会话相关类型
 *
 * 主播端与企业端共用基础类型，但通过 role 和独立 token 会话隔离资料、权限与业务记录。
 */

/** 用户角色：主播端 / 商家端。当前 App 以主播端为主 */
export type UserRole = 'anchor' | 'merchant'

export interface AuthSession {
  token: string
  role: UserRole
  user: UserProfile
}

/**
 * 主播简历。
 *
 * 对应列表页「粘贴你的资料」AI 解析入口：用户粘贴一段自我介绍文本，
 * 由 AI 解析填充为结构化简历。这里定义解析后的目标结构。
 */
export interface Resume {
  /** 昵称 / 艺名 */
  nickname: string
  /** 期望品类 */
  categories: string[]
  /** 期望城市 */
  city: string
  /** 自我介绍原文 */
  intro: string
  /** 过往经验年限 */
  experienceYears?: number
}

/** 主播模卡。核心业务操作前必须完成的公开资料。 */
export interface AnchorCard {
  /** 对外展示的艺名 / 主播名 */
  stageName: string
  /** 擅长的直播品类 */
  categories: string[]
  /** 当前所在城市 */
  city: string
  /** 对外简介 */
  intro: string
  /** 直播经验年限 */
  experienceYears: number
  /** 期望收入 */
  expectedSalary: string
  /** 可开播时间 */
  availableTime: string
}

/** 当前登录用户信息 */
export interface UserProfile {
  id: string
  role: UserRole
  /** 昵称 */
  nickname: string
  /** 头像 */
  avatar: string
  /** 手机号（脱敏展示） */
  phone: string
  /** 是否已实名认证 */
  verified: boolean
  /** 简历，未填写时为 null */
  resume: Resume | null
  /** 主播模卡，未完成时为 null */
  anchorCard: AnchorCard | null
  /** 是否已完成模卡必填项 */
  cardCompleted: boolean
}
