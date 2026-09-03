import { useState } from 'react'
import { Image, Input, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { TalentProfile } from '@/types'
import { fetchTalents } from '@/services'
import { getStorage, setActiveRole, tokenKeyForRole } from '@/utils/storage'
import { safeImageSource } from '@/utils/media'
import EmptyState from '@/components/EmptyState'
import cardCover from '@/assets/card/cover.jpg'
import clipOne from '@/assets/card/clip-1.jpg'
import clipTwo from '@/assets/card/clip-2.jpg'
import talentCard from '@/assets/card/talent-card.jpg'
import './index.scss'

const TALENT_IMAGES = [clipOne, cardCover, clipTwo, talentCard]
const GENDERS = ['', '女', '男']
const CATEGORIES = ['', '美妆', '服饰', '食品']

export default function TalentsPage() {
  const [list, setList] = useState<TalentProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [genderIndex, setGenderIndex] = useState(0)
  const [categoryIndex, setCategoryIndex] = useState(0)

  const load = async (next = { keyword, gender: GENDERS[genderIndex], category: CATEGORIES[categoryIndex] }) => {
    setLoading(true)
    try {
      setList(await fetchTalents(next))
    } catch {
      Taro.redirectTo({ url: '/pages/role-login/index?role=merchant' })
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    setActiveRole('merchant')
    if (!getStorage<string | undefined>(tokenKeyForRole('merchant'), undefined)) {
      Taro.redirectTo({ url: '/pages/role-login/index?role=merchant' })
      return
    }
    load()
  })

  const cycleGender = () => {
    const next = (genderIndex + 1) % GENDERS.length
    setGenderIndex(next)
    load({ keyword, gender: GENDERS[next], category: CATEGORIES[categoryIndex] })
  }

  const cycleCategory = () => {
    const next = (categoryIndex + 1) % CATEGORIES.length
    setCategoryIndex(next)
    load({ keyword, gender: GENDERS[genderIndex], category: CATEGORIES[next] })
  }

  return (
    <View className="talents-page">
      <View className="talents-page__header">
        <Text className="talents-page__back" onClick={() => Taro.navigateBack()}>‹</Text>
        <View><Text className="talents-page__eyebrow">企业端</Text><Text className="talents-page__title">主播模卡库</Text></View>
        <Text className="talents-page__notices" onClick={() => Taro.redirectTo({ url: '/pages/my-notices/index' })}>通告管理</Text>
      </View>

      <View className="talents-page__search-row">
        <View className="talents-page__search"><Text>⌕</Text><Input value={keyword} placeholder="搜索主播名、城市、品类" confirmType="search" onInput={(event) => setKeyword(event.detail.value)} onConfirm={() => load()} /></View>
        <Text className="talents-page__search-btn" onClick={() => load()}>搜索</Text>
      </View>

      <View className="talents-page__filters">
        <View className="talents-page__segment"><Text className="is-active">活跃</Text><Text>最新</Text></View>
        <Text onClick={cycleGender}>性别：{GENDERS[genderIndex] || '全部'}⌄</Text>
        <Text onClick={cycleCategory}>品类：{CATEGORIES[categoryIndex] || '全部'}⌄</Text>
      </View>

      <View className="talents-page__notice-band">
        <View><Text>及时收到企业邀约</Text><Text>开启消息提醒，不错过匹配你的主播</Text></View>
        <Text onClick={() => Taro.showToast({ title: '已开启提醒', icon: 'success' })}>开启</Text>
      </View>

      <View className="talents-page__cert-band">
        <Text>企业认证后，优先查看完整模卡并发起沟通</Text>
        <View><Text><Text>30+</Text>覆盖城市</Text><Text><Text>100万+</Text>主播人数</Text><Text><Text>10万+</Text>月访问</Text></View>
      </View>

      <View className="talents-page__list">
        {list.map((talent, index) => {
          const card = talent.anchorCard
          return <View className="talents-page__card" key={talent.id} onClick={() => Taro.navigateTo({ url: `/pages/talent-detail/index?id=${talent.id}` })}>
            <Image src={safeImageSource(card.coverImage, TALENT_IMAGES[index % TALENT_IMAGES.length])} mode="aspectFill" />
            <View className="talents-page__card-main">
              <View className="talents-page__card-head"><Text>{card.stageName || talent.nickname}</Text><Text>{talent.activeLabel}</Text></View>
              <Text className="talents-page__meta">{card.age || 23}岁 · {card.height || '166cm'} · {card.weight || '47kg'} · {card.gender || '女'}</Text>
              <Text className="talents-page__experience">{card.experienceYears || 2} 年直播经验</Text>
              <Text className="talents-page__category">{card.categories.join('　')}</Text>
              <View className="talents-page__salary"><Text>{card.expectedSalary || '面议'}</Text><Text>⌖ {card.city}</Text></View>
            </View>
          </View>
        })}
        {!loading && list.length === 0 && <EmptyState text="没有找到符合条件的主播模卡" />}
        {loading && <EmptyState loading />}
      </View>
    </View>
  )
}
