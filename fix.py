with open("src/pages/Uploader.tsx", "r") as f:
    text = f.read()

bad_chunk = """                      })()} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="btn-paypal"
                    <button
                      onClick={resetForm}
                      className="mt-4 flex items-center justify-center gap-2 w-full bg-red-900/10 hover:bg-red-900/30 border border-red-900/30 text-red-500 font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                      <Trash2 size={16} /> Delete Placeholder Beat
                    </button>
                    >
                      💙 Checkout with PayPal
                    </a>"""

good_chunk = """                      })()} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="btn-paypal"
                    >
                      💙 Checkout with PayPal
                    </a>
                    <button
                      onClick={resetForm}
                      className="mt-4 flex items-center justify-center gap-2 w-full bg-red-900/10 hover:bg-red-900/30 border border-red-900/30 text-red-500 font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                      <Trash2 size={16} /> Delete Placeholder Beat
                    </button>"""

text = text.replace(bad_chunk, good_chunk)

with open("src/pages/Uploader.tsx", "w") as f:
    f.write(text)
