import os
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from main import analyze_code
import uvicorn

app = FastAPI(title="C++ Anti-Pattern Detector API")

# Allow requests from the Vite React dev server (default port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development. In production, restrict this.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze")
async def analyze(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No selected files")
        
    all_issues = []
    files_analyzed = 0
    
    for file in files:
        if not file.filename: continue
        
        # Filter for valid C/C++ extensions
        if not file.filename.lower().endswith(('.cpp', '.h', '.hpp', '.cxx', '.cc', '.c')):
            continue
            
        try:
            code_bytes = await file.read()
            results = analyze_code(code_bytes)
            # Tag each issue with the filename so the frontend knows where it came from
            for issue in results.get("issues", []):
                issue["filename"] = file.filename
                all_issues.append(issue)
            files_analyzed += 1
        except Exception as e:
            print(f"Error analyzing {file.filename}: {e}")
            
    if files_analyzed == 0:
         raise HTTPException(status_code=400, detail="No valid C++ files found in upload")

    return {"success": True, "files_analyzed": files_analyzed, "results": {"issues": all_issues}}

if __name__ == '__main__':
    uvicorn.run("app:app", host="127.0.0.1", port=5000, reload=True)
