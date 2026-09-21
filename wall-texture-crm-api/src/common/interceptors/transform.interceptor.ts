import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ApiSuccessResponse,
  PaginationMeta,
} from '../interfaces/api-response.interface';
import { Paginated } from '../utils/pagination.util';

function isPaginated(value: unknown): value is Paginated<unknown> {
  return (
    !!value &&
    typeof value === 'object' &&
    Array.isArray((value as Paginated<unknown>).items) &&
    !!(value as Paginated<unknown>).meta
  );
}

/**
 * Wraps every controller return value in a consistent envelope:
 * { success, statusCode, message, data, meta?, timestamp }
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<T>> {
    const http = context.switchToHttp();
    const response = http.getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((result: unknown) => {
        const statusCode = response.statusCode;
        let data = result as T;
        let meta: PaginationMeta | undefined;
        let message = 'Request successful';

        if (
          result &&
          typeof result === 'object' &&
          'message' in result &&
          'data' in result
        ) {
          const shaped = result as {
            message: string;
            data: T;
            meta?: PaginationMeta;
          };
          message = shaped.message;
          data = shaped.data;
          meta = shaped.meta;
        } else if (isPaginated(result)) {
          data = result.items as T;
          meta = result.meta;
        }

        return {
          success: true,
          statusCode,
          message,
          data,
          ...(meta ? { meta } : {}),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
