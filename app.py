import os
import json
from datetime import datetime
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

import tree_sitter_cpp
from tree_sitter import Language
from refused_bequest_detector import build_symbol_table, run_refused_bequest_check
from speculative_generality_detector import analyze_speculative_generality

@app.post("/api/analyze")
async def analyze(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No selected files")
        
    all_issues = []
    files_analyzed = 0
    file_contents = {}
    
    for file in files:
        if not file.filename: continue
        
        # Filter for valid C/C++ extensions
        if not file.filename.lower().endswith(('.cpp', '.h', '.hpp', '.cxx', '.cc', '.c')):
            continue
            
        try:
            code_bytes = await file.read()
            file_contents[file.filename] = code_bytes
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

    # Run the new Refused Bequest cross-file analysis
    try:
        cpp_language = Language(tree_sitter_cpp.language())
        classes_dict, _ = build_symbol_table(directory=None, cpp_language=cpp_language, file_contents=file_contents)
        rb_issues = run_refused_bequest_check(classes_dict)
        
        for rb_issue in rb_issues:
            desc = f"Class '{rb_issue['child_class']}' actively refuses {rb_issue['ratio']*100:.1f}% of inherited methods from '{rb_issue['parent_class']}'. Flagged methods: " + ", ".join([f"{m} ({r})" for m, r in rb_issue['flagged_methods']])
            
            # Extract line numbers (Tree-sitter uses 0-indexed line numbers)
            l_start = rb_issue['start_point'][0] + 1
            l_end = rb_issue['end_point'][0] + 1
            
            file_path = rb_issue['file_path']
            content = file_contents.get(file_path, b"").decode('utf-8', errors='replace')
            lines = content.split('\n')
            
            context_start = max(1, l_start - 3)
            context_end = min(len(lines), l_end + 3)
            snippet = "\n".join(lines[context_start-1:context_end])
            
            all_issues.append({
                "id": f"refused_{rb_issue['child_class']}",
                "type": "Refused Bequest",
                "severity": "High",
                "name": rb_issue['child_class'],
                "line_start": l_start,
                "line_end": l_end,
                "context_start": context_start,
                "context_end": context_end,
                "description": desc,
                "snippet": snippet,
                "filename": file_path
            })
            
        sg_issues = analyze_speculative_generality(cpp_language, file_contents=file_contents)
        for sg_issue in sg_issues:
            desc = f"Class '{sg_issue['class_name']}' exhibits Speculative Generality. Indicators found: " + ", ".join(sg_issue['indicators'])
            
            l_start = sg_issue['start_point'][0] + 1
            l_end = sg_issue['end_point'][0] + 1
            
            file_path = sg_issue['file_path']
            content = file_contents.get(file_path, b"").decode('utf-8', errors='replace')
            lines = content.split('\n')
            
            context_start = max(1, l_start - 3)
            context_end = min(len(lines), l_end + 3)
            snippet = "\n".join(lines[context_start-1:context_end])
            
            all_issues.append({
                "id": f"speculative_{sg_issue['class_name']}",
                "type": "Speculative Generality",
                "severity": "Low",
                "name": sg_issue['class_name'],
                "line_start": l_start,
                "line_end": l_end,
                "context_start": context_start,
                "context_end": context_end,
                "description": desc,
                "snippet": snippet,
                "filename": file_path
            })

    except Exception as e:
        print(f"Error running cross-file checks: {e}")

    # Calculate mock health score
    score = max(0, 100 - (len(all_issues) * 5))
    
    # Save to history
    try:
        history_file = "history.json"
        history = []
        if os.path.exists(history_file):
            with open(history_file, 'r') as f:
                history = json.load(f)
        
        history.append({
            "id": len(history) + 1,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "time": datetime.now().strftime("%H:%M"),
            "files": files_analyzed,
            "issues": len(all_issues),
            "score": score
        })
        
        with open(history_file, 'w') as f:
            json.dump(history, f)
    except Exception as e:
        print(f"Failed to save history: {e}")

    return {"success": True, "files_analyzed": files_analyzed, "results": {"issues": all_issues}}

@app.get("/api/history")
def get_history():
    history_file = "history.json"
    if os.path.exists(history_file):
        with open(history_file, 'r') as f:
            return json.load(f)
    return []

if __name__ == '__main__':
    uvicorn.run("app:app", host="127.0.0.1", port=5000, reload=True)
