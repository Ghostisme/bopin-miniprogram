export default defineAppConfig({
  pages: [
    'pages/notice/index',
    'pages/ai/index',
    'pages/message/index',
    'pages/mine/index',
  ],
  // TabBar 页面留在主包，其余低频页面拆分，避免超过微信主包 2MB 限制。
  subPackages: [
    {
      root: 'subpages/feature',
      pages: [
        'my-notices/index',
        'edit-notice/index',
        'chat/index',
        'services/index',
        'role-login/index',
        'card-builder/index',
        'card-detail/index',
        'talents/index',
        'talent-detail/index',
      ],
      name: 'feature',
    },
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
