/**
 * Generator model Dart (ADR-004).
 *
 * Pipeline jujur: zod schema -> JSON Schema -> kode Dart.
 * Menghasilkan satu berkas: generated/dart/magnoo_models.dart berisi:
 *   - enum Dart (dari ENUM_REGISTRY), dan
 *   - kelas model (dari MODEL_REGISTRY) lengkap dengan fromJson/toJson.
 *
 * Jalankan: pnpm --filter @magnoo/shared generate:dart
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ENUM_REGISTRY } from "../enums.js";
import { MODEL_REGISTRY } from "./registry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../../generated/dart/magnoo_models.dart");

const DART_KEYWORDS = new Set([
  "new", "default", "class", "enum", "in", "is", "for", "if", "else", "var", "final",
]);

function camel(name: string): string {
  let c: string;
  if (/[_-]/.test(name)) {
    // CONSTANT_CASE / kebab-case -> camelCase
    const parts = name.split(/[_-]/);
    c =
      parts[0]!.toLowerCase() +
      parts
        .slice(1)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join("");
  } else if (name === name.toUpperCase()) {
    // satu kata huruf besar semua (mis. "IN") -> huruf kecil
    c = name.toLowerCase();
  } else {
    // sudah camelCase (mis. "accessToken") -> jaga, hanya huruf awal kecil
    c = name.charAt(0).toLowerCase() + name.slice(1);
  }
  return DART_KEYWORDS.has(c) ? `${c}_` : c;
}

// Peta nilai-enum -> nama enum Dart, untuk mencocokkan field bertipe enum.
const enumByValues = new Map<string, string>();
for (const e of ENUM_REGISTRY) {
  enumByValues.set(JSON.stringify([...e.values].sort()), e.name);
}

interface JsonSchema {
  type?: string | string[];
  enum?: string[];
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  anyOf?: JsonSchema[];
}

/** Apakah skema field ini boleh null? */
function isNullable(s: JsonSchema): boolean {
  if (Array.isArray(s.type)) return s.type.includes("null");
  if (s.anyOf) return s.anyOf.some((x) => x.type === "null");
  return false;
}

/** Buang varian "null" agar mudah dipetakan ke tipe dasar. */
function nonNull(s: JsonSchema): JsonSchema {
  if (Array.isArray(s.type)) {
    return { ...s, type: s.type.find((t) => t !== "null") };
  }
  if (s.anyOf) {
    const real = s.anyOf.find((x) => x.type !== "null");
    if (real) return real;
  }
  return s;
}

/** Petakan satu skema field ke tipe Dart (tanpa tanda nullable). */
function dartType(raw: JsonSchema): string {
  const s = nonNull(raw);
  if (s.enum) {
    const match = enumByValues.get(JSON.stringify([...s.enum].sort()));
    if (match) return match;
    return "String"; // enum yang tidak terdaftar (mis. kode error) -> String
  }
  const t = Array.isArray(s.type) ? s.type.find((x) => x !== "null") : s.type;
  switch (t) {
    case "string": return "String";
    case "integer": return "int";
    case "number": return "double";
    case "boolean": return "bool";
    case "array": return `List<${s.items ? dartType(s.items) : "dynamic"}>`;
    default: return "dynamic";
  }
}

function isEnumType(t: string): boolean {
  return ENUM_REGISTRY.some((e) => e.name === t);
}

/** Ekspresi parsing satu field dari JSON ke tipe Dart. */
function fromJsonExpr(field: string, type: string, nullable: boolean): string {
  const j = `json['${field}']`;
  const base = (() => {
    if (isEnumType(type)) return `${type}.fromValue(${j} as String)`;
    if (type.startsWith("List<")) {
      const inner = type.slice(5, -1);
      if (isEnumType(inner)) return `(${j} as List).map((e) => ${inner}.fromValue(e as String)).toList()`;
      return `(${j} as List).cast<${inner}>()`;
    }
    return `${j} as ${type}`;
  })();
  if (!nullable) return base;
  return `${j} == null ? null : ${base}`;
}

/** Ekspresi serialisasi satu field ke JSON. */
function toJsonExpr(prop: string, type: string, nullable: boolean): string {
  const q = nullable ? "?" : "";
  if (isEnumType(type)) return `${prop}${q}.value`;
  if (type.startsWith("List<") && isEnumType(type.slice(5, -1))) {
    return `${prop}${q}.map((e) => e.value).toList()`;
  }
  return prop;
}

function genEnum(name: string, values: readonly string[]): string {
  const members = values
    .map((v) => `  ${camel(v)}('${v}')`)
    .join(",\n");
  return `enum ${name} {
${members};

  const ${name}(this.value);
  final String value;

  static ${name} fromValue(String v) =>
      values.firstWhere((e) => e.value == v);
}`;
}

function genClass(dartName: string, schema: JsonSchema): string {
  const props = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const fields = Object.entries(props).map(([name, ps]) => {
    const nullable = !required.has(name) || isNullable(ps);
    const type = dartType(ps);
    return { name, prop: camel(name), type, nullable };
  });

  const decls = fields
    .map((f) => `  final ${f.type}${f.nullable ? "?" : ""} ${f.prop};`)
    .join("\n");
  const ctorArgs = fields
    .map((f) => `${f.nullable ? "" : "required "}this.${f.prop}`)
    .join(", ");
  const fromJson = fields
    .map((f) => `      ${f.prop}: ${fromJsonExpr(f.name, f.type, f.nullable)},`)
    .join("\n");
  const toJson = fields
    .map((f) => `      '${f.name}': ${toJsonExpr(f.prop, f.type, f.nullable)},`)
    .join("\n");

  return `class ${dartName} {
${decls}

  const ${dartName}({${ctorArgs}});

  factory ${dartName}.fromJson(Map<String, dynamic> json) => ${dartName}(
${fromJson}
      );

  Map<String, dynamic> toJson() => {
${toJson}
      };
}`;
}

function main(): void {
  const parts: string[] = [
    "// GENERATED FILE — DO NOT EDIT BY HAND.",
    "// Source: packages/shared (zod schemas). Regenerate: pnpm --filter @magnoo/shared generate:dart",
    "",
  ];

  for (const e of ENUM_REGISTRY) {
    parts.push(genEnum(e.name, e.values), "");
  }
  for (const m of MODEL_REGISTRY) {
    const js = zodToJsonSchema(m.schema, {
      $refStrategy: "none",
      effectStrategy: "input",
      target: "jsonSchema7",
    }) as JsonSchema;
    parts.push(genClass(m.dartName, js), "");
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, parts.join("\n"), "utf8");
  console.log(`Generated ${MODEL_REGISTRY.length} models + ${ENUM_REGISTRY.length} enums -> ${OUT}`);
}

main();
