
    // Add subtle hover effect movement
    document.addEventListener('mousemove', function(e) {
      const cards = document.querySelectorAll('.message-box');
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        
        const angleX = (mouseY - cardCenterY) / 30;
        const angleY = (cardCenterX - mouseX) / 30;
        
        // Only apply to cards that are being hovered or nearby
        const distance = Math.sqrt(Math.pow(mouseX - cardCenterX, 2) + Math.pow(mouseY - cardCenterY, 2));
        if (distance < 300) {
          card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.02, 1.02, 1.02)`;
        } else {
          card.style.transform = '';
        }
      });
    });
  