/**
 * 创建/编辑通告页面
 *
 * 功能：
 * - 创建新通告：不传 id，所有字段为空
 * - 编辑草稿：传 id，回显已保存的内容
 * - 多步骤表单：基本信息 -> 职位详情 -> 工作地址
 *
 * 对应设计稿中的"创建通告"流程
 */

import { useState, useEffect } from 'react'
import { View, Text, Input, Textarea, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import type { JobType, NoticeCategory } from '@/types'
import {
  JOB_TYPE_OPTIONS,
  CATEGORY_OPTIONS,
  CITY_OPTIONS,
} from '@/constants'
import { createNotice, fetchNoticeDetail, publishNotice, updateNotice, type NoticeWritePayload } from '@/services'
import { getStorage, setActiveRole, tokenKeyForRole } from '@/utils/storage'
import './index.scss'

/**
 * 通告表单数据结构
 */
interface NoticeFormData {
  title: string
  jobType?: JobType
  category?: NoticeCategory
  city: string
  address: string
  salaryMin: string
  salaryMax: string
  salaryUnit: 'month' | 'day' | 'session' | 'hour'
  duties: string
  requirements: string
  tags: string
}

/**
 * 编辑通告页面组件
 */
export default function EditNoticePage() {
  const router = useRouter()
  const noticeId = router.params.id // 编辑模式时传入

  const [formData, setFormData] = useState<NoticeFormData>({
    title: '',
    jobType: undefined,
    category: undefined,
    city: '',
    address: '',
    salaryMin: '',
    salaryMax: '',
    salaryUnit: 'month',
    duties: '',
    requirements: '',
    tags: '',
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setActiveRole('merchant')
    if (!getStorage<string | undefined>(tokenKeyForRole('merchant'), undefined)) Taro.redirectTo({ url: '/pages/role-login/index?role=merchant' })
  }, [])

  // 编辑模式：加载已有数据
  useEffect(() => {
    if (noticeId) {
      setLoading(true)
      fetchNoticeDetail(noticeId).then((notice) => {
        if (!notice) return
        setFormData({
          title: notice.title,
          jobType: notice.jobType,
          category: notice.category,
          city: notice.city,
          address: notice.address,
          salaryMin: String(notice.salary.min || ''),
          salaryMax: String(notice.salary.max || ''),
          salaryUnit: notice.salary.unit,
          duties: notice.duties.join('\n'),
          requirements: notice.requirements.join('\n'),
          tags: notice.tags.join(' '),
        })
      }).catch(() => Taro.showToast({ title: '通告加载失败', icon: 'none' })).finally(() => setLoading(false))
    }
  }, [noticeId])

  /**
   * 更新表单字段
   */
  const updateField = <K extends keyof NoticeFormData>(
    field: K,
    value: NoticeFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  /**
   * 城市选择器变化
   */
  const handleCityChange = (e: any) => {
    const index = e.detail.value
    updateField('city', CITY_OPTIONS[index + 1]) // +1 跳过"不限"
  }

  /**
   * 用工性质选择器变化
   */
  const handleJobTypeChange = (e: any) => {
    const index = e.detail.value
    updateField('jobType', JOB_TYPE_OPTIONS[index].value)
  }

  /**
   * 品类选择器变化
   */
  const handleCategoryChange = (e: any) => {
    const index = e.detail.value
    updateField('category', CATEGORY_OPTIONS[index].value)
  }

  /**
   * 表单验证
   */
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Taro.showToast({ title: '请填写职位名称', icon: 'none' })
      return false
    }
    if (!formData.jobType) {
      Taro.showToast({ title: '请选择用工性质', icon: 'none' })
      return false
    }
    if (!formData.category) {
      Taro.showToast({ title: '请选择主播品类', icon: 'none' })
      return false
    }
    if (!formData.city) {
      Taro.showToast({ title: '请选择工作城市', icon: 'none' })
      return false
    }
    if (!formData.salaryMin || !formData.salaryMax) {
      Taro.showToast({ title: '请填写薪资范围', icon: 'none' })
      return false
    }
    return true
  }

  /**
   * 保存为草稿
   */
  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      Taro.showToast({ title: '请至少填写职位名称', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const payload = buildPayload()
      if (noticeId) await updateNotice(noticeId, payload)
      else await createNotice(payload)
      Taro.showToast({ title: '草稿已保存', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      Taro.showToast({ title: '保存失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  /**
   * 提交审核
   */
  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const payload = buildPayload()
      const saved = noticeId ? await updateNotice(noticeId, payload) : await createNotice(payload)
      await publishNotice(saved.id)
      Taro.showToast({ title: '已提交审核', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      Taro.showToast({ title: '提交失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const buildPayload = (): NoticeWritePayload => {
    const unitLabel = formData.salaryUnit === 'month' ? '月' : formData.salaryUnit === 'day' ? '天' : formData.salaryUnit === 'session' ? '场' : '时'
    const salaryMin = Number(formData.salaryMin)
    const salaryMax = Number(formData.salaryMax)
    return {
      title: formData.title.trim(),
      jobType: formData.jobType!,
      category: formData.category!,
      city: formData.city,
      address: formData.address.trim(),
      salaryMin,
      salaryMax,
      salaryUnit: formData.salaryUnit,
      salaryDisplay: `${salaryMin}-${salaryMax}元/${unitLabel}`,
      duties: formData.duties.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      requirements: formData.requirements.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      tags: formData.tags.split(/[\s,，]+/).map((item) => item.trim()).filter(Boolean),
    }
  }

  const cityIndex = formData.city ? CITY_OPTIONS.indexOf(formData.city) - 1 : 0
  const jobTypeIndex = JOB_TYPE_OPTIONS.findIndex(opt => opt.value === formData.jobType)
  const categoryIndex = CATEGORY_OPTIONS.findIndex(opt => opt.value === formData.category)

  return (
    <View className="edit-notice-page">
      {/* 表单区域 */}
      <View className="edit-notice-page__form">
        {/* 基本信息 */}
        <View className="edit-notice-page__section">
          <Text className="edit-notice-page__section-title">基本信息</Text>

          <View className="edit-notice-page__field">
            <Text className="edit-notice-page__label">职位名称</Text>
            <Input
              className="edit-notice-page__input"
              placeholder="例如：带货主播"
              value={formData.title}
              onInput={(e) => updateField('title', e.detail.value)}
            />
          </View>

          <View className="edit-notice-page__field">
            <Text className="edit-notice-page__label">用工性质</Text>
            <Picker
              mode="selector"
              range={JOB_TYPE_OPTIONS.map(o => o.label)}
              value={jobTypeIndex}
              onChange={handleJobTypeChange}
            >
              <View className="edit-notice-page__picker">
                <Text className={formData.jobType ? '' : 'placeholder'}>
                  {formData.jobType ? JOB_TYPE_OPTIONS[jobTypeIndex].label : '请选择'}
                </Text>
              </View>
            </Picker>
          </View>

          <View className="edit-notice-page__field">
            <Text className="edit-notice-page__label">主播品类</Text>
            <Picker
              mode="selector"
              range={CATEGORY_OPTIONS.map(o => o.label)}
              value={categoryIndex}
              onChange={handleCategoryChange}
            >
              <View className="edit-notice-page__picker">
                <Text className={formData.category ? '' : 'placeholder'}>
                  {formData.category ? CATEGORY_OPTIONS[categoryIndex].label : '请选择'}
                </Text>
              </View>
            </Picker>
          </View>
        </View>

        {/* 薪资信息 */}
        <View className="edit-notice-page__section">
          <Text className="edit-notice-page__section-title">薪资待遇</Text>

          <View className="edit-notice-page__field">
            <Text className="edit-notice-page__label">薪资范围</Text>
            <View className="edit-notice-page__salary-row">
              <Input
                className="edit-notice-page__salary-input"
                type="number"
                placeholder="最低"
                value={formData.salaryMin}
                onInput={(e) => updateField('salaryMin', e.detail.value)}
              />
              <Text className="edit-notice-page__salary-sep">-</Text>
              <Input
                className="edit-notice-page__salary-input"
                type="number"
                placeholder="最高"
                value={formData.salaryMax}
                onInput={(e) => updateField('salaryMax', e.detail.value)}
              />
              <Text className="edit-notice-page__salary-unit">元/{formData.salaryUnit === 'month' ? '月' : formData.salaryUnit === 'day' ? '天' : formData.salaryUnit === 'session' ? '场' : '时'}</Text>
            </View>
          </View>
        </View>

        {/* 工作地点 */}
        <View className="edit-notice-page__section">
          <Text className="edit-notice-page__section-title">工作地点</Text>

          <View className="edit-notice-page__field">
            <Text className="edit-notice-page__label">城市</Text>
            <Picker
              mode="selector"
              range={CITY_OPTIONS.slice(1)} // 去掉"不限"
              value={cityIndex}
              onChange={handleCityChange}
            >
              <View className="edit-notice-page__picker">
                <Text className={formData.city ? '' : 'placeholder'}>
                  {formData.city || '请选择城市'}
                </Text>
              </View>
            </Picker>
          </View>

          <View className="edit-notice-page__field">
            <Text className="edit-notice-page__label">详细地址</Text>
            <Input
              className="edit-notice-page__input"
              placeholder="请输入详细地址"
              value={formData.address}
              onInput={(e) => updateField('address', e.detail.value)}
            />
          </View>
        </View>

        {/* 职位详情 */}
        <View className="edit-notice-page__section">
          <Text className="edit-notice-page__section-title">职位详情</Text>

          <View className="edit-notice-page__field">
            <Text className="edit-notice-page__label">岗位职责</Text>
            <Textarea
              className="edit-notice-page__textarea"
              placeholder="请输入岗位职责，每行一条"
              value={formData.duties}
              onInput={(e) => updateField('duties', e.detail.value)}
            />
          </View>

          <View className="edit-notice-page__field">
            <Text className="edit-notice-page__label">任职要求</Text>
            <Textarea
              className="edit-notice-page__textarea"
              placeholder="请输入任职要求，每行一条"
              value={formData.requirements}
              onInput={(e) => updateField('requirements', e.detail.value)}
            />
          </View>

          <View className="edit-notice-page__field">
            <Text className="edit-notice-page__label">福利标签</Text>
            <Input
              className="edit-notice-page__input"
              placeholder="例如：包吃住 日结 新手可做（空格分隔）"
              value={formData.tags}
              onInput={(e) => updateField('tags', e.detail.value)}
            />
          </View>
        </View>
      </View>

      {/* 底部按钮 */}
      <View className="edit-notice-page__footer">
        <View
          className="edit-notice-page__btn edit-notice-page__btn--secondary"
          onClick={handleSaveDraft}
        >
          保存草稿
        </View>
        <View
          className="edit-notice-page__btn edit-notice-page__btn--primary"
          onClick={handleSubmit}
        >
          提交审核
        </View>
      </View>
    </View>
  )
}
