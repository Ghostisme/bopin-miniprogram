/**
 * 格式化工具集
 *
 * 集中处理「原始数据 -> UI 展示文案」的转换。为什么单独成层：
 * 这些逻辑在多个页面/组件重复出现（列表卡片、详情页、消息列表都要格式化时间/距离），
 * 抽出后既保证展示口径一致，又便于单测。所有函数均为纯函数，无副作用。
 */

/**
 * 把时间戳格式化为「相对时间」文案，用于消息列表与通告发布时间。
 *
 * 为什么用相对时间：招聘场景下用户更关心「多久之前发的」而非绝对日期；
 * 超过 7 天才回退到绝对日期，避免「30 天前」这类模糊表述影响判断。
 *
 * @param timestamp 毫秒级时间戳
 * @param now 当前时间（可注入，便于测试），默认取 Date.now()
 * @returns 形如「刚刚」「5分钟前」「3小时前」「2天前」「01-15」的文案
 */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const diff = now - timestamp
  // 负数（未来时间）或极小值统一按「刚刚」处理，避免出现「-1分钟前」
  if (diff < 0) return '刚刚'

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  if (diff < day) return `${Math.floor(diff / hour)}小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)}天前`

  // 超过 7 天回退到「MM-DD」绝对日期
  const date = new Date(timestamp)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${mm}-${dd}`
}

/**
 * 格式化距离展示。
 *
 * 小于 1km 时用「m」并取整到百米，避免「0.03km」这类不直观的表达；
 * 大于等于 1km 保留一位小数。
 *
 * @param km 距离，单位公里
 * @returns 形如「800m」「1.2km」的文案
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    // 取整到百米，减少无意义精度
    const meters = Math.round(km * 1000)
    return `${meters}m`
  }
  return `${km.toFixed(1)}km`
}

/**
 * 格式化未读数角标。
 *
 * 超过 99 统一显示「99+」，符合主流 IM 惯例，避免长数字撑破角标布局。
 *
 * @param count 未读条数
 * @returns 展示文案；为 0 时返回空串，由调用方决定是否隐藏角标
 */
export function formatBadge(count: number): string {
  if (count <= 0) return ''
  if (count > 99) return '99+'
  return String(count)
}
