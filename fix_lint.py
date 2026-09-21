with open("server.ts", "r") as f:
    server_text = f.read()

server_text = server_text.replace(
    'return { status: 403, msg: "⏳ LOADING... [Trapping attacker connection in infinite loop]", hang: true };',
    'return { status: 403, msg: "⏳ LOADING... [Trapping attacker connection in infinite loop]" } as {status: number, msg: string, hang?: boolean};'
)

with open("server.ts", "w") as f:
    f.write(server_text)

with open("src/components/BeatPlayer.tsx", "r") as f:
    beatplayer_text = f.read()

beatplayer_text = beatplayer_text.replace(
    'import { useEffect, useMemo, useRef, useState } from "react";',
    'import React, { useEffect, useMemo, useRef, useState } from "react";'
)

with open("src/components/BeatPlayer.tsx", "w") as f:
    f.write(beatplayer_text)

with open("src/pages/Uploader.tsx", "r") as f:
    uploader_text = f.read()

uploader_text = uploader_text.replace(
    'onClick={resetForm}',
    'onClick={() => {\n                        setFormData({ title: "", producer: "KRYPSIDE", genre: "Hip Hop", bpm: "", key: "", price: "30.00", coverArtUrl: "", audioUrl: "", freeDownloadEnabled: true, visibility: "Public", trackType: "Beat", licenses: { mp3Lease: { enabled: true, price: 30.00 }, wavLease: { enabled: true, price: 50.00 }, premiumLease: { enabled: true, price: 100.00 }, unlimitedLease: { enabled: true, price: 150.00 }, exclusive: { enabled: false, price: 500.00 } } });\n                        setCurrentStep(0);\n                      }}'
)

with open("src/pages/Uploader.tsx", "w") as f:
    f.write(uploader_text)
