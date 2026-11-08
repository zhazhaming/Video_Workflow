import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const proxy = {
  "/api": "http://localhost:8000",
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // 监听局域网：飞书卡片里的链接（http://<局域网IP>:5173）要从手机打开
    proxy,
  },
  // vite preview：服务生产构建（dist），供 SSH 反向隧道暴露到公网服务器时使用
  preview: {
    port: 5173,
    host: true,
    proxy,
  },
});
