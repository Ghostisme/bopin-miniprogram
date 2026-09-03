/**
 * 「粘贴你的资料」弹窗组件
 *
 * 对应通告列表页的 AI 简历录入入口：用户把一段自我介绍文本粘贴进来，
 * 提交后由资料服务解析为结构化简历；离线适配器会保留原文并完成校验，
 * 解析动作交由页面通过 onSubmit 接管。
 *
 * 组件为受控弹窗：可见性（visible）与提交行为由页面控制，组件只负责内部输入态与基本校验，
 * 保证「弹窗 UI」与「业务落库」职责分离，便于后续替换真实 AI 接口。
 */

import { useState } from 'react'
import { View, Text, Textarea } from '@tarojs/components'
import type { BaseEventOrig, TextareaProps } from '@tarojs/components'
import './index.scss'

/** 组件入参 */
interface PasteResumeModalProps {
  /** 是否可见，由页面控制 */
  visible: boolean
  /** 关闭弹窗回调（点遮罩、点取消、提交成功后均触发） */
  onClose: () => void
  /**
   * 提交回调，抛出用户粘贴的原始文本，由页面调用 AI 解析 / 落库。
   * 组件已保证传出的文本非空且已 trim。
   */
  onSubmit: (rawText: string) => void
  /** 按使用场景定制文案，默认保持简历生成入口。 */
  title?: string
  description?: string
  placeholder?: string
  submitLabel?: string
  showCounter?: boolean
}

/** 粘贴文本的最小长度：过短无法解析出有效信息，前端先做兜底校验 */
const MIN_LENGTH = 10

/**
 * 粘贴资料弹窗。
 *
 * 底部弹出式（bottom sheet）交互，贴合小程序移动端习惯；
 * 输入区给出示例占位，降低用户「不知道填什么」的门槛。
 */
export default function PasteResumeModal({
  visible,
  onClose,
  onSubmit,
  title = '粘贴你的资料',
  description = '把你的自我介绍粘贴到下方，AI 会自动帮你整理成简历，商家看到更快联系你',
  placeholder = '例：小雅，25岁，杭州，3年女装带货经验，日常直播4小时，期望底薪+提成…',
  submitLabel = 'AI 智能生成简历',
  showCounter = true,
}: PasteResumeModalProps) {
  // 输入文本为组件内部态：弹窗关闭后清空，避免下次打开残留上次内容
  const [text, setText] = useState('')

  /** 受控 textarea 的输入处理 */
  const handleInput = (e: BaseEventOrig<TextareaProps.onInputEventDetail>) => {
    setText(e.detail.value)
  }

  /** 关闭前清空输入，保证每次打开都是干净状态 */
  const handleClose = () => {
    setText('')
    onClose()
  }

  /** 提交：做非空 + 最小长度校验，通过后抛给页面并关闭 */
  const handleSubmit = () => {
    const trimmed = text.trim()
    if (trimmed.length < MIN_LENGTH) {
      // 文本过短直接拦截，不打扰页面；此处不用 toast 是为保持组件无副作用，
      // 具体提示由页面在 onSubmit 前后自行决定。这里用占位态引导即可。
      return
    }
    onSubmit(trimmed)
    setText('')
  }

  // 不可见时不渲染，避免遮罩层占用点击 / 影响无障碍焦点
  if (!visible) return null

  const canSubmit = text.trim().length >= MIN_LENGTH

  return (
    <View className="paste-modal">
      {/* 遮罩：点击关闭 */}
      <View className="paste-modal__mask" onClick={handleClose} />

      {/* 底部面板 */}
      <View className="paste-modal__panel">
        <View className="paste-modal__header">
          <Text className="paste-modal__title">{title}</Text>
        </View>

        <Text className="paste-modal__desc">
          {description}
        </Text>

        <Textarea
          className="paste-modal__textarea"
          value={text}
          onInput={handleInput}
          placeholder={placeholder}
          maxlength={500}
          autoHeight={false}
        />

        {showCounter && <Text className="paste-modal__counter">{text.length}/500</Text>}

        <View
          className={`paste-modal__submit ${canSubmit ? '' : 'is-disabled'}`}
          onClick={handleSubmit}
        >
          <Text>{submitLabel}</Text>
        </View>
      </View>
    </View>
  )
}
