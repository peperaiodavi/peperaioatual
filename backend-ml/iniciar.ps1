# Script de Inicialização Automática - Backend ML
# Execute este script para configurar e iniciar o backend Python

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sistema de Inteligência Financeira ML" -ForegroundColor Cyan
Write-Host "  Configuração Automática" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Python está instalado
Write-Host "[1/6] Verificando Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python encontrado: $pythonVersion" -ForegroundColor Green
}
catch {
    Write-Host "✗ Python não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale Python 3.8+ de https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Navegar para diretório backend-ml
Write-Host "[2/6] Navegando para backend-ml..." -ForegroundColor Yellow
$backendPath = "c:\dev\Peperaio Cvisual\backend-ml"
if (Test-Path $backendPath) {
    Set-Location $backendPath
    Write-Host "✓ Diretório encontrado: $backendPath" -ForegroundColor Green
}
else {
    Write-Host "✗ Diretório não encontrado: $backendPath" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar se ambiente virtual existe
Write-Host "[3/6] Verificando ambiente virtual..." -ForegroundColor Yellow
if (Test-Path ".\venv") {
    Write-Host "✓ Ambiente virtual já existe" -ForegroundColor Green
}
else {
    Write-Host "→ Criando ambiente virtual..." -ForegroundColor Cyan
    python -m venv venv
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Ambiente virtual criado com sucesso" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Erro ao criar ambiente virtual" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Ativar ambiente virtual e instalar dependências
Write-Host "[4/6] Instalando dependências..." -ForegroundColor Yellow
Write-Host "→ Ativando ambiente virtual..." -ForegroundColor Cyan

# Ativar venv e executar pip install
& .\venv\Scripts\Activate.ps1
if ($LASTEXITCODE -eq 0 -or $?) {
    Write-Host "✓ Ambiente virtual ativado" -ForegroundColor Green
    
    Write-Host "→ Instalando pacotes Python..." -ForegroundColor Cyan
    pip install -r requirements.txt --quiet
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Dependências instaladas com sucesso" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Erro ao instalar dependências" -ForegroundColor Red
        Write-Host "Tente manualmente: pip install -r requirements.txt" -ForegroundColor Yellow
        exit 1
    }
}
else {
    Write-Host "✗ Erro ao ativar ambiente virtual" -ForegroundColor Red
    Write-Host "Tente executar manualmente:" -ForegroundColor Yellow
    Write-Host "  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
    Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Testar importações Python
Write-Host "[5/6] Testando bibliotecas..." -ForegroundColor Yellow
$testScript = @"
import flask
import pandas
import numpy
import sklearn
print('OK')
"@

$testResult = python -c $testScript 2>&1
if ($testResult -match "OK") {
    Write-Host "✓ Todas as bibliotecas estão funcionando" -ForegroundColor Green
}
else {
    Write-Host "⚠ Aviso: Algumas bibliotecas podem ter problemas" -ForegroundColor Yellow
}

Write-Host ""

# Iniciar servidor Flask
Write-Host "[6/6] Iniciando servidor Flask..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Servidor ML rodando em:" -ForegroundColor Green
Write-Host "  http://localhost:5000" -ForegroundColor Green
Write-Host ""
Write-Host "  Para parar: Ctrl+C" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

python app.py
