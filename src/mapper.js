/**
 * Complete Graph Project Context Mapper v1.0.0 - Full Path Resolution
 *
 * English: Analyzes JavaScript/TypeScript projects, builds a dependency graph,
 * resolves all import types (native, internal, external), extracts exports and JSDoc.
 *
 * Spanish: Analiza proyectos JavaScript/TypeScript, construye un grafo de dependencias,
 * resuelve todos los tipos de imports (nativos, internos, externos), extrae exports y JSDoc.
 *
 * @module complete-graph-mapper
 * @author BEATRIZ Team
 * @version 3.0.0
 * @license MIT
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Complete Graph Mapper Class
 *
 * English: Main class for scanning directories, analyzing imports/exports,
 * building dependency graphs, and generating context maps for AI consumption.
 *
 * Spanish: Clase principal para escanear directorios, analizar imports/exports,
 * construir grafos de dependencias y generar mapas de contexto para consumo de IA.
 *
 * @class CompleteGraphMapper
 */
class CompleteGraphMapper {
  /**
   * Create a new CompleteGraphMapper instance
   *
   * English: Initializes the mapper with root directory and configuration options.
   * Spanish: Inicializa el mapeador con directorio raíz y opciones de configuración.
   *
   * @constructor
   * @param {string} rootDir - English: Root directory to scan / Spanish: Directorio raíz a escanear
   * @param {Object} [options] - English: Configuration options / Spanish: Opciones de configuración
   * @param {string[]} [options.extensions] - English: File extensions to include / Spanish: Extensiones de archivo a incluir
   * @param {string[]} [options.ignoreDirs] - English: Directories to ignore / Spanish: Directorios a ignorar
   * @param {boolean} [options.includeTests=true] - English: Include test files / Spanish: Incluir archivos de prueba
   * @param {boolean} [options.includeJson=true] - English: Include JSON files / Spanish: Incluir archivos JSON
   * @param {boolean} [options.verbose=false] - English: Enable verbose logging / Spanish: Habilitar logging detallado
   * @param {number} [options.maxDepth=Infinity] - English: Maximum scan depth / Spanish: Profundidad máxima de escaneo
   */
  constructor(rootDir, options = {}) {
    /** @type {string} - English: Absolute path to root directory / Spanish: Ruta absoluta al directorio raíz */
    this.rootDir = path.resolve(rootDir);

    /** @type {Object} - English: Configuration options / Spanish: Opciones de configuración */
    this.options = {
      extensions: options.extensions || [
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".mjs",
        ".cjs",
        ".json",
      ],
      ignoreDirs: options.ignoreDirs || [
        "node_modules",
        ".git",
        "dist",
        "build",
        "coverage",
        ".next",
        ".nuxt",
        ".cache",
        "tmp",
        "temp",
        "__pycache__",
        ".vscode",
        ".idea",
      ],
      includeTests: options.includeTests !== false,
      includeJson: options.includeJson !== false,
      verbose: options.verbose || false,
      maxDepth: options.maxDepth || Infinity,
      ...options,
    };

    /**
     * Graph data structure
     * English: Stores all analysis results including nodes, edges, modules and unresolved imports
     * Spanish: Almacena todos los resultados del análisis incluyendo nodos, aristas, módulos e imports no resueltos
     */
    this.graph = {
      /** @type {Array} - English: Module nodes / Spanish: Nodos de módulos */
      nodes: [],
      /** @type {Array} - English: Dependency edges / Spanish: Aristas de dependencias */
      edges: [],
      /** @type {Map} - English: Module path to ID mapping / Spanish: Mapeo de ruta de módulo a ID */
      modules: new Map(),
      /** @type {Set} - English: Native modules used / Spanish: Módulos nativos utilizados */
      nativeModules: new Set(),
      /** @type {Array} - English: Unresolved imports / Spanish: Imports no resueltos */
      unresolved: [],
    };

    /** @type {Map} - English: Path resolution cache / Spanish: Caché de resolución de rutas */
    this.pathCache = new Map();

    /**
     * Native Node.js modules list
     * English: Complete set of Node.js built-in modules for classification
     * Spanish: Conjunto completo de módulos nativos de Node.js para clasificación
     */
    this.NATIVE_MODULES = new Set([
      "fs",
      "fs/promises",
      "path",
      "crypto",
      "stream",
      "events",
      "util",
      "worker_threads",
      "child_process",
      "os",
      "net",
      "http",
      "https",
      "url",
      "querystring",
      "zlib",
      "readline",
      "assert",
      "tty",
      "dns",
      "dgram",
      "tls",
      "cluster",
      "process",
      "buffer",
      "string_decoder",
      "timers",
      "inspector",
      "async_hooks",
      "perf_hooks",
      "trace_events",
      "module",
      "vm",
      "v8",
      "repl",
      "console",
      "constants",
      "domain",
      "punycode",
      "sys",
      "crypto/constants",
    ]);

    /** @type {Array} - English: Extracted exports / Spanish: Exports extraídos */
    this.exports = [];

    /** @type {Array} - English: Extracted imports / Spanish: Imports extraídos */
    this.imports = [];

    /** @type {Array} - English: Extracted JSDoc blocks / Spanish: Bloques JSDoc extraídos */
    this.jsdoc = [];

    /**
     * Analysis statistics
     * English: Counter for various import types and resolution rates
     * Spanish: Contadores para varios tipos de imports y tasas de resolución
     */
    this.stats = {
      /** @type {number} - English: Total files processed / Spanish: Total de archivos procesados */
      totalFiles: 0,
      /** @type {number} - English: Total imports found / Spanish: Total de imports encontrados */
      totalImports: 0,
      /** @type {number} - English: Successfully resolved imports / Spanish: Imports resueltos exitosamente */
      resolvedImports: 0,
      /** @type {number} - English: Native module imports / Spanish: Imports de módulos nativos */
      nativeImports: 0,
      /** @type {number} - English: Internal module imports / Spanish: Imports de módulos internos */
      internalImports: 0,
      /** @type {number} - English: External module imports / Spanish: Imports de módulos externos */
      externalImports: 0,
      /** @type {number} - English: Failed/missing imports / Spanish: Imports fallidos/no encontrados */
      missingImports: 0,
    };

    /** @type {Array} - English: Supported file extensions / Spanish: Extensiones de archivo soportadas */
    this.EXTENSIONS = this.options.extensions;

    /** @type {Set} - English: Directories to ignore during scan / Spanish: Directorios a ignorar durante el escaneo */
    this.IGNORE_DIRS = new Set(this.options.ignoreDirs);
  }

  /**
   * Generate a unique module ID from file path
   *
   * English: Creates an MD5 hash of the relative path and returns first 8 characters
   * Spanish: Crea un hash MD5 de la ruta relativa y retorna los primeros 8 caracteres
   *
   * @param {string} filePath - English: Absolute file path / Spanish: Ruta absoluta del archivo
   * @returns {string} - English: 8-character module identifier / Spanish: Identificador de módulo de 8 caracteres
   */
  getModuleId(filePath) {
    const relativePath = path.relative(this.rootDir, filePath);
    return crypto
      .createHash("md5")
      .update(relativePath)
      .digest("hex")
      .slice(0, 8);
  }

  /**
   * Check if import path is a Node.js native module
   *
   * English: Determines whether the given import path corresponds to a built-in Node.js module
   * Spanish: Determina si la ruta de import corresponde a un módulo nativo de Node.js
   *
   * @param {string} importPath - English: Import path to check / Spanish: Ruta de import a verificar
   * @returns {boolean} - English: True if native module / Spanish: Verdadero si es módulo nativo
   */
  isNativeModule(importPath) {
    const cleanPath = importPath.replace(/^node:/, "");
    return this.NATIVE_MODULES.has(cleanPath);
  }

  /**
   * Check if import path is an external module (node_modules)
   *
   * English: Determines whether the import path refers to a third-party module
   * Spanish: Determina si la ruta de import se refiere a un módulo de terceros
   *
   * @param {string} importPath - English: Import path to check / Spanish: Ruta de import a verificar
   * @returns {boolean} - English: True if external module / Spanish: Verdadero si es módulo externo
   */
  isExternalModule(importPath) {
    return (
      !importPath.startsWith(".") &&
      !importPath.startsWith("/") &&
      !/^[a-zA-Z]:[/\\]/.test(importPath)
    );
  }

  /**
   * Resolve external (node_modules) module path
   *
   * English: Searches for module in node_modules directories, supports package.json main entry
   * Spanish: Busca el módulo en directorios node_modules, soporta entrada principal de package.json
   *
   * @param {string} importPath - English: Module import path / Spanish: Ruta de import del módulo
   * @param {string} currentFilePath - English: Current file path for context / Spanish: Ruta del archivo actual para contexto
   * @returns {string|null} - English: Resolved absolute path or null / Spanish: Ruta absoluta resuelta o null
   */
  resolveExternalModule(importPath, currentFilePath) {
    const cacheKey = `external:${importPath}`;
    if (this.pathCache.has(cacheKey)) return this.pathCache.get(cacheKey);

    let searchDir = path.dirname(currentFilePath);
    const rootPath = this.rootDir;

    while (searchDir.length >= rootPath.length) {
      const modulePath = path.join(searchDir, "node_modules", importPath);

      for (const ext of this.EXTENSIONS) {
        const testPath = modulePath + ext;
        if (fs.existsSync(testPath)) {
          this.pathCache.set(cacheKey, testPath);
          return testPath;
        }
      }

      for (const ext of this.EXTENSIONS) {
        const indexPath = path.join(modulePath, "index" + ext);
        if (fs.existsSync(indexPath)) {
          this.pathCache.set(cacheKey, indexPath);
          return indexPath;
        }
      }

      const pkgPath = path.join(modulePath, "package.json");
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
          if (pkg.main) {
            const mainPath = path.join(modulePath, pkg.main);
            if (fs.existsSync(mainPath)) {
              this.pathCache.set(cacheKey, mainPath);
              return mainPath;
            }
          }
        } catch (e) {}
      }

      const parent = path.dirname(searchDir);
      if (parent === searchDir) break;
      searchDir = parent;
    }

    this.pathCache.set(cacheKey, null);
    return null;
  }

  /**
   * Resolve internal (relative) module path
   *
   * English: Resolves relative imports (./, ../) to absolute file paths
   * Spanish: Resuelve imports relativos (./, ../) a rutas de archivo absolutas
   *
   * @param {string} importPath - English: Relative import path / Spanish: Ruta de import relativa
   * @param {string} currentFilePath - English: Current file path for context / Spanish: Ruta del archivo actual para contexto
   * @returns {string|null} - English: Resolved absolute path or null / Spanish: Ruta absoluta resuelta o null
   */
  resolveInternalPath(importPath, currentFilePath) {
    const cacheKey = `${currentFilePath}:${importPath}`;
    if (this.pathCache.has(cacheKey)) return this.pathCache.get(cacheKey);

    const currentDir = path.dirname(currentFilePath);
    let resolvedPath;

    if (importPath.startsWith("/")) {
      resolvedPath = path.join(this.rootDir, importPath);
    } else if (/^[a-zA-Z]:[/\\]/.test(importPath)) {
      resolvedPath = importPath;
    } else {
      resolvedPath = path.resolve(currentDir, importPath);
    }

    resolvedPath = path.normalize(resolvedPath);

    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
      this.pathCache.set(cacheKey, resolvedPath);
      return resolvedPath;
    }

    for (const ext of this.EXTENSIONS) {
      const testPath = resolvedPath + ext;
      if (fs.existsSync(testPath)) {
        this.pathCache.set(cacheKey, testPath);
        return testPath;
      }
    }

    for (const ext of this.EXTENSIONS) {
      const indexPath = path.join(resolvedPath, "index" + ext);
      if (fs.existsSync(indexPath)) {
        this.pathCache.set(cacheKey, indexPath);
        return indexPath;
      }
    }

    const fileName = path.basename(importPath);
    const possibleMatch = this.findFileInProject(fileName, currentFilePath);
    if (possibleMatch) {
      this.pathCache.set(cacheKey, possibleMatch);
      return possibleMatch;
    }

    this.pathCache.set(cacheKey, null);
    return null;
  }

  /**
   * Find file by name across the entire project
   *
   * English: Searches all scanned modules for a file with matching basename
   * Spanish: Busca en todos los módulos escaneados un archivo con el mismo nombre base
   *
   * @param {string} fileName - English: Target file name / Spanish: Nombre del archivo objetivo
   * @param {string} currentFilePath - English: Current file to exclude from search / Spanish: Archivo actual para excluir de la búsqueda
   * @returns {string|null} - English: Found file path or null / Spanish: Ruta del archivo encontrado o null
   */
  findFileInProject(fileName, currentFilePath) {
    const baseName = fileName.replace(/\.(js|jsx|ts|tsx|mjs|cjs|json)$/, "");

    for (const [filePath] of this.graph.modules) {
      const fileBaseName = path
        .basename(filePath)
        .replace(/\.(js|jsx|ts|tsx|mjs|cjs|json)$/, "");
      if (fileBaseName === baseName && filePath !== currentFilePath) {
        return filePath;
      }
    }

    return null;
  }

  /**
   * Classify and resolve an import path
   *
   * English: Determines import type (native/internal/external) and resolves to absolute path
   * Spanish: Determina el tipo de import (nativo/interno/externo) y resuelve a ruta absoluta
   *
   * @param {string} importPath - English: Import path to resolve / Spanish: Ruta de import a resolver
   * @param {string} currentFilePath - English: Current file path for context / Spanish: Ruta del archivo actual para contexto
   * @returns {Object} - English: Resolution result with type and resolved path / Spanish: Resultado de resolución con tipo y ruta resuelta
   * @returns {string} returns.type - English: Import type: 'native', 'internal', or 'external' / Spanish: Tipo de import: 'native', 'internal', o 'external'
   * @returns {boolean} returns.resolved - English: Whether resolution succeeded / Spanish: Si la resolución fue exitosa
   * @returns {string|null} returns.resolvedPath - English: Resolved absolute path or null / Spanish: Ruta absoluta resuelta o null
   */
  resolvePath(importPath, currentFilePath) {
    importPath = importPath.replace(/\\/g, "/");

    if (this.isNativeModule(importPath)) {
      return { type: "native", resolved: true, resolvedPath: null };
    }

    if (this.isExternalModule(importPath)) {
      const resolved = this.resolveExternalModule(importPath, currentFilePath);
      if (resolved) {
        return { type: "external", resolved: true, resolvedPath: resolved };
      }
      return { type: "external", resolved: false, resolvedPath: null };
    }

    if (
      importPath.startsWith(".") ||
      importPath.startsWith("/") ||
      /^[a-zA-Z]:[/\\]/.test(importPath)
    ) {
      const resolved = this.resolveInternalPath(importPath, currentFilePath);
      if (resolved) {
        return { type: "internal", resolved: true, resolvedPath: resolved };
      }
      return { type: "internal", resolved: false, resolvedPath: null };
    }

    return { type: "external", resolved: false, resolvedPath: null };
  }

  /**
   * Analyze all imports in a source file
   *
   * English: Extracts all require(), import(), and export-from statements from source code
   * Spanish: Extrae todas las declaraciones require(), import() y export-from del código fuente
   *
   * @param {string} source - English: Source code content / Spanish: Contenido del código fuente
   * @param {string} filePath - English: File path for context / Spanish: Ruta del archivo para contexto
   * @returns {Array} - English: Array of import objects with type, source, line and context / Spanish: Array de objetos import con tipo, fuente, línea y contexto
   */
  analyzeAllImports(source, filePath) {
    const imports = [];

    const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    let match;
    while ((match = requireRegex.exec(source)) !== null) {
      const lineNumber = this.getLineNumber(source, match.index);
      imports.push({
        type: "require",
        source: match[1],
        line: lineNumber,
        context: this.extractContext(source, match.index, 80),
      });
    }

    const requireResolveRegex =
      /require\.resolve\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    while ((match = requireResolveRegex.exec(source)) !== null) {
      const lineNumber = this.getLineNumber(source, match.index);
      imports.push({
        type: "require-resolve",
        source: match[1],
        line: lineNumber,
        context: this.extractContext(source, match.index, 80),
      });
    }

    const dynamicImportRegex = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    while ((match = dynamicImportRegex.exec(source)) !== null) {
      const lineNumber = this.getLineNumber(source, match.index);
      imports.push({
        type: "import-dynamic",
        source: match[1],
        line: lineNumber,
        context: this.extractContext(source, match.index, 80),
      });
    }

    const staticImportRegex =
      /import\s+(?:(?:\{([^}]+)\})|(?:(\w+)(?:\s*,\s*\{([^}]+)\})?)|(?:\*\s+as\s+(\w+)))\s+from\s+['"]([^'"]+)['"]/g;
    while ((match = staticImportRegex.exec(source)) !== null) {
      const lineNumber = this.getLineNumber(source, match.index);
      imports.push({
        type: "import-static",
        source: match[5],
        line: lineNumber,
      });
    }

    const exportFromRegex =
      /export\s+(?:\{\s*([^}]+)\s*\}|\*\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    while ((match = exportFromRegex.exec(source)) !== null) {
      const lineNumber = this.getLineNumber(source, match.index);
      imports.push({
        type: "export-from",
        source: match[3],
        line: lineNumber,
      });
    }

    return imports;
  }

  /**
   * Get line number from source code position
   *
   * English: Counts newlines before the given character index to determine line number
   * Spanish: Cuenta los saltos de línea antes del índice de carácter dado para determinar el número de línea
   *
   * @param {string} source - English: Source code content / Spanish: Contenido del código fuente
   * @param {number} index - English: Character index position / Spanish: Posición del índice de carácter
   * @returns {number} - English: 1-based line number / Spanish: Número de línea base 1
   */
  getLineNumber(source, index) {
    return source.slice(0, index).split("\n").length;
  }

  /**
   * Extract code context around a position
   *
   * English: Returns a snippet of code surrounding the given position for debugging
   * Spanish: Retorna un fragmento de código alrededor de la posición dada para depuración
   *
   * @param {string} source - English: Source code content / Spanish: Contenido del código fuente
   * @param {number} position - English: Character position / Spanish: Posición del carácter
   * @param {number} [length=100] - English: Maximum context length / Spanish: Longitud máxima del contexto
   * @returns {string} - English: Context snippet / Spanish: Fragmento de contexto
   */
  extractContext(source, position, length = 100) {
    const start = Math.max(0, position - 40);
    const end = Math.min(source.length, position + length);
    let context = source.slice(start, end);
    context = context.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    return context.length > length ? context.slice(0, length) + "..." : context;
  }

  /**
   * Extract exports from source file
   *
   * English: Detects CommonJS (module.exports, exports.name) and ES module exports
   * Spanish: Detecta exports de CommonJS (module.exports, exports.name) y módulos ES
   *
   * @param {string} source - English: Source code content / Spanish: Contenido del código fuente
   * @param {string} filePath - English: File path for reference / Spanish: Ruta del archivo para referencia
   * @returns {Array} - English: Array of export objects with name, type and line / Spanish: Array de objetos export con nombre, tipo y línea
   */
  extractExports(source, filePath) {
    const exports = [];

    const moduleExportsRegex = /module\.exports\s*=\s*([^;]+);?/g;
    let match;
    while ((match = moduleExportsRegex.exec(source)) !== null) {
      const lineNumber = this.getLineNumber(source, match.index);
      const exportValue = match[1].trim();

      const objectMatch = exportValue.match(/^\{([\s\S]*)\}$/);
      if (objectMatch) {
        const props = this.extractObjectProperties(objectMatch[1]);
        for (const prop of props) {
          exports.push({
            name: prop,
            type: "commonjs-property",
            line: lineNumber,
          });
        }
      } else if (exportValue.match(/^function\s+(\w+)/)) {
        const funcMatch = exportValue.match(/^function\s+(\w+)/);
        exports.push({
          name: funcMatch[1],
          type: "commonjs-function",
          line: lineNumber,
        });
      } else if (exportValue.match(/^class\s+(\w+)/)) {
        const classMatch = exportValue.match(/^class\s+(\w+)/);
        exports.push({
          name: classMatch[1],
          type: "commonjs-class",
          line: lineNumber,
        });
      } else if (exportValue.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        exports.push({
          name: exportValue,
          type: "commonjs-variable",
          line: lineNumber,
        });
      } else {
        exports.push({
          name: "default",
          type: "commonjs-default",
          value: exportValue.substring(0, 100),
          line: lineNumber,
        });
      }
    }

    const namedExportRegex = /exports\.(\w+)\s*=/g;
    while ((match = namedExportRegex.exec(source)) !== null) {
      const lineNumber = this.getLineNumber(source, match.index);
      exports.push({
        name: match[1],
        type: "commonjs-named",
        line: lineNumber,
      });
    }

    const moduleNamedExportRegex = /module\.exports\.(\w+)\s*=/g;
    while ((match = moduleNamedExportRegex.exec(source)) !== null) {
      const lineNumber = this.getLineNumber(source, match.index);
      exports.push({
        name: match[1],
        type: "commonjs-module-named",
        line: lineNumber,
      });
    }

    const exportNamedRegex =
      /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    while ((match = exportNamedRegex.exec(source)) !== null) {
      const lineNumber = this.getLineNumber(source, match.index);
      exports.push({
        name: match[1],
        type: match[0].includes("function")
          ? "function"
          : match[0].includes("class")
            ? "class"
            : "variable",
        line: lineNumber,
      });
    }

    const exportDefaultRegex = /export\s+default\s+(?:function\s+)?(\w+)/g;
    while ((match = exportDefaultRegex.exec(source)) !== null) {
      const lineNumber = this.getLineNumber(source, match.index);
      exports.push({
        name: match[1] || "default",
        type: "default",
        line: lineNumber,
      });
    }

    const exportListRegex = /export\s+\{([^}]+)\}/g;
    while ((match = exportListRegex.exec(source)) !== null) {
      const lineNumber = this.getLineNumber(source, match.index);
      const items = this.extractExportItems(match[1]);
      for (const item of items) {
        exports.push({
          name: item.exported,
          local: item.local,
          type: "re-export",
          line: lineNumber,
        });
      }
    }

    return exports;
  }

  /**
   * Extract property names from object literal
   *
   * English: Parses object literal syntax to extract property names
   * Spanish: Analiza la sintaxis de objeto literal para extraer nombres de propiedades
   *
   * @param {string} objStr - English: Object literal string / Spanish: String de objeto literal
   * @returns {string[]} - English: Array of property names / Spanish: Array de nombres de propiedades
   */
  extractObjectProperties(objStr) {
    const props = [];
    const propRegex = /(\w+)(?:\s*:\s*(\w+))?/g;
    let match;
    while ((match = propRegex.exec(objStr)) !== null) {
      if (match[1]) props.push(match[2] || match[1]);
    }
    return props;
  }

  /**
   * Extract export items from export list
   *
   * English: Parses export { a, b as c } syntax to extract local and exported names
   * Spanish: Analiza la sintaxis export { a, b as c } para extraer nombres locales y exportados
   *
   * @param {string} itemsStr - English: Export list string / Spanish: String de lista de exports
   * @returns {Array} - English: Array of {local, exported} objects / Spanish: Array de objetos {local, exported}
   */
  extractExportItems(itemsStr) {
    const items = [];
    const itemRegex = /(\w+)(?:\s+as\s+(\w+))?/g;
    let match;
    while ((match = itemRegex.exec(itemsStr)) !== null) {
      if (match[1])
        items.push({ local: match[1], exported: match[2] || match[1] });
    }
    return items;
  }

  /**
   * Extract JSDoc comments from source
   *
   * English: Parses JSDoc blocks, extracts description, @param, @returns, @deprecated, etc.
   * Spanish: Analiza bloques JSDoc, extrae descripción, @param, @returns, @deprecated, etc.
   *
   * @param {string} source - English: Source code content / Spanish: Contenido del código fuente
   * @param {string} filePath - English: File path for reference / Spanish: Ruta del archivo para referencia
   * @returns {Array} - English: Array of JSDoc objects with metadata / Spanish: Array de objetos JSDoc con metadatos
   */
  extractJSDoc(source, filePath) {
    const jsdocRegex = /\/\*\*([\s\S]*?)\*\//g;
    const tags = [];
    let match;

    const cleanedSource = source.replace(/\/\/[^\n]*/g, "");

    while ((match = jsdocRegex.exec(cleanedSource)) !== null) {
      const comment = match[1];
      const lineNumber = this.getLineNumber(cleanedSource, match.index);

      const afterComment = cleanedSource.slice(match.index + match[0].length);
      const nextLineMatch = afterComment.match(/^[\s]*(\w+)/);
      const attachedTo = nextLineMatch ? nextLineMatch[1] : null;

      tags.push({
        file: filePath,
        line: lineNumber,
        attachedTo: attachedTo,
        description: this.extractDescription(comment),
        params: this.extractTags(comment, "@param"),
        returns: this.extractTags(comment, "@returns"),
        deprecated: comment.includes("@deprecated"),
        since: this.extractTagValue(comment, "@since"),
        see: this.extractTagValues(comment, "@see"),
      });
    }

    return tags;
  }

  /**
   * Extract description from JSDoc comment
   *
   * English: Retrieves the first paragraph of text before any @tags
   * Spanish: Obtiene el primer párrafo de texto antes de cualquier @tag
   *
   * @param {string} comment - English: JSDoc comment content / Spanish: Contenido del comentario JSDoc
   * @returns {string} - English: Description text (max 300 chars) / Spanish: Texto de descripción (máx 300 caracteres)
   */
  extractDescription(comment) {
    const lines = comment.split("\n");
    const desc = [];
    for (let line of lines) {
      const cleanLine = line.replace(/^\s*\*+\s?/, "").trim();
      if (cleanLine && !cleanLine.startsWith("@")) {
        desc.push(cleanLine);
      } else if (cleanLine.startsWith("@")) {
        break;
      }
    }
    return desc.join(" ").substring(0, 300);
  }

  /**
   * Extract specific tags from JSDoc comment
   *
   * English: Extracts all occurrences of a given tag with their type and description
   * Spanish: Extrae todas las ocurrencias de una etiqueta dada con su tipo y descripción
   *
   * @param {string} comment - English: JSDoc comment content / Spanish: Contenido del comentario JSDoc
   * @param {string} tagName - English: Tag name to extract (e.g., '@param') / Spanish: Nombre de la etiqueta a extraer (ej. '@param')
   * @returns {Array} - English: Array of tag objects with type, name and description / Spanish: Array de objetos tag con tipo, nombre y descripción
   */
  extractTags(comment, tagName) {
    const pattern = new RegExp(
      `${tagName}\\s+\\{([^}]+)\\}\\s+([^\\n@]+)`,
      "g",
    );
    const matches = [];
    let match;
    while ((match = pattern.exec(comment)) !== null) {
      matches.push({
        type: match[1].trim(),
        name: this.extractParamName(match[2]),
        description: this.extractParamDesc(match[2]),
      });
    }
    return matches;
  }

  /**
   * Extract parameter name from JSDoc param
   *
   * English: Parses parameter name from patterns like "name - description" or "[name]"
   * Spanish: Analiza el nombre del parámetro desde patrones como "nombre - descripción" o "[nombre]"
   *
   * @param {string} text - English: Parameter text / Spanish: Texto del parámetro
   * @returns {string|null} - English: Parameter name or null / Spanish: Nombre del parámetro o null
   */
  extractParamName(text) {
    const match = text.match(/(?:(\w+)\s+-\s+)|(?:\[(\w+)\])/);
    return match ? match[1] || match[2] : null;
  }

  /**
   * Extract parameter description from JSDoc param
   *
   * English: Strips parameter name prefix to get clean description
   * Spanish: Elimina el prefijo del nombre del parámetro para obtener la descripción limpia
   *
   * @param {string} text - English: Parameter text / Spanish: Texto del parámetro
   * @returns {string} - English: Parameter description / Spanish: Descripción del parámetro
   */
  extractParamDesc(text) {
    return text
      .replace(/^\w+\s*-\s*/, "")
      .replace(/^\[(\w+)\]/, "")
      .trim();
  }

  /**
   * Extract all values for a given JSDoc tag
   *
   * English: Extracts all values for tags like @see that don't have braces
   * Spanish: Extrae todos los valores de etiquetas como @see que no tienen llaves
   *
   * @param {string} comment - English: JSDoc comment content / Spanish: Contenido del comentario JSDoc
   * @param {string} tagName - English: Tag name to extract / Spanish: Nombre de la etiqueta a extraer
   * @returns {string[]} - English: Array of tag values / Spanish: Array de valores de etiqueta
   */
  extractTagValues(comment, tagName) {
    const pattern = new RegExp(`${tagName}\\s+([^\\n@]+)`, "g");
    const values = [];
    let match;
    while ((match = pattern.exec(comment)) !== null) {
      values.push(match[1].trim());
    }
    return values;
  }

  /**
   * Extract a single value for a given JSDoc tag
   *
   * English: Extracts the value for a tag that appears once (like @since)
   * Spanish: Extrae el valor de una etiqueta que aparece una vez (como @since)
   *
   * @param {string} comment - English: JSDoc comment content / Spanish: Contenido del comentario JSDoc
   * @param {string} tagName - English: Tag name to extract / Spanish: Nombre de la etiqueta a extraer
   * @returns {string|null} - English: Tag value or null / Spanish: Valor de la etiqueta o null
   */
  extractTagValue(comment, tagName) {
    const pattern = new RegExp(`${tagName}\\s+([^\\n]+)`);
    const match = pattern.exec(comment);
    return match ? match[1].trim() : null;
  }

  /**
   * Scan directory recursively for files
   *
   * English: Walks through directory tree, collects files matching extensions, respects ignore list
   * Spanish: Recorre el árbol de directorios, recolecta archivos que coinciden con extensiones, respeta lista de ignorados
   *
   * @param {string} dir - English: Directory to scan / Spanish: Directorio a escanear
   * @param {Array} [fileList=[]] - English: Accumulator for found files / Spanish: Acumulador de archivos encontrados
   * @param {number} [depth=0] - English: Current recursion depth / Spanish: Profundidad actual de recursión
   * @returns {Array} - English: Array of absolute file paths / Spanish: Array de rutas absolutas de archivos
   */
  scanDirectory(dir, fileList = [], depth = 0) {
    if (depth > this.options.maxDepth) return fileList;

    try {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        try {
          const stat = fs.statSync(filePath);

          if (stat.isDirectory()) {
            if (!this.IGNORE_DIRS.has(file) && !file.startsWith(".")) {
              this.scanDirectory(filePath, fileList, depth + 1);
            }
          } else {
            const shouldInclude = this.EXTENSIONS.some((ext) =>
              file.endsWith(ext),
            );
            if (shouldInclude) {
              if (!this.options.includeTests && file.includes(".test."))
                continue;
              if (!this.options.includeJson && file.endsWith(".json")) continue;
              fileList.push(filePath);
            }
          }
        } catch (err) {
          if (this.options.verbose)
            console.warn(`Cannot access ${filePath}: ${err.message}`);
        }
      }
    } catch (err) {
      if (this.options.verbose)
        console.warn(`Cannot read directory ${dir}: ${err.message}`);
    }

    return fileList;
  }

  /**
   * Process a single file: extract imports, exports, JSDoc
   *
   * English: Reads file content, analyzes imports, exports and JSDoc, updates statistics and graph
   * Spanish: Lee el contenido del archivo, analiza imports, exports y JSDoc, actualiza estadísticas y grafo
   *
   * @param {string} filePath - English: Absolute file path to process / Spanish: Ruta absoluta del archivo a procesar
   * @returns {void}
   */
  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const moduleId = this.getModuleId(filePath);
      const relativePath = path.relative(this.rootDir, filePath);

      this.graph.modules.set(filePath, moduleId);

      const imports = this.analyzeAllImports(content, filePath);
      const exports = this.extractExports(content, filePath);
      const jsdoc = this.extractJSDoc(content, filePath);

      this.stats.totalFiles++;
      this.stats.totalImports += imports.length;

      this.graph.nodes.push({
        id: moduleId,
        path: relativePath,
        exportsCount: exports.length,
        importsCount: imports.length,
        jsdocCount: jsdoc.length,
        size: content.length,
      });

      for (const imp of imports) {
        const resolution = this.resolvePath(imp.source, filePath);

        if (resolution.type === "native") {
          this.stats.nativeImports++;
          this.stats.resolvedImports++;
          this.graph.nativeModules.add(imp.source);
        } else if (resolution.type === "internal" && resolution.resolved) {
          this.stats.internalImports++;
          this.stats.resolvedImports++;
          const targetId = this.getModuleId(resolution.resolvedPath);
          this.graph.edges.push({
            from: moduleId,
            to: targetId,
            type: imp.type,
            sourceLine: imp.line,
            importSource: imp.source,
            resolvedPath: path.relative(this.rootDir, resolution.resolvedPath),
          });
        } else if (resolution.type === "external" && resolution.resolved) {
          this.stats.externalImports++;
          this.stats.resolvedImports++;
        } else if (resolution.type === "external" && !resolution.resolved) {
          this.stats.externalImports++;
          this.graph.unresolved.push({
            from: relativePath,
            source: imp.source,
            type: imp.type,
            line: imp.line,
            reason: "external module not found in node_modules",
          });
        } else {
          this.stats.missingImports++;
          this.graph.unresolved.push({
            from: relativePath,
            source: imp.source,
            type: imp.type,
            line: imp.line,
            reason: "file not found",
          });
        }

        this.imports.push({
          fromModuleId: moduleId,
          fromPath: relativePath,
          importSource: imp.source,
          importType: imp.type,
          classification: resolution.type,
          resolved: resolution.resolved,
          line: imp.line,
          context: imp.context,
        });
      }

      for (const exp of exports) {
        this.exports.push({
          moduleId: moduleId,
          modulePath: relativePath,
          ...exp,
        });
      }

      for (const doc of jsdoc) {
        this.jsdoc.push(doc);
      }
    } catch (err) {
      if (this.options.verbose)
        console.error(`Error processing ${filePath}: ${err.message}`);
    }
  }

  /**
   * Detect circular dependencies in the graph
   *
   * English: Uses DFS to find cycles in the dependency graph
   * Spanish: Utiliza DFS para encontrar ciclos en el grafo de dependencias
   *
   * @returns {Array} - English: Array of cycles, each cycle is array of node IDs / Spanish: Array de ciclos, cada ciclo es un array de IDs de nodos
   */
  detectCircularDependencies() {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (nodeId, path = []) => {
      if (recursionStack.has(nodeId)) {
        const cycleStart = path.indexOf(nodeId);
        if (cycleStart !== -1) cycles.push([...path.slice(cycleStart), nodeId]);
        return;
      }
      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoing = this.graph.edges.filter((e) => e.from === nodeId);
      for (const edge of outgoing) dfs(edge.to, [...path, nodeId]);

      recursionStack.delete(nodeId);
    };

    for (const node of this.graph.nodes) {
      if (!visited.has(node.id)) dfs(node.id);
    }

    return cycles;
  }

  /**
   * Generate AI-readable summary in Markdown format
   *
   * English: Produces a comprehensive markdown report with statistics, hubs, and recommendations
   * Spanish: Produce un reporte completo en markdown con estadísticas, hubs y recomendaciones
   *
   * @returns {string} - English: Markdown formatted summary / Spanish: Resumen formateado en Markdown
   */
  generateAISummary() {
    let summary = "# Complete Graph Context Map for AI\n\n";
    summary += `Generated: ${new Date().toISOString()}\n`;
    summary += `Root: ${this.rootDir}\n\n`;

    summary += `## Executive Summary\n\n`;
    summary += `| Metric | Value |\n`;
    summary += `|--------|-------|\n`;
    summary += `| Total modules | ${this.stats.totalFiles} |\n`;
    summary += `| Total imports | ${this.stats.totalImports} |\n`;
    const resolvedPercent =
      this.stats.totalImports > 0
        ? (
            (this.stats.resolvedImports / this.stats.totalImports) *
            100
          ).toFixed(1)
        : 0;
    summary += `| Resolved | ${this.stats.resolvedImports} (${resolvedPercent}%) |\n`;
    summary += `| Native modules | ${this.stats.nativeImports} |\n`;
    summary += `| Internal deps | ${this.stats.internalImports} |\n`;
    summary += `| External deps | ${this.stats.externalImports} |\n`;
    summary += `| Missing | ${this.stats.missingImports} |\n`;
    summary += `| Total exports | ${this.exports.length} |\n`;
    summary += `| JSDoc blocks | ${this.jsdoc.length} |\n\n`;

    if (this.graph.nativeModules.size > 0) {
      summary += `## Native Modules Used\n\n`;
      summary += `\`\`\`\n${Array.from(this.graph.nativeModules).sort().join(", ")}\n\`\`\`\n\n`;
    }

    const moduleDeps = new Map();
    for (const edge of this.graph.edges) {
      const from = this.graph.nodes.find((n) => n.id === edge.from);
      if (from) moduleDeps.set(from.path, (moduleDeps.get(from.path) || 0) + 1);
    }

    const sortedDeps = Array.from(moduleDeps.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    if (sortedDeps.length > 0) {
      summary += `## Module Dependency Rank\n\n`;
      summary += `| Module | Dependencies |\n`;
      summary += `|--------|--------------|\n`;
      for (const [mod, count] of sortedDeps)
        summary += `| ${mod} | ${count} |\n`;
      summary += `\n`;
    }

    const importCount = new Map();
    for (const edge of this.graph.edges) {
      const to = this.graph.nodes.find((n) => n.id === edge.to);
      if (to) importCount.set(to.path, (importCount.get(to.path) || 0) + 1);
    }

    const sortedImported = Array.from(importCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    if (sortedImported.length > 0) {
      summary += `## Most Imported Modules (Hubs)\n\n`;
      summary += `| Module | Imported By |\n`;
      summary += `|--------|-------------|\n`;
      for (const [mod, count] of sortedImported)
        summary += `| ${mod} | ${count} |\n`;
      summary += `\n`;
    }

    const cycles = this.detectCircularDependencies();
    if (cycles.length > 0) {
      summary += `## Circular Dependencies (${cycles.length})\n\n`;
      for (const cycle of cycles.slice(0, 10)) {
        const cyclePaths = [];
        for (const id of cycle) {
          const node = this.graph.nodes.find((n) => n.id === id);
          if (node) cyclePaths.push(node.path);
        }
        summary += `- ${cyclePaths.join(" -> ")}\n`;
      }
      summary += `\n`;
    } else {
      summary += `## Circular Dependencies\n\nNone detected. Good architecture!\n\n`;
    }

    summary += `## AI Usage Recommendations\n\n`;
    summary += `1. To understand a function, look for its JSDoc in the documents section\n`;
    summary += `2. To modify a module, check who imports it (Most Imported Modules)\n`;
    summary += `3. To add a dependency, verify if it already exists in Native Modules\n`;
    summary += `4. Unresolved imports may be false positives from tests or external modules\n`;
    summary += `5. Hubs (most imported modules) are critical points for refactoring\n\n`;

    return summary;
  }

  /**
   * Main scan method - process all files
   *
   * English: Orchestrates the complete scanning and analysis process
   * Spanish: Orquesta el proceso completo de escaneo y análisis
   *
   * @returns {Promise<CompleteGraphMapper>} - English: This instance for chaining / Spanish: Esta instancia para encadenamiento
   */
  async scan() {
    if (this.options.verbose) console.log(`Scanning: ${this.rootDir}`);
    const files = this.scanDirectory(this.rootDir);
    if (this.options.verbose) console.log(`Found ${files.length} files`);

    for (const file of files) {
      this.processFile(file);
    }

    return this;
  }

  /**
   * Get all analysis data
   *
   * English: Returns the complete analysis results as a plain object
   * Spanish: Retorna los resultados completos del análisis como un objeto plano
   *
   * @returns {Object} - English: Complete analysis data object / Spanish: Objeto con datos completos del análisis
   */
  getData() {
    return {
      stats: this.stats,
      nodes: this.graph.nodes,
      edges: this.graph.edges,
      imports: this.imports,
      exports: this.exports,
      unresolved: this.graph.unresolved,
      nativeModules: Array.from(this.graph.nativeModules),
      jsdoc: this.jsdoc,
    };
  }

  /**
   * Get AI-readable summary
   *
   * English: Returns the markdown summary for AI consumption
   * Spanish: Retorna el resumen en markdown para consumo de IA
   *
   * @returns {string} - English: Markdown formatted summary / Spanish: Resumen formateado en Markdown
   */
  getSummary() {
    return this.generateAISummary();
  }

  /**
   * Save results to JSON and Markdown files
   *
   * English: Writes the analysis data to complete-context-map.json and complete-context-summary.md
   * Spanish: Escribe los datos del análisis en complete-context-map.json y complete-context-summary.md
   *
   * @param {string} [outputDir='./'] - English: Output directory for files / Spanish: Directorio de salida para los archivos
   * @returns {Promise<Object>} - English: Object containing saved file paths / Spanish: Objeto con las rutas de los archivos guardados
   */
  async saveToFile(outputDir = "./") {
    const data = this.getData();
    const summary = this.getSummary();

    const jsonPath = path.join(outputDir, "complete-context-map.json");
    const mdPath = path.join(outputDir, "complete-context-summary.md");

    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    fs.writeFileSync(mdPath, summary);

    if (this.options.verbose) {
      console.log(`Saved: ${jsonPath}`);
      console.log(`Saved: ${mdPath}`);
    }

    return { jsonPath, mdPath };
  }

  /**
   * Print statistics to console
   *
   * English: Displays formatted statistics table with resolution metrics
   * Spanish: Muestra una tabla de estadísticas formateada con métricas de resolución
   *
   * @returns {void}
   */
  printStats() {
    const resolvedPercent =
      this.stats.totalImports > 0
        ? (
            (this.stats.resolvedImports / this.stats.totalImports) *
            100
          ).toFixed(1)
        : 0;
    console.log("");
    console.log("Statistics:");
    console.log(`   -------------------------------------------------`);
    console.log(`   Total modules:    ${this.stats.totalFiles}`);
    console.log(`   Total imports:    ${this.stats.totalImports}`);
    console.log(
      `   Resolved:         ${this.stats.resolvedImports} (${resolvedPercent}%)`,
    );
    console.log(`   Native:           ${this.stats.nativeImports}`);
    console.log(`   Internal:         ${this.stats.internalImports}`);
    console.log(`   External:         ${this.stats.externalImports}`);
    console.log(`   Missing:          ${this.stats.missingImports}`);
    console.log(`   Total exports:    ${this.exports.length}`);
    console.log(`   JSDoc blocks:     ${this.jsdoc.length}`);
    console.log(`   -------------------------------------------------`);
    console.log(`   Resolution rate:  ${resolvedPercent}%`);
    console.log(
      `   Circular deps:    ${this.detectCircularDependencies().length}`,
    );
    console.log("");
  }
}

// ==================== PUBLIC API ====================

/**
 * Quick project analysis - returns data only
 *
 * English: Fast analysis without file output, returns analysis data object
 * Spanish: Análisis rápido sin salida de archivos, retorna objeto con datos del análisis
 *
 * @async
 * @function analyzeProject
 * @param {string} rootDir - English: Root directory to analyze / Spanish: Directorio raíz a analizar
 * @param {Object} [options] - English: Configuration options / Spanish: Opciones de configuración
 * @returns {Promise<Object>} - English: Complete analysis data / Spanish: Datos completos del análisis
 *
 * @example
 * // Quick analysis
 * const data = await analyzeProject('./src');
 * console.log(data.stats);
 * console.log(data.nodes);
 */
async function analyzeProject(rootDir, options = {}) {
  const mapper = new CompleteGraphMapper(rootDir, options);
  await mapper.scan();
  return mapper.getData();
}

/**
 * Full analysis with file saving
 *
 * English: Complete analysis that saves JSON and Markdown files, returns full results
 * Spanish: Análisis completo que guarda archivos JSON y Markdown, retorna resultados completos
 *
 * @async
 * @function analyzeAndSave
 * @param {string} rootDir - English: Root directory to analyze / Spanish: Directorio raíz a analizar
 * @param {Object} [options] - English: Configuration options / Spanish: Opciones de configuración
 * @param {string} [options.outputDir='./'] - English: Directory for output files / Spanish: Directorio para archivos de salida
 * @returns {Promise<Object>} - English: Object with data, summary, files and stats / Spanish: Objeto con datos, resumen, archivos y estadísticas
 *
 * @example
 * // Full analysis with saving
 * const result = await analyzeAndSave('./src', { outputDir: './reports' });
 * console.log(`JSON saved: ${result.files.jsonPath}`);
 * console.log(`MD saved: ${result.files.mdPath}`);
 * console.log(`Resolution rate: ${result.stats.resolvedImports / result.stats.totalImports * 100}%`);
 */
async function analyzeAndSave(rootDir, options = {}) {
  const mapper = new CompleteGraphMapper(rootDir, {
    verbose: true,
    ...options,
  });
  await mapper.scan();
  mapper.printStats();
  const files = await mapper.saveToFile(options.outputDir || "./");
  return {
    data: mapper.getData(),
    summary: mapper.getSummary(),
    files,
    stats: mapper.stats,
  };
}

// Export for Node.js (CommonJS)
module.exports = {
  CompleteGraphMapper,
  analyzeProject,
  analyzeAndSave,
};

// ==================== CLI EXECUTION ====================
if (require.main === module) {
  const targetDir = process.argv[2] || "./";
  const verbose =
    process.argv.includes("--verbose") || process.argv.includes("-v");
  const noSave =
    process.argv.includes("--no-save") || process.argv.includes("-n");

  console.log("");
  console.log("========================================================");
  console.log("     COMPLETE GRAPH MAPPER v3.0 - Full Path Resolution");
  console.log("========================================================");
  console.log("");

  const mapper = new CompleteGraphMapper(targetDir, { verbose });

  mapper
    .scan()
    .then(() => {
      mapper.printStats();

      if (!noSave) {
        return mapper.saveToFile("./");
      }
    })
    .catch((err) => {
      console.error("\nFatal error:", err.message);
      process.exit(1);
    });
}

// MIT © MadScientist-HN One Guy Team
