# Vitest – First-Principles Tests

* Property tests via `fast-check` for core functions.  
* Snapshot only deterministic outputs.  
* Measure gas: fail if handler > 10 ms in Miniflare micro-benchmark.  
* Mock time (`vi.useFakeTimers()`) for time-based logic.
