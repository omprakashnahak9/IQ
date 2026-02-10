from deepface import DeepFace
from deepface.commons import functions
import numpy as np
import cv2
import os

class FaceRecognitionService:
    def __init__(self, use_database=True):
        self.use_database = use_database
        self.threshold = 0.6
        # Using Facenet model - produces 128-dimensional embeddings
        self.model_name = "Facenet"
        
        if use_database:
            from services.database import DatabaseService
            self.db_service = DatabaseService()
        else:
            self.db_service = None
            print("✓ Face recognition service initialized (database-free mode)")
        
    def extract_embedding(self, image):
        """
        Extract face embedding from image using DeepFace
        Args:
            image: numpy array (BGR format from OpenCV)
        Returns:
            embedding: 128-dimensional face encoding or None if no face detected
        """
        try:
            # Ensure image is in correct format
            if len(image.shape) == 2:
                image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
            
            # DeepFace expects RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            print(f"  Input image shape: {rgb_image.shape}, dtype: {rgb_image.dtype}")
            
            # Extract embedding using DeepFace
            print(f"  Calling DeepFace.represent()...")
            result = DeepFace.represent(
                img_path=rgb_image,
                model_name=self.model_name,
                enforce_detection=False,
                detector_backend='opencv'
            )
            
            print(f"  Result type: {type(result)}")
            
            # DeepFace 0.0.75 returns embedding directly as a list of floats
            if isinstance(result, list):
                # Check if it's a list of floats (the embedding itself)
                if len(result) > 0 and isinstance(result[0], (float, np.floating)):
                    # This IS the embedding
                    embedding = np.array(result)
                    print(f"  Direct embedding list, length: {len(embedding)}")
                # Or it's a list containing dict(s)
                elif len(result) > 0 and isinstance(result[0], dict):
                    if 'embedding' in result[0]:
                        embedding = np.array(result[0]['embedding'])
                        print(f"  Embedding from dict, length: {len(embedding)}")
                    else:
                        print(f"  Dict without 'embedding' key: {result[0].keys()}")
                        return None
                else:
                    print(f"  Unexpected list content: {type(result[0]) if len(result) > 0 else 'empty'}")
                    return None
            else:
                print(f"  Unexpected result type: {type(result)}")
                return None
            
            # Validate embedding dimensions
            if embedding.shape[0] != 128:
                print(f"  Invalid embedding dimensions: {embedding.shape[0]}, expected 128")
                return None
            
            print(f"  ✓ Successfully extracted embedding: shape={embedding.shape}")
            return embedding
            
        except Exception as e:
            print(f"  Error in extract_embedding: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def verify_face(self, image):
        """
        Verify a face against enrolled students in database
        """
        if not self.db_service:
            raise Exception("Database service not available in database-free mode")
            
        embedding = self.extract_embedding(image)
        
        if embedding is None:
            return {
                "verified": False,
                "message": "No face detected",
                "confidence": 0.0
            }
        
        match = self.db_service.find_match(embedding, self.threshold)
        
        if match:
            return {
                "verified": True,
                "student_id": match['student_id'],
                "name": match.get('name', 'Unknown'),
                "confidence": float(match['similarity'])
            }
        
        return {
            "verified": False,
            "message": "Face not recognized",
            "confidence": 0.0
        }
    
    def enroll_student(self, student_id, image):
        """
        Enroll a new student by storing their face embedding
        """
        if not self.db_service:
            raise Exception("Database service not available in database-free mode")
            
        embedding = self.extract_embedding(image)
        
        if embedding is None:
            return False
        
        return self.db_service.store_embedding(student_id, embedding)
