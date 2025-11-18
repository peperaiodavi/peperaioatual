# Script para executar Backend ML + Frontend React automaticamente
# Abre 2 terminais PowerShell separados

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Sistema de IA Financeira" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Terminal 1: Backend ML (Python)
Write-Host "[1/3] Iniciando Backend Python ML..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd 'c:\dev\Peperaio Cvisual\backend-ml'; Write-Host 'Backend ML - Python Flask' -ForegroundColor Green; .\iniciar.ps1"
)

Write-Host "✓ Backend iniciando em nova janela..." -ForegroundColor Green
Write-Host ""

# Aguardar backend inicializar
Write-Host "[2/3] Aguardando backend inicializar (8 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Terminal 2: Frontend React
Write-Host "[2/3] Iniciando Frontend React..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd 'c:\dev\Peperaio Cvisual'; Write-Host 'Frontend React - Vite' -ForegroundColor Green; npm run dev"
)

Write-Host "✓ Frontend iniciando em nova janela..." -ForegroundColor Green
Write-Host ""

# Aguardar frontend inicializar e abrir navegador
Write-Host "[3/3] Aguardando frontend inicializar (12 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 12

Write-Host "Abrindo navegador..." -ForegroundColor Yellow
Start-Process "http://localhost:5173/inteligencia-financeira"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Sistema Iniciado com Sucesso!" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "  Backend ML:  http://localhost:5000" -ForegroundColor Green
Write-Host "  Frontend:    http://localhost:5173" -ForegroundColor Green
Write-Host "  Dashboard:   /inteligencia-financeira" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "  Para parar: Feche os terminais abertos" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pressione qualquer tecla para fechar esta janela..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
