
from fastapi import APIRouter

router = APIRouter()

@router.post("/login")
async def login_user():
    return {"message": "User logged in"}