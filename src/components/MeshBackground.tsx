const MeshBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div
      className="absolute w-[700px] h-[700px] rounded-full opacity-[0.10] blur-[130px] -top-[220px] -left-[180px] bg-analytics"
    />
    <div
      className="absolute w-[520px] h-[520px] rounded-full opacity-[0.08] blur-[140px] -bottom-[160px] -right-[160px] bg-combined"
    />
    <div
      className="absolute w-[420px] h-[420px] rounded-full opacity-[0.06] blur-[150px] top-[38%] left-[32%] bg-primary"
    />
  </div>
);

export default MeshBackground;
