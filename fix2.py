with open("src/pages/Uploader.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "className=\"btn-paypal\"" in line:
        new_lines.append(line)
        new_lines.append("                    >\n")
        new_lines.append("                      💙 Checkout with PayPal\n")
        new_lines.append("                    </a>\n")
        new_lines.append("                    <button\n")
        new_lines.append("                      onClick={resetForm}\n")
        new_lines.append("                      className=\"mt-4 flex items-center justify-center gap-2 w-full bg-red-900/10 hover:bg-red-900/30 border border-red-900/30 text-red-500 font-bold py-2 px-4 rounded-lg text-sm transition-colors\"\n")
        new_lines.append("                    >\n")
        new_lines.append("                      <Trash2 size={16} /> Delete Placeholder Beat\n")
        new_lines.append("                    </button>\n")
        new_lines.append("                  </div>\n")
        new_lines.append("                </div>\n")
        new_lines.append("              </div>\n")
        new_lines.append("            </div>\n")
        new_lines.append("          </div>\n")
        new_lines.append("        )}\n")
        new_lines.append("      </main>\n")
        new_lines.append("    </div>\n")
        new_lines.append("  );\n")
        new_lines.append("}\n")
        break
    else:
        new_lines.append(line)

with open("src/pages/Uploader.tsx", "w") as f:
    f.writelines(new_lines)
