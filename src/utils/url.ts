/**
 * 生成带 base 前缀的绝对路径，用于内部链接和静态资源引用。
 * 在 GitHub Pages 子路径部署（base: '/airesearch'）时尤其重要。
 *
 * 用法：
 *   import { url } from '../utils/url';
 *   <a href={url('/papers')}>...</a>
 *   <link href={url('/favicon.svg')} />
 */
export function url(path: string): string {
  // 获取 Astro 构建时注入的 base（如 '/airesearch/'，本地开发为 '/'）
  const base = import.meta.env.BASE_URL || '/';
  // 去掉 base 末尾的 '/'，去掉 path 开头的 '/'，再拼接
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  // 根路径特殊处理
  if (normalizedPath === '/') {
    return normalizedBase === '' ? '/' : normalizedBase + '/';
  }
  return normalizedBase + normalizedPath;
}
