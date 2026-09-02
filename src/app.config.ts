export default defineAppConfig({
  pages: [
    'pages/notice/index',
    'pages/ai/index',
    'pages/message/index',
    'pages/mine/index',
    'pages/my-notices/index',
    'pages/edit-notice/index',
    'pages/chat/index',
    'pages/services/index',
    'pages/role-login/index',
  ],
  // 分包配置:详情页和个人中心相关页面分离,主包体积控制在 1.5M 以内
  subPackages: [
    {
      root: 'subpages/detail',
      pages: ['notice-detail/index'],
      name: 'detail',
    },
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '播聘',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#9a9a9a',
    selectedColor: '#e799b0',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/notice/index',
        text: '通告',
        iconPath: 'assets/tabbar/notice.png',
        selectedIconPath: 'assets/tabbar/notice-active.png',
      },
      {
        pagePath: 'pages/ai/index',
        text: 'AI盯单',
        iconPath: 'assets/tabbar/ai.png',
        selectedIconPath: 'assets/tabbar/ai-active.png',
      },
      {
        pagePath: 'pages/message/index',
        text: '消息',
        iconPath: 'assets/tabbar/message.png',
        selectedIconPath: 'assets/tabbar/message-active.png',
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tabbar/mine.png',
        selectedIconPath: 'assets/tabbar/mine-active.png',
      },
    ],
  },
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于展示附近的招聘通告',
    },
  },
})
