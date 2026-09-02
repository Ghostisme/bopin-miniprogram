/**
 * 通告列表页（首页 · 通告 tab）
 *
 * 应用主入口页，对应截图首屏：顶部搜索栏 + 筛选/排序栏，中部通告卡片流，
 * 右下角悬浮「粘贴你的资料」入口（AI 简历）。
 *
 * 数据流：本页作为 filter 状态的单一持有者，FilterBar/SearchBar 只上报增量变化，
 * 由本页合并后统一触发 fetchNotices。这样筛选来源唯一，避免多组件各自请求导致竞态。
 */

import { useState, useCallback } from 'react'
import { Text, View } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import type { Notice, NoticeFilter } from '@/types'
import { fetchNotices, updateResume } from '@/services'
import { getStorage, setActiveRole, setStorage, STORAGE_KEYS, tokenKeyForRole } from '@/utils/storage'
import SearchBar from '@/components/SearchBar'
import FilterBar from '@/components/FilterBar'
import NoticeCard from '@/components/NoticeCard'
import EmptyState from '@/components/EmptyState'
import PasteResumeModal from '@/components/PasteResumeModal'
import './index.scss'

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
  // 粘贴资料弹窗可见性
  const [pasteVisible, setPasteVisible] = useState(false)

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
    } finally {
      setLoading(false)
    }
  }, [])

  // 每次页面显示时用当前筛选刷新列表
  useDidShow(() => { loadList(filter) })

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

  /**
   * 提交粘贴的简历文本。
   * 将粘贴资料交给资料服务保存；当前本地适配器先保留原文，同时落库用户城市和简介。
   */
  const handleResumeSubmit = async (rawText: string) => {
    setActiveRole('anchor')
    if (!getStorage<string | undefined>(tokenKeyForRole('anchor'), undefined)) {
      setPasteVisible(false)
      Taro.navigateTo({ url: '/pages/role-login/index?role=anchor' })
      return
    }
    await updateResume({
      nickname: '',
      categories: [],
      city: filter.city ?? '',
      intro: rawText,
    })
    setPasteVisible(false)
    Taro.showToast({ title: '简历已生成', icon: 'success' })
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
        <View className="notice-page__quick" onClick={() => setPasteVisible(true)}>
          <Text className="notice-page__quick-icon quick-icon--ai">AI</Text>
          <Text className="notice-page__quick-label">生成简历</Text>
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
        {list.length === 0 && !loading ? (
          <EmptyState text="暂无符合条件的通告，换个筛选试试" />
        ) : (
          list.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} onClick={goDetail} />
          ))
        )}
      </View>

      {/* 粘贴资料弹窗 */}
      <PasteResumeModal
        visible={pasteVisible}
        onClose={() => setPasteVisible(false)}
        onSubmit={handleResumeSubmit}
      />
    </View>
  )
}
