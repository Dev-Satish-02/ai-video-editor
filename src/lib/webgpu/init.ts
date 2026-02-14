export type WebGPUState =
  | { supported: false; reason: string }
  | {
      supported: true
      adapter: GPUAdapter
      device: GPUDevice
    }

export async function initWebGPU(): Promise<WebGPUState> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) {
    return {
      supported: false,
      reason: "WebGPU not supported in this browser",
    }
  }

  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: "high-performance",
  })

  if (!adapter) {
    return {
      supported: false,
      reason: "Failed to acquire GPU adapter",
    }
  }

  const device = await adapter.requestDevice()

  device.lost.then((info) => {
    console.error("WebGPU device lost:", info)
  })

  return {
    supported: true,
    adapter,
    device,
  }
}

