"""Update/refresh endpoints."""
import subprocess
import sys
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from loguru import logger

from app.database import get_db
from app.deps.admin import verify_admin_token
from app.schemas import UpdateResponse

router = APIRouter()


@router.post("/", response_model=UpdateResponse)
async def trigger_update(
    token: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """Trigger data refresh (admin only)."""
    logger.info("Manual update triggered")
    
    try:
        # Run the daily refresh script
        script_path = Path("/data-pipeline/jobs/daily_refresh.py")
        
        if not script_path.exists():
            # Fallback for local development
            script_path = Path(__file__).parent.parent.parent.parent / "data-pipeline" / "jobs" / "daily_refresh.py"
        
        if script_path.exists():
            result = subprocess.run(
                [sys.executable, str(script_path)],
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes timeout
            )
            
            if result.returncode == 0:
                logger.info("Update completed successfully")
                return UpdateResponse(
                    success=True,
                    message="Data refresh completed successfully",
                    facilities_updated=0,  # Parse from output if needed
                    sessions_added=0
                )
            else:
                logger.error(f"Update failed: {result.stderr}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Update failed: {result.stderr[:200]}"
                )
        else:
            raise HTTPException(
                status_code=500,
                detail="Update script not found"
            )
    
    except subprocess.TimeoutExpired:
        logger.error("Update timed out")
        raise HTTPException(status_code=500, detail="Update timed out")
    except Exception as e:
        logger.exception(f"Update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

