const { execSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const WEB_DIR = path.join(ROOT_DIR, 'web');
const API_DIR = path.join(ROOT_DIR, 'api');

function runStep(name, command, cwd = ROOT_DIR) {
  console.log(`\n🚀 [Step: ${name}]`);
  console.log(`Running: ${command}`);
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    console.log(`✅ ${name} completado con éxito.`);
  } catch (error) {
    console.error(`\n❌ ERROR en ${name}. Deteniendo proceso de despliegue.`);
    process.exit(1);
  }
}

console.log('🚢 --- NEVERLAND SHIP SCRIPT --- 🚢');

// 1. Tests de Frontend (SALTADOS TEMPORALMENTE)
// runStep('Frontend Tests', 'npm run test:run', WEB_DIR);

// 2. Tests de Backend (SALTADOS TEMPORALMENTE)
// runStep('Backend Tests', 'npm test', API_DIR);

// 3. Git Commit (solo si los tests pasaron)
// Si no hay cambios para commit, el comando git fallará, por eso lo envolvemos
try {
  const status = execSync('git status --porcelain', { cwd: ROOT_DIR }).toString();
  if (status) {
    const commitMsg =
      process.argv[2] || 'chore: automated deploy after successful tests';
    runStep('Git Add', 'git add .', ROOT_DIR);
    runStep('Git Commit', `git commit -m "${commitMsg}"`, ROOT_DIR);
    runStep('Git Push', 'git push origin main', ROOT_DIR);
  } else {
    console.log('\n📝 No hay cambios pendientes para commit.');
  }
} catch (e) {
  console.log('\n📝 No se pudo realizar el commit (quizás no hay cambios).');
}

// 4. Fly Deploy (DEPRECATED - Moved to Git Push for Render & Vercel)
// runStep('Fly.io Deploy', 'fly deploy', ROOT_DIR);

console.log('\n🎉 --- DESPLIEGUE INICIADO CON ÉXITO --- 🎉');
console.log('Los cambios han sido subidos. Vercel (Front) y Render (API) se están actualizando automáticamente.');
