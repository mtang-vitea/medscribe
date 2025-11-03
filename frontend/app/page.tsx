"use client";

import { useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import ResultView, { type ExtractionResponse } from "@/components/ResultView";

export default function Page() {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ExtractionResponse | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);

  const charCount = transcript.length;
  const limit = 200_000;
  const tooLong = useMemo(() => charCount > limit, [charCount]);
  const pct = Math.min(100, Math.round((charCount / limit) * 100));

  async function pollStatusOnce(id: string) {
    const res = await fetch(`http://localhost:8000/api/transcript/status/${id}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || `Status check failed (${res.status})`);
    }
    const job = await res.json();
    setJobStatus(job?.status ?? null);
    return job;
  }

  async function waitForCompletion(id: string) {
    const start = Date.now();
    const timeoutMs = 120_000; // 2 minutes
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // poll with backoff up to 2s
    let attempt = 0;
    while (true) {
      if (Date.now() - start > timeoutMs) {
        throw new Error("Timed out waiting for processing to complete.");
      }
      const job = await pollStatusOnce(id);
      if (job?.status === "completed") {
        return job;
      }
      attempt += 1;
      const wait = Math.min(2000, 300 + attempt * 200);
      await delay(wait);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResponse(null);
    setProcessingId(null);
    setJobStatus(null);

    if (!transcript.trim()) {
      setError("Please paste a transcript.");
      return;
    }
    if (tooLong) {
      setError("Transcript is too long. Please reduce below 200k characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/transcript/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      // If backend returns a processingId, poll the status endpoint until completion
      if (data?.processingId) {
        setProcessingId(data.processingId);
        setJobStatus(data?.status ?? "started");
        const finalJob = await waitForCompletion(data.processingId);
        setResponse(finalJob);
      } else {
        setResponse(data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto">
      <section className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Process Transcript</h1>
        <p className="mt-2 text-slate-600">Paste a large transcript below and submit to extract structured clinical data.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
          <CardDescription>Large transcripts are supported. We recommend removing PHI in development.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label htmlFor="transcript">Paste transcript</Label>
              <Textarea
                id="transcript"
                placeholder="Paste transcript text here..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{charCount.toLocaleString()} / {limit.toLocaleString()} characters</span>
                  <span className={tooLong ? "text-red-600 font-medium" : "text-emerald-600"}>
                    {tooLong ? "Too long" : "Within limit"}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`${tooLong ? "bg-red-500" : "bg-indigo-600"} h-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Your text stays local in the browser until you press Submit. Ensure backend CORS allows http://localhost:3000.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading || tooLong}>
                {loading && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {loading ? "Processing" : "Submit Transcript"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setTranscript("");
                  setError(null);
                  setResponse(null);
                  setProcessingId(null);
                  setJobStatus(null);
                }}
              >
                Clear
              </Button>
            </div>
          </form>

          {Boolean(error) && (
            <Alert>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {Boolean(processingId) && (
            <div className="mt-4 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-medium">Processing ID:</span>
                <code className="bg-slate-100 px-1 py-0.5 rounded">{processingId}</code>
                <span className="ml-2">Status: <span className="font-medium">{jobStatus ?? "unknown"}</span></span>
              </div>
            </div>
          )}

          {response !== null && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-900">Response</h3>
              <ResultView result={response} />
              <details className="mt-4">
                <summary className="text-sm cursor-pointer select-none text-slate-700">Show raw JSON</summary>
                <pre className="mt-2 max-h-96 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-10 text-xs text-slate-500">
        <p>
          Note: If the backend queues work, you might see a response containing a processingId with status &quot;started&quot;. Otherwise, you may receive the extraction result directly.
        </p>
      </div>
    </main>
  );
}
