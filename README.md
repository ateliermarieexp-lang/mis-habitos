# MisHábitos 🌟

Tu tracker de hábitos personal con IA integrada.

## Archivos del proyecto

```
habitos-app/
├── src/app/
│   ├── layout.js         ← estructura base
│   ├── page.js           ← página principal
│   ├── HabitosApp.js     ← toda la app
│   └── api/ai/route.js   ← endpoint de IA
├── package.json
└── next.config.js
```

## Variable de entorno necesaria en Vercel

En Vercel → Settings → Environment Variables, agregar:

```
ANTHROPIC_API_KEY = tu-api-key-aqui
```
