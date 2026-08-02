# FITAI Frontend

Next.js frontend theo feature boundary, hiện được giữ trong **một ứng dụng và một `src/` duy nhất**.

## Chạy local

```bash
pnpm install
pnpm dev
```

Các kiểm tra nền tảng:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Cấu trúc

```text
src/
  app/                    # route, layout, Server Component composition
  features/               # domain/application/components/validation theo feature
  shared/
    api/                  # ConnectRPC transport + Proto generated client
    design-system/        # semantic tokens và contract giao diện
    http/                 # hạ tầng HTTP dùng chung
    lib/                  # utility thuần
    observability/        # tracing/logging
    ui/                   # primitive/component dùng chung, không chứa business rule
  types/
tests/
```

Quy tắc phụ thuộc và kế hoạch tách phần dùng chung khi bắt đầu Expo được mô tả tại [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md).
