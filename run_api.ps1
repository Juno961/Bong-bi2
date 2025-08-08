Set-Location "$PSScriptRoot\bongbi-api"
.\venv\Scripts\activate
uvicorn app.main:app --reload