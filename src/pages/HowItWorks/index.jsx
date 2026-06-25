import React from 'react';
import { motion } from 'framer-motion';
import { CodeWindow } from './components/CodeWindow';
import { FileCode2, Network, SearchCheck, ArrowDown } from 'lucide-react';

const cppSnippet = `class Configuration {
public:
    int retries;
    int timeout;
    bool verbose;
    bool debug;
    char mode;
    float threshold;
private:
    int internal_state;
};`;

const astSnippet = `class_specifier [7, 0] - [18, 1]
  name: type_identifier "Configuration"
  body: field_declaration_list
    access_specifier "public:"
    field_declaration
      type: primitive_type "int"
      declarator: field_identifier "retries"
    field_declaration
      type: primitive_type "int"
      declarator: field_identifier "timeout"
    ...
    access_specifier "private:"
    field_declaration
      type: primitive_type "int"
      declarator: field_identifier "internal_state"`;

const pythonSnippet = `def traverse_ast_for_public_data_members(node: Node, classes: list):
    if node.type in ('class_specifier', 'struct_specifier'):
        name_node = node.child_by_field_name('name')
        class_name = name_node.text.decode('utf-8')
        body_node = node.child_by_field_name('body')
        
        public_fields = 0
        current_access = 'private'
        
        for child in body_node.children:
            if child.type == 'access_specifier':
                if child.text.decode('utf-8').strip().startswith('public'):
                    current_access = 'public'
            elif child.type == 'field_declaration' and current_access == 'public':
                public_fields += 1

        if public_fields > PUBLIC_DATA_THRESHOLD:
            classes.append({ "name": class_name, "count": public_fields })`;

const fadeUpVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export default function HowItWorks() {
  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 sm:px-12 lg:px-24 text-center max-w-5xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeUpVariant}>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-6">
            Under the Hood
          </h1>
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            The Anti-Pattern Detector leverages <span className="font-semibold text-indigo-600 dark:text-indigo-400">Tree-sitter</span>, an incremental parsing system, 
            to transform raw C++ source code into a robust Abstract Syntax Tree (AST). 
            We then traverse this tree using Python to statically analyze and identify architectural smells.
          </p>
        </motion.div>
      </section>

      {/* Pipeline Steps */}
      <div className="max-w-6xl mx-auto px-6 sm:px-12">
        
        {/* Step 1: Raw Code */}
        <motion.section 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUpVariant}
          className="flex flex-col lg:flex-row items-center gap-12 py-12"
        >
          <div className="flex-1 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileCode2 size={32} />
            </div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">1. Source Code Ingestion</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
              It starts with your raw C++ codebase. Our system supports reading large-scale C++ projects, 
              looking for classes, structures, and their respective properties. Here we see a class with 
              an excessive number of public data members, a classic code smell.
            </p>
          </div>
          <div className="flex-1 w-full">
            <CodeWindow code={cppSnippet} language="cpp" title="Configuration.cpp" height="280px" />
          </div>
        </motion.section>

        {/* Connecting Arrow */}
        <div className="flex justify-center text-zinc-300 dark:text-zinc-700 py-4">
          <ArrowDown size={40} />
        </div>

        {/* Step 2: AST */}
        <motion.section 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUpVariant}
          className="flex flex-col lg:flex-row-reverse items-center gap-12 py-12"
        >
          <div className="flex-1 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Network size={32} />
            </div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">2. Tree-sitter Parsing</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
              Tree-sitter converts the plain text into a structured Abstract Syntax Tree. 
              Notice how <code>class_specifier</code> nodes encapsulate <code>field_declaration_list</code>.
              This structural context is crucial, allowing us to accurately distinguish between public and private access modifiers without relying on brittle regex matching.
            </p>
          </div>
          <div className="flex-1 w-full">
            <CodeWindow code={astSnippet} language="yaml" title="AST Output (Tree-sitter)" height="320px" />
          </div>
        </motion.section>

        {/* Connecting Arrow */}
        <div className="flex justify-center text-zinc-300 dark:text-zinc-700 py-4">
          <ArrowDown size={40} />
        </div>

        {/* Step 3: Python Detector */}
        <motion.section 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUpVariant}
          className="flex flex-col lg:flex-row items-center gap-12 py-12"
        >
          <div className="flex-1 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <SearchCheck size={32} />
            </div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">3. Pattern Matching</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
              Finally, our Python backend traverses the AST. It tracks the current access specifier 
              (<code>public</code> or <code>private</code>) as it walks the tree. When it encounters a 
              <code>field_declaration</code> under a <code>public</code> context, it increments a counter.
              If the threshold is exceeded, the anti-pattern is logged.
            </p>
          </div>
          <div className="flex-1 w-full">
            <CodeWindow code={pythonSnippet} language="python" title="excessive_data_detector.py" height="380px" />
          </div>
        </motion.section>

      </div>
    </div>
  );
}
