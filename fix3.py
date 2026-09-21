with open("src/pages/Uploader.tsx", "r") as f:
    text = f.read()

text = text.replace(
"""                  <div className="mt-4 flex gap-2">
                     > 
                       className="px-3 py-1.5 bg-neutral-800 text-xs font-medium rounded-md hover:bg-neutral-700 flex items-center"
                       onClick={() => document.getElementById('image-upload-input')?.click()}
                     >""",
"""                  <div className="mt-4 flex gap-2">
                     <button type="button"
                       className="px-3 py-1.5 bg-neutral-800 text-xs font-medium rounded-md hover:bg-neutral-700 flex items-center"
                       onClick={() => document.getElementById('image-upload-input')?.click()}
                     >""")

text = text.replace(
"""                     />
                     > className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 text-xs font-medium rounded-md border border-indigo-500/20 flex items-center">
                       <Sparkles className="w-3 h-3 mr-1" /> AI Generate Cover
                     </button>""",
"""                     />
                     <button type="button" className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 text-xs font-medium rounded-md border border-indigo-500/20 flex items-center">
                       <Sparkles className="w-3 h-3 mr-1" /> AI Generate Cover
                     </button>""")

text = text.replace(
"""> onClick={() => document.getElementById('audio-upload-input')?.click()} className="px-4 py-2 bg-neutral-800 text-sm font-medium rounded-md hover:bg-neutral-700 flex items-center gap-2">""",
"""<button type="button" onClick={() => document.getElementById('audio-upload-input')?.click()} className="px-4 py-2 bg-neutral-800 text-sm font-medium rounded-md hover:bg-neutral-700 flex items-center gap-2">""")

text = text.replace(
"""                  <div className="flex gap-4">
                    > onClick={() => setCurrentStep(prev => prev - 1)} className="px-6 py-2 bg-neutral-800 text-white rounded-md font-bold text-sm hover:bg-neutral-700 flex items-center gap-2">""",
"""                  <div className="flex gap-4">
                    <button type="button" onClick={() => setCurrentStep(prev => prev - 1)} className="px-6 py-2 bg-neutral-800 text-white rounded-md font-bold text-sm hover:bg-neutral-700 flex items-center gap-2">""")

text = text.replace(
"""                    > onClick={() => setCurrentStep(prev => prev + 1)} className="px-6 py-2 bg-white text-black rounded-md font-bold text-sm hover:bg-neutral-200 flex items-center gap-2 ml-auto">""",
"""                    <button type="button" onClick={() => setCurrentStep(prev => prev + 1)} className="px-6 py-2 bg-white text-black rounded-md font-bold text-sm hover:bg-neutral-200 flex items-center gap-2 ml-auto">""")

text = text.replace(
"""                  > type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">""",
"""                  <button type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">""")

text = text.replace(
"""                    > onClick={() => {""",
"""                    <button type="button" onClick={() => {""")

with open("src/pages/Uploader.tsx", "w") as f:
    f.write(text)
