import { Context, Next } from 'koa';
import { ZodSchema, ZodError } from 'zod';

export interface Result<T = any> {
  code: number;
  message: string;
  data?: T;
}

export function Result<T = any>(data: T, message = 'success', code = 0): Result<T> {
  return { code, message, data };
}

export function errorResult(message = 'error', code = 1): Result<null> {
  return { code, message, data: null };
}

export function bindAndHandle<P = any, Q = any, B = any>(opts: {
  querySchema?: ZodSchema<Q>,
  bodySchema?: ZodSchema<B>,
  paramsSchema?: ZodSchema<P>,
  handler: (args: { query: Q; body: B; params: P; ctx: Context }) => Promise<any> | any
}) {
  return async (ctx: Context, next: Next) => {
    try {
      let query: any = ctx.request.query;
      let body: any = ctx.request.body;
      let params: any = ctx.params;
      if (opts.querySchema) query = opts.querySchema.parse(query);
      if (opts.bodySchema) body = opts.bodySchema.parse(body);
      if (opts.paramsSchema) params = opts.paramsSchema.parse(params);
      const result = await opts.handler({ query, body, params, ctx });
      ctx.body = Result(result);
    } catch (err) {
      if (err instanceof ZodError) {
        ctx.status = 400;
        ctx.body = errorResult('参数校验失败: ' + err.errors.map(e => e.message).join(','));
      } else {
        ctx.status = 500;
        ctx.body = errorResult(err instanceof Error ? err.message : '服务器错误');
      }
    }
    await next();
  };
}