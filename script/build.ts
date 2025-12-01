import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, writeFile } from "fs/promises";
import path from "path";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "@neondatabase/serverless",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

// Função para corrigir os caminhos no arquivo index.html
async function fixIndexPaths() {
  const indexPath = path.join("dist", "public", "index.html");
  try {
    let content = await readFile(indexPath, "utf-8");
    
    // Adicionar tag base para roteamento correto
    if (!content.includes('<base href="./">')) {
      content = content.replace('</head>', '  <base href="./">\n  </head>');
    }
    
    // Substituir caminhos absolutos por relativos
    content = content.replace(/href="\/favicon\.png"/g, 'href="./favicon.png"');
    content = content.replace(/src="\/assets\//g, 'src="./assets/');
    content = content.replace(/href="\/assets\//g, 'href="./assets/');
    
    await writeFile(indexPath, content, "utf-8");
    console.log("Caminhos corrigidos no index.html");
  } catch (error) {
    console.error("Erro ao corrigir caminhos no index.html:", error);
  }
}

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();
  
  // Corrigir os caminhos no index.html após o build
  await fixIndexPaths();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});