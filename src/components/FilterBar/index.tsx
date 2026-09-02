/**
 * 筛选栏组件
 *
 * 对应通告列表页顶部的筛选区：三个下拉筛选（用工性质 / 城市 / 品类）+ 一行排序 tab（推荐/附近/最新）。
 * 组件为「受控组件」：自身不持有筛选结果，只把用户的选择通过 onChange 抛给页面，
 * 由页面统一维护 filter 状态并触发数据请求。这样筛选逻辑单一来源，避免组件与页面状态双写不一致。
 *
 * 下拉面板用组件内部 state 管理「当前展开的是哪一列」，属于纯 UI 态，不外泄。
 */

import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import type { JobType, NoticeCategory, NoticeSort, NoticeFilter } from '@/types'
import {
  JOB_TYPE_OPTIONS,
  CITY_OPTIONS,
  CATEGORY_OPTIONS,
  SORT_OPTIONS,
} from '@/constants'
import './index.scss'

/** 组件入参 */
interface FilterBarProps {
  /** 当前筛选条件（受控），由页面传入 */
  filter: NoticeFilter
  /** 任一筛选项变化时回调，抛出「变化的字段」增量，由页面合并 */
  onChange: (patch: Partial<NoticeFilter>) => void
}

/** 下拉列标识。null 表示当前没有展开任何下拉 */
type DropdownKey = 'jobType' | 'city' | 'category' | null

/**
 * 筛选栏。
 *
 * 交互：点击某个下拉标题 → 展开对应面板；再次点击或选中某项 → 收起。
 * 城市选项里的「不限」在选中时转换为 undefined，与 NoticeFilter 可选字段语义对齐。
 */
export default function FilterBar({ filter, onChange }: FilterBarProps) {
  // 当前展开的下拉列；同一时刻只允许展开一个，避免面板叠加遮挡
  const [openKey, setOpenKey] = useState<DropdownKey>(null)

  /** 切换下拉展开/收起：点已展开的列则收起，否则切到该列 */
  const toggle = (key: DropdownKey) => {
    setOpenKey((prev) => (prev === key ? null : key))
  }

  /** 选中某项后统一收起面板，减少一次手动点击 */
  const close = () => setOpenKey(null)

  // —— 各下拉当前选中项的展示文案 —— //
  // 用工性质：value 相等即命中（undefined 对应「兼/全」）
  const jobTypeLabel =
    JOB_TYPE_OPTIONS.find((o) => o.value === filter.jobType)?.label ?? '兼/全'
  // 城市：filter.city 为空时展示「城市」占位
  const cityLabel = filter.city ?? '城市'
  const categoryLabel =
    CATEGORY_OPTIONS.find((o) => o.value === filter.category)?.label ?? '品类'

  /** 选中用工性质 */
  const pickJobType = (value?: JobType) => {
    onChange({ jobType: value })
    close()
  }

  /** 选中城市。「不限」→ 清空 city 字段 */
  const pickCity = (city: string) => {
    onChange({ city: city === '不限' ? undefined : city })
    close()
  }

  /** 选中品类 */
  const pickCategory = (value?: NoticeCategory) => {
    onChange({ category: value })
    close()
  }

  /** 选中排序维度 */
  const pickSort = (value: NoticeSort) => {
    onChange({ sort: value })
  }

  const currentSort = filter.sort ?? 'recommend'

  return (
    <View className="filter-bar">
      {/* 下拉筛选行 */}
      <View className="filter-bar__dropdowns">
        <View
          className={`filter-bar__dditem ${openKey === 'jobType' ? 'is-open' : ''} ${filter.jobType ? 'is-active' : ''}`}
          onClick={() => toggle('jobType')}
        >
          <Text className="filter-bar__ddlabel">{jobTypeLabel}</Text>
          <Text className="filter-bar__arrow">▾</Text>
        </View>

        <View
          className={`filter-bar__dditem ${openKey === 'city' ? 'is-open' : ''} ${filter.city ? 'is-active' : ''}`}
          onClick={() => toggle('city')}
        >
          <Text className="filter-bar__ddlabel">{cityLabel}</Text>
          <Text className="filter-bar__arrow">▾</Text>
        </View>

        <View
          className={`filter-bar__dditem ${openKey === 'category' ? 'is-open' : ''} ${filter.category ? 'is-active' : ''}`}
          onClick={() => toggle('category')}
        >
          <Text className="filter-bar__ddlabel">{categoryLabel}</Text>
          <Text className="filter-bar__arrow">▾</Text>
        </View>
      </View>

      {/* 排序 tab 行 */}
      <View className="filter-bar__sorts">
        {SORT_OPTIONS.map((opt) => (
          <Text
            key={opt.value}
            className={`filter-bar__sort ${currentSort === opt.value ? 'is-active' : ''}`}
            onClick={() => pickSort(opt.value)}
          >
            {opt.label}
          </Text>
        ))}
      </View>

      {/* 下拉展开面板：绝对定位覆盖在列表之上，点选后收起 */}
      {openKey && (
        <View className="filter-bar__panel">
          {openKey === 'jobType' &&
            JOB_TYPE_OPTIONS.map((opt) => (
              <View
                key={opt.label}
                className={`filter-bar__option ${opt.value === filter.jobType ? 'is-selected' : ''}`}
                onClick={() => pickJobType(opt.value)}
              >
                <Text>{opt.label}</Text>
              </View>
            ))}

          {openKey === 'city' &&
            CITY_OPTIONS.map((city) => {
              // 「不限」在无 city 时视为选中
              const selected =
                city === '不限' ? !filter.city : filter.city === city
              return (
                <View
                  key={city}
                  className={`filter-bar__option ${selected ? 'is-selected' : ''}`}
                  onClick={() => pickCity(city)}
                >
                  <Text>{city}</Text>
                </View>
              )
            })}

          {openKey === 'category' &&
            CATEGORY_OPTIONS.map((opt) => (
              <View
                key={opt.label}
                className={`filter-bar__option ${opt.value === filter.category ? 'is-selected' : ''}`}
                onClick={() => pickCategory(opt.value)}
              >
                <Text>{opt.label}</Text>
              </View>
            ))}
        </View>
      )}

      {/* 面板展开时的半透明遮罩：点击空白处关闭下拉 */}
      {openKey && <View className="filter-bar__mask" onClick={close} />}
    </View>
  )
}
