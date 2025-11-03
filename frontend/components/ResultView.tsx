import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Types for the expected extraction response
export interface ExtractionCategory {
  category: string;
  details: string[];
}

export interface ExtractionSummary {
  totalDataPoints: number | null;
  categoriesFound: string[];
  confidenceScore: number | null | undefined;
}

export interface ExtractionValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export interface ExtractionMetadata {
  processedAt?: string;
  transcriptLength?: number;
  extractionMethod?: string;
}

export interface ExtractionData {
  categories: ExtractionCategory[];
  summary?: ExtractionSummary;
}

export interface ExtractionResponse {
  success?: boolean;
  data?: ExtractionData;
  validation?: ExtractionValidation;
  metadata?: ExtractionMetadata;
  // Some backends may return job info when polling
  status?: string;
  processingId?: string;
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </div>
  );
}

export function ResultView({ result }: { result: ExtractionResponse }) {
  const categories = result?.data?.categories ?? [];

  if (!Array.isArray(categories) || categories.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent>
          <p className="text-sm text-slate-600">No categories to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <div className="flex gap-4 snap-x snap-mandatory pb-2">
        {categories.map((c, idx) => (
          <Card key={idx} className="min-w-[320px] max-w-sm snap-start">
            <CardHeader>
              <CardTitle className="text-base">{c.category}</CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(c.details) && c.details.length > 0 ? (
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                  {c.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">data not found</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ResultView;
