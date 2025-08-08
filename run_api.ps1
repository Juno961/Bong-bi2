Set-Location "$PSScriptRoot\bongbi-api"
. .\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload