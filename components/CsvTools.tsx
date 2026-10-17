"use client";

import { useRef, useState } from "react";
import { api, BulkImportResult } from "@/lib/api";
import { downloadCsv, parseCsv, toCsv } from "@/lib/csv";
import Modal from "@/components/Modal";
import styles from "./CsvTools.module.css";

type Row = Record<string, unknown>;

// Import / Export buttons for a list page.
//
// `template` is an empty record of what the server's create endpoint takes:
// its keys are the CSV columns (in order) and each value's type decides how a
// cell is read — text for strings, JSON for lists/objects (e.g. a voucher's
// guests or a booking's payments). Export writes one row per record; Import
// reads a CSV with the same columns, previews it, then sends every row to
// POST {importPath}/bulk-import in one request.
export default function CsvTools({
  name,
  template,
  rows,
  importPath,
  canImport = true,
  omit = [],
  exportExtra = [],
  toExport,
  toImport,
  onImported,
}: {
  name: string; // file name prefix, e.g. "accounts"
  template: Row;
  rows: Row[];
  importPath?: string; // omit for export-only lists
  canImport?: boolean;
  omit?: string[]; // template keys left out of the CSV (e.g. base64 images)
  exportExtra?: { header: string; value: (row: Row) => string }[]; // read-only helper columns
  toExport?: (row: Row) => Row; // adjust a record before export
  toImport?: (item: Row) => Row; // adjust a parsed row before upload (e.g. names -> ids)
  onImported?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const keys = Object.keys(template).filter((k) => !omit.includes(k));
  const isJson = (k: string) => typeof template[k] === "object" && template[k] !== null;

  const [preview, setPreview] = useState<{ fileName: string; items: Row[]; problems: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [err, setErr] = useState("");

  function cellOut(v: unknown): string {
    if (v === null || v === undefined) return "";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  }

  function onExport() {
    const header = [...keys, ...exportExtra.map((x) => x.header)];
    const body = rows.map((r) => {
      const rec = toExport ? toExport(r) : r;
      return [...keys.map((k) => cellOut(rec[k])), ...exportExtra.map((x) => x.value(r))];
    });
    downloadCsv(`${name}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([header, ...body]));
  }

  function onTemplate() {
    downloadCsv(`${name}-template.csv`, toCsv([keys]));
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setErr("");
    setResult(null);
    try {
      const table = parseCsv(await file.text());
      if (table.length < 2) throw new Error("The file has no data rows under the header.");
      const header = table[0].map((h) => h.trim());
      const known = header.filter((h) => keys.includes(h));
      if (known.length === 0) {
        throw new Error(`None of the columns match. Expected headers like: ${keys.slice(0, 6).join(", ")}…`);
      }
      const problems: string[] = [];
      const unknown = header.filter((h) => h && !keys.includes(h) && !exportExtra.some((x) => x.header === h));
      if (unknown.length) problems.push(`Ignored columns: ${unknown.join(", ")}`);
      const items: Row[] = [];
      table.slice(1).forEach((cells, i) => {
        const item: Row = JSON.parse(JSON.stringify(template));
        for (const k of omit) delete item[k];
        header.forEach((h, c) => {
          if (!keys.includes(h)) return;
          const raw = (cells[c] ?? "").trim();
          if (!isJson(h)) {
            item[h] = raw;
            return;
          }
          if (!raw) return; // keep the empty default
          try {
            item[h] = JSON.parse(raw);
          } catch {
            problems.push(`Row ${i + 1}: "${h}" isn't valid list data — left empty`);
          }
        });
        // Read-only helper columns are passed through for toImport to use.
        exportExtra.forEach((x) => {
          const c = header.indexOf(x.header);
          if (c >= 0) item[`__${x.header}`] = (cells[c] ?? "").trim();
        });
        items.push(toImport ? toImport(item) : item);
      });
      for (const it of items) for (const k of Object.keys(it)) if (k.startsWith("__")) delete it[k];
      setPreview({ fileName: file.name, items, problems });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't read that file");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onConfirm() {
    if (!preview || !importPath) return;
    setBusy(true);
    setErr("");
    try {
      const res = await api.bulkImport(importPath, preview.items);
      setResult(res);
      setPreview(null);
      onImported?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Import failed — nothing was saved");
    } finally {
      setBusy(false);
    }
  }

  const previewCols = keys.slice(0, 5);

  return (
    <>
      <button type="button" className={styles.btn} onClick={onExport} disabled={rows.length === 0} title="Download all rows as CSV">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 4v11m0 0 4-4m-4 4-4-4M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Export
      </button>
      {importPath && canImport && (
        <>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <button type="button" className={styles.btn} onClick={() => fileRef.current?.click()} title="Add rows from a CSV file">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 16V5m0 0 4 4m-4-4-4 4M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Import
          </button>
        </>
      )}

      <Modal
        open={!!preview || !!result || !!err}
        onClose={() => {
          if (busy) return;
          setPreview(null);
          setResult(null);
          setErr("");
        }}
        title={result ? "Import finished" : "Import CSV"}
        maxWidth={760}
      >
        {err && <div className={styles.err}>{err}</div>}

        {preview && (
          <>
            <p className={styles.lead}>
              <strong>{preview.items.length}</strong> row{preview.items.length === 1 ? "" : "s"} found in{" "}
              <strong>{preview.fileName}</strong>. They&apos;ll be added as new records, all in one go — every row is
              checked first, and if any row is invalid nothing is saved.
            </p>
            {preview.problems.length > 0 && (
              <ul className={styles.problems}>
                {preview.problems.slice(0, 8).map((p) => (
                  <li key={p}>{p}</li>
                ))}
                {preview.problems.length > 8 && <li>…and {preview.problems.length - 8} more</li>}
              </ul>
            )}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    {previewCols.map((k) => (
                      <th key={k}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.items.slice(0, 6).map((it, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      {previewCols.map((k) => (
                        <td key={k}>{cellOut(it[k]).slice(0, 40) || "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.items.length > 6 && <div className={styles.more}>…and {preview.items.length - 6} more rows</div>}
          </>
        )}

        {result && (
          <>
            <p className={styles.lead}>
              <strong>{result.created}</strong> record{result.created === 1 ? "" : "s"} added.
              {result.errors.length > 0 && ` ${result.errors.length} row${result.errors.length === 1 ? " was" : "s were"} skipped:`}
            </p>
            {result.errors.length > 0 && (
              <ul className={styles.problems}>
                {result.errors.slice(0, 20).map((e) => (
                  <li key={e.row}>
                    Row {e.row}: {e.error}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <div className={styles.actions}>
          {preview && (
            <button type="button" className={styles.linkBtn} onClick={onTemplate}>
              Download template
            </button>
          )}
          <span className={styles.spacer} />
          <button
            type="button"
            className={styles.cancel}
            onClick={() => {
              setPreview(null);
              setResult(null);
              setErr("");
            }}
            disabled={busy}
          >
            {preview ? "Cancel" : "Close"}
          </button>
          {preview && (
            <button type="button" className={styles.confirm} onClick={onConfirm} disabled={busy || preview.items.length === 0}>
              {busy ? "Importing…" : `Import ${preview.items.length} row${preview.items.length === 1 ? "" : "s"}`}
            </button>
          )}
          {err && !preview && importPath && (
            <button type="button" className={styles.linkBtn} onClick={onTemplate}>
              Download template
            </button>
          )}
        </div>
      </Modal>
    </>
  );
}
