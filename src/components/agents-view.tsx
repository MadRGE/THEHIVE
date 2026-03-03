"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileSearch,
  FileText,
  Globe,
  Settings,
  Power,
  PowerOff,
  RefreshCw,
  ChevronRight,
  Server,
  Plug,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

// ─── Types ───
interface McpServerConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  description: string;
  status: "connected" | "disconnected" | "connecting" | "error";
  tools: string[];
}

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  mcpServer: string;
  status: "idle" | "running" | "error";
  steps: string[];
  tools: string[];
  color: string;
}

// ─── Initial MCP Server Configs ───
const initialMcpServers: McpServerConfig[] = [
  {
    id: "docgen-anmat",
    name: "DocGen ANMAT",
    command: "node",
    args: ["./mcp-docgen-anmat/src/index.js"],
    description: "Genera fichas técnicas y documentos para registro de envases ANMAT/INAL",
    status: "disconnected",
    tools: ["generar_ficha_preliminar", "generar_documento_final", "generar_declaracion_fabricante"],
  },
  {
    id: "tad-browser",
    name: "TAD Browser",
    command: "node",
    args: ["./mcp-tad-browser/src/index.js"],
    description: "Automatiza la carga de trámites en TAD (Trámites a Distancia)",
    status: "disconnected",
    tools: ["tad_login", "tad_navegar_registro_envase", "tad_completar_formulario", "tad_subir_documento", "tad_screenshot", "tad_cerrar"],
  },
];

// ─── Agent Configs ───
const agentConfigs: AgentConfig[] = [
  {
    id: "analisis",
    name: "Agente 1 — Análisis + Ficha Preliminar",
    description: "Analiza fotos del producto, identifica materiales, tipo de envase, y genera una ficha preliminar para revisión.",
    icon: <FileSearch className="h-5 w-5" />,
    mcpServer: "docgen-anmat",
    status: "idle",
    color: "blue",
    steps: [
      "Recibir foto del producto y datos del fabricante",
      "Analizar imagen con Vision (material, forma, tipo)",
      "Clasificar según CAA (Código Alimentario Argentino)",
      "Generar ficha preliminar en JSON",
      "Mostrar al usuario para revisión",
    ],
    tools: ["generar_ficha_preliminar"],
  },
  {
    id: "docgen",
    name: "Agente 2 — Generación de Documento Final",
    description: "Toma los datos confirmados por el usuario y genera el documento Word/PDF final usando plantillas de Ficha Técnica de Envase.",
    icon: <FileText className="h-5 w-5" />,
    mcpServer: "docgen-anmat",
    status: "idle",
    color: "emerald",
    steps: [
      "Recibir ficha confirmada por el usuario",
      "Seleccionar plantilla (Riesgo 2, Silo, Declaración)",
      "Generar documento DOCX con formato ANMAT",
      "Opcionalmente generar Declaración del Fabricante",
      "Guardar en carpeta output/",
    ],
    tools: ["generar_documento_final", "generar_declaracion_fabricante"],
  },
  {
    id: "tad",
    name: "Agente 3 — Carga TAD (Browser)",
    description: "Abre el browser, navega a Trámites a Distancia, y sube toda la documentación al trámite de registro.",
    icon: <Globe className="h-5 w-5" />,
    mcpServer: "tad-browser",
    status: "idle",
    color: "purple",
    steps: [
      "Login en TAD (el usuario completa clave fiscal)",
      "Navegar al formulario de registro de envase",
      "Completar campos del formulario",
      "Subir documentos generados",
      "Verificar con screenshot",
      "Esperar confirmación del usuario para enviar",
    ],
    tools: ["tad_login", "tad_navegar_registro_envase", "tad_completar_formulario", "tad_subir_documento", "tad_screenshot", "tad_cerrar"],
  },
];

// ─── Sub-tabs ───
type AgentTab = "overview" | "analisis" | "docgen" | "tad" | "mcp";

export function AgentsView() {
  const [activeSubTab, setActiveSubTab] = useState<AgentTab>("overview");
  const [mcpServers, setMcpServers] = useState(initialMcpServers);

  const subTabs: { id: AgentTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "General", icon: <Settings className="h-4 w-4" /> },
    { id: "analisis", label: "Análisis", icon: <FileSearch className="h-4 w-4" /> },
    { id: "docgen", label: "DocGen", icon: <FileText className="h-4 w-4" /> },
    { id: "tad", label: "TAD Browser", icon: <Globe className="h-4 w-4" /> },
    { id: "mcp", label: "MCP Servers", icon: <Server className="h-4 w-4" /> },
  ];

  const toggleMcpServer = (serverId: string) => {
    setMcpServers((prev) =>
      prev.map((s) =>
        s.id === serverId
          ? {
              ...s,
              status:
                s.status === "disconnected"
                  ? "connecting"
                  : s.status === "connected"
                  ? "disconnected"
                  : s.status,
            }
          : s
      )
    );
    // Simulate connection
    setTimeout(() => {
      setMcpServers((prev) =>
        prev.map((s) =>
          s.id === serverId && s.status === "connecting"
            ? { ...s, status: "connected" }
            : s
        )
      );
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex items-center gap-1 border-b pb-3">
        {subTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeSubTab === tab.id ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveSubTab(tab.id)}
            className="text-sm gap-1.5"
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {activeSubTab === "overview" && (
        <OverviewPanel mcpServers={mcpServers} />
      )}
      {activeSubTab === "analisis" && (
        <AgentPanel agent={agentConfigs[0]} mcpServer={mcpServers.find((s) => s.id === "docgen-anmat")!} />
      )}
      {activeSubTab === "docgen" && (
        <AgentPanel agent={agentConfigs[1]} mcpServer={mcpServers.find((s) => s.id === "docgen-anmat")!} />
      )}
      {activeSubTab === "tad" && (
        <AgentPanel agent={agentConfigs[2]} mcpServer={mcpServers.find((s) => s.id === "tad-browser")!} />
      )}
      {activeSubTab === "mcp" && (
        <McpManagerPanel mcpServers={mcpServers} onToggle={toggleMcpServer} />
      )}
    </div>
  );
}

// ─── Overview Panel ───
function OverviewPanel({ mcpServers }: { mcpServers: McpServerConfig[] }) {
  return (
    <div className="space-y-6">
      {/* Architecture diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arquitectura del Sistema Multi-Agente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-xs leading-relaxed text-muted-foreground bg-muted/50 rounded-lg p-4 overflow-x-auto">
            <pre>{`┌──────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE (Orquestador)                  │
│                                                              │
│   "Registrame este envase de [PRODUCTO]"                     │
│                                                              │
│   ┌──────────────┐  ┌───────────────┐  ┌──────────────┐     │
│   │  AGENTE 1    │  │  AGENTE 2     │  │  AGENTE 3    │     │
│   │  Análisis    │  │  Generación   │  │  Carga TAD   │     │
│   │  + Ficha     │  │  Documento    │  │  (Browser)   │     │
│   │  Preliminar  │  │  Final        │  │              │     │
│   └──────┬───────┘  └──────┬────────┘  └──────┬───────┘     │
│          │                 │                   │             │
│     ┌────▼─────┐    ┌─────▼──────┐     ┌──────▼───────┐     │
│     │ MCP:     │    │ MCP:       │     │ MCP:         │     │
│     │ Vision   │    │ DocGen     │     │ Playwright   │     │
│     │ + Files  │    │ (docx)     │     │ + TAD        │     │
│     └──────────┘    └────────────┘     └──────────────┘     │
└──────────────────────────────────────────────────────────────┘`}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agentConfigs.map((agent) => {
          const server = mcpServers.find((s) => s.id === agent.mcpServer);
          return (
            <Card key={agent.id} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-${agent.color}-500`} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-${agent.color}-500/10 text-${agent.color}-500`}>
                      {agent.icon}
                    </div>
                    <CardTitle className="text-sm">{agent.name}</CardTitle>
                  </div>
                  <StatusBadge status={agent.status === "idle" ? "idle" : agent.status === "running" ? "running" : "error"} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">{agent.description}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Plug className="h-3 w-3" />
                  <span>MCP: {server?.name}</span>
                  <McpStatusDot status={server?.status || "disconnected"} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {agent.tools.map((tool) => (
                    <Badge key={tool} variant="outline" className="text-[10px] px-1.5 py-0">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* MCP Server Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado de MCP Servers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mcpServers.map((server) => (
              <div key={server.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <McpStatusDot status={server.status} />
                  <div>
                    <p className="text-sm font-medium">{server.name}</p>
                    <p className="text-xs text-muted-foreground">{server.description}</p>
                  </div>
                </div>
                <Badge variant={server.status === "connected" ? "default" : "outline"}>
                  {server.status === "connected" ? "Conectado" : server.status === "connecting" ? "Conectando..." : "Desconectado"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Flujo de Trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { step: "1", title: "Recepción de datos", desc: "Foto del producto + datos del fabricante + datos del importador", color: "blue" },
              { step: "2", title: "Ficha Preliminar", desc: "Agente 1 analiza y genera ficha para revisión del usuario", color: "blue" },
              { step: "3", title: "Revisión del usuario", desc: "El usuario revisa, corrige y confirma la ficha", color: "amber" },
              { step: "4", title: "Documento Final", desc: "Agente 2 genera DOCX + Declaración del Fabricante", color: "emerald" },
              { step: "5", title: "Carga en TAD", desc: "Agente 3 abre browser, completa formulario y sube documentación", color: "purple" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-${item.color}-500/10 text-${item.color}-500 flex items-center justify-center text-sm font-bold`}>
                  {item.step}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                {i < 4 && <ChevronRight className="h-4 w-4 text-muted-foreground mt-2" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Agent Detail Panel ───
function AgentPanel({ agent, mcpServer }: { agent: AgentConfig; mcpServer: McpServerConfig }) {
  return (
    <div className="space-y-6">
      {/* Agent Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg bg-${agent.color}-500/10 text-${agent.color}-500`}>
                {agent.icon}
              </div>
              <div>
                <CardTitle className="text-base">{agent.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{agent.description}</p>
              </div>
            </div>
            <StatusBadge status={agent.status} />
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pasos del Agente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agent.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </div>
                  <p className="text-sm pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tools Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {agent.tools.map((tool) => (
                <div key={tool} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Plug className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-mono">{tool}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {mcpServer.name}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MCP Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Conexión MCP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Server className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{mcpServer.name}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {mcpServer.command} {mcpServer.args.join(" ")}
                </p>
              </div>
            </div>
            <McpStatusDot status={mcpServer.status} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── MCP Manager Panel ───
function McpManagerPanel({
  mcpServers,
  onToggle,
}: {
  mcpServers: McpServerConfig[];
  onToggle: (id: string) => void;
}) {
  const [newServerName, setNewServerName] = useState("");
  const [newServerCmd, setNewServerCmd] = useState("");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-5 w-5" />
            Gestor de Conexiones MCP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Los MCP Servers proveen las herramientas que usan los agentes. Desde acá podés ver su estado,
            conectarlos o desconectarlos.
          </p>
        </CardContent>
      </Card>

      {/* Server list */}
      {mcpServers.map((server) => (
        <Card key={server.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <McpStatusDot status={server.status} size="lg" />
                <div>
                  <CardTitle className="text-sm">{server.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{server.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={server.status === "connected" ? "destructive" : "default"}
                  size="sm"
                  onClick={() => onToggle(server.id)}
                  disabled={server.status === "connecting"}
                  className="gap-1.5"
                >
                  {server.status === "connecting" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Conectando...
                    </>
                  ) : server.status === "connected" ? (
                    <>
                      <PowerOff className="h-3.5 w-3.5" />
                      Desconectar
                    </>
                  ) : (
                    <>
                      <Power className="h-3.5 w-3.5" />
                      Conectar
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reiniciar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Connection details */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Comando</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {server.command} {server.args.join(" ")}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Estado</p>
                  <Badge variant={server.status === "connected" ? "default" : "outline"}>
                    {server.status === "connected" ? "Conectado" : server.status === "connecting" ? "Conectando..." : server.status === "error" ? "Error" : "Desconectado"}
                  </Badge>
                </div>
              </div>

              {/* Tools provided by this server */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Tools disponibles ({server.tools.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {server.tools.map((tool) => (
                    <Badge key={tool} variant="secondary" className="text-xs font-mono">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add new server */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Agregar MCP Server</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Nombre del server"
              value={newServerName}
              onChange={(e) => setNewServerName(e.target.value)}
            />
            <Input
              placeholder="Comando (ej: node ./mcp-server/src/index.js)"
              value={newServerCmd}
              onChange={(e) => setNewServerCmd(e.target.value)}
            />
            <Button variant="outline" className="gap-1.5">
              <Plug className="h-3.5 w-3.5" />
              Agregar Server
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Los servidores MCP se configuran en <code>.claude/settings.json</code>. Agregá acá para gestionar la conexión desde el portal.
          </p>
        </CardContent>
      </Card>

      {/* Config preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Configuración Actual (.claude/settings.json)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto">
{JSON.stringify(
  {
    mcpServers: Object.fromEntries(
      mcpServers.map((s) => [
        s.id,
        { command: s.command, args: s.args, description: s.description },
      ])
    ),
  },
  null,
  2
)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Helper Components ───
function StatusBadge({ status }: { status: string }) {
  if (status === "running") {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Ejecutando
      </Badge>
    );
  }
  if (status === "error") {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Error
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="h-3 w-3" />
      Inactivo
    </Badge>
  );
}

function McpStatusDot({ status, size = "sm" }: { status: string; size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "h-3 w-3" : "h-2 w-2";
  if (status === "connected") {
    return <div className={`${sizeClass} rounded-full bg-emerald-500`} title="Conectado" />;
  }
  if (status === "connecting") {
    return <Loader2 className={`${sizeClass} animate-spin text-amber-500`} />;
  }
  if (status === "error") {
    return <div className={`${sizeClass} rounded-full bg-red-500`} title="Error" />;
  }
  return <div className={`${sizeClass} rounded-full bg-muted-foreground/30`} title="Desconectado" />;
}
