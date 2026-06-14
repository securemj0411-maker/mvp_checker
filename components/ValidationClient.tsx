"use client";

import { useEffect, useState } from "react";
import ValidationSite, { type ValidationSiteData } from "@/components/ValidationSite";

/** 검증 랜딩을 클라이언트에서 렌더한다. 초기 HTML엔 본문 마크업이 없어
 *  보기소스/curl로 페이지를 통째로 베끼는 게 막힌다(완벽 방지는 아닌 억제용).
 *  데이터는 /api/v/data 에서 받아오고, 게시된 노출에서만 t.js를 붙인다. */
export default function ValidationClient({
  token,
  preview,
}: {
  token: string;
  preview: boolean;
}) {
  const [state, setState] = useState<
    "loading" | "unpublished" | "notfound" | "ready"
  >("loading");
  const [data, setData] = useState<ValidationSiteData | null>(null);
  const [measure, setMeasure] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(
      `/api/v/data?code=${encodeURIComponent(token)}${preview ? "&preview=1" : ""}`,
    )
      .then((r) => (r.status === 404 ? { ok: false } : r.json()))
      .then((j) => {
        if (!alive) return;
        if (!j?.ok) setState("notfound");
        else if (j.data) {
          setData(j.data as ValidationSiteData);
          setMeasure(!!j.measure);
          setState("ready");
        } else setState("unpublished");
      })
      .catch(() => {
        if (alive) setState("notfound");
      });
    return () => {
      alive = false;
    };
  }, [token, preview]);

  // 측정 — 게시된 노출에서만. 방문·CTA 클릭이 o2o_events로(코크핏 실시간 반영).
  useEffect(() => {
    if (state !== "ready" || !measure || !data) return;
    const s = document.createElement("script");
    s.defer = true;
    s.src = "/t.js";
    s.dataset.code = data.code;
    document.body.appendChild(s);
    return () => {
      s.remove();
    };
  }, [state, measure, data]);

  if (state === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }
  if (state === "notfound") {
    return (
      <main className="grid min-h-screen place-items-center bg-bg px-6 text-center">
        <div>
          <p className="text-[17px] font-bold text-text">
            페이지를 찾을 수 없습니다
          </p>
          <p className="mt-2 text-[14px] text-text-tertiary">
            주소를 다시 확인해주세요.
          </p>
        </div>
      </main>
    );
  }
  if (state === "unpublished" || !data) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg px-6 text-center">
        <div>
          <p className="text-[17px] font-bold text-text">곧 공개됩니다</p>
          <p className="mt-2 text-[14px] text-text-tertiary">
            준비 중인 페이지입니다.
          </p>
        </div>
      </main>
    );
  }
  return <ValidationSite data={data} />;
}
