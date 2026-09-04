/**
 * 通告业务服务
 *
 * 页面只依赖本层暴露的异步方法，不直接读 mock 或拼接口。
 * 默认读取 Java 服务；保留本地静态数据分支用于离线设计预览，页面签名保持一致。
 */

import type { JobType, Notice, NoticeCategory, NoticeFilter, NoticeSort, MyNotice, MyNoticeStatus, Salary } from '@/types'
import { MOCK_NOTICES } from '@/mock/notices'
import { USE_MOCK, request, mockResponse } from '@/utils/request'

/**
 * 按筛选条件过滤通告。
 *
 * 各字段为「与」关系：同时满足才保留。未传的字段视为「不限」，不参与过滤。
 * 关键词命中范围覆盖标题 / 城市 / 标签，贴合用户「搜岗位也搜地点」的直觉。
 */
function applyFilter(list: Notice[], filter: NoticeFilter): Notice[] {
  return list.filter((item) => {
    if (filter.jobType && item.jobType !== filter.jobType) return false
    if (filter.category && item.category !== filter.category) return false
    // 城市「不限」在调用方已转为 undefined，这里只需判断有值时是否相等
    if (filter.city && item.city !== filter.city) return false

    if (filter.keyword) {
      const kw = filter.keyword.trim().toLowerCase()
      const haystack = [item.title, item.city, ...item.tags]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(kw)) return false
    }
    return true
  })
}

/**
 * 按排序维度对通告排序。返回新数组，不改动入参（避免污染 mock 原始数据）。
 *
 * - recommend（推荐）：急招优先，其次热度（浏览量），是默认排序；
 * - nearby（附近）：距离升序；
 * - latest（最新）：发布时间倒序。
 */
function applySort(list: Notice[], sort: NoticeSort): Notice[] {
  const copy = [...list]
  switch (sort) {
    case 'nearby':
      return copy.sort((a, b) => a.distanceKm - b.distanceKm)
    case 'latest':
      return copy.sort((a, b) => b.publishedAt - a.publishedAt)
    case 'recommend':
    default:
      // 急招置顶：urgent 为 true 的排前面；同组内按浏览量降序
      return copy.sort((a, b) => {
        if (a.urgent !== b.urgent) return a.urgent ? -1 : 1
        return b.viewCount - a.viewCount
      })
  }
}

/**
 * 获取通告列表。
 *
 * @param filter 筛选条件，默认空对象（即不限，取全部）
 * @returns 过滤 + 排序后的通告列表
 */
export interface NoticePageResult {
  page: number
  pageSize: number
  size: number
  total: number
  totalPages: number
  hasNext: boolean
  items: Notice[]
}

type NoticePageFilter = NoticeFilter & { page?: number; pageSize?: number }

/** 获取服务端分页结果；首页列表只取当前页，避免一次加载全部岗位。 */
export function fetchNoticesPage(filter: NoticePageFilter = {}): Promise<NoticePageResult> {
  if (!USE_MOCK) {
    return request<NoticePageResult | Notice[]>({
      url: '/notices',
      data: { ...filter, page: filter.page ?? 1, pageSize: filter.pageSize ?? 20 },
      auth: false,
    }).then((response) => {
      // 兼容旧服务短暂返回数组的情况，正式 Java 服务返回分页对象。
      if (Array.isArray(response)) {
        return { page: 1, pageSize: response.length, size: response.length, total: response.length, totalPages: response.length ? 1 : 0, hasNext: false, items: response }
      }
      return response
    })
  }
  const page = Math.max(1, filter.page ?? 1)
  const pageSize = Math.max(1, Math.min(100, filter.pageSize ?? 20))
  const sort = filter.sort ?? 'recommend'
  const sorted = applySort(applyFilter(MOCK_NOTICES, filter), sort)
  const items = sorted.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = sorted.length ? Math.ceil(sorted.length / pageSize) : 0
  return mockResponse({ page, pageSize, size: pageSize, total: sorted.length, totalPages, hasNext: page < totalPages, items })
}

export function fetchNotices(filter: NoticeFilter = {}): Promise<Notice[]> {
  return fetchNoticesPage(filter).then((page) => page.items)
}

/**
 * 获取单条通告详情。
 *
 * @param id 通告 id
 * @returns 命中的通告；未命中返回 null（调用方据此展示「通告不存在/已下架」）
 */
export function fetchNoticeDetail(id: string): Promise<Notice | null> {
  if (!USE_MOCK) {
    return request<Notice | null>({ url: `/notices/${id}`, auth: false })
  }
  const found = MOCK_NOTICES.find((item) => item.id === id) ?? null
  return mockResponse(found)
}

/**
 * 获取「为你推荐急招通告」列表（详情页底部）。
 *
 * 规则：取 urgent 且排除当前正在看的这条，按浏览量降序取前 N 条，
 * 避免推荐里出现用户当前已在浏览的通告造成重复。
 *
 * @param excludeId 需排除的通告 id（通常是当前详情页）
 * @param limit 返回条数上限，默认 3
 */
export function fetchRecommendNotices(
  excludeId: string,
  limit = 3,
): Promise<Notice[]> {
  if (!USE_MOCK) {
    return fetchNotices().then((items) => items.filter((item) => item.urgent && item.id !== excludeId).slice(0, limit))
  }
  const recommend = MOCK_NOTICES.filter(
    (item) => item.urgent && item.id !== excludeId,
  )
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit)
  return mockResponse(recommend)
}

export interface NoticeWritePayload extends Record<string, unknown> {
  title: string
  jobType: JobType
  category: NoticeCategory
  city: string
  address: string
  salaryMin: number
  salaryMax: number
  salaryUnit: Salary['unit']
  salaryDisplay: string
  duties: string[]
  requirements: string[]
  tags: string[]
  urgent?: boolean
}

export function createNotice(payload: NoticeWritePayload): Promise<Notice> {
  return request<Notice>({ url: '/notices', method: 'POST', data: payload })
}

export function updateNotice(id: string, payload: NoticeWritePayload): Promise<Notice> {
  return request<Notice>({ url: `/notices/${id}`, method: 'PUT', data: payload })
}

export function publishNotice(id: string): Promise<Notice> {
  return request<Notice>({ url: `/notices/${id}/publish`, method: 'POST', data: {} })
}

/**
 * 获取我的通告列表（商家发布的通告）
 *
 * @param status 筛选状态，不传则返回全部
 * @returns 我的通告列表
 */
export function fetchMyNotices(status?: MyNoticeStatus): Promise<MyNotice[]> {
  if (!USE_MOCK) {
    return request<MyNotice[]>({
      url: '/notice/my-list',
      data: status ? { status } : {},
      auth: true,
    })
  }

  // Mock 数据：从 MOCK_NOTICES 转换并添加状态信息
  // 实际项目中这应该是独立的 mock 数据源
  const myNotices: MyNotice[] = MOCK_NOTICES.slice(0, 8).map((notice, index) => ({
    ...notice,
    status: (['draft', 'pending', 'published', 'rejected'] as MyNoticeStatus[])[index % 4],
    applyCount: Math.floor(Math.random() * 50),
    createdAt: Date.now() - index * 86400000,
    updatedAt: Date.now() - index * 3600000,
    rejectReason: index % 4 === 3 ? '通告内容包含敏感词汇，请修改后重新提交' : undefined,
  }))

  const filtered = status ? myNotices.filter(item => item.status === status) : myNotices
  return mockResponse(filtered)
}
