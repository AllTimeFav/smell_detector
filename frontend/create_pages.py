import os

pages = ['Dashboard', 'Analysis', 'AntiPatterns', 'Reports', 'History', 'Settings']
for p in pages:
    content = f"""import React from 'react';

export default function {p}() {{
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{p}</h1>
      <p className="text-zinc-500">This page is under construction.</p>
    </div>
  );
}}
"""
    os.makedirs(f'src/pages/{p}', exist_ok=True)
    with open(f'src/pages/{p}/index.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
