/**
 * 我的页
 *
 * 对应截图「我的」tab。头部用户资料卡 + 菜单列表。
 * 未实名/未填简历时展示对应引导入口,已填则展示简历摘要。
 */

import { useState } from 'react'
import { Image, View, Text, Input, Textarea } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { AnchorCard, UserProfile } from '@/types'
import { fetchUserProfile, updateAnchorCard } from '@/services'
import { setActiveRole, getStorage, tokenKeyForRole } from '@/utils/storage'
import EmptyState from '@/components/EmptyState'
import './index.scss'

const EMPTY_CARD: AnchorCard = {
  stageName: '',
  categories: [],
  city: '',
  intro: '',
  experienceYears: 0,
  expectedSalary: '',
  availableTime: '',
}

export default function MinePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingCard, setEditingCard] = useState(false)
  const [savingCard, setSavingCard] = useState(false)
  const [cardDraft, setCardDraft] = useState<AnchorCard>(EMPTY_CARD)

  useDidShow(async () => {
    setActiveRole('anchor')
    if (!getStorage<string | undefined>(tokenKeyForRole('anchor'), undefined)) {
      Taro.redirectTo({ url: '/pages/role-login/index?role=anchor' })
      return
    }
    setLoading(true)
    try {
      const data = await fetchUserProfile()
      setUser(data)
      if (data.anchorCard) setCardDraft({ ...EMPTY_CARD, ...data.anchorCard })
    } catch {
      Taro.redirectTo({ url: '/pages/role-login/index?role=anchor' })
    } finally {
      setLoading(false)
    }
  })

  if (loading) {
    return (
      <View className="mine-page">
        <EmptyState loading />
      </View>
    )
  }

  if (!user) {
    return (
      <View className="mine-page">
        <EmptyState text="加载失败，请稍后重试" />
      </View>
    )
  }

  const openCardEditor = () => {
    setCardDraft(user.anchorCard ? { ...EMPTY_CARD, ...user.anchorCard } : {
      ...EMPTY_CARD,
      stageName: user.nickname,
      city: user.resume?.city ?? '',
      intro: user.resume?.intro ?? '',
      categories: user.resume?.categories ?? [],
      experienceYears: user.resume?.experienceYears ?? 0,
    })
    setEditingCard(true)
  }

  const switchToMerchant = () => {
    setActiveRole('merchant')
    if (getStorage<string | undefined>(tokenKeyForRole('merchant'), undefined)) Taro.navigateTo({ url: '/pages/my-notices/index' })
    else Taro.navigateTo({ url: '/pages/role-login/index?role=merchant' })
  }

  const updateCard = (key: keyof AnchorCard, value: string | number | string[]) => {
    setCardDraft((current) => ({ ...current, [key]: value }))
  }

  const saveCard = async () => {
    const categories = cardDraft.categories.map((item) => item.trim()).filter(Boolean)
    const payload = { ...cardDraft, categories }
    if (!payload.stageName.trim() || !payload.city.trim() || !payload.intro.trim() || categories.length === 0) {
      Taro.showToast({ title: '请先完善模卡必填项', icon: 'none' })
      return
    }
    setSavingCard(true)
    try {
      const data = await updateAnchorCard(payload)
      setUser(data)
      setCardDraft({ ...EMPTY_CARD, ...(data.anchorCard ?? payload) })
      setEditingCard(false)
      Taro.showToast({ title: '模卡已保存', icon: 'success' })
    } catch {
      // request 层负责展示服务端错误
    } finally {
      setSavingCard(false)
    }
  }

  return (
    <View className="mine-page">
      {/* 头部用户卡片 */}
      <View className="mine-page__header">
        <View className="mine-page__avatar">
          {user.avatar ? (
            <Image src={user.avatar} className="mine-page__avatar-img" />
          ) : (
            <Text className="mine-page__avatar-text">{user.nickname[0]}</Text>
          )}
        </View>
        <View className="mine-page__info">
          <Text className="mine-page__nickname">{user.nickname}</Text>
          <Text className="mine-page__phone">{user.phone}</Text>
          {user.verified && (
            <View className="mine-page__verified-badge">已实名认证</View>
          )}
          <Text className={`mine-page__card-state ${user.cardCompleted ? 'is-complete' : ''}`}>
            {user.cardCompleted ? '模卡已完善' : '模卡待完善'}
          </Text>
          <Text className="mine-page__switch-role" onClick={switchToMerchant}>切换企业身份</Text>
        </View>
      </View>

      {/* 主播模卡：核心服务的必填资料 */}
      <View className="mine-page__card-section">
        <View className="mine-page__section-header">
          <View className="mine-page__card-heading">
            <Text className="mine-page__section-title">主播模卡</Text>
            <Text className={`mine-page__required-badge ${user.cardCompleted ? 'is-complete' : ''}`}>
              {user.cardCompleted ? '已完成' : '必填'}
            </Text>
          </View>
          {user.cardCompleted && !editingCard && <Text className="mine-page__link" onClick={openCardEditor}>编辑</Text>}
        </View>

        {!user.cardCompleted && !editingCard && (
          <View className="mine-page__card-empty">
            <Text className="mine-page__card-empty-title">先完善模卡，再解锁全部服务</Text>
            <Text className="mine-page__card-empty-text">艺名、品类、城市、经验和简介是企业筛选主播的关键信息。</Text>
            <View className="mine-page__btn" onClick={openCardEditor}>立即完善模卡</View>
          </View>
        )}

        {user.cardCompleted && !editingCard && user.anchorCard && (
          <View className="mine-page__card-preview">
            <View className="mine-page__card-preview-top">
              <View className="mine-page__card-avatar"><Text>{user.anchorCard.stageName.slice(0, 1)}</Text></View>
              <View className="mine-page__card-main">
                <Text className="mine-page__card-name">{user.anchorCard.stageName}</Text>
                <Text className="mine-page__card-meta">{user.anchorCard.city} · {user.anchorCard.experienceYears} 年经验</Text>
              </View>
              <Text className="mine-page__card-check">✓</Text>
            </View>
            <View className="mine-page__card-tags">
              {user.anchorCard.categories.map((category) => <Text className="mine-page__card-tag" key={category}>{category}</Text>)}
            </View>
            <Text className="mine-page__card-intro">{user.anchorCard.intro}</Text>
            <View className="mine-page__card-detail-row">
              <Text>期望收入</Text><Text>{user.anchorCard.expectedSalary || '面议'}</Text>
              <Text>开播时间</Text><Text>{user.anchorCard.availableTime || '时间可协商'}</Text>
            </View>
          </View>
        )}

        {editingCard && (
          <View className="mine-page__card-editor">
            <CardField label="艺名" required value={cardDraft.stageName} placeholder="例如：米粒" onInput={(event) => updateCard('stageName', event.detail.value)} />
            <CardField label="直播品类" required value={cardDraft.categories.join('、')} placeholder="多个品类用、分隔，例如：美妆、女装" onInput={(event) => updateCard('categories', event.detail.value.split(/[、,，]/))} />
            <CardField label="所在城市" required value={cardDraft.city} placeholder="例如：杭州" onInput={(event) => updateCard('city', event.detail.value)} />
            <View className="mine-page__field">
              <Text className="mine-page__field-label">经验年限<Text className="mine-page__field-required">*</Text></Text>
              <Input className="mine-page__input" type="number" value={String(cardDraft.experienceYears)} placeholder="例如：3" onInput={(event) => updateCard('experienceYears', Number(event.detail.value) || 0)} />
            </View>
            <View className="mine-page__field">
              <Text className="mine-page__field-label">个人简介<Text className="mine-page__field-required">*</Text></Text>
              <Textarea className="mine-page__textarea" maxlength={200} value={cardDraft.intro} placeholder="介绍你的直播风格、擅长方向和代表经历" onInput={(event) => updateCard('intro', event.detail.value)} />
            </View>
            <CardField label="期望收入" value={cardDraft.expectedSalary} placeholder="例如：10-30K/月或面议" onInput={(event) => updateCard('expectedSalary', event.detail.value)} />
            <CardField label="可开播时间" value={cardDraft.availableTime} placeholder="例如：工作日晚上，周末可排班" onInput={(event) => updateCard('availableTime', event.detail.value)} />
            <View className="mine-page__card-editor-actions">
              <View className="mine-page__btn mine-page__btn--secondary" onClick={() => setEditingCard(false)}>取消</View>
              <View className={`mine-page__btn ${savingCard ? 'is-disabled' : ''}`} onClick={saveCard}>{savingCard ? '保存中…' : '保存模卡'}</View>
            </View>
          </View>
        )}
      </View>

      {/* 简历区 */}
      <View className="mine-page__section">
        <View className="mine-page__section-header">
          <Text className="mine-page__section-title">我的简历</Text>
          {user.resume && <Text className="mine-page__link">编辑</Text>}
        </View>
        {user.resume ? (
          <View className="mine-page__resume">
            <Text className="mine-page__resume-text">{user.resume.intro}</Text>
          </View>
        ) : (
          <View className="mine-page__empty-resume">
            <Text className="mine-page__empty-text">
              完善简历可提升通告匹配度
            </Text>
            <View className="mine-page__btn" onClick={openCardEditor}>去完善</View>
          </View>
        )}
      </View>

      {/* 菜单列表 */}
      <View className="mine-page__menu">
        <View className="mine-page__menu-item" onClick={() => Taro.navigateTo({ url: '/pages/services/index' })}>
          <Text className="mine-page__menu-text">平台服务</Text>
          <Text className="mine-page__menu-arrow">›</Text>
        </View>
        <View className="mine-page__menu-item">
          <Text className="mine-page__menu-text">我的收藏</Text>
          <Text className="mine-page__menu-arrow">›</Text>
        </View>
        <View className="mine-page__menu-item">
          <Text className="mine-page__menu-text">浏览历史</Text>
          <Text className="mine-page__menu-arrow">›</Text>
        </View>
        <View className="mine-page__menu-item">
          <Text className="mine-page__menu-text">设置</Text>
          <Text className="mine-page__menu-arrow">›</Text>
        </View>
      </View>
    </View>
  )
}

function CardField({ label, required = false, value, placeholder, onInput }: { label: string; required?: boolean; value: string; placeholder: string; onInput: (event: any) => void }) {
  return (
    <View className="mine-page__field">
      <Text className="mine-page__field-label">{label}{required && <Text className="mine-page__field-required">*</Text>}</Text>
      <Input className="mine-page__input" value={value} placeholder={placeholder} onInput={onInput} />
    </View>
  )
}
