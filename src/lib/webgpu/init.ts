export type WebGPUState =
  | { supported: false; reason: string }
  | {
      supported: true
      adapter: GPUAdapter
      device: GPUDevice
    }

export async function initWebGPU(): Promise<WebGPUState> {
  // 1. Check browser support
  if (typeof navigator === "undefined" || !("gpu" in navigator)) {
    return {
      supported: false,
      reason: "WebGPU not supported in this browser",
    }
  }

  // 2. Request adapter
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: "high-performance",
  })

  if (!adapter) {
    return {
      supported: false,
      reason: "Failed to acquire GPU adapter",
    }
  }

  // 3. Request device
  const device = await adapter.requestDevice()

  // 4. Handle device loss (mandatory for WebGPU)
  device.lost.then((info) => {
    console.error("WebGPU device lost:", info)
  })

  return {
    supported: true,
    adapter,
    device,
  }
}

