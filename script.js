// DOM Elements
const selectRegion = document.getElementById('select-region');
const selectProvince = document.getElementById('region-province');
const selectCity = document.getElementById('province-cities');
const selectBarangay = document.getElementById('cities-barangay');
const messageContainer = document.getElementById('message-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const passwordInput = document.getElementById('password');
const passwordToggle = document.querySelectorAll('.toggle-password');
const strengthMeter = document.getElementById('strength-meter-fill');
const passwordFeedback = document.getElementById('password-feedback');

// API endpoint with fallback
const API_BASE_URL = 'https://psgc.cloud/api';
const BACKUP_API_URL = 'https://ph-locations-api.buonzz.com/v1';
let usingBackupApi = false;

// Display messages to the user
function showMessage(message, type = 'error') {
    if (!messageContainer) return;
    
    messageContainer.className = 'message-container';
    messageContainer.classList.add(type === 'error' ? 'error-message' : 'success-message');
    messageContainer.textContent = message;
    messageContainer.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 5000);
}

// Fetch data with error handling and retries
async function fetchWithRetry(url, options = {}, retries = 3) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Accept': 'application/json',
                ...(options.headers || {})
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        if (retries > 0) {
            // Wait 1s before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(url, options, retries - 1);
        }
        
        // If using primary API and it fails, try backup API
        if (!usingBackupApi && !url.includes(BACKUP_API_URL)) {
            usingBackupApi = true;
            // Convert to backup API format
            const backupUrl = convertToBackupApiUrl(url);
            if (backupUrl) {
                return fetchWithRetry(backupUrl, options, 3);
            }
        }
        
        console.error('Fetch error:', error);
        throw error;
    }
}

// Convert primary API URL to backup API format
function convertToBackupApiUrl(url) {
    if (url.includes('/regions')) {
        return `${BACKUP_API_URL}/regions`;
    } else if (url.includes('/provinces')) {
        return `${BACKUP_API_URL}/provinces`;
    } else if (url.includes('/cities-municipalities')) {
        return `${BACKUP_API_URL}/cities`;
    } else if (url.includes('/barangays')) {
        return `${BACKUP_API_URL}/barangays`;
    }
    return null;
}

// Process API response based on which API we're using
function processApiResponse(data) {
    if (usingBackupApi) {
        return data.data || [];
    }
    return data;
}

// Fetch and Populate Regions
async function loadRegions() {
    try {
        selectRegion.disabled = true;
        const loadingOption = document.createElement('option');
        loadingOption.textContent = 'Loading...';
        selectRegion.appendChild(loadingOption);
        
        const response = await fetchWithRetry(`${API_BASE_URL}/regions`);
        const regions = processApiResponse(response);
        
        // Remove loading option
        selectRegion.removeChild(loadingOption);
        
        // Sort and populate
        regions.sort((a, b) => a.name.localeCompare(b.name));
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = usingBackupApi ? region.region_code : region.code;
            option.textContent = region.name;
            selectRegion.appendChild(option);
        });
    } catch (error) {
        showMessage('Failed to load regions. Please try again later.');
    } finally {
        selectRegion.disabled = false;
    }
}

// Fetch and Populate Provinces based on Region
async function loadProvinces(regionCode) {
    try {
        selectProvince.disabled = true;
        const loadingOption = document.createElement('option');
        loadingOption.textContent = 'Loading...';
        selectProvince.appendChild(loadingOption);
        
        const url = usingBackupApi 
            ? `${BACKUP_API_URL}/provinces?region_code=${regionCode}`
            : `${API_BASE_URL}/regions/${regionCode}/provinces`;
            
        const response = await fetchWithRetry(url);
        const provinces = processApiResponse(response);
        
        // Remove loading option and default
        selectProvince.innerHTML = '<option selected value="">Select Province</option>';
        
        // Sort and populate
        provinces.sort((a, b) => a.name.localeCompare(b.name));
        provinces.forEach(province => {
            const option = document.createElement('option');
            option.value = usingBackupApi ? province.province_code : province.code;
            option.textContent = province.name;
            selectProvince.appendChild(option);
        });
    } catch (error) {
        showMessage('Failed to load provinces. Please try again later.');
    } finally {
        selectProvince.disabled = false;
    }
}

// Fetch and Populate Cities/Municipalities based on Province
async function loadCities(provinceCode) {
    try {
        selectCity.disabled = true;
        const loadingOption = document.createElement('option');
        loadingOption.textContent = 'Loading...';
        selectCity.appendChild(loadingOption);
        
        const url = usingBackupApi 
            ? `${BACKUP_API_URL}/cities?province_code=${provinceCode}`
            : `${API_BASE_URL}/provinces/${provinceCode}/cities-municipalities`;
            
        const response = await fetchWithRetry(url);
        const cities = processApiResponse(response);
        
        // Remove loading option and default
        selectCity.innerHTML = '<option selected value="">Select City</option>';
        
        // Sort and populate
        cities.sort((a, b) => a.name.localeCompare(b.name));
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = usingBackupApi ? city.city_code : city.code;
            option.textContent = city.name;
            selectCity.appendChild(option);
        });
    } catch (error) {
        showMessage('Failed to load cities. Please try again later.');
    } finally {
        selectCity.disabled = false;
    }
}

// Fetch and Populate Barangays based on City
async function loadBarangays(cityCode) {
    try {
        selectBarangay.disabled = true;
        const loadingOption = document.createElement('option');
        loadingOption.textContent = 'Loading...';
        selectBarangay.appendChild(loadingOption);
        
        const url = usingBackupApi 
            ? `${BACKUP_API_URL}/barangays?city_code=${cityCode}`
            : `${API_BASE_URL}/cities-municipalities/${cityCode}/barangays`;
            
        const response = await fetchWithRetry(url);
        const barangays = processApiResponse(response);
        
        // Remove loading option and default
        selectBarangay.innerHTML = '<option selected value="">Select Barangay</option>';
        
        // Sort and populate
        barangays.sort((a, b) => a.name.localeCompare(b.name));
        barangays.forEach(barangay => {
            const option = document.createElement('option');
            option.value = usingBackupApi ? barangay.brgy_code : barangay.code;
            option.textContent = barangay.name;
            selectBarangay.appendChild(option);
        });
    } catch (error) {
        showMessage('Failed to load barangays. Please try again later.');
    } finally {
        selectBarangay.disabled = false;
    }
}

// Initial Load - only if the select element exists
if (selectRegion) {
    loadRegions();

    // Region Change Event
    selectRegion.addEventListener('change', () => {
        const code = selectRegion.value;

        selectProvince.innerHTML = '<option selected value="">Select Province</option>';
        selectCity.innerHTML = '<option selected value="">Select City</option>';
        selectBarangay.innerHTML = '<option selected value="">Select Barangay</option>';

        if (code === '') {
            selectProvince.disabled = true;
            selectCity.disabled = true;
            selectBarangay.disabled = true;
        } else {
            selectProvince.disabled = false;
            loadProvinces(code);
        }
    });

    // Province Change Event
    selectProvince.addEventListener('change', () => {
        const code = selectProvince.value;

        selectCity.innerHTML = '<option selected value="">Select City</option>';
        selectBarangay.innerHTML = '<option selected value="">Select Barangay</option>';

        if (code === '') {
            selectCity.disabled = true;
            selectBarangay.disabled = true;
        } else {
            selectCity.disabled = false;
            loadCities(code);
        }
    });

    // City Change Event
    selectCity.addEventListener('change', () => {
        const code = selectCity.value;

        selectBarangay.innerHTML = '<option selected value="">Select Barangay</option>';

        if (code === '') {
            selectBarangay.disabled = true;
        } else {
            selectBarangay.disabled = false;
            loadBarangays(code);
        }
    });
}

// Multi-step form navigation
document.addEventListener('DOMContentLoaded', function() {
    // Check if multi-step form exists
    const registerSection = document.getElementById('register-section');
    if (registerSection) {
        registerSection.style.display = 'block';
        
        const formSteps = document.querySelectorAll('.form-step');
        const progressSteps = document.querySelectorAll('.progress-step');
        const nextButtons = document.querySelectorAll('.next-step');
        const prevButtons = document.querySelectorAll('.prev-step');
        
        let currentStep = 1;
        
        // Update UI to show current step
        function updateStepUI() {
            formSteps.forEach(step => {
                step.style.display = 'none';
            });
            
            progressSteps.forEach(step => {
                step.classList.remove('active');
            });
            
            formSteps[currentStep - 1].style.display = 'block';
            progressSteps[currentStep - 1].classList.add('active');
        }
        
        // Validate step before proceeding
        function validateStep(stepNum) {
            const currentFormStep = formSteps[stepNum - 1];
            const requiredFields = currentFormStep.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (field.value.trim() === '') {
                    field.classList.add('input-error');
                    isValid = false;
                } else {
                    field.classList.remove('input-error');
                }
                
                // Add specific validations
                if (field.id === 'phone' && field.value.trim().length !== 11) {
                    field.classList.add('input-error');
                    isValid = false;
                }
                
                if (field.id === 'password' && field.value.length < 8) {
                    field.classList.add('input-error');
                    isValid = false;
                }
                
                if (field.id === 'confirmPassword' && 
                    field.value !== document.getElementById('password').value) {
                    field.classList.add('input-error');
                    isValid = false;
                }
            });
            
            return isValid;
        }
        
        // Next button click
        nextButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (validateStep(currentStep)) {
                    currentStep++;
                    if (currentStep > formSteps.length) {
                        currentStep = formSteps.length;
                    }
                    updateStepUI();
                } else {
                    showMessage('Please fill all required fields correctly');
                }
            });
        });
        
        // Previous button click
        prevButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentStep--;
                if (currentStep < 1) {
                    currentStep = 1;
                }
                updateStepUI();
            });
        });
        
        // Initialize first step
        updateStepUI();
    }
});

// Password strength meter
if (passwordInput) {
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        
        // Update strength meter
        strengthMeter.style.width = `${strength}%`;
        
        // Set color based on strength
        if (strength < 40) {
            strengthMeter.style.backgroundColor = '#ff4d4d';
            passwordFeedback.textContent = 'Weak password';
            passwordFeedback.className = 'feedback-msg';
        } else if (strength < 80) {
            strengthMeter.style.backgroundColor = '#ffa500';
            passwordFeedback.textContent = 'Moderate password';
            passwordFeedback.className = 'feedback-msg';
        } else {
            strengthMeter.style.backgroundColor = '#4caf50';
            passwordFeedback.textContent = 'Strong password';
            passwordFeedback.className = 'feedback-msg valid';
        }
    });
}

// Calculate password strength
function calculatePasswordStrength(password) {
    let strength = 0;
    
    // Length contribution (max 40%)
    const lengthFactor = Math.min(password.length / 12, 1);
    strength += lengthFactor * 40;
    
    // Complexity contribution (max 60%)
    if (/[A-Z]/.test(password)) strength += 10; // Uppercase
    if (/[a-z]/.test(password)) strength += 10; // Lowercase
    if (/[0-9]/.test(password)) strength += 10; // Numbers
    if (/[^A-Za-z0-9]/.test(password)) strength += 15; // Special chars
    
    // Variety of character types
    const charTypes = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(regex => regex.test(password)).length;
    strength += (charTypes - 1) * 5; // Add 5% for each extra char type beyond the first
    
    return Math.min(strength, 100);
}

// Password toggle visibility
if (passwordToggle) {
    passwordToggle.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const targetInput = document.getElementById(targetId);
            
            if (targetInput.type === 'password') {
                targetInput.type = 'text';
                this.classList.remove('bx-hide');
                this.classList.add('bx-show');
            } else {
                targetInput.type = 'password';
                this.classList.remove('bx-show');
                this.classList.add('bx-hide');
            }
        });
    });
}

// Form validation
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;
        
        if (!username || !password) {
            showMessage('Please enter both username and password');
            return;
        }
        
        if (!agreeTerms) {
            showMessage('Please agree to the Terms & Conditions');
            return;
        }
        
        // Convert to POST for security
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        // Use fetch instead of form action for better control
        fetch('login.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            if (data.includes('Invalid')) {
                showMessage('Invalid username or password');
            } else {
                // Successful login
                window.location.href = 'dashboard.html';
            }
        })
        .catch(error => {
            showMessage('Login failed. Please try again later.');
            console.error('Login error:', error);
        });
    });
}

// Register form validation 
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showMessage('Passwords do not match');
            return;
        }
        
        const regAgreeTerms = document.getElementById('regAgreeTerms').checked;
        if (!regAgreeTerms) {
            showMessage('Please agree to the Terms & Conditions');
            return;
        }
        
        // Submit the form
        this.submit();
    });
}