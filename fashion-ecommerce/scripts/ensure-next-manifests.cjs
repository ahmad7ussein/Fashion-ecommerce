const fs = require("fs")
const path = require("path")

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function ensureFile(filePath, contents) {
  if (fs.existsSync(filePath)) return
  fs.writeFileSync(filePath, contents, "utf8")
}

// Next.js sometimes reads `.next/routes-manifest.json` very early; if the folder
// was deleted while the dev server is running, Next can throw ENOENT.
// This is a safe guard to prevent hard 500s in dev.
const projectRoot = process.cwd()
const nextDir = path.join(projectRoot, ".next")
const routesManifestPath = path.join(nextDir, "routes-manifest.json")

ensureDir(nextDir)

ensureFile(
  routesManifestPath,
  JSON.stringify(
    {
      version: 3,
      caseSensitive: false,
      basePath: "",
      rewrites: { beforeFiles: [], afterFiles: [], fallback: [] },
      redirects: [],
      headers: [],
    },
    null,
    0
  )
)

