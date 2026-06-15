@echo off
echo ==========================================
echo    WEB WIZARDS - Manufacturing Optimizer
echo    Starting Demo...
echo ==========================================
start cmd /k "cd /d C:\Users\Reshmitha\OneDrive\Desktop\manufacturing_optimizer && venv\Scripts\activate && set GROQ_API_KEY=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 && uvicorn main:app --reload"
timeout /t 3
start cmd /k "cd /d C:\Users\Reshmitha\OneDrive\Desktop\manufacturing_optimizer\frontend && npm start"
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:3000
pause