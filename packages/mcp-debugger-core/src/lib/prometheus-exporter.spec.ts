import {
  PrometheusExporter,
  initializeDebuggerMetrics,
} from './prometheus-exporter';

describe('PrometheusExporter', () => {
  let exporter: PrometheusExporter;

  beforeEach(() => {
    exporter = new PrometheusExporter();
  });

  describe('counter metrics', () => {
    it('should register and increment counter', () => {
      exporter.registerCounter('test_counter', 'Test counter');
      exporter.incrementCounter('test_counter');
      exporter.incrementCounter('test_counter', 5);

      const metrics = exporter.getMetrics();
      const metric = metrics.get('test_counter');

      expect(metric).toBeDefined();
      expect(metric?.value).toBe(6);
      expect(metric?.type).toBe('counter');
    });

    it('should handle counters with labels', () => {
      exporter.incrementCounter('test_counter', 1, {
        method: 'GET',
        status: '200',
      });
      exporter.incrementCounter('test_counter', 2, {
        method: 'POST',
        status: '201',
      });

      const metrics = exporter.getMetrics();
      expect(metrics.size).toBe(2);
    });
  });

  describe('gauge metrics', () => {
    it('should register and set gauge', () => {
      exporter.registerGauge('test_gauge', 'Test gauge');
      exporter.setGauge('test_gauge', 42);

      const metrics = exporter.getMetrics();
      const metric = metrics.get('test_gauge');

      expect(metric).toBeDefined();
      expect(metric?.value).toBe(42);
      expect(metric?.type).toBe('gauge');
    });

    it('should increment and decrement gauge', () => {
      exporter.registerGauge('test_gauge', 'Test gauge');
      exporter.incrementGauge('test_gauge', 10);
      exporter.incrementGauge('test_gauge', 5);
      exporter.decrementGauge('test_gauge', 3);

      const metrics = exporter.getMetrics();
      const metric = metrics.get('test_gauge');

      expect(metric?.value).toBe(12);
    });
  });

  describe('export', () => {
    it('should export metrics in Prometheus format', () => {
      exporter.registerCounter('http_requests_total', 'Total HTTP requests');
      exporter.incrementCounter('http_requests_total', 100);

      exporter.registerGauge('active_connections', 'Active connections');
      exporter.setGauge('active_connections', 42);

      const output = exporter.export();

      expect(output).toContain(
        '# HELP http_requests_total Total HTTP requests',
      );
      expect(output).toContain('# TYPE http_requests_total counter');
      expect(output).toContain('http_requests_total 100');

      expect(output).toContain('# HELP active_connections Active connections');
      expect(output).toContain('# TYPE active_connections gauge');
      expect(output).toContain('active_connections 42');
    });

    it('should export metrics with labels', () => {
      exporter.incrementCounter('http_requests_total', 10, {
        method: 'GET',
        status: '200',
      });

      const output = exporter.export();

      expect(output).toContain(
        'http_requests_total{method="GET",status="200"} 10',
      );
    });

    it('should group metrics by name', () => {
      exporter.registerCounter('requests', 'Total requests');
      exporter.incrementCounter('requests', 10, { method: 'GET' });
      exporter.incrementCounter('requests', 20, { method: 'POST' });

      const output = exporter.export();

      // Should have only one HELP and TYPE line
      const helpLines = output.match(/# HELP requests/g);
      const typeLines = output.match(/# TYPE requests/g);

      expect(helpLines?.length).toBe(1);
      expect(typeLines?.length).toBe(1);

      // Should have two value lines
      expect(output).toContain('requests{method="GET"} 10');
      expect(output).toContain('requests{method="POST"} 20');
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      exporter.registerCounter('test_counter', 'Test counter');
      exporter.incrementCounter('test_counter', 10);

      exporter.reset();

      const metrics = exporter.getMetrics();
      expect(metrics.size).toBe(0);
    });
  });

  describe('removeMetric', () => {
    it('should remove a specific metric', () => {
      exporter.registerCounter('test_counter', 'Test counter');
      exporter.incrementCounter('test_counter', 10);

      exporter.removeMetric('test_counter');

      const metrics = exporter.getMetrics();
      expect(metrics.has('test_counter')).toBe(false);
    });

    it('should remove metric with specific labels', () => {
      exporter.incrementCounter('requests', 10, { method: 'GET' });
      exporter.incrementCounter('requests', 20, { method: 'POST' });

      exporter.removeMetric('requests', { method: 'GET' });

      const metrics = exporter.getMetrics();
      expect(metrics.size).toBe(1);
    });
  });
});

describe('initializeDebuggerMetrics', () => {
  it('should initialize standard debugger metrics', () => {
    const exporter = new PrometheusExporter();
    initializeDebuggerMetrics(exporter);

    const metrics = exporter.getMetrics();

    expect(metrics.has('debugger_sessions_total')).toBe(true);
    expect(metrics.has('debugger_sessions_active')).toBe(true);
    expect(metrics.has('debugger_breakpoints_set_total')).toBe(true);
    expect(metrics.has('debugger_operations_total')).toBe(true);
  });
});
