/**
 * Cross-Language Request Trace & Pipeline Evaluation Engine.
 * Evaluates execution performance, error propagation, and cross-language hops
 * across frontend browsers, API gateways, microservices, and databases.
 */

export type ServiceRuntime = 'typescript' | 'python' | 'go' | 'node' | 'rust' | 'java';

export type ServiceKind =
  | 'browser_client'
  | 'api_gateway'
  | 'reconciliation_service'
  | 'document_service'
  | 'database_store';

export interface TraceSpan {
  spanId: string;
  parentSpanId?: string;
  serviceName: ServiceKind | string;
  runtime: ServiceRuntime;
  durationMs: number;
  status: 'ok' | 'error';
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface TracePipeline {
  traceId: string;
  correlationId?: string;
  userId?: string;
  spans: TraceSpan[];
  startTimeMs: number;
  endTimeMs: number;
}

export interface TraceEvaluationOptions {
  slaThresholdMs?: number;
  maxAllowedBottleneckPct?: number;
}

export interface ServiceBottleneck {
  serviceName: string;
  durationMs: number;
  percentage: number;
}

export interface TraceEvaluationResult {
  traceId: string;
  isValid: boolean;
  totalDurationMs: number;
  spanCount: number;
  crossLanguageHops: number;
  bottlenecks: ServiceBottleneck[];
  errors: { spanId: string; serviceName: string; message: string }[];
  complianceAuditStatus: 'PASS' | 'WARN' | 'FAIL';
  summary: string;
}

export class TraceEvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TraceEvaluationError';
  }
}

export function validateTracePipeline(pipeline: unknown): asserts pipeline is TracePipeline {
  if (!pipeline || typeof pipeline !== 'object') {
    throw new TraceEvaluationError('Trace pipeline must be a valid non-null object');
  }
  const p = pipeline as Partial<TracePipeline>;
  if (!p.traceId || typeof p.traceId !== 'string' || p.traceId.trim().length === 0) {
    throw new TraceEvaluationError('Trace pipeline must have a non-empty string traceId');
  }
  if (!Array.isArray(p.spans)) {
    throw new TraceEvaluationError('Trace pipeline must contain an array of spans');
  }
  for (const span of p.spans) {
    if (!span.spanId || typeof span.spanId !== 'string') {
      throw new TraceEvaluationError('Each span must have a valid spanId');
    }
    if (typeof span.durationMs !== 'number' || span.durationMs < 0 || isNaN(span.durationMs)) {
      throw new TraceEvaluationError(`Span ${span.spanId} must have a non-negative numeric durationMs`);
    }
  }
}

export function evaluateRequestTrace(
  pipeline: TracePipeline,
  options: TraceEvaluationOptions = {}
): TraceEvaluationResult {
  validateTracePipeline(pipeline);

  const slaThresholdMs = options.slaThresholdMs ?? 2000;
  const maxBottleneckPct = options.maxAllowedBottleneckPct ?? 50;

  const calculatedTotal = pipeline.spans.reduce((acc, s) => acc + s.durationMs, 0);
  const wallClockTotal = pipeline.endTimeMs - pipeline.startTimeMs;
  const totalDurationMs = Math.max(0, wallClockTotal > 0 ? wallClockTotal : calculatedTotal);

  const errors: { spanId: string; serviceName: string; message: string }[] = [];
  const bottlenecks: ServiceBottleneck[] = [];

  let crossLanguageHops = 0;
  let previousRuntime: ServiceRuntime | null = null;

  for (const span of pipeline.spans) {
    if (span.status === 'error' || span.errorMessage) {
      errors.push({
        spanId: span.spanId,
        serviceName: String(span.serviceName),
        message: span.errorMessage || 'Span reported error state',
      });
    }

    if (previousRuntime && span.runtime && span.runtime !== previousRuntime) {
      crossLanguageHops++;
    }
    if (span.runtime) {
      previousRuntime = span.runtime;
    }

    const pct = totalDurationMs > 0 ? (span.durationMs / totalDurationMs) * 100 : 0;
    if (pct >= maxBottleneckPct) {
      bottlenecks.push({
        serviceName: String(span.serviceName),
        durationMs: span.durationMs,
        percentage: Number(pct.toFixed(1)),
      });
    }
  }

  let complianceAuditStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
  if (errors.length > 0) {
    complianceAuditStatus = 'FAIL';
  } else if (totalDurationMs > slaThresholdMs || bottlenecks.length > 0) {
    complianceAuditStatus = 'WARN';
  }

  return {
    traceId: pipeline.traceId,
    isValid: true,
    totalDurationMs,
    spanCount: pipeline.spans.length,
    crossLanguageHops,
    bottlenecks,
    errors,
    complianceAuditStatus,
    summary:
      errors.length > 0
        ? `Trace failed with ${errors.length} error(s)`
        : `Trace passed in ${totalDurationMs}ms across ${pipeline.spans.length} span(s) (${crossLanguageHops} cross-language hop(s))`,
  };
}
