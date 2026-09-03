import { useState } from 'react'
import { Image, Text, Video, View } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import type { ReactNode } from 'react'
import type { TalentProfile } from '@/types'
import { fetchTalentById } from '@/services'
import { setActiveRole } from '@/utils/storage'
import EmptyState from '@/components/EmptyState'
import cardCover from '@/assets/card/cover.jpg'
import clipOne from '@/assets/card/clip-1.jpg'
import clipTwo from '@/assets/card/clip-2.jpg'
import clipThree from '@/assets/card/clip-3.jpg'
import './index.scss'

const DEFAULT_CLIPS = [clipOne, clipTwo, clipThree]

export default function TalentDetailPage() {
  const [talent, setTalent] = useState<TalentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)

  useLoad(async ({ id }) => {
    setActiveRole('merchant')
    try {
      setTalent(await fetchTalentById(String(id || '')))
    } catch {
      Taro.redirectTo({ url: '/pages/role-login/index?role=merchant' })
    } finally {
      setLoading(false)
    }
  })

  if (loading) return <View className="talent-detail"><EmptyState loading /></View>
  if (!talent) return <View className="talent-detail"><EmptyState text="主播模卡暂不可用" /></View>

  const card = talent.anchorCard
  const clips = card.clips?.length ? card.clips : DEFAULT_CLIPS
  return (
    <View className="talent-detail">
      <View className="talent-detail__nav"><Text onClick={() => Taro.navigateBack()}>‹</Text><Text>{card.stageName || talent.nickname}</Text><Text>•••</Text></View>

      <View className="talent-detail__hero">
        {playing && card.recordingUrl ? <Video className="talent-detail__video" src={card.recordingUrl} poster={card.coverImage || cardCover} controls autoplay /> : <Image src={card.coverImage || cardCover} mode="aspectFill" />}
        {!playing && <><View className="talent-detail__shade" /><Text className="talent-detail__count">01 / {String(clips.length + 1).padStart(2, '0')}</Text><Text className="talent-detail__name">{card.stageName || talent.nickname}</Text><Text className="talent-detail__intro">{card.advantage || card.intro}</Text><Text className="talent-detail__play" onClick={() => card.recordingUrl ? setPlaying(true) : Taro.showToast({ title: '该主播暂未上传录屏', icon: 'none' })}>▶</Text></>}
      </View>

      <View className="talent-detail__group">
        <View><Text>{card.groupName || `${card.city}主播招聘群`}</Text><Text>{card.groupDescription || '免费招主播 · 免费进群'}</Text></View>
        <Text onClick={() => Taro.showToast({ title: '已提交进群申请', icon: 'success' })}>＋加入</Text>
      </View>

      <View className="talent-detail__clips-head"><Text>Clips <Text>直播切片</Text></Text><Text>全部 {clips.length} →</Text></View>
      <View className="talent-detail__clips">{clips.map((clip, index) => <View key={`${clip}-${index}`}><Image src={clip} mode="aspectFill" /><Text>{card.categories[index] || '直播'}</Text></View>)}</View>

      <Section title="Profile 基本信息"><View className="talent-detail__facts"><Fact label="年龄" value={`${card.age || 23}岁`} /><Fact label="性别" value={card.gender || '女'} /><Fact label="身高" value={card.height || '166cm'} /><Fact label="体重" value={card.weight || '47kg'} /><Fact label="鞋码" value={card.shoeSize || '37码'} /><Fact label="学历" value={card.education || '本科及以上'} /></View></Section>
      <Section title="Intention 求职意向"><View className="talent-detail__expect"><Text>兼职期望</Text><Text>{card.expectedSalary || '面议'}</Text></View><View className="talent-detail__columns"><Fact label="意向城市" value={(card.expectedCities || [card.city]).join('、')} /><Fact label="接受全班" value={card.acceptShift ? '接受' : '不接受'} /></View><View className="talent-detail__tags">{card.categories.map((item) => <Text key={item}>{item}</Text>)}</View></Section>
      <Section title="Experience 直播经验"><Fact label="播过的品类" value={card.experienceCategory || card.categories.join(' / ')} /><Fact label="直播过的账号" value={card.accountName || '合****'} /><Fact label="直播年限" value={`${card.liveYears || card.experienceYears} 年`} /></Section>
      <Section title="Peak GMV 最高单场"><Text className="talent-detail__gmv">{card.peakGmv || '面议'}</Text></Section>
      <Section title="Advantage 自身优势"><Text className="talent-detail__advantage">{card.advantage || card.intro}</Text></Section>

      <View className="talent-detail__actions"><Text onClick={() => Taro.showToast({ title: '分享卡片已生成', icon: 'success' })}>分享</Text><Text onClick={() => Taro.navigateTo({ url: '/pages/chat/index?id=c_1001' })}>立即联系</Text></View>
    </View>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <View className="talent-detail__section"><Text className="talent-detail__section-title">{title}</Text>{children}</View>
}

function Fact({ label, value }: { label: string; value: string }) {
  return <View className="talent-detail__fact"><Text>{label}</Text><Text>{value}</Text></View>
}
