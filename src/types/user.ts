/**
 * 用户与身份会话相关类型
 *
 * 主播端与企业端共用基础类型，但通过 role 和独立 token 会话隔离资料、权限与业务记录。
 */

/** 用户角色：主播端 / 商家端。当前 App 以主播端为主 */
export type UserRole = 'anchor' | 'merchant'

export interface AuthSession {
  token: string
  role: UserRole
  user: UserProfile
}

/**
 * 主播简历。
 *
 * 对应列表页「粘贴你的资料」AI 解析入口：用户粘贴一段自我介绍文本，
 * 由 AI 解析填充为结构化简历。这里定义解析后的目标结构。
 */
export interface Resume {
  /** 昵称 / 艺名 */
  nickname: string
  /** 期望品类 */
  categories: string[]
  /** 期望城市 */
  city: string
  /** 自我介绍原文 */
  intro: string
  /** 过往经验年限 */
  experienceYears?: number
}

/** 主播模卡。一个主播可以维护多张模卡，并选择其中一张对企业公开展示。 */
export interface AnchorCard {
  /** 模卡唯一标识，由服务端生成 */
  id?: string
  /** 是否为企业端当前展示的主模卡 */
  isPrimary?: boolean
  /** 创建与最后编辑时间，用于客户端排序展示 */
  createdAt?: number
  updatedAt?: number
  /** 对外展示的艺名 / 主播名 */
  stageName: string
  /** 擅长的直播品类 */
  categories: string[]
  /** 出生年月，模卡公开展示前端可选择性显示 */
  birthMonth?: string
  /** 当前所在城市 */
  city: string
  /** 对外简介 */
  intro: string
  /** 直播经验年限 */
  experienceYears: number
  /** 期望收入 */
  expectedSalary: string
  /** 可开播时间 */
  availableTime: string
  /** 年龄 */
  age?: number
  /** 性别 */
  gender?: string
  /** 身高 */
  height?: string
  /** 体重 */
  weight?: string
  /** 鞋码 */
  shoeSize?: string
  /** 学历 */
  education?: string
  /** 意向城市 */
  expectedCities?: string[]
  /** 能否接受全班次或排班 */
  acceptShift?: boolean
  /** 工作类型：全职、兼职或不限 */
  workType?: string
  /** 月薪期望 */
  monthlySalary?: string
  /** 时薪期望 */
  hourlySalary?: string
  /** 是否有自然流量起号经验 */
  naturalTraffic?: boolean
  /** 代表直播品类 */
  experienceCategory?: string
  /** 直播账号脱敏展示 */
  accountName?: string
  /** 最高单场 GMV */
  peakGmv?: string
  /** 累计直播年限 */
  liveYears?: number
  /** 对外展示的优势文案 */
  advantage?: string
  /** 公开模卡封面，未上传时由客户端使用默认素材 */
  coverImage?: string
  /** 公开模卡直播切片，未上传时由客户端使用默认素材 */
  clips?: string[]
  /** 主播主动上传的直播录屏临时或云端地址 */
  recordingUrl?: string
  /** 多段直播录屏地址，第一段作为主录屏 */
  recordingClips?: string[]
  /** 多段直播录屏对应的产品/切片标题 */
  recordingTitles?: string[]
  /** 加入的主播群名称 */
  groupName?: string
  /** 主播群副标题 */
  groupDescription?: string
}

/** 当前登录用户信息 */
export interface UserProfile {
  id: string
  role: UserRole
  /** 昵称 */
  nickname: string
  /** 头像 */
  avatar: string
  /** 手机号（脱敏展示） */
  phone: string
  /** 是否已实名认证 */
  verified: boolean
  /** 简历，未填写时为 null */
  resume: Resume | null
  /** 企业端当前读取的主模卡，未创建时为 null */
  anchorCard: AnchorCard | null
  /** 主播名下全部模卡，仅主播身份会返回 */
  anchorCards?: AnchorCard[]
  /** 是否至少创建了一张完整模卡 */
  cardCompleted: boolean
}

/** 企业端检索到的公开主播资料，不包含手机号等私有账户字段。 */
export interface TalentProfile {
  id: string
  nickname: string
  avatar: string
  verified: boolean
  activeLabel: string
  anchorCard: AnchorCard
}
