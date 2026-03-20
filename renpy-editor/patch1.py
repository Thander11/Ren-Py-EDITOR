import re

with open('src/renderer.js', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. BLOCK_META
text = text.replace(
    "  menu:       { icon: '?', labelKey: 'block_menu',        color: '#e67e22' },",
    "  menu:       { icon: '?', labelKey: 'block_menu',        color: '#e67e22' },\n  condition:  { icon: '??', labelKey: 'block_condition',   color: '#ff7f50' },"
)

# 2. blockDesc
text = text.replace(
    "    case 'menu':      return ${b.choices?.length||0} opciones: ;",
    "    case 'menu':      return ${b.choices?.length||0} opciones: ;\n    case 'condition': return t('block_condition') + ': ' + truncate(b.condition, 30);"
)

# 3. generateBlockCode
text = text.replace(
    "    case 'menu': {",
    "    case 'condition': {\n      let res = ${indent}if :\\n;\n      if (b.ifBlocks && b.ifBlocks.length) {\n        res += b.ifBlocks.map(sub => generateBlockCode(sub, indent + '    ')).join('\\n');\n      } else {\n        res += ${indent}    pass;\n      }\n      if (b.elseBlocks && b.elseBlocks.length) {\n        res += \\nelse:\\n;\n        res += b.elseBlocks.map(sub => generateBlockCode(sub, indent + '    ')).join('\\n');\n      }\n      return res;\n    }\n    case 'menu': {"
)

# 4. buildModalBody
text = text.replace(
    "    case 'menu': return buildMenuBody(b);",
    "    case 'menu': return buildMenuBody(b);\n    case 'condition': return buildConditionBody(b);"
)

# 5. readModalValues (called in saveModal/saveBlock)
text = text.replace(
    "    case 'menu': {",
    "    case 'condition': {\n      b.condition = document.getElementById('f-condition')?.value || '';\n      try { b.ifBlocks = JSON.parse(document.getElementById('cb-if')?.value || '[]'); } catch(e) { b.ifBlocks = []; }\n      try { b.elseBlocks = JSON.parse(document.getElementById('cb-else')?.value || '[]'); } catch(e) { b.elseBlocks = []; }\n      break;\n    }\n    case 'menu': {"
)

with open('src/renderer.js', 'w', encoding='utf-8') as f:
    f.write(text)
