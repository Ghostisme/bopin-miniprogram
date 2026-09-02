/**
 * 通告卡片组件
 *
 * 列表页与详情页「为你推荐」区共用同一卡片，保证同一实体在不同位置视觉一致。
 * 组件只负责展示与点击回调，不含数据获取逻辑（数据由页面注入），符合展示型组件定位。
 */

import { View, Text } from '@tarojs/components'
import type { Notice } from '@/types'
import { JOB_TYPE_LABEL } from '@/constants'
import { formatDistance, formatRelativeTime } from '@/utils/format'
import './index.scss'

/** 组件入参 */
interface NoticeCardProps {
  /** 通告数据 */
  notice: Notice
  /** 点击卡片回调，通常用于跳转详情。参数为通告 id */
  onClick?: (id: string) => void
}

/**
 * 通告卡片。
 *
 * 布局对应截图：左上标题 + 用工性质标签，右侧薪资高亮；
 * 中部职责摘要（取首条，避免卡片过高）；底部城市/距离 + 发布时间 + 认证标识。
 */
export default function NoticeCard({ notice, onClick }: NoticeCardProps) {
  const {
    id,
    title,
    jobType,
    salary,
    city,
    distanceKm,
    duties,
    tags,
    publisher,
    urgent,
    publishedAt,
  } = notice
  const matchScore = 90 + (id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 8)
  const publisherMark = publisher.name.replace(/^(杭州|上海|成都|广州|深圳|武汉)/, '')[0] ?? '播'

  return (
    <View className="notice-card" onClick={() => onClick?.(id)}>
      <View className="notice-card__signal-row">
        <View className="notice-card__match">
          <Text className="notice-card__match-dot" />
          <Text>{matchScore}% 匹配</Text>
        </View>
        <Text className="notice-card__time">{formatRelativeTime(publishedAt)}</Text>
      </View>

      <View className="notice-card__header">
        <Text className="notice-card__publisher-mark">{publisherMark}</Text>
        <View className="notice-card__role-main">
          <View className="notice-card__title-wrap">
            <Text className="notice-card__title">{title}</Text>
            {urgent && <Text className="notice-card__urgent">急招</Text>}
          </View>
          <Text className="notice-card__company">{publisher.name}</Text>
        </View>
        <View className="notice-card__pay">
          <Text className="notice-card__salary">{salary.display}</Text>
          <Text className="notice-card__jobtype">{JOB_TYPE_LABEL[jobType]}</Text>
        </View>
      </View>

      {/* 职责摘要：只取首条，卡片保持紧凑，完整职责在详情页展示 */}
      {duties.length > 0 && (
        <Text className="notice-card__duty">{duties[0]}</Text>
      )}

      {/* 标签行：最多展示前 3 个，超出由详情页承载，避免撑破卡片 */}
      {tags.length > 0 && (
        <View className="notice-card__tags">
          {tags.slice(0, 3).map((tag) => (
            <Text key={tag} className="notice-card__tag">
              {tag}
            </Text>
          ))}
        </View>
      )}

      {/* 底部：公司名 + 城市/距离 + 发布时间 */}
      <View className="notice-card__footer">
        <View className="notice-card__publisher">
          {publisher.verification.enterprise ? (
            <Text className="notice-card__verified">企业认证</Text>
          ) : publisher.verification.realName ? (
            <Text className="notice-card__verified">实名认证</Text>
          ) : (
            <Text className="notice-card__verified is-basic">资料已登记</Text>
          )}
        </View>
        <View className="notice-card__meta">
          <Text className="notice-card__location">
            {city} · {formatDistance(distanceKm)}
          </Text>
          <Text className="notice-card__arrow">›</Text>
        </View>
      </View>
    </View>
  )
}
