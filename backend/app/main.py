from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import text
import redis
import os
import logging
import json
from openai import OpenAI
import httpx

from app.config import settings
from app.database import Base, engine, get_db
from app.models import Task

import logging
logger = logging.getLogger("aidt")
logging.basicConfig(level=logging.INFO)

redis_client = redis.Redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    socket_connect_timeout=2
)

openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY,
    default_headers={
        "HTTP-Referer": "http://192.168.0.102",
        "X-Title": "AI Discover Tunisia",
    },
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield
    redis_client.close()

app = FastAPI(
    title="AI Discover Tunisia API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000", "http://192.168.0.102:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskCreate(BaseModel):
    title: str
    description: str = ""
    department: str = "General"
    assigned_to: str = "AI CEO"

class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    department: str
    status: str
    assigned_to: str

@app.get("/")
def root():
    return {
        "company": "AI Discover Tunisia",
        "system": "AI Media Agency",
        "status": "online"
    }

@app.get("/health")
def health():
    result = {"api": "ok", "postgres": "unknown", "redis": "unknown"}

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        result["postgres"] = "ok"
    except Exception:
        result["postgres"] = "error"

    try:
        redis_client.ping()
        result["redis"] = "ok"
    except Exception:
        result["redis"] = "error"

    if "error" in result.values():
        raise HTTPException(status_code=503, detail=result)

    return result

@app.post("/api/tasks", response_model=TaskResponse)
def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    task = Task(**data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@app.get("/api/tasks", response_model=list[TaskResponse])
def list_tasks(db: Session = Depends(get_db)):
    return db.query(Task).order_by(Task.id.desc()).all()

# ============ AI CEO Command Endpoint ============

class CommandCreate(BaseModel):
    text: str

class CommandResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    analysis: str
    department: str
    status: str

# Rule-based analyzer (بديل مؤقت بلا OpenAI)
DEPARTMENT_KEYWORDS = {
    "Marketing": ["تسويق", "حملة", "إعلان", "marketing", "campaign", "ads", "tiktok", "facebook", "instagram"],
    "Content Studio": ["فيديو", "محتوى", "content", "video", "مونتاج", "تصوير", "youtube"],
    "Finance": ["مالية", "ميزانية", "أرباح", "finance", "budget", "revenue", "فلوس"],
    "Research": ["بحث", "تحليل", "research", "analysis", "دراسة", "جمهور"],
    "Engineering": ["برمجة", "كود", "code", "development", "backend", "frontend", "تطوير"],
    "SEO": ["seo", "كلمات مفتاحية", "keywords", "بحث جوجل", "google"],
}

def analyze_command(text: str) -> tuple[str, str]:
    """نحلّلوا الأمر بـ OpenRouter (موديل مجاني). fallback للـ rule-based."""
    if not settings.OPENROUTER_API_KEY:
        return _analyze_fallback(text)

    try:
        prompt = f"""أنت مدير تنفيذي لشركة AI Discover Tunisia (وكالة إعلامية ذكية).
حلّل أمر المالك وحدّد القسم المسؤول.

الأقسام:
- Marketing (تسويق، حملات، إعلانات)
- Content Studio (فيديو، محتوى، مونتاج)
- Finance (مالية، ميزانية، أرباح)
- Research (بحث، تحليل، دراسة)
- Engineering (برمجة، تطوير، كود)
- SEO (كلمات مفتاحية، تحسين محركات البحث)
- General (أي شيء آخر)

أمر المالك: "{text}"

أرجع JSON فقط، بلا أي نص إضافي:
{{"department": "اسم_القسم", "analysis": "شرح قصير بالعربية"}}"""

        response = openrouter_client.chat.completions.create(
            model="nvidia/nemotron-3-ultra-550b-a55b:free",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=300,
        )

        content = response.choices[0].message.content.strip()

        if "{" in content and "}" in content:
            json_str = content[content.index("{"):content.rindex("}")+1]
            data = json.loads(json_str)
            department = data.get("department", "General")
            analysis = data.get("analysis", "")
            valid_depts = ["Marketing", "Content Studio", "Finance", "Research", "Engineering", "SEO", "General"]
            if department not in valid_depts:
                department = "General"
            if not analysis:
                analysis = f"تم تحليل الأمر. القسم المسؤول: {department}."
            return analysis, department
    except Exception as e:
        print(f"[OpenRouter error] {type(e).__name__}: {e}")

    return _analyze_fallback(text)


def _analyze_fallback(text: str) -> tuple[str, str]:
    """rule-based fallback."""
    text_lower = text.lower()
    matched = []
    for dept, keywords in DEPARTMENT_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower or kw in text:
                matched.append(dept)
                break

    if matched:
        department = matched[0]
        analysis = f"تم تحليل الأمر. القسم المسؤول: {department}."
    else:
        department = "General"
        analysis = "تم استلام الأمر. سيتم تحويله إلى المدير التنفيذي للمراجعة."

    return analysis, department


async def send_to_n8n(command_id: int, text: str, department: str, analysis: str):
    """نبعثوا الأمر لـ n8n."""
    logger.info(f"[n8n] send_to_n8n called: command_id={command_id}, department={department}")
    if not settings.N8N_WEBHOOK_URL:
        logger.warning("[n8n] N8N_WEBHOOK_URL فارغ، تخطّينا")
        return
    try:
        logger.info(f"[n8n] نبعثوا لـ {settings.N8N_WEBHOOK_URL}")
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                settings.N8N_WEBHOOK_URL,
                json={
                    "command_id": command_id,
                    "text": text,
                    "department": department,
                    "analysis": analysis,
                    "source": "AI Discover Tunisia",
                },
            )
            logger.info(f"[n8n] ✅ تم! status={resp.status_code}, response={resp.text[:100]}")
    except Exception as e:
        logger.error(f"[n8n] ❌ خطأ: {type(e).__name__}: {e}")


@app.post("/api/ceo/command", response_model=CommandResponse)
async def ceo_command(data: CommandCreate, db: Session = Depends(get_db)):
    from app.models import Command

    if not data.text or not data.text.strip():
        raise HTTPException(status_code=400, detail="الأمر فارغ")

    analysis, department = analyze_command(data.text)

    command = Command(
        text=data.text.strip(),
        analysis=analysis,
        department=department,
        status="pending",
    )
    db.add(command)
    db.commit()
    db.refresh(command)

    await send_to_n8n(command.id, command.text, command.department, command.analysis)

    return command


@app.get("/api/ceo/commands", response_model=list[CommandResponse])
def list_commands(db: Session = Depends(get_db)):
    from app.models import Command
    return db.query(Command).order_by(Command.id.desc()).all()

# ============ AI CEO Commands — Extended ============

class CommandUpdate(BaseModel):
    status: str | None = None
    department: str | None = None

@app.get("/api/ceo/commands/{command_id}", response_model=CommandResponse)
def get_command(command_id: int, db: Session = Depends(get_db)):
    from app.models import Command
    cmd = db.query(Command).filter(Command.id == command_id).first()
    if not cmd:
        raise HTTPException(status_code=404, detail="الأمر غير موجود")
    return cmd


@app.patch("/api/ceo/commands/{command_id}", response_model=CommandResponse)
def update_command(command_id: int, data: CommandUpdate, db: Session = Depends(get_db)):
    from app.models import Command
    cmd = db.query(Command).filter(Command.id == command_id).first()
    if not cmd:
        raise HTTPException(status_code=404, detail="الأمر غير موجود")
    if data.status is not None:
        cmd.status = data.status
    if data.department is not None:
        cmd.department = data.department
    db.commit()
    db.refresh(cmd)
    return cmd


@app.delete("/api/ceo/commands/{command_id}")
def delete_command(command_id: int, db: Session = Depends(get_db)):
    from app.models import Command
    cmd = db.query(Command).filter(Command.id == command_id).first()
    if not cmd:
        raise HTTPException(status_code=404, detail="الأمر غير موجود")
    db.delete(cmd)
    db.commit()
    return {"ok": True, "deleted_id": command_id}
