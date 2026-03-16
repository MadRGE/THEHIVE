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

**macOS / Linux:**
```bash
cp .env.example .env
```

**Windows (CMD):**
```cmd
copy .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

Edit `.env` and add your `ANTHROPIC_API_KEY`.

3. Validate setup (optional but recommended):
```bash
npm run setup
```

4. Run:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Windows Troubleshooting

If you have issues running TheHive on Windows:

### `npm install` fails with `node-gyp` errors
The `better-sqlite3` package requires native compilation. Install build tools:
```cmd
npm install --global windows-build-tools
```
Or install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the "Desktop development with C++" workload, then run:
```cmd
npm rebuild better-sqlite3
```

### `EPERM` or permission errors
- Run your terminal (CMD or PowerShell) as **Administrator**
- Check that your antivirus is not blocking Node.js or SQLite file access
- Make sure the `data/` folder is not marked as read-only

### Port 3000 already in use
Change the port in `.env`:
```
PORT=3001
```
Or find and stop the process using port 3000:
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### `not a valid Win32 application` error
Your native modules were compiled for a different platform or Node version. Fix with:
```cmd
npm rebuild better-sqlite3
```

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
