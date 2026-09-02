/**
 * services 统一出口
 *
 * 页面按需从 '@/services' 导入各业务方法，无需感知内部文件拆分。
 * 后续新增业务模块（如收藏、投递记录）只在此处补一行 re-export 即可。
 */

export * from './notice'
export * from './message'
export * from './user'
export * from './platform'
