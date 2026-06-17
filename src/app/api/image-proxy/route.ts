import { NextResponse } from 'next/server';

export const runtime = 'edge';

// OrionTV 兼容接口
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
  }

  try {
    // 基础 SSRF 防护：仅允许 http/https，禁止 localhost / IP 直连（包含常见私网/保留段）
    let target: URL;
    try {
      target = new URL(imageUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      return NextResponse.json({ error: 'Unsupported protocol' }, { status: 400 });
    }

    const host = (target.hostname || '').toLowerCase();
    const isIpv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host);
    const isIpv6 = /^\[?[0-9a-f:]+\]?$/.test(host) && host.includes(':');
    const isLocalHost =
      host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local');

    // 常见私网/保留段（仅对 IPv4 直连生效；域名解析到私网无法在 Edge 侧可靠阻断）
    const isPrivateIpv4 =
      isIpv4 &&
      (host.startsWith('10.') ||
        host.startsWith('127.') ||
        host.startsWith('192.168.') ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
        host.startsWith('169.254.') ||
        host === '0.0.0.0');

    if (isLocalHost || isPrivateIpv4 || isIpv6) {
      return NextResponse.json({ error: 'Blocked host' }, { status: 400 });
    }

    // 针对不同站点设置更合理的 Referer（不少图片站点有防盗链）
    const referer =
      host.endsWith('doubanio.com') || host.endsWith('douban.com')
        ? 'https://movie.douban.com/'
        : `https://${host}/`;

    const imageResponse = await fetch(target.toString(), {
      headers: {
        Referer: referer,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: imageResponse.statusText },
        { status: imageResponse.status }
      );
    }

    const contentType = imageResponse.headers.get('content-type');

    if (!imageResponse.body) {
      return NextResponse.json(
        { error: 'Image response has no body' },
        { status: 500 }
      );
    }

    // 创建响应头
    const headers = new Headers();
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    // 设置缓存头（可选）
    // 1 天浏览器缓存 + 30 天 CDN 缓存（图片更新频率低，同时避免缓存过久导致无法刷新）
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=2592000');
    headers.set('CDN-Cache-Control', 'public, s-maxage=2592000');
    headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=2592000');

    // 直接返回图片流
    return new Response(imageResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching image' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';

export const runtime = 'edge';

// OrionTV 兼容接口
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
  }

  try {
    const imageResponse = await fetch(imageUrl, {
      headers: {
        Referer: 'https://movie.douban.com/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: imageResponse.statusText },
        { status: imageResponse.status }
      );
    }

    const contentType = imageResponse.headers.get('content-type');

    if (!imageResponse.body) {
      return NextResponse.json(
        { error: 'Image response has no body' },
        { status: 500 }
      );
    }

    // 创建响应头
    const headers = new Headers();
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    // 设置缓存头（可选）
    headers.set('Cache-Control', 'public, max-age=15720000, s-maxage=15720000'); // 缓存半年
    headers.set('CDN-Cache-Control', 'public, s-maxage=15720000');
    headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=15720000');

    // 直接返回图片流
    return new Response(imageResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching image' },
      { status: 500 }
    );
  }
}
