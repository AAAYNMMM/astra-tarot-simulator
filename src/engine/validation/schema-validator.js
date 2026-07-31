function pathJoin(path, key) {
  if (typeof key === "number") return `${path}[${key}]`;
  return /^[A-Za-z_$][A-Za-z0-9_$-]*$/.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`;
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function matchesType(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}

function decodePointerPart(value) {
  return value.replace(/~1/g, "/").replace(/~0/g, "~");
}

function resolveReference(rootSchema, reference) {
  if (!reference.startsWith("#/")) throw new Error(`Only local JSON Schema references are supported: ${reference}`);
  return reference.slice(2).split("/").map(decodePointerPart).reduce((value, key) => value?.[key], rootSchema);
}

function dateIsValid(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function error(code, path, keyword, message) {
  return Object.freeze({ code, path, keyword, message });
}

function collect(value, schema, rootSchema, path) {
  if (!schema || typeof schema !== "object") return [];
  if (schema.$ref) {
    const resolved = resolveReference(rootSchema, schema.$ref);
    if (!resolved) return [error("schema.reference", path, "$ref", `Unresolved schema reference ${schema.$ref}`)];
    return collect(value, resolved, rootSchema, path);
  }

  const errors = [];
  for (const item of schema.allOf || []) errors.push(...collect(value, item, rootSchema, path));
  if (schema.if) {
    const conditionMatches = collect(value, schema.if, rootSchema, path).length === 0;
    if (conditionMatches && schema.then) errors.push(...collect(value, schema.then, rootSchema, path));
    if (!conditionMatches && schema.else) errors.push(...collect(value, schema.else, rootSchema, path));
  }

  if (Object.hasOwn(schema, "const") && canonical(value) !== canonical(schema.const)) {
    errors.push(error("schema.const", path, "const", "Value does not match the required constant."));
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => canonical(item) === canonical(value))) {
    errors.push(error("schema.enum", path, "enum", "Value is outside the allowed basic enumeration."));
  }

  const allowedTypes = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (allowedTypes.length && !allowedTypes.some((type) => matchesType(value, type))) {
    errors.push(error("schema.type", path, "type", `Expected ${allowedTypes.join(" or ")}.`));
    return errors;
  }

  if (typeof value === "string") {
    if (schema.minLength !== undefined && [...value].length < schema.minLength) {
      errors.push(error("schema.min_length", path, "minLength", `String is shorter than ${schema.minLength}.`));
    }
    if (schema.maxLength !== undefined && [...value].length > schema.maxLength) {
      errors.push(error("schema.max_length", path, "maxLength", `String is longer than ${schema.maxLength}.`));
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, "u").test(value)) {
      errors.push(error("schema.pattern", path, "pattern", "String does not match the required syntax."));
    }
    if (schema.format === "date" && !dateIsValid(value)) {
      errors.push(error("schema.format_date", path, "format", "String is not a valid YYYY-MM-DD date."));
    }
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(error("schema.minimum", path, "minimum", `Number is below ${schema.minimum}.`));
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(error("schema.maximum", path, "maximum", `Number is above ${schema.maximum}.`));
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(error("schema.min_items", path, "minItems", `Array has fewer than ${schema.minItems} items.`));
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(error("schema.max_items", path, "maxItems", `Array has more than ${schema.maxItems} items.`));
    }
    if (schema.uniqueItems) {
      const seen = new Set();
      for (const [index, item] of value.entries()) {
        const key = canonical(item);
        if (seen.has(key)) errors.push(error("schema.unique_items", pathJoin(path, index), "uniqueItems", "Array item is duplicated."));
        seen.add(key);
      }
    }
    if (schema.items) value.forEach((item, index) => errors.push(...collect(item, schema.items, rootSchema, pathJoin(path, index))));
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const keys = Object.keys(value);
    if (schema.minProperties !== undefined && keys.length < schema.minProperties) {
      errors.push(error("schema.min_properties", path, "minProperties", `Object has fewer than ${schema.minProperties} properties.`));
    }
    if (schema.maxProperties !== undefined && keys.length > schema.maxProperties) {
      errors.push(error("schema.max_properties", path, "maxProperties", `Object has more than ${schema.maxProperties} properties.`));
    }
    for (const required of schema.required || []) {
      if (!Object.hasOwn(value, required)) errors.push(error("schema.required", pathJoin(path, required), "required", `Missing required property ${required}.`));
    }
    const properties = schema.properties || {};
    for (const [key, item] of Object.entries(value)) {
      if (Object.hasOwn(properties, key)) errors.push(...collect(item, properties[key], rootSchema, pathJoin(path, key)));
      else if (schema.additionalProperties === false) errors.push(error("schema.additional_property", pathJoin(path, key), "additionalProperties", `Unexpected property ${key}.`));
      else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        errors.push(...collect(item, schema.additionalProperties, rootSchema, pathJoin(path, key)));
      }
    }
  }
  return errors;
}

export function validateJsonSchema(value, schema) {
  return collect(value, schema, schema, "$").map((item) => item);
}
