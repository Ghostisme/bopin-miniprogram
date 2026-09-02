/**
 * 本地存储封装
 *
 * 为什么封装：Taro.getStorageSync 返回 any 且异常时行为不一致；直接散用会导致
 * 类型丢失、key 硬编码散落、解析失败无兜底。这里统一收口：泛型化、集中管理 key、
 * 读取失败静默降级到默认值（存储读取失败不应让页面崩溃）。
 */

import Taro from '@tarojs/taro'

/**
 * 存储 key 常量。集中管理避免字符串魔法值散落各处、拼写不一致导致读写 key 不匹配。
 */
export const STORAGE_KEYS = {
  /** 旧版本共享 token，仅保留用于兼容历史缓存；新请求只读取身份专属 token */
  TOKEN: 'token',
  /** 当前使用的身份：主播 / 企业 */
  ACTIVE_ROLE: 'active_role',
  /** 主播身份独立登录 token */
  ANCHOR_TOKEN: 'anchor_token',
  /** 企业身份独立登录 token */
  MERCHANT_TOKEN: 'merchant_token',
  /** 用户资料 / 简历 */
  USER_PROFILE: 'user_profile',
  /** 消息剩余额度缓存 */
  MESSAGE_QUOTA: 'message_quota',
  /** 上次选择的城市，用于列表页默认筛选 */
  LAST_CITY: 'last_city',
} as const

export type AppRole = 'anchor' | 'merchant'

export function getActiveRole(): AppRole {
  return getStorage<AppRole>(STORAGE_KEYS.ACTIVE_ROLE, 'anchor')
}

export function setActiveRole(role: AppRole): void {
  setStorage(STORAGE_KEYS.ACTIVE_ROLE, role)
}

export function tokenKeyForRole(role: AppRole): string {
  return role === 'merchant' ? STORAGE_KEYS.MERCHANT_TOKEN : STORAGE_KEYS.ANCHOR_TOKEN
}

/**
 * 读取本地存储并按泛型返回。
 *
 * @param key 存储键
 * @param defaultValue 读取失败或不存在时返回的默认值
 * @returns 反序列化后的值；异常时返回 defaultValue
 */
export function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const value = Taro.getStorageSync(key)
    // 空串 / undefined 视为「未存过」，返回默认值
    if (value === '' || value === undefined || value === null) return defaultValue
    return value as T
  } catch {
    // 存储读取异常（如小程序存储被清）不应中断业务，静默降级
    return defaultValue
  }
}

/**
 * 写入本地存储。写入失败仅吞掉异常（如超出容量），不向上抛，避免影响主流程。
 *
 * @param key 存储键
 * @param value 任意可序列化值
 */
export function setStorage<T>(key: string, value: T): void {
  try {
    Taro.setStorageSync(key, value)
  } catch {
    // 存储写入失败（容量满等）静默处理；关键数据应有服务端兜底，不依赖本地存储
  }
}

/**
 * 删除指定 key 的本地存储。
 *
 * @param key 存储键
 */
export function removeStorage(key: string): void {
  try {
    Taro.removeStorageSync(key)
  } catch {
    // 同上，删除失败无需上抛
  }
}
