/**
 * 全局常量与枚举映射
 *
 * 集中管理「枚举值 -> 展示文案」的映射、筛选选项、主题色等。
 * 为什么单独成层：类型（types）只描述结构，不含中文文案；页面与 mock 都需要
 * 把枚举翻译成 UI 文案，若各处硬编码会导致文案不一致、改文案要改多处。
 * 这里做唯一事实来源（single source of truth）。
 */

import type {
  JobType,
  NoticeCategory,
  NoticeSort,
  ConversationRole,
  MyNoticeStatus,
} from '@/types'

/** 主题色。与参考图中的玫瑰粉保持一致，SCSS 侧 variables.scss 有同名值。 */
export const THEME_COLOR = '#e799b0'

/** 用工性质 -> 中文文案 */
export const JOB_TYPE_LABEL: Record<JobType, string> = {
  'part-time': '兼职',
  'full-time': '全职',
}

/** 主播品类 -> 中文文案 */
export const CATEGORY_LABEL: Record<NoticeCategory, string> = {
  'live-commerce': '带货主播',
  entertainment: '娱乐主播',
  game: '游戏主播',
  talk: '聊天主播',
  outdoor: '户外主播',
  other: '其他',
}

/** 排序维度 -> 中文文案。顺序即列表页顶部 tab 的展示顺序 */
export const SORT_LABEL: Record<NoticeSort, string> = {
  recommend: '推荐',
  nearby: '附近',
  latest: '最新',
}

/** 会话角色 -> 默认头像占位文案（无真实头像时取首字） */
export const CONVERSATION_ROLE_LABEL: Record<ConversationRole, string> = {
  system: '系统通知',
  merchant: '商家',
  service: '官方客服',
}

/**
 * 列表页「用工性质」筛选选项。
 * 含一个「不限」项（value 为 undefined），与 NoticeFilter.jobType 可选语义对齐。
 */
export const JOB_TYPE_OPTIONS: Array<{ label: string; value?: JobType }> = [
  { label: '兼/全', value: undefined },
  { label: '兼职', value: 'part-time' },
  { label: '全职', value: 'full-time' },
]

/** 列表页城市筛选选项。真实项目应由接口拉取，这里先内置热门城市 */
export const CITY_OPTIONS: string[] = [
  '不限',
  '杭州',
  '上海',
  '北京',
  '广州',
  '深圳',
  '成都',
  '武汉',
]

/**
 * 列表页品类筛选选项。
 * 第一项「全部」映射为 undefined，其余映射到具体品类枚举。
 */
export const CATEGORY_OPTIONS: Array<{ label: string; value?: NoticeCategory }> = [
  { label: '全部', value: undefined },
  { label: '带货主播', value: 'live-commerce' },
  { label: '娱乐主播', value: 'entertainment' },
  { label: '游戏主播', value: 'game' },
  { label: '聊天主播', value: 'talk' },
  { label: '户外主播', value: 'outdoor' },
]

/** 列表页排序 tab（推荐/附近/最新），顺序即展示顺序 */
export const SORT_OPTIONS: Array<{ label: string; value: NoticeSort }> = [
  { label: '推荐', value: 'recommend' },
  { label: '附近', value: 'nearby' },
  { label: '最新', value: 'latest' },
]

/** 我的通告状态 -> 中文文案 */
export const MY_NOTICE_STATUS_LABEL: Record<MyNoticeStatus, string> = {
  draft: '草稿',
  pending: '审核中',
  published: '已发布',
  rejected: '审核未通过',
}

/** 我的通告状态筛选选项（对应页面顶部tab） */
export const MY_NOTICE_STATUS_OPTIONS: Array<{
  label: string
  value: MyNoticeStatus | 'all'
}> = [
  { label: '全部', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '审核中', value: 'pending' },
  { label: '已发布', value: 'published' },
  { label: '审核未通过', value: 'rejected' },
]
