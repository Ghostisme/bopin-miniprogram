/**
 * 通告 mock 数据
 *
 * 离线设计预览数据，页面通过 services 层按需读取。
 * 数据尽量贴合截图：带货主播、7-15K/月、实名认证、急招等，保证 UI 还原度。
 * 后续接入真实接口时，只需替换 services 层实现，页面与本文件均无需改动。
 */

import type { Notice } from '@/types'

/**
 * 通告列表原始数据。
 *
 * 说明几个刻意的设计：
 * - 经纬度用杭州真实坐标附近的值，保证详情页地图能正常落点。
 * - distanceKm 预先算好，避免离线预览时依赖定位权限。
 * - salary.display 与 min/max 同时给出：展示直接用 display，排序/筛选用 min/max。
 */
export const MOCK_NOTICES: Notice[] = [
  {
    id: 'n_1001',
    title: '带货主播',
    jobType: 'full-time',
    category: 'live-commerce',
    salary: { min: 7000, max: 15000, unit: 'month', display: '7-15K/月' },
    city: '杭州',
    address: '浙江省杭州市余杭区文一西路969号淘宝城',
    distanceKm: 1.2,
    longitude: 120.026208,
    latitude: 30.279135,
    duties: [
      '负责直播间女装带货，把控直播节奏与讲解',
      '配合运营完成选品、脚本演练与直播复盘',
      '维护直播间氛围，提升停留与转化',
    ],
    requirements: [
      '女，18-30岁，形象气质佳',
      '有半年以上带货直播经验，女装类目优先',
      '表达流畅，抗压能力强，可接受晚班',
    ],
    tags: ['实名认证', '底薪+提成', '包吃住', '新手可带'],
    publisher: {
      id: 'p_2001',
      name: '杭州星耀文化传媒有限公司',
      avatar: '',
      verification: { realName: true, enterprise: true },
    },
    urgent: true,
    publishedAt: Date.now() - 1000 * 60 * 30,
    viewCount: 328,
  },
  {
    id: 'n_1002',
    title: '娱乐主播',
    jobType: 'part-time',
    category: 'entertainment',
    salary: { min: 300, max: 500, unit: 'session', display: '300-500/场' },
    city: '上海',
    address: '上海市静安区南京西路1266号恒隆广场',
    distanceKm: 3.6,
    longitude: 121.44462,
    latitude: 31.223,
    duties: [
      '在平台进行才艺 / 聊天直播，与粉丝互动',
      '完成每日有效开播时长，配合公会活动冲榜',
    ],
    requirements: [
      '男女不限，声音条件好或有才艺者优先',
      '每天可稳定开播 3 小时以上',
      '有直播经验优先，新人有专人带',
    ],
    tags: ['日结', '时间自由', '可远程', '新手可做'],
    publisher: {
      id: 'p_2002',
      name: '上海耀阳网络科技有限公司',
      avatar: '',
      verification: { realName: true, enterprise: false },
    },
    urgent: true,
    publishedAt: Date.now() - 1000 * 60 * 60 * 2,
    viewCount: 156,
  },
  {
    id: 'n_1003',
    title: '游戏主播',
    jobType: 'part-time',
    category: 'game',
    salary: { min: 200, max: 400, unit: 'day', display: '200-400/天' },
    city: '成都',
    address: '四川省成都市高新区天府三街199号',
    distanceKm: 5.8,
    longitude: 104.06476,
    latitude: 30.5702,
    duties: [
      '直播热门手游 / 端游，输出游戏内容与解说',
      '配合完成赛事陪玩、连麦 PK 等活动',
    ],
    requirements: [
      '游戏技术过硬，热门游戏段位靠前',
      '声音有辨识度，会活跃气氛',
      '每天可开播 4 小时以上',
    ],
    tags: ['日结', '包宿', '设备补贴'],
    publisher: {
      id: 'p_2003',
      name: '成都锋游文化传播有限公司',
      avatar: '',
      verification: { realName: true, enterprise: true },
    },
    urgent: false,
    publishedAt: Date.now() - 1000 * 60 * 60 * 6,
    viewCount: 89,
  },
  {
    id: 'n_1004',
    title: '户外主播',
    jobType: 'full-time',
    category: 'outdoor',
    salary: { min: 8000, max: 20000, unit: 'month', display: '8-20K/月' },
    city: '广州',
    address: '广东省广州市天河区珠江新城华夏路10号',
    distanceKm: 8.3,
    longitude: 113.32446,
    latitude: 23.11846,
    duties: [
      '进行户外探店 / 旅拍 / 城市漫游类直播',
      '策划户外直播选题，把控直播安全与节奏',
    ],
    requirements: [
      '18-35岁，能适应户外长时间直播',
      '性格外向，应变能力强',
      '有户外或探店直播经验优先',
    ],
    tags: ['实名认证', '底薪+提成', '交通补贴'],
    publisher: {
      id: 'p_2004',
      name: '广州漫游文化传媒有限公司',
      avatar: '',
      verification: { realName: true, enterprise: true },
    },
    urgent: false,
    publishedAt: Date.now() - 1000 * 60 * 60 * 12,
    viewCount: 204,
  },
  {
    id: 'n_1005',
    title: '聊天主播',
    jobType: 'part-time',
    category: 'talk',
    salary: { min: 150, max: 300, unit: 'session', display: '150-300/场' },
    city: '武汉',
    address: '湖北省武汉市江汉区解放大道688号',
    distanceKm: 12.5,
    longitude: 114.27, latitude: 30.58,
    duties: [
      '语音 / 视频陪聊，倾听并陪伴用户',
      '维护老用户关系，提升复购与在线时长',
    ],
    requirements: [
      '女，声音甜美有亲和力',
      '善于沟通，情绪稳定',
      '每天可在线 3 小时以上',
    ],
    tags: ['日结', '时间自由', '可远程', '新手可做'],
    publisher: {
      id: 'p_2005',
      name: '武汉暖音网络科技有限公司',
      avatar: '',
      verification: { realName: false, enterprise: false },
    },
    urgent: false,
    publishedAt: Date.now() - 1000 * 60 * 60 * 24,
    viewCount: 67,
  },
  {
    id: 'n_1006',
    title: '带货主播',
    jobType: 'full-time',
    category: 'live-commerce',
    salary: { min: 10000, max: 30000, unit: 'month', display: '10-30K/月' },
    city: '深圳',
    address: '广东省深圳市南山区科技园高新南一道',
    distanceKm: 15.1,
    longitude: 113.9536, latitude: 22.5395,
    duties: [
      '负责美妆 / 护肤类目直播带货',
      '主导直播间控场、逼单与粉丝转化',
    ],
    requirements: [
      '女，20-32岁，形象好、镜头感强',
      '一年以上美妆带货经验，有稳定成交数据',
      '能承受高强度直播',
    ],
    tags: ['实名认证', '高提成', '五险一金', '包住'],
    publisher: {
      id: 'p_2006',
      name: '深圳美创直播基地',
      avatar: '',
      verification: { realName: true, enterprise: true },
    },
    urgent: true,
    publishedAt: Date.now() - 1000 * 60 * 15,
    viewCount: 412,
  },
]
