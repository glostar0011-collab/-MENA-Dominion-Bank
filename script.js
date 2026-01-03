/**
 * =============================================================================
 * SYSTEM: MENA DOMINION BANK (MDB) - CORE ENGINE V5.0
 * AUTHOR: ARCHITECT | DOMINION GLOBAL TECH
 * DATABASE: GOOGLE SHEETS VIA SHEETY API
 * MAPPING: COLUMNS A-M (ACCOUNT DATA, SECURITY, LEDGER, ANALYTICS)
 * =============================================================================
 * DESCRIPTION:
 * This script manages the authentication flow, data retrieval from the secure
 * spreadsheet vault, and dynamic rendering of the Sovereign Dashboard.
 * =============================================================================
 */

// --- 1. CONFIGURATION & CORE ENDPOINTS ---
const CONFIG = {
    API_URL: 'https://api.sheety.co/47968877755ad230ff36a13667dfd22e/onlineBanking/userDatabase',
    APP_NAME: 'MENA Dominion Bank',
    VERSION: '5.0.4-ELITE',
    REFRESH_RATE: 30000, // Sync every 30 seconds
    LOG_PREFIX: '[MDB-SECURITY]'
};

// Global Session State
let activeSession = {
    isAuthenticated: false,
    userData: null,
    lastSync: null
};

// --- 2. INITIALIZATION PROTOCOL ---
document.addEventListener('DOMContentLoaded', () => {
    console.log(`${CONFIG.LOG_PREFIX} System Initialized. Version: ${CONFIG.VERSION}`);
    initSystem();
});

function initSystem() {
    const loader = document.getElementById('app-preloader');
    // Simulate complex security handshake
    setTimeout(() => {
        if (loader) loader.style.opacity = '0';
        setTimeout(() => { if (loader) loader.style.display = 'none'; }, 500);
    }, 2000);
}

// --- 3. AUTHENTICATION ENGINE (The Gateway) ---
async function processLogin() {
    const userField = document.getElementById('input-user');
    const passField = document.getElementById('input-pass');
    const loginBtn = document.querySelector('.btn-auth-action');

    if (!userField.value || !passField.value) {
        showNotification("Security Alert: Credentials Required", "error");
        return;
    }

    setLoadingState(loginBtn, true);

    try {
        console.log(`${CONFIG.LOG_PREFIX} Attempting secure fetch from vault...`);
        const response = await fetch(CONFIG.API_URL);
        const result = await response.json();
        
        // Sheety nests the array under the sheet name
        const vaultData = result.userDatabase;

        // AUTHENTICATION LOGIC (Checking Col A & B)
        const userFound = vaultData.find(u => 
            u.username.trim() === userField.value.trim() && 
            u.password.toString() === passField.value.trim()
        );

        if (userFound) {
            handleAuthSuccess(userFound);
        } else {
            showNotification("Access Denied: Invalid Authorization", "error");
            setLoadingState(loginBtn, false);
        }

    } catch (error) {
        console.error(`${CONFIG.LOG_PREFIX} Critical System Fault:`, error);
        showNotification("System Error: Vault Connection Timed Out", "error");
        setLoadingState(loginBtn, false);
    }
}

// --- 4. SESSION MANAGEMENT ---
function handleAuthSuccess(data) {
    activeSession.isAuthenticated = true;
    activeSession.userData = data;
    activeSession.lastSync = new Date();

    console.log(`${CONFIG.LOG_PREFIX} Access Granted for: ${data.fullName}`);
    
    // Transition UI
    document.getElementById('vault-modal').style.display = 'none';
    document.getElementById('landing-hero').style.display = 'none';
    document.querySelector('.info-grid').style.display = 'none';
    document.getElementById('dashboard-app').style.display = 'block';

    renderDashboard();
}

// --- 5. DATA RENDERING ENGINE (COLUMNS A-M) ---
function renderDashboard() {
    const u = activeSession.userData;

    // Mapping Sheet Data to UI Elements
    document.getElementById('client-name').innerText = u.fullName; // Col D
    document.getElementById('user-balance').innerText = formatCurrency(u.balance, u.currency); // Col G & H
    document.getElementById('user-acc-num').innerText = `Acc: ${u.accountNumber}`; // Col F
    document.getElementById('user-acc-type').innerText = u.accountType.toUpperCase(); // Col E
    document.getElementById('user-credit').innerText = u.creditScore || '700'; // Col M
    document.getElementById('user-status').innerText = u.accountStatus || 'Active'; // Col L

    // Handle History Ledger (Col J)
    const historyContainer = document.getElementById('user-history');
    if (u.transactionHistory) {
        const historyArray = u.transactionHistory.split(';');
        historyContainer.innerHTML = historyArray.map(item => `
            <div class="transaction-item">
                <span>${item.trim()}</span>
                <span class="status-tag">SECURED</span>
            </div>
        `).join('');
    }

    // Dynamic Avatar
    document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${u.fullName}&background=d4af37&color=0a192f&bold=true`;
}

// --- 6. SECURITY TOOLS & UTILITIES ---
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

function setLoadingState(btn, isLoading) {
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> AUTHORIZING...';
    } else {
        btn.disabled = false;
        btn.innerHTML = 'AUTHORIZE SESSION';
    }
}

function showNotification(msg, type) {
    // Simple alert for now, could be a custom toast UI
    alert(`${type === 'error' ? '🚫' : '✅'} ${msg}`);
}

function toggleVault() {
    const modal = document.getElementById('vault-modal');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}

function logout() {
    window.location.reload(); // Hard reset for security
}

// --- 7. AUTO-SYNC ENGINE (Reflects Admin Changes) ---
setInterval(async () => {
    if (activeSession.isAuthenticated) {
        try {
            const response = await fetch(CONFIG.API_URL);
            const result = await response.json();
            const freshData = result.userDatabase.find(u => u.username === activeSession.userData.username);
            
            if (freshData) {
                activeSession.userData = freshData;
                renderDashboard();
                console.log(`${CONFIG.LOG_PREFIX} Vault Sync Complete. Balance Updated.`);
            }
        } catch (e) {
            console.warn("Sync temporarily interrupted.");
        }
    }
}, CONFIG.REFRESH_RATE);
