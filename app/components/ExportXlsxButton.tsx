"use client";

export default function ExportXlsxButton({
  data,
  filename,
}: {
  data: Record<string, unknown>[];
  filename: string;
}) {
  async function handleClick() {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
    XLSX.writeFile(workbook, filename);
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-full border border-white/10 text-text-muted text-xs font-semibold px-3 py-1.5 hover:text-thermal-accent hover:border-thermal-accent transition-colors"
    >
      Export to XLSX
    </button>
  );
}
