/**
 * 通告详情页
 *
 * 从列表页点卡片跳入,通过 query.id 拉取完整通告数据。
 * 页面结构(自上而下):岗位头部卡片 → 职责与要求 → 地图 → 底部推荐列表 → 固定操作栏。
 *
 * 数据流:onLoad 读 id → fetchNoticeDetail 拉详情 → fetchRecommendNotices 拉推荐。
 * 不存在的 id 返回 null,展示「通告已下架」占位,避免白屏。
 */

import { useState } from 'react'
import { View, Text, ScrollView, Map } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import type { Notice } from '@/types'
import { fetchNoticeDetail, fetchRecommendNotices } from '@/services'
import { formatDistance, formatRelativeTime } from '@/utils/format'
import { JOB_TYPE_LABEL, CATEGORY_LABEL } from '@/constants'
import { getStorage, setActiveRole, tokenKeyForRole } from '@/utils/storage'
import NoticeCard from '@/components/NoticeCard'
import EmptyState from '@/components/EmptyState'
import './index.scss'

export default function NoticeDetailPage() {
  const router = useRouter()
  const [detail, setDetail] = useState<Notice | null>(null)
  const [recommend, setRecommend] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

  useLoad(async () => {
    const { id } = router.params
    if (!id) return

    setLoading(true)
    try {
      const data = await fetchNoticeDetail(id)
      setDetail(data)
      // 详情加载成功后拉推荐,排除当前这条
      if (data) {
        const rec = await fetchRecommendNotices(id, 3)
        setRecommend(rec)
      }
    } finally {
      setLoading(false)
    }
  })

  /** 沟通按钮:跳转消息页(tab 切换),实际项目应携带通告 id 进入单聊 */
  const handleContact = () => {
    setActiveRole('anchor')
    if (!getStorage<string | undefined>(tokenKeyForRole('anchor'), undefined)) {
      Taro.navigateTo({ url: '/pages/role-login/index?role=anchor' })
      return
    }
    Taro.switchTab({ url: '/pages/message/index' })
  }

  /** 点推荐卡片跳到另一条详情,重新拉数据 */
  const goDetail = (id: string) => {
    Taro.redirectTo({ url: `/subpages/detail/notice-detail/index?id=${id}` })
  }

  if (loading) {
    return (
      <View className="detail-page">
        <EmptyState loading />
      </View>
    )
  }

  if (!detail) {
    return (
      <View className="detail-page">
        <EmptyState text="通告不存在或已下架" />
      </View>
    )
  }

  const {
    title,
    jobType,
    category,
    salary,
    city,
    address,
    distanceKm,
    longitude,
    latitude,
    duties,
    requirements,
    tags,
    publisher,
    urgent,
    publishedAt,
    viewCount,
  } = detail

  return (
    <ScrollView className="detail-page" scrollY>
      {/* 头部卡片:标题/薪资/标签/公司 */}
      <View className="detail-page__header">
        {urgent && <View className="detail-page__urgent-badge">急招</View>}
        <Text className="detail-page__title">{title}</Text>
        <View className="detail-page__meta-row">
          <Text className="detail-page__tag">{JOB_TYPE_LABEL[jobType]}</Text>
          <Text className="detail-page__tag">{CATEGORY_LABEL[category]}</Text>
          <Text className="detail-page__salary">{salary.display}</Text>
        </View>
        <View className="detail-page__tags">
          {tags.map((tag) => (
            <Text key={tag} className="detail-page__chip">
              {tag}
            </Text>
          ))}
        </View>
        <View className="detail-page__publisher">
          {publisher.verification.realName && (
            <Text className="detail-page__verified">实名</Text>
          )}
          <Text className="detail-page__company">{publisher.name}</Text>
        </View>
        <View className="detail-page__info-row">
          <Text className="detail-page__info">
            {city} · {formatDistance(distanceKm)}
          </Text>
          <Text className="detail-page__info">
            {formatRelativeTime(publishedAt)} · {viewCount}次浏览
          </Text>
        </View>
      </View>

      {/* 职责与要求 */}
      <View className="detail-page__section">
        <Text className="detail-page__section-title">岗位职责</Text>
        {duties.map((duty, i) => (
          <Text key={i} className="detail-page__item">
            {i + 1}. {duty}
          </Text>
        ))}
      </View>

      <View className="detail-page__section">
        <Text className="detail-page__section-title">任职要求</Text>
        {requirements.map((req, i) => (
          <Text key={i} className="detail-page__item">
            {i + 1}. {req}
          </Text>
        ))}
      </View>

      {/* 地图 */}
      <View className="detail-page__section">
        <Text className="detail-page__section-title">工作地点</Text>
        <Text className="detail-page__address">{address}</Text>
        <Map
          className="detail-page__map"
          longitude={longitude}
          latitude={latitude}
          markers={[
            {
              id: 1,
              longitude,
              latitude,
              width: 30,
              height: 30,
              iconPath: '/assets/tabbar/notice-active.png',
            },
          ]}
          showLocation
          onError={() => Taro.showToast({ title: '地图加载失败', icon: 'none' })}
        />
      </View>

      {/* 推荐列表 */}
      {recommend.length > 0 && (
        <View className="detail-page__section">
          <Text className="detail-page__section-title">为你推荐急招通告</Text>
          {recommend.map((item) => (
            <NoticeCard key={item.id} notice={item} onClick={goDetail} />
          ))}
        </View>
      )}

      {/* 底部留白防止被固定栏遮挡 */}
      <View style={{ height: '120px' }} />

      {/* 固定底部操作栏 */}
      <View className="detail-page__footer">
        <View className="detail-page__btn detail-page__btn--contact" onClick={handleContact}>
          立即沟通
        </View>
      </View>
    </ScrollView>
  )
}
