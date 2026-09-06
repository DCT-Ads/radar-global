export function RadarShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="-m-6 min-h-[calc(100vh-3.5rem)] p-6 text-[#F5F7FA]"
      style={{
        background: "linear-gradient(180deg, #0B1A2F 0%, #12263F 100%)",
      }}
    >
      {children}
    </div>
  );
}
