(
// Monaco Editor Configuration - Use global monaco object if it exists, otherwise configure
if (typeof monaco === 'undefined') {
    // Use Monaco Editor from CDN with safety checks to prevent duplicate loading
    if (!window.monacoLoading && !window.editorLoaded) {
        window.monacoLoading = true;
        require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.40.0/min/vs' } });
        require(['vs/editor/editor.main'], function() {
            window.editorLoaded = true;
            window.monacoLoading = false;
            initEditor();
        });
    }
} else if (!window.editorLoaded) {
    window.editorLoaded = true;
    initEditor();
}

function initEditor() {
    // Main editor instance
    let currentEditor = null;
    let currentLanguage = 'html';
    let currentFile = 'index.html';
    
    // Enhanced file system storage with folder support
    const fileSystem = {
        files: {
            'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n</body>\n</html>'
        },
        getLanguage(fileName) {
            const extension = fileName.split('.').pop().toLowerCase();
            const languageMap = {
                'html': 'html',
                'css': 'css',
                'js': 'javascript',
                'php': 'php',
                'json': 'json',
                'md': 'markdown',
                'txt': 'plaintext',
                'ts': 'typescript'
            };
            return languageMap[extension] || 'plaintext';
        },
        // Check if path exists (file or folder)
        pathExists(path) {
            // Check if it's a file
            if (this.files[path]) return true;
            
            // Check if it's a folder (prefix of any file)
            return Object.keys(this.files).some(filePath => 
                filePath.startsWith(path + '/'));
        }
    };
    
    // Folder management functions
    function createFolder(folderName) {
        // Create an empty file in the folder to represent it
        const dummyFilePath = `${folderName}/.gitkeep`;
        if (!fileSystem.files[dummyFilePath]) {
            fileSystem.files[dummyFilePath] = '';
            updateFileTree();
            saveFileSystem();
        }
    }
    
    function renameFolder(oldPath, newName) {
        const parentPath = oldPath.includes('/') ? 
            oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
        const newPath = parentPath ? `${parentPath}/${newName}` : newName;
        
        // Make sure new path doesn't already exist
        if (fileSystem.pathExists(newPath)) {
            alert(`A folder or file named '${newName}' already exists`);
            return;
        }
        
        // Find all files in the folder and rename them
        Object.keys(fileSystem.files).forEach(filePath => {
            if (filePath === oldPath || filePath.startsWith(oldPath + '/')) {
                const newFilePath = filePath.replace(oldPath, newPath);
                fileSystem.files[newFilePath] = fileSystem.files[filePath];
                delete fileSystem.files[filePath];
                
                // If current file is being renamed, update currentFile
                if (currentFile === filePath) {
                    currentFile = newFilePath;
                }
            }
        });
        
        updateFileTree();
        saveFileSystem();
    }
    
    function copyFolder(sourcePath, newName) {
        const parentPath = sourcePath.includes('/') ? 
            sourcePath.substring(0, sourcePath.lastIndexOf('/')) : '';
        const targetPath = parentPath ? `${parentPath}/${newName}` : newName;
        
        // Make sure target path doesn't already exist
        if (fileSystem.pathExists(targetPath)) {
            alert(`A folder or file named '${newName}' already exists`);
            return;
        }
        
        // Copy all files in the folder
        Object.keys(fileSystem.files).forEach(filePath => {
            if (filePath === sourcePath || filePath.startsWith(sourcePath + '/')) {
                const newFilePath = filePath.replace(sourcePath, targetPath);
                fileSystem.files[newFilePath] = fileSystem.files[filePath];
            }
        });
        
        updateFileTree();
        saveFileSystem();
    }
    
    function deleteFolder(folderPath) {
        // Find all files in the folder and delete them
        Object.keys(fileSystem.files).forEach(filePath => {
            if (filePath === folderPath || filePath.startsWith(folderPath + '/')) {
                // If current file is being deleted, switch to another file
                if (currentFile === filePath) {
                    const otherFiles = Object.keys(fileSystem.files).filter(f => 
                        f !== filePath && !f.startsWith(folderPath + '/'));
                    if (otherFiles.length > 0) {
                        openFile(otherFiles[0]);
                    }
                }
                
                delete fileSystem.files[filePath];
            }
        });
        
        updateFileTree();
        saveFileSystem();
    }
    
    // Generic item delete function for bash commands
    function deleteItem(path) {
        if (fileSystem.files[path]) {
            // It's a file
            delete fileSystem.files[path];
            if (currentFile === path) {
                const otherFiles = Object.keys(fileSystem.files);
                if (otherFiles.length > 0) {
                    openFile(otherFiles[0]);
                }
            }
        } else if (fileSystem.pathExists(path)) {
            // It's a folder
            deleteFolder(path);
        }
        
        updateFileTree();
        saveFileSystem();
    }

    // Editor setup
    const editorOptions = {
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        formatOnPaste: true,
        formatOnType: true,
        autoIndent: 'full',
        tabSize: 2,
        scrollBeyondLastLine: false
    };

    // Create initial editor
    currentEditor = monaco.editor.create(document.getElementById('monaco-editor'), {
        ...editorOptions,
        language: currentLanguage,
        value: fileSystem.files[currentFile]
    });

    // Navigation setup
    const navItems = document.querySelectorAll('.nav-item');
    const editorSections = document.querySelectorAll('.editor-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;
            navItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
            editorSections.forEach(section => {
                section.style.display = section.id === target ? 'flex' : 'none';
            });
        });
    });
    
    // DevTools tab setup
    function setupDevToolsTabs() {
        const devToolTabs = document.querySelectorAll('.devtool-tab');
        
        devToolTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active tab
                devToolTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show relevant content
                const tool = tab.dataset.tool;
                
                // Clear console if switching to a different tool
                if (tool !== 'console') {
                    consoleOutput.innerHTML = '';
                }
                
                // Update console header title
                document.querySelector('#console .editor-title').textContent = 
                    tool === 'console' ? 'Console' : 
                    tool === 'network' ? 'Network Monitor' : 'Bash Terminal';
                
                // Show bash input only for bash tab
                const bashTerminal = document.querySelector('.bash-terminal');
                if (bashTerminal) {
                    bashTerminal.style.display = tool === 'bash' ? 'block' : 'none';
                }
            });
        });
    }

    // Enhanced File Manager Implementation with Folder Support
    function updateFileTree() {
        const fileTree = document.getElementById('file-tree');
        fileTree.innerHTML = '';
        
        // Add folder creation button
        const newFolderBtn = document.createElement('button');
        newFolderBtn.className = 'new-folder-btn btn';
        newFolderBtn.innerHTML = '<i class="fa-solid fa-folder-plus"></i> New Folder';
        newFolderBtn.addEventListener('click', () => {
            const folderName = prompt('Enter folder name:');
            if (folderName && folderName.trim()) {
                createFolder(folderName.trim());
            }
        });
        
        // Add close button for mobile
        const closeFileManagerBtn = document.createElement('button');
        closeFileManagerBtn.className = 'close-file-manager btn';
        closeFileManagerBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
        closeFileManagerBtn.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.remove('show');
        });
        
        const fileManagerHeader = document.querySelector('.file-manager-header');
        fileManagerHeader.appendChild(newFolderBtn);
        if (window.innerWidth <= 768) {
            fileManagerHeader.appendChild(closeFileManagerBtn);
        }
        
        // Keep track of folders
        const folders = {};
        Object.keys(fileSystem.files).forEach(path => {
            if (path.includes('/')) {
                const parts = path.split('/');
                let currentPath = '';
                for (let i = 0; i < parts.length - 1; i++) {
                    const folderName = parts[i];
                    currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
                    folders[currentPath] = true;
                }
            }
        });
        
        // Render folders first
        Object.keys(folders).sort().forEach(folderPath => {
            const folderItem = document.createElement('div');
            folderItem.className = 'folder-item';
            folderItem.dataset.folderPath = folderPath;
            
            const folderName = folderPath.split('/').pop();
            
            folderItem.innerHTML = `
                <div class="folder-header">
                    <i class="fa-solid fa-folder"></i>
                    <span class="folder-name">${folderName}</span>
                    <div class="folder-actions">
                        <button class="folder-action-btn rename-folder" data-folder="${folderPath}"><i class="fa-solid fa-pencil"></i></button>
                        <button class="folder-action-btn copy-folder" data-folder="${folderPath}"><i class="fa-solid fa-copy"></i></button>
                        <button class="folder-action-btn delete-folder" data-folder="${folderPath}"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="folder-content"></div>
            `;
            
            fileTree.appendChild(folderItem);
            
            // Add event listeners for folder actions
            folderItem.querySelector('.folder-header').addEventListener('click', (e) => {
                if (!e.target.closest('.folder-actions')) {
                    folderItem.classList.toggle('open');
                }
            });
            
            folderItem.querySelector('.rename-folder').addEventListener('click', (e) => {
                e.stopPropagation();
                const oldPath = e.target.closest('.rename-folder').dataset.folder;
                const newName = prompt('Enter new folder name:', oldPath.split('/').pop());
                if (newName && newName.trim()) {
                    renameFolder(oldPath, newName.trim());
                }
            });
            
            folderItem.querySelector('.copy-folder').addEventListener('click', (e) => {
                e.stopPropagation();
                const folderPath = e.target.closest('.copy-folder').dataset.folder;
                const newName = prompt('Enter name for the copied folder:', `copy_of_${folderPath.split('/').pop()}`);
                if (newName && newName.trim()) {
                    copyFolder(folderPath, newName.trim());
                }
            });
            
            folderItem.querySelector('.delete-folder').addEventListener('click', (e) => {
                e.stopPropagation();
                const folderPath = e.target.closest('.delete-folder').dataset.folder;
                if (confirm(`Delete folder '${folderPath}' and all its contents?`)) {
                    deleteFolder(folderPath);
                }
            });
        });
        
        // Then render files
        Object.keys(fileSystem.files).sort().forEach(fileName => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.fileName = fileName;
            
            if (fileName === currentFile) {
                fileItem.classList.add('active');
            }
            
            const extension = fileName.split('.').pop().toLowerCase();
            let icon = 'fa-file';
            
            // Set appropriate icon based on file type
            switch (extension) {
                case 'html': icon = 'fa-html5'; break;
                case 'css': icon = 'fa-css3-alt'; break;
                case 'js': icon = 'fa-js'; break;
                case 'php': icon = 'fa-php'; break;
                case 'json': icon = 'fa-code'; break;
                case 'md': icon = 'fa-markdown'; break;
                case 'ts': icon = 'fa-js'; break;
                default: icon = 'fa-file-code'; break;
            }
            
            fileItem.innerHTML = `
                <i class="fa-brands ${icon}"></i>
                <span class="file-name">${fileName.split('/').pop()}</span>
                <div class="file-actions">
                    <button class="file-action-btn rename-file" data-file="${fileName}"><i class="fa-solid fa-pencil"></i></button>
                    <button class="file-action-btn copy-file" data-file="${fileName}"><i class="fa-solid fa-copy"></i></button>
                    <button class="file-action-btn delete-file" data-file="${fileName}"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            
            fileItem.addEventListener('click', (e) => {
                if (!e.target.closest('.file-actions')) {
                    openFile(fileName);
                }
            });
            
            // Put file in appropriate folder
            if (fileName.includes('/')) {
                const folderPath = fileName.substring(0, fileName.lastIndexOf('/'));
                const folderItem = document.querySelector(`.folder-item[data-folder-path="${folderPath}"]`);
                if (folderItem) {
                    folderItem.querySelector('.folder-content').appendChild(fileItem);
                } else {
                    fileTree.appendChild(fileItem);
                }
            } else {
                fileTree.appendChild(fileItem);
            }
        });
        
        // Add event listeners for rename, copy, delete
        document.querySelectorAll('.rename-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileName = btn.dataset.file;
                const newName = prompt('Enter new file name:', fileName);
                if (newName && newName !== fileName && !fileSystem.files[newName]) {
                    fileSystem.files[newName] = fileSystem.files[fileName];
                    delete fileSystem.files[fileName];
                    if (currentFile === fileName) {
                        openFile(newName);
                    } else {
                        updateFileTree();
                    }
                    saveFileSystem();
                }
            });
        });
        
        document.querySelectorAll('.copy-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileName = btn.dataset.file;
                let newName = `copy_of_${fileName}`;
                let counter = 1;
                
                // Ensure unique name
                while (fileSystem.files[newName]) {
                    newName = `copy_of_${fileName}_${counter}`;
                    counter++;
                }
                
                fileSystem.files[newName] = fileSystem.files[fileName];
                updateFileTree();
                saveFileSystem();
            });
        });
        
        document.querySelectorAll('.delete-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileName = btn.dataset.file;
                if (Object.keys(fileSystem.files).length <= 1) {
                    alert("Cannot delete the last file.");
                    return;
                }
                
                if (confirm(`Delete ${fileName}?`)) {
                    delete fileSystem.files[fileName];
                    
                    if (currentFile === fileName) {
                        // Open first available file
                        const nextFile = Object.keys(fileSystem.files)[0];
                        openFile(nextFile);
                    } else {
                        updateFileTree();
                    }
                    saveFileSystem();
                }
            });
        });
    }
    
    // Open file function
    function openFile(fileName) {
        // Save current file content
        if (currentFile && currentEditor) {
            fileSystem.files[currentFile] = currentEditor.getValue();
        }
        
        currentFile = fileName;
        currentLanguage = fileSystem.getLanguage(fileName);
        
        // Dispose old model and editor to prevent memory leaks
        if (currentEditor) {
            currentEditor.dispose();
        }
        
        // Create new editor with appropriate language
        currentEditor = monaco.editor.create(document.getElementById('monaco-editor'), {
            ...editorOptions,
            language: currentLanguage,
            value: fileSystem.files[fileName] || ''
        });
        
        // Update UI
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.toggle('active', item.dataset.fileName === fileName);
        });
        
        document.querySelector('.editor-title').textContent = `Editor - ${fileName}`;
        
        // Auto-save functionality
        currentEditor.onDidChangeModelContent(() => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                fileSystem.files[currentFile] = currentEditor.getValue();
                saveFileSystem();
            }, 1000);
        });
    }
    
    // New file functionality
    document.getElementById('new-file-btn').addEventListener('click', () => {
        document.getElementById('new-file-modal').style.display = 'block';
    });
    
    document.getElementById('create-file').addEventListener('click', () => {
        const fileName = document.getElementById('new-file-name').value.trim();
        if (fileName) {
            if (fileSystem.files[fileName]) {
                alert('File already exists!');
                return;
            }
            
            // Create empty file with appropriate template based on extension
            const extension = fileName.split('.').pop().toLowerCase();
            let template = '';
            
            switch (extension) {
                case 'html':
                    template = '<!DOCTYPE html>\n<html>\n<head>\n  <title>New Page</title>\n</head>\n<body>\n  <h1>New HTML File</h1>\n</body>\n</html>';
                    break;
                case 'css':
                    template = '/* CSS Styles */\nbody {\n  margin: 0;\n  padding: 20px;\n  font-family: Arial, sans-serif;\n}';
                    break;
                case 'js':
                    template = '// JavaScript Code\nconsole.log("Hello from JavaScript!");';
                    break;
                case 'php':
                    template = '<?php\n  // PHP Code\n  echo "Hello from PHP!";\n?>';
                    break;
                case 'json':
                    template = '{\n  "key": "value"\n}';
                    break;
                case 'md':
                    template = '# Markdown Document\n\nThis is a new markdown file.';
                    break;
                case 'ts':
                    template = '// TypeScript Code\nfunction greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));';
                    break;
                default:
                    template = '';
            }
            
            fileSystem.files[fileName] = template;
            updateFileTree();
            openFile(fileName);
            saveFileSystem();
            document.getElementById('new-file-modal').style.display = 'none';
            document.getElementById('new-file-name').value = '';
        }
    });
    
    document.getElementById('close-new-file-modal').addEventListener('click', () => {
        document.getElementById('new-file-modal').style.display = 'none';
    });
    
    // Enhanced Preview functionality with viewport controls and local server simulation
    function updatePreview() {
        // Find HTML file to use as base
        let htmlFile = currentFile;
        if (!htmlFile.endsWith('.html')) {
            // Look for index.html or first HTML file
            const htmlFiles = Object.keys(fileSystem.files).filter(f => f.endsWith('.html'));
            htmlFile = htmlFiles.includes('index.html') ? 'index.html' : (htmlFiles[0] || null);
        }
        
        if (!htmlFile) {
            document.getElementById('preview-iframe').srcdoc = '<h1>No HTML file found</h1>';
            return;
        }
        
        // Create preview controls if they don't exist
        if (!document.getElementById('preview-controls')) {
            const previewControls = document.createElement('div');
            previewControls.id = 'preview-controls';
            previewControls.className = 'preview-controls';
            
            // Viewport selector
            const viewportSelector = document.createElement('select');
            viewportSelector.id = 'viewport-selector';
            viewportSelector.className = 'viewport-selector';
            
            const viewports = [
                { name: 'Responsive', width: '100%', height: '100%' },
                { name: 'Desktop', width: '1920px', height: '1080px' },
                { name: 'Laptop', width: '1366px', height: '768px' },
                { name: 'Tablet', width: '768px', height: '1024px' },
                { name: 'Mobile', width: '375px', height: '667px' }
            ];
            
            viewports.forEach(viewport => {
                const option = document.createElement('option');
                option.value = JSON.stringify({ width: viewport.width, height: viewport.height });
                option.textContent = viewport.name;
                viewportSelector.appendChild(option);
            });
            
            viewportSelector.addEventListener('change', () => {
                const { width, height } = JSON.parse(viewportSelector.value);
                const iframe = document.getElementById('preview-iframe');
                const previewContainer = document.getElementById('preview-container');
                
                if (width === '100%') {
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    previewContainer.style.justifyContent = 'flex-start';
                    previewContainer.style.alignItems = 'flex-start';
                    previewContainer.style.overflow = 'hidden';
                } else {
                    iframe.style.width = width;
                    iframe.style.height = height;
                    previewContainer.style.justifyContent = 'center';
                    previewContainer.style.alignItems = 'center';
                    previewContainer.style.overflow = 'auto';
                }
            });
            
            // Refresh button
            const refreshBtn = document.createElement('button');
            refreshBtn.className = 'btn';
            refreshBtn.innerHTML = '<i class="fa-solid fa-sync"></i>';
            refreshBtn.addEventListener('click', updatePreview);
            
            // Address bar to simulate local hosting
            const addressBar = document.createElement('div');
            addressBar.className = 'address-bar';
            
            const protocol = document.createElement('span');
            protocol.className = 'protocol';
            protocol.textContent = 'http://';
            
            const domain = document.createElement('span');
            domain.className = 'domain';
            domain.textContent = 'localhost:8080/';
            
            const path = document.createElement('span');
            path.className = 'path';
            path.textContent = htmlFile;
            
            addressBar.appendChild(protocol);
            addressBar.appendChild(domain);
            addressBar.appendChild(path);
            
            // Create preview container for iframe
            const previewContainer = document.createElement('div');
            previewContainer.id = 'preview-container';
            previewContainer.className = 'preview-container';
            
            // Move existing iframe into container
            const existingIframe = document.getElementById('preview-iframe');
            const previewSection = document.getElementById('preview');
            previewSection.removeChild(existingIframe);
            previewContainer.appendChild(existingIframe);
            
            // Assemble controls
            previewControls.appendChild(addressBar);
            previewControls.appendChild(viewportSelector);
            previewControls.appendChild(refreshBtn);
            
            // Add controls and container to preview section
            const previewHeader = document.querySelector('#preview .editor-header');
            previewHeader.insertAdjacentElement('afterend', previewControls);
            previewSection.appendChild(previewContainer);
        }
        
        // Update address bar path
        document.querySelector('.address-bar .path').textContent = htmlFile;
        
        // Extract CSS and JS references from HTML
        let htmlContent = fileSystem.files[htmlFile];
        let cssContent = '';
        let jsContent = '';
        
        // Add all CSS files
        Object.keys(fileSystem.files).filter(f => f.endsWith('.css')).forEach(cssFile => {
            cssContent += fileSystem.files[cssFile] + '\n';
        });
        
        // Add all JS files
        Object.keys(fileSystem.files).filter(f => f.endsWith('.js') && f !== 'script.js').forEach(jsFile => {
            jsContent += fileSystem.files[jsFile] + '\n';
        });
        
        // Create preview document with base URL support to simulate a local server
        const previewDoc = `
            <!DOCTYPE html>
            <html>
            <head>
                <base href="http://localhost:8080/">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${cssContent}</style>
            </head>
            <body>
                ${htmlContent}
                <script>${jsContent}</script>
                <script>
                    // Override fetch to simulate relative path resolution
                    const originalFetch = window.fetch;
                    window.fetch = function(url, options) {
                        if (url.startsWith('/') || !url.startsWith('http')) {
                            console.log('Simulating fetch for:', url);
                            // We can't actually fetch local resources, but we can simulate the response
                            return new Promise((resolve) => {
                                resolve(new Response('{"simulated":"data"}', {
                                    status: 200,
                                    headers: {'Content-Type': 'application/json'}
                                }));
                            });
                        }
                        return originalFetch(url, options);
                    };
                </script>
            </body>
            </html>
        `;
        
        // Update preview
        document.getElementById('preview-iframe').srcdoc = previewDoc;
        
        // Simulate network requests in the Network tab
        if (document.querySelector('.devtool-tab[data-tool="network"].active')) {
            logToConsole([`GET http://localhost:8080/${htmlFile} 200 OK`], 'network');
            
            // Simulate additional network requests
            setTimeout(() => {
                Object.keys(fileSystem.files).filter(f => f.endsWith('.css')).forEach(cssFile => {
                    logToConsole([`GET http://localhost:8080/${cssFile} 200 OK`], 'network');
                });
                
                Object.keys(fileSystem.files).filter(f => f.endsWith('.js')).forEach(jsFile => {
                    logToConsole([`GET http://localhost:8080/${jsFile} 200 OK`], 'network');
                });
                
                // Simulate some image requests
                if (htmlContent.includes('<img')) {
                    logToConsole([`GET http://localhost:8080/images/example.png 200 OK`], 'network');
                }
            }, 500);
        }
    }
    
    // Run button functionality
    document.getElementById('run-btn').addEventListener('click', () => {
        // Save current file
        fileSystem.files[currentFile] = currentEditor.getValue();
        saveFileSystem();
        
        // Format document if available
        if (currentEditor.getAction) {
            try {
                currentEditor.getAction('editor.action.formatDocument').run();
            } catch (e) {
                console.error('Format error:', e);
            }
        }
        
        updatePreview();
        
        // Switch to preview tab
        document.querySelector('[data-target="preview"]').click();
        
        // If current file is PHP, show message
        if (currentFile.endsWith('.php')) {
            console.log('PHP files require a server to run properly.');
        }
    });
    
    // Download functionality
    document.getElementById('download-btn').addEventListener('click', async () => {
        const zip = new JSZip();
        
        // Add all files to the zip
        Object.keys(fileSystem.files).forEach(fileName => {
            zip.file(fileName, fileSystem.files[fileName]);
        });
        
        const content = await zip.generateAsync({type:"blob"});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "web-project.zip";
        link.click();
        URL.revokeObjectURL(link.href);
    });
    
    // Improved Code Bot Implementation with fallback mechanism
    const modal = document.getElementById('code-bot-modal');
    const codeBotBtn = document.getElementById('code-bot-btn');
    const closeModal = document.getElementById('close-modal');
    const generateBtn = document.getElementById('generate-code');
    const copyBtn = document.getElementById('copy-code');
    const codePrompt = document.getElementById('code-prompt');
    const generatedCode = document.getElementById('generated-code');
    
    codeBotBtn.addEventListener('click', () => modal.style.display = 'block');
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    
    generateBtn.addEventListener('click', async () => {
        const prompt = codePrompt.value;
        if (!prompt.trim()) {
            generatedCode.textContent = 'Please enter a prompt.';
            return;
        }
        
        generatedCode.textContent = 'Generating code...';
        
        try {
            // Include file type in the prompt for better context
            const language = fileSystem.getLanguage(currentFile);
            const enhancedPrompt = `Generate ${language} code for: ${prompt}. Only return the code, no explanations.`;
            
            // First attempt with OpenRouter
            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer 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',
                        'HTTP-Referer': location.origin,
                        'X-Title': 'Code Editor'
                    },
                    body: JSON.stringify({
                        model: "openai/gpt-3.5-turbo",  // Fallback to a more reliable model
                        messages: [{ role: "user", content: enhancedPrompt }],
                        max_tokens: 1500,
                        temperature: 0.7
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    generatedCode.textContent = data.choices[0].message.content;
                    return;
                }
            } catch (openRouterError) {
                console.warn('OpenRouter API error:', openRouterError);
                // Continue to fallback
            }
            
            // Fallback to a simplified response with example code
            let fallbackCode = 'Unable to connect to AI service. Here is a simple example:';
            
            // Generate some basic code based on the file type
            switch (language) {
                case 'html':
                    fallbackCode += '\n\n<!DOCTYPE html>\n<html>\n<head>\n  <title>Example</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n  <p>This is a sample HTML page.</p>\n</body>\n</html>';
                    break;
                case 'css':
                    fallbackCode += '\n\nbody {\n  font-family: Arial, sans-serif;\n  background-color: #f0f0f0;\n  color: #333;\n}\n\nh1 {\n  color: #0066cc;\n}';
                    break;
                case 'javascript':
                    fallbackCode += '\n\n// Example JavaScript function\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));';
                    break;
                case 'php':
                    fallbackCode += '\n\n<?php\n// Example PHP function\nfunction greet($name) {\n  return "Hello, " . $name . "!";\n}\n\necho greet("World");\n?>';
                    break;
                default:
                    fallbackCode += '\n\n// Example code for ' + language + '\n// Your code would go here';
            }
            
            generatedCode.textContent = fallbackCode;
            
        } catch (error) {
            console.error('Error generating code:', error);
            generatedCode.textContent = 'Error generating code. Please try again.';
        }
    });
    
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(generatedCode.textContent);
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
        }, 2000);
    });
    
    // Console Implementation
    const clearConsoleBtn = document.getElementById('clear-console');
    const consoleOutput = document.getElementById('console-output');
    
    clearConsoleBtn.addEventListener('click', () => {
        consoleOutput.innerHTML = '';
    });
    
    // Override console methods
    const originalConsole = window.console;
    window.console = {
        log: (...args) => {
            originalConsole.log(...args);
            logToConsole(args, 'log');
        },
        error: (...args) => {
            originalConsole.error(...args);
            logToConsole(args, 'error');
        },
        warn: (...args) => {
            originalConsole.warn(...args);
            logToConsole(args, 'warn');
        },
        info: (...args) => {
            originalConsole.info(...args);
            logToConsole(args, 'info');
        }
    };
    
    function logToConsole(args, type) {
        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        
        const timestamp = document.createElement('span');
        timestamp.className = 'console-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        
        const content = document.createElement('span');
        content.className = 'console-content';
        
        // Handle different types of content
        content.textContent = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
        
        line.appendChild(timestamp);
        line.appendChild(content);
        consoleOutput.appendChild(line);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
    
    // Enhanced Console & DevTools Implementation
    
    // Implement an enhanced console with DevTools capabilities
    function setupEnhancedConsole() {
        // Create a more robust console with detailed logging
        const originalConsole = window.console;
        window.console = {
            log: (...args) => {
                originalConsole.log(...args);
                logToConsole(args, 'log');
            },
            error: (...args) => {
                originalConsole.error(...args);
                logToConsole(args, 'error');
            },
            warn: (...args) => {
                originalConsole.warn(...args);
                logToConsole(args, 'warn');
            },
            info: (...args) => {
                originalConsole.info(...args);
                logToConsole(args, 'info');
            },
            debug: (...args) => {
                originalConsole.debug(...args);
                logToConsole(args, 'debug');
            },
            table: (data, columns) => {
                originalConsole.table(data, columns);
                logTable(data, columns);
            },
            time: (label) => {
                originalConsole.time(label);
                logToConsole([`Timer started: ${label}`], 'time');
            },
            timeEnd: (label) => {
                originalConsole.timeEnd(label);
                logToConsole([`Timer ended: ${label}`], 'time');
            },
            trace: (...args) => {
                originalConsole.trace(...args);
                const stack = new Error().stack;
                logToConsole([...args, `\nStack Trace: ${stack}`], 'trace');
            },
            // Add additional methods to match browser DevTools
            clear: () => {
                originalConsole.clear();
                consoleOutput.innerHTML = '';
            }
        };
    }
    
    function logTable(data, columns) {
        const table = document.createElement('table');
        table.className = 'console-table';
        
        // Create header
        const header = document.createElement('tr');
        if (Array.isArray(data) && data.length > 0) {
            if (columns && Array.isArray(columns)) {
                columns.forEach(col => {
                    const th = document.createElement('th');
                    th.textContent = col;
                    header.appendChild(th);
                });
            } else {
                if (typeof data[0] === 'object') {
                    Object.keys(data[0]).forEach(key => {
                        const th = document.createElement('th');
                        th.textContent = key;
                        header.appendChild(th);
                    });
                } else {
                    const th = document.createElement('th');
                    th.textContent = 'Value';
                    header.appendChild(th);
                }
            }
            table.appendChild(header);
            
            // Create rows
            data.forEach(item => {
                const row = document.createElement('tr');
                if (typeof item === 'object') {
                    Object.values(item).forEach(val => {
                        const td = document.createElement('td');
                        td.textContent = typeof val === 'object' ? JSON.stringify(val) : String(val);
                        row.appendChild(td);
                    });
                } else {
                    const td = document.createElement('td');
                    td.textContent = String(item);
                    row.appendChild(td);
                }
                table.appendChild(row);
            });
        }
        
        const tableContainer = document.createElement('div');
        tableContainer.className = 'console-line table';
        tableContainer.appendChild(table);
        consoleOutput.appendChild(tableContainer);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
    
    // Enhanced Network Tab Implementation  
    function setupNetworkMonitoring() {
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const url = args[0];
            const options = args[1] || {};
            const startTime = performance.now();
            
            logToConsole([`Network Request: ${options.method || 'GET'} ${url}`], 'network');
            
            try {
                const response = await originalFetch.apply(this, args);
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                logToConsole([`Response: ${response.status} ${response.statusText} (${duration.toFixed(2)}ms)`], 'network-response');
                return response;
            } catch (error) {
                logToConsole([`Network Error: ${error.message}`], 'error');
                throw error;
            }
        };
        
        // Monitor XMLHttpRequest
        const originalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalOpen = xhr.open;
            const originalSend = xhr.send;
            
            xhr.open = function(...args) {
                xhr._method = args[0];
                xhr._url = args[1];
                return originalOpen.apply(xhr, args);
            };
            
            xhr.send = function(body) {
                const startTime = performance.now();
                logToConsole([`XHR Request: ${xhr._method} ${xhr._url}`], 'network');
                
                xhr.addEventListener('load', function() {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    logToConsole([`XHR Response: ${xhr.status} (${duration.toFixed(2)}ms)`], 'network-response');
                });
                
                xhr.addEventListener('error', function() {
                    logToConsole([`XHR Error: ${xhr._url}`], 'error');
                });
                
                return originalSend.call(xhr, body);
            };
            
            return xhr;
        };
    }
    
    // Enhanced Bash-like terminal implementation similar to Replit's shell
    function setupBashTerminal() {
        const bashTerminal = document.createElement('div');
        bashTerminal.className = 'bash-terminal';
        
        const bashPrompt = document.createElement('div');
        bashPrompt.className = 'bash-prompt';
        
        const prompt = document.createElement('span');
        prompt.className = 'prompt-text';
        prompt.innerHTML = '<span class="user">user</span>@<span class="host">replit</span>:<span class="dir">~/project</span>$ ';
        
        const bashInput = document.createElement('input');
        bashInput.type = 'text';
        bashInput.className = 'bash-input';
        bashInput.placeholder = '';
        bashInput.setAttribute('spellcheck', 'false');
        
        // Command history functionality
        const commandHistory = [];
        let historyIndex = -1;
        
        bashInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = bashInput.value.trim();
                if (command) {
                    commandHistory.push(command);
                    historyIndex = commandHistory.length;
                    
                    logToConsole([`<span class="prompt-clone">${prompt.innerHTML}</span>${command}`], 'command');
                    executeCommand(command);
                    bashInput.value = '';
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (historyIndex > 0) {
                    historyIndex--;
                    bashInput.value = commandHistory[historyIndex];
                    // Place cursor at end
                    setTimeout(() => {
                        bashInput.selectionStart = bashInput.selectionEnd = bashInput.value.length;
                    }, 0);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    bashInput.value = commandHistory[historyIndex];
                } else if (historyIndex === commandHistory.length - 1) {
                    historyIndex = commandHistory.length;
                    bashInput.value = '';
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                // Implement simple tab completion
                const partialCommand = bashInput.value;
                
                // Tab completion for files
                if (partialCommand.includes(' ')) {
                    const parts = partialCommand.split(' ');
                    const lastPart = parts[parts.length - 1];
                    
                    // Filter files/folders that start with the last part
                    const matches = Object.keys(fileSystem.files)
                        .filter(path => path.startsWith(lastPart) && path !== lastPart);
                    
                    if (matches.length === 1) {
                        parts[parts.length - 1] = matches[0];
                        bashInput.value = parts.join(' ');
                    } else if (matches.length > 1) {
                        // Show options
                        logToConsole([matches.join('  ')], 'output');
                    }
                } else {
                    // Tab completion for commands
                    const commands = ['ls', 'mkdir', 'touch', 'rm', 'cat', 'echo', 'cd', 'pwd', 'clear', 'help'];
                    const matches = commands.filter(cmd => cmd.startsWith(partialCommand) && cmd !== partialCommand);
                    
                    if (matches.length === 1) {
                        bashInput.value = matches[0] + ' ';
                    } else if (matches.length > 1) {
                        logToConsole([matches.join('  ')], 'output');
                    }
                }
            }
        });
        
        // Execute bash commands with expanded functionality
        function executeCommand(command) {
            const args = command.split(' ');
            const cmd = args[0];
            
            switch (cmd) {
                case 'ls':
                    const paths = Object.keys(fileSystem.files).sort();
                    let output = '';
                    paths.forEach(path => {
                        if (path.includes('/')) {
                            const directory = path.substring(0, path.lastIndexOf('/'));
                            if (!output.includes(directory)) {
                                output += `<span class="dir-color">${directory}/</span>  `;
                            }
                        } else {
                            output += `${path}  `;
                        }
                    });
                    logToConsole([output], 'output');
                    break;
                
                case 'mkdir':
                    if (args.length < 2) {
                        logToConsole(['mkdir: missing operand'], 'error');
                    } else {
                        const folderName = args[1].trim();
                        createFolder(folderName);
                        logToConsole([`Directory created: ${folderName}`], 'output');
                    }
                    break;
                
                case 'touch':
                    if (args.length < 2) {
                        logToConsole(['touch: missing file operand'], 'error');
                    } else {
                        const fileName = args[1].trim();
                        if (!fileSystem.files[fileName]) {
                            fileSystem.files[fileName] = '';
                            updateFileTree();
                            saveFileSystem();
                            logToConsole([`Created empty file: ${fileName}`], 'output');
                        } else {
                            logToConsole([`touch: cannot touch '${fileName}': File exists`], 'error');
                        }
                    }
                    break;
                
                case 'rm':
                    if (args.includes('-rf') || args.includes('-r')) {
                        // Remove directory recursively
                        const itemIndex = args.indexOf('-rf') !== -1 ? args.indexOf('-rf') + 1 : args.indexOf('-r') + 1;
                        if (itemIndex < args.length) {
                            const itemName = args[itemIndex];
                            deleteItem(itemName);
                            logToConsole([`Removed '${itemName}' and its contents`], 'output');
                        } else {
                            logToConsole(['rm: missing operand'], 'error');
                        }
                    } else if (args.length > 1) {
                        // Remove file
                        const fileName = args[1];
                        if (fileSystem.files[fileName]) {
                            delete fileSystem.files[fileName];
                            updateFileTree();
                            saveFileSystem();
                            logToConsole([`Removed file: ${fileName}`], 'output');
                        } else {
                            logToConsole([`rm: cannot remove '${fileName}': No such file`], 'error');
                        }
                    } else {
                        logToConsole(['rm: missing operand'], 'error');
                    }
                    break;
                
                case 'cat':
                    if (args.length < 2) {
                        logToConsole(['cat: missing file operand'], 'error');
                    } else {
                        const fileName = args[1];
                        if (fileSystem.files[fileName]) {
                            logToConsole([fileSystem.files[fileName]], 'output');
                        } else {
                            logToConsole([`cat: ${fileName}: No such file`], 'error');
                        }
                    }
                    break;
                
                case 'echo':
                    const text = args.slice(1).join(' ');
                    // Check for output redirection
                    if (text.includes('>')) {
                        const parts = text.split('>');
                        const content = parts[0].trim();
                        const fileName = parts[1].trim();
                        
                        if (fileName) {
                            fileSystem.files[fileName] = content;
                            updateFileTree();
                            saveFileSystem();
                            logToConsole([`Wrote to file: ${fileName}`], 'output');
                        } else {
                            logToConsole(['echo: missing file name for redirection'], 'error');
                        }
                    } else {
                        logToConsole([text], 'output');
                    }
                    break;
                
                case 'pwd':
                    logToConsole(['/home/user/project'], 'output');
                    break;
                
                case 'clear':
                    consoleOutput.innerHTML = '';
                    break;
                
                case 'help':
                    logToConsole([`
Available commands:
  ls              List files and directories
  mkdir <dir>     Create a directory
  touch <file>    Create an empty file
  rm <file>       Remove a file
  rm -rf <dir>    Remove a directory and its contents
  cat <file>      Display file content
  echo <text>     Display text
  echo <text> > <file>  Write text to file
  pwd             Print working directory
  clear           Clear the terminal
  help            Display this help message
                    `], 'output');
                    break;
                
                case 'python':
                case 'npm':
                case 'node':
                    logToConsole([`Simulating ${cmd} command execution...`], 'output');
                    setTimeout(() => {
                        if (cmd === 'python') {
                            if (args[1] && args[1].endsWith('.py')) {
                                logToConsole([`Executed Python script: ${args[1]}`], 'output');
                            } else {
                                logToConsole([`Python ${args.slice(1).join(' ')}`], 'output');
                            }
                        } else if (cmd === 'npm') {
                            logToConsole([`NPM ${args.slice(1).join(' ')} completed`], 'output');
                        } else if (cmd === 'node') {
                            if (args[1] && args[1].endsWith('.js')) {
                                logToConsole([`Executed Node.js script: ${args[1]}`], 'output');
                            } else {
                                logToConsole([`Node.js ${args.slice(1).join(' ')}`], 'output');
                            }
                        }
                    }, 1000);
                    break;
                
                default:
                    logToConsole([`Command not found: ${cmd}. Type 'help' for available commands.`], 'error');
            }
        }
        
        bashPrompt.appendChild(prompt);
        bashPrompt.appendChild(bashInput);
        bashTerminal.appendChild(bashPrompt);
        document.getElementById('console').appendChild(bashTerminal);
        
        // Focus on input when terminal tab is clicked
        document.querySelector('.devtool-tab[data-tool="bash"]').addEventListener('click', () => {
            setTimeout(() => bashInput.focus(), 100);
        });
    }
    
    // Auto-save functionality
    let saveTimeout;
    
    function saveFileSystem() {
        localStorage.setItem('file-system', JSON.stringify(fileSystem.files));
    }
    
    function loadFileSystem() {
        const saved = localStorage.getItem('file-system');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Ensure we always have at least index.html
                if (!parsed['index.html']) {
                    parsed['index.html'] = '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n</body>\n</html>';
                }
                fileSystem.files = parsed;
            } catch (e) {
                console.error('Error loading saved files:', e);
            }
        }
    }
    
    // Initialize all components
    loadFileSystem();
    updateFileTree();
    updatePreview();
    setupEnhancedConsole();
    setupNetworkMonitoring();
    setupBashTerminal();
    setupDevToolsTabs();
    
    // Window resize handler for responsiveness
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            // Mobile layout adjustments
            document.querySelector('.sidebar').classList.remove('show');
        }
    });
    
    // Add mobile toggle for sidebar
    const mobileToggle = document.createElement('button');
    mobileToggle.className = 'mobile-toggle btn';
    mobileToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    mobileToggle.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('show');
    });
    
    document.querySelector('.editor-header').prepend(mobileToggle);
    
    // Settings Panel Implementation
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsModal = document.getElementById('close-settings-modal');
    const saveSettingsBtn = document.getElementById('save-settings');
    const resetSettingsBtn = document.getElementById('reset-settings');
    
    // Default settings
    const defaultSettings = {
        editorTheme: 'vs-dark',
        accentColor: '#0066cc',
        fontSize: 14,
        tabSize: 2,
        autoSave: true,
        wordWrap: false,
        minimap: false,
        linter: true,
        autocomplete: true,
        emmet: true
    };
    
    // Current settings
    let currentSettings = { ...defaultSettings };
    
    // Load settings from localStorage if available
    function loadSettings() {
        const savedSettings = localStorage.getItem('editor-settings');
        if (savedSettings) {
            try {
                currentSettings = { ...defaultSettings, ...JSON.parse(savedSettings) };
            } catch (e) {
                console.error('Error loading settings:', e);
                currentSettings = { ...defaultSettings };
            }
        }
        applySettings();
    }
    
    // Save settings to localStorage
    function saveSettings() {
        localStorage.setItem('editor-settings', JSON.stringify(currentSettings));
        applySettings();
        settingsModal.style.display = 'none';
    }
    
    // Apply settings to UI and editor
    function applySettings() {
        // Update UI elements to reflect current settings
        document.getElementById('editor-theme').value = currentSettings.editorTheme;
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.toggle('active', option.dataset.color === currentSettings.accentColor);
        });
        document.getElementById('font-size').value = currentSettings.fontSize;
        document.getElementById('tab-size').value = currentSettings.tabSize;
        document.getElementById('auto-save').checked = currentSettings.autoSave;
        document.getElementById('word-wrap').checked = currentSettings.wordWrap;
        document.getElementById('minimap').checked = currentSettings.minimap;
        document.getElementById('linter').checked = currentSettings.linter;
        document.getElementById('autocomplete').checked = currentSettings.autocomplete;
        document.getElementById('emmet').checked = currentSettings.emmet;
        
        // Apply theme to Monaco Editor
        if (currentEditor) {
            monaco.editor.setTheme(currentSettings.editorTheme);
            currentEditor.updateOptions({
                fontSize: currentSettings.fontSize,
                tabSize: currentSettings.tabSize,
                wordWrap: currentSettings.wordWrap ? 'on' : 'off',
                minimap: { enabled: currentSettings.minimap }
            });
        }
        
        // Apply accent color to buttons and selected elements
        document.documentElement.style.setProperty('--accent-color', currentSettings.accentColor);
        
        // Root CSS variables for theme customization
        const root = document.documentElement;
        root.style.setProperty('--accent-color', currentSettings.accentColor);
        
        // Update button colors
        document.querySelectorAll('.btn').forEach(btn => {
            if (!btn.classList.contains('btn-secondary')) {
                btn.style.backgroundColor = currentSettings.accentColor;
            }
        });
    }
    
    // Initialize settings panel event listeners
    function initSettingsPanel() {
        // Open settings modal
        settingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'block';
        });
        
        // Close settings modal
        closeSettingsModal.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
        
        // Save settings
        saveSettingsBtn.addEventListener('click', saveSettings);
        
        // Reset settings to default
        resetSettingsBtn.addEventListener('click', () => {
            currentSettings = { ...defaultSettings };
            applySettings();
        });
        
        // Editor theme change
        document.getElementById('editor-theme').addEventListener('change', (e) => {
            currentSettings.editorTheme = e.target.value;
        });
        
        // Accent color change
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                currentSettings.accentColor = option.dataset.color;
                document.querySelectorAll('.color-option').forEach(opt => {
                    opt.classList.toggle('active', opt === option);
                });
            });
        });
        
        // Font size change
        document.getElementById('font-size').addEventListener('change', (e) => {
            currentSettings.fontSize = parseInt(e.target.value);
        });
        
        // Tab size change
        document.getElementById('tab-size').addEventListener('change', (e) => {
            currentSettings.tabSize = parseInt(e.target.value);
        });
        
        // Toggle settings
        document.getElementById('auto-save').addEventListener('change', (e) => {
            currentSettings.autoSave = e.target.checked;
        });
        
        document.getElementById('word-wrap').addEventListener('change', (e) => {
            currentSettings.wordWrap = e.target.checked;
        });
        
        document.getElementById('minimap').addEventListener('change', (e) => {
            currentSettings.minimap = e.target.checked;
        });
        
        document.getElementById('linter').addEventListener('change', (e) => {
            currentSettings.linter = e.target.checked;
        });
        
        document.getElementById('autocomplete').addEventListener('change', (e) => {
            currentSettings.autocomplete = e.target.checked;
        });
        
        document.getElementById('emmet').addEventListener('change', (e) => {
            currentSettings.emmet = e.target.checked;
        });
    }
    
    // Initialize settings
    loadSettings();
    initSettingsPanel();
}

// Add CSS variables to root for theming
document.documentElement.style.setProperty('--accent-color', '#0066cc');
