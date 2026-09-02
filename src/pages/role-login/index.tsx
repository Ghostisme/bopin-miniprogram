import { useState } from 'react'
import { Input, Text, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import type { UserRole } from '@/types'
import { loginAs } from '@/services'
import { setActiveRole } from '@/utils/storage'
import './index.scss'

const ROLE_COPY: Record<UserRole, { label: string; title: string; description: string; placeholder: string }> = {
  anchor: { label: '主播端', title: '找到适合你的直播机会', description: '完善模卡，浏览岗位，和企业直接沟通。', placeholder: '请输入主播手机号' },
  merchant: { label: '企业端', title: '招到合适的主播', description: '发布通告，筛选主播，管理招聘进度。', placeholder: '请输入企业招聘手机号' },
}

export default function RoleLoginPage() {
  const router = useRouter()
  const initialRole: UserRole = router.params.role === 'merchant' ? 'merchant' : 'anchor'
  const [role, setRole] = useState<UserRole>(initialRole)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const copy = ROLE_COPY[role]

  const submit = async (demo = false) => {
    if (!demo && phone.trim().length < 6) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    if (loading) return
    setLoading(true)
    try {
      const session = await loginAs(role, phone, demo)
      setActiveRole(role)
      Taro.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        if (role === 'merchant') Taro.redirectTo({ url: '/pages/my-notices/index' })
        else Taro.switchTab({ url: '/pages/notice/index' })
      }, 350)
      return session
    } catch {
      // request 层负责展示服务端错误
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="role-login-page">
      <View className="role-login-page__brand">播聘</View>
      <View className="role-login-page__eyebrow">独立身份登录</View>
      <Text className="role-login-page__title">{copy.title}</Text>
      <Text className="role-login-page__description">{copy.description}</Text>

      <View className="role-login-page__role-tabs">
        {(Object.keys(ROLE_COPY) as UserRole[]).map((item) => (
          <View key={item} className={`role-login-page__role-tab ${role === item ? 'is-active' : ''}`} onClick={() => setRole(item)}>
            <Text>{ROLE_COPY[item].label}</Text>
            <Text>{item === 'anchor' ? '求职 / 接单' : '招聘 / 发单'}</Text>
          </View>
        ))}
      </View>

      <View className="role-login-page__form">
        <Text className="role-login-page__label">{role === 'merchant' ? '企业招聘手机号' : '手机号'}</Text>
        <Input className="role-login-page__input" type="number" maxlength={11} placeholder={copy.placeholder} value={phone} onInput={(event) => setPhone(event.detail.value)} />
        <View className={`role-login-page__submit ${loading ? 'is-disabled' : ''}`} onClick={() => submit(false)}>{loading ? '登录中…' : `登录${copy.label}`}</View>
        <View className="role-login-page__demo" onClick={() => submit(true)}>使用演示账号进入</View>
      </View>

      <Text className="role-login-page__footnote">两种身份分别保存登录状态、资料和业务记录，可随时切换。</Text>
    </View>
  )
}
