# TheHive - Mission Control

AI-powered mission control dashboard with Claude integration. Manage tasks, plan missions, and get AI guidance — all from a single self-hosted dashboard.

## Features

- **Kanban Board** — Five-stage workflow: Inbox → Assigned → In Progress → Review → Done
- **Claude Chat** — Direct AI assistant with full context of your tasks and missions
- **Mission Management** — Group related tasks, track multi-task progress
- **Dashboard** — Real-time stats, task distribution, and activity feed
- **Dark/Light Theme** — Toggle with one click

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 15 | Full-stack React framework |
| TypeScript | Type-safe development |
| Tailwind CSS | Utility-first styling |
| Radix UI | Accessible UI primitives |
| SQLite | Local database (via better-sqlite3) |
| Anthropic SDK | Claude AI integration |
| Lucide Icons | Icon library |

## Setup

1. Clone and install:
```bash
git clone <repo-url>
cd THEHIVE
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

3. Run:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | — | Your Anthropic API key |
| `CLAUDE_MODEL` | No | `claude-sonnet-4-20250514` | Claude model to use |
| `PORT` | No | `3000` | Dashboard port |

## API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/tasks` | GET/POST/PATCH/DELETE | Task CRUD |
| `/api/missions` | GET/POST/PATCH/DELETE | Mission CRUD |
| `/api/activity` | GET | Activity log feed |
| `/api/chat` | GET/POST | Chat with Claude (SSE streaming) |
| `/api/stats` | GET | Dashboard statistics |

## License

MIT
