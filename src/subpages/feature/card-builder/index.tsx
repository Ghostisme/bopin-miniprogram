/**
 * 模卡创建流程：录屏作品 -> 求职意向 -> 基本信息 -> 直播经验 -> 身型学历 -> 自身优势。
 * 每一步都只写入本地草稿，最后一步统一保存，避免上传作品后卡在半成品页面。
 */

import { useMemo, useRef, useState } from 'react'
import { Image, Input, ScrollView, Text, Textarea, Video, View } from '@tarojs/components'
import Taro, { useDidShow, useLoad } from '@tarojs/taro'
import type { AnchorCard, UserProfile } from '@/types'
import { fetchUserProfile, updateAnchorCard, uploadCardMedia } from '@/services'
import { getStorage, setActiveRole, tokenKeyForRole } from '@/utils/storage'
import { isImageSource } from '@/utils/media'
import cardCover from '@/assets/card/cover.jpg'
import './index.scss'

// 顺序与参考截图一致：先上传作品，再补求职信息，最后填写个人优势。
const STEPS = ['上传录屏', '求职意向', '基本信息', '直播经验', '身型、学历', '自身优势']
type RegionGroup = { province: string; cities: string[] }

const REGION_GROUPS: RegionGroup[] = [
  { province: '全国', cities: [] },
  { province: '北京市', cities: ['北京'] },
  { province: '上海市', cities: ['上海'] },
  { province: '广东省', cities: ['广州', '深圳', '东莞', '佛山', '珠海', '惠州', '中山', '汕头'] },
  { province: '浙江省', cities: ['杭州', '宁波', '温州', '嘉兴', '绍兴', '金华', '台州'] },
  { province: '江苏省', cities: ['南京', '苏州', '无锡', '常州', '南通', '徐州', '扬州'] },
  { province: '福建省', cities: ['福州', '厦门', '泉州', '漳州', '莆田', '宁德'] },
  { province: '四川省', cities: ['成都', '绵阳', '德阳', '乐山', '宜宾', '南充'] },
  { province: '重庆市', cities: ['重庆'] },
  { province: '湖北省', cities: ['武汉', '宜昌', '襄阳', '荆州', '黄石'] },
  { province: '湖南省', cities: ['长沙', '株洲', '湘潭', '衡阳', '岳阳'] },
  { province: '山东省', cities: ['济南', '青岛', '烟台', '潍坊', '临沂', '淄博'] },
  { province: '河南省', cities: ['郑州', '洛阳', '开封', '新乡', '南阳'] },
  { province: '河北省', cities: ['石家庄', '唐山', '保定', '秦皇岛', '廊坊'] },
  { province: '山西省', cities: ['太原', '大同', '运城', '临汾'] },
  { province: '辽宁省', cities: ['沈阳', '大连', '鞍山', '锦州'] },
  { province: '吉林省', cities: ['长春', '吉林', '延边'] },
  { province: '黑龙江省', cities: ['哈尔滨', '大庆', '齐齐哈尔', '牡丹江'] },
  { province: '安徽省', cities: ['合肥', '芜湖', '蚌埠', '阜阳', '安庆'] },
  { province: '江西省', cities: ['南昌', '九江', '赣州', '上饶'] },
  { province: '广西壮族自治区', cities: ['南宁', '柳州', '桂林', '北海'] },
  { province: '海南省', cities: ['海口', '三亚'] },
  { province: '贵州省', cities: ['贵阳', '遵义', '六盘水'] },
  { province: '云南省', cities: ['昆明', '大理', '丽江', '曲靖'] },
  { province: '陕西省', cities: ['西安', '咸阳', '宝鸡', '渭南'] },
  { province: '甘肃省', cities: ['兰州', '天水', '酒泉'] },
  { province: '青海省', cities: ['西宁'] },
  { province: '内蒙古自治区', cities: ['呼和浩特', '包头', '鄂尔多斯'] },
  { province: '宁夏回族自治区', cities: ['银川'] },
  { province: '新疆维吾尔自治区', cities: ['乌鲁木齐', '喀什'] },
  { province: '西藏自治区', cities: ['拉萨'] },
  { province: '香港特别行政区', cities: ['香港'] },
  { province: '澳门特别行政区', cities: ['澳门'] },
  { province: '台湾省', cities: ['台北', '高雄', '台中'] },
]
const HOT_CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '厦门', '武汉', '西安', '郑州', '合肥']
const CATEGORIES = ['服饰', '美妆', '数码', '食品酒饮', '珠宝', '家电', '日用家具', '户外运动', '母婴宠物', '奢品', '本地生活', '汽车', '其他']
const EDUCATIONS = ['初中', '职高/高中', '大专', '本科及以上']
const EXPERIENCE_OPTIONS = [
  { label: '1 年以下', value: 0 },
  { label: '1 年', value: 1 },
  { label: '2 年', value: 2 },
  { label: '3 年以上', value: 3 },
]

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
  const [birthPickerVisible, setBirthPickerVisible] = useState(false)
  const [experiencePickerVisible, setExperiencePickerVisible] = useState(false)
  const [educationPickerVisible, setEducationPickerVisible] = useState(false)
  const [noticePromptVisible, setNoticePromptVisible] = useState(false)
  const [noticePreferences, setNoticePreferences] = useState([false, false, false])
  const editCardIdRef = useRef('')

  useLoad(({ id, step: requestedStep }) => {
    editCardIdRef.current = String(id || '')
    const stepValue = Number(requestedStep)
    if (Number.isInteger(stepValue) && stepValue >= 0 && stepValue < STEPS.length) setStep(stepValue)
  })

  useDidShow(async () => {
    setActiveRole('anchor')
    if (!getStorage<string | undefined>(tokenKeyForRole('anchor'), undefined)) {
      Taro.redirectTo({ url: '/subpages/feature/role-login/index?role=anchor' })
      return
    }
    try {
      const user = await fetchUserProfile()
      const cards = user.anchorCards?.length ? user.anchorCards : user.anchorCard ? [user.anchorCard] : []
      const selectedCard = editCardIdRef.current ? cards.find((card) => card.id === editCardIdRef.current) : undefined
      setDraft((current) => selectedCard ? { ...newDraft(user), ...selectedCard } : current.stageName ? current : newDraft(user))
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
    setDraft((current) => ({ ...current, recordingUrl: nextClips[0] || '', recordingClips: nextClips, recordingTitles: nextTitles, coverImage: current.coverImage === recordingClips[index] ? (isImageSource(nextClips[0]) ? nextClips[0] : cardCover) : (isImageSource(current.coverImage) ? current.coverImage : cardCover) }))
  }

  const updateRecordingTitle = (index: number, title: string) => {
    const nextTitles = [...recordingTitles]
    nextTitles[index] = title
    update('recordingTitles', nextTitles)
  }

  const chooseCover = (index: number) => {
    const selected = recordingClips[index]
    if (!isImageSource(selected)) {
      update('coverImage', cardCover)
      Taro.showToast({ title: '视频暂使用默认封面', icon: 'none' })
      return
    }
    update('coverImage', selected)
  }

  const toggleCategory = (category: string) => {
    const next = selectedCategories.has(category) ? draft.categories.filter((item) => item !== category) : [...draft.categories, category]
    update('categories', next)
  }

  const toggleCity = (city: string) => {
    setDraft((current) => {
      const selected = current.expectedCities || []
      if (city === '全国') {
        const next = selected.includes('全国') ? [] : ['全国']
        return { ...current, expectedCities: next, city: !current.city.trim() || selected.includes(current.city) ? (next[0] || '') : current.city }
      }
      const region = REGION_GROUPS.find((group) => group.province === city || group.cities.includes(city))
      const province = region?.province
      const withoutNationwide = selected.filter((item) => item !== '全国')
      const isProvinceOption = province === city
      const withoutSameRegion = province && isProvinceOption
        ? withoutNationwide.filter((item) => item !== province && !region?.cities.includes(item))
        : withoutNationwide.filter((item) => item !== province)
      const next = selected.includes(city) ? withoutSameRegion : [...withoutSameRegion, city]
      return { ...current, expectedCities: next, city: !current.city.trim() || selected.includes(current.city) ? (next[0] || '') : current.city }
    })
  }

  const nextStep = () => {
    if (step === 0 && recordingClips.length > 0) {
      setNoticePromptVisible(true)
      return
    }
    if (step < STEPS.length - 1) {
      setStep((current) => current + 1)
      return
    }
    void save()
  }

  const save = async () => {
    const categories = draft.categories.map((item) => item.trim()).filter(Boolean)
    const intro = draft.intro.trim() || draft.advantage?.trim() || ''
    if (!draft.stageName.trim() || !draft.birthMonth?.trim() || !draft.city.trim() || !intro || !categories.length || draft.experienceYears < 0) {
      Taro.showToast({ title: '请补齐称呼、出生年月、城市、品类、经验和简介', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      await updateAnchorCard({ ...draft, intro, categories, coverImage: isImageSource(draft.coverImage) ? draft.coverImage : cardCover, clips: draft.clips || [] })
      Taro.showToast({ title: '模卡已保存', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 350)
    } catch {
      // request 层负责展示服务端返回的错误。
    } finally {
      setSaving(false)
    }
  }

  const updateAdvantage = (value: string) => setDraft((current) => ({ ...current, advantage: value, intro: value }))

  const continueAfterNoticePrompt = () => {
    setNoticePromptVisible(false)
    setStep(1)
  }

  if (loading) return <View className="card-builder"><Text className="card-builder__loading">正在准备模卡</Text></View>

  return (
    <View className="card-builder">
      <View className="card-builder__nav"><Text onClick={() => step > 0 ? setStep((current) => current - 1) : Taro.navigateBack()}>‹</Text><Text>{STEPS[step]}</Text><Text className="card-builder__nav-spacer" /></View>

      {step === 0 && <RecordingStep clips={recordingClips} titles={recordingTitles} coverImage={draft.coverImage || ''} uploading={uploading} onUpload={uploadRecording} onRemove={removeRecording} onTitle={updateRecordingTitle} onCover={chooseCover} />}
      {step === 1 && <IntentStep draft={draft} update={update} cityPickerVisible={cityPickerVisible} onCityPicker={() => setCityPickerVisible((visible) => !visible)} onCity={toggleCity} onCategory={toggleCategory} />}
      {step === 2 && <BasicStep draft={draft} update={update} onBirthMonth={() => setBirthPickerVisible(true)} />}
      {step === 3 && <ExperienceStep draft={draft} update={update} onExperience={() => setExperiencePickerVisible(true)} />}
      {step === 4 && <BodyStep draft={draft} update={update} onEducation={() => setEducationPickerVisible(true)} />}
      {step === 5 && <AdvantageStep value={draft.advantage || ''} onChange={updateAdvantage} />}

      {step === 2 && birthPickerVisible && <BirthPicker value={draft.birthMonth || ''} age={draft.age || 23} onClose={() => setBirthPickerVisible(false)} onConfirm={(value) => { update('birthMonth', value); setBirthPickerVisible(false) }} />}
      {step === 3 && experiencePickerVisible && <OptionPicker title="直播经验" value={draft.experienceYears} options={EXPERIENCE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))} onClose={() => setExperiencePickerVisible(false)} onSelect={(value) => { update('experienceYears', value); update('liveYears', value); setExperiencePickerVisible(false) }} />}
      {step === 4 && educationPickerVisible && <OptionPicker title="学历" value={draft.education || ''} options={EDUCATIONS.map((item) => ({ label: item, value: item }))} onClose={() => setEducationPickerVisible(false)} onSelect={(value) => { update('education', value); setEducationPickerVisible(false) }} />}

      <View className="card-builder__footer"><View className={`card-builder__next ${saving || uploading ? 'is-disabled' : ''}`} onClick={nextStep}>{saving ? '保存中…' : step === STEPS.length - 1 ? '完成' : '下一步'}</View>{step === 0 && <Text className="card-builder__skip" onClick={() => setStep(1)}>跳过</Text>}</View>
      {noticePromptVisible && <NoticePrompt preferences={noticePreferences} onToggle={(index) => setNoticePreferences((current) => current.map((value, itemIndex) => itemIndex === index ? !value : value))} onClose={continueAfterNoticePrompt} />}
    </View>
  )
}

function RecordingStep({ clips, titles, coverImage, uploading, onUpload, onRemove, onTitle, onCover }: { clips: string[]; titles: string[]; coverImage: string; uploading: boolean; onUpload: () => void; onRemove: (index: number) => void; onTitle: (index: number, title: string) => void; onCover: (index: number) => void }) {
  return <View className="card-builder__content">
    <Text className="card-builder__title">上传录屏，更容易获得企业青睐</Text>
    <Text className="card-builder__description">录屏是企业最关注的资料，建议提供多个风格和品类。</Text>
    <View className="card-builder__notice">注：请勿乱传，也不要上传简历，会被封号</View>
    <View className="card-builder__media-list">
      {clips.map((clip, index) => <View className="card-builder__media-item" key={`${clip}-${index}`}><View className="card-builder__media-main"><View className="card-builder__media-thumb"><Video src={clip} controls={false} showCenterPlayBtn={false} /><Text className="card-builder__media-play">▶</Text></View><Input className="card-builder__media-title" value={titles[index] || ''} placeholder="请填写直播产品名称" onInput={(event) => onTitle(index, event.detail.value)} /></View><View className="card-builder__media-actions"><Text className={`card-builder__media-cover ${coverImage === clip ? 'is-cover' : ''}`} onClick={() => onCover(index)}><Text className="card-builder__media-radio">{coverImage === clip ? '◉' : '○'}</Text>{coverImage === clip ? '已选为封面' : '选为封面'}</Text><Text onClick={() => onRemove(index)}>删除</Text></View></View>)}
      <View className="card-builder__upload" onClick={onUpload}><Text className="card-builder__upload-plus">＋</Text><View><Text>{uploading ? '正在上传，请稍候' : '视频不能超过300M，10分钟以内'}</Text><Text>视频若太大加载较慢，请保持亮屏耐心等待</Text></View></View>
    </View>
  </View>
}

function BasicStep({ draft, update, onBirthMonth }: { draft: AnchorCard; update: <K extends keyof AnchorCard>(key: K, value: AnchorCard[K]) => void; onBirthMonth: () => void }) {
  return <View className="card-builder__content"><Field label="称呼" required value={draft.stageName} placeholder="请输入" onInput={(value) => update('stageName', value)} /><View className="card-builder__field"><Text className="card-builder__field-label">出生年月<Text>（必填）</Text></Text><View className="card-builder__select" onClick={onBirthMonth}><Text>{draft.birthMonth || '请选择'}</Text><Text>›</Text></View></View><Text className="card-builder__field-label">性别<Text>（必填）</Text></Text><View className="card-builder__radio-row">{['女', '男'].map((gender) => <Text key={gender} className={draft.gender === gender ? 'is-selected' : ''} onClick={() => update('gender', gender)}><Text className="card-builder__radio">{draft.gender === gender ? '◉' : '○'}</Text>{gender}</Text>)}</View><Field label="直播过的品类" value={draft.experienceCategory || ''} placeholder="请输入，例如：美妆、服饰" onInput={(value) => update('experienceCategory', value)} /></View>
}

function BodyStep({ draft, update, onEducation }: { draft: AnchorCard; update: <K extends keyof AnchorCard>(key: K, value: AnchorCard[K]) => void; onEducation: () => void }) {
  return <View className="card-builder__content"><Text className="card-builder__hint">服饰等穿版品类必填，其他品类选填</Text><Field label="身高" value={draft.height || ''} suffix="CM" placeholder="建议填写" onInput={(value) => update('height', value)} /><Field label="体重" value={draft.weight || ''} suffix="KG" placeholder="建议填写" onInput={(value) => update('weight', value)} /><Field label="鞋码" value={draft.shoeSize || ''} suffix="码" placeholder="建议填写" onInput={(value) => update('shoeSize', value)} /><View className="card-builder__field"><Text className="card-builder__field-label">学历<Text>（建议填写）</Text></Text><View className="card-builder__select" onClick={onEducation}><Text>{draft.education || '请选择'}</Text><Text>›</Text></View></View></View>
}

function IntentStep({ draft, update, cityPickerVisible, onCityPicker, onCity, onCategory }: { draft: AnchorCard; update: <K extends keyof AnchorCard>(key: K, value: AnchorCard[K]) => void; cityPickerVisible: boolean; onCityPicker: () => void; onCity: (city: string) => void; onCategory: (category: string) => void }) {
  return <View className="card-builder__content"><Text className="card-builder__field-label">意向城市<Text>（必填）</Text></Text><View className="card-builder__city-select" onClick={onCityPicker}>{(draft.expectedCities || []).map((city) => <Text key={city} className="card-builder__tag is-city" onClick={(event) => { event.stopPropagation(); onCity(city) }}>{city} ×</Text>)}<Text className="card-builder__add">＋</Text></View>{cityPickerVisible && <CityPicker currentCity={draft.city} selected={draft.expectedCities || []} onCity={onCity} onClose={onCityPicker} />}<Text className="card-builder__field-label">工作类型<Text>（必填）</Text></Text><View className="card-builder__radio-row card-builder__radio-row--three">{['全职', '兼职', '不限'].map((type) => <Text key={type} className={draft.workType === type ? 'is-selected' : ''} onClick={() => update('workType', type)}><Text className="card-builder__radio">{draft.workType === type ? '◉' : '○'}</Text>{type}</Text>)}</View><Field label="薪资要求（月薪，单位：元）" value={draft.monthlySalary || ''} placeholder="例如：8000 - 10000" onInput={(value) => update('monthlySalary', value)} /><Field label="薪资要求（时薪，单位：元）" value={draft.hourlySalary || ''} placeholder="例如：100 - 150" onInput={(value) => update('hourlySalary', value)} /><Text className="card-builder__field-label">是否接受坐班<Text>（建议填写）</Text></Text><View className="card-builder__radio-row"><Text className={draft.acceptShift ? 'is-selected' : ''} onClick={() => update('acceptShift', true)}><Text className="card-builder__radio">{draft.acceptShift ? '◉' : '○'}</Text>接受</Text><Text className={!draft.acceptShift ? 'is-selected' : ''} onClick={() => update('acceptShift', false)}><Text className={!draft.acceptShift ? 'card-builder__radio' : 'card-builder__radio'}>{!draft.acceptShift ? '◉' : '○'}</Text>不接受</Text></View><Text className="card-builder__field-label">意向品类<Text>（多选）</Text></Text><View className="card-builder__category-grid">{CATEGORIES.map((category) => <Text key={category} className={draft.categories.includes(category) ? 'is-selected' : ''} onClick={() => onCategory(category)}>{category}</Text>)}</View></View>
}

function CityPicker({ currentCity, selected, onCity, onClose }: { currentCity: string; selected: string[]; onCity: (city: string) => void; onClose: () => void }) {
  const [keyword, setKeyword] = useState('')
  const normalizedKeyword = keyword.trim()
  const visibleGroups = normalizedKeyword
    ? REGION_GROUPS.filter((group) => group.province.includes(normalizedKeyword) || group.cities.some((city) => city.includes(normalizedKeyword)))
    : REGION_GROUPS

  const toggle = (city: string) => onCity(city)

  return <View className="card-builder__city-picker">
    <View className="card-builder__city-picker-nav"><Text onClick={onClose}>‹</Text><Text>选择城市</Text><Text className="card-builder__city-picker-done" onClick={onClose}>完成</Text></View>
    <View className="card-builder__city-picker-search"><Text>⌕</Text><Input value={keyword} placeholder="输入城市或省份名称" onInput={(event) => setKeyword(event.detail.value)} /></View>
    <View className="card-builder__city-picker-current"><Text>当前城市</Text><Text className="card-builder__city-picker-current-value">{currentCity || '未设置'}</Text><Text className="card-builder__city-picker-selected-label">已添加</Text><View>{selected.length ? selected.map((city) => <Text key={city} className="card-builder__city-picker-tag" onClick={() => toggle(city)}>{city} ×</Text>) : <Text className="is-empty">请选择全国、省份或城市</Text>}</View></View>
    {!normalizedKeyword && <><Text className="card-builder__city-picker-section-title">热门城市</Text><View className="card-builder__city-picker-hot">{HOT_CITIES.map((city) => <Text key={city} className={selected.includes(city) ? 'is-selected' : ''} onClick={() => toggle(city)}>{city}</Text>)}</View></>}
    <Text className="card-builder__city-picker-section-title">按省份选择</Text>
    <View className="card-builder__city-picker-list">{visibleGroups.map((group) => <View className="card-builder__city-picker-group" key={group.province}><View className="card-builder__city-picker-group-title"><Text>{group.province}</Text><Text className={selected.includes(group.province) ? 'is-selected' : ''} onClick={() => toggle(group.province)}>{group.province === '全国' ? '全国' : '全省'}</Text></View><View className="card-builder__city-picker-cities">{group.cities.filter((city) => !normalizedKeyword || city.includes(normalizedKeyword) || group.province.includes(normalizedKeyword)).map((city) => <Text key={city} className={selected.includes(city) ? 'is-selected' : ''} onClick={() => toggle(city)}>{city}</Text>)}</View></View>)}</View>
  </View>
}

function ExperienceStep({ draft, update, onExperience }: { draft: AnchorCard; update: <K extends keyof AnchorCard>(key: K, value: AnchorCard[K]) => void; onExperience: () => void }) {
  const experienceLabel = EXPERIENCE_OPTIONS.find((item) => item.value === draft.experienceYears)?.label || '1 年以下'
  return <View className="card-builder__content"><View className="card-builder__field"><Text className="card-builder__field-label">直播经验<Text>（建议填写）</Text></Text><View className="card-builder__select" onClick={onExperience}><Text>{experienceLabel}</Text><Text>›</Text></View></View><Field label="直播过的账号" value={draft.accountName || ''} placeholder="请输入" onInput={(value) => update('accountName', value)} /><Text className="card-builder__field-label">自然流起号经验<Text>（建议填写）</Text></Text><View className="card-builder__radio-row"><Text className={draft.naturalTraffic ? 'is-selected' : ''} onClick={() => update('naturalTraffic', false)}><Text className="card-builder__radio">{!draft.naturalTraffic ? '◉' : '○'}</Text>无</Text><Text className={draft.naturalTraffic ? 'is-selected' : ''} onClick={() => update('naturalTraffic', true)}><Text className="card-builder__radio">{draft.naturalTraffic ? '◉' : '○'}</Text>有</Text></View></View>
}

function AdvantageStep({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <View className="card-builder__content"><Text className="card-builder__field-label">自身优势<Text>（建议填写）</Text></Text><Textarea className="card-builder__textarea card-builder__textarea--large" value={value} maxlength={200} placeholder="请输入你的个人优势介绍" onInput={(event) => onChange(event.detail.value)} /></View>
}

function OptionPicker({ title, value, options, onClose, onSelect }: { title: string; value: string | number; options: Array<{ label: string; value: string | number }>; onClose: () => void; onSelect: (value: any) => void }) {
  return <View className="card-builder__option-picker"><View className="card-builder__option-picker-mask" onClick={onClose} /><View className="card-builder__option-picker-panel"><Text className="card-builder__option-picker-title">{title}</Text>{options.map((option) => <Text key={option.label} className={`card-builder__option-picker-item ${String(option.value) === String(value) ? 'is-selected' : ''}`} onClick={() => onSelect(option.value)}>{option.label}{String(option.value) === String(value) && <Text>✓</Text>}</Text>)}</View></View>
}

function BirthPicker({ value, age, onClose, onConfirm }: { value: string; age: number; onClose: () => void; onConfirm: (value: string) => void }) {
  const currentYear = new Date().getFullYear()
  const initialYear = value.match(/^(\d{4})-/)?.[1] || String(currentYear - age)
  const initialMonth = value.match(/-(\d{2})$/)?.[1] || '01'
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const years = Array.from({ length: 61 }, (_, index) => String(currentYear - 60 + index))
  const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
  const screenWidth = Taro.getSystemInfoSync().windowWidth || 750
  const rowHeight = 70 * screenWidth / 750
  const yearScrollTop = Math.max(0, (years.indexOf(year) - 2) * rowHeight)
  const monthScrollTop = Math.max(0, (months.indexOf(month) - 2) * rowHeight)
  return <View className="card-builder__birth-picker"><View className="card-builder__birth-picker-mask" onClick={onClose} /><View className="card-builder__birth-picker-panel"><Text className="card-builder__birth-picker-title">选择器</Text><View className="card-builder__birth-picker-columns"><ScrollView className="card-builder__birth-picker-column" scrollY scrollTop={yearScrollTop}>{years.map((item) => <Text key={item} className={item === year ? 'is-selected' : ''} onClick={() => setYear(item)}>{item}年</Text>)}</ScrollView><ScrollView className="card-builder__birth-picker-column" scrollY scrollTop={monthScrollTop}>{months.map((item) => <Text key={item} className={item === month ? 'is-selected' : ''} onClick={() => setMonth(item)}>{item}月</Text>)}</ScrollView></View><View className="card-builder__birth-picker-actions"><Text onClick={onClose}>取消</Text><Text onClick={() => onConfirm(`${year}-${month}`)}>确认</Text></View></View></View>
}

function Field({ label, required, value, placeholder, suffix, onInput }: { label: string; required?: boolean; value: string; placeholder: string; suffix?: string; onInput: (value: string) => void }) {
  return <View className="card-builder__field"><Text className="card-builder__field-label">{label}{required && <Text>（必填）</Text>}</Text><View className="card-builder__input-wrap"><Input value={value} placeholder={placeholder} onInput={(event) => onInput(event.detail.value)} />{suffix && <Text>{suffix}</Text>}</View></View>
}

function NoticePrompt({ preferences, onToggle, onClose }: { preferences: boolean[]; onToggle: (index: number) => void; onClose: () => void }) {
  const labels = ['面试邀请通知', '未读消息提醒', '新聊天消息提醒']
  return <View className="card-builder__notice-modal"><View className="card-builder__notice-mask" onClick={onClose} /><View className="card-builder__notice-panel"><View className="card-builder__notice-heading"><Text className="card-builder__notice-badge">播</Text><Text>播络通告汇聚全网主播通告&nbsp; 申请</Text></View><Text className="card-builder__notice-en">Send the following message once</Text>{labels.map((label, index) => <View className="card-builder__notice-option" key={label} onClick={() => onToggle(index)}><Text>{label}</Text><View className={`card-builder__toggle ${preferences[index] ? 'is-on' : ''}`}><View /></View></View>)}<Text className="card-builder__notice-tip"><Text className="card-builder__notice-tip-icon">✓</Text> 总是保持以上选择</Text><View className="card-builder__notice-actions"><Text onClick={onClose}>拒绝</Text><Text onClick={onClose}>允许</Text></View></View></View>
}
