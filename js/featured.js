
document.addEventListener('DOMContentLoaded', () => {
    
    // --- FEATURED PROJECTS CONFIGURATION ---
    // Using SVG paths for sharper, scalable graphics instead of fonts
    const featuredProjects = [
        {
            name: "PurplePDF",
            description: "A comprehensive PDF manipulation suite. Merge, split, compress, and edit PDF documents with ease. Built for privacy and performance, processing files entirely in the browser.",
            link: "https://purplepdf.arhub.app", 
            color: "#9d00ff", // Purple
            svgPath: `<path fill="currentColor" d="M128 0C92.7 0 64 28.7 64 64v96h64V64H226.7L384 221.3V448H64V304H0V448c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V192L314.7 66.7C308.5 60.5 300.2 57 291.3 57H128zM448 80h32c17.7 0 32 14.3 32 32v32c0 17.7-14.3 32-32 32H448v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V80zM32 256c-17.7 0-32 14.3-32 32s14.3 32 32 32h32c17.7 0 32-14.3 32-32s-14.3-32-32-32H32z"/>`,
            tags: ["Productivity", "Utility", "Web Assembly"]
        },
        {
            name: "ardev",
            description: "The developer's companion. A collection of snippets, challenges, and roadmaps designed to accelerate your coding journey. Includes a built-in code formatter and linter.",
            link: "https://ardev.arhub.app", 
            color: "#00ff88", // Green
            svgPath: `<path fill="currentColor" d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z"/>`,
            tags: ["DevTool", "Education", "IDE"]
        },
        {
            name: "AR-UI Kit",
            description: "A modular, accessible, and dark-mode-first CSS framework. Build stunning interfaces like this one with pre-built components and utility classes.",
            link: "#",
            color: "#00c8ff", // Blue
            svgPath: `<path fill="currentColor" d="M224 0c-17.7 0-32 14.3-32 32V48H128c-35.3 0-64 28.7-64 64v48H32c-17.7 0-32 14.3-32 32s14.3 32 32 32h32v64H32c-17.7 0-32 14.3-32 32s14.3 32 32 32h32v48c0 35.3 28.7 64 64 64h64v16c0 17.7 14.3 32 32 32s32-14.3 32-32v-16h64c35.3 0 64-28.7 64-64v-48h32c17.7 0 32-14.3 32-32s-14.3-32-32-32h-32v-64h32c17.7 0 32-14.3 32-32s-14.3-32-32-32h-32V112c0-35.3-28.7-64-64-64h-64V32c0-17.7-14.3-32-32-32zM128 112h256v288H128V112z"/>`,
            tags: ["Library", "CSS", "Design System"]
        }
    ];

    const container = document.getElementById('featured-container');

    function renderFeatured() {
        if (!container) return;
        container.innerHTML = '';

        featuredProjects.forEach((proj, index) => {
            const card = document.createElement('div');
            card.className = 'f-project-card';
            // Add entry animation delay staggered
            card.style.animationDelay = `${index * 0.15}s`;
            
            // Set CSS variables dynamically
            card.style.setProperty('--glow-color', proj.color);
            card.style.setProperty('--accent-color', proj.color);
            card.style.setProperty('--btn-bg', `linear-gradient(135deg, ${proj.color}20, ${proj.color}05)`); 

            const tagsHtml = proj.tags.map(tag => `<span class="f-tag">${tag}</span>`).join('');

            card.innerHTML = `
                <div class="f-bg-glow"></div>
                <div class="f-content">
                    <div class="f-head">
                        <div class="f-icon-box">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="24" height="24">
                                ${proj.svgPath}
                            </svg>
                        </div>
                        <h3 class="f-title">${proj.name}</h3>
                    </div>
                    
                    <p class="f-desc">${proj.description}</p>
                    
                    <div class="f-meta">
                        ${tagsHtml}
                    </div>

                    <a href="${proj.link}" class="f-link" aria-label="View ${proj.name}">
                        View Project 
                        <svg class="arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="14" height="14"><path fill="currentColor" d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"/></svg>
                    </a>
                </div>
            `;

            container.appendChild(card);
        });
    }

    renderFeatured();
});
