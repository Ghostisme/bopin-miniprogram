/**
 * 通告详情页页面配置
 *
 * 标题固定「通告详情」。不开下拉刷新：详情由列表进入、数据随 id 一次性拉取，
 * 无高频更新需求，避免误触下拉造成重复请求。
 */
export default definePageConfig({
  navigationBarTitleText: '通告详情',
  backgroundColor: '#f5f6f8',
})
