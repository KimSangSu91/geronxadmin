import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 계약서/인수증 PDF, 장비 일괄등록 Excel 업로드가 Server Action으로 처리되는데
      // 기본값(1MB)은 실제 파일에 비해 너무 작아 업로드가 실패한다.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
