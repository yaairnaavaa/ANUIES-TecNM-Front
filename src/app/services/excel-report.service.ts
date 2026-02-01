import { Injectable } from '@angular/core';
import { Workbook } from 'exceljs';

export interface ExcelColumn {
  key: string;
  label: string;
  width?: number;
}

export interface ExcelReportOptions {
  sheetName: string;
  filename: string;
  columns: ExcelColumn[];
  rows: Record<string, unknown>[];
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class ExcelReportService {
  /**
   * Genera y descarga un archivo Excel con formato (encabezados con estilo, bordes, anchos de columna).
   */
  async downloadFormattedExcel(options: ExcelReportOptions): Promise<void> {
    const { sheetName, filename, columns, rows, title } = options;

    const workbook = new Workbook();
    workbook.creator = 'ANUIES TecNM';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(sheetName, {
      pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      properties: { defaultRowHeight: 22 }
    });

    // Definir anchos de columna
    columns.forEach((col, index) => {
      sheet.getColumn(index + 1).width = col.width ?? 18;
    });

    let rowIndex = 1;

    // Título opcional
    if (title) {
      const titleRow = sheet.getRow(rowIndex);
      const titleCell = titleRow.getCell(1);
      titleCell.value = title;
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.mergeCells(rowIndex, 1, rowIndex, columns.length);
      rowIndex++;
      rowIndex++; // línea en blanco
    }

    // Fila de encabezados
    const headerRow = sheet.getRow(rowIndex);
    headerRow.height = 28;
    columns.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = col.label;
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1e40af' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    rowIndex++;

    // Filas de datos
    rows.forEach((rowData, dataIndex) => {
      const row = sheet.getRow(rowIndex);
      const isEven = dataIndex % 2 === 0;
      columns.forEach((col, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        const raw = this.getNestedValue(rowData, col.key);
        const value =
          raw == null || raw === ''
            ? ''
            : typeof raw === 'object' && !(raw instanceof Date)
              ? JSON.stringify(raw)
              : raw;
        cell.value = value as string | number | boolean | Date;
        cell.font = { size: 10 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      row.height = 22;
      rowIndex++;
    });

    // Auto-filtro en encabezados (opcional)
    if (rows.length > 0) {
      sheet.autoFilter = {
        from: { row: title ? 3 : 1, column: 1 },
        to: { row: rowIndex - 1, column: columns.length }
      };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const keys = path.split('.');
    let current: unknown = obj;
    for (const key of keys) {
      if (current == null) return '';
      current = (current as Record<string, unknown>)[key];
    }
    return current;
  }
}
