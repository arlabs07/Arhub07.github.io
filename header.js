
        let lastScroll = 0;
        const header = document.querySelector(".header");
        const menu = document.getElementById("menu");
        const menuBtn = document.querySelector(".menu-btn");
        const backBtn = document.getElementById("backBtn");

        // Hide/Show Header on Scroll
        window.addEventListener("scroll", () => {
            let currentScroll = window.pageYOffset;
            if (currentScroll > window.innerHeight / 2) {
                header.classList.add("hide-header");
            } else {
                header.classList.remove("hide-header");
            }
            if (currentScroll < lastScroll) {
                header.classList.remove("hide-header");
            }
            lastScroll = currentScroll;
        });

        // Toggle Mobile Menu
        function toggleMenu() {
            menu.classList.toggle("show");
            menuBtn.classList.toggle("rotate");
            menuBtn.textContent = menu.classList.contains("show") ? "✖" : "☰";
        }

        // Back Button Functionality
        backBtn.addEventListener("click", function() {
            if (document.referrer) {
                window.location.href = document.referrer;
            } else {
                window.location.href = "index.html"; // Change this to your default page
            }
        });
