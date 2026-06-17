import { GET as imageProxyGET } from '../image-proxy/route';

export const runtime = 'edge';

// `/api/image-proxy` 的别名，便于前端统一使用更短路径
export const GET = imageProxyGET;

