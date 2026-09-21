import re

with open("src/pages/Uploader.tsx", "r") as f:
    text = f.read()

# Replace any > type="button" ...
text = re.sub(r'> type="button"(.*?)(>)', r'<button type="button"\1>', text)
text = re.sub(r'> onClick=\{(.*?)\}(.*?)>', r'<button onClick={\1}\2>', text)

with open("src/pages/Uploader.tsx", "w") as f:
    f.write(text)
