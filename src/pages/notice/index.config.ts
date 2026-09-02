/**
 * 通告列表页页面配置
 *
 * 作为 tabBar 首页，导航栏标题固定为「通告」。
 * 开启下拉刷新：列表页用户习惯下拉拉取最新通告，与「最新」排序形成互补。
 */
export default definePageConfig({
  navigationBarTitleText: '通告',
  enablePullDownRefresh: true,
  // 下拉刷新的背景色与页面底色一致，避免露出突兀的白边
  backgroundTextStyle: 'dark',
  backgroundColor: '#f5f6f8',
})
