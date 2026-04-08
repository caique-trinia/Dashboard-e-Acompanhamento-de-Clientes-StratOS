import { parse } from "csv-parse/sync";

export interface RawModuleTask {
  taskNumber: string;
  name: string;
  description: string;
  section: string;
  parentTaskNumber: string | null;
  manualSection: string | null;
  depth: number;
  sortOrder: number;
}

/**
 * Parses the sales/execution module CSV exported from Asana.
 * Expected columns: Name, Description, Section, Parent Task, Seção do Manual
 */
export function parseModuleCsv(csvContent: string): RawModuleTask[] {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    trim: true,
  }) as Record<string, string>[];

  return records.map((row, index) => {
    const nameField = (row["Name"] ?? "").trim();
    // Extract numeric prefix like "1.1.2" from start of name
    const match = nameField.match(/^([\d]+(?:\.[\d]+)*)\s+(.+)$/);
    const taskNumber = match ? match[1] : String(index + 1);
    const cleanName = match ? match[2].trim() : nameField;
    const depth = taskNumber.split(".").length - 1;

    return {
      taskNumber,
      name: cleanName,
      description: (row["Description"] ?? "").trim(),
      section: (row["Section"] ?? "").trim(),
      parentTaskNumber: row["Parent Task"]?.trim() || null,
      manualSection: row["Seção do Manual"]?.trim() || null,
      depth,
      sortOrder: index,
    };
  });
}
