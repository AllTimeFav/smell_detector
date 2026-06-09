import os
from flask import Flask, request, jsonify, render_template
from main import analyze_code

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file:
        code_bytes = file.read()
        try:
            results = analyze_code(code_bytes)
            return jsonify({'success': True, 'results': results, 'filename': file.filename})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
