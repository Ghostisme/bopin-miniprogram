import { useState } from 'react'
import { Input, Text, Textarea, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { fetchAiScripts, fetchServiceAccess, fetchWallet, generateAiScript, purchaseMembership, type AiScript, type ServiceAccess, type Wallet } from '@/services'
import { getStorage, setActiveRole, tokenKeyForRole } from '@/utils/storage'
import './index.scss'

export default function AIPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [access, setAccess] = useState<ServiceAccess | null>(null)
  const [scene, setScene] = useState('直播开场')
  const [product, setProduct] = useState('美妆精华')
  const [tone, setTone] = useState('专业亲和')
  const [result, setResult] = useState<AiScript | null>(null)
  const [history, setHistory] = useState<AiScript[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setActiveRole('anchor')
    if (!getStorage<string | undefined>(tokenKeyForRole('anchor'), undefined)) {
      Taro.redirectTo({ url: '/pages/role-login/index?role=anchor' })
      return
    }
    try {
      const [walletData, scripts, accessData] = await Promise.all([fetchWallet(), fetchAiScripts(), fetchServiceAccess()])
      setWallet(walletData)
      setHistory(scripts)
      setAccess(accessData.find((item) => item.featureKey === 'AI_SCRIPT') ?? null)
    } catch {
      Taro.redirectTo({ url: '/pages/role-login/index?role=anchor' })
    }
  }

  useDidShow(() => { load() })

  const handleGenerate = async () => {
    if (access?.active === false) {
      Taro.showToast({ title: 'AI 脚本服务暂未开放', icon: 'none' })
      return
    }
    if (!product.trim()) {
      Taro.showToast({ title: '请填写商品或主题', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const script = await generateAiScript(scene, product.trim(), tone)
      setResult(script)
      await load()
    } catch {
      // request 已统一给出错误提示
    } finally {
      setLoading(false)
    }
  }

  const handleMembership = async () => {
    try {
      await purchaseMembership('PRO')
      await load()
      Taro.showToast({ title: '会员权益已到账', icon: 'success' })
    } catch {
      // request 已统一给出错误提示
    }
  }

  return (
    <View className="ai-page">
      <View className="ai-page__hero">
        <Text className="ai-page__eyebrow">播聘 AI 工作台</Text>
        <Text className="ai-page__title">把直播灵感，变成可用话术</Text>
        <Text className="ai-page__desc">按你的商品、场景和表达风格生成首稿，再按自己的口吻调整。</Text>
        <View className="ai-page__quota">
        <View><Text className="ai-page__quota-value">{access?.active === false ? '关闭' : wallet?.aiQuota ?? '--'}</Text><Text>剩余 AI 次数</Text></View>
          <View><Text className="ai-page__quota-value">{wallet?.memberLevel ?? 'FREE'}</Text><Text>当前会员</Text></View>
          <View className="ai-page__upgrade" onClick={handleMembership}>补充额度</View>
        </View>
      </View>

      <View className="ai-page__panel">
        <Text className="ai-page__panel-title">生成直播话术</Text>
        <Text className="ai-page__label">直播场景</Text>
        <View className="ai-page__chips">
          {['直播开场', '卖点讲解', '催单收口'].map((item) => <Text key={item} className={`ai-page__chip ${scene === item ? 'is-active' : ''}`} onClick={() => setScene(item)}>{item}</Text>)}
        </View>
        <Text className="ai-page__label">商品或主题</Text>
        <Input className="ai-page__input" value={product} onInput={(event) => setProduct(event.detail.value)} placeholder="例如：玻尿酸精华" />
        <Text className="ai-page__label">表达风格</Text>
        <View className="ai-page__chips">
          {['专业亲和', '轻松种草', '强转化'].map((item) => <Text key={item} className={`ai-page__chip ${tone === item ? 'is-active' : ''}`} onClick={() => setTone(item)}>{item}</Text>)}
        </View>
        <View className={`ai-page__generate ${access?.active === false ? 'is-disabled' : ''}`} onClick={handleGenerate}>{access?.active === false ? '服务暂未开放' : loading ? '正在生成...' : '生成话术'}</View>
      </View>

      {result && <View className="ai-page__result"><View className="ai-page__result-head"><Text>本次生成</Text><Text>{result.scene}</Text></View><Textarea className="ai-page__result-content" value={result.content} autoHeight maxlength={-1} /></View>}

      <View className="ai-page__history">
        <Text className="ai-page__history-title">最近生成</Text>
        {history.length === 0 ? <Text className="ai-page__empty">还没有生成记录</Text> : history.slice(0, 5).map((item) => <View className="ai-page__history-item" key={item.id} onClick={() => setResult(item)}><View><Text>{item.scene} · {item.product}</Text><Text>{item.tone}</Text></View><Text>›</Text></View>)}
      </View>
    </View>
  )
}
