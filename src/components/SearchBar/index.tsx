/**
 * 搜索栏组件
 *
 * 通告列表页顶部搜索入口。设计为「受控组件」：自身不持有关键词状态，
 * 由父页面通过 value 传入、onChange/onSearch 回传，便于父页统一管理筛选条件
 * （关键词只是 NoticeFilter 的一个字段，交给页面统一收口更利于联动筛选）。
 */

import { View, Input } from '@tarojs/components'
import './index.scss'

/** 组件入参 */
interface SearchBarProps {
  /** 当前关键词（受控） */
  value: string
  /** 输入变化回调，实时回传当前文本 */
  onChange: (value: string) => void
  /** 触发搜索回调（点击键盘「搜索」或右侧按钮）。不传则仅靠 onChange 实时过滤 */
  onSearch?: (value: string) => void
  /** 占位提示文案 */
  placeholder?: string
}

/**
 * 搜索栏。左侧放大镜图标 + 输入框 + 右侧搜索按钮。
 * 图标用纯 CSS 绘制（伪元素），避免额外引入图片资源。
 */
export default function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = '搜索主播岗位 / 城市 / 品类',
}: SearchBarProps) {
  return (
    <View className="search-bar">
      <View className="search-bar__box">
        {/* 放大镜图标：纯 CSS 绘制，见 scss 中的 __icon */}
        <View className="search-bar__icon" />
        <Input
          className="search-bar__input"
          value={value}
          placeholder={placeholder}
          placeholderClass="search-bar__placeholder"
          confirmType="search"
          onInput={(e) => onChange(e.detail.value)}
          // 键盘确认键触发搜索；受控组件下 value 已是最新，直接回传
          onConfirm={(e) => onSearch?.(e.detail.value)}
        />
      </View>
      <View className="search-bar__btn" onClick={() => onSearch?.(value)}>
        搜索
      </View>
    </View>
  )
}
