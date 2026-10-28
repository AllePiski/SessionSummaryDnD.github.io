"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LevelMeter } from "./level-meter";
import { analyserLevel, describeMicError } from "@/lib/audio";

const DEFAULT_DEVICE = "__default__";

/** Scelta del microfono e prova del segnale prima di registrare. */
export function MicCheck({
  deviceId,
  onDeviceChange,
}: {
  deviceId: string;
  onDeviceChange: (deviceId: string) => void;
}) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const stopTest = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    analyserRef.current = null;
    setTesting(false);
  }, []);

  const startTest = useCallback(
    async (id: string) => {
      stopTest();
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: id ? { deviceId: { exact: id } } : true,
        });
        streamRef.current = stream;
        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(analyser);
        ctxRef.current = ctx;
        analyserRef.current = analyser;
        bufferRef.current = new Float32Array(analyser.fftSize);
        setTesting(true);
        const list = await navigator.mediaDevices.enumerateDevices();
        setDevices(list.filter((d) => d.kind === "audioinput" && d.deviceId));
      } catch (e) {
        setError(describeMicError(e));
      }
    },
    [stopTest],
  );

  useEffect(() => stopTest, [stopTest]);

  const getLevel = useCallback(() => {
    const analyser = analyserRef.current;
    const buffer = bufferRef.current;
    return analyser && buffer ? analyserLevel(analyser, buffer) : 0;
  }, []);

  return (
    <div className="grid gap-3">
      {devices.length > 1 && (
        <div className="grid gap-1.5">
          <Label htmlFor="mic-device">Microfono</Label>
          <Select
            value={deviceId || DEFAULT_DEVICE}
            onValueChange={(v) => {
              const next = v === DEFAULT_DEVICE ? "" : v;
              onDeviceChange(next);
              if (testing) void startTest(next);
            }}
          >
            <SelectTrigger id="mic-device" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DEFAULT_DEVICE}>Predefinito di sistema</SelectItem>
              {devices
                .filter((d) => d.deviceId !== "default")
                .map((d, i) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microfono ${i + 1}`}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => (testing ? stopTest() : void startTest(deviceId))}
        >
          {testing ? <MicOff /> : <Mic />}
          {testing ? "Ferma prova" : "Prova microfono"}
        </Button>
        <LevelMeter getLevel={getLevel} active={testing} bars={16} className="h-5" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {testing && <p className="text-xs text-muted-foreground">Parla: le barre devono muoversi.</p>}
    </div>
  );
}
