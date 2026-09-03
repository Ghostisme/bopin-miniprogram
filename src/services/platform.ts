import { request } from '@/utils/request'

export interface Wallet {
  userId: string
  cardBalance: number
  memberLevel: string
  aiQuota: number
}

export interface ServiceAccess {
  id: string
  userId: string
  featureKey: 'CARD_OPTIMIZE' | 'CARD_EXPOSURE' | 'AI_SCRIPT' | 'ANCHOR_WITHDRAW' | 'CONTACT_UNLOCK' | string
  label: string
  enabled: boolean
  countLimited: boolean
  remainingCount: number
  expiryLimited: boolean
  expiresAt: number | null
  unitPrice: number
  feeRate: number
  active: boolean
}

export interface AiScript {
  id: string
  scene: string
  product: string
  tone: string
  content: string
  remainingQuota: number
}

export interface PlatformCourse {
  ID: string
  NAME: string
  MODE: 'ONLINE' | 'OFFLINE'
  CITY: string
  STARTS_AT: number
  CAPACITY: number
  ENROLLED: number
  PRICE: number
  STATUS: string
}

export interface PlatformProduct {
  ID: string
  NAME: string
  PRICE: number
  GROUP_PRICE: number
  STOCK: number
  PARTICIPANTS: number
  STATUS: string
}

export interface PlatformEvent {
  ID: string
  NAME: string
  CITY: string
  EVENT_DATE: number
  STATUS: string
}

export interface EorProvider {
  ID: string
  COUNTRY: string
  NAME: string
  CURRENCIES: string
  SERVICE_FEE: number
  RATING: number
  STATUS: string
}

export interface PlatformRecord {
  ID: string
  STATUS: string
  [key: string]: unknown
}

export const fetchWallet = () => request<Wallet>({ url: '/wallet' })
export const fetchServiceAccess = () => request<ServiceAccess[]>({ url: '/users/me/service-access' })
export const topUpCards = (cards: number) => request<PlatformRecord>({ url: '/wallet/topup', method: 'POST', data: { cards } })
export const unlockContact = (noticeId: string) => request<PlatformRecord>({ url: `/notices/${noticeId}/unlock`, method: 'POST' })
export const purchaseMembership = (plan: string) => request<PlatformRecord>({ url: '/membership/orders', method: 'POST', data: { plan, amount: plan === 'PRO' ? 29.9 : 99 } })
export const generateAiScript = (scene: string, product: string, tone: string) => request<AiScript>({ url: '/ai/scripts', method: 'POST', data: { scene, product, tone } })
export const fetchAiScripts = () => request<AiScript[]>({ url: '/ai/scripts' })
export const optimizeAnchorCard = (cardId: string, input: { intro?: string; advantage?: string; stageName?: string; categories?: string[] }) => request<PlatformRecord>({ url: `/users/me/cards/${cardId}/optimize`, method: 'POST', data: input })
export const purchaseCardExposure = (cardId: string) => request<PlatformRecord>({ url: `/users/me/cards/${cardId}/exposure`, method: 'POST' })
export const requestAnchorWithdraw = (grossAmount: number) => request<PlatformRecord>({ url: '/users/me/withdraw', method: 'POST', data: { grossAmount } })

export const fetchCourses = (mode?: 'ONLINE' | 'OFFLINE') => request<PlatformCourse[]>({ url: `/courses${mode ? `?mode=${mode}` : ''}`, auth: false })
export const enrollCourse = (courseId: string) => request<PlatformRecord>({ url: `/courses/${courseId}/enroll`, method: 'POST' })
export const submitExam = (enrollmentId: string, score: number) => request<PlatformRecord>({ url: `/courses/enrollments/${enrollmentId}/exam`, method: 'POST', data: { score } })
export const fetchEnrollments = () => request<PlatformRecord[]>({ url: '/courses/enrollments' })

export const fetchProducts = () => request<PlatformProduct[]>({ url: '/equipment/products', auth: false })
export const purchaseProduct = (productId: string) => request<PlatformRecord>({ url: `/equipment/products/${productId}/orders`, method: 'POST', data: {} })
export const fetchEquipmentOrders = () => request<PlatformRecord[]>({ url: '/equipment/orders' })

export const fetchAnnualEvents = () => request<PlatformEvent[]>({ url: '/events', auth: false })
export const registerAnnualEvent = (eventId: string) => request<PlatformRecord>({ url: `/events/${eventId}/register`, method: 'POST' })
export const voteAnnualEvent = (registrationId: string) => request<PlatformRecord>({ url: `/events/registrations/${registrationId}/vote`, method: 'POST' })
export const fetchEventRegistrations = (eventId: string) => request<PlatformRecord[]>({ url: `/events/${eventId}/registrations`, auth: false })

export const settleCrossBorder = (country: string, currency: string, foreignAmount: number, rate: number) => request<PlatformRecord>({ url: '/cross-border/settlements', method: 'POST', data: { country, currency, foreignAmount, rate } })
export const fetchCrossBorderSettlements = () => request<PlatformRecord[]>({ url: '/cross-border/settlements' })
export const fetchEorProviders = () => request<EorProvider[]>({ url: '/eor/providers', auth: false })
export const createEorRequest = (providerId: string, country: string) => request<PlatformRecord>({ url: '/eor/requests', method: 'POST', data: { providerId, country, company: '播聘示例企业', candidate: '米粒' } })

export const createContract = () => request<PlatformRecord>({ url: '/contracts', method: 'POST', data: { anchorName: '米粒', company: '播聘示例企业', jobTitle: '主播合作服务', amount: 18000 } })
export const settleContract = (contractId: string) => request<PlatformRecord>({ url: `/contracts/${contractId}/settle`, method: 'POST', data: { grossAmount: 18000, currency: 'CNY' } })
export const createPaidInvitation = () => request<PlatformRecord>({ url: '/invitations', method: 'POST', data: { company: '播聘示例企业', anchorName: '米粒', jobTitle: '美妆带货主播', fee: 29.9 } })
