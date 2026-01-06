
document.addEventListener('DOMContentLoaded', () => {
    
    // --- MANUAL CONFIGURATION FOR SYSTEMS ---
    const systems = [
        {
            title: "CSS Glassmorphism",
            description: "A lightweight CSS library for creating glass effects instantly.",
            link: "https://codepen.io/Abhinav-Rawat",
            image: "" 
        },
        {
            title: "JS Animator",
            description: "Simple JavaScript animation utility for scroll-based reveals.",
            link: "https://github.com/arlabs07",
            image: ""
        },
        {
            title: "Grid Layout Generator",
            description: "A visual tool to generate CSS Grid layouts and export code.",
            link: "#", 
            image: ""
        },
        {
            title: "Flexbox Cheatsheet",
            description: "Interactive guide to mastering Flexbox alignment and spacing.",
            link: "#",
            image: ""
        },
        {
            title: "Color Palette AI",
            description: "Generate accessible color schemes for your next web project.",
            link: "#",
            image: ""
        },
        {
            title: "Responsive Tester",
            description: "Quickly view your site on multiple device breakpoints.",
            link: "#",
            image: ""
        },
        // Adding more dummy items to demonstrate Load More functionality
        {
            title: "Font Pairer",
            description: "Find the perfect Google Font combinations for your headings and body text.",
            link: "#",
            image: ""
        },
        {
            title: "Meta Tag Builder",
            description: "Easily generate perfect SEO and Social Media meta tags.",
            link: "#",
            image: ""
        },
        {
            title: "Gradient Maker",
            description: "Create beautiful CSS gradients with a visual editor.",
            link: "#",
            image: ""
        },
         {
            title: "SVG Optimizer",
            description: "Minify your SVG files for better web performance.",
            link: "#",
            image: ""
        }
    ];

    const grid = document.getElementById('projects-grid');
    const searchInput = document.getElementById('project-search');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    // --- LOAD MORE LOGIC ---
    // 3 for Mobile, 6 for Desktop (>= 1024px)
    let itemsToShow = window.innerWidth >= 1024 ? 6 : 3;
    let currentFilteredList = [...systems]; // Start with full list

    function renderProjects(list, limit) {
        grid.innerHTML = '';
        
        if(list.length === 0) {
            grid.innerHTML = '<div class="status-msg">No tools found matching your search.</div>';
            loadMoreBtn.style.display = 'none';
            return;
        }

        // Slice the list based on limit
        const visibleItems = list.slice(0, limit);

        visibleItems.forEach((project, index) => {
            const div = document.createElement('div');
            div.className = 'project-card';
            
            let imageHtml = '';
            if (project.image) {
                imageHtml = `<img src="${project.image}" alt="${project.title}" loading="lazy">`;
            } else {
                imageHtml = `<div class="no-image-placeholder"><i class="fas fa-cube"></i></div>`;
            }

            div.innerHTML = `
                <div class="card-image">
                    ${imageHtml}
                </div>
                <div class="card-content">
                    <span class="project-number">SYS.${(index + 1).toString().padStart(3, '0')}</span>
                    <h3 class="card-title">${project.title}</h3>
                    <p class="card-desc">${project.description}</p>
                    <a href="${project.link}" target="_blank" class="card-link">
                        Open Tool <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            `;
            grid.appendChild(div);
        });

        // Hide button if showing all items
        if (visibleItems.length >= list.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }

    // Initial Render
    renderProjects(currentFilteredList, itemsToShow);

    // Resize Handler to reset default view count based on screen size
    // Note: To avoid jarring UX, we only update the increment base, 
    // but usually user expects reload on resize for layout changes. 
    // Here we will just ensure logic holds for next interaction.
    window.addEventListener('resize', () => {
       // Optional: adjust itemsToShow dynamically if needed, 
       // but typically "load more" state should persist or reset carefully.
       // We'll keep the current state unless reload.
    });

    // Load More Click Handler
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            itemsToShow += 3; // Load 3 more every time
            renderProjects(currentFilteredList, itemsToShow);
        });
    }

    // Search Functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            // Filter source list
            currentFilteredList = systems.filter(p => 
                p.title.toLowerCase().includes(term) || 
                p.description.toLowerCase().includes(term)
            );
            
            // Reset count for search results (show first batch)
            // Or show all if you prefer. Usually search results show limited too.
            // Let's reset to initial based on screen size for consistency.
            itemsToShow = window.innerWidth >= 1024 ? 6 : 3;
            
            renderProjects(currentFilteredList, itemsToShow);
        });
    }
});
