from fastapi import FastAPI
from app.api.calculate_router import router

app = FastAPI()
app.include_router(router)

