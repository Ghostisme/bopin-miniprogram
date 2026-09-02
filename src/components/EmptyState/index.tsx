/**
 * 空态 / 缺省页组件
 *
 * 统一各列表页「无数据」「加载中」的占位展示，避免每个页面各写一套空态导致视觉不一致。
 * 纯展示组件：文案与是否 loading 由页面传入，组件不含任何数据逻辑。
 */

import { View, Text } from '@tarojs/components'
import './index.scss'

/** 组件入参 */
interface EmptyStateProps {
  /** 是否处于加载中。为 true 时展示「加载中」而非空态文案 */
  loading?: boolean
  /** 空态主文案，默认「暂无数据」 */
  text?: string
  /** 空态补充说明（可选） */
  hint?: string
}

/**
 * 空态占位。
 *
 * 加载态与空态复用同一容器，切换时不改变布局高度，避免列表在 loading→empty 之间抖动。
 */
export default function EmptyState({
  loading = false,
  text = '暂无数据',
  hint,
}: EmptyStateProps) {
  return (
    <View className="empty-state">
      {/* 用纯 CSS 圆点动画表示加载，避免额外引入图片资源 */}
      {loading ? (
        <View className="empty-state__loading">
          <View className="empty-state__dot" />
          <View className="empty-state__dot" />
          <View className="empty-state__dot" />
        </View>
      ) : (
        <View className="empty-state__icon">📭</View>
      )}
      <Text className="empty-state__text">{loading ? '加载中…' : text}</Text>
      {!loading && hint && <Text className="empty-state__hint">{hint}</Text>}
    </View>
  )
}
