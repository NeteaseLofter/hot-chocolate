import { init, parse, ImportType } from 'es-module-lexer';

let lexerReady: Promise<void> | undefined;

export function ensureLexerInit (): Promise<void> {
  if (!lexerReady) {
    lexerReady = init;
  }
  return lexerReady;
}

function transformStaticImportStatement (
  stmt: string,
  specifierDecoded: string
): string {
  const spec = JSON.stringify(specifierDecoded);
  const t = stmt.trim();

  if (/^import\s*['"]/.test(t)) {
    return `await __hcDynamicImport(${spec}, __moduleUrl);`;
  }

  const mix = t.match(
    /^import\s+([\w$]+)\s*,\s*(\{[\s\S]*\})\s+from\s+['"][^'"]+['"]\s*;?\s*$/m
  );
  if (mix) {
    const clause = mix[2].replace(/\s+as\s+/g, ': ');
    const tmp = `__hcMix${Math.floor(Math.random() * 1e9)}`;
    return (
      `const ${tmp}=await __hcDynamicImport(${spec}, __moduleUrl);` +
      `const ${mix[1]}=${tmp}.default;` +
      `const ${clause}=${tmp};`
    );
  }

  const mDef = t.match(/^import\s+([\w$]+)\s+from\s+/);
  if (mDef) {
    return `const ${mDef[1]}=(await __hcDynamicImport(${spec}, __moduleUrl)).default;`;
  }

  const mNs = t.match(/^import\s+\*\s+as\s+([\w$]+)\s+from\s+/);
  if (mNs) {
    return `const ${mNs[1]}=await __hcDynamicImport(${spec}, __moduleUrl);`;
  }

  const mNamed = t.match(/^import\s+(\{[\s\S]*\})\s+from\s+/);
  if (mNamed) {
    const clause = mNamed[1].replace(/\s+as\s+/g, ': ');
    return `const ${clause}=await __hcDynamicImport(${spec}, __moduleUrl);`;
  }

  throw new SyntaxError(`[hot-chocolate] unsupported import: ${t.slice(0, 80)}`);
}

function stripExportKeywords (s: string): string {
  let out = s.replace(/\bexport\s+default\s+/g, '__hcDynamicModuleExport.default = ');
  out = out.replace(
    /\bexport\s+(?=(?:async\s+)?function\b|class\b|const\b|let\b|var\b)/g,
    ''
  );
  return out;
}

function buildExportTail (source: string, exports: readonly { readonly n: string; readonly ls: number; readonly le: number }[]): string {
  const parts: string[] = [];
  for (const e of exports) {
    if (e.n === 'default' && e.ls === -1) {
      continue;
    }
    const rhs = e.ls === -1 ? e.n : source.slice(e.ls, e.le);
    parts.push(`${JSON.stringify(e.n)}: ${rhs}`);
  }
  if (!parts.length) {
    return '';
  }
  return `Object.assign(__hcDynamicModuleExport, { ${parts.join(', ')} });\n`;
}

/**
 * 将 ESM 源码改写为可在 sandbox runCode（Script 目标）+ async IIFE 中执行的形式。
 * 静态/动态 import、import.meta.url 由 __hcDynamicImport / __moduleUrl 承接；
 * export 经去关键字 + 末尾 Object.assign 写入 __hcDynamicModuleExport。
 */
export async function transformEsmModuleSource (
  source: string,
  _moduleUrl: string
): Promise<string> {
  await ensureLexerInit();
  const [imports, exportList] = parse(source);
  const exportTail = buildExportTail(source, exportList);

  const reps: { start: number; end: number; str: string }[] = [];

  for (const imp of imports) {
    if (imp.t === ImportType.ImportMeta || imp.d === -2) {
      reps.push({ start: imp.s, end: imp.e, str: '({url: __moduleUrl})' });
      continue;
    }
    if (imp.t === ImportType.Dynamic) {
      if (imp.n != null && imp.se > imp.ss) {
        reps.push({
          start: imp.ss,
          end: imp.se,
          str: `await __hcDynamicImport(${JSON.stringify(imp.n)}, __moduleUrl)`
        });
      }
      continue;
    }
    if (imp.t === ImportType.Static) {
      const stmt = source.slice(imp.ss, imp.se);
      const spec = imp.n ?? source.slice(imp.s, imp.e);
      const gen = transformStaticImportStatement(stmt, spec);
      reps.push({ start: imp.ss, end: imp.se, str: gen });
      continue;
    }
    throw new SyntaxError(
      `[hot-chocolate] unsupported import syntax (type ${imp.t})`
    );
  }

  reps.sort((a, b) => b.start - a.start);
  let out = source;
  for (const r of reps) {
    out = out.slice(0, r.start) + r.str + out.slice(r.end);
  }
  out = stripExportKeywords(out);
  return out + exportTail;
}
