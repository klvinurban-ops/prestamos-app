# PrestamosPro - Iniciar servidor con mas memoria para Node
# Ejecutar en PowerShell: .\run-dev.ps1

$env:NODE_OPTIONS = "--max-old-space-size=4096"
Write-Host "Iniciando con NODE_OPTIONS=$env:NODE_OPTIONS" -ForegroundColor Green
npm run dev
