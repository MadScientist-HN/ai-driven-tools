# 🗺️ Complete Graph Project Context Mapper

<div align="center">

**v1.0.0 · Full Path Resolution · AI-Ready**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Module](https://img.shields.io/badge/Module-CommonJS-orange)](https://nodejs.org/api/modules.html)
[![Zero deps](https://img.shields.io/badge/Dependencies-Zero-brightgreen)](#)

### 🚀 Support This Project

[💝 Help us reach more developers! Support our campaign](https://4fund.com/bjmuvm)

---

*Analyzes your JavaScript/TypeScript project and builds a complete dependency graph,
resolving every import, extracting exports, and generating an AI-ready context map.*

*Analiza tu proyecto JavaScript/TypeScript y construye un grafo completo de dependencias,
resolviendo cada import, extrayendo exports y generando un mapa de contexto listo para IA.*

</div>

---

## 📖 Table of Contents · Tabla de Contenidos

- [What It Does · Qué Hace](#-what-it-does--qué-hace)
- [Problems It Solves · Problemas que Resuelve](#-problems-it-solves--problemas-que-resuelve)
- [Installation · Instalación](#-installation--instalación)
- [Quick Start · Inicio Rápido](#-quick-start--inicio-rápido)
- [API Reference · Referencia de API](#-api-reference--referencia-de-api)
- [Configuration · Configuración](#%EF%B8%8F-configuration--configuración)
- [Output Format · Formato de Salida](#-output-format--formato-de-salida)
- [CLI Usage · Uso por CLI](#-cli-usage--uso-por-cli)
- [Examples · Ejemplos](#-examples--ejemplos)
- [Architecture · Arquitectura](#-architecture--arquitectura)

---

## 🔍 What It Does · Qué Hace

**English**

`mapper.js` walks your entire project tree and produces a rich, structured map of every file and every relationship between them. It tells you not just *what* is imported, but *from where* it resolves to on disk, what kind of dependency it is, and whether it could actually be found.

**Español**

`mapper.js` recorre todo tu árbol de proyecto y produce un mapa estructurado de cada archivo y cada relación entre ellos. No solo dice *qué* se importa, sino *desde dónde* se resuelve en disco, qué tipo de dependencia es, y si realmente puede encontrarse.

| Capability · Capacidad | Details · Detalles |
|---|---|
| 📂 **Directory scanning** | Recursive, respects ignore lists, depth-limited |
| 🔗 **Import resolution** | Native (`fs`, `path`…), internal (`./utils`), external (`express`) |
| 📤 **Export extraction** | CommonJS (`module.exports`, `exports.x`) + ESM (`export const`, `export default`) |
| 📝 **JSDoc parsing** | Descriptions, `@param`, `@returns`, `@deprecated`, `@since`, `@see` |
| 🔄 **Circular dependency detection** | DFS cycle detection over the full graph |
| 📊 **Statistics** | Resolution rate, import classification breakdown |
| 🤖 **AI summary** | Markdown report ready to feed into any LLM context window |
| 💾 **File output** | `complete-context-map.json` + `complete-context-summary.md` |

---

## 🎯 Problems It Solves · Problemas que Resuelve

**English**

| Problem | How It Helps |
|---|---|
| *"What does this module actually depend on?"* | Builds a graph with every edge resolved to an absolute path |
| *"Are there circular imports breaking my app?"* | DFS cycle detection surfaces every cycle, up to the full graph |
| *"I need to give context to an LLM about my codebase"* | Generates a compact Markdown summary with hubs, stats, and native modules |
| *"A refactor broke something — what else imports this file?"* | The `edges` array shows every module that imports any given node |
| *"Which files have undocumented exports?"* | Cross-reference `exports` vs `jsdoc` arrays |
| *"Why is this import failing at runtime?"* | Unresolved list shows the exact source, type, and line of every missing dependency |

**Español**

| Problema | Cómo Ayuda |
|---|---|
| *"¿De qué depende realmente este módulo?"* | Construye un grafo con cada arista resuelta a ruta absoluta |
| *"¿Hay imports circulares que rompen mi app?"* | Detección de ciclos DFS que aflorea cada ciclo en el grafo |
| *"Necesito dar contexto a un LLM sobre mi codebase"* | Genera un resumen Markdown compacto con hubs, estadísticas y módulos nativos |
| *"Un refactor rompió algo — ¿qué más importa este archivo?"* | El array `edges` muestra cada módulo que importa cualquier nodo dado |
| *"¿Qué archivos tienen exports sin documentar?"* | Cruza los arrays `exports` y `jsdoc` |
| *"¿Por qué falla este import en tiempo de ejecución?"* | La lista `unresolved` muestra la fuente exacta, tipo y línea de cada dependencia faltante |

---

## 📦 Installation · Instalación

No external dependencies. Copy `mapper.js` to your project and require it.

Sin dependencias externas. Copia `mapper.js` a tu proyecto y haz require.

```bash
# Copy the file · Copia el archivo
cp src/mapper.js ./tools/mapper.js
```

**Requirements · Requisitos:** Node.js 12+ (uses `fs`, `path`, `crypto` — all built-in)

---

## ⚡ Quick Start · Inicio Rápido

### One-liner — Quick Analysis · Análisis Rápido

```js
const { analyzeProject } = require('./src/mapper');

const data = await analyzeProject('./src');

console.log(`Files: ${data.stats.totalFiles}`);
console.log(`Imports resolved: ${data.stats.resolvedImports}/${data.stats.totalImports}`);
console.log(`Circular deps: ${data.unresolved.length}`);
```

### Full Analysis + Save Files · Análisis Completo + Guardar Archivos

```js
const { analyzeAndSave } = require('./src/mapper');

const result = await analyzeAndSave('./src', { outputDir: './reports' });
// Prints stats table to console · Imprime tabla de estadísticas en consola
// Saves complete-context-map.json · Guarda complete-context-map.json
// Saves complete-context-summary.md · Guarda complete-context-summary.md

console.log(`JSON → ${result.files.jsonPath}`);
console.log(`MD  → ${result.files.mdPath}`);
```

### Class API — Full Control · Control Total

```js
const { CompleteGraphMapper } = require('./src/mapper');

const mapper = new CompleteGraphMapper('./src', {
  verbose: true,
  maxDepth: 5,
  includeTests: false,
});

await mapper.scan();
mapper.printStats();

const data   = mapper.getData();    // raw data object · objeto de datos crudo
const md     = mapper.getSummary(); // markdown string · string markdown
const cycles = mapper.detectCircularDependencies();

console.log('Circular deps found:', cycles.length);
```

---

## 📚 API Reference · Referencia de API

### `analyzeProject(rootDir, options?)` → `Promise<Object>`

**EN:** Fast analysis, returns the data object only, no files written.  
**ES:** Análisis rápido, retorna solo el objeto de datos, no escribe archivos.

```js
const data = await analyzeProject('./src', { verbose: true });
// data.stats     → counters
// data.nodes     → module list
// data.edges     → dependency edges
// data.imports   → every import with classification
// data.exports   → every export found
// data.unresolved → failed resolutions
// data.nativeModules → Node.js built-ins used
// data.jsdoc     → all JSDoc blocks
```

---

### `analyzeAndSave(rootDir, options?)` → `Promise<Object>`

**EN:** Full analysis, prints stats, saves JSON + Markdown.  
**ES:** Análisis completo, imprime estadísticas, guarda JSON + Markdown.

```js
const result = await analyzeAndSave('./src', {
  outputDir: './reports',
  verbose: true,
});

// result.data    → same as getData()
// result.summary → markdown string
// result.files   → { jsonPath, mdPath }
// result.stats   → { totalFiles, totalImports, resolvedImports, ... }
```

---

### `new CompleteGraphMapper(rootDir, options?)`

**EN:** Full class for fine-grained control.  
**ES:** Clase completa para control granular.

| Method | Returns | Description |
|---|---|---|
| `scan()` | `Promise<this>` | Scans all files, chainable · Escanea todos los archivos, encadenable |
| `getData()` | `Object` | Full data object · Objeto de datos completo |
| `getSummary()` | `string` | Markdown summary · Resumen Markdown |
| `saveToFile(outputDir?)` | `Promise<{jsonPath, mdPath}>` | Write output files · Escribe archivos de salida |
| `printStats()` | `void` | Console stats table · Tabla de estadísticas en consola |
| `detectCircularDependencies()` | `Array<string[]>` | Array of cycles · Array de ciclos |
| `getModuleId(filePath)` | `string` | 8-char MD5 ID · ID MD5 de 8 caracteres |

---

## ⚙️ Configuration · Configuración

```js
const mapper = new CompleteGraphMapper('./src', {

  // File extensions to scan · Extensiones de archivo a escanear
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json'],

  // Directories to skip · Directorios a omitir
  ignoreDirs: ['node_modules', '.git', 'dist', 'build', 'coverage',
               '.next', '.nuxt', '.cache', 'tmp', 'temp'],

  // Include test files (.test.js, .spec.ts…) · Incluir archivos de prueba
  includeTests: true,   // default: true

  // Include .json files · Incluir archivos .json
  includeJson: true,    // default: true

  // Print progress to console · Imprimir progreso en consola
  verbose: false,       // default: false

  // Maximum directory depth · Profundidad máxima de directorio
  maxDepth: Infinity,   // default: Infinity
});
```

---

## 📄 Output Format · Formato de Salida

### `getData()` Object Structure

```jsonc
{
  "stats": {
    "totalFiles": 42,
    "totalImports": 187,
    "resolvedImports": 183,
    "nativeImports": 24,
    "internalImports": 95,
    "externalImports": 64,
    "missingImports": 4
  },
  "nodes": [
    {
      "id": "a1b2c3d4",          // 8-char MD5 hash of relative path
      "path": "src/utils/log.js", // relative path from rootDir
      "name": "log.js",
      "size": 2048,
      "extension": ".js"
    }
  ],
  "edges": [
    {
      "from": "a1b2c3d4",         // source module ID
      "to": "f9e8d7c6",           // target module ID
      "type": "require",          // import type
      "sourceLine": 3,
      "importSource": "./log",
      "resolvedPath": "src/utils/log.js"
    }
  ],
  "imports": [
    {
      "fromModuleId": "a1b2c3d4",
      "fromPath": "src/app.js",
      "importSource": "express",
      "importType": "require",
      "classification": "external", // "native" | "internal" | "external"
      "resolved": true,
      "line": 1
    }
  ],
  "exports": [
    {
      "moduleId": "a1b2c3d4",
      "modulePath": "src/utils/log.js",
      "name": "logger",
      "type": "commonjs-named",   // see export types below
      "line": 45
    }
  ],
  "unresolved": [
    {
      "from": "src/app.js",
      "source": "./missing-module",
      "type": "require",
      "line": 12,
      "reason": "file not found"
    }
  ],
  "nativeModules": ["fs", "path", "crypto"],
  "jsdoc": [
    {
      "file": "/abs/path/to/src/app.js",
      "line": 10,
      "attachedTo": "function",
      "description": "Main entry point",
      "params": [{ "type": "string", "name": "rootDir", "description": "..." }],
      "returns": [{ "type": "Promise", "name": null, "description": "..." }],
      "deprecated": false,
      "since": null,
      "see": []
    }
  ]
}
```

### Export Types · Tipos de Export

| Type | Syntax |
|---|---|
| `commonjs-property` | `module.exports = { a, b }` |
| `commonjs-function` | `module.exports = function foo()` |
| `commonjs-class` | `module.exports = class Foo` |
| `commonjs-variable` | `module.exports = myVar` |
| `commonjs-default` | `module.exports = <expression>` |
| `commonjs-named` | `exports.name = ...` |
| `commonjs-module-named` | `module.exports.name = ...` |
| `function` | `export function foo()` |
| `class` | `export class Foo` |
| `variable` | `export const bar` |
| `default` | `export default ...` |
| `re-export` | `export { a, b as c }` |

---

## 🖥️ CLI Usage · Uso por CLI

```bash
# Analyze current directory · Analizar directorio actual
node src/mapper.js

# Analyze a specific path · Analizar una ruta específica
node src/mapper.js ./src

# Verbose output · Salida detallada
node src/mapper.js ./src --verbose
node src/mapper.js ./src -v

# Analyze without saving files · Analizar sin guardar archivos
node src/mapper.js ./src --no-save
node src/mapper.js ./src -n

# Combine flags · Combinar flags
node src/mapper.js ./src -v -n
```

**Console output example · Ejemplo de salida en consola:**

```
========================================================
     COMPLETE GRAPH MAPPER v3.0 - Full Path Resolution
========================================================

Statistics:
   -------------------------------------------------
   Total modules:    42
   Total imports:    187
   Resolved:         183 (97.9%)
   Native:           24
   Internal:         95
   External:         64
   Missing:          4
   Total exports:    138
   JSDoc blocks:     67
   -------------------------------------------------
   Resolution rate:  97.9%
   Circular deps:    0
```

---

## 🔬 Examples · Ejemplos

### Find all circular dependencies · Encontrar todas las dependencias circulares

```js
const { CompleteGraphMapper } = require('./src/mapper');

const mapper = new CompleteGraphMapper('./src');
await mapper.scan();

const cycles = mapper.detectCircularDependencies();

if (cycles.length === 0) {
  console.log('✅ No circular dependencies!');
} else {
  console.log(`❌ Found ${cycles.length} cycle(s):`);
  for (const cycle of cycles) {
    console.log('  ', cycle.join(' → '));
  }
}
```

### Find the most-imported modules (hubs) · Encontrar los módulos más importados

```js
const data = await analyzeProject('./src');

// Count how many times each module is imported as a target
// Contar cuántas veces se importa cada módulo como destino
const importCounts = {};
for (const edge of data.edges) {
  importCounts[edge.to] = (importCounts[edge.to] || 0) + 1;
}

const hubs = Object.entries(importCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

console.log('Top 5 most-imported modules:');
for (const [id, count] of hubs) {
  const node = data.nodes.find(n => n.id === id);
  console.log(`  ${node.path} — imported by ${count} modules`);
}
```

### Extract all unresolved imports · Extraer todos los imports no resueltos

```js
const data = await analyzeProject('./src', { verbose: false });

if (data.unresolved.length > 0) {
  console.log('⚠️  Unresolved imports:');
  for (const u of data.unresolved) {
    console.log(`  ${u.from}:${u.line}  →  '${u.source}'  (${u.reason})`);
  }
}
```

### Feed context into an LLM · Alimentar contexto a un LLM

```js
const { CompleteGraphMapper } = require('./src/mapper');

const mapper = new CompleteGraphMapper('./src');
await mapper.scan();

// Compact markdown summary — ideal for LLM context windows
// Resumen Markdown compacto — ideal para ventanas de contexto LLM
const context = mapper.getSummary();

// Send to your LLM API here · Envía a tu API de LLM aquí
await callLLM({
  system: 'You are a senior software engineer reviewing a Node.js project.',
  user: `Here is the full dependency context:\n\n${context}\n\nWhat refactors would you suggest?`,
});
```

### Skip test files, limit depth · Omitir archivos de prueba, limitar profundidad

```js
const data = await analyzeProject('./src', {
  includeTests: false,
  includeJson: false,
  maxDepth: 3,
  ignoreDirs: ['node_modules', 'dist', 'legacy'],
});

console.log(`Scanned ${data.stats.totalFiles} production files`);
```

---

## 🏗️ Architecture · Arquitectura

```
mapper.js
│
├── CompleteGraphMapper (class)
│   │
│   ├── Resolution Layer · Capa de Resolución
│   │   ├── isNativeModule()       — Node.js built-ins (35 modules)
│   │   ├── isExternalModule()     — node_modules detection
│   │   ├── resolveInternalPath()  — relative imports with extension fallback
│   │   ├── resolveExternalModule()— walks up tree looking for node_modules
│   │   └── resolvePath()          — classifier + dispatcher
│   │
│   ├── Extraction Layer · Capa de Extracción
│   │   ├── analyzeImports()       — regex-based CJS + ESM import detection
│   │   ├── extractExports()       — CJS + ESM export detection
│   │   └── extractJSDoc()         — JSDoc block parser with tag extraction
│   │
│   ├── Graph Layer · Capa de Grafo
│   │   ├── scanDirectory()        — recursive FS walk
│   │   ├── processFile()          — per-file orchestrator, updates graph + stats
│   │   └── detectCircularDependencies() — DFS cycle detection
│   │
│   └── Output Layer · Capa de Salida
│       ├── getData()              — plain object snapshot
│       ├── getSummary()           — markdown string
│       ├── saveToFile()           — writes JSON + MD to disk
│       ├── printStats()           — console table
│       └── generateAISummary()    — rich markdown with hubs + recommendations
│
└── Public API · API Pública
    ├── analyzeProject()           — quick one-shot, data only
    └── analyzeAndSave()           — full pipeline with file output
```

**Graph data model · Modelo de datos del grafo:**

```
Node (module)           Edge (dependency)
──────────────          ─────────────────
id: string (MD5)        from: nodeId
path: string            to: nodeId
name: string            type: import kind
size: number            sourceLine: number
extension: string       importSource: string
                        resolvedPath: string
```

---

## 📋 Stats Reference · Referencia de Estadísticas

| Stat | Meaning · Significado |
|---|---|
| `totalFiles` | All files scanned · Todos los archivos escaneados |
| `totalImports` | Every `require`/`import` found · Cada `require`/`import` encontrado |
| `resolvedImports` | Successfully located on disk · Ubicados exitosamente en disco |
| `nativeImports` | Node.js built-in modules (`fs`, `path`…) |
| `internalImports` | Relative imports (`./ ../`) resolved to a file |
| `externalImports` | `node_modules` packages |
| `missingImports` | Imports that could not be resolved · Imports que no pudieron resolverse |

---

## 📝 License · Licencia

MIT © MadScientist-HN One Guy Team

---

<div align="center">

*Built with zero external dependencies · Construido sin dependencias externas*

</div>
