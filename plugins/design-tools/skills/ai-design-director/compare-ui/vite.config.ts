import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" — 빌드 산출물(dist/)을 임의 경로에서 정적 서빙해도 자산 경로가 깨지지 않도록 상대 경로로 둔다.
// (design/compare/dist 를 그대로 파일 서버로 열거나 다른 정적 호스팅에 올릴 때 필요.)
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 5173,
  },
});
