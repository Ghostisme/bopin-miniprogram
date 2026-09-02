/**
 * 网络请求封装
 *
 * 统一处理 Java 服务的 baseURL、超时、鉴权头、错误提示与响应解包。
 *
 * 设计要点：
 * - 页面只依赖 `request<T>()` 的 Promise<T> 语义，不感知底层是 mock 还是真实接口；
 * - 保留 USE_MOCK 开关，方便离线设计预览和接口故障时的页面回归。
 */
import Taro from '@tarojs/taro'
import { getActiveRole, getStorage, tokenKeyForRole } from './storage'

/** 是否使用本地 mock 数据。当前默认接入本地 Java 服务。 */
export const USE_MOCK = false

/**
 * 后端基础地址。
 *
 * H5 本地预览默认连接 Spring Boot；微信真机发布时通过
 * TARO_APP_API_BASE_URL 替换为已备案 HTTPS 域名即可。
 */
const RUNTIME_API_BASE_URL = typeof process !== 'undefined' && process.env
  ? process.env.TARO_APP_API_BASE_URL
  : undefined
const BASE_URL = RUNTIME_API_BASE_URL || 'http://localhost:8080/api/v1'

/** 请求超时时间（ms） */
const TIMEOUT = 10000

/** 统一的后端响应包裹结构，约定 code=0 为成功 */
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/** request 的可选参数，裁剪自 Taro.request 的 option，隐藏无关字段 */
interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown>
  /** 是否需要携带鉴权 token，默认 true */
  auth?: boolean
}

/**
 * 发起一次请求并解包出业务数据。
 *
 * @typeParam T - 业务数据类型（即 ApiResponse.data 的类型）
 * @param options - 请求参数
 * @returns 解包后的业务数据 Promise
 * @throws 当网络失败或 code !== 0 时 reject，并已弹出 toast 提示
 */
export async function request<T>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, auth = true } = options
  const requestData = method === 'GET' && data
    ? Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined && value !== null && value !== ''))
    : data

  // 组装鉴权头：仅在需要鉴权且本地存有 token 时附带，避免匿名接口误带空 token
  const header: Record<string, string> = { 'content-type': 'application/json' }
  if (auth) {
    const token = getStorage<string | undefined>(tokenKeyForRole(getActiveRole()), undefined)
    if (token) header.Authorization = `Bearer ${token}`
  }

  try {
    const res = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data: requestData,
      header,
      timeout: TIMEOUT,
    })

    const body = res.data as ApiResponse<T>
    // 业务错误：HTTP 200 但 code 非 0，视为失败并提示
    if (body.code !== 0) {
      Taro.showToast({ title: body.message || '请求失败', icon: 'none' })
      return Promise.reject(body)
    }
    return body.data
  } catch (err) {
    // 网络层错误（超时、断网等），统一兜底提示
    Taro.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
    return Promise.reject(err)
  }
}

/**
 * 模拟网络延迟，让 mock 数据的返回带有真实的异步节奏。
 * 便于离线设计预览时也能验证 loading 态、骨架屏等交互。
 *
 * @param data - 要返回的 mock 数据
 * @param delay - 延迟毫秒数，默认 300ms
 */
export function mockResponse<T>(data: T, delay = 300): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}
