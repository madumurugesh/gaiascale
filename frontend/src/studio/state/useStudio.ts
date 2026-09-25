import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchHealth, getGeoTiffDownloadUrl, getNpzDownloadUrl, runUploadInference } from '../../services/api';
import type { InferenceData, ModalityType, ViewMode } from '../../types/api';

export type Health = { state: 'checking' } | { state: 'online'; device: string } | { state: 'offline' };

export interface Run {
  id: number;
  data: InferenceData;
  finishedAt: Date;
}

export function useStudio() {
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [modality, setModalityState] = useState<ModalityType>('rgb');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [linked, setLinked] = useState(true);
  const [nearestInput, setNearestInput] = useState(true);
  const [nearestOutput, setNearestOutput] = useState(true);
  const [showDrift, setShowDrift] = useState(false);
  const [running, setRunning] = useState(false);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [driftNotice, setDriftNotice] = useState(false);
  const [health, setHealth] = useState<Health>({ state: 'checking' });
  const nextId = useRef(1);

  // Poll backend health so the status bar reflects reality.
  useEffect(() => {
    let alive = true;
    const check = () =>
      fetchHealth()
        .then((h) => alive && setHealth({ state: 'online', device: h.device }))
        .catch(() => alive && setHealth({ state: 'offline' }));
    check();
    const t = setInterval(check, 20000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const run = useCallback(async (file: File) => {
    setRunning(true);
    setRunStartedAt(performance.now());
    setError(null);
    try {
      const res = await runUploadInference(file, 'hat', false);
      if (res.status !== 'success') throw new Error('The server could not process this file.');
      const id = nextId.current++;
      setRuns((r) => [{ id, data: res.data, finishedAt: new Date() }, ...r].slice(0, 12));
      setActiveRunId(id);
      setStagedFile(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Processing failed.');
    } finally {
      setRunning(false);
      setRunStartedAt(null);
    }
  }, []);

  const runStaged = useCallback(() => {
    if (stagedFile && !running) run(stagedFile);
  }, [stagedFile, running, run]);

  const runSample = useCallback(
    async (url: string, name: string) => {
      if (running) return;
      try {
        const blob = await (await fetch(url)).blob();
        const file = new File([blob], `${name}.png`, { type: blob.type || 'image/png' });
        setStagedFile(file);
        await run(file);
      } catch {
        setError('Could not load the sample scene.');
      }
    },
    [run, running]
  );

  const active = runs.find((r) => r.id === activeRunId)?.data ?? null;

  const setModality = useCallback((m: ModalityType) => {
    setShowDrift(false);
    setModalityState(m);
  }, []);

  const toggleDrift = useCallback(() => {
    setShowDrift((v) => {
      if (!v) setDriftNotice(true);
      return !v;
    });
  }, []);

  const exportGeoTiff = useCallback(() => {
    if (active?.token) window.location.href = getGeoTiffDownloadUrl(active.token);
  }, [active]);

  const exportNpz = useCallback(() => {
    if (active?.token) window.location.href = getNpzDownloadUrl(active.token);
  }, [active]);

  const exportPng = useCallback(() => {
    if (!active) return;
    const imgs = active.images;
    const url = showDrift
      ? imgs.consistency_diff
      : {
          rgb: imgs.hr_rgb || imgs.sr_rgb,
          cir: imgs.sr_cir,
          ndvi: imgs.sr_ndvi,
          ndwi: imgs.sr_ndwi,
          uncertainty: imgs.uncertainty_heat,
        }[modality];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `GaiaScale_${showDrift ? 'DRIFT' : modality.toUpperCase()}_2.5m_${active.token}.png`;
    a.click();
  }, [active, modality, showDrift]);

  return {
    health,
    stagedFile,
    stageFile: useCallback((f: File) => {
      setStagedFile(f);
      setError(null);
    }, []),
    clearStaged: useCallback(() => setStagedFile(null), []),
    running,
    runStartedAt,
    runStaged,
    runSample,
    runs,
    active,
    activeRunId,
    selectRun: setActiveRunId,
    error,
    dismissError: useCallback(() => setError(null), []),
    modality,
    setModality,
    viewMode,
    setViewMode,
    linked,
    toggleLinked: useCallback(() => setLinked((v) => !v), []),
    nearestInput,
    toggleNearestInput: useCallback(() => setNearestInput((v) => !v), []),
    nearestOutput,
    toggleNearestOutput: useCallback(() => setNearestOutput((v) => !v), []),
    showDrift,
    toggleDrift,
    driftNotice,
    closeDriftNotice: useCallback(() => setDriftNotice(false), []),
    exportGeoTiff,
    exportNpz,
    exportPng,
  };
}

export type StudioState = ReturnType<typeof useStudio>;
