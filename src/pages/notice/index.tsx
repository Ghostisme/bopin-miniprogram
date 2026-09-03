/**
 * 通告列表页（首页 · 通告 tab）
 *
 * 应用主入口页，对应截图首屏：顶部搜索栏 + 筛选/排序栏，中部通告卡片流，
 * 新主播未创建模卡时，会在首条通告后展示模卡创建引导。
 *
 * 数据流：本页作为 filter 状态的单一持有者，FilterBar/SearchBar 只上报增量变化，
 * 由本页合并后统一触发 fetchNotices。这样筛选来源唯一，避免多组件各自请求导致竞态。
 */

import { useState, useCallback } from 'react'
import { Image, Text, View } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import type { Notice, NoticeFilter } from '@/types'
import { fetchNotices, fetchUserProfile } from '@/services'
import { getStorage, setActiveRole, setStorage, STORAGE_KEYS, tokenKeyForRole } from '@/utils/storage'
import SearchBar from '@/components/SearchBar'
import FilterBar from '@/components/FilterBar'
import NoticeCard from '@/components/NoticeCard'
import EmptyState from '@/components/EmptyState'
import './index.scss'

import cardCover from '@/assets/card/cover.jpg'
import cardClipOne from '@/assets/card/clip-1.jpg'
import cardClipTwo from '@/assets/card/clip-2.jpg'

/**
 * 列表页组件。
 *
 * 为什么用 useDidShow 而非 useLoad：从详情页返回时也应刷新（可能有新沟通状态），
 * useDidShow 在每次页面显示时触发，比只跑一次的 useLoad 更贴合 tab 页语义。
 */
export default function NoticePage() {
  // 筛选条件：本页唯一数据源。city 初始尝试读上次选择，提升「记住我常用城市」体验
  const [filter, setFilter] = useState<NoticeFilter>(() => ({
    city: getStorage<string | undefined>(STORAGE_KEYS.LAST_CITY, undefined),
  }))
  const [list, setList] = useState<Notice[]>([])
  const [loading, setLoading] = useState(false)
  const [showCardGuide, setShowCardGuide] = useState(false)

  const goEmployerCenter = () => {
    setActiveRole('merchant')
    if (getStorage<string | undefined>(tokenKeyForRole('merchant'), undefined)) {
      Taro.navigateTo({ url: '/pages/my-notices/index' })
    } else {
      Taro.navigateTo({ url: '/pages/role-login/index?role=merchant' })
    }
  }

  const goCreateNotice = () => {
    setActiveRole('merchant')
    if (getStorage<string | undefined>(tokenKeyForRole('merchant'), undefined)) Taro.navigateTo({ url: '/pages/edit-notice/index' })
    else Taro.navigateTo({ url: '/pages/role-login/index?role=merchant' })
  }

  const goCreateCard = () => {
    setActiveRole('anchor')
    Taro.switchTab({ url: '/pages/mine/index' })
  }

  const applyQuickFilter = (patch: Partial<NoticeFilter>) => {
    handleFilterChange(patch)
  }

  /**
   * 拉取列表。用 useCallback 固定引用，避免作为依赖时触发多余请求。
   * 接受可选的 override，便于「变更筛选的同时立即用新值请求」，规避 setState 异步读不到最新值的问题。
   */
  const loadList = useCallback(async (nextFilter: NoticeFilter) => {
    setLoading(true)
    try {
      const data = await fetchNotices(nextFilter)
      setList(data)
    } catch {
      // 请求层已经提示错误；保留当前列表，避免未处理的 Promise 触发整页错误。
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCardGuide = useCallback(async () => {
    if (!getStorage<string | undefined>(tokenKeyForRole('anchor'), undefined)) {
      setShowCardGuide(false)
      return
    }
    try {
      const profile = await fetchUserProfile()
      setStorage(STORAGE_KEYS.USER_PROFILE, profile)
      setShowCardGuide(!profile.cardCompleted && !profile.anchorCard && !(profile.anchorCards?.length))
    } catch {
      setShowCardGuide(false)
    }
  }, [])

  // 通告页是主播端主页：每次显示都刷新机会和主播自己的模卡状态。
  useDidShow(() => {
    setActiveRole('anchor')
    void loadList(filter)
    void loadCardGuide()
  })

  // 下拉刷新：重新拉取并结束原生刷新态
  usePullDownRefresh(async () => {
    await loadList(filter)
    Taro.stopPullDownRefresh()
  })

  /** 合并筛选增量并立即用新值请求。city 变化时顺手持久化，供下次进入默认选中 */
  const handleFilterChange = (patch: Partial<NoticeFilter>) => {
    const next = { ...filter, ...patch }
    setFilter(next)
    if ('city' in patch) {
      setStorage(STORAGE_KEYS.LAST_CITY, patch.city)
    }
    loadList(next)
  }

  /**
   * 关键词输入实时回显（受控）。
   * 只更新 filter.keyword 用于输入框回显，不触发请求，避免每敲一个字就查一次。
   * 真正的查询交给 handleSearch（点搜索按钮或键盘确认时）。
   */
  const handleKeywordChange = (keyword: string) => {
    setFilter((prev) => ({ ...prev, keyword: keyword || undefined }))
  }

  /** 触发搜索（点击搜索按钮 / 键盘确认）。用最新关键词合并后请求 */
  const handleSearch = (keyword: string) => {
    const next = { ...filter, keyword: keyword || undefined }
    setFilter(next)
    loadList(next)
  }

  /** 点击卡片跳详情，透传 id */
  const goDetail = (id: string) => {
    Taro.navigateTo({ url: `/subpages/detail/notice-detail/index?id=${id}` })
  }

  return (
    <View className="notice-page">
      <View className="notice-page__intro">
        <View className="notice-page__brand-row">
          <View>
            <Text className="notice-page__brand">播聘</Text>
            <Text className="notice-page__brand-note">主播职业机会平台</Text>
          </View>
          <Text className="notice-page__city">杭州 ▾</Text>
        </View>

        <View className="notice-page__role-switch">
          <View className="notice-page__role is-active" onClick={() => setActiveRole('anchor')}>
            <Text>主播找工作</Text>
          </View>
          <View className="notice-page__role" onClick={goEmployerCenter}>
            <Text>企业招主播</Text>
          </View>
        </View>

        <View className="notice-page__hero">
          <View className="notice-page__hero-copy">
            <Text className="notice-page__hero-kicker">今日精选 · 真实招聘方</Text>
            <Text className="notice-page__hero-title">让每一次开播，都有好机会</Text>
            <Text className="notice-page__hero-subtitle">86 个机会 · 今日新增 18</Text>
          </View>
          <View className="notice-page__talent-stack" aria-hidden>
            <View className="notice-page__talent-card talent-card--back">带货</View>
            <View className="notice-page__talent-card talent-card--mid">美妆</View>
            <View className="notice-page__talent-card talent-card--front">直播</View>
          </View>
        </View>
      </View>

      <View className="notice-page__quick-actions">
        <View className="notice-page__quick" onClick={() => applyQuickFilter({ sort: 'recommend' })}>
          <Text className="notice-page__quick-icon quick-icon--salary">薪</Text>
          <Text className="notice-page__quick-label">高薪急招</Text>
        </View>
        <View className="notice-page__quick" onClick={() => applyQuickFilter({ sort: 'nearby' })}>
          <Text className="notice-page__quick-icon quick-icon--nearby">近</Text>
          <Text className="notice-page__quick-label">附近机会</Text>
        </View>
        <View className="notice-page__quick" onClick={goCreateCard}>
          <Text className="notice-page__quick-icon quick-icon--card">卡</Text>
          <Text className="notice-page__quick-label">创建模卡</Text>
        </View>
        <View className="notice-page__quick" onClick={goCreateNotice}>
          <Text className="notice-page__quick-icon quick-icon--publish">发</Text>
          <Text className="notice-page__quick-label">发布通告</Text>
        </View>
      </View>

      {/* 顶部固定区：搜索 + 筛选。sticky 让其在滚动时吸顶 */}
      <View className="notice-page__sticky">
        <SearchBar
          value={filter.keyword ?? ''}
          placeholder="搜索主播通告、城市、品类"
          onChange={handleKeywordChange}
          onSearch={handleSearch}
        />
        <FilterBar filter={filter} onChange={handleFilterChange} />
      </View>

      {/* 列表区 */}
      <View className="notice-page__list">
        <View className="notice-page__list-heading">
          <View>
            <Text className="notice-page__list-title">为你优选</Text>
            <Text className="notice-page__list-subtitle">按匹配度与企业可信度排序</Text>
          </View>
          <Text className="notice-page__list-count">{list.length} 个机会</Text>
        </View>
        {list.length === 0 && !loading ? <EmptyState text="暂无符合条件的通告，换个筛选试试" /> : list.map((notice, index) => (
          <View className="notice-page__notice-item" key={notice.id}>
            <NoticeCard notice={notice} onClick={goDetail} />
            {index === 0 && showCardGuide && <ModelCardGuide onCreate={goCreateCard} onClose={() => setShowCardGuide(false)} />}
          </View>
        ))}
        {list.length === 0 && showCardGuide && <ModelCardGuide onCreate={goCreateCard} onClose={() => setShowCardGuide(false)} />}
      </View>
    </View>
  )
}

function ModelCardGuide({ onCreate, onClose }: { onCreate: () => void; onClose: () => void }) {
  return (
    <View className="notice-page__card-guide" onClick={onCreate}>
      <Text className="notice-page__card-guide-close" onClick={(event) => { event.stopPropagation(); onClose() }}>×</Text>
      <View className="notice-page__card-guide-art" aria-hidden>
        <View className="notice-page__card-guide-image is-left"><Image src={cardClipOne} mode="aspectFill" /></View>
        <View className="notice-page__card-guide-image is-center"><Image src={cardCover} mode="aspectFill" /></View>
        <View className="notice-page__card-guide-image is-right"><Image src={cardClipTwo} mode="aspectFill" /></View>
      </View>
      <Text className="notice-page__card-guide-title">制作一张好模卡，让企业先看见你</Text>
      <Text className="notice-page__card-guide-text">上传直播作品和经验，建立可被企业查看的主播模卡。</Text>
      <View className="notice-page__card-guide-button">去创建模卡</View>
    </View>
  )
}
