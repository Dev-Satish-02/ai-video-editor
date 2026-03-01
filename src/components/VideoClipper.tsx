"use client"

import { useEffect, useRef, useState } from "react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile, toBlobURL } from "@ffmpeg/util"
import { Button } from "@/components/ui/button"
import { Scissors, Download, Loader2 } from "lucide-react"

type OutputSegment = { name: string; blob: Blob; url: string }

export function VideoClipper() {
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [splitDuration, setSplitDuration] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<string>("")
  const [outputSegments, setOutputSegments] = useState<OutputSegment[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadFFmpeg = async () => {
    if (ffmpegRef.current?.loaded) return

    setStatus("Loading FFmpeg (~31 MB)...")
    const ffmpeg = new FFmpeg()
    ffmpegRef.current = ffmpeg

    ffmpeg.on("log", ({ message }) => setStatus(message))

    const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd"
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    })
    setStatus("FFmpeg ready")
  }

  const handleSplit = async () => {
    if (!videoFile) {
      setError("Please select a video file first")
      return
    }

    setError(null)
    setOutputSegments([])
    setIsProcessing(true)
    setStatus("Initializing...")

    try {
      await loadFFmpeg()
      const ffmpeg = ffmpegRef.current!
      setStatus("Writing video to virtual filesystem...")
      await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile))

      setStatus(`Splitting into ${splitDuration}s segments...`)
      await ffmpeg.exec([
        "-i",
        "input.mp4",
        "-f",
        "segment",
        "-segment_time",
        String(splitDuration),
        "-g",
        "30",
        "-sc_threshold",
        "0",
        "-force_key_frames",
        "expr:gte(t,n_forced*3)",
        "-reset_timestamps",
        "1",
        "-map",
        "0",
        "output_%d.mp4",
      ])

      setStatus("Reading output segments...")
      const entries = await ffmpeg.listDir("/")
      const segmentNames = entries
        .filter((e) => e.name.startsWith("output_") && e.name.endsWith(".mp4"))
        .map((e) => e.name)
        .sort(
          (a, b) =>
            parseInt(a.replace(/\D/g, ""), 10) -
            parseInt(b.replace(/\D/g, ""), 10)
        )

      const segments: OutputSegment[] = []
      for (const name of segmentNames) {
        const data = (await ffmpeg.readFile(name)) as Uint8Array
        const blob = new Blob([new Uint8Array(data)], { type: "video/mp4" })
        segments.push({
          name,
          blob,
          url: URL.createObjectURL(blob),
        })
      }

      await ffmpeg.deleteFile("input.mp4")
      for (const name of segmentNames) {
        await ffmpeg.deleteFile(name)
      }

      setOutputSegments(segments)
      setStatus(
        segments.length > 0
          ? `Done! Created ${segments.length} segment(s)`
          : "No segments created"
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Split failed")
      setStatus("")
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    return () => {
      outputSegments.forEach((s) => URL.revokeObjectURL(s.url))
    }
  }, [outputSegments])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.includes("video") && !file.name.endsWith(".mp4")) {
        setError("Please select an MP4 video file")
        return
      }
      setVideoFile(file)
      setError(null)
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setError(null)
        }}
      >
        <span className="flex items-center gap-2">
          <Scissors className="size-4" />
          Video Clipper
        </span>
        <span className="text-zinc-500">{isOpen ? "▲" : "▼"}</span>
      </Button>

      {isOpen && (
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Select video (MP4)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,.mp4,video/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:rounded file:border-0 file:bg-zinc-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-600"
            />
            {videoFile && (
              <p className="mt-1 text-xs text-zinc-500">{videoFile.name}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Split duration: {splitDuration}s per segment
            </label>
            <input
              type="range"
              min="1"
              max="60"
              step="1"
              value={splitDuration}
              onChange={(e) => setSplitDuration(+e.target.value)}
              className="w-full accent-zinc-500"
            />
            <div className="mt-1 flex justify-between text-xs text-zinc-500">
              <span>1s</span>
              <span>60s</span>
            </div>
          </div>

          <Button
            onClick={handleSplit}
            disabled={!videoFile || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Scissors className="size-4" />
                Split Video
              </>
            )}
          </Button>

          {status && (
            <p className="text-sm text-zinc-400">{status}</p>
          )}
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {outputSegments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-300">
                Output segments ({outputSegments.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {outputSegments.map((seg, i) => (
                  <a
                    key={seg.name}
                    href={seg.url}
                    download={seg.name}
                    className="inline-flex items-center gap-1 rounded-md bg-zinc-700 px-3 py-2 text-sm text-white hover:bg-zinc-600"
                  >
                    <Download className="size-4" />
                    {seg.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
