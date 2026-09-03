/**
 * 我的通告页面
 *
 * 商家发布的通告管理页面，包含：
 * - 顶部tab切换：全部/草稿/审核中/已发布/审核未通过
 * - 通告卡片列表
 * - 底部"创建新通告"悬浮按钮
 *
 * 对应设计稿中的"我的通告"页面
 */

import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { MyNotice, MyNoticeStatus } from '@/types'
import { fetchMyNotices } from '@/services'
import { getStorage, setActiveRole, tokenKeyForRole } from '@/utils/storage'
import { MY_NOTICE_STATUS_OPTIONS, MY_NOTICE_STATUS_LABEL } from '@/constants'
import EmptyState from '@/components/EmptyState'
import './index.scss'

/**
 * 我的通告页面组件
 *
 * 设计要点：
 * - tab切换采用横向滚动，状态较多时不换行
 * - 卡片展示：标题/状态/统计数据（浏览数、投递数）
 * - 底部固定"创建新通告"按钮
 */
export default function MyNoticesPage() {
  const [activeTab, setActiveTab] = useState<MyNoticeStatus | 'all'>('all')
  const [list, setList] = useState<MyNotice[]>([])
  const [loading, setLoading] = useState(false)

  /**
   * 加载我的通告列表
   * @param status 筛选状态，'all' 表示加载全部
   */
  const loadList = async (status: MyNoticeStatus | 'all') => {
    setLoading(true)
    try {
      const data = await fetchMyNotices(status === 'all' ? undefined : status)
      setList(data)
    } catch {
      Taro.redirectTo({ url: '/subpages/feature/role-login/index?role=merchant' })
    } finally {
      setLoading(false)
    }
  }

  // 页面显示时加载数据
  useDidShow(() => {
    setActiveRole('merchant')
    if (!getStorage<string | undefined>(tokenKeyForRole('merchant'), undefined)) {
      Taro.redirectTo({ url: '/subpages/feature/role-login/index?role=merchant' })
      return
    }
    loadList(activeTab)
  })

  /**
   * 切换tab
   * @param status 目标状态
   */
  const handleTabChange = (status: MyNoticeStatus | 'all') => {
    setActiveTab(status)
    loadList(status)
  }

  /**
   * 点击卡片跳转详情/编辑
   * @param notice 通告数据
   */
  const handleCardClick = (notice: MyNotice) => {
    // 草稿状态跳转编辑页，其他状态跳转详情页
    if (notice.status === 'draft') {
      Taro.navigateTo({ url: `/subpages/feature/edit-notice/index?id=${notice.id}` })
    } else {
      Taro.navigateTo({ url: `/subpages/detail/notice-detail/index?id=${notice.id}` })
    }
  }

  /**
   * 创建新通告
   */
  const handleCreate = () => {
    Taro.navigateTo({ url: '/subpages/feature/edit-notice/index' })
  }

  const switchToAnchor = () => {
    setActiveRole('anchor')
    Taro.switchTab({ url: '/pages/notice/index' })
  }

  return (
    <View className="my-notices-page">
      <View className="my-notices-page__identity">
        <View className="my-notices-page__identity-copy">
          <Text className="my-notices-page__identity-eyebrow">企业端</Text>
          <Text className="my-notices-page__identity-title">我的通告</Text>
        </View>
        <View className="my-notices-page__identity-actions">
          <Text className="my-notices-page__talents-link" onClick={() => Taro.navigateTo({ url: '/subpages/feature/talents/index' })}>主播库</Text>
          <Text className="my-notices-page__switch-role" onClick={switchToAnchor}>切换主播端</Text>
        </View>
      </View>

      {/* 顶部状态筛选 */}
      <View className="my-notices-page__tabs">
        {MY_NOTICE_STATUS_OPTIONS.map((opt) => (
          <View
            key={opt.value}
            className={`my-notices-page__tab ${activeTab === opt.value ? 'is-active' : ''}`}
            onClick={() => handleTabChange(opt.value)}
          >
            <Text className="my-notices-page__tab-text">{opt.label}</Text>
          </View>
        ))}
      </View>

      {/* 列表区 */}
      <View className="my-notices-page__list">
        {list.length === 0 && !loading ? (
          <EmptyState text="当前没有通告" />
        ) : (
          list.map((notice) => (
            <View
              key={notice.id}
              className="my-notices-page__card"
              onClick={() => handleCardClick(notice)}
            >
              {/* 卡片头部：标题 + 状态标签 */}
              <View className="my-notices-page__card-header">
                <Text className="my-notices-page__card-title">{notice.title}</Text>
                <Text
                  className={`my-notices-page__status-badge status-${notice.status}`}
                >
                  {MY_NOTICE_STATUS_LABEL[notice.status]}
                </Text>
              </View>

              {/* 职位信息 */}
              <View className="my-notices-page__card-info">
                <Text className="my-notices-page__card-salary">
                  {notice.salary.display}
                </Text>
                <Text className="my-notices-page__card-meta">
                  {notice.city} · {notice.category}
                </Text>
              </View>

              {/* 统计数据 */}
              <View className="my-notices-page__card-stats">
                <View className="my-notices-page__stat-item">
                  <Text className="my-notices-page__stat-label">浏览</Text>
                  <Text className="my-notices-page__stat-value">{notice.viewCount}</Text>
                </View>
                <View className="my-notices-page__stat-item">
                  <Text className="my-notices-page__stat-label">投递</Text>
                  <Text className="my-notices-page__stat-value">{notice.applyCount}</Text>
                </View>
              </View>

              {/* 审核拒绝原因（仅未通过时显示） */}
              {notice.status === 'rejected' && notice.rejectReason && (
                <View className="my-notices-page__reject-reason">
                  <Text className="my-notices-page__reject-label">拒绝原因：</Text>
                  <Text className="my-notices-page__reject-text">
                    {notice.rejectReason}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* 底部创建按钮 */}
      <View className="my-notices-page__create-btn" onClick={handleCreate}>
        <Text className="my-notices-page__create-icon">＋</Text>
        <Text>发布通告</Text>
      </View>
    </View>
  )
}
