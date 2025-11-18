"""
Script de inicialização do Backend ML
"""
import sys
import os

print("🚀 Iniciando Backend ML...")
print(f"Python: {sys.version}")
print(f"Diretório: {os.getcwd()}")

try:
    from app import app
    print("✅ App importado com sucesso")
    print("📡 Iniciando servidor em http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
except Exception as e:
    print(f"❌ Erro ao iniciar: {e}")
    import traceback
    traceback.print_exc()
