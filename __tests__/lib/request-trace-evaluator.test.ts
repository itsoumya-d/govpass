import { describe, it, expect } from '@jest/globals';
import {
  evaluateRequestTrace,
  validateTracePipeline,
  TraceEvaluationError,
  TracePipeline,
  TraceSpan,
} from '@/lib/request-trace-evaluator';

describe('Cross-Language Request Trace Evaluation Engine', () => {
  const baseSpans: TraceSpan[] = [
    {
      spanId: 'span-client-1',
      serviceName: 'browser_client',
      runtime: 'typescript',
      durationMs: 45,
      status: 'ok',
    },
    {
      spanId: 'span-gw-1',
      parentSpanId: 'span-client-1',
      serviceName: 'api_gateway',
      runtime: 'go',
      durationMs: 25,
      status: 'ok',
    },
    {
      spanId: 'span-recon-1',
      parentSpanId: 'span-gw-1',
      serviceName: 'reconciliation_service',
      runtime: 'python',
      durationMs: 120,
      status: 'ok',
    },
    {
      spanId: 'span-db-1',
      parentSpanId: 'span-recon-1',
      serviceName: 'database_store',
      runtime: 'node',
      durationMs: 60,
      status: 'ok',
    },
  ];

  const basePipeline: TracePipeline = {
    traceId: 'trace-8841',
    correlationId: 'corr-001',
    userId: 'user-452',
    spans: baseSpans,
    startTimeMs: 1000,
    endTimeMs: 1350,
  };

  it('normal case: evaluates valid cross-language trace pipeline across services', () => {
    const result = evaluateRequestTrace(basePipeline, { slaThresholdMs: 1000 });

    expect(result.isValid).toBe(true);
    expect(result.spanCount).toBe(4);
    expect(result.crossLanguageHops).toBe(3);
    expect(result.complianceAuditStatus).toBe('PASS');
    expect(result.errors).toHaveLength(0);
  });

  it('empty input: evaluates trace with empty spans returning zero duration and clean status', () => {
    const emptyPipeline: TracePipeline = {
      traceId: 'trace-empty',
      spans: [],
      startTimeMs: 0,
      endTimeMs: 0,
    };
    const result = evaluateRequestTrace(emptyPipeline);

    expect(result.isValid).toBe(true);
    expect(result.spanCount).toBe(0);
    expect(result.totalDurationMs).toBe(0);
    expect(result.complianceAuditStatus).toBe('PASS');
  });

  it('malformed input: throws TraceEvaluationError when traceId is missing or span duration is negative', () => {
    const invalidTrace = { traceId: '', spans: [] };
    expect(() => validateTracePipeline(invalidTrace)).toThrow(TraceEvaluationError);

    const negativeSpanPipeline: TracePipeline = {
      traceId: 'trace-bad-span',
      spans: [
        {
          spanId: 'span-neg',
          serviceName: 'api_gateway',
          runtime: 'go',
          durationMs: -50,
          status: 'ok',
        },
      ],
      startTimeMs: 0,
      endTimeMs: 100,
    };
    expect(() => validateTracePipeline(negativeSpanPipeline)).toThrow(TraceEvaluationError);
  });

  it('boundary value: flags SLA warning when total latency is exactly at or above threshold', () => {
    const thresholdPipeline: TracePipeline = {
      traceId: 'trace-boundary',
      spans: [
        {
          spanId: 'span-1',
          serviceName: 'api_gateway',
          runtime: 'typescript',
          durationMs: 500,
          status: 'ok',
        },
      ],
      startTimeMs: 0,
      endTimeMs: 501,
    };

    const result = evaluateRequestTrace(thresholdPipeline, { slaThresholdMs: 500 });
    expect(result.complianceAuditStatus).toBe('WARN');
  });

  it('failing dependency with clear error: captures downstream database error span and fails compliance status', () => {
    const failingPipeline: TracePipeline = {
      ...basePipeline,
      spans: [
        ...baseSpans,
        {
          spanId: 'span-db-err',
          parentSpanId: 'span-recon-1',
          serviceName: 'database_store',
          runtime: 'node',
          durationMs: 800,
          status: 'error',
          errorMessage: 'Database connection pool timeout after 800ms',
        },
      ],
    };

    const result = evaluateRequestTrace(failingPipeline);
    expect(result.complianceAuditStatus).toBe('FAIL');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Database connection pool timeout');
  });

  it('property that must always hold: span duration percentage never exceeds 100 for any single span', () => {
    const result = evaluateRequestTrace(basePipeline, { maxAllowedBottleneckPct: 10 });
    for (const bottleneck of result.bottlenecks) {
      expect(bottleneck.percentage).toBeLessThanOrEqual(100);
      expect(bottleneck.percentage).toBeGreaterThanOrEqual(0);
    }
  });
});
