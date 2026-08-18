"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  bulkImportDevices,
  type DeviceImportRowError,
} from "@/app/devices/actions";

export function DeviceBulkImportDialog() {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errors, setErrors] = useState<DeviceImportRowError[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function resetState() {
    setFileName(null);
    setErrors(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetState();
  }

  function handleSubmit(formData: FormData) {
    setErrors(null);
    startTransition(async () => {
      let result;
      try {
        result = await bulkImportDevices(formData);
      } catch (e) {
        // 요청 크기 초과 등 서버 액션 자체가 실패한 경우까지 화면에서 알 수 있도록 처리
        const message = e instanceof Error ? e.message : "업로드 중 오류가 발생했습니다.";
        setErrors([{ row: 0, messages: [message] }]);
        return;
      }
      if (result.success) {
        toast.success(`장비 ${result.insertedCount}건을 등록했습니다.`);
        setOpen(false);
        resetState();
      } else {
        setErrors(result.errors);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline">새 장비 일괄등록</Button>} />
      <DialogContent className="sm:max-w-lg">
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>새 장비 일괄등록</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            .xlsx 파일의 1행은 헤더로 간주하고, 2행부터 A~F열(디바이스구분 /
            디바이스명 / 디바이스아이디 / 시리얼넘버 / 제조번호 / 설명)을
            읽어 등록합니다.
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              파일 선택
            </Button>
            <span className="text-sm text-muted-foreground">
              {fileName ?? "선택된 파일 없음"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              name="file"
              accept=".xlsx"
              required
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </div>

          {errors && errors.length > 0 && (
            <div className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
              {errors.map((err, i) => (
                <div key={i}>
                  <p className="font-medium text-destructive">
                    {err.row === 0 ? "오류" : `${err.row}행`}
                  </p>
                  <ul className="list-inside list-disc text-destructive">
                    {err.messages.map((m, j) => (
                      <li key={j}>{m}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
