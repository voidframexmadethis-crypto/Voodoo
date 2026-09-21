with open("src/pages/Uploader.tsx", "r") as f:
    text = f.read()

text = text.replace(
"""                           > type="button" onClick={() => removeTag(index)} className="ml-1 text-neutral-400 hover:text-white">""",
"""                           <button type="button" onClick={() => removeTag(index)} className="ml-1 text-neutral-400 hover:text-white">""")

text = text.replace(
"""> onClick={() => addTag(tagInput)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-bold transition-colors">""",
"""<button type="button" onClick={() => addTag(tagInput)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-bold transition-colors">""")

with open("src/pages/Uploader.tsx", "w") as f:
    f.write(text)
