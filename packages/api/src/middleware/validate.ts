import type { RequestHandler } from 'express';
import type { ZodTypeAny, infer as zInfer } from 'zod';

type Source = 'body' | 'query' | 'params';

export function validate<T extends ZodTypeAny>(
  schema: T,
  source: Source = 'body',
): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    // attach the parsed (coerced/defaulted) value back
    (req as unknown as Record<Source, zInfer<T>>)[source] = result.data;
    next();
  };
}
