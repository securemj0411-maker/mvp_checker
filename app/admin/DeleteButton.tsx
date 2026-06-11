"use client";

import { deleteLead } from "./actions";

/** 확인 다이얼로그를 거치는 리드 삭제 버튼 */
export default function DeleteButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <form
      action={deleteLead}
      onSubmit={(e) => {
        if (!confirm(`"${name}" 리드를 삭제할까요? 되돌릴 수 없습니다.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="w-full rounded-md border border-red-300 bg-red-50 px-2 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-100">
        삭제
      </button>
    </form>
  );
}
