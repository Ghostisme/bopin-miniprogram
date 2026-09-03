import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import {
  createContract,
  createEorRequest,
  createPaidInvitation,
  enrollCourse,
  fetchAnnualEvents,
  fetchCourses,
  fetchEnrollments,
  fetchEorProviders,
  fetchEventRegistrations,
  fetchProducts,
  fetchWallet,
  fetchServiceAccess,
  purchaseProduct,
  settleContract,
  settleCrossBorder,
  submitExam,
  topUpCards,
  unlockContact,
  voteAnnualEvent,
  registerAnnualEvent,
  fetchNotices,
  type EorProvider,
  type PlatformCourse,
  type PlatformEvent,
  type PlatformProduct,
  type PlatformRecord,
  type Wallet,
  type ServiceAccess,
} from '@/services'
import { getStorage, setActiveRole, tokenKeyForRole } from '@/utils/storage'
import './index.scss'

type ServiceDomain = 'supply' | 'trade' | 'growth' | 'global'

const serviceDomains: Array<{ key: ServiceDomain; title: string; label: string }> = [
  { key: 'supply', title: '供需与内容', label: '主播与通告' },
  { key: 'trade', title: '交易与沟通', label: '合作与转化' },
  { key: 'growth', title: '培训与活动', label: '成长与生态' },
  { key: 'global', title: '跨境服务', label: '全球化服务' },
]

function field(record: PlatformRecord | undefined, name: string): string {
  const value = record?.[name]
  return value === undefined || value === null ? '' : String(value)
}

export default function ServicesPage() {
  const [domain, setDomain] = useState<ServiceDomain>('supply')
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [serviceAccess, setServiceAccess] = useState<ServiceAccess[]>([])
  const [notices, setNotices] = useState<Array<{ id: string; title: string }>>([])
  const [courses, setCourses] = useState<PlatformCourse[]>([])
  const [products, setProducts] = useState<PlatformProduct[]>([])
  const [events, setEvents] = useState<PlatformEvent[]>([])
  const [providers, setProviders] = useState<EorProvider[]>([])
  const [enrollments, setEnrollments] = useState<PlatformRecord[]>([])
  const [action, setAction] = useState('服务已连接，可开始办理')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      const [walletData, accessData, noticeData, courseData, productData, eventData, providerData, enrollmentData] = await Promise.all([
        fetchWallet(), fetchServiceAccess(), fetchNotices(), fetchCourses(), fetchProducts(), fetchAnnualEvents(), fetchEorProviders(), fetchEnrollments(),
      ])
      setWallet(walletData)
      setServiceAccess(accessData)
      setNotices(noticeData.map((item) => ({ id: item.id, title: item.title })))
      setCourses(courseData)
      setProducts(productData)
      setEvents(eventData)
      setProviders(providerData)
      setEnrollments(enrollmentData)
    } catch {
      Taro.showToast({ title: '服务加载失败', icon: 'none' })
    }
  }

  useDidShow(() => {
    setActiveRole('anchor')
    if (!getStorage<string | undefined>(tokenKeyForRole('anchor'), undefined)) {
      Taro.redirectTo({ url: '/subpages/feature/role-login/index?role=anchor' })
      return
    }
    load()
  })

  const run = async (label: string, job: () => Promise<void>) => {
    if (loading) return
    setLoading(true)
    try {
      await job()
      setAction(`${label}已完成`)
      await load()
      Taro.showToast({ title: `${label}成功`, icon: 'success' })
    } catch {
      // request 层负责提示业务错误
    } finally {
      setLoading(false)
    }
  }

  const firstOnline = courses.find((item) => item.MODE === 'ONLINE')
  const firstOffline = courses.find((item) => item.MODE === 'OFFLINE')
  const firstProduct = products[0]
  const firstEvent = events[0]
  const firstProvider = providers[0]
  const accessFor = (featureKey: string) => serviceAccess.find((item) => item.featureKey === featureKey)
  const contactAccess = accessFor('CONTACT_UNLOCK')
  const aiAccess = accessFor('AI_SCRIPT')

  const handleTraining = async () => {
    if (!firstOnline) return
    let enrollment = enrollments.find((item) => field(item, 'COURSE_ID') === firstOnline.ID)
    if (!enrollment) enrollment = await enrollCourse(firstOnline.ID)
    if (field(enrollment, 'STATUS') !== 'PASSED') await submitExam(field(enrollment, 'ID'), 86)
  }

  const handleEvent = async () => {
    if (!firstEvent) return
    let registrations = await fetchEventRegistrations(firstEvent.ID)
    let registration = registrations[0]
    if (!registration) registration = await registerAnnualEvent(firstEvent.ID)
    await voteAnnualEvent(field(registration, 'ID'))
  }

  return (
    <View className="services-page">
      <View className="services-page__hero">
        <Text className="services-page__eyebrow">播聘服务中心</Text>
        <Text className="services-page__title">从第一场直播，到更大的舞台</Text>
        <Text className="services-page__subtitle">每项服务均已接入可追溯订单、状态和记录。</Text>
        <View className="services-page__wallet">
          <View><Text>{wallet?.cardBalance ?? '--'}</Text><Text>道具卡</Text></View>
          <View><Text>{wallet?.aiQuota ?? '--'}</Text><Text>AI 次数</Text></View>
          <View><Text>{wallet?.memberLevel ?? '--'}</Text><Text>会员等级</Text></View>
        </View>
      </View>

      <View className="services-page__tabs">
        {serviceDomains.map((item) => <View key={item.key} className={`services-page__tab ${domain === item.key ? 'is-active' : ''}`} onClick={() => setDomain(item.key)}><Text>{item.title}</Text><Text>{item.label}</Text></View>)}
      </View>

      <View className="services-page__notice"><Text className="services-page__notice-dot" /><Text>{loading ? '正在处理…' : action}</Text></View>

      {domain === 'supply' && <View className="services-page__section">
        <ServiceCard index="01" title="主播注册与模卡" desc="模卡是平台核心服务的必填资料，完善后才能解锁联系、训练和结算服务。" status="模卡必填" action="完善模卡" onClick={() => Taro.switchTab({ url: '/pages/mine/index' })} />
        <ServiceCard index="02" title="岗位发布与搜索" desc="按城市、品类和用工类型筛选真实招聘通告。" status={`${notices.length} 个岗位`} action="浏览通告" onClick={() => Taro.switchTab({ url: '/pages/notice/index' })} />
        <ServiceCard index="03" title="联系方式解锁 · 道具卡" desc={`使用 1 张道具卡解锁「${notices[0]?.title ?? '精选岗位'}」招聘方。`} status={contactAccess?.active === false ? '暂未开放' : `${wallet?.cardBalance ?? 0} 张可用`} action={contactAccess?.active === false ? '暂未开放' : '立即解锁'} disabled={contactAccess?.active === false} onClick={() => run('联系方式解锁', async () => { if (!notices[0] || contactAccess?.active === false) return; await unlockContact(notices[0].id) })} />
        <ServiceCard index="04" title="AI 话术与会员体系" desc="生成直播开场、卖点讲解和催单话术，会员可补充额度。" status={aiAccess?.active === false ? '暂未开放' : `${wallet?.aiQuota ?? 0} 次可用`} action={aiAccess?.active === false ? '暂未开放' : '打开 AI 工作台'} disabled={aiAccess?.active === false} onClick={() => { if (aiAccess?.active !== false) Taro.switchTab({ url: '/pages/ai/index' }) }} />
        <ServiceCard index="05" title="道具卡补充" desc="本地支付沙箱会生成订单并即时补充道具卡余额。" status="支付沙箱已接入" action="购买 3 张" onClick={() => run('道具卡购买', async () => { await topUpCards(3) })} />
      </View>}

      {domain === 'trade' && <View className="services-page__section">
        <ServiceCard index="01" title="平台结算 + 灵活用工" desc="创建主播合作合同，自动计算平台服务费和结算净额。" status="6% 服务费" action="创建并结算" onClick={() => run('合同结算', async () => { const contract = await createContract(); await settleContract(field(contract, 'ID')) })} />
        <ServiceCard index="02" title="品牌 BOSS 直聊付费邀约" desc="企业发起定向邀约，生成可追溯付费订单并进入沟通队列。" status="29.9 元 / 次" action="发起邀约" onClick={() => run('付费邀约', async () => { await createPaidInvitation() })} />
        <ServiceCard index="03" title="线上训练营 + 认证考试" desc={`${firstOnline?.NAME ?? '直播训练营'}，报名后可直接进入考试并生成证书。`} status={`${firstOnline?.ENROLLED ?? 0}/${firstOnline?.CAPACITY ?? 0} 已报名`} action="报名并认证" onClick={() => run('训练营认证', handleTraining)} />
      </View>}

      {domain === 'growth' && <View className="services-page__section">
        <ServiceCard index="01" title="线下培训课" desc={`${firstOffline?.CITY ?? '杭州'}线下实训，订单与报名状态统一留存。`} status={`${firstOffline?.PRICE ?? 0} 元`} action="报名课程" onClick={() => run('线下课程报名', async () => { if (firstOffline) await enrollCourse(firstOffline.ID) })} />
        <ServiceCard index="02" title="直播设备团购" desc={`${firstProduct?.NAME ?? '直播设备'}，使用团购价下单并扣减库存。`} status={`团购价 ${firstProduct?.GROUP_PRICE ?? '--'} 元`} action="团购下单" onClick={() => run('团购下单', async () => { if (firstProduct) await purchaseProduct(firstProduct.ID) })} />
        <ServiceCard index="03" title="年度主播盛典" desc={`${firstEvent?.NAME ?? '年度主播盛典'}，完成报名后可为参赛资料投票。`} status={firstEvent?.CITY ?? '杭州'} action="报名并投票" onClick={() => run('盛典报名投票', handleEvent)} />
      </View>}

      {domain === 'global' && <View className="services-page__section">
        <ServiceCard index="01" title="多语言 + 跨境结算" desc="按汇率生成外币收入、服务费和人民币净额结算流水。" status="USD → CNY" action="结算 1,000 USD" onClick={() => run('跨境结算', async () => { await settleCrossBorder('新加坡', 'USD', 1000, 7.24) })} />
        <ServiceCard index="02" title="海外 EOR 服务商对接" desc={`${firstProvider?.NAME ?? '海外 EOR 服务商'}，提交雇佣服务申请并进入处理队列。`} status={`${firstProvider?.COUNTRY ?? '新加坡'} · ${firstProvider?.RATING ?? '--'} 分`} action="提交申请" onClick={() => run('EOR 服务申请', async () => { if (firstProvider) await createEorRequest(firstProvider.ID, firstProvider.COUNTRY) })} />
      </View>}
    </View>
  )
}

function ServiceCard({ index, title, desc, status, action, disabled, onClick }: { index: string; title: string; desc: string; status: string; action: string; disabled?: boolean; onClick: () => void }) {
  return <View className={`service-card ${disabled ? 'is-disabled' : ''}`}><View className="service-card__head"><Text>{index}</Text><Text>{status}</Text></View><Text className="service-card__title">{title}</Text><Text className="service-card__desc">{desc}</Text><View className="service-card__action" onClick={disabled ? undefined : onClick}>{action}<Text>›</Text></View></View>
}
