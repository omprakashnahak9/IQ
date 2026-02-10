import os
import psycopg2
from psycopg2.extras import execute_values
import numpy as np
from dotenv import load_dotenv
import time

load_dotenv()

class DatabaseService:
    def __init__(self):
        self.conn = None
        self.max_retries = 3
        self.retry_delay = 2
        self._connect_with_retry()
        if self.conn:
            self._ensure_vector_extension()
    
    def _connect_with_retry(self):
        """Connect to database with retry logic"""
        db_host = os.getenv('DB_HOST')
        db_name = os.getenv('DB_NAME')
        db_user = os.getenv('DB_USER')
        db_password = os.getenv('DB_PASSWORD')
        db_port = os.getenv('DB_PORT', '5432')  # Default to 5432 if not specified
        
        print(f"Attempting to connect to: {db_host}:{db_port}")
        
        for attempt in range(self.max_retries):
            try:
                self.conn = psycopg2.connect(
                    host=db_host,
                    port=db_port,
                    database=db_name,
                    user=db_user,
                    password=db_password,
                    connect_timeout=10
                )
                print(f"✓ Connected to database successfully!")
                return
            except psycopg2.OperationalError as e:
                print(f"Connection attempt {attempt + 1}/{self.max_retries} failed: {e}")
                if attempt < self.max_retries - 1:
                    print(f"Retrying in {self.retry_delay} seconds...")
                    time.sleep(self.retry_delay)
                else:
                    print("❌ Failed to connect to database after all retries")
                    print("\nTroubleshooting:")
                    print("1. Check your internet connection")
                    print("2. Verify DB_HOST in .env file")
                    print("3. Check if firewall is blocking port 5432")
                    print("4. Try flushing DNS: ipconfig /flushdns")
                    raise
    
    def _ensure_vector_extension(self):
        if not self.conn:
            return
        try:
            with self.conn.cursor() as cur:
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                self.conn.commit()
        except Exception as e:
            print(f"Warning: Could not ensure vector extension: {e}")
    
    def store_embedding(self, student_id, embedding):
        if not self.conn:
            print("No database connection available")
            return False
            
        try:
            embedding_list = embedding.tolist()
            
            with self.conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO students (student_id, face_embedding)
                    VALUES (%s, %s)
                    ON CONFLICT (student_id) 
                    DO UPDATE SET face_embedding = EXCLUDED.face_embedding
                """, (student_id, embedding_list))
                
                self.conn.commit()
            return True
        except Exception as e:
            print(f"Error storing embedding: {e}")
            self.conn.rollback()
            return False
    
    def find_match(self, query_embedding, threshold=0.6):
        if not self.conn:
            print("No database connection available")
            return None
            
        try:
            embedding_list = query_embedding.tolist()
            
            with self.conn.cursor() as cur:
                cur.execute("""
                    SELECT student_id, name,
                           1 - (face_embedding <=> %s::vector) as similarity
                    FROM students
                    WHERE face_embedding IS NOT NULL
                    ORDER BY face_embedding <=> %s::vector
                    LIMIT 1
                """, (embedding_list, embedding_list))
                
                result = cur.fetchone()
                
                if result and result[2] >= threshold:
                    return {
                        'student_id': result[0],
                        'name': result[1],
                        'similarity': result[2]
                    }
            
            return None
        except Exception as e:
            print(f"Error finding match: {e}")
            return None
