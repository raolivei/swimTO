"""Logo generation endpoints."""
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger
import httpx
import base64
from io import BytesIO

from app.config import settings

router = APIRouter()


class LogoGenerationRequest(BaseModel):
    prompt: str
    model: str = "dalle-3"  # dalle-3, dalle-2, or leonardo
    n: int = 1  # Number of images to generate
    size: str = "1024x1024"  # Image size


class GeneratedLogo(BaseModel):
    image_url: str
    image_data: str  # base64 encoded
    model: str
    prompt: str


class LogoGenerationResponse(BaseModel):
    logos: List[GeneratedLogo]
    model: str


async def generate_with_openai(prompt: str, n: int = 1, size: str = "1024x1024") -> List[GeneratedLogo]:
    """Generate logo using OpenAI DALL-E."""
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=500,
            detail="OpenAI API key not configured. Please set OPENAI_API_KEY in .env"
        )
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Use DALL-E 3 API
            response = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "dall-e-3",
                    "prompt": prompt,
                    "n": 1,  # DALL-E 3 only supports n=1
                    "size": size,
                    "quality": "standard",
                    "response_format": "url"
                }
            )
            
            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                logger.error(f"OpenAI API error: {error_data}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("error", {}).get("message", "Failed to generate image")
                )
            
            data = response.json()
            logos = []
            
            for item in data.get("data", []):
                image_url = item.get("url")
                if image_url:
                    # Download and convert to base64
                    img_response = await client.get(image_url)
                    img_response.raise_for_status()
                    image_data = base64.b64encode(img_response.content).decode('utf-8')
                    data_url = f"data:image/png;base64,{image_data}"
                    
                    logos.append(GeneratedLogo(
                        image_url=image_url,
                        image_data=data_url,
                        model="dalle-3",
                        prompt=prompt
                    ))
            
            return logos
            
    except httpx.HTTPError as e:
        logger.error(f"HTTP error generating logo: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate logo: {str(e)}")
    except Exception as e:
        logger.error(f"Error generating logo: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


async def generate_with_leonardo(prompt: str, n: int = 1) -> List[GeneratedLogo]:
    """Generate logo using Leonardo.ai API."""
    if not settings.leonardo_api_key:
        raise HTTPException(
            status_code=500,
            detail="Leonardo.ai API key not configured. Please set LEONARDO_API_KEY in .env"
        )
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Create generation
            response = await client.post(
                "https://cloud.leonardo.ai/api/rest/v1/generations",
                headers={
                    "Authorization": f"Bearer {settings.leonardo_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "prompt": prompt,
                    "num_images": min(n, 4),  # Leonardo limits to 4
                    "width": 1024,
                    "height": 1024,
                    "modelId": "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3",  # Leonardo Diffusion XL
                }
            )
            
            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                logger.error(f"Leonardo API error: {error_data}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("error", "Failed to generate image")
                )
            
            data = response.json()
            generation_id = data.get("sdGenerationJob", {}).get("generationId")
            
            if not generation_id:
                raise HTTPException(status_code=500, detail="No generation ID returned")
            
            # Poll for completion (simplified - in production use webhooks)
            import asyncio
            for _ in range(30):  # Wait up to 30 seconds
                await asyncio.sleep(2)
                status_response = await client.get(
                    f"https://cloud.leonardo.ai/api/rest/v1/generations/{generation_id}",
                    headers={"Authorization": f"Bearer {settings.leonardo_api_key}"}
                )
                
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    if status_data.get("generations_by_pk", {}).get("status") == "COMPLETE":
                        images = status_data.get("generations_by_pk", {}).get("generated_images", [])
                        logos = []
                        for img in images:
                            image_url = img.get("url")
                            if image_url:
                                img_response = await client.get(image_url)
                                img_response.raise_for_status()
                                image_data = base64.b64encode(img_response.content).decode('utf-8')
                                data_url = f"data:image/png;base64,{image_data}"
                                
                                logos.append(GeneratedLogo(
                                    image_url=image_url,
                                    image_data=data_url,
                                    model="leonardo",
                                    prompt=prompt
                                ))
                        return logos
            
            raise HTTPException(status_code=500, detail="Generation timed out")
            
    except httpx.HTTPError as e:
        logger.error(f"HTTP error generating logo: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate logo: {str(e)}")
    except Exception as e:
        logger.error(f"Error generating logo: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.post("/generate", response_model=LogoGenerationResponse)
async def generate_logo(request: LogoGenerationRequest):
    """Generate logo images using AI."""
    try:
        if request.model == "dalle-3" or request.model == "dalle-2":
            logos = await generate_with_openai(request.prompt, request.n, request.size)
        elif request.model == "leonardo":
            logos = await generate_with_leonardo(request.prompt, request.n)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported model: {request.model}")
        
        return LogoGenerationResponse(logos=logos, model=request.model)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error generating logo: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate logo: {str(e)}")

