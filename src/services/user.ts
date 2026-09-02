/**
 * 用户 service
 *
 * 封装「我的」页面所需的当前用户资料读取，以及简历更新。
 * 默认写入 Java 服务，离线设计预览时可切换到本地数据。
 */

import type { UserProfile, Resume, AnchorCard, AuthSession, UserRole } from '@/types'
import { USE_MOCK, request, mockResponse } from '@/utils/request'
import { MOCK_MERCHANT_USER, MOCK_USER } from '@/mock/user'
import { setActiveRole, setStorage, STORAGE_KEYS, tokenKeyForRole } from '@/utils/storage'

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

/** 保存主播模卡。未完成模卡的主播不能解锁联系方式、沟通或报名平台服务。 */
export async function updateAnchorCard(card: AnchorCard): Promise<UserProfile> {
  if (USE_MOCK) return mockResponse({ ...MOCK_USER, anchorCard: card, cardCompleted: true })
  return request<UserProfile>({
    url: '/users/me/card',
    method: 'PUT',
    data: { ...card },
  })
}
