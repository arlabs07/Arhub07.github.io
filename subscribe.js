document.addEventListener('DOMContentLoaded', () => {
    const subscribeBtn = document.getElementById('subscribeBtn');
    const bellOptions = document.getElementById('bellOptions');
    const particles = document.querySelector('.particles');
    const tooltip = document.querySelector('.tooltip');
    const bellOptionElements = document.querySelectorAll('.bell-option');
    const youtubeChannelURL = 'https://www.youtube.com/@arhub07';
    
    // Create particle elements
    function createParticles(x, y, color = '#ff0000', count = 20) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.background = color;
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.width = `${Math.random() * 10 + 5}px`;
            particle.style.height = particle.style.width;
            
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 100 + 50;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            particles.appendChild(particle);
            
            gsap.to(particle, {
                x: vx,
                y: vy,
                opacity: 0,
                scale: 0,
                duration: Math.random() * 1 + 0.5,
                ease: 'power2.out',
                onComplete: () => {
                    particle.remove();
                }
            });
        }
    }
    
    // Show tooltip on hover
    function showTooltip(element, text) {
        element.addEventListener('mouseenter', (e) => {
            tooltip.textContent = text;
            tooltip.style.opacity = 1;
            
            const rect = element.getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width/2 - tooltip.offsetWidth/2}px`;
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
        });
        
        element.addEventListener('mouseleave', () => {
            tooltip.style.opacity = 0;
        });
    }
    
    // Add tooltip to bell options
    showTooltip(document.querySelector('.bell-option[data-option="none"]'), "Don't notify me");
    showTooltip(document.querySelector('.bell-option[data-option="personalized"]'), "Personalized");
    showTooltip(document.querySelector('.bell-option[data-option="all"]'), "All notifications");
    
    // Subscribe button click event
    subscribeBtn.addEventListener('click', () => {
        // Create click effect
        subscribeBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            subscribeBtn.style.transform = '';
        }, 200);
        
        // Add animated gradient
        subscribeBtn.classList.add('animate');
        
        // Create particles
        const rect = subscribeBtn.getBoundingClientRect();
        createParticles(rect.left + rect.width/2, rect.top + rect.height/2);
        
        // Show bell options
        gsap.to(bellOptions, {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: "back.out(1.7)"
        });
        
        // Redirect to YouTube after 6 seconds
        setTimeout(() => {
            window.location.href = youtubeChannelURL;
        }, 6000);
    });
    
    // Bell option click events
    bellOptionElements.forEach(option => {
        option.addEventListener('click', (e) => {
            const optionType = e.currentTarget.getAttribute('data-option');
            
            // Highlight selected option
            bellOptionElements.forEach(opt => {
                opt.style.transform = '';
                opt.style.backgroundColor = opt.classList.contains('all') ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.15)';
                opt.style.borderColor = opt.classList.contains('all') ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)';
            });
            
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.backgroundColor = e.currentTarget.classList.contains('all') ? 'rgba(255, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.35)';
            e.currentTarget.style.borderColor = e.currentTarget.classList.contains('all') ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.6)';
            
            // Create particles
            const rect = e.currentTarget.getBoundingClientRect();
            createParticles(rect.left + rect.width/2, rect.top + rect.height/2, e.currentTarget.classList.contains('all') ? '#ffcc00' : '#ffffff', 15);
        });
    });
});
