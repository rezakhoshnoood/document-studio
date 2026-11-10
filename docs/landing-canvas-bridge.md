# Landing canvas bridge maintenance

`landing-canvas-bridge-source.js` is the readable source of the fixed sandbox bridge. The installed application uses the exact copy and SHA-256 CSP hash embedded in `js/features/landing-engine.js`; the copy runs inside `iframe srcdoc` and no build step is needed to use the application. After changing the readable source, synchronize the embedded code and its hash from the project root:

```sh
python3 - <<'PY'
from pathlib import Path
import hashlib, base64, json
source = Path('docs/landing-canvas-bridge-source.js').read_text().strip()
engine = Path('js/features/landing-engine.js')
s = engine.read_text()
a = s.index('const BRIDGE_CODE=')
b = s.index('export function previewDocument', a)
h = base64.b64encode(hashlib.sha256(source.encode('utf-8')).digest()).decode('ascii')
s = s[:a] + 'const BRIDGE_CODE=' + json.dumps(source, ensure_ascii=False) + ';\nconst BRIDGE_HASH="sha256-' + h + '";\n' + s[b:]
engine.write_text(s)
PY
```

Re-test the sandbox, script-off bridge, the script-on rejection of canvas mutation messages, and actual editing and persistence. The source is untrusted; never give the iframe same-origin access or accept modifying bridge messages when user JavaScript runs.
