import cv2
import numpy as np

def preprocess_image(image):
    """
    Preprocess image for face recognition
    Args:
        image: numpy array (BGR format from OpenCV)
    Returns:
        preprocessed image in BGR format (DeepFace will handle RGB conversion)
    """
    # Convert grayscale to BGR if needed
    if len(image.shape) == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    
    # Ensure image is in correct format
    if image.shape[2] == 4:  # BGRA to BGR
        image = cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
    
    # Return in BGR format - DeepFace will convert to RGB internally
    return image

def resize_image(image, target_size=(640, 640)):
    return cv2.resize(image, target_size)

def normalize_image(image):
    return image.astype(np.float32) / 255.0
