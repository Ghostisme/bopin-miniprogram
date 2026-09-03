import { useState } from 'react'
import { Image, Text, Video, View } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import type { ReactNode } from 'react'
import type { AnchorCard } from '@/types'
import { deleteAnchorCard, fetchUserProfile, setPrimaryAnchorCard } from '@/services'
import { getStorage, setActiveRole, tokenKeyForRole } from '@/utils/storage'
import { isImageSource, safeImageSource } from '@/utils/media'
import EmptyState from '@/components/EmptyState'
import cardCover from '@/assets/card/cover.jpg'
import clipOne from '@/assets/card/clip-1.jpg'
import clipTwo from '@/assets/card/clip-2.jpg'
import clipThree from '@/assets/card/clip-3.jpg'
import './index.scss'

const DEFAULT_CLIPS = [clipOne, clipTwo, clipThree]
export default function CardDetailPage() {
  const [card, setCard] = useState<AnchorCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [manageVisible, setManageVisible] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useLoad(async ({ id }) => {
    setActiveRole('anchor')
    if (!getStorage<string | undefined>(tokenKeyForRole('anchor'), undefined)) {
      Taro.redirectTo({ url: '/pages/role-login/index?role=anchor' })
      return
    }
    try {
      const user = await fetchUserProfile()
      const cards = user.anchorCards?.length ? user.anchorCards : user.anchorCard ? [user.anchorCard] : []
      const selected = cards.find((item) => item.id === String(id || '')) ?? cards.find((item) => item.isPrimary) ?? cards[0]
      setCard(selected || null)
    } catch {
      Taro.redirectTo({ url: '/pages/role-login/index?role=anchor' })
    } finally {
      setLoading(false)
    }
  })

  if (loading) return <View className="card-detail"><EmptyState loading /></View>
  if (!card) return <View className="card-detail"><EmptyState text="模卡暂不可用" /></View>

  const clips = card.recordingClips?.length ? card.recordingClips : card.clips?.length ? card.clips : DEFAULT_CLIPS
  const heroImage = safeImageSource(card.coverImage, cardCover)
  const heroVideo = card.recordingUrl && !isImageSource(card.recordingUrl) ? card.recordingUrl : ''
  const title = card.stageName || '未命名模卡'

  const handleManageAction = async (action: string) => {
    setManageVisible(false)
    if (action === '取消') return
    if (action === '管理模卡') return
    if (action === '编辑切片' || action === '编辑资料') {
      if (!card.id) return
      const step = action === '编辑切片' ? 0 : 1
      Taro.navigateTo({ url: `/pages/card-builder/index?id=${encodeURIComponent(card.id)}&step=${step}` })
      return
    }
    if (action === '设为主展示') {
      if (!card.id || card.isPrimary || actionLoading) return
      setActionLoading(true)
      try {
        await setPrimaryAnchorCard(card.id)
        setCard((current) => current ? { ...current, isPrimary: true } : current)
        Taro.showToast({ title: '已设为主展示', icon: 'success' })
      } catch {
        // request 层负责展示服务端返回的错误。
      } finally {
        setActionLoading(false)
      }
      return
    }
    if (action === '删除模卡') {
      if (!card.id || actionLoading) return
      const result = await Taro.showModal({
        title: '删除这张模卡？',
        content: card.isPrimary ? '删除后会自动选择另一张模卡对企业展示。' : '删除后不可恢复，已投递或沟通记录不会受影响。',
        confirmText: '删除',
        confirmColor: '#e799b0',
      })
      if (!result.confirm) return
      setActionLoading(true)
      try {
        await deleteAnchorCard(card.id)
        Taro.showToast({ title: '模卡已删除', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 350)
      } catch {
        // request 层负责展示服务端返回的错误。
      } finally {
        setActionLoading(false)
      }
      return
    }
    Taro.showToast({ title: `${action}功能即将开放`, icon: 'none' })
  }

  return (
    <View className="card-detail">
      <View className="card-detail__nav"><Text onClick={() => Taro.navigateBack()}>‹</Text><Text>我的模卡</Text><Text /></View>

      <View className="card-detail__hero">
        {heroVideo ? <Video className="card-detail__hero-media" src={heroVideo} poster={heroImage} controls={playing} autoplay={playing} muted loop /> : <Image className="card-detail__hero-media" src={heroImage} mode="aspectFill" />}
        <View className="card-detail__hero-shade" />
        <Text className="card-detail__count">01 / {String(clips.length).padStart(2, '0')}</Text>
        <Text className="card-detail__name">{title}</Text>
        <Text className="card-detail__intro">{card.intro || card.advantage || '欢迎了解我的直播经验'}</Text>
        <Text className="card-detail__play" onClick={() => heroVideo ? setPlaying(true) : Taro.showToast({ title: '暂无可播放录屏', icon: 'none' })}>▶</Text>
      </View>

      <View className="card-detail__clips-head"><Text>Clips <Text>直播切片</Text></Text><Text>全部 {clips.length} →</Text></View>
      <View className="card-detail__clips">{clips.slice(0, 4).map((clip, index) => <View className="card-detail__clip" key={`${clip}-${index}`}>
        {isImageSource(clip) ? <Image src={clip} mode="aspectFill" /> : <Video src={clip} poster={heroImage} controls={false} />}
        {index === 0 && <Text className="card-detail__clip-cover">封面</Text>}
        <Text className="card-detail__clip-title">{card.recordingTitles?.[index] || card.categories[index] || (index === 0 ? title : '直播切片')}</Text>
        <Text className="card-detail__clip-play">▶</Text>
      </View>)}</View>

      <Section title="Profile 基本信息"><View className="card-detail__facts"><Fact label="年龄" value={`${card.age || 23}岁`} /><Fact label="性别" value={card.gender || '女'} /><Fact label="身高" value={card.height || '166cm'} /><Fact label="体重" value={card.weight || '47kg'} /><Fact label="鞋码" value={card.shoeSize || '37码'} /><Fact label="学历" value={card.education || '本科及以上'} /></View></Section>
      <Section title="Intention 求职意向"><View className="card-detail__expect"><Text>{card.workType || '全职'}期望</Text><Text>{card.expectedSalary || card.monthlySalary || '面议'}</Text></View><View className="card-detail__columns"><Fact label="意向城市" value={(card.expectedCities || [card.city]).join('、')} /><Fact label="接受坐班" value={card.acceptShift ? '接受' : '不接受'} /></View><View className="card-detail__tags">{card.categories.map((item) => <Text key={item}>{item}</Text>)}</View></Section>
      <Section title="Experience 直播经验"><Fact label="播过的品类" value={card.experienceCategory || card.categories.join(' / ')} /><Fact label="直播过的账号" value={card.accountName || '合****'} /><Fact label="直播年限" value={`${card.liveYears || card.experienceYears} 年`} /></Section>
      <Section title="Advantage 个人优势"><Text className="card-detail__advantage">{card.advantage || card.intro || '暂无个人优势介绍'}</Text></Section>

      <View className="card-detail__actions"><Text onClick={() => Taro.showToast({ title: '资料已复制', icon: 'success' })}><Text className="card-detail__action-icon">▣</Text>资料</Text><Text onClick={() => Taro.showToast({ title: '简历已整理', icon: 'success' })}><Text className="card-detail__action-icon">⇩</Text>简历</Text><Text onClick={() => Taro.showToast({ title: '分享卡片已生成', icon: 'success' })}><Text className="card-detail__action-icon">⌯</Text>分享</Text><Text className="card-detail__manage" onClick={() => setManageVisible(true)}>管理</Text><Text className="card-detail__style" onClick={() => Taro.showToast({ title: '风格切换即将开放', icon: 'none' })}>切换风格</Text></View>

      {manageVisible && <View className="card-detail__manage-sheet"><View className="card-detail__manage-mask" onClick={() => setManageVisible(false)} /><View className="card-detail__manage-panel">{['管理模卡', '编辑切片', '编辑资料', ...(!card.isPrimary ? ['设为主展示'] : []), '删除模卡', '关闭推荐给企业'].map((action) => <Text key={action} className={action === '删除模卡' ? 'is-danger' : ''} onClick={() => void handleManageAction(action)}>{action}</Text>)}<View className="card-detail__manage-divider" /><Text onClick={() => void handleManageAction('取消')}>取消</Text></View></View>}
    </View>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <View className="card-detail__section"><Text className="card-detail__section-title">{title}</Text>{children}</View>
}

function Fact({ label, value }: { label: string; value: string }) {
  return <View className="card-detail__fact"><Text>{label}</Text><Text>{value}</Text></View>
}
