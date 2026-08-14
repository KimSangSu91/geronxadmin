"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  uploadCustomerDocument,
  getDocumentSignedUrl,
} from "@/app/customers/[customerId]/actions";
import { formatDateTime } from "@/lib/format";

const DOC_TYPE_LABEL: Record<string, string> = {
  CONTRACT: "계약서",
  HANDOVER: "인수증",
  AERIAL_VIEW: "조감도",
  OTHER: "기타",
};

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
          className="flex flex-wrap items-end gap-2"
          action={(formData: FormData) => {
            setError(null);
            formData.set("customerId", customerId);
            startTransition(async () => {
              try {
                await uploadCustomerDocument(formData);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "업로드에 실패했습니다.",
                );
              }
            });
          }}
        >
          <Select name="docType" defaultValue="CONTRACT">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CONTRACT">계약서</SelectItem>
              <SelectItem value="HANDOVER">인수증</SelectItem>
              <SelectItem value="OTHER">기타</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="file"
            name="file"
            accept="application/pdf,.pdf"
            required
            className="max-w-56"
          />
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "처리 중..." : "업로드"}
          </Button>
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
