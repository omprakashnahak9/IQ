from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from services.face_recognition import FaceRecognitionService
from utils.image_preprocessing import preprocess_image
import cv2
import numpy as np
import os
import base64
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Gate Verification AI Service")

# Add CORS middleware for admin web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize face service without database (backend will handle DB)
face_service = FaceRecognitionService(use_database=False)

class EnrollRequest(BaseModel):
    student_id: str
    images: List[str]  # Base64 encoded images

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-model"}

@app.post("/extract-embedding")
async def extract_embedding(image: UploadFile = File(...)):
    """Extract face embedding from image - returns embedding vector"""
    try:
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image")
        
        processed_img = preprocess_image(img)
        embedding = face_service.extract_embedding(processed_img)
        
        if embedding is None:
            raise HTTPException(status_code=400, detail="No face detected")
        
        return JSONResponse(content={
            "success": True,
            "embedding": embedding.tolist()
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@app.post("/enroll")
async def enroll_student(request: EnrollRequest):
    """
    Enroll a student with multiple face images
    Generates average embedding from all provided images
    """
    try:
        if not request.images or len(request.images) == 0:
            raise HTTPException(status_code=400, detail="No images provided")
        
        print(f"\n{'='*60}")
        print(f"Processing enrollment for student: {request.student_id}")
        print(f"Number of images received: {len(request.images)}")
        print(f"{'='*60}\n")
        
        embeddings = []
        failed_images = 0
        
        # Process each image and extract embedding
        for idx, base64_image in enumerate(request.images):
            try:
                print(f"Processing image {idx + 1}/{len(request.images)}...")
                
                # Decode base64 image
                image_bytes = base64.b64decode(base64_image)
                nparr = np.frombuffer(image_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if img is None:
                    print(f"  ✗ Image {idx + 1} could not be decoded")
                    failed_images += 1
                    continue
                
                print(f"  Image shape: {img.shape}")
                
                # Preprocess and extract embedding
                processed_img = preprocess_image(img)
                print(f"  Extracting face embedding...")
                embedding = face_service.extract_embedding(processed_img)
                
                if embedding is not None:
                    embeddings.append(embedding)
                    print(f"  ✓ Successfully extracted embedding (dim: {len(embedding)})")
                else:
                    print(f"  ✗ No face detected in image {idx + 1}")
                    failed_images += 1
                    
            except Exception as e:
                print(f"  ✗ Error processing image {idx + 1}: {str(e)}")
                failed_images += 1
                continue
        
        print(f"\n{'='*60}")
        print(f"Processing complete:")
        print(f"  Success: {len(embeddings)}/{len(request.images)} images")
        print(f"  Failed: {failed_images}/{len(request.images)} images")
        print(f"{'='*60}\n")
        
        # Check if we got at least one valid embedding
        if len(embeddings) == 0:
            raise HTTPException(
                status_code=400, 
                detail=f"No valid face embeddings extracted from {len(request.images)} images. Please ensure faces are clearly visible and well-lit."
            )
        
        # Calculate average embedding from all valid images
        avg_embedding = np.mean(embeddings, axis=0)
        print(f"✓ Generated average embedding from {len(embeddings)} images")
        print(f"  Embedding dimensions: {len(avg_embedding)}")
        
        return JSONResponse(content={
            "success": True,
            "student_id": request.student_id,
            "embedding": avg_embedding.tolist(),
            "images_processed": len(embeddings),
            "images_failed": failed_images,
            "total_images": len(request.images)
        })
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"\n✗ Enrollment failed: {str(e)}\n")
        raise HTTPException(status_code=500, detail=f"Enrollment failed: {str(e)}")

@app.post("/verify")
async def verify_face(image: UploadFile = File(...)):
    """Legacy endpoint - just extracts embedding, backend handles matching"""
    return await extract_embedding(image)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"Starting AI Model Service on port {port}")
    print("Database operations handled by backend service")
    uvicorn.run(app, host="0.0.0.0", port=port)
