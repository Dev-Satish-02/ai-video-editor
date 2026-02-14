"use client";

import { useEffect, useState } from "react";
import { initWebGPU, WebGPUState } from "@/lib/webgpu/init";

export function WebGPUTest() {
  const [state, setState] = useState<WebGPUState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    initWebGPU()
      .then((result) => {
        if (mounted) {
          setState(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setState({
            supported: false,
            reason: err?.message ?? "Unknown error",
          });
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <p className="text-gray-400">Checking WebGPU support…</p>;
  }

  if (!state) {
    return <p className="text-red-500">Unexpected state</p>;
  }

  if (!state.supported) {
    return (
      <div className="text-red-500">
        <p>WebGPU not available</p>
        <p className="text-sm opacity-80">{state.reason}</p>
      </div>
    );
  }

  return (
    <div className="text-green-400">
      <p>WebGPU is available</p>
      <p className="text-sm opacity-80">
        Adapter vendor: {state.adapter.info.vendor}
      </p>
      <p className="text-sm opacity-80">
        Architecture: {state.adapter.info.architecture}
      </p>
      <p className="text-sm opacity-80">
        Fallback: {state.adapter.info.isFallbackAdapter ? "Yes" : "No"}
      </p>
    </div>
  );
}
