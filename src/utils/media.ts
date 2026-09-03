/** 媒体地址判断，避免把录屏视频地址交给 Image 组件。 */
const VIDEO_SOURCE = /\.(?:3gp|avi|m4v|mkv|mov|mp4|m3u8|webm)(?:$|[?#])/i

export function isVideoSource(value: unknown): value is string {
  return typeof value === 'string' && VIDEO_SOURCE.test(value)
}

export function isImageSource(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && !isVideoSource(value)
}

export function safeImageSource(value: unknown, fallback: string): string {
  return isImageSource(value) ? value : fallback
}
