
      // HTML code content
        let htmlCodeDisplay = document.getElementById("htmlCodeContent");
        let htmlPreviewDisplay = document.getElementById("htmlPreviewDisplay");

        let htmlFullCode = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Modern UI Component</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f5f5f5;
        }
        .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            padding: 24px;
            max-width: 400px;
            margin: 20px auto;
        }
        .card-header {
            margin-bottom: 16px;
        }
        .card-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #111;
        }
        .card-subtitle {
            color: #666;
            font-size: 0.9rem;
            margin-top: 4px;
        }
        .stats {
            display: flex;
            gap: 16px;
        }
        .stat-item {
            flex: 1;
            background: #f8f9fa;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        }
        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #3a86ff;
        }
        .stat-label {
            font-size: 0.75rem;
            color: #666;
            margin-top: 4px;
        }
        .action-btn {
            background: #3a86ff;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 20px;
            font-size: 0.9rem;
            font-weight: 500;
            width: 100%;
            margin-top: 20px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .action-btn:hover {
            background: #2878fb;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">Project Overview</h2>
            <p class="card-subtitle">Weekly statistics</p>
        </div>
        
        <div class="stats">
            <div class="stat-item">
                <div class="stat-value">24</div>
                <div class="stat-label">Tasks</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">8</div>
                <div class="stat-label">Active</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">16</div>
                <div class="stat-label">Completed</div>
            </div>
        </div>
        
        <button class="action-btn">View Details</button>
    </div>
</body>
</html>`;

        // JavaScript code content
        let jsCodeDisplay = document.getElementById("jsCodeContent");
        let jsPreviewDisplay = document.getElementById("jsPreviewDisplay");

        let jsFullCode = `// Project Task Manager
class TaskManager {
    constructor() {
        this.tasks = [];
        this.taskId = 1;
    }
    
    addTask(title, priority = 'medium') {
        const newTask = {
            id: this.taskId++,
            title,
            priority,
            status: 'active',
            createdAt: new Date(),
            completedAt: null
        };
        
        this.tasks.push(newTask);
        console.log(\`Task created: '\${title}' (ID: \${newTask.id})\`);
        return newTask;
    }
    
    completeTask(id) {
        const task = this.tasks.find(task => task.id === id);
        
        if (task) {
            task.status = 'completed';
            task.completedAt = new Date();
            console.log(\`Task completed: '\${task.title}' (ID: \${id})\`);
            return true;
        } else {
            console.error(\`Task with ID \${id} not found\`);
            return false;
        }
    }
    
    deleteTask(id) {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(task => task.id !== id);
        
        if (this.tasks.length < initialLength) {
            console.log(\`Task with ID \${id} deleted\`);
            return true;
        } else {
            console.error(\`Task with ID \${id} not found\`);
            return false;
        }
    }
    
    getTasksByStatus(status) {
        return this.tasks.filter(task => task.status === status);
    }
    
    getStats() {
        const stats = {
            total: this.tasks.length,
            active: this.getTasksByStatus('active').length,
            completed: this.getTasksByStatus('completed').length
        };
        
        console.log('Current stats:', stats);
        return stats;
    }
}

// Initialize and demonstrate the TaskManager
const projectTasks = new TaskManager();

// Add some tasks
projectTasks.addTask('Set up project repository', 'high');
projectTasks.addTask('Create wireframes', 'high');
projectTasks.addTask('Design database schema', 'medium');
projectTasks.addTask('Write API documentation', 'low');

// Complete some tasks
projectTasks.completeTask(1);
projectTasks.completeTask(2);

// Get current stats
projectTasks.getStats();`;

        // Animation settings
        let htmlIndex = 0;
        let jsIndex = 0;
        let htmlTypedCode = "";
        let jsTypedCode = "";
        let totalAnimationTime = 8000; // 8 seconds total
        
        // Calculate typing speed based on code length and desired total time
        let htmlTypingSpeed = totalAnimationTime / htmlFullCode.length;
        let jsTypingSpeed = totalAnimationTime / jsFullCode.length;

        // HTML typing animation
        function typeHtmlCode() {
            if (htmlIndex < htmlFullCode.length) {
                htmlTypedCode += htmlFullCode[htmlIndex];
                htmlCodeDisplay.innerText = htmlTypedCode;
                hljs.highlightElement(htmlCodeDisplay);
                showHtmlPreview();
                htmlIndex++;
                setTimeout(typeHtmlCode, htmlTypingSpeed);
            } else {
                // When finished, restart after a short pause
                setTimeout(resetHtmlTyping, 2000);
            }
        }

        // JavaScript typing animation
        function typeJsCode() {
            if (jsIndex < jsFullCode.length) {
                jsTypedCode += jsFullCode[jsIndex];
                jsCodeDisplay.innerText = jsTypedCode;
                hljs.highlightElement(jsCodeDisplay);
                showJsPreview();
                jsIndex++;
                setTimeout(typeJsCode, jsTypingSpeed);
            } else {
                // When finished, restart after a short pause
                setTimeout(resetJsTyping, 2000);
            }
        }

        function showHtmlPreview() {
            // Safely handle HTML content
            htmlPreviewDisplay.innerHTML = htmlTypedCode;
        }

        function showJsPreview() {
            // Create console output for JavaScript preview
            let output = "";
            
            // Determine how far we are in the code typing
            const codeProgress = jsTypedCode.length / jsFullCode.length;
            
            // Generate console output based on code progress
            if (codeProgress > 0.5) {
                output += createConsoleEntry("Task created: 'Set up project repository' (ID: 1)");
            }
            if (codeProgress > 0.6) {
                output += createConsoleEntry("Task created: 'Create wireframes' (ID: 2)");
            }
            if (codeProgress > 0.7) {
                output += createConsoleEntry("Task created: 'Design database schema' (ID: 3)");
                output += createConsoleEntry("Task created: 'Write API documentation' (ID: 4)");
            }
            if (codeProgress > 0.8) {
                output += createConsoleEntry("Task completed: 'Set up project repository' (ID: 1)");
                output += createConsoleEntry("Task completed: 'Create wireframes' (ID: 2)");
            }
            if (codeProgress > 0.9) {
                output += createConsoleEntry("Current stats: {total: 4, active: 2, completed: 2}");
            }
            
            jsPreviewDisplay.innerHTML = output;
        }
        
        function createConsoleEntry(message) {
            const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return `<div class="console-line">
                        <span class="console-prompt">></span>
                        <span class="console-message">${message}</span>
                        <span class="console-time">${time}</span>
                    </div>`;
        }

        function resetHtmlTyping() {
            htmlIndex = 0;
            htmlTypedCode = "";
            htmlCodeDisplay.innerText = "";
            typeHtmlCode();
        }

        function resetJsTyping() {
            jsIndex = 0;
            jsTypedCode = "";
            jsCodeDisplay.innerText = "";
            typeJsCode();
        }

        function toggleSection(section) {
            // Handle HTML editor toggles
            if (section === "html-code") {
                document.getElementById("html-code-box").classList.add("code-visible");
                document.getElementById("html-preview-box").classList.remove("code-visible");
                document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelector(`[onclick="toggleSection('html-code')"]`).classList.add('active');
            } else if (section === "html-preview") {
                document.getElementById("html-code-box").classList.remove("code-visible");
                document.getElementById("html-preview-box").classList.add("code-visible");
                document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelector(`[onclick="toggleSection('html-preview')"]`).classList.add('active');
            } 
            // Handle JavaScript editor toggles
            else if (section === "js-code") {
                document.getElementById("js-code-box").classList.add("code-visible");
                document.getElementById("js-preview-box").classList.remove("code-visible");
                document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelector(`[onclick="toggleSection('js-code')"]`).classList.add('active');
            } else if (section === "js-preview") {
                document.getElementById("js-code-box").classList.remove("code-visible");
                document.getElementById("js-preview-box").classList.add("code-visible");
                document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelector(`[onclick="toggleSection('js-preview')"]`).classList.add('active');
            }
        }

        // Start both animations
        typeHtmlCode();
        typeJsCode();
    
      
// HTML typing animation
function typeHtmlCode() {
    if (htmlIndex < htmlFullCode.length) {
        htmlTypedCode += htmlFullCode[htmlIndex];
        htmlCodeDisplay.innerHTML = htmlTypedCode;
        hljs.highlightElement(htmlCodeDisplay);
        showHtmlPreview();
        htmlIndex++;
        setTimeout(typeHtmlCode, htmlTypingSpeed);
    } else {
        // When finished, restart after a short pause
        setTimeout(resetHtmlTyping, 2000);
    }
}

// JavaScript typing animation
function typeJsCode() {
    if (jsIndex < jsFullCode.length) {
        jsTypedCode += jsFullCode[jsIndex];
        jsCodeDisplay.innerHTML = jsTypedCode;
        hljs.highlightElement(jsCodeDisplay);
        showJsPreview();
        jsIndex++;
        setTimeout(typeJsCode, jsTypingSpeed);
    } else {
        // When finished, restart after a short pause
        setTimeout(resetJsTyping, 2000);
    }
}

function resetHtmlTyping() {
    htmlIndex = 0;
    htmlTypedCode = "";
    htmlCodeDisplay.innerHTML = "";
    typeHtmlCode();
}

function resetJsTyping() {
    jsIndex = 0;
    jsTypedCode = "";
    jsCodeDisplay.innerHTML = "";
    typeJsCode();
}
    