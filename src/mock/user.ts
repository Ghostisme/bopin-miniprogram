/**
 * 当前用户 mock 数据
 *
 * 对应「我的」页面。默认给一个已登录、已实名但未填模卡的主播，
 * 便于展示「已认证」标识与「去完善模卡」引导。
 */

import type { UserProfile } from '@/types'

/** 当前登录用户。anchorCard 为 null 用于触发「完善模卡」引导入口 */
export const MOCK_USER: UserProfile = {
  id: 'u_9001',
  role: 'anchor',
  nickname: '播聘用户',
  avatar: '',
  phone: '138****8888',
  verified: true,
  resume: null,
  anchorCard: null,
  cardCompleted: false,
}

export const MOCK_MERCHANT_USER: UserProfile = {
  id: 'u_merchant_demo',
  role: 'merchant',
  nickname: '播聘企业演示',
  avatar: '',
  phone: '139****5200',
  verified: true,
  resume: null,
  anchorCard: null,
  cardCompleted: true,
}
