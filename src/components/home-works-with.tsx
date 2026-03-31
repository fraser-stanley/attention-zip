const clients = [
  "Claude",
  "Cursor",
  "OpenClaw",
  "Zora CLI",
  "Any MCP client",
] as const;

export function HomeWorksWith() {
  return (
    <section className="space-y-4">
      <h2 className="type-body-sm font-medium text-muted-foreground">
        Works with
      </h2>
      <div className="flex flex-wrap items-center gap-3">
        {clients.map((client) => (
          <span
            key={client}
            className="type-body-sm border border-border px-3 py-1.5 text-foreground/80"
          >
            {client}
          </span>
        ))}
      </div>
    </section>
  );
}
