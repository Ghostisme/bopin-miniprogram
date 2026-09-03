/**
 * 用户 service
 *
 * 封装「我的」页面所需的当前用户资料读取，以及简历更新。
 * 默认写入 Java 服务，离线设计预览时可切换到本地数据。
 */

import Taro from '@tarojs/taro'
import type { UserProfile, Resume, AnchorCard, AuthSession, UserRole, TalentProfile } from '@/types'
import { API_BASE_URL, USE_MOCK, request, mockResponse } from '@/utils/request'
import { MOCK_MERCHANT_USER, MOCK_USER } from '@/mock/user'
import { getStorage, setActiveRole, setStorage, STORAGE_KEYS, tokenKeyForRole } from '@/utils/storage'

/**
 * 获取当前登录用户资料。
 * mock 返回的用户已实名但模卡为 null，用于驱动「已认证」标识与「完善模卡」引导。
 */
export async function fetchUserProfile(): Promise<UserProfile> {
  if (USE_MOCK) return mockResponse(MOCK_USER)
  return request<UserProfile>({ url: '/users/me' })
}

/** 按身份登录。主播 token 和企业 token 分开保存，不共享当前用户资料。 */
export async function loginAs(role: UserRole, phone = '', demo = false): Promise<AuthSession> {
  if (USE_MOCK) {
    const user = role === 'merchant' ? MOCK_MERCHANT_USER : MOCK_USER
    const session = await mockResponse({ token: `${role}_demo_token`, role, user })
    setStorage(tokenKeyForRole(role), session.token)
    setStorage(STORAGE_KEYS.USER_PROFILE, session.user)
    setActiveRole(role)
    return session
  }
  const session = await request<AuthSession>({
    url: '/auth/login',
    method: 'POST',
    auth: false,
    data: { role, phone: phone.trim(), demo },
  })
  setStorage(tokenKeyForRole(role), session.token)
  setStorage(STORAGE_KEYS.USER_PROFILE, session.user)
  setActiveRole(role)
  return session
}

/**
 * 提交/更新简历。
 *
 * 对应列表页「粘贴你的资料」解析后的落库动作，保存成功后返回最新用户资料。
 *
 * @param resume 解析后的结构化简历
 */
export async function updateResume(resume: Resume): Promise<UserProfile> {
  if (USE_MOCK) return mockResponse({ ...MOCK_USER, resume })
  return request<UserProfile>({
    url: '/users/me',
    method: 'PUT',
    data: { ...resume },
  })
}

function mockProfileWithCards(anchorCards: AnchorCard[]): Promise<UserProfile> {
  const primary = anchorCards.find((item) => item.isPrimary) ?? anchorCards[0]
  const normalizedCards = primary && !primary.isPrimary
    ? anchorCards.map((item, index) => ({ ...item, isPrimary: index === 0 }))
    : anchorCards
  const normalizedPrimary = normalizedCards.find((item) => item.isPrimary) ?? null
  MOCK_USER.anchorCards = normalizedCards
  MOCK_USER.anchorCard = normalizedPrimary
  MOCK_USER.cardCompleted = normalizedCards.length > 0
  return mockResponse({ ...MOCK_USER, anchorCards: normalizedCards, anchorCard: normalizedPrimary, cardCompleted: normalizedCards.length > 0 })
}

/** 新建主播模卡。一个主播最多维护五张，以便面向不同品类展示作品。 */
export async function createAnchorCard(card: AnchorCard): Promise<UserProfile> {
  if (USE_MOCK) {
    if ((MOCK_USER.anchorCards ?? []).length >= 5) return Promise.reject(new Error('最多创建 5 张模卡，请删除不再使用的模卡后再创建'))
    const created = { ...card, id: `card_${Date.now()}`, isPrimary: !MOCK_USER.anchorCards?.length }
    const anchorCards = [...(MOCK_USER.anchorCards ?? []), created]
    return mockProfileWithCards(anchorCards)
  }
  return request<UserProfile>({
    url: '/users/me/cards',
    method: 'POST',
    data: { ...card },
  })
}

/** 保存一张已有主播模卡；未携带 id 时兼容旧调用并新建。 */
export async function updateAnchorCard(card: AnchorCard): Promise<UserProfile> {
  if (!card.id) return createAnchorCard(card)
  if (USE_MOCK) {
    const anchorCards = (MOCK_USER.anchorCards ?? []).map((item) => item.id === card.id ? { ...item, ...card } : item)
    return mockProfileWithCards(anchorCards)
  }
  return request<UserProfile>({
    url: `/users/me/cards/${card.id}`,
    method: 'PUT',
    data: { ...card },
  })
}

/** 将指定模卡设为企业端唯一公开展示的主模卡。 */
export async function setPrimaryAnchorCard(cardId: string): Promise<UserProfile> {
  if (USE_MOCK) {
    const anchorCards = (MOCK_USER.anchorCards ?? []).map((item) => ({ ...item, isPrimary: item.id === cardId }))
    return mockProfileWithCards(anchorCards)
  }
  return request<UserProfile>({ url: `/users/me/cards/${cardId}/primary`, method: 'POST' })
}

/** 删除一张不再使用的模卡；删除主模卡时服务端会自动补选一张。 */
export async function deleteAnchorCard(cardId: string): Promise<UserProfile> {
  if (USE_MOCK) {
    const anchorCards = (MOCK_USER.anchorCards ?? []).filter((item) => item.id !== cardId)
    return mockProfileWithCards(anchorCards)
  }
  return request<UserProfile>({ url: `/users/me/cards/${cardId}`, method: 'DELETE' })
}

/** 将模卡录屏或图片上传到 Java 服务，返回可长期访问的完整地址。 */
export async function uploadCardMedia(filePath: string): Promise<string> {
  const token = getStorage<string | undefined>(tokenKeyForRole('anchor'), undefined)
  if (!token) return Promise.reject(new Error('anchor session required'))
  try {
    const response = await Taro.uploadFile({
      url: `${API_BASE_URL}/uploads/media`,
      filePath,
      name: 'file',
      header: { Authorization: `Bearer ${token}` },
    })
    const body = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
    if (!body || body.code !== 0 || !body.data?.path) throw new Error(body?.message || `上传失败（${response.statusCode}）`)
    return `${API_BASE_URL.replace(/\/api\/v1\/?$/, '')}${body.data.path}`
  } catch (error) {
    Taro.showToast({ title: error instanceof Error ? error.message : '上传失败，请重试', icon: 'none' })
    return Promise.reject(error)
  }
}

/** 企业端读取已公开的主播模卡；服务端会校验 merchant 身份。 */
export async function fetchTalents(filter: { keyword?: string; gender?: string; category?: string } = {}): Promise<TalentProfile[]> {
  if (USE_MOCK) return mockResponse([])
  return request<TalentProfile[]>({ url: '/talents', data: filter })
}

/** 企业端读取单个公开模卡，不返回主播手机号等私有账户字段。 */
export async function fetchTalentById(id: string): Promise<TalentProfile> {
  return request<TalentProfile>({ url: `/talents/${id}` })
}
