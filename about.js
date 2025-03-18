let skillAnimationCount = 0;
let maxSkillAnimation = 5;

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom >= 0;
}

function animateSkills() {
  if (skillAnimationCount < maxSkillAnimation) {
    document.querySelectorAll(".skill-fill").forEach((bar, index) => {
      let width = bar.getAttribute("data-width");
      bar.style.width = "0%";
      setTimeout(() => { bar.style.width = width; }, 500 + index * 200);
    });
    skillAnimationCount++;
  }
}

function checkScroll() {
  const aboutSection = document.getElementById("about-section");
  if (isElementInViewport(aboutSection)) {
    animateSkills();
  }
}

window.addEventListener("scroll", checkScroll); 
