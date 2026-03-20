import re

with open('src/renderer.js', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    "['narration','dialogue','show','show_multi','hide','hide_multi','scene','pause','music','jump','call','comment','custom']",
    "['narration','dialogue','show','show_multi','hide','hide_multi','scene','menu','condition','pause','music','jump','call','comment','custom']"
)

with open('src/renderer.js', 'w', encoding='utf-8') as f:
    f.write(text)

