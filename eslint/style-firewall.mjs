import path from "node:path";

const COLOR_PATTERN = /#(?:[0-9a-fA-F]{3,8})\b|rgba?\(|hsla?\(/i;
const BOX_SHADOW_PATTERN = /(rgba?\(|\d(px|rem|em|%)|\ddeg)/i;
const RADIUS_UNIT_PATTERN = /(px|rem|em|%)\b/i;

const GEOMETRY_KEYS = new Set(["left", "top", "transform", "width", "height"]);
const COLOR_PROPS = new Set([
  "background",
  "backgroundColor",
  "borderColor",
  "color",
  "fill",
  "stroke",
]);
const SURFACE_PROPS = new Set([
  "background",
  "backgroundColor",
  "backdropFilter",
  "boxShadow",
  "border",
  "borderColor",
]);
const STYLING_PROPS = new Set([
  "background",
  "backgroundColor",
  "backdropFilter",
  "bg",
  "border",
  "borderColor",
  "borderRadius",
  "boxShadow",
  "className",
  "color",
  "layerStyle",
  "style",
]);

const DEFAULT_ALLOW_STYLING = [
  "src/components/ui",
  "src/theme",
  "src/theme/recipes",
  "src/styled-system",
];
const DEFAULT_ALLOW_SURFACE = ["src/theme", "src/components/ui"];

function normalizeFileName(filename) {
  if (!filename || filename === "<input>") return "";
  return path.normalize(filename);
}

function isInAllowedPath(filename, allowList) {
  const normalized = normalizeFileName(filename);
  return allowList.some((entry) => normalized.includes(path.normalize(entry)));
}

function getAttrName(attribute) {
  if (!attribute || !attribute.name) return null;
  if (attribute.name.type === "JSXIdentifier") return attribute.name.name;
  if (attribute.name.type === "JSXNamespacedName")
    return `${attribute.name.namespace.name}:${attribute.name.name.name}`;
  return null;
}

function getPropertyName(property) {
  if (property.key.type === "Identifier") return property.key.name;
  if (property.key.type === "Literal") return String(property.key.value);
  return null;
}

function getLiteralText(node) {
  if (!node) return null;
  if (node.type === "Literal") {
    if (typeof node.value === "string" || typeof node.value === "number") {
      return String(node.value);
    }
    return null;
  }
  if (node.type === "TemplateLiteral") {
    return node.quasis.map((q) => q.value.raw).join("");
  }
  return null;
}

function isMotionElement(openingElement) {
  const nameNode = openingElement?.name;
  if (!nameNode) return false;
  if (nameNode.type === "JSXMemberExpression") {
    return (
      nameNode.object.type === "JSXIdentifier" &&
      nameNode.object.name === "motion"
    );
  }
  if (nameNode.type === "JSXIdentifier") {
    return (
      nameNode.name.startsWith("motion.") || nameNode.name.startsWith("Motion")
    );
  }
  return false;
}

function getElementName(attribute) {
  const parent = attribute?.parent;
  if (parent?.type !== "JSXOpeningElement") return null;
  const nameNode = parent.name;
  if (nameNode.type === "JSXIdentifier") return nameNode.name;
  if (nameNode.type === "JSXMemberExpression" && nameNode.property.type === "JSXIdentifier") {
    return nameNode.property.name;
  }
  return null;
}

function isInsideTokenDefinition(context, node) {
  const ancestors = context.sourceCode.getAncestors(node);
      return ancestors.some((ancestor) => {
        if (ancestor.type !== "CallExpression") return false;
        if (ancestor.callee.type === "Identifier") {
          return [
            "defineConfig",
            "defineTokens",
            "defineSemanticTokens",
            "defineLayerStyles",
            "defineRecipe",
      ].includes(ancestor.callee.name);
    }
    if (
      ancestor.callee.type === "MemberExpression" &&
      ancestor.callee.property.type === "Identifier"
    ) {
      const calleeObject =
        ancestor.callee.object.type === "Identifier"
          ? ancestor.callee.object.name
          : null;
      return (
        ["defineTokens", "defineSemanticTokens"].includes(
          ancestor.callee.property.name,
        ) ||
        ["defineTokens", "defineSemanticTokens"].includes(calleeObject)
      );
    }
    return false;
  });
}

const rules = {
  "no-inline-style-except-geometry": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Restrict inline styles to geometry keys unless using motion components.",
      },
      schema: [],
    },
    create(context) {
      return {
        JSXAttribute(node) {
          const name = getAttrName(node);
          if (name !== "style") return;

          const motionElement = isMotionElement(node.parent);
          const expression =
            node.value?.type === "JSXExpressionContainer"
              ? node.value.expression
              : null;

          if (expression?.type === "ObjectExpression") {
            const invalidKeys = [];
            for (const prop of expression.properties) {
              if (prop.type === "Property") {
                const keyName = getPropertyName(prop);
                if (keyName && !GEOMETRY_KEYS.has(keyName)) {
                  invalidKeys.push(keyName);
                }
              } else if (prop.type === "SpreadElement") {
                invalidKeys.push("spread");
              }
            }

            if (invalidKeys.length > 0 && !motionElement) {
              context.report({
                node,
                message: `Inline style only allows geometry keys (${[
                  ...GEOMETRY_KEYS,
                ].join(", ")}); found ${invalidKeys.join(", ")}.`,
              });
            }
            return;
          }

          if (!motionElement) {
            context.report({
              node,
              message:
                "Inline styles are limited to geometry keys (left, top, transform, width, height) or motion components.",
            });
          }
        },
      };
    },
  },

  "no-raw-colors": {
    meta: {
      type: "problem",
      docs: {
        description: "Disallow raw color literals; prefer design tokens.",
      },
      schema: [],
    },
    create(context) {
      function reportIfColor(valueNode) {
        if (isInsideTokenDefinition(context, valueNode)) return;
        const text = getLiteralText(valueNode);
        if (text && COLOR_PATTERN.test(text)) {
          context.report({
            node: valueNode,
            message: "Use design tokens instead of raw color values.",
          });
        }
      }

      return {
        JSXAttribute(node) {
          const name = getAttrName(node);
          if (!COLOR_PROPS.has(name)) return;
          const value = node.value;
          if (
            value?.type === "Literal" ||
            value?.type === "JSXExpressionContainer"
          ) {
            reportIfColor(
              value.type === "JSXExpressionContainer"
                ? value.expression
                : value,
            );
          }
        },
        Property(node) {
          const keyName = getPropertyName(node);
          if (!keyName || !COLOR_PROPS.has(keyName)) return;
          reportIfColor(node.value);
        },
      };
    },
  },

  "no-raw-box-shadow": {
    meta: {
      type: "problem",
      docs: {
        description: "Disallow raw box-shadow strings; prefer tokens.",
      },
      schema: [],
    },
    create(context) {
      function reportIfShadow(valueNode) {
        if (isInsideTokenDefinition(context, valueNode)) return;
        const text = getLiteralText(valueNode);
        if (text && BOX_SHADOW_PATTERN.test(text)) {
          context.report({
            node: valueNode,
            message:
              "Use shadow tokens (e.g. panel) instead of raw boxShadow values.",
          });
        }
      }

      return {
        JSXAttribute(node) {
          const name = getAttrName(node);
          if (name !== "boxShadow") return;
          const value = node.value;
          if (
            value?.type === "Literal" ||
            value?.type === "JSXExpressionContainer"
          ) {
            reportIfShadow(
              value.type === "JSXExpressionContainer"
                ? value.expression
                : value,
            );
          }
        },
        Property(node) {
          const keyName = getPropertyName(node);
          if (keyName !== "boxShadow") return;
          reportIfShadow(node.value);
        },
      };
    },
  },

  "no-raw-border-radius": {
    meta: {
      type: "problem",
      docs: {
        description: "Disallow raw border radius values; use radius tokens.",
      },
      schema: [],
    },
    create(context) {
      function reportIfRadius(valueNode) {
        if (isInsideTokenDefinition(context, valueNode)) return;
        const text = getLiteralText(valueNode);
        if (!text) return;
        if (RADIUS_UNIT_PATTERN.test(text) || /^\d+(\.\d+)?$/.test(text)) {
          context.report({
            node: valueNode,
            message:
              "Use radius tokens (l1–l4) instead of pixel/rem values for borderRadius.",
          });
        }
      }

      return {
        JSXAttribute(node) {
          const name = getAttrName(node);
          if (name !== "borderRadius") return;
          const value = node.value;
          if (
            value?.type === "Literal" ||
            value?.type === "JSXExpressionContainer"
          ) {
            reportIfRadius(
              value.type === "JSXExpressionContainer"
                ? value.expression
                : value,
            );
          }
        },
        Property(node) {
          const keyName = getPropertyName(node);
          if (keyName !== "borderRadius") return;
          reportIfRadius(node.value);
        },
      };
    },
  },

  "no-styling-outside-ui": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Restrict styling props and css() usage to UI primitives and recipes.",
      },
      schema: [
        {
          type: "object",
          properties: {
            allow: {
              type: "array",
              items: { type: "string" },
            },
          },
          additionalProperties: false,
        },
      ],
    },
    create(context) {
      const allow =
        context.options[0]?.allow && context.options[0].allow.length > 0
          ? context.options[0].allow
          : DEFAULT_ALLOW_STYLING;
      const filename = context.getFilename();
      if (isInAllowedPath(filename, allow)) {
        return {};
      }

      return {
        JSXAttribute(node) {
          const name = getAttrName(node);
          if (!name || !STYLING_PROPS.has(name)) return;
          if (name === "className") return;
          if (isInsideTokenDefinition(context, node)) return;
          if (name === "style") {
            const expression =
              node.value?.type === "JSXExpressionContainer"
                ? node.value.expression
                : null;
            if (expression?.type === "ObjectExpression") {
              const hasNonGeometry = expression.properties.some((prop) => {
                if (prop.type !== "Property") return true;
                const keyName = getPropertyName(prop);
                return keyName && !GEOMETRY_KEYS.has(keyName);
              });
              if (!hasNonGeometry) {
                return;
              }
            }
          }
          const elementName = getElementName(node);
          if (elementName === "body" || elementName === "html") return;
          context.report({
            node,
            message:
              "Styling props belong in UI primitives or recipes. Move this styling into src/components/ui or theme recipes.",
          });
        },
        CallExpression(node) {
          if (node.callee.type === "Identifier" && node.callee.name === "css") {
            context.report({
              node,
              message:
                "css() styling is restricted to UI primitives and recipes. Lift this into a shared primitive.",
            });
          }
        },
      };
    },
  },

  "no-surface-props-outside-recipes": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow surface styling props outside of recipes to avoid drift.",
      },
      schema: [
        {
          type: "object",
          properties: {
            allow: {
              type: "array",
              items: { type: "string" },
            },
          },
          additionalProperties: false,
        },
      ],
    },
    create(context) {
      const allow =
        context.options[0]?.allow && context.options[0].allow.length > 0
          ? context.options[0].allow
          : DEFAULT_ALLOW_SURFACE;
      const filename = context.getFilename();
      if (isInAllowedPath(filename, allow)) {
        return {};
      }

      return {
        JSXAttribute(node) {
          const name = getAttrName(node);
          if (!name || !SURFACE_PROPS.has(name)) return;
          if (isInsideTokenDefinition(context, node)) return;
          context.report({
            node,
            message:
              'Surface styling belongs in recipes or layerStyle tokens; prefer layerStyle="panel".',
          });
        },
        Property(node) {
          const keyName = getPropertyName(node);
          if (!keyName || !SURFACE_PROPS.has(keyName)) return;
          if (isInsideTokenDefinition(context, node)) return;
          context.report({
            node,
            message:
              'Surface styling belongs in recipes or layerStyle tokens; prefer layerStyle="panel".',
          });
        },
      };
    },
  },

  "prefer-panda-css": {
    meta: {
      type: "suggestion",
      docs: {
        description: "Prefer Panda css() helpers over raw className strings.",
      },
      schema: [],
    },
    create(context) {
      return {
        JSXAttribute(node) {
          const name = getAttrName(node);
          if (name !== "className") return;
          const elementName = node.parent?.name?.name;
          if (elementName === "body" || elementName === "html") return;
          const value = node.value;
          if (!value) return;

          if (value.type === "Literal") {
            if (typeof value.value === "string" && value.value.trim().length) {
              context.report({
                node,
                message: "Use Panda css() instead of raw className strings.",
              });
            }
            return;
          }

          if (value.type === "JSXExpressionContainer") {
            const expr = value.expression;
            if (expr.type === "Literal" || expr.type === "TemplateLiteral") {
              context.report({
                node,
                message: "Use Panda css() instead of raw className strings.",
              });
            }
          }
        },
      };
    },
  },
};

export default { rules };
