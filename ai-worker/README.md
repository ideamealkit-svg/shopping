# NOVA AI Chat Worker

GitHub Pages에 Groq 키가 노출되지 않도록 Groq 요청만 중계하는 작은 Cloudflare Worker입니다.

## Local

1. `.dev.vars.example`을 `.dev.vars`로 복사하고 Groq 키를 입력합니다.
2. 저장소 루트에서 `npm run ai:dev`를 실행합니다.
3. 쇼핑몰 개발 서버를 `NEXT_PUBLIC_NOVA_AI_API_URL=http://localhost:8787`과 함께 빌드합니다.

## Production

```text
npx wrangler secret put GROQ_API_KEY --config ai-worker/wrangler.toml
npm run ai:deploy
```

배포 후 출력된 Worker URL을 GitHub 저장소의 Actions variable `NOVA_AI_API_URL`에 저장하고 GitHub Pages workflow를 다시 실행합니다.
