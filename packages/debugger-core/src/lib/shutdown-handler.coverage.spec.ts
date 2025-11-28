import { GracefulShutdownHandler } from './shutdown-handler';

/**
 * Additional coverage tests for shutdown-handler.ts
 * Focus on error paths in signal handlers
 */
describe('GracefulShutdownHandler - Additional Coverage', () => {
  let handler: GracefulShutdownHandler;

  beforeEach(() => {
    handler = new GracefulShutdownHandler(5000);
  });

  describe('Signal handler error paths', () => {
    it('should handle error in SIGTERM shutdown', async () => {
      const originalOn = process.on;
      const originalExit = process.exit;
      const originalError = console.error;
      const originalLog = console.log;

      const handlers: Record<string, Function> = {};
      process.on = jest.fn((signal: string, handler: Function) => {
        handlers[signal] = handler;
        return process;
      }) as any;
      process.exit = jest.fn() as any;
      console.error = jest.fn();
      console.log = jest.fn();

      // Register a cleanup that will fail
      const failingCleanup = jest
        .fn()
        .mockRejectedValue(new Error('Cleanup failed'));
      handler.registerCleanup('failing', failingCleanup);

      try {
        handler.initialize();

        // Trigger SIGTERM handler
        const sigtermHandler = handlers['SIGTERM'];
        expect(sigtermHandler).toBeDefined();

        // Call the handler (it will call shutdown which will fail)
        sigtermHandler();

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(console.log).toHaveBeenCalledWith(
          'Received SIGTERM signal, initiating graceful shutdown...',
        );
      } finally {
        process.on = originalOn;
        process.exit = originalExit;
        console.error = originalError;
        console.log = originalLog;
      }
    });

    it('should handle error in SIGINT shutdown', async () => {
      const originalOn = process.on;
      const originalExit = process.exit;
      const originalError = console.error;
      const originalLog = console.log;

      const handlers: Record<string, Function> = {};
      process.on = jest.fn((signal: string, handler: Function) => {
        handlers[signal] = handler;
        return process;
      }) as any;
      process.exit = jest.fn() as any;
      console.error = jest.fn();
      console.log = jest.fn();

      try {
        handler.initialize();

        // Trigger SIGINT handler
        const sigintHandler = handlers['SIGINT'];
        expect(sigintHandler).toBeDefined();

        sigintHandler();

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(console.log).toHaveBeenCalledWith(
          'Received SIGINT signal, initiating graceful shutdown...',
        );
      } finally {
        process.on = originalOn;
        process.exit = originalExit;
        console.error = originalError;
        console.log = originalLog;
      }
    });

    it('should handle uncaughtException with error in shutdown', async () => {
      const originalOn = process.on;
      const originalExit = process.exit;
      const originalError = console.error;

      const handlers: Record<string, Function> = {};
      process.on = jest.fn((signal: string, handler: Function) => {
        handlers[signal] = handler;
        return process;
      }) as any;
      process.exit = jest.fn() as any;
      console.error = jest.fn();

      try {
        handler.initialize();

        // Trigger uncaughtException handler
        const exceptionHandler = handlers['uncaughtException'];
        expect(exceptionHandler).toBeDefined();

        const testError = new Error('Test exception');
        exceptionHandler(testError);

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(console.error).toHaveBeenCalledWith(
          'Uncaught exception:',
          testError,
        );
      } finally {
        process.on = originalOn;
        process.exit = originalExit;
        console.error = originalError;
      }
    });

    it('should handle unhandledRejection with error in shutdown', async () => {
      const originalOn = process.on;
      const originalExit = process.exit;
      const originalError = console.error;

      const handlers: Record<string, Function> = {};
      process.on = jest.fn((signal: string, handler: Function) => {
        handlers[signal] = handler;
        return process;
      }) as any;
      process.exit = jest.fn() as any;
      console.error = jest.fn();

      try {
        handler.initialize();

        // Trigger unhandledRejection handler
        const rejectionHandler = handlers['unhandledRejection'];
        expect(rejectionHandler).toBeDefined();

        const testReason = 'Test rejection reason';
        const testPromise = Promise.resolve(); // Use resolved promise to avoid actual rejection
        rejectionHandler(testReason, testPromise);

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(console.error).toHaveBeenCalledWith(
          'Unhandled promise rejection:',
          testReason,
        );
      } finally {
        process.on = originalOn;
        process.exit = originalExit;
        console.error = originalError;
      }
    });

    it('should handle shutdown error in uncaughtException handler', async () => {
      const originalOn = process.on;
      const originalExit = process.exit;
      const originalError = console.error;

      const handlers: Record<string, Function> = {};
      process.on = jest.fn((signal: string, handler: Function) => {
        handlers[signal] = handler;
        return process;
      }) as any;
      process.exit = jest.fn() as any;
      console.error = jest.fn();

      // Register a cleanup that will cause shutdown to fail
      const failingCleanup = jest
        .fn()
        .mockRejectedValue(new Error('Cleanup failed'));
      handler.registerCleanup('failing', failingCleanup);

      try {
        handler.initialize();

        const exceptionHandler = handlers['uncaughtException'];
        const testError = new Error('Test exception');
        exceptionHandler(testError);

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(console.error).toHaveBeenCalledWith(
          'Uncaught exception:',
          testError,
        );
      } finally {
        process.on = originalOn;
        process.exit = originalExit;
        console.error = originalError;
      }
    });

    it('should handle shutdown error in unhandledRejection handler', async () => {
      const originalOn = process.on;
      const originalExit = process.exit;
      const originalError = console.error;

      const handlers: Record<string, Function> = {};
      process.on = jest.fn((signal: string, handler: Function) => {
        handlers[signal] = handler;
        return process;
      }) as any;
      process.exit = jest.fn() as any;
      console.error = jest.fn();

      // Register a cleanup that will cause shutdown to fail
      const failingCleanup = jest
        .fn()
        .mockRejectedValue(new Error('Cleanup failed'));
      handler.registerCleanup('failing', failingCleanup);

      try {
        handler.initialize();

        const rejectionHandler = handlers['unhandledRejection'];
        const testReason = 'Test rejection';
        const testPromise = Promise.resolve(); // Use resolved promise to avoid actual rejection
        rejectionHandler(testReason, testPromise);

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(console.error).toHaveBeenCalledWith(
          'Unhandled promise rejection:',
          testReason,
        );
      } finally {
        process.on = originalOn;
        process.exit = originalExit;
        console.error = originalError;
      }
    });
  });

  describe('Shutdown error handling', () => {
    it('should handle error during shutdown and exit with code 1', async () => {
      const originalExit = process.exit;
      const originalError = console.error;

      process.exit = jest.fn() as any;
      console.error = jest.fn();

      // Create a cleanup that throws during execution
      const throwingCleanup = jest.fn().mockImplementation(async () => {
        throw new Error('Cleanup threw error');
      });

      handler.registerCleanup('throwing', throwingCleanup);

      try {
        await handler.shutdown();

        // Should still complete and exit
        expect(process.exit).toHaveBeenCalled();
      } finally {
        process.exit = originalExit;
        console.error = originalError;
      }
    });

    it('should log all cleanup steps', async () => {
      const originalExit = process.exit;
      const originalLog = console.log;

      process.exit = jest.fn() as any;
      console.log = jest.fn();

      const cleanup1 = jest.fn().mockResolvedValue(undefined);
      const cleanup2 = jest.fn().mockResolvedValue(undefined);

      handler.registerCleanup('cleanup-1', cleanup1);
      handler.registerCleanup('cleanup-2', cleanup2);

      try {
        await handler.shutdown();

        expect(console.log).toHaveBeenCalledWith(
          'Starting cleanup operations...',
        );
        expect(console.log).toHaveBeenCalledWith(
          'Executing cleanup: cleanup-1',
        );
        expect(console.log).toHaveBeenCalledWith(
          'Cleanup completed: cleanup-1',
        );
        expect(console.log).toHaveBeenCalledWith(
          'Executing cleanup: cleanup-2',
        );
        expect(console.log).toHaveBeenCalledWith(
          'Cleanup completed: cleanup-2',
        );
        expect(console.log).toHaveBeenCalledWith(
          'All cleanup operations completed successfully',
        );
      } finally {
        process.exit = originalExit;
        console.log = originalLog;
      }
    });

    it('should handle multiple cleanup failures', async () => {
      const originalExit = process.exit;
      const originalError = console.error;

      process.exit = jest.fn() as any;
      console.error = jest.fn();

      const error1 = new Error('Cleanup 1 failed');
      const error2 = new Error('Cleanup 2 failed');

      const cleanup1 = jest.fn().mockRejectedValue(error1);
      const cleanup2 = jest.fn().mockRejectedValue(error2);
      const cleanup3 = jest.fn().mockResolvedValue(undefined);

      handler.registerCleanup('cleanup-1', cleanup1);
      handler.registerCleanup('cleanup-2', cleanup2);
      handler.registerCleanup('cleanup-3', cleanup3);

      try {
        await handler.shutdown();

        // All cleanups should be attempted
        expect(cleanup1).toHaveBeenCalled();
        expect(cleanup2).toHaveBeenCalled();
        expect(cleanup3).toHaveBeenCalled();

        // Errors should be logged
        expect(console.error).toHaveBeenCalledWith(
          'Cleanup failed for cleanup-1:',
          error1,
        );
        expect(console.error).toHaveBeenCalledWith(
          'Cleanup failed for cleanup-2:',
          error2,
        );
      } finally {
        process.exit = originalExit;
        console.error = originalError;
      }
    });
  });

  describe('Constructor options', () => {
    it('should use custom shutdown timeout', async () => {
      jest.useFakeTimers();

      const customHandler = new GracefulShutdownHandler(1000);
      const slowCleanup = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      });

      customHandler.registerCleanup('slow', slowCleanup);

      const originalExit = process.exit;
      const originalError = console.error;
      process.exit = jest.fn() as any;
      console.error = jest.fn();

      try {
        const shutdownPromise = customHandler.shutdown();

        // Fast-forward to trigger the 1000ms timeout
        jest.advanceTimersByTime(1000);
        await jest.runAllTimersAsync();

        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Shutdown timeout exceeded (1000ms)'),
        );
      } finally {
        process.exit = originalExit;
        console.error = originalError;
        jest.useRealTimers();
      }
    }, 10000);
  });
});
