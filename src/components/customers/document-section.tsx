"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  uploadCustomerDocument,
  getDocumentSignedUrl,
} from "@/app/customers/[customerId]/actions";
import { formatDateTime } from "@/lib/format";
import { DOC_TYPE_LABEL } from "@/lib/customer-documents";

const DOC_TYPE_OPTIONS = ["CONTRACT", "HANDOVER", "OTHER"] as const;

type DocumentRow = {
  id: string;
  docType: string;
  finalFileUrl: string | null;
  createdAt: string;
};

export function DocumentSection({
  customerId,
  documents,
}: {
  customerId: string;
  documents: DocumentRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [docType, setDocType] = useState<string>("CONTRACT");

  const registeredTypes = new Set(
    documents.filter((d) => d.finalFileUrl).map((d) => d.docType),
  );

  function handleView(documentId: string) {
    setViewingId(documentId);
    startTransition(async () => {
      const url = await getDocumentSignedUrl(documentId);
      setViewingId(null);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else setError("파일을 불러오지 못했습니다.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>문서 (계약서 / 인수증)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          className="flex flex-col gap-3"
          action={(formData: FormData) => {
            setError(null);
            formData.set("customerId", customerId);
            startTransition(async () => {
              try {
                await uploadCustomerDocument(formData);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "등록에 실패했습니다.",
                );
              }
            });
          }}
        >
          <RadioGroup
            name="docType"
            value={docType}
            onValueChange={(value) => setDocType(String(value))}
            className="flex flex-row flex-wrap gap-5"
          >
            {DOC_TYPE_OPTIONS.map((type) => (
              <div key={type} className="flex items-center gap-1.5">
                <RadioGroupItem id={`docType-${type}`} value={type} />
                <Label htmlFor={`docType-${type}`} className="font-normal">
                  {DOC_TYPE_LABEL[type]}
                </Label>
                {registeredTypes.has(type) && (
                  <Badge variant="secondary">등록완료</Badge>
                )}
              </div>
            ))}
          </RadioGroup>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="file"
              name="file"
              accept="application/pdf,.pdf"
              required
              className="max-w-56"
            />
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "처리 중..." : "등록"}
            </Button>
          </div>
        </form>
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col gap-2">
          {documents.length === 0 && (
            <p className="text-sm text-muted-foreground">
              등록된 문서가 없습니다.
            </p>
          )}
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">
                  {DOC_TYPE_LABEL[doc.docType] ?? doc.docType}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(doc.createdAt)}
                </p>
              </div>
              {doc.finalFileUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={viewingId === doc.id}
                  onClick={() => handleView(doc.id)}
                >
                  {viewingId === doc.id ? "불러오는 중..." : "보기"}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
