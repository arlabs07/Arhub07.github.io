class AuthSystem {
    constructor() {
        this.currentUser = this.getCurrentUser();
        this.init();
    }

    init() {
        this.addCustomStyles(); // Add custom styles first
        this.createHeader();
        this.createSidebar();
        this.initAuth();
        this.checkAuthRedirect();
        this.recordPageVisit();
        this.adjustMainContentPadding(); // Ensure main content is below header
    }

    recordPageVisit() {
        const currentPage = window.location.pathname;
        const pageName = this.getPageTitle();
        const timestamp = new Date().toISOString();

        // Update page history
        let history = JSON.parse(localStorage.getItem('page_history') || '[]');
        const existingIndex = history.findIndex(item => item.path === currentPage);
        if (existingIndex !== -1) {
            history.splice(existingIndex, 1);
        }
        history.unshift({ path: currentPage, name: pageName, timestamp });
        history = history.slice(0, 10); // Keep only the last 10 visits
        localStorage.setItem('page_history', JSON.stringify(history));

        // Update visit counter
        let visitCount = parseInt(localStorage.getItem('total_visits') || '0');
        visitCount++;
        localStorage.setItem('total_visits', visitCount.toString());
    }

    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) return 'now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        return `${Math.floor(diffInSeconds / 86400)}d`;
    }

    addCustomStyles() {
        const style = document.createElement('style');
        style.textContent = `
            :root {
                --header-height: 60px; /* Default for initial render, updated by JS */
            }
            .huly-btn-enhanced {
                position: relative;
                overflow: hidden;
                background: linear-gradient(135deg, #ffffff 0%, #fefefe 30%, #fff9e6 70%, #fef3c7 100%);
                color: #1f2937;
                border: 1px solid rgba(251, 191, 36, 0.2);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                transform-style: preserve-3d;
                border-radius: 9999px; /* More rounded */
            }
            .huly-btn-enhanced::before {
                content: '';
                position: absolute;
                top: 0;
                right: 0; /* Position to the right */
                width: 20%; /* Approximately 1/5th */
                height: 100%;
                /* White to yellow gradient, blending with transparency */
                background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.5) 20%, rgba(255, 255, 0, 0.7) 100%);
                opacity: 0; /* Hidden by default */
                transition: opacity 0.3s ease;
                border-radius: 0 9999px 9999px 0; /* Rounded only on the right side */
            }
            .huly-btn-enhanced:hover::before {
                opacity: 1; /* Visible on hover */
            }
            .huly-btn-enhanced::after {
                content: '';
                position: absolute;
                top:-50%;
                left:-50%;
                width:200%;
                height:200%;
                background:linear-gradient(45deg,transparent,rgba(255,255,255,0.8),transparent);
                transform:rotate(45deg);
                transition:transform 0.6s ease;
                opacity:0;
            }
            .huly-btn-enhanced:hover::after {
                opacity:1;
                transform:rotate(45deg) translate(100px,-100px);
            }
            .huly-btn-enhanced:hover {
                transform:translateY(-2px) scale(1.02);
                box-shadow:0 12px 40px rgba(0,0,0,0.15),0 4px 12px rgba(251,191,36,0.2);
                border-color:rgba(251,191,36,0.3);
            }
            .huly-btn-enhanced:active {
                transform:translateY(0) scale(0.98);
            }

            /* Danger Button - adapted to huly-btn-enhanced style */
            .danger-huly-btn-enhanced {
                position: relative;
                overflow: hidden;
                background: linear-gradient(135deg, #fef2f2 0%, #fefefe 30%, #fef3c7 100%); /* Lighter background for red text */
                color: #dc2626; /* Red text */
                border: 1px solid rgba(220, 38, 38, 0.2); /* Red border */
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                transform-style: preserve-3d;
                border-radius: 9999px; /* More rounded */
            }
            .danger-huly-btn-enhanced::before {
                content: '';
                position: absolute;
                top: 0;
                right: 0;
                width: 20%;
                height: 100%;
                background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.5) 20%, rgba(255, 255, 0, 0.7) 100%);
                opacity: 0;
                transition: opacity 0.3s ease;
                border-radius: 0 9999px 9999px 0;
            }
            .danger-huly-btn-enhanced:hover::before {
                opacity: 1;
            }
            .danger-huly-btn-enhanced::after {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.6), transparent);
                transform: rotate(45deg);
                transition: transform 0.6s ease;
                opacity: 0;
            }
            .danger-huly-btn-enhanced:hover::after {
                opacity: 1;
                transform: rotate(45deg) translate(100px, -100px);
            }
            .danger-huly-btn-enhanced:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 12px 40px rgba(220, 38, 38, 0.15), 0 4px 12px rgba(251, 191, 36, 0.2); /* Use red for shadow, but amber for glow */
                border-color: rgba(251, 191, 36, 0.3);
            }
            .danger-huly-btn-enhanced:active {
                transform: translateY(0) scale(0.98);
            }

            .glass-effect {
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .scrollbar-thin{scrollbar-width:thin}.scrollbar-thin::-webkit-scrollbar{width:3px}.scrollbar-thin::-webkit-scrollbar-track{background:transparent}.scrollbar-thin::-webkit-scrollbar-thumb{background-color:rgba(148,163,184,0.3);border-radius:2px}.scrollbar-thin::-webkit-scrollbar-thumb:hover{background-color:rgba(148,163,184,0.5)}@media (max-width: 768px){.mobile-icon-only .btn-text{display:none}}
        `;
        document.head.appendChild(style);
    }

    getPageTitle() {
        const titleElement = document.querySelector('title');
        if (titleElement) {
            return titleElement.textContent.split(' - ')[0];
        }
        const path = window.location.pathname;
        if (path.includes('login.html')) return 'Login';
        if (path.includes('profile.html')) return 'Profile';
        if (path.includes('dashboard.html')) return 'Dashboard';
        return 'Auth System';
    }

    createHeader() {
        if (document.getElementById('auth-header')) return;

        const header = document.createElement('div');
        header.id = 'auth-header';
        header.className = 'fixed top-0 left-0 right-0 glass-effect border-b border-white border-opacity-10 z-40 px-4 py-3';
        header.innerHTML = `
            <div class="flex items-center justify-between max-w-7xl mx-auto">
                <div class="flex items-center space-x-3">
                    <h1 class="text-xl font-bold text-white">${this.getPageTitle()}</h1>
                </div>
                <div class="flex items-center space-x-3">
                    ${this.currentUser ?
                        `<button id="profile-toggle" class="w-8 h-8 rounded-full overflow-hidden border border-white border-opacity-20 hover:border-amber-400 transition-colors duration-200">
                            <img src="${this.currentUser.profilePic || 'https://placehold.co/32x32/6b7280/ffffff?text=U'}" alt="Profile" class="w-full h-full object-cover">
                        </button>`
                        :
                        `<button id="menu-toggle" class="text-gray-300 hover:text-amber-400 transition-colors duration-200 mr-2">
                            <i class="fas fa-bars text-xl"></i>
                        </button>
                        <button id="login-btn" class="px-4 py-2 huly-btn-enhanced font-medium text-sm">
                            <i class="fas fa-sign-in-alt mr-2"></i>Login
                        </button>`
                    }
                </div>
            </div>
        `;
        document.body.insertBefore(header, document.body.firstChild);
        
        // Update CSS variable for header height
        const updateHeaderHeight = () => {
            const headerHeight = header.offsetHeight;
            document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
        };
        updateHeaderHeight();
        window.addEventListener('resize', updateHeaderHeight);

        this.bindHeaderEvents();
    }

    // Adjusts padding-top for main content containers
    adjustMainContentPadding() {
        const containers = document.querySelectorAll('#auth-container, #profile-container');
        containers.forEach(container => {
            // Apply padding-top based on header height, with a small additional gap if desired
            // Using 1rem (16px) as a minimal gap, adjust as needed
            container.style.paddingTop = `calc(var(--header-height) + 1rem)`;
        });
    }

    createSidebar() {
        if (document.getElementById('auth-sidebar')) return;

        const history = JSON.parse(localStorage.getItem('page_history') || '[]');
        const totalVisits = localStorage.getItem('total_visits') || '0';

        const historyHTML = history.map(item => `
            <button onclick="window.location.href='${item.path}'" class="w-full flex items-center justify-between py-2 px-3 text-gray-400 hover:bg-white hover:bg-opacity-10 hover:text-white rounded-lg transition-all duration-200 text-sm group">
                <div class="flex items-center space-x-2 min-w-0">
                    <i class="fas fa-history text-xs text-gray-500 group-hover:text-amber-400"></i>
                    <span class="truncate">${item.name}</span>
                </div>
                <span class="text-xs text-gray-600 ml-2 flex-shrink-0">${this.formatTime(item.timestamp)}</span>
            </button>
        `).join('');

        const sidebar = document.createElement('div');
        sidebar.id = 'auth-sidebar';
        // Use CSS variable for padding-top to synchronize with header height
        sidebar.className = 'fixed top-0 right-0 h-full w-72 glass-effect border-l border-white border-opacity-10 transform translate-x-full transition-transform duration-300 ease-in-out z-50 overflow-y-auto scrollbar-thin';
        sidebar.style.paddingTop = 'var(--header-height)'; // Start right below the header
        sidebar.innerHTML = `
            <div class="p-3 h-full flex flex-col">
                <div class="mb-4">
                    ${this.currentUser ?
                        `<div class="flex items-center space-x-3 p-3 glass-effect rounded-lg border border-white border-opacity-10">
                            <img src="${this.currentUser.profilePic || 'https://placehold.co/40x40/6b7280/ffffff?text=U'}" alt="Profile" class="w-10 h-10 rounded-full object-cover border border-amber-400">
                            <div class="min-w-0 flex-1">
                                <div class="text-white font-medium text-sm truncate">${this.currentUser.username}</div>
                                <div class="text-gray-400 text-xs">Online</div>
                            </div>
                        </div>`
                        :
                        `<div class="flex items-center space-x-3 p-3 glass-effect rounded-lg border border-white border-opacity-10">
                            <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600">
                                <i class="fas fa-user text-gray-400 text-sm"></i>
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="text-gray-300 text-sm">Guest User</div>
                                <div class="text-gray-500 text-xs">Offline</div>
                            </div>
                        </div>`
                    }
                </div>
                <div class="flex-1 space-y-1">
                    ${this.currentUser ?
                        `
                        <div class="main-buttons-scroll-container space-y-1 overflow-y-auto scrollbar-thin max-h-60 mb-3">
                            <button id="sidebar-profile" class="w-full flex items-center space-x-3 py-2.5 px-3 text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white rounded-lg transition-all duration-200 text-sm">
                                <i class="fas fa-user text-amber-400 w-4"></i><span>Profile</span>
                            </button>
                            <button onclick="window.location.href='dashboard.html'" class="w-full flex items-center space-x-3 py-2.5 px-3 text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white rounded-lg transition-all duration-200 text-sm">
                                <i class="fas fa-home text-amber-400 w-4"></i><span>Dashboard</span>
                            </button>
                            <button onclick="window.location.href='messages.html'" class="w-full flex items-center space-x-3 py-2.5 px-3 text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white rounded-lg transition-all duration-200 text-sm">
                                <i class="fas fa-envelope text-amber-400 w-4"></i><span>Messages</span>
                            </button>
                            <button onclick="window.location.href='tasks.html'" class="w-full flex items-center space-x-3 py-2.5 px-3 text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white rounded-lg transition-all duration-200 text-sm">
                                <i class="fas fa-tasks text-amber-400 w-4"></i><span>Tasks</span>
                            </button>
                            <button onclick="window.location.href='settings.html'" class="w-full flex items-center space-x-3 py-2.5 px-3 text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white rounded-lg transition-all duration-200 text-sm">
                                <i class="fas fa-cog text-amber-400 w-4"></i><span>Settings</span>
                            </button>
                            <button onclick="window.location.href='projects.html'" class="w-full flex items-center space-x-3 py-2.5 px-3 text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white rounded-lg transition-all duration-200 text-sm">
                                <i class="fas fa-folder text-amber-400 w-4"></i><span>Projects</span>
                            </button>
                            <button onclick="window.location.href='analytics.html'" class="w-full flex items-center space-x-3 py-2.5 px-3 text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white rounded-lg transition-all duration-200 text-sm">
                                <i class="fas fa-chart-line text-amber-400 w-4"></i><span>Analytics</span>
                            </button>
                            <button onclick="window.location.href='support.html'" class="w-full flex items-center space-x-3 py-2.5 px-3 text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white rounded-lg transition-all duration-200 text-sm">
                                <i class="fas fa-life-ring text-amber-400 w-4"></i><span>Support</span>
                            </button>
                            <button onclick="window.location.href='about.html'" class="w-full flex items-center space-x-3 py-2.5 px-3 text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white rounded-lg transition-all duration-200 text-sm">
                                <i class="fas fa-info-circle text-amber-400 w-4"></i><span>About</span>
                            </button>
                        </div>
                        <hr class="border-gray-700 border-opacity-50 my-3">
                        `
                        :
                        ``
                    }
                    <div class="py-2">
                        <div class="text-xs font-medium text-gray-500 mb-2 px-3">TOTAL VISITS: ${totalVisits}</div>
                        <div class="text-xs font-medium text-gray-500 mb-2 px-3">RECENT PAGES</div>
                        <div class="space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                            ${historyHTML || '<div class="text-xs text-gray-500 px-3 py-2">No pages visited yet</div>'}
                        </div>
                    </div>
                </div>
                <div class="mt-auto pt-3 border-t border-gray-700 border-opacity-50">
                    ${this.currentUser ?
                        `<button id="sidebar-logout" class="w-full flex items-center justify-center space-x-3 py-2.5 px-3 danger-huly-btn-enhanced text-sm">
                            <i class="fas fa-sign-out-alt w-4"></i><span>Logout</span>
                        </button>`
                        :
                        `<button id="sidebar-login" class="w-full flex items-center justify-center space-x-3 py-2.5 px-3 huly-btn-enhanced text-sm">
                            <i class="fas fa-sign-in-alt w-4"></i><span>Login</span>
                        </button>`
                    }
                </div>
            </div>
        `;
        document.body.appendChild(sidebar);
        const overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm hidden z-40';
        document.body.appendChild(overlay);
        this.bindSidebarEvents();
    }

    bindHeaderEvents() {
        const menuToggle = document.getElementById('menu-toggle');
        const profileToggle = document.getElementById('profile-toggle');
        const loginBtn = document.getElementById('login-btn');

        if (menuToggle) {
            menuToggle.onclick = () => this.toggleSidebar();
        }
        if (profileToggle) {
            profileToggle.onclick = () => this.toggleSidebar();
        }
        if (loginBtn) {
            loginBtn.onclick = () => this.redirectToLogin();
        }
    }

    bindSidebarEvents() {
        const overlay = document.getElementById('sidebar-overlay');
        const sidebarLogin = document.getElementById('sidebar-login');
        const sidebarProfile = document.getElementById('sidebar-profile');
        const sidebarLogout = document.getElementById('sidebar-logout');

        if (overlay) {
            overlay.onclick = () => this.closeSidebar();
        }
        if (sidebarLogin) {
            sidebarLogin.onclick = () => {
                this.closeSidebar();
                this.redirectToLogin();
            };
        }
        if (sidebarProfile) {
            sidebarProfile.onclick = () => {
                this.closeSidebar();
                this.redirectToProfile();
            };
        }
        if (sidebarLogout) {
            sidebarLogout.onclick = () => {
                this.closeSidebar();
                this.logout();
            };
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('auth-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar.classList.toggle('translate-x-full');
        overlay.classList.toggle('hidden');
    }

    closeSidebar() {
        const sidebar = document.getElementById('auth-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar.classList.add('translate-x-full');
        overlay.classList.add('hidden');
    }

    initAuth() {
        if (window.location.pathname.includes('login.html')) {
            this.initLoginPage();
        } else if (window.location.pathname.includes('profile.html')) {
            this.initProfilePage();
        }
    }

    initLoginPage() {
        const signinForm = document.getElementById('signin-form');
        const signupForm = document.getElementById('signup-form');
        const signinBtn = document.getElementById('signin-btn');
        const signupBtn = document.getElementById('signup-btn');

        const switchToSignupLink = document.getElementById('switch-to-signup');
        const switchToSigninLink = document.getElementById('switch-to-signin');

        if (switchToSignupLink) {
            switchToSignupLink.onclick = (e) => {
                e.preventDefault();
                signinForm.classList.add('hidden');
                signupForm.classList.remove('hidden');
                this.updateHeaderForSignup();
            };
        }

        if (switchToSigninLink) {
            switchToSigninLink.onclick = (e) => {
                e.preventDefault();
                signupForm.classList.add('hidden');
                signinForm.classList.remove('hidden');
                this.updateHeaderForSignin();
            };
        }

        if (signinBtn) {
            signinBtn.onclick = (e) => { e.preventDefault(); this.signin(); };
        }
        if (signupBtn) {
            signupBtn.onclick = (e) => { e.preventDefault(); this.signup(); };
        }
    }

    updateHeaderForSignup() {
        const headerTitle = document.getElementById('header-title');
        const headerSubtitle = document.getElementById('header-subtitle');
        if (headerTitle) headerTitle.textContent = 'Create Your Account';
        if (headerSubtitle) headerSubtitle.textContent = 'Join us and get started!';
    }

    updateHeaderForSignin() {
        const headerTitle = document.getElementById('header-title');
        const headerSubtitle = document.getElementById('header-subtitle');
        if (headerTitle) headerTitle.textContent = 'Welcome Back';
        if (headerSubtitle) headerSubtitle.textContent = 'Access your account to continue';
    }

    initProfilePage() {
        const form = document.getElementById('profile-form');
        const logoutBtn = document.getElementById('logout-btn');
        const currentProfilePic = document.getElementById('current-profile-pic');
        const usernameInput = document.getElementById('profile-username');
        const profilePicInput = document.getElementById('profile-pic-input'); // Merged input
        const uploadIconBtn = document.getElementById('upload-icon-btn');
        const profilePicFile = document.getElementById('profile-pic-file');
        const fileNameDisplay = document.getElementById('file-name-display');

        // Initialize fields as empty or with current user data
        if (usernameInput) usernameInput.value = this.currentUser ? this.currentUser.username : '';
        if (currentProfilePic) currentProfilePic.src = this.currentUser ? (this.currentUser.profilePic || '') : '';

        // Profile Picture Input Logic (Merged)
        if (uploadIconBtn && profilePicFile && profilePicInput && fileNameDisplay) {
            uploadIconBtn.onclick = () => {
                profilePicFile.click(); // Trigger the hidden file input
            };

            profilePicFile.onchange = () => {
                if (profilePicFile.files.length > 0) {
                    const file = profilePicFile.files[0];
                    fileNameDisplay.textContent = `Selected: ${file.name}`;
                    fileNameDisplay.classList.remove('hidden');
                    profilePicInput.value = ''; // Clear URL if file is selected
                    profilePicInput.readOnly = true; // Make URL input read-only
                    profilePicInput.placeholder = 'File selected, clear to use URL';
                    profilePicInput.type = 'text'; // Change type to text to prevent URL validation
                } else {
                    fileNameDisplay.classList.add('hidden');
                    fileNameDisplay.textContent = 'No file selected.';
                    profilePicInput.readOnly = false; // Make URL input editable
                    profilePicInput.placeholder = 'Enter URL or upload file';
                    profilePicInput.type = 'text'; // Keep as text
                }
            };

            profilePicInput.oninput = () => {
                // If user types in URL, clear file selection
                if (profilePicInput.value !== '') {
                    profilePicFile.value = ''; // Clear file input
                    fileNameDisplay.classList.add('hidden');
                    fileNameDisplay.textContent = 'No file selected.';
                    profilePicInput.readOnly = false; // Ensure it's editable
                    profilePicInput.placeholder = 'Enter URL or upload file';
                    profilePicInput.type = 'text'; // Keep as text
                }
            };
        }


        if (form) {
            form.onsubmit = (e) => { e.preventDefault(); this.updateProfile(); };
        }
        if (logoutBtn) {
            logoutBtn.onclick = () => this.logout();
        }
    }

    signin() {
        const username = document.getElementById('signin-username').value.trim();
        const password = document.getElementById('signin-password').value;

        if (!username || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        const users = JSON.parse(localStorage.getItem('auth_users') || '{}');
        if (!users[username] || users[username].password !== password) {
            this.showError('Invalid username or password');
            return;
        }

        localStorage.setItem('auth_current_user', JSON.stringify(users[username]));
        this.redirectToDashboard();
    }

    signup() {
        const username = document.getElementById('signup-username').value.trim();
        const password = document.getElementById('signup-password').value;
        const profilePicInput = document.getElementById('signup-profile-url'); // Merged input for URL/file placeholder
        const profileFile = document.getElementById('signup-profile-file').files[0];

        if (!username || !password) {
            this.showError('Please fill in username and password');
            return;
        }

        const users = JSON.parse(localStorage.getItem('auth_users') || '{}');
        if (users[username]) {
            this.showError('Username already exists');
            return;
        }

        const createUser = (profilePicData) => {
            const user = { username, password, profilePic: profilePicData || null };
            users[username] = user;
            localStorage.setItem('auth_users', JSON.stringify(users));
            localStorage.setItem('auth_current_user', JSON.stringify(user));
            this.redirectToDashboard();
        };

        if (profileFile) {
            const reader = new FileReader();
            reader.onload = (e) => createUser(e.target.result);
            reader.readAsDataURL(profileFile);
        } else if (profilePicInput.value.trim()) { // Check if URL is entered
            createUser(profilePicInput.value.trim());
        } else {
            createUser(null); // No profile pic provided
        }
    }

    updateProfile() {
        const username = document.getElementById('profile-username').value.trim();
        const password = document.getElementById('profile-password').value;
        const profilePicInput = document.getElementById('profile-pic-input'); // Merged input for URL/file placeholder
        const profileFile = document.getElementById('profile-pic-file').files[0];

        if (!username) {
            this.showProfileMessage('Please enter a username', 'error');
            return;
        }

        const users = JSON.parse(localStorage.getItem('auth_users') || '{}');
        const oldUsername = this.currentUser.username;

        if (username !== oldUsername && users[username]) {
            this.showProfileMessage('Username already exists', 'error');
            return;
        }

        const updateUser = (newProfilePic) => {
            const updatedUser = {
                username,
                password: password || this.currentUser.password,
                profilePic: newProfilePic !== undefined ? newProfilePic : this.currentUser.profilePic
            };

            if (username !== oldUsername) {
                delete users[oldUsername];
            }
            users[username] = updatedUser;
            localStorage.setItem('auth_users', JSON.stringify(users));
            localStorage.setItem('auth_current_user', JSON.stringify(updatedUser));
            this.currentUser = updatedUser;
            this.showProfileMessage('Profile updated successfully', 'success');
            setTimeout(() => location.reload(), 1500);
        };

        if (profileFile) {
            const reader = new FileReader();
            reader.onload = (e) => updateUser(e.target.result);
            reader.readAsDataURL(profileFile);
        } else if (profilePicInput.value.trim()) {
            updateUser(profilePicInput.value.trim());
        } else {
            updateUser(null);
        }
    }

    logout() {
        localStorage.removeItem('auth_current_user');
        window.location.href = 'login.html';
    }

    getCurrentUser() {
        const userData = localStorage.getItem('auth_current_user');
        return userData ? JSON.parse(userData) : null;
    }

    checkAuthRedirect() {
        const path = window.location.pathname;
        const protectedPages = ['dashboard.html', 'profile.html', 'messages.html', 'tasks.html', 'settings.html', 'projects.html', 'analytics.html', 'support.html', 'about.html']; // Added new pages to protected list
        const isProtectedPage = protectedPages.some(page => path.includes(page));

        if (isProtectedPage && !this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        if (path.includes('login.html') && this.currentUser) {
            window.location.href = 'dashboard.html';
        }
    }

    redirectToLogin() {
        window.location.href = 'login.html';
    }

    redirectToProfile() {
        if (!this.currentUser) {
            this.redirectToLogin();
            return;
        }
        window.location.href = 'profile.html';
    }

    redirectToDashboard() {
        window.location.href = 'dashboard.html';
    }

    showError(message) {
        const errorDiv = document.getElementById('message-box');
        if (errorDiv) {
            errorDiv.querySelector('span').textContent = message;
            errorDiv.classList.remove('hidden', 'bg-green-900', 'border-green-500', 'text-green-300');
            errorDiv.classList.add('bg-red-900', 'bg-opacity-30', 'backdrop-blur-sm', 'border', 'border-red-500', 'border-opacity-30', 'text-red-300');
            errorDiv.querySelector('i').className = 'fas fa-exclamation-triangle mr-2';
            setTimeout(() => errorDiv.classList.add('hidden'), 5000);
        }
    }

    showProfileMessage(message, type) {
        let messageDiv = document.getElementById('message-box');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'message-box';
            messageDiv.classList.add('mt-6', 'p-4', 'rounded-2xl', 'text-sm', 'hidden', 'shadow-lg', 'animate-slideIn');
            messageDiv.innerHTML = '<i class="mr-2"></i><span></span>';
            const profileForm = document.getElementById('profile-form');
            if (profileForm) {
                profileForm.parentNode.appendChild(messageDiv);
            } else {
                document.body.appendChild(messageDiv);
            }
        }

        messageDiv.querySelector('span').textContent = message;
        messageDiv.classList.remove('hidden', 'bg-red-900', 'border-red-500', 'text-red-300', 'bg-green-900', 'border-green-500', 'text-green-300', 'bg-opacity-30', 'backdrop-blur-sm', 'border', 'border-opacity-30');
        messageDiv.querySelector('i').className = '';

        if (type === 'success') {
            messageDiv.classList.add('bg-green-900', 'bg-opacity-30', 'backdrop-blur-sm', 'border', 'border-green-500', 'border-opacity-30', 'text-green-300');
            messageDiv.querySelector('i').classList.add('fas', 'fa-check-circle');
        } else {
            messageDiv.classList.add('bg-red-900', 'bg-opacity-30', 'backdrop-blur-sm', 'border', 'border-red-500', 'border-opacity-30', 'text-red-300');
            messageDiv.querySelector('i').classList.add('fas', 'fa-exclamation-triangle');
        }
        messageDiv.classList.remove('hidden');
        setTimeout(() => messageDiv.classList.add('hidden'), 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AuthSystem();

    // Dynamic Orb Generation (retained from previous responses)
    const generateOrbs = () => {
        const body = document.body;
        // Clear existing orbs if any
        document.querySelectorAll('.floating-orb-container').forEach(orb => orb.remove());

        let orbConfigs = [];
        const width = window.innerWidth;
        const height = window.innerHeight;

        const baseSize = Math.min(width, height) * 0.15; // 15% of the smaller dimension

        if (width < 640) { // Mobile
            orbConfigs = [
                { size: baseSize * 1.2, top: '10%', left: '5%', delay: '0s' },
                { size: baseSize * 0.9, bottom: '15%', right: '10%', delay: '2s' },
                { size: baseSize * 0.7, top: '55%', left: '20%', delay: '1s' }
            ];
        } else if (width >= 640 && width < 1024) { // Tablet
            orbConfigs = [
                { size: baseSize * 1.4, top: '10%', left: '8%', delay: '0s' },
                { size: baseSize * 1.1, bottom: '10%', right: '12%', delay: '2s' },
                { size: baseSize * 0.8, top: '60%', left: '15%', delay: '1s' },
                { size: baseSize * 1.2, top: '25%', right: '20%', delay: '3s' },
                { size: baseSize * 0.7, bottom: '5%', left: '50%', delay: '4s' }
            ];
        } else { // Desktop
            orbConfigs = [
                { size: baseSize * 1.6, top: '10%', left: '5%', delay: '0s' },
                { size: baseSize * 1.3, bottom: '5%', right: '10%', delay: '2s' },
                { size: baseSize * 1.0, top: '50%', left: '15%', delay: '1s' },
                { size: baseSize * 1.4, top: '20%', right: '10%', delay: '3s' },
                { size: baseSize * 1.1, bottom: '25%', left: '40%', delay: '4s' },
                { size: baseSize * 0.8, top: '5%', right: '30%', delay: '0.5s' },
                { size: baseSize * 0.7, bottom: '15%', left: '70%', delay: '2.5s' },
                { size: baseSize * 0.6, top: '70%', right: '5%', delay: '1.5s' }
            ];
        }

        orbConfigs.forEach((config) => {
            const orb = document.createElement('div');
            orb.classList.add('floating-orb-container');
            orb.style.width = `${config.size}px`;
            orb.style.height = `${config.size}px`;
            if (config.top) orb.style.top = config.top;
            if (config.left) orb.style.left = config.left;
            if (config.right) orb.style.right = config.right;
            if (config.bottom) orb.style.bottom = config.bottom;
            orb.style.animationDelay = config.delay;
            body.appendChild(orb);
        });
    };

    // Call on load and resize
    generateOrbs();
    window.addEventListener('resize', generateOrbs);
});

