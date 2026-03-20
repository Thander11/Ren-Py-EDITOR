import re

with open('src/renderer.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix generateBlockCode
text = text.replace("let res = if :\\n;", "let res = `${indent}if ${b.condition || 'True'}:\\n`;")
text = text.replace("res += b.ifBlocks.map(sub => generateBlockCode(sub, indent + '    ')).join('\\n');", "res += b.ifBlocks.map(sub => generateBlockCode(sub, indent + '    ')).join('\\n');")

with open('src/renderer.js', 'w', encoding='utf-8') as f:
    f.write(text)
