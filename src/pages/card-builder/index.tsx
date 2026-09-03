/**
 * 模卡创建流程：录屏作品 -> 基本信息 -> 身型学历 -> 求职意向 -> 直播经验。
 * 每一步都只写入本地草稿，最后一步统一保存，避免上传作品后卡在半成品页面。
 */

import { useMemo, useState } from 'react'
import { Image, Input, Text, Textarea, Video, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { AnchorCard, UserProfile } from '@/types'
import { fetchUserProfile, updateAnchorCard, uploadCardMedia } from '@/services'
import { getStorage, setActiveRole, tokenKeyForRole } from '@/utils/storage'
import cardCover from '@/assets/card/cover.jpg'
import './index.scss'

// 顺序与小程序现有建卡链路一致：先补身型，再上传作品，最后完成意向与经验。
const STEPS = ['身型学历', '上传录屏', '求职意向', '基本信息', '直播经验']
const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '厦门', '成都', '重庆']
const CATEGORIES = ['服饰', '美妆', '数码', '食品酒饮', '珠宝', '家电', '日用家具', '户外运动', '母婴宠物', '奢品', '本地生活', '汽车', '其他']
const EDUCATIONS = ['高中及以下', '大专', '本科', '本科及以上']

const newDraft = (user?: UserProfile): AnchorCard => ({
  stageName: user?.nickname || '',
  categories: user?.resume?.categories || [],
  city: user?.resume?.city || '',
  intro: user?.resume?.intro || '',
  experienceYears: user?.resume?.experienceYears || 0,
  expectedSalary: '',
  availableTime: '',
  birthMonth: '',
  age: 23,
  gender: '女',
  height: '',
  weight: '',
  shoeSize: '',
  education: '',
  expectedCities: user?.resume?.city ? [user.resume.city] : [],
  acceptShift: false,
  workType: '全职',
  monthlySalary: '',
  hourlySalary: '',
  naturalTraffic: false,
  experienceCategory: '',
  accountName: '',
  peakGmv: '',
  liveYears: user?.resume?.experienceYears || 0,
  advantage: '',
  coverImage: cardCover,
  clips: [],
  recordingClips: [],
  recordingTitles: [],
})

export default function CardBuilderPage() {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<AnchorCard>(newDraft())
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cityPickerVisible, setCityPickerVisible] = useState(false)

  useDidShow(async () => {
    setActiveRole('anchor')
    if (!getStorage<string | undefined>(tokenKeyForRole('anchor'), undefined)) {
      Taro.redirectTo({ url: '/pages/role-login/index?role=anchor' })
      return
    }
    try {
      const user = await fetchUserProfile()
      setDraft((current) => current.stageName ? current : newDraft(user))
    } catch {
      Taro.showToast({ title: '登录已失效，请重新登录', icon: 'none' })
    } finally {
      setLoading(false)
    }
  })

  const recordingClips = draft.recordingClips || (draft.recordingUrl ? [draft.recordingUrl] : [])
  const recordingTitles = draft.recordingTitles || []
  const selectedCategories = useMemo(() => new Set(draft.categories), [draft.categories])

  const update = <K extends keyof AnchorCard>(key: K, value: AnchorCard[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const uploadRecording = async () => {
    if (uploading) return
    try {
      const result = await Taro.chooseVideo({ sourceType: ['album', 'camera'], maxDuration: 600, compressed: true })
      setUploading(true)
      Taro.showLoading({ title: '录屏上传中' })
      const url = await uploadCardMedia(result.tempFilePath)
      const nextClips = [...recordingClips, url]
      setDraft((current) => ({ ...current, recordingUrl: current.recordingUrl || url, recordingClips: nextClips, recordingTitles: [...(current.recordingTitles || []), ''] }))
      Taro.showToast({ title: '录屏已添加', icon: 'success' })
    } catch {
      // 取消选择或上传失败时保留当前草稿，服务层已展示具体原因。
    } finally {
      setUploading(false)
      Taro.hideLoading()
    }
  }

  const removeRecording = (index: number) => {
    const nextClips = recordingClips.filter((_, itemIndex) => itemIndex !== index)
    const nextTitles = recordingTitles.filter((_, itemIndex) => itemIndex !== index)
    setDraft((current) => ({ ...current, recordingUrl: nextClips[0] || '', recordingClips: nextClips, recordingTitles: nextTitles, coverImage: current.coverImage === recordingClips[index] ? (nextClips[0] || cardCover) : current.coverImage }))
  }

  const updateRecordingTitle = (index: number, title: string) => {
    const nextTitles = [...recordingTitles]
    nextTitles[index] = title
    update('recordingTitles', nextTitles)
  }

  const chooseCover = (index: number) => update('coverImage', recordingClips[index])

  const toggleCategory = (category: string) => {
    const next = selectedCategories.has(category) ? draft.categories.filter((item) => item !== category) : [...draft.categories, category]
    update('categories', next)
  }

  const toggleCity = (city: string) => {
    const selected = draft.expectedCities || []
    update('expectedCities', selected.includes(city) ? selected.filter((item) => item !== city) : [...selected, city])
  }

  const nextStep = () => {
    if (step < STEPS.length - 1) {
      setStep((current) => current + 1)
      return
    }
    void save()
  }

  const save = async () => {
    const categories = draft.categories.map((item) => item.trim()).filter(Boolean)
    if (!draft.stageName.trim() || !draft.city.trim() || !draft.intro.trim() || !categories.length || draft.experienceYears < 0) {
      Taro.showToast({ title: '请补齐艺名、城市、品类、经验和简介', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      await updateAnchorCard({ ...draft, categories, clips: draft.clips || [] })
      Taro.showToast({ title: '模卡已保存', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 350)
    } catch {
      // request 层负责展示服务端返回的错误。
    } finally {
      setSaving(false)
    }
  }

  const cycleEducation = () => {
    const current = EDUCATIONS.indexOf(draft.education || '')
    update('education', EDUCATIONS[(current + 1) % EDUCATIONS.length])
  }

  if (loading) return <View className="card-builder"><Text className="card-builder__loading">正在准备模卡</Text></View>

  return (
    <View className="card-builder">
      <View className="card-builder__nav"><Text onClick={() => step > 0 ? setStep((current) => current - 1) : Taro.navigateBack()}>‹</Text><Text>创建模卡</Text><Text className="card-builder__nav-count">{step + 1}/{STEPS.length}</Text></View>
      <View className="card-builder__progress">{STEPS.map((label, index) => <View key={label} className={`card-builder__progress-item ${index <= step ? 'is-active' : ''}`}><Text>{index + 1}</Text><Text>{label}</Text></View>)}</View>

      {step === 0 && <BodyStep draft={draft} update={update} onEducation={cycleEducation} />}
      {step === 1 && <RecordingStep clips={recordingClips} titles={recordingTitles} coverImage={draft.coverImage || ''} uploading={uploading} onUpload={uploadRecording} onRemove={removeRecording} onTitle={updateRecordingTitle} onCover={chooseCover} />}
      {step === 2 && <IntentStep draft={draft} update={update} cityPickerVisible={cityPickerVisible} onCityPicker={() => setCityPickerVisible((visible) => !visible)} onCity={toggleCity} onCategory={toggleCategory} />}
      {step === 3 && <BasicStep draft={draft} update={update} />}
      {step === 4 && <ExperienceStep draft={draft} update={update} />}

      <View className="card-builder__footer"><View className={`card-builder__next ${saving || uploading ? 'is-disabled' : ''}`} onClick={nextStep}>{saving ? '保存中…' : step === STEPS.length - 1 ? '完成并保存模卡' : '下一步'}</View>{step === 0 && <Text className="card-builder__skip" onClick={() => setStep(1)}>跳过</Text>}</View>
    </View>
  )
}

function RecordingStep({ clips, titles, coverImage, uploading, onUpload, onRemove, onTitle, onCover }: { clips: string[]; titles: string[]; coverImage: string; uploading: boolean; onUpload: () => void; onRemove: (index: number) => void; onTitle: (index: number, title: string) => void; onCover: (index: number) => void }) {
  return <View className="card-builder__content">
    <Text className="card-builder__eyebrow">作品先行</Text>
    <Text className="card-builder__title">上传录屏，更容易获得企业青睐</Text>
    <Text className="card-builder__description">录屏是企业最关注的资料，建议提供多个风格和品类。</Text>
    <View className="card-builder__notice">注：请勿乱传，也不要上传简历，会被封号</View>
    <View className="card-builder__media-list">
      {clips.map((clip, index) => <View className="card-builder__media-item" key={`${clip}-${index}`}><Video src={clip} controls={false} showCenterPlayBtn={false} /><Input className="card-builder__media-title" value={titles[index] || ''} placeholder="请填写直播产品名称" onInput={(event) => onTitle(index, event.detail.value)} /><View className="card-builder__media-actions"><Text onClick={() => onRemove(index)}>删除</Text><Text className={coverImage === clip ? 'is-cover' : ''} onClick={() => onCover(index)}>{coverImage === clip ? '已选封面' : '选为封面'}</Text></View></View>)}
      <View className="card-builder__upload" onClick={onUpload}><Text className="card-builder__upload-plus">＋</Text><View><Text>{uploading ? '正在上传，请稍候' : '上传直播录屏'}</Text><Text>视频不能超过300M，时长不能超过10分钟</Text><Text>支持相册或拍摄，可添加多段录屏</Text></View></View>
    </View>
  </View>
}

function BasicStep({ draft, update }: { draft: AnchorCard; update: <K extends keyof AnchorCard>(key: K, value: AnchorCard[K]) => void }) {
  return <View className="card-builder__content"><Text className="card-builder__eyebrow">第 1 步</Text><Text className="card-builder__title">基本信息</Text><Field label="艺名" required value={draft.stageName} placeholder="请输入" onInput={(value) => update('stageName', value)} /><Field label="出生年月" value={draft.birthMonth || ''} placeholder="例如：2001-08" onInput={(value) => update('birthMonth', value)} /><Text className="card-builder__field-label">性别<Text>（必填）</Text></Text><View className="card-builder__radio-row">{['女', '男'].map((gender) => <Text key={gender} className={draft.gender === gender ? 'is-selected' : ''} onClick={() => update('gender', gender)}><Text className="card-builder__radio">{draft.gender === gender ? '◉' : '○'}</Text>{gender}</Text>)}</View><Field label="直播过的品类" value={draft.experienceCategory || ''} placeholder="请输入，例如：美妆、服饰" onInput={(value) => update('experienceCategory', value)} /></View>
}

function BodyStep({ draft, update, onEducation }: { draft: AnchorCard; update: <K extends keyof AnchorCard>(key: K, value: AnchorCard[K]) => void; onEducation: () => void }) {
  return <View className="card-builder__content"><Text className="card-builder__eyebrow">第 2 步</Text><Text className="card-builder__title">身型、学历</Text><Text className="card-builder__hint">服饰等穿版品类必填，其他品类选填</Text><Field label="身高" value={draft.height || ''} suffix="CM" placeholder="建议填写" onInput={(value) => update('height', value)} /><Field label="体重" value={draft.weight || ''} suffix="KG" placeholder="建议填写" onInput={(value) => update('weight', value)} /><Field label="鞋码" value={draft.shoeSize || ''} suffix="码" placeholder="建议填写" onInput={(value) => update('shoeSize', value)} /><View className="card-builder__field"><Text className="card-builder__field-label">学历<Text>（建议填写）</Text></Text><View className="card-builder__select" onClick={onEducation}><Text>{draft.education || '请选择'}</Text><Text>›</Text></View></View></View>
}

function IntentStep({ draft, update, cityPickerVisible, onCityPicker, onCity, onCategory }: { draft: AnchorCard; update: <K extends keyof AnchorCard>(key: K, value: AnchorCard[K]) => void; cityPickerVisible: boolean; onCityPicker: () => void; onCity: (city: string) => void; onCategory: (category: string) => void }) {
  return <View className="card-builder__content"><Text className="card-builder__eyebrow">第 3 步</Text><Text className="card-builder__title">求职意向</Text><Text className="card-builder__field-label">意向城市<Text>（必填）</Text></Text><View className="card-builder__city-select" onClick={onCityPicker}>{(draft.expectedCities || []).map((city) => <Text key={city} className="card-builder__tag is-city" onClick={(event) => { event.stopPropagation(); onCity(city) }}>{city} ×</Text>)}<Text className="card-builder__add">＋</Text></View>{cityPickerVisible && <View className="card-builder__city-options">{CITIES.map((city) => <Text key={city} className={(draft.expectedCities || []).includes(city) ? 'is-selected' : ''} onClick={() => onCity(city)}>{city}</Text>)}</View>}<Text className="card-builder__field-label">工作类型<Text>（必填）</Text></Text><View className="card-builder__radio-row card-builder__radio-row--three">{['全职', '兼职', '不限'].map((type) => <Text key={type} className={draft.workType === type ? 'is-selected' : ''} onClick={() => update('workType', type)}><Text className="card-builder__radio">{draft.workType === type ? '◉' : '○'}</Text>{type}</Text>)}</View><Field label="薪资要求（月薪，单位：元）" value={draft.monthlySalary || ''} placeholder="例如：8000 - 10000" onInput={(value) => update('monthlySalary', value)} /><Field label="薪资要求（时薪，单位：元）" value={draft.hourlySalary || ''} placeholder="例如：100 - 150" onInput={(value) => update('hourlySalary', value)} /><Text className="card-builder__field-label">是否接受坐班<Text>（建议填写）</Text></Text><View className="card-builder__radio-row"><Text className={draft.acceptShift ? 'is-selected' : ''} onClick={() => update('acceptShift', true)}><Text className="card-builder__radio">{draft.acceptShift ? '◉' : '○'}</Text>接受</Text><Text className={!draft.acceptShift ? 'is-selected' : ''} onClick={() => update('acceptShift', false)}><Text className={!draft.acceptShift ? 'card-builder__radio' : 'card-builder__radio'}>{!draft.acceptShift ? '◉' : '○'}</Text>不接受</Text></View><Text className="card-builder__field-label">意向品类<Text>（多选）</Text></Text><View className="card-builder__category-grid">{CATEGORIES.map((category) => <Text key={category} className={draft.categories.includes(category) ? 'is-selected' : ''} onClick={() => onCategory(category)}>{category}</Text>)}</View></View>
}

function ExperienceStep({ draft, update }: { draft: AnchorCard; update: <K extends keyof AnchorCard>(key: K, value: AnchorCard[K]) => void }) {
  return <View className="card-builder__content"><Text className="card-builder__eyebrow">第 4 步</Text><Text className="card-builder__title">直播经验</Text><Field label="直播经验" value={draft.experienceYears ? `${draft.experienceYears} 年` : ''} placeholder="例如：1 年以下" onInput={(value) => update('experienceYears', Number(value.replace(/\D/g, '')) || 0)} /><Field label="直播过的账号" value={draft.accountName || ''} placeholder="请输入" onInput={(value) => update('accountName', value)} /><Text className="card-builder__field-label">自然流起号经验<Text>（建议填写）</Text></Text><View className="card-builder__radio-row"><Text className={draft.naturalTraffic ? 'is-selected' : ''} onClick={() => update('naturalTraffic', false)}><Text className="card-builder__radio">{!draft.naturalTraffic ? '◉' : '○'}</Text>无</Text><Text className={draft.naturalTraffic ? 'is-selected' : ''} onClick={() => update('naturalTraffic', true)}><Text className="card-builder__radio">{draft.naturalTraffic ? '◉' : '○'}</Text>有</Text></View><Field label="最高 GMV" value={draft.peakGmv || ''} suffix="万" placeholder="请输入" onInput={(value) => update('peakGmv', value)} /><Text className="card-builder__field-label">模卡一句话介绍<Text>（必填）</Text></Text><Textarea className="card-builder__textarea" value={draft.intro} maxlength={200} placeholder="例如：亲和力强、学习能力快" onInput={(event) => update('intro', event.detail.value)} /><Text className="card-builder__field-label">自身优势<Text>（建议填写）</Text></Text><Textarea className="card-builder__textarea" value={draft.advantage || ''} maxlength={200} placeholder="请输入你的直播优势" onInput={(event) => update('advantage', event.detail.value)} /></View>
}

function Field({ label, required, value, placeholder, suffix, onInput }: { label: string; required?: boolean; value: string; placeholder: string; suffix?: string; onInput: (value: string) => void }) {
  return <View className="card-builder__field"><Text className="card-builder__field-label">{label}{required && <Text>（必填）</Text>}</Text><View className="card-builder__input-wrap"><Input value={value} placeholder={placeholder} onInput={(event) => onInput(event.detail.value)} />{suffix && <Text>{suffix}</Text>}</View></View>
}
