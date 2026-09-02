/**
 * 通告（主播招聘岗位）相关类型
 *
 * 「通告」是本平台的核心业务实体：商家发布主播招聘需求，主播浏览并沟通接单。
 * 命名沿用行业黑话「通告」而非「job」，与截图 UI 文案保持一致，降低理解成本。
 */

/** 用工性质：兼职 / 全职。列表页顶部筛选与卡片标签都会用到 */
export type JobType = 'part-time' | 'full-time'

/** 主播品类。用于列表筛选与卡片标签展示 */
export type NoticeCategory =
  | 'live-commerce' // 带货主播
  | 'entertainment' // 娱乐主播
  | 'game' // 游戏主播
  | 'talk' // 聊天主播
  | 'outdoor' // 户外主播
  | 'other' // 其他

/** 认证类型。实名认证是主播判断通告可信度的关键信号，需单独建模 */
export interface Verification {
  /** 是否已实名认证 */
  realName: boolean
  /** 是否企业认证 */
  enterprise: boolean
}

/**
 * 薪资结构。
 *
 * 为什么不用单一字符串：薪资既要能结构化筛选/排序（min/max），
 * 又要能按截图原样展示（如「7-15K/月」「300-500/场」），故拆成结构化字段 + 展示字段。
 */
export interface Salary {
  /** 薪资下限（单位：元）。用于排序与筛选 */
  min: number
  /** 薪资上限（单位：元） */
  max: number
  /** 计薪周期：月 / 天 / 场 / 时 */
  unit: 'month' | 'day' | 'session' | 'hour'
  /** 展示文案，直接渲染到卡片，避免前端反复拼接（如「7-15K/月」） */
  display: string
}

/** 通告发布方（商家 / 公会）信息 */
export interface NoticePublisher {
  id: string
  /** 公司 / 公会名称 */
  name: string
  /** logo 图片地址 */
  avatar: string
  /** 认证信息 */
  verification: Verification
}

/**
 * 通告卡片 / 详情共用的核心数据模型。
 *
 * 列表页与详情页共用同一模型：列表页用其中一部分字段，详情页用全量。
 * 这样从列表跳详情时可直接透传已有数据、先渲染骨架再补全，提升首屏体验。
 */
export interface Notice {
  id: string
  /** 通告标题，如「带货主播」 */
  title: string
  /** 用工性质 */
  jobType: JobType
  /** 主播品类 */
  category: NoticeCategory
  /** 薪资 */
  salary: Salary
  /** 工作城市 */
  city: string
  /** 详细地址（详情页地图 + 地址展示用） */
  address: string
  /** 距当前用户距离（单位：km）。「附近」排序与卡片「距你 x km」展示用 */
  distanceKm: number
  /** 地图经度（腾讯地图组件需要） */
  longitude: number
  /** 地图纬度 */
  latitude: number
  /** 岗位职责列表 */
  duties: string[]
  /** 任职要求列表 */
  requirements: string[]
  /** 标签，如「日结」「包吃住」「新手可做」，卡片上以 chip 形式展示 */
  tags: string[]
  /** 发布方 */
  publisher: NoticePublisher
  /** 是否为「急招」。列表「急招」区块与详情页角标用 */
  urgent: boolean
  /** 发布时间戳（ms）。「最新」排序用 */
  publishedAt: number
  /** 浏览量，用于热度展示 */
  viewCount: number
}

/** 列表页排序 / 快捷筛选维度，与截图顶部 tab 一一对应 */
export type NoticeSort = 'recommend' | 'nearby' | 'latest'

/**
 * 列表页筛选条件。
 * 所有字段可选：不传即「不限」，与 UI 上「全部/不限」语义一致。
 */
export interface NoticeFilter {
  /** 关键词搜索 */
  keyword?: string
  /** 用工性质 */
  jobType?: JobType
  /** 城市 */
  city?: string
  /** 品类 */
  category?: NoticeCategory
  /** 排序维度 */
  sort?: NoticeSort
}

/**
 * 我的通告状态
 * 对应"我的通告"页面的tab切换
 */
export type MyNoticeStatus = 'draft' | 'pending' | 'published' | 'rejected'

/**
 * 我的通告项（商家发布的通告）
 * 扩展自 Notice，增加状态和统计信息
 */
export interface MyNotice extends Notice {
  /** 通告状态 */
  status: MyNoticeStatus
  /** 浏览数 */
  viewCount: number
  /** 投递数（多少主播申请了） */
  applyCount: number
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
  /** 审核拒绝原因（仅 status=rejected 时有值） */
  rejectReason?: string
}
