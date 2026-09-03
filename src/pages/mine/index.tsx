/**
 * 我的页
 *
 * 对应主播端「我的」tab。这里是模卡管理入口，完整模卡由企业端查看。
 */

import { useState } from 'react'
import { Image, View, Text, Input, Textarea } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { AnchorCard, UserProfile } from '@/types'
import { deleteAnchorCard, fetchUserProfile, setPrimaryAnchorCard, updateAnchorCard, uploadCardMedia } from '@/services'
import { setActiveRole, getStorage, tokenKeyForRole } from '@/utils/storage'
import EmptyState from '@/components/EmptyState'
import PasteResumeModal from '@/components/PasteResumeModal'
import './index.scss'

import cardCover from '@/assets/card/cover.jpg'
import cardClipOne from '@/assets/card/clip-1.jpg'
import cardClipTwo from '@/assets/card/clip-2.jpg'
import cardClipThree from '@/assets/card/clip-3.jpg'

const DEFAULT_CARD_MEDIA = {
  coverImage: cardCover,
  clips: [cardClipOne, cardClipTwo, cardClipThree],
}

const EMPTY_CARD: AnchorCard = {
  stageName: '',
  categories: [],
  city: '',
  intro: '',
  experienceYears: 0,
  expectedSalary: '',
  availableTime: '',
  age: 23,
  gender: '女',
  height: '166cm',
  weight: '47kg',
  shoeSize: '37码',
  education: '本科及以上',
  expectedCities: ['厦门'],
  acceptShift: false,
  experienceCategory: '美妆护肤 / 个护家清',
  accountName: '合****',
  peakGmv: '30万',
  liveYears: 2,
  advantage: '亲和力强、学习能力快',
  ...DEFAULT_CARD_MEDIA,
  groupName: '上海主播招聘群',
  groupDescription: '免费招主播 · 免费进群',
}

const normalizeCard = (card: AnchorCard): AnchorCard => ({
  ...EMPTY_CARD,
  ...card,
  clips: card.clips?.length ? card.clips : DEFAULT_CARD_MEDIA.clips,
  coverImage: card.coverImage || DEFAULT_CARD_MEDIA.coverImage,
})

export default function MinePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingCard, setEditingCard] = useState(false)
  const [savingCard, setSavingCard] = useState(false)
  const [cardDraft, setCardDraft] = useState<AnchorCard>(EMPTY_CARD)
  const [createSheetVisible, setCreateSheetVisible] = useState(false)
  const [importCardVisible, setImportCardVisible] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)

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
      const cards = data.anchorCards?.length ? data.anchorCards : data.anchorCard ? [data.anchorCard] : []
      const primaryCard = cards.find((card) => card.isPrimary) ?? cards[0]
      if (primaryCard) setCardDraft(normalizeCard(primaryCard))
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

  const cards = user.anchorCards?.length ? user.anchorCards : user.anchorCard ? [user.anchorCard] : []
  const previewCard = cards.find((card) => card.isPrimary) ?? cards[0] ?? null
  const hasCards = cards.length > 0

  const newCardDraft = (): AnchorCard => ({
    ...EMPTY_CARD,
    stageName: user.nickname,
    city: user.resume?.city ?? '',
    intro: user.resume?.intro ?? '',
    categories: user.resume?.categories ?? [],
    experienceYears: user.resume?.experienceYears ?? 0,
  })

  const openCardEditor = (card?: AnchorCard) => {
    setCardDraft(card ? normalizeCard(card) : newCardDraft())
    setEditingCard(true)
  }

  const openCardDetails = (card: AnchorCard) => {
    const query = card.id ? `?id=${encodeURIComponent(card.id)}` : ''
    Taro.navigateTo({ url: `/pages/card-detail/index${query}` })
  }

  const openCreateSheet = () => {
    if (cards.length >= 5) {
      Taro.showToast({ title: '最多可创建 5 张模卡', icon: 'none' })
      return
    }
    setCreateSheetVisible(true)
  }

  const chooseRecording = async () => {
    setCreateSheetVisible(false)
    if (!editingCard) {
      Taro.navigateTo({ url: '/pages/card-builder/index' })
      return
    }
    try {
      const result = await Taro.chooseVideo({ sourceType: ['album', 'camera'], maxDuration: 600, compressed: true })
      setUploadingMedia(true)
      Taro.showLoading({ title: '录屏上传中' })
      const recordingUrl = await uploadCardMedia(result.tempFilePath)
      if (editingCard) setCardDraft((current) => ({ ...current, recordingUrl }))
      else {
        setCardDraft({ ...newCardDraft(), recordingUrl })
        setEditingCard(true)
      }
      Taro.showToast({ title: '录屏已添加，请完善资料', icon: 'success' })
    } catch {
      // 用户取消选择时保持当前页面。
    } finally {
      setUploadingMedia(false)
      Taro.hideLoading()
    }
  }

  const importCardData = (rawText: string) => {
    const age = Number(rawText.match(/(\d{2})\s*岁/)?.[1] || 23)
    const experienceYears = Number(rawText.match(/(\d+)\s*年/)?.[1] || 0)
    const stageName = rawText.match(/(?:我叫|我是)?([\u4e00-\u9fa5]{2,5})[，,]/)?.[1] || user.nickname
    const city = ['杭州', '上海', '北京', '广州', '深圳', '厦门', '成都', '重庆', '武汉'].find((item) => rawText.includes(item)) || user.resume?.city || '杭州'
    const categoryOptions = ['美妆', '女装', '家清', '食品', '娱乐', '游戏', '户外']
    const categories = categoryOptions.filter((item) => rawText.includes(item))
    setCardDraft({
      ...EMPTY_CARD,
      stageName,
      city,
      age,
      experienceYears,
      liveYears: experienceYears || 2,
      categories: categories.length ? categories : ['带货'],
      experienceCategory: categories.join(' / ') || '带货直播',
      intro: rawText,
      advantage: rawText.length > 34 ? `${rawText.slice(0, 34)}…` : rawText,
    })
    setImportCardVisible(false)
    setEditingCard(true)
    Taro.showToast({ title: '资料已带入，请核对模卡', icon: 'success' })
  }

  const switchToMerchant = () => {
    setActiveRole('merchant')
    if (getStorage<string | undefined>(tokenKeyForRole('merchant'), undefined)) Taro.navigateTo({ url: '/pages/my-notices/index' })
    else Taro.navigateTo({ url: '/pages/role-login/index?role=merchant' })
  }

  const copyCardInfo = async () => {
    if (!previewCard) return
    await Taro.setClipboardData({
      data: `${previewCard.stageName}\n${previewCard.categories.join('、')}\n${previewCard.city}\n${previewCard.expectedSalary || '薪资面议'}`,
    })
    Taro.showToast({ title: '资料已复制', icon: 'success' })
  }

  const shareCard = () => Taro.showToast({ title: '模卡分享已生成', icon: 'success' })
  const downloadCard = () => Taro.showToast({ title: '模卡资料已整理', icon: 'success' })

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
      const savedCards = data.anchorCards?.length ? data.anchorCards : data.anchorCard ? [data.anchorCard] : []
      const savedCard = payload.id ? savedCards.find((card) => card.id === payload.id) : savedCards.find((card) => card.stageName === payload.stageName && card.city === payload.city)
      setCardDraft(normalizeCard(savedCard ?? data.anchorCard ?? payload))
      setEditingCard(false)
      Taro.showToast({ title: '模卡已保存', icon: 'success' })
    } catch {
      // request 层负责展示服务端错误
    } finally {
      setSavingCard(false)
    }
  }

  const makePrimary = async (card: AnchorCard) => {
    if (!card.id || card.isPrimary) return
    setSavingCard(true)
    try {
      const data = await setPrimaryAnchorCard(card.id)
      setUser(data)
      Taro.showToast({ title: '已设为企业主展示模卡', icon: 'success' })
    } catch {
      // request 层负责展示服务端错误
    } finally {
      setSavingCard(false)
    }
  }

  const removeCard = async (card: AnchorCard) => {
    if (!card.id) return
    const result = await Taro.showModal({
      title: '删除这张模卡？',
      content: card.isPrimary ? '删除后会自动选择另一张模卡对企业展示。' : '删除后不可恢复，已投递或沟通记录不会受影响。',
      confirmText: '删除',
      confirmColor: '#e799b0',
    })
    if (!result.confirm) return
    setSavingCard(true)
    try {
      const data = await deleteAnchorCard(card.id)
      setUser(data)
      const remaining = data.anchorCards?.length ? data.anchorCards : data.anchorCard ? [data.anchorCard] : []
      const nextPrimary = remaining.find((item) => item.isPrimary) ?? remaining[0]
      setCardDraft(nextPrimary ? normalizeCard(nextPrimary) : EMPTY_CARD)
      Taro.showToast({ title: '模卡已删除', icon: 'success' })
    } catch {
      // request 层负责展示服务端错误
    } finally {
      setSavingCard(false)
    }
  }

  return (
    <View className="mine-page">
      <View className="mine-page__topbar">
        <Text className="mine-page__role-chip" onClick={switchToMerchant}>切换为企业身份</Text>
      </View>

      <View className="mine-page__profile-strip">
        <View className="mine-page__avatar">
          {user.avatar ? <Image src={user.avatar} className="mine-page__avatar-img" /> : <Text className="mine-page__avatar-text">{user.nickname[0]}</Text>}
        </View>
        <View className="mine-page__info">
          <View className="mine-page__nickname-row"><Text className="mine-page__nickname">{user.nickname}</Text><Text className="mine-page__profile-edit" onClick={() => Taro.showToast({ title: '资料编辑即将开放', icon: 'none' })}>编辑</Text></View>
          <View className="mine-page__id-row"><Text className="mine-page__phone">ID：{user.id}</Text><Text className="mine-page__profile-copy" onClick={async () => { await Taro.setClipboardData({ data: user.id }); Taro.showToast({ title: 'ID 已复制', icon: 'success' }) }}>复制</Text></View>
        </View>
        <View className="mine-page__customer-service" onClick={() => Taro.showToast({ title: '客服将在 1 分钟内联系你', icon: 'none' })}><Text>◉</Text><Text>客服</Text></View>
      </View>

      {hasCards && !editingCard && <View className="mine-page__agency-banner"><Text className="mine-page__agency-title">招募播络代理，解锁 <Text>播络伙伴</Text></Text><Text className="mine-page__agency-description">提供潜客线索，无需操心售后，50%分成</Text><View className="mine-page__agency-button" onClick={() => Taro.showToast({ title: '代理计划即将开放', icon: 'none' })}>查看代理计划</View></View>}

      <View className={`mine-page__card-section ${hasCards && !editingCard ? 'is-complete' : ''}`}>
        <View className="mine-page__section-header">
          <View className="mine-page__card-heading"><Text className="mine-page__section-title">我的模卡</Text><Text className={`mine-page__required-badge ${hasCards ? 'is-complete' : ''}`}>{hasCards ? `${cards.length} 张` : '必填'}</Text></View>
          {hasCards && !editingCard && <Text className="mine-page__link" onClick={openCreateSheet}>新建</Text>}
        </View>

        {!editingCard && (
          <View className={`mine-page__showcase ${hasCards ? 'is-complete' : ''}`}>
            {hasCards && previewCard ? (
              <>
                <View className="mine-page__complete-heading"><Text className="mine-page__section-title">我的模卡 <Text className="mine-page__card-count">{cards.length}张</Text></Text><View className="mine-page__complete-heading-actions"><Text className="mine-page__detail-link" onClick={() => openCardDetails(previewCard)}>查看详情›</Text><Text className="mine-page__edit-link" onClick={() => openCardEditor(previewCard)}>编辑</Text><Text className="mine-page__delete-link" onClick={() => removeCard(previewCard)}>删除</Text><Text className="mine-page__new-link" onClick={openCreateSheet}>新建</Text></View></View>
                <View className="mine-page__compact-card">
                  <Image className="mine-page__compact-card-cover" src={previewCard.coverImage || DEFAULT_CARD_MEDIA.coverImage} mode="aspectFill" />
                  <View className="mine-page__compact-card-info">
                    <Text className="mine-page__compact-card-name">{previewCard.stageName || user.nickname}</Text>
                    <Text className="mine-page__compact-card-meta">{previewCard.experienceYears ? `${previewCard.experienceYears} 年` : '1 年以下'}·{previewCard.age || 23}岁·{previewCard.height || '166cm'}·{previewCard.weight || '47kg'}·{previewCard.gender || '女'}</Text>
                    <Text className="mine-page__compact-card-account">播过 {previewCard.accountName || previewCard.experienceCategory || previewCard.categories.join('、') || '直播账号'}</Text>
                    <View className="mine-page__compact-card-salary"><Text>{previewCard.expectedSalary || previewCard.monthlySalary || '8-10K/月'}</Text><Text>{previewCard.hourlySalary || '100-150元/小时'}</Text></View>
                  </View>
                </View>
                <View className="mine-page__compact-actions"><Text onClick={copyCardInfo}>复制资料</Text><Text onClick={downloadCard}>下载简历</Text><Text onClick={shareCard}>分享模卡</Text></View>
                {cards.length > 1 && <><View className="mine-page__card-list-header"><Text>其他模卡 {cards.length - 1} 张</Text><Text onClick={openCreateSheet}>+ 新建一张</Text></View><View className="mine-page__card-list">{cards.filter((card) => !card.isPrimary).map((card, index) => <View className="mine-page__card-list-item" key={card.id || `${card.stageName}-${index}`}><Image className="mine-page__card-list-cover" src={card.coverImage || DEFAULT_CARD_MEDIA.coverImage} mode="aspectFill" /><View className="mine-page__card-list-info"><View><Text>{card.stageName || '未命名模卡'}</Text></View><Text>{card.categories.join(' / ') || '待补充品类'} · {card.city || '待补充城市'}</Text></View><View className="mine-page__card-list-actions"><Text onClick={() => openCardDetails(card)}>查看</Text><Text onClick={() => makePrimary(card)}>设为主展示</Text><Text onClick={() => openCardEditor(card)}>编辑</Text><Text className="is-delete" onClick={() => removeCard(card)}>删除</Text></View></View>)}</View></>}
              </>
            ) : (
              <>
                <View className="mine-page__showcase-art">
                  <View className="mine-page__showcase-art-card is-left"><Image src={cardClipOne} mode="aspectFill" /><Text>直播切片</Text></View>
                  <View className="mine-page__showcase-art-card is-center"><Image src={cardCover} mode="aspectFill" /><Text>我的模卡</Text></View>
                  <View className="mine-page__showcase-art-card is-right"><Image src={cardClipTwo} mode="aspectFill" /><Text>作品展示</Text></View>
                </View>
                <Text className="mine-page__showcase-title">把直播实力装进一张模卡</Text>
                <Text className="mine-page__showcase-text">企业先看作品、直播经验和你的档期，资料只服务于这张模卡。</Text>
                <View className="mine-page__showcase-steps"><Text>1 上传作品</Text><Text>2 补充资料</Text><Text>3 公开给企业</Text></View>
                <View className="mine-page__showcase-button" onClick={openCreateSheet}>去创建模卡</View>
              </>
            )}
          </View>
        )}

        {editingCard && (
          <View className="mine-page__card-editor">
            <View className="mine-page__media-field" onClick={chooseRecording}>
              <Text className="mine-page__media-icon">▶</Text>
              <View><Text>{cardDraft.recordingUrl ? '直播录屏已上传' : '上传直播录屏'}</Text><Text>{uploadingMedia ? '正在上传，请稍候' : cardDraft.recordingUrl ? '点击可更换，企业可在公开模卡中播放' : '支持相册或拍摄，最大 300MB / 10分钟'}</Text></View>
              <Text>›</Text>
            </View>
            <CardField label="艺名" required value={cardDraft.stageName} placeholder="例如：米粒" onInput={(event) => updateCard('stageName', event.detail.value)} />
            <CardField label="直播品类" required value={cardDraft.categories.join('、')} placeholder="多个品类用、分隔，例如：美妆、女装" onInput={(event) => updateCard('categories', event.detail.value.split(/[、,，]/))} />
            <CardField label="所在城市" required value={cardDraft.city} placeholder="例如：杭州" onInput={(event) => updateCard('city', event.detail.value)} />
            <View className="mine-page__field">
              <Text className="mine-page__field-label">经验年限<Text className="mine-page__field-required">*</Text></Text>
              <Input className="mine-page__input" type="number" value={String(cardDraft.experienceYears)} placeholder="例如：3" onInput={(event) => updateCard('experienceYears', Number(event.detail.value) || 0)} />
            </View>
            <View className="mine-page__field">
              <Text className="mine-page__field-label">模卡一句话介绍<Text className="mine-page__field-required">*</Text></Text>
              <Textarea className="mine-page__textarea" maxlength={200} value={cardDraft.intro} placeholder="例如：亲和力强，擅长美妆护肤与个护家清" onInput={(event) => updateCard('intro', event.detail.value)} />
            </View>
            <CardField label="期望收入" value={cardDraft.expectedSalary} placeholder="例如：10-30K/月或面议" onInput={(event) => updateCard('expectedSalary', event.detail.value)} />
            <CardField label="可开播时间" value={cardDraft.availableTime} placeholder="例如：工作日晚上，周末可排班" onInput={(event) => updateCard('availableTime', event.detail.value)} />
            <View className="mine-page__editor-divider">公开展示资料</View>
            <View className="mine-page__editor-grid">
              <CardField label="年龄" value={String(cardDraft.age || '')} placeholder="23" onInput={(event) => updateCard('age', Number(event.detail.value) || 0)} />
              <CardField label="性别" value={cardDraft.gender || ''} placeholder="女" onInput={(event) => updateCard('gender', event.detail.value)} />
              <CardField label="身高" value={cardDraft.height || ''} placeholder="166cm" onInput={(event) => updateCard('height', event.detail.value)} />
              <CardField label="体重" value={cardDraft.weight || ''} placeholder="47kg" onInput={(event) => updateCard('weight', event.detail.value)} />
              <CardField label="鞋码" value={cardDraft.shoeSize || ''} placeholder="37码" onInput={(event) => updateCard('shoeSize', event.detail.value)} />
              <CardField label="学历" value={cardDraft.education || ''} placeholder="本科及以上" onInput={(event) => updateCard('education', event.detail.value)} />
            </View>
            <CardField label="意向城市" value={(cardDraft.expectedCities || []).join('、')} placeholder="例如：杭州、厦门" onInput={(event) => updateCard('expectedCities', event.detail.value.split(/[、,，]/))} />
            <CardField label="代表品类" value={cardDraft.experienceCategory || ''} placeholder="例如：美妆护肤 / 个护家清" onInput={(event) => updateCard('experienceCategory', event.detail.value)} />
            <CardField label="最高单场 GMV" value={cardDraft.peakGmv || ''} placeholder="例如：30万" onInput={(event) => updateCard('peakGmv', event.detail.value)} />
            <CardField label="自身优势" value={cardDraft.advantage || ''} placeholder="例如：亲和力强、学习能力快" onInput={(event) => updateCard('advantage', event.detail.value)} />
            <View className="mine-page__card-editor-actions">
              <View className="mine-page__btn mine-page__btn--secondary" onClick={() => setEditingCard(false)}>取消</View>
              <View className={`mine-page__btn ${savingCard ? 'is-disabled' : ''}`} onClick={saveCard}>{savingCard ? '保存中…' : '保存模卡'}</View>
            </View>
          </View>
        )}
      </View>

      {/* 主播个人服务入口 */}
      <View className="mine-page__menu">
        <View className="mine-page__menu-item" onClick={() => Taro.navigateTo({ url: '/pages/services/index' })}>
          <Text className="mine-page__menu-text">联系微信号</Text>
          <Text className="mine-page__menu-arrow">›</Text>
        </View>
        <View className="mine-page__menu-item">
          <Text className="mine-page__menu-text">我联系的通告</Text>
          <Text className="mine-page__menu-arrow">›</Text>
        </View>
        <View className="mine-page__menu-item">
          <Text className="mine-page__menu-text">平台服务</Text>
          <Text className="mine-page__menu-arrow">›</Text>
        </View>
        <View className="mine-page__menu-item">
          <Text className="mine-page__menu-text">设置</Text>
          <Text className="mine-page__menu-arrow">›</Text>
        </View>
      </View>

      {createSheetVisible && (
        <View className="mine-page__create-sheet">
          <View className="mine-page__create-mask" onClick={() => setCreateSheetVisible(false)} />
          <View className="mine-page__create-panel">
            <Text className="mine-page__create-title">选择创建方式</Text>
            <View className="mine-page__create-option" onClick={chooseRecording}><Text className="mine-page__create-icon">＋</Text><View><Text>上传作品，逐步制作</Text><Text>先添加一段直播录屏，再补齐模卡资料</Text></View><Text>›</Text></View>
            <View className="mine-page__create-option" onClick={() => { setCreateSheetVisible(false); setImportCardVisible(true) }}><Text className="mine-page__create-icon is-ai">AI</Text><View><Text>粘贴资料，AI 智能生成</Text><Text>把已有资料粘进来，AI 帮你做好再核对</Text></View><Text>›</Text></View>
          </View>
        </View>
      )}

      <PasteResumeModal visible={importCardVisible} onClose={() => setImportCardVisible(false)} onSubmit={importCardData} title="粘贴你的资料" description="从聊天记录、简历随便粘，AI 自动拆成模卡字段，之后可逐项核对修改" placeholder="例：我叫小怡，22岁，杭州，直播1年，播过服饰个护，期望全职8-15K…" submitLabel="开始生成" showCounter={false} />
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
