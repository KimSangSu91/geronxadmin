"use client";

import { useActionState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addActionLog } from "@/app/customers/[customerId]/actions";

async function actionWrapper(_prevState: number, formData: FormData) {
  await addActionLog(formData);
  return Date.now();
}

export function ActionLogForm({ customerId }: { customerId: string }) {
  const [state, formAction, isPending] = useActionState(actionWrapper, 0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="customerId" value={customerId} />
      <Textarea
        name="content"
        placeholder="진행 내용을 입력하세요"
        required
        rows={3}
      />
      <Button type="submit" disabled={isPending} className="self-end">
        {isPending ? "등록 중..." : "등록"}
      </Button>
    </form>
  );
}
