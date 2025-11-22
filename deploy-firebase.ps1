# ===============================================
# SCRIPT DE DEPLOY AUTOMÁTICO - pepIA Firebase
# ===============================================

param(
    [switch]$OnlyFunctions,
    [switch]$OnlyHosting,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

Write-Host @"
╔═══════════════════════════════════════╗
║   🤖 pepIA - Deploy Automático       ║
║   Firebase Functions + Hosting        ║
╚═══════════════════════════════════════╝
"@ -ForegroundColor Cyan

# ============================================
# VERIFICAÇÕES INICIAIS
# ============================================
Write-Host "`n[1/6] 🔍 Verificando pré-requisitos..." -ForegroundColor Yellow

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js não encontrado. Instale em https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar Firebase CLI
try {
    $firebaseVersion = firebase --version
    Write-Host "  ✅ Firebase CLI: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Firebase CLI não encontrado." -ForegroundColor Red
    Write-Host "  Instale com: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Verificar se está logado no Firebase
try {
    firebase projects:list | Out-Null
    Write-Host "  ✅ Autenticado no Firebase" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Não autenticado. Execute: firebase login" -ForegroundColor Red
    exit 1
}

# ============================================
# CONFIGURAR VARIÁVEIS DE AMBIENTE
# ============================================
Write-Host "`n[2/6] ⚙️  Verificando variáveis de ambiente..." -ForegroundColor Yellow

$envFile = ".env"
if (Test-Path $envFile) {
    Write-Host "  ✅ Arquivo .env encontrado" -ForegroundColor Green
    
    # Verificar se variáveis Firebase estão configuradas
    $configCheck = firebase functions:config:get 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Configurações Firebase Functions OK" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Configure as variáveis com:" -ForegroundColor Yellow
        Write-Host "     firebase functions:config:set supabase.url='URL'" -ForegroundColor Gray
        Write-Host "     firebase functions:config:set supabase.key='KEY'" -ForegroundColor Gray
        Write-Host "     firebase functions:config:set openai.key='KEY'" -ForegroundColor Gray
        
        $continue = Read-Host "`n  Continuar mesmo assim? (s/n)"
        if ($continue -ne 's') { exit 0 }
    }
} else {
    Write-Host "  ⚠️  Arquivo .env não encontrado (opcional)" -ForegroundColor Yellow
}

# ============================================
# INSTALAR DEPENDÊNCIAS FUNCTIONS
# ============================================
Write-Host "`n[3/6] 📦 Instalando dependências do backend..." -ForegroundColor Yellow

Push-Location functions
try {
    if (Test-Path "package.json") {
        npm install --silent
        Write-Host "  ✅ Dependências instaladas" -ForegroundColor Green
    } else {
        Write-Host "  ❌ package.json não encontrado em functions/" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ❌ Erro ao instalar dependências: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}

# ============================================
# BUILD DO FRONTEND
# ============================================
if (-not $SkipBuild) {
    Write-Host "`n[4/6] 🏗️  Building frontend..." -ForegroundColor Yellow
    
    try {
        npm run build
        
        if (Test-Path "build") {
            $buildSize = (Get-ChildItem -Path build -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
            Write-Host "  ✅ Build concluído ($([math]::Round($buildSize, 2)) MB)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Pasta build/ não foi criada" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "  ❌ Erro no build: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`n[4/6] ⏭️  Pulando build (--SkipBuild)" -ForegroundColor Gray
}

# ============================================
# DEPLOY FIREBASE
# ============================================
Write-Host "`n[5/6] 🚀 Fazendo deploy..." -ForegroundColor Yellow

try {
    if ($OnlyFunctions) {
        Write-Host "  📡 Deploying apenas Functions..." -ForegroundColor Cyan
        firebase deploy --only functions
    }
    elseif ($OnlyHosting) {
        Write-Host "  🌐 Deploying apenas Hosting..." -ForegroundColor Cyan
        firebase deploy --only hosting
    }
    else {
        Write-Host "  📡 Deploying Functions..." -ForegroundColor Cyan
        firebase deploy --only functions
        
        Write-Host "  🌐 Deploying Hosting..." -ForegroundColor Cyan
        firebase deploy --only hosting
    }
    
    Write-Host "  ✅ Deploy completo!" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Erro no deploy: $_" -ForegroundColor Red
    exit 1
}

# ============================================
# VERIFICAR URLs
# ============================================
Write-Host "`n[6/6] 🔗 URLs do projeto:" -ForegroundColor Yellow

try {
    $projectInfo = firebase projects:list --json | ConvertFrom-Json
    $currentProject = (firebase use --json | ConvertFrom-Json).project
    
    Write-Host "  🌐 Hosting: https://$currentProject.web.app" -ForegroundColor Cyan
    Write-Host "  ☁️  Functions: https://us-central1-$currentProject.cloudfunctions.net/pepia" -ForegroundColor Cyan
} catch {
    Write-Host "  ⚠️  Não foi possível obter URLs automaticamente" -ForegroundColor Yellow
    Write-Host "  Verifique no Firebase Console: https://console.firebase.google.com" -ForegroundColor Gray
}

# ============================================
# FINALIZAÇÃO
# ============================================
Write-Host @"

╔═══════════════════════════════════════╗
║   ✅ DEPLOY CONCLUÍDO COM SUCESSO!   ║
╚═══════════════════════════════════════╝

📝 Próximos passos:
  1. Teste o sistema acessando a URL do Hosting
  2. Verifique os logs: firebase functions:log
  3. Monitore no Console: https://console.firebase.google.com

💡 Comandos úteis:
  - Ver logs: firebase functions:log
  - Re-deploy functions: .\deploy-firebase.ps1 -OnlyFunctions
  - Re-deploy hosting: .\deploy-firebase.ps1 -OnlyHosting
  - Deploy sem rebuild: .\deploy-firebase.ps1 -SkipBuild

"@ -ForegroundColor Green

# Abrir no navegador (opcional)
$openBrowser = Read-Host "Deseja abrir o sistema no navegador? (s/n)"
if ($openBrowser -eq 's') {
    try {
        $currentProject = (firebase use --json | ConvertFrom-Json).project
        Start-Process "https://$currentProject.web.app"
    } catch {
        Write-Host "Não foi possível abrir automaticamente." -ForegroundColor Yellow
    }
}

Write-Host "`n🎉 Script finalizado!" -ForegroundColor Cyan
