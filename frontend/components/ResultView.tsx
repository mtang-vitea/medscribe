import * as React from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

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

export function ResultView({result}: { result: ExtractionResponse }) {
    const categories = result?.data?.categories ?? [];

    // Only show these categories, and enforce this display order
    const allowedOrder = [
        "Chief Complaint/Reason for Visit",
        "History of Present Illness (HPI)",
        "Current Medications",
        "Allergies",
        "Vital Signs",
        "Past Medical History",
        "Surgical History",
        "Family History",
        "Social History",
        "Review of Systems",
        "Physical Exam Findings",
        "Previous Test Results",
        "Assessment/Differential Diagnosis",
        "Diagnostic Plan",
        "Treatment Plan",
        "Patient Education",
        "Follow-up Instructions",
        "Referrals",
    ];

    const normalized: ExtractionCategory[] = Array.isArray(categories)
        ? allowedOrder.map((name) => {
            const found = categories.find((c) => c.category === name);
            return found ?? {category: name, details: []};
        })
        : allowedOrder.map((name) => ({category: name, details: []}));

    return (
        <div className="mt-6">
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                {normalized.map((c, idx) => (
                    <Card key={idx}>
                        <CardHeader>
                            <CardTitle>{c.category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {Array.isArray(c.details) && c.details.length > 0 ? (
                                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                                    {c.details.map((d, i) => (
                                        <li key={i}>{d}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-slate-500">No additional details provided</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default ResultView;
