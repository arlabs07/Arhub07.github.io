
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Parallax Background Effect
    const stars = document.querySelector('.stars');
    const grid = document.querySelector('.grid-overlay');

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        
        // Request animation frame is implicit in modern browsers for scroll, 
        // but simple transform is performant enough here.
        
        // Stars move at half speed (depth effect: further away)
        if (stars) {
            stars.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
        
        // Grid moves slightly faster than stars, but slower than foreground content
        // This creates a layered 3D space effect
        if (grid) {
            grid.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    }, { passive: true });

    // 2. 3D Tilt Effect for Code Card
    // Only enabled on desktop to save battery/performance on mobile
    const card = document.querySelector('.glass-code-card');
    const container = document.querySelector('.hero-section');

    if (window.matchMedia("(min-width: 900px)").matches && card && container) {
        container.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                const xAxis = (window.innerWidth / 2 - e.pageX) / 30;
                const yAxis = (window.innerHeight / 2 - e.pageY) / 30;
                // Limit rotation to be subtle
                card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
            });
        }, { passive: true });

        // Reset when mouse leaves
        container.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateY(0deg) rotateX(10deg)'; // Return to default
        });
    }

});
