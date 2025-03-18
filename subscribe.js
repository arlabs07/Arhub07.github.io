
  document.addEventListener('DOMContentLoaded', () => {
    const subscribeBtn = document.getElementById('subscribeBtn');
    const handPointer = document.getElementById('handPointer');
    const bellIcon = document.getElementById('bellIcon');
    const bellOptions = document.getElementById('bellOptions');
    const successMessage = document.getElementById('successMessage');
    const particles = document.getElementById('particles');
    const tooltip = document.getElementById('tooltip');
    const bellOptionElements = document.querySelectorAll('.bell-option');
    const wrapper = document.querySelector('.subscribe-wrapper');
    const channelURL = 'https://www.youtube.com/@arhub07';
    let redirectTimeout;
    
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
    
    // Start the animation sequence
    function startAnimation() {
        // Reset state
        gsap.set(handPointer, { opacity: 0, x: 0, y: 0, scale: 1 });
        gsap.set(bellIcon, { opacity: 0, x: 0, y: 0, scale: 1, rotation: 0 });
        gsap.set(bellOptions, { opacity: 0, scale: 0 });
        gsap.set(successMessage, { opacity: 0, y: -20 });
        
        // Timeline for animation sequence
        const tl = gsap.timeline({ delay: 0.5 });
        
        // Hand appears and moves to subscribe button
        tl.to(handPointer, {
            opacity: 1,
            duration: 0.5
        })
        .to(handPointer, {
            x: subscribeBtn.offsetLeft + subscribeBtn.offsetWidth/2 - handPointer.offsetWidth/2 - 30,
            y: subscribeBtn.offsetTop + subscribeBtn.offsetHeight/2 - handPointer.offsetHeight/2 - 10,
            duration: 1,
            ease: "power2.inOut"
        })
        
        // Click effect on subscribe button
        .to(handPointer, {
            scale: 0.8,
            duration: 0.2
        })
        .to(subscribeBtn, {
            scale: 0.95,
            duration: 0.2
        }, "<")
        .to(handPointer, {
            scale: 1,
            duration: 0.2
        })
        .to(subscribeBtn, {
            scale: 1,
            duration: 0.2,
            onComplete: () => {
                // Create particle effect at button position
                const rect = subscribeBtn.getBoundingClientRect();
                createParticles(rect.left + rect.width/2, rect.top + rect.height/2);
                
                // Add gradient animation to button
                subscribeBtn.classList.add('gradient-animation');
                setTimeout(() => {
                    subscribeBtn.classList.remove('gradient-animation');
                }, 2000);
            }
        }, "<")
        
        // Bell icon appears
        .to(bellIcon, {
            opacity: 1,
            duration: 0.5,
            delay: 0.3
        })
        
        // Hand moves to bell icon
        .to(handPointer, {
            x: bellIcon.offsetLeft + bellIcon.offsetWidth/2 - 20,
            y: bellIcon.offsetTop + bellIcon.offsetHeight/2,
            duration: 1,
            ease: "power2.inOut"
        })
        
        // Click effect on bell
        .to(handPointer, {
            scale: 0.8,
            duration: 0.2 
        })
        .to(bellIcon, {
            scale: 1.1,
            rotation: 20,
            duration: 0.1
        }, "<")
        .to(bellIcon, {
            rotation: -15,
            duration: 0.1
        })
        .to(bellIcon, {
            rotation: 10,
            duration: 0.1
        })
        .to(bellIcon, {
            rotation: -5,
            duration: 0.1
        })
        .to(bellIcon, {
            rotation: 0,
            duration: 0.1
        })
        
        // Show bell options
        .to(bellOptions, {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: "back.out(1.7)"
        })
        
        // Hand moves to "All" bell option
        .to(handPointer, {
            x: document.querySelector('.bell-option.all').offsetLeft + document.querySelector('.bell-option.all').offsetWidth/2 - 10,
            y: document.querySelector('.bell-option.all').offsetTop + document.querySelector('.bell-option.all').offsetHeight/2 + 10,
            duration: 1,
            ease: "power2.inOut"
        })
        
        // Click effect on "All" option
        .to(handPointer, {
            scale: 0.8,
            duration: 0.2
        })
        .to('.bell-option.all', {
            scale: 0.9,
            duration: 0.1
        }, "<")
        .to(handPointer, {
            scale: 1,
            duration: 0.2
        })
        .to('.bell-option.all', {
            scale: 1.1,
            duration: 0.2,
            backgroundColor: "rgba(255, 0, 0, 0.6)",
            onComplete: () => {
                // Create particle effect
                const rect = document.querySelector('.bell-option.all').getBoundingClientRect();
                createParticles(rect.left + rect.width/2, rect.top + rect.height/2, '#ffcc00', 15);
            }
        }, "<")
        .to('.bell-option.all', {
            scale: 1,
            duration: 0.2
        })
        
        // Success message appears
        .to(successMessage, {
            opacity: 1,
            y: 0,
            duration: 0.5
        })
        
        // Hand fades out
        .to(handPointer, {
            opacity: 0,
            duration: 0.5,
            delay: 0.5
        });
        
        return tl;
    }
    
    // Function to redirect to YouTube channel
    function redirectToChannel() {
        window.location.href = channelURL;
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
        // Clear any existing timeouts
        if (redirectTimeout) {
            clearTimeout(redirectTimeout);
        }
        
        // Create click effect
        subscribeBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            subscribeBtn.style.transform = '';
        }, 200);
        
        // Add gradient animation to button
        subscribeBtn.classList.add('gradient-animation');
        setTimeout(() => {
            subscribeBtn.classList.remove('gradient-animation');
        }, 2000);
        
        // Change container style
        wrapper.classList.add('subscribed');
        
        // Create particles
        const rect = subscribeBtn.getBoundingClientRect();
        createParticles(rect.left + rect.width/2, rect.top + rect.height/2);
        
        // Switch to bell animation
        gsap.to(bellIcon, {
            opacity: 1,
            scale: 1.1,
            duration: 0.3,
            onComplete: () => {
                gsap.to(bellIcon, {
                    scale: 1,
                    duration: 0.2
                });
                
                // Show bell options
                gsap.to(bellOptions, {
                    opacity: 1,
                    scale: 1,
                    duration: 0.5,
                    ease: "back.out(1.7)"
                });
            }
        });
        
        // Set redirect timeout (6 seconds as requested)
        redirectTimeout = setTimeout(redirectToChannel, 6000);
    });
    
    // Bell icon click event
    bellIcon.addEventListener('click', () => {
        // Bell ringing animation
        gsap.to(bellIcon, {
            rotation: 15,
            duration: 0.1,
            onComplete: () => {
                gsap.to(bellIcon, {
                    rotation: -10,
                    duration: 0.1,
                    onComplete: () => {
                        gsap.to(bellIcon, {
                            rotation: 5,
                            duration: 0.1,
                            onComplete: () => {
                                gsap.to(bellIcon, {
                                    rotation: 0,
                                    duration: 0.1
                                });
                            }
                        });
                    }
                });
            }
        });
        
        // Show bell options
        gsap.to(bellOptions, {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: "back.out(1.7)"
        });
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
            
            // Show success message if "all" option is selected
            if (optionType === 'all') {
                gsap.to(successMessage, {
                    opacity: 1,
                    y: 0,
                    duration: 0.5
                });
                
                setTimeout(() => {
                    gsap.to(successMessage, {
                        opacity: 0,
                        y: -20,
                        duration: 0.5,
                        delay: 2
                    });
                }, 2000);
            } else {
                gsap.to(successMessage, {
                    opacity: 0,
                    y: -20,
                    duration: 0.5
                });
            }
        });
    });
    
    // Start the animation after a short delay
    setTimeout(() => {
        startAnimation();
    }, 1500);
    
    // Allow restarting animation by clicking container
    document.querySelector('.subscribe-wrapper').addEventListener('dblclick', (e) => {
        if (e.target === document.querySelector('.subscribe-wrapper') || e.target === document.querySelector('.subscribe-area')) {
            // Clear any existing timeouts
            if (redirectTimeout) {
                clearTimeout(redirectTimeout);
            }
            startAnimation();
        }
    });
});
