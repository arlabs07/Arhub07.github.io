
      document.addEventListener('DOMContentLoaded', () => {
  // Initialize the slider
  initializeSlider();
  
  // Create navigation dots
  createDots();
  
  // Set first project as active by default
  const firstProject = document.querySelector('.project-card');
  if (firstProject) {
    firstProject.classList.add('active');
  }
});

// Initialize the slider functionality
function initializeSlider() {
  const projectsWrapper = document.querySelector('.projects-wrapper');
  const projectCards = document.querySelectorAll('.project-card');
  
  // Set initial position
  let currentPosition = 0;
  
  // Set up touch events for mobile
  let touchStartX = 0;
  let touchEndX = 0;
  
  projectsWrapper.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });
  
  projectsWrapper.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });
  
  // Handle swipe gestures
  function handleSwipe() {
    if (touchStartX - touchEndX > 50) {
      // Swipe left
      scrollProjects(1);
    } else if (touchEndX - touchStartX > 50) {
      // Swipe right
      scrollProjects(-1);
    }
  }
  
  // Auto-scroll functionality
  let autoScrollInterval;
  
  function startAutoScroll() {
    autoScrollInterval = setInterval(() => {
      scrollProjects(1);
    }, 5000);
  }
  
  function stopAutoScroll() {
    clearInterval(autoScrollInterval);
  }
  
  // Start auto-scroll on page load
  startAutoScroll();
  
  // Stop auto-scroll when user interacts with the slider
  projectsWrapper.addEventListener('mouseenter', stopAutoScroll);
  projectsWrapper.addEventListener('touchstart', stopAutoScroll);
  
  // Resume auto-scroll when user stops interacting
  projectsWrapper.addEventListener('mouseleave', startAutoScroll);
}

// Create navigation dots
function createDots() {
  const projectCards = document.querySelectorAll('.project-card');
  const dotsContainer = document.querySelector('.dots');
  
  // Calculate number of dots needed
  const totalProjects = projectCards.length;
  const visibleProjects = getVisibleProjects();
  const totalDots = Math.ceil(totalProjects / visibleProjects);
  
  // Create dots
  for (let i = 0; i < totalDots; i++) {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    if (i === 0) dot.classList.add('active');
    
    dot.addEventListener('click', () => {
      scrollToPage(i);
      updateActiveDot(i);
    });
    
    dotsContainer.appendChild(dot);
  }
}

// Get number of visible projects based on viewport width
function getVisibleProjects() {
  const width = window.innerWidth;
  if (width < 480) return 2;
  if (width < 768) return 3;
  if (width < 1200) return 4;
  return 5;
}

// Scroll to specific page of projects
function scrollToPage(pageIndex) {
  const projectsWrapper = document.querySelector('.projects-wrapper');
  const projectCards = document.querySelectorAll('.project-card');
  const visibleProjects = getVisibleProjects();
  
  // Calculate scroll position
  const cardWidth = projectCards[0].offsetWidth;
  const gap = parseInt(getComputedStyle(projectsWrapper).gap);
  const scrollAmount = pageIndex * (visibleProjects * (cardWidth + gap));
  
  projectsWrapper.scrollTo({
    left: scrollAmount,
    behavior: 'smooth'
  });
  
  // Update the active project
  updateActiveProject();
}

// Scroll projects left or right
function scrollProjects(direction) {
  const projectsWrapper = document.querySelector('.projects-wrapper');
  const projectCards = document.querySelectorAll('.project-card');
  const visibleProjects = getVisibleProjects();
  
  // Calculate current page
  const scrollPosition = projectsWrapper.scrollLeft;
  const cardWidth = projectCards[0].offsetWidth;
  const gap = parseInt(getComputedStyle(projectsWrapper).gap);
  const currentPage = Math.round(scrollPosition / ((cardWidth + gap) * visibleProjects));
  
  // Calculate new page
  const newPage = currentPage + direction;
  const totalPages = Math.ceil(projectCards.length / visibleProjects);
  
  // Ensure we don't scroll past the boundaries
  if (newPage >= 0 && newPage < totalPages) {
    scrollToPage(newPage);
    updateActiveDot(newPage);
  } else if (newPage < 0) {
    // Scroll to the last page if we're at the beginning and going backwards
    scrollToPage(totalPages - 1);
    updateActiveDot(totalPages - 1);
  } else {
    // Scroll to the first page if we're at the end and going forwards
    scrollToPage(0);
    updateActiveDot(0);
  }
}

// Update active navigation dot
function updateActiveDot(index) {
  const dots = document.querySelectorAll('.dot');
  
  dots.forEach((dot, i) => {
    if (i === index) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

// Update active project based on scroll position
function updateActiveProject() {
  const projectsWrapper = document.querySelector('.projects-wrapper');
  const projectCards = document.querySelectorAll('.project-card');
  
  // Reset all active states
  projectCards.forEach(card => {
    card.classList.remove('active');
  });
  
  // Calculate which project is in the center of the viewport
  const scrollPosition = projectsWrapper.scrollLeft;
  const wrapperWidth = projectsWrapper.offsetWidth;
  const centerPosition = scrollPosition + (wrapperWidth / 2);
  
  let closestCard = null;
  let closestDistance = Infinity;
  
  projectCards.forEach(card => {
    const cardLeft = card.offsetLeft;
    const cardWidth = card.offsetWidth;
    const cardCenter = cardLeft + (cardWidth / 2);
    const distance = Math.abs(centerPosition - cardCenter);
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestCard = card;
    }
  });
  
  // Set the closest card as active
  if (closestCard) {
    closestCard.classList.add('active');
  }
}

// Show "View Project" button
function showButton(card) {
  // Remove active class from all cards
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach(p => p.classList.remove('active'));
  
  // Add active class to the clicked card
  card.classList.add('active');
}

// Open project URL
function openProject(event, button) {
  // Prevent the click from bubbling up to the card
  event.stopPropagation();
  
  // Get the URL from the parent card's data attribute
  const card = button.closest('.project-card');
  const url = card.dataset.url;
  
  // Open the URL in a new tab
  if (url) {
    window.open(url, '_blank');
  }
}

// Update on window resize
window.addEventListener('resize', () => {
  // Recreate dots based on new viewport size
  const dotsContainer = document.querySelector('.dots');
  dotsContainer.innerHTML = '';
  createDots();
  
  // Update active project
  updateActiveProject();
});

// Listen for scroll events to update active project and dots
document.querySelector('.projects-wrapper').addEventListener('scroll', () => {
  // Debounce the scroll event to improve performance
  clearTimeout(window.scrollTimeout);
  window.scrollTimeout = setTimeout(() => {
    updateActiveProject();
    
    // Update active dot
    const projectsWrapper = document.querySelector('.projects-wrapper');
    const projectCards = document.querySelectorAll('.project-card');
    const visibleProjects = getVisibleProjects();
    
    const scrollPosition = projectsWrapper.scrollLeft;
    const cardWidth = projectCards[0].offsetWidth;
    const gap = parseInt(getComputedStyle(projectsWrapper).gap);
    const currentPage = Math.round(scrollPosition / ((cardWidth + gap) * visibleProjects));
    
    updateActiveDot(currentPage);
  }, 100);
});
    