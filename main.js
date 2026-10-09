/* ============================================================
   ADAPT OS - COMPLETE MAIN.JS
   Works with the supplied ADAPT OS HTML
   ============================================================ */

(() => {
    "use strict";

    /* =========================================================
       BASIC HELPERS
    ========================================================= */

    const $ = (id) => document.getElementById(id);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));

    const APP_KEY = "adaptOS_data_v3";
    const DB_NAME = "adaptOS_files_v3";
    const DB_STORE = "files";

    let data = null;
    let currentPage = "dashboard";
    let currentNoteId = null;
    let taskFilter = "all";
    let confirmationAction = null;
    let reminderTimer = null;
    let toastTimer = null;
    let loadingSafetyTimer = null;

    /* =========================================================
       UTILITIES
    ========================================================= */

    function clone(object) {
        return JSON.parse(JSON.stringify(object));
    }

    function id(prefix = "id") {
        return (
            prefix +
            "_" +
            Date.now() +
            "_" +
            Math.random().toString(36).substring(2, 9)
        );
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (char) => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return entities[char];
        });
    }

    function today() {
        const now = new Date();

        const local = new Date(
            now.getTime() - now.getTimezoneOffset() * 60000
        );

        return local.toISOString().slice(0, 10);
    }

    function money(amount) {
        const value = Number(amount) || 0;

        return (
            "GH₵ " +
            value.toLocaleString("en-GH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
        );
    }

    function formatDate(value) {
        if (!value) return "";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString("en-GH", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    function formatDateTime(value) {
        if (!value) return "";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleString("en-GH", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    }

    function formatBytes(bytes) {
        const value = Number(bytes) || 0;

        if (value === 0) return "0 B";

        const units = ["B", "KB", "MB", "GB"];

        const index = Math.min(
            units.length - 1,
            Math.floor(Math.log(value) / Math.log(1024))
        );

        return (
            (value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1) +
            " " +
            units[index]
        );
    }

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);

            reader.readAsDataURL(file);
        });
    }

    /* =========================================================
       DEFAULT DATA
    ========================================================= */

    const DEFAULT_DATA = {
        profile: {
            name: "User",
            occupation: "Student",
            organization: "ADAPT OS",
            logoData: "",
            accent: "#635bff",
            theme: "dark"
        },

        accounts: [],

        transactions: [],

        reminders: [],

        notes: [],

        tasks: [],

        activity: [],

        notifications: [],

        lastPage: "dashboard",

        settings: {
            notificationsEnabled: false
        }
    };

    /* =========================================================
       LOCAL STORAGE
    ========================================================= */

    function loadData() {
        try {
            const saved = localStorage.getItem(APP_KEY);

            if (!saved) {
                return clone(DEFAULT_DATA);
            }

            const parsed = JSON.parse(saved);

            return {
                ...clone(DEFAULT_DATA),
                ...parsed,

                profile: {
                    ...DEFAULT_DATA.profile,
                    ...(parsed.profile || {})
                },

                settings: {
                    ...DEFAULT_DATA.settings,
                    ...(parsed.settings || {})
                },

                accounts: Array.isArray(parsed.accounts)
                    ? parsed.accounts
                    : [],

                transactions: Array.isArray(parsed.transactions)
                    ? parsed.transactions
                    : [],

                reminders: Array.isArray(parsed.reminders)
                    ? parsed.reminders
                    : [],

                notes: Array.isArray(parsed.notes)
                    ? parsed.notes
                    : [],

                tasks: Array.isArray(parsed.tasks)
                    ? parsed.tasks
                    : [],

                activity: Array.isArray(parsed.activity)
                    ? parsed.activity
                    : [],

                notifications: Array.isArray(parsed.notifications)
                    ? parsed.notifications
                    : []
            };
        } catch (error) {
            console.error("Could not load ADAPT OS data:", error);

            return clone(DEFAULT_DATA);
        }
    }

    function saveData() {
        try {
            localStorage.setItem(APP_KEY, JSON.stringify(data));
        } catch (error) {
            console.error("Could not save ADAPT OS data:", error);

            showToast(
                "Storage is full or unavailable.",
                "⚠️"
            );
        }
    }

    /* =========================================================
       LOADING SCREEN
    ========================================================= */

    function showApp() {
        const loading = $("loadingScreen");
        const app = $("app");

        if (loading) {
            loading.classList.add("hidden");
            loading.style.display = "none";
        }

        if (app) {
            app.classList.remove("hidden");
            app.style.display = "";
            app.style.visibility = "visible";
            app.style.opacity = "1";
        }
    }

    function startLoadingScreen() {
        const loading = $("loadingScreen");
        const app = $("app");

        if (loading) {
            loading.classList.remove("hidden");
            loading.style.display = "";
        }

        if (app) {
            app.classList.remove("hidden");

            /*
               Important:
               We don't permanently depend on the CSS .hidden
               class. This prevents the blank-page problem.
            */
            app.style.visibility = "hidden";
            app.style.opacity = "0";
        }

        clearTimeout(loadingSafetyTimer);

        /*
           Normal loading time.
        */
        loadingSafetyTimer = setTimeout(() => {
            showApp();
        }, 9000);

        /*
           Emergency fallback.
           Even if something delays initialization, the page
           will not remain blank.
        */
        setTimeout(() => {
            showApp();
        }, 9000);
    }

    /* =========================================================
       TOAST
    ========================================================= */

    function showToast(message, icon = "✓") {
        const toast = $("toast");

        if (!toast) return;

        const messageElement = $("toastMessage");
        const iconElement = $("toastIcon");

        if (messageElement) {
            messageElement.textContent = message;
        }

        if (iconElement) {
            iconElement.textContent = icon;
        }

        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    /* =========================================================
       ACTIVITY
    ========================================================= */

    function addActivity(text, icon = "✓") {
        if (!data.activity) {
            data.activity = [];
        }

        data.activity.unshift({
            id: id("activity"),
            text,
            icon,
            timestamp: new Date().toISOString()
        });

        data.activity = data.activity.slice(0, 50);

        saveData();

        renderActivity();
    }

    function renderActivity() {
        const container = $("recentActivity");

        if (!container) return;

        if (!data.activity.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>📋</span>
                    <p>No activity yet.</p>
                    <small>Your activities will appear here.</small>
                </div>
            `;

            return;
        }

        container.innerHTML = data.activity
            .slice(0, 12)
            .map((item) => {
                return `
                    <div class="activity-item">
                        <span class="activity-icon">
                            ${escapeHTML(item.icon)}
                        </span>

                        <div>
                            <strong>
                                ${escapeHTML(item.text)}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    formatDateTime(item.timestamp)
                                )}
                            </small>
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    /* =========================================================
       NAVIGATION
    ========================================================= */

    function navigate(pageName) {
        if (!pageName) return;

        const target = $(pageName + "Page");

        if (!target) {
            console.warn("Page not found:", pageName);
            return;
        }

        $$(".page").forEach((pageElement) => {
            pageElement.classList.remove("active-page");
            pageElement.style.display = "none";
        });

        target.classList.add("active-page");
        target.style.display = "";

        $$(".nav-item").forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.page === pageName
            );
        });

        currentPage = pageName;

        data.lastPage = pageName;

        saveData();

        closeSidebar();

        /*
           Refresh page-specific information.
        */

        if (pageName === "dashboard") {
            renderDashboard();
        }

        if (pageName === "finance") {
            renderFinance();
        }

        if (pageName === "reminders") {
            renderReminders();
        }

        if (pageName === "notes") {
            renderNotes();
        }

        if (pageName === "tasks") {
            renderTasks();
        }

        if (pageName === "files") {
            renderFiles();
        }

        if (pageName === "media") {
            renderMedia();
        }

        if (pageName === "editor") {
            loadEditor();
        }
    }

    function setupNavigation() {
        $$(".nav-item").forEach((button) => {
            button.addEventListener("click", () => {
                navigate(button.dataset.page);
            });
        });

        $$("[data-page-target]").forEach((button) => {
            button.addEventListener("click", () => {
                navigate(button.dataset.pageTarget);
            });
        });
    }

    /* =========================================================
       MOBILE SIDEBAR
    ========================================================= */

    function openSidebar() {
        $("sidebar")?.classList.add("open");
        $("sidebarOverlay")?.classList.add("active");
    }

    function closeSidebar() {
        $("sidebar")?.classList.remove("open");
        $("sidebarOverlay")?.classList.remove("active");
    }

    function setupMobileMenu() {
        $("menuButton")?.addEventListener(
            "click",
            openSidebar
        );

        $("sidebarOverlay")?.addEventListener(
            "click",
            closeSidebar
        );
    }

    /* =========================================================
       PROFILE
    ========================================================= */

    function applyProfile() {
        const profile = data.profile || {};

        const name = profile.name || "User";

        if ($("brandName")) {
            $("brandName").textContent =
                profile.organization || "ADAPT OS";
        }

        if ($("headerUserName")) {
            $("headerUserName").textContent = name;
        }

        if ($("headerOccupation")) {
            $("headerOccupation").textContent =
                profile.occupation || "Workspace";
        }

        if ($("welcomeName")) {
            $("welcomeName").textContent = name;
        }

        if ($("headerProfileInitial")) {
            $("headerProfileInitial").textContent =
                name.charAt(0).toUpperCase() || "U";
        }

const accent = profile.accent || "#635bff";

if ($("accentColor")) {
    $("accentColor").value = accent;
}

document.documentElement.style.setProperty(
    "--primary",
    accent
);

document.documentElement.style.setProperty(
    "--accent",
    accent
);

document.documentElement.style.setProperty(
    "--primary-color",
    accent
);

document.documentElement.style.setProperty(
    "--accent-color",
    accent
);

        applyTheme();
        applyLogo();
        updateOccupationPreview();
    }

    function loadEditor() {
        if ($("editorName")) {
            $("editorName").value =
                data.profile.name || "";
        }

        if ($("editorOccupation")) {
            $("editorOccupation").value =
                data.profile.occupation || "Student";
        }

        if ($("editorOrganization")) {
            $("editorOrganization").value =
                data.profile.organization || "ADAPT OS";
        }

        if ($("accentColor")) {
            $("accentColor").value =
                data.profile.accent || "#635bff";
        }

        $$(".appearance-option").forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.theme ===
                    data.profile.theme
            );
        });

        updateOccupationPreview();
    }

    function saveProfile() {
        const name =
            $("editorName")?.value.trim() || "User";

        const occupation =
            $("editorOccupation")?.value || "Student";

        const organization =
            $("editorOrganization")?.value.trim() ||
            "ADAPT OS";

        data.profile.name = name;
        data.profile.occupation = occupation;
        data.profile.organization = organization;

        saveData();

        applyProfile();

        addActivity("Profile updated", "👤");

        showToast("Profile saved.");
    }

    /* =========================================================
       THEME
    ========================================================= */

    function applyTheme() {
        const dark = data.profile.theme === "dark";

        document.documentElement.dataset.theme =
            dark ? "dark" : "light";

        document.body.classList.toggle(
            "dark-theme",
            dark
        );

        if ($("themeButton")) {
            $("themeButton").textContent =
                dark ? "☀️" : "🌙";
        }

        if ($("sidebarThemeButton")) {
            $("sidebarThemeButton").innerHTML =
                dark
                    ? "☀️ <span>Toggle Theme</span>"
                    : "🌙 <span>Toggle Theme</span>";
        }

        $$(".appearance-option").forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.theme ===
                    data.profile.theme
            );
        });
    }

    function toggleTheme() {
        data.profile.theme =
            data.profile.theme === "dark"
                ? "light"
                : "dark";

        saveData();
        applyTheme();

        showToast(
            data.profile.theme === "dark"
                ? "Dark theme enabled."
                : "Light theme enabled.",
            data.profile.theme === "dark"
                ? "🌙"
                : "☀️"
        );
    }

    /* =========================================================
       LOGO
    ========================================================= */

    function applyLogo() {
        const logo = data.profile.logoData;

        const text = $("brandLogoText");
        const image = $("brandLogoImage");

        if (logo) {
            text?.classList.add("hidden");
            image?.classList.remove("hidden");

            if (image) {
                image.src = logo;
            }
        } else {
            text?.classList.remove("hidden");
            image?.classList.add("hidden");

            if (image) {
                image.removeAttribute("src");
            }
        }

        const preview = $("logoPreview");

        if (preview) {
            if (logo) {
                preview.innerHTML = `
                    <img
                        src="${escapeHTML(logo)}"
                        alt="Workspace logo"
                    >
                `;
            } else {
                preview.innerHTML = `<span>A</span>`;
            }
        }

        const profileImage =
            $("headerProfileImage");

        if (profileImage) {
            if (logo) {
                profileImage.style.backgroundImage =
                    `url("${logo}")`;
                profileImage.style.backgroundSize =
                    "cover";
                profileImage.style.backgroundPosition =
                    "center";
            } else {
                profileImage.style.backgroundImage = "";
            }
        }
    }

    /* =========================================================
       OCCUPATION
    ========================================================= */

    function updateOccupationPreview() {
        const box = $("occupationPreview");

        if (!box) return;

        const occupation =
            data.profile.occupation || "Student";

        const descriptions = {
            Student:
                "Learning tools and study features will be prioritized.",

            Farmer:
                "Planning, notes, records and practical organization will be prioritized.",

            Business:
                "Finance, tasks, records and business organization will be prioritized.",

            Teacher:
                "Learning, notes, research and teaching resources will be prioritized.",

            Developer:
                "Research, notes, files and productivity tools will be prioritized.",

            Church:
                "Planning, notes, reminders and organization tools will be prioritized.",

            Organization:
                "Tasks, files, reports and organization tools will be prioritized.",

            Freelancer:
                "Tasks, finance, notes and project organization will be prioritized.",

            Researcher:
                "Research, notes, files and learning tools will be prioritized.",

            Other:
                "A balanced set of workspace tools will be prioritized."
        };

        box.innerHTML = `
            <h4>
                ${escapeHTML(occupation)} Workspace
            </h4>

            <p>
                ${escapeHTML(
                    descriptions[occupation] ||
                        descriptions.Other
                )}
            </p>
        `;
    }

    function setupEditor() {
        $("saveProfileButton")?.addEventListener(
            "click",
            saveProfile
        );

        $("themeButton")?.addEventListener(
            "click",
            toggleTheme
        );

        $("sidebarThemeButton")?.addEventListener(
            "click",
            toggleTheme
        );

$("accentColor")?.addEventListener(
    "input",
    (event) => {
        const color = event.target.value;
        
        data.profile.accent = color;
        
        document.documentElement.style.setProperty(
            "--primary",
            color
        );
        
        document.documentElement.style.setProperty(
            "--accent",
            color
        );
        
        document.documentElement.style.setProperty(
            "--primary-color",
            color
        );
        
        document.documentElement.style.setProperty(
            "--accent-color",
            color
        );
        
        saveData();
    }
);

        $$(".appearance-option").forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    () => {
                        data.profile.theme =
                            button.dataset.theme;

                        saveData();
                        applyTheme();
                    }
                );
            }
        );

        $("applyOccupationButton")?.addEventListener(
            "click",
            () => {
                updateOccupationPreview();

                addActivity(
                    "Adaptive workspace applied",
                    "🧩"
                );

                showToast(
                    "Workspace applied."
                );
            }
        );

        $("changeLogoButton")?.addEventListener(
            "click",
            () => $("logoInput")?.click()
        );

        $("logoInput")?.addEventListener(
            "change",
            async (event) => {
                const file =
                    event.target.files?.[0];

                if (!file) return;

                if (!file.type.startsWith("image/")) {
                    showToast(
                        "Please select an image.",
                        "⚠️"
                    );

                    return;
                }

                try {
                    data.profile.logoData =
                        await readFileAsDataURL(file);

                    saveData();
                    applyLogo();

                    addActivity(
                        "Workspace logo changed",
                        "🎨"
                    );

                    showToast(
                        "Logo updated."
                    );
                } catch (error) {
                    console.error(error);

                    showToast(
                        "Could not load the logo.",
                        "⚠️"
                    );
                }

                event.target.value = "";
            }
        );

        $("removeLogoButton")?.addEventListener(
            "click",
            () => {
                data.profile.logoData = "";

                saveData();
                applyLogo();

                addActivity(
                    "Workspace logo removed",
                    "🗑️"
                );

                showToast(
                    "Logo removed."
                );
            }
        );
    }

    /* =========================================================
       FINANCE
    ========================================================= */

    function calculateTotals() {
        const income =
            data.transactions
                .filter(
                    (transaction) =>
                        transaction.type === "income"
                )
                .reduce(
                    (sum, transaction) =>
                        sum +
                        Number(transaction.amount || 0),
                    0
                );

        const expenses =
            data.transactions
                .filter(
                    (transaction) =>
                        transaction.type === "expense"
                )
                .reduce(
                    (sum, transaction) =>
                        sum +
                        Number(transaction.amount || 0),
                    0
                );

        const openingBalance =
            data.accounts.reduce(
                (sum, account) =>
                    sum +
                    Number(account.balance || 0),
                0
            );

        return {
            income,
            expenses,
            balance:
                openingBalance +
                income -
                expenses
        };
    }

    function populateAccountSelect() {
        const select =
            $("transactionAccount");

        if (!select) return;

        select.innerHTML = `
            <option value="">
                Cash / General
            </option>
        `;

        data.accounts.forEach((account) => {
            const option =
                document.createElement("option");

            option.value = account.id;
            option.textContent = account.name;

            select.appendChild(option);
        });
    }

    function setupFinance() {
        $("addTransactionButton")?.addEventListener(
            "click",
            () => {
                openModal("transactionModal");

                if ($("transactionDate")) {
                    $("transactionDate").value =
                        today();
                }

                populateAccountSelect();
            }
        );

        $("addAccountButton")?.addEventListener(
            "click",
            () => {
                openModal("accountModal");
            }
        );

        $$(".transaction-type").forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    () => {
                        $$(".transaction-type")
                            .forEach((item) =>
                                item.classList.remove(
                                    "active"
                                )
                            );

                        button.classList.add(
                            "active"
                        );

                        if ($("transactionType")) {
                            $("transactionType").value =
                                button.dataset.type;
                        }
                    }
                );
            }
        );

        $("transactionForm")?.addEventListener(
            "submit",
            (event) => {
                event.preventDefault();

                const description =
                    $("transactionDescription")
                        ?.value.trim();

                const amount =
                    Number(
                        $("transactionAmount")
                            ?.value
                    );

                const type =
                    $("transactionType")
                        ?.value || "income";

                if (
                    !description ||
                    !amount ||
                    amount <= 0
                ) {
                    showToast(
                        "Enter a valid description and amount.",
                        "⚠️"
                    );

                    return;
                }

                data.transactions.unshift({
                    id: id("transaction"),
                    description,
                    amount,
                    type,
                    category:
                        $("transactionCategory")
                            ?.value || "General",
                    accountId:
                        $("transactionAccount")
                            ?.value || "",
                    date:
                        $("transactionDate")
                            ?.value || today(),
                    createdAt:
                        new Date().toISOString()
                });

                saveData();

                addActivity(
                    `${type === "expense"
                        ? "Expense"
                        : "Income"} added: ${description}`,
                    type === "expense"
                        ? "↘"
                        : "↗"
                );

                $("transactionForm")?.reset();

                if ($("transactionType")) {
                    $("transactionType").value =
                        "income";
                }

                $$(".transaction-type").forEach(
                    (button) => {
                        button.classList.toggle(
                            "active",
                            button.dataset.type ===
                                "income"
                        );
                    }
                );

                closeModal("transactionModal");

                renderFinance();
                renderDashboard();

                showToast(
                    "Transaction saved."
                );
            }
        );

        $("accountForm")?.addEventListener(
            "submit",
            (event) => {
                event.preventDefault();

                const name =
                    $("accountName")
                        ?.value.trim();

                const balance =
                    Number(
                        $("accountBalance")
                            ?.value || 0
                    );

                if (!name) {
                    showToast(
                        "Enter an account name.",
                        "⚠️"
                    );

                    return;
                }

                data.accounts.push({
                    id: id("account"),
                    name,
                    type:
                        $("accountType")
                            ?.value || "Other",
                    balance,
                    createdAt:
                        new Date().toISOString()
                });

                saveData();

                addActivity(
                    `Account added: ${name}`,
                    "🏦"
                );

                $("accountForm")?.reset();

                closeModal("accountModal");

                renderFinance();
                renderDashboard();

                showToast(
                    "Account added."
                );
            }
        );
    }

    function renderFinance() {
        const totals =
            calculateTotals();

        if ($("financeBalance")) {
            $("financeBalance").textContent =
                money(totals.balance);
        }

        if ($("financeIncome")) {
            $("financeIncome").textContent =
                money(totals.income);
        }

        if ($("financeExpenses")) {
            $("financeExpenses").textContent =
                money(totals.expenses);
        }

        if ($("transactionCount")) {
            $("transactionCount").textContent =
                data.transactions.length;
        }

        const accounts =
            $("accountsGrid");

        if (accounts) {
            if (!data.accounts.length) {
                accounts.innerHTML = `
                    <div class="empty-state">
                        <span>🏦</span>
                        <p>No accounts added yet.</p>
                    </div>
                `;
            } else {
                accounts.innerHTML =
                    data.accounts
                        .map(
                            (account) => `
                        <div class="account-card">

                            <div>
                                <span>🏦</span>

                                <h4>
                                    ${escapeHTML(
                                        account.name
                                    )}
                                </h4>

                                <small>
                                    ${escapeHTML(
                                        account.type
                                    )}
                                </small>
                            </div>

                            <strong>
                                ${money(
                                    account.balance
                                )}
                            </strong>

                            <button
                                class="danger-button"
                                data-account-delete="${escapeHTML(
                                    account.id
                                )}">
                                Delete
                            </button>

                        </div>
                    `
                        )
                        .join("");

                $$(
                    "[data-account-delete]",
                    accounts
                ).forEach((button) => {
                    button.addEventListener(
                        "click",
                        () => {
                            confirmAction(
                                "Delete Account?",
                                "Delete this account?",
                                () => {
                                    const accountId =
                                        button.dataset
                                            .accountDelete;

                                    data.accounts =
                                        data.accounts.filter(
                                            (account) =>
                                                account.id !==
                                                accountId
                                        );

                                    saveData();

                                    renderFinance();
                                    renderDashboard();

                                    showToast(
                                        "Account deleted."
                                    );
                                }
                            );
                        }
                    );
                });
            }
        }

        const tableBody =
            $("transactionTableBody");

        if (!tableBody) return;

        if (!data.transactions.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <span>💳</span>
                            <p>No transactions yet.</p>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }

        tableBody.innerHTML =
            data.transactions
                .slice(0, 100)
                .map(
                    (transaction) => `
                    <tr>

                        <td>
                            ${escapeHTML(
                                transaction.description
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                transaction.type
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                transaction.category
                            )}
                        </td>

                        <td>
                            ${money(
                                transaction.amount
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                formatDate(
                                    transaction.date
                                )
                            )}
                        </td>

                        <td>
                            <button
                                class="danger-button"
                                data-transaction-delete="${escapeHTML(
                                    transaction.id
                                )}">
                                Delete
                            </button>
                        </td>

                    </tr>
                `
                )
                .join("");

        $$(
            "[data-transaction-delete]",
            tableBody
        ).forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    confirmAction(
                        "Delete Transaction?",
                        "Remove this transaction?",
                        () => {
                            const transactionId =
                                button.dataset
                                    .transactionDelete;

                            data.transactions =
                                data.transactions.filter(
                                    (transaction) =>
                                        transaction.id !==
                                        transactionId
                                );

                            saveData();

                            renderFinance();
                            renderDashboard();

                            showToast(
                                "Transaction deleted."
                            );
                        }
                    );
                }
            );
        });

        populateAccountSelect();
    }

    /* =========================================================
       DASHBOARD
    ========================================================= */

    async function renderDashboard() {
        const totals =
            calculateTotals();

        if ($("dashboardBalance")) {
            $("dashboardBalance").textContent =
                money(totals.balance);
        }

        if ($("dashboardIncome")) {
            $("dashboardIncome").textContent =
                money(totals.income);
        }

        if ($("dashboardExpenses")) {
            $("dashboardExpenses").textContent =
                money(totals.expenses);
        }

        if ($("balanceChange")) {
            $("balanceChange").textContent =
                data.transactions.length
                    ? `${data.transactions.length} transaction${
                          data.transactions.length === 1
                              ? ""
                              : "s"
                      } recorded`
                    : "No transactions yet";
        }

        if ($("dashboardIncomeBar")) {
            $("dashboardIncomeBar").textContent =
                money(totals.income);
        }

        if ($("dashboardExpenseBar")) {
            $("dashboardExpenseBar").textContent =
                money(totals.expenses);
        }

        const maximum =
            Math.max(
                totals.income,
                totals.expenses,
                1
            );

        if ($("incomeBar")) {
            $("incomeBar").style.width =
                `${(totals.income / maximum) * 100}%`;
        }

        if ($("expenseBar")) {
            $("expenseBar").style.width =
                `${(totals.expenses / maximum) * 100}%`;
        }

        renderActivity();
        renderDashboardReminders();

        try {
            const files = await getAllFiles();

            if ($("dashboardFileCount")) {
                $("dashboardFileCount").textContent =
                    files.length;
            }
        } catch (error) {
            console.warn(
                "Could not count files:",
                error
            );

            if ($("dashboardFileCount")) {
                $("dashboardFileCount").textContent =
                    "0";
            }
        }
    }

    function renderDashboardReminders() {
        const container =
            $("dashboardReminders");

        if (!container) return;

        const currentDate = today();

        const reminders =
            data.reminders
                .filter(
                    (reminder) =>
                        !reminder.completed &&
                        reminder.date >= currentDate
                )
                .sort((a, b) => {
                    const first =
                        `${a.date}T${a.time || "23:59"}`;

                    const second =
                        `${b.date}T${b.time || "23:59"}`;

                    return first.localeCompare(second);
                })
                .slice(0, 4);

        if (!reminders.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>⏰</span>
                    <p>No upcoming reminders.</p>
                </div>
            `;

            return;
        }

        container.innerHTML =
            reminders
                .map(
                    (reminder) => `
                    <div class="reminder-preview-item">

                        <div>

                            <strong>
                                ${escapeHTML(
                                    reminder.title
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    formatDate(
                                        reminder.date
                                    )
                                )}

                                ${
                                    reminder.time
                                        ? " • " +
                                          escapeHTML(
                                              reminder.time
                                          )
                                        : ""
                                }
                            </small>

                        </div>

                        <span>⏰</span>

                    </div>
                `
                )
                .join("");
    }

    /* =========================================================
       REMINDERS
    ========================================================= */

    function setupReminders() {
        $("addReminderButton")?.addEventListener(
            "click",
            () => {
                openModal("reminderModal");

                if ($("reminderDate")) {
                    $("reminderDate").value =
                        today();
                }
            }
        );

        $("reminderForm")?.addEventListener(
            "submit",
            (event) => {
                event.preventDefault();

                const title =
                    $("reminderTitle")
                        ?.value.trim();

                const date =
                    $("reminderDate")?.value;

                const time =
                    $("reminderTime")?.value || "";

                const repeat =
                    $("reminderRepeat")
                        ?.value || "none";

                if (!title || !date) {
                    showToast(
                        "Enter a reminder and date.",
                        "⚠️"
                    );

                    return;
                }

                data.reminders.push({
                    id: id("reminder"),
                    title,
                    date,
                    time,
                    repeat,
                    completed: false,
                    lastNotified: "",
                    createdAt:
                        new Date().toISOString()
                });

                saveData();

                addActivity(
                    `Reminder created: ${title}`,
                    "⏰"
                );

                $("reminderForm")?.reset();

                closeModal("reminderModal");

                renderReminders();
                renderDashboardReminders();

                showToast(
                    "Reminder created.",
                    "⏰"
                );

                checkReminders();
            }
        );

        $("reminderList")?.addEventListener(
            "click",
            (event) => {
                const completeButton =
                    event.target.closest(
                        "[data-reminder-complete]"
                    );

                const deleteButton =
                    event.target.closest(
                        "[data-reminder-delete]"
                    );

                if (completeButton) {
                    toggleReminder(
                        completeButton.dataset
                            .reminderComplete
                    );
                }

                if (deleteButton) {
                    deleteReminder(
                        deleteButton.dataset
                            .reminderDelete
                    );
                }
            }
        );
    }

    function renderReminders() {
        const container =
            $("reminderList");

        if (!container) return;

        const reminders =
            [...data.reminders].sort(
                (a, b) => {
                    const first =
                        `${a.date}T${a.time || "23:59"}`;

                    const second =
                        `${b.date}T${b.time || "23:59"}`;

                    return first.localeCompare(second);
                }
            );

        if (!reminders.length) {
            container.innerHTML = `
                <div class="empty-state large-empty">
                    <span>⏰</span>
                    <h3>No reminders</h3>
                    <p>
                        Create a reminder to stay organized.
                    </p>
                </div>
            `;

            return;
        }

        container.innerHTML =
            reminders
                .map(
                    (reminder) => `
                    <div class="reminder-card ${
                        reminder.completed
                            ? "completed"
                            : ""
                    }">

                        <div class="reminder-card-icon">
                            ⏰
                        </div>

                        <div class="reminder-card-content">

                            <h3>
                                ${escapeHTML(
                                    reminder.title
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    formatDate(
                                        reminder.date
                                    )
                                )}

                                ${
                                    reminder.time
                                        ? " • " +
                                          escapeHTML(
                                              reminder.time
                                          )
                                        : ""
                                }
                            </p>

                            <small>
                                ${
                                    reminder.repeat ===
                                    "none"
                                        ? "One time"
                                        : "Repeats " +
                                          escapeHTML(
                                              reminder.repeat
                                          )
                                }
                            </small>

                        </div>

                        <div class="reminder-card-actions">

                            <button
                                class="secondary-button"
                                data-reminder-complete="${escapeHTML(
                                    reminder.id
                                )}">
                                ${
                                    reminder.completed
                                        ? "Undo"
                                        : "Complete"
                                }
                            </button>

                            <button
                                class="danger-button"
                                data-reminder-delete="${escapeHTML(
                                    reminder.id
                                )}">
                                Delete
                            </button>

                        </div>

                    </div>
                `
                )
                .join("");
    }

    function toggleReminder(reminderId) {
        const reminder =
            data.reminders.find(
                (item) =>
                    item.id === reminderId
            );

        if (!reminder) return;

        reminder.completed =
            !reminder.completed;

        saveData();

        renderReminders();
        renderDashboardReminders();

        addActivity(
            `${
                reminder.completed
                    ? "Completed"
                    : "Reopened"
            } reminder: ${reminder.title}`,
            reminder.completed ? "✓" : "⏰"
        );

        showToast(
            reminder.completed
                ? "Reminder completed."
                : "Reminder reopened."
        );
    }

    function deleteReminder(reminderId) {
        const reminder =
            data.reminders.find(
                (item) =>
                    item.id === reminderId
            );

        if (!reminder) return;

        confirmAction(
            "Delete Reminder?",
            `Delete "${reminder.title}"?`,
            () => {
                data.reminders =
                    data.reminders.filter(
                        (item) =>
                            item.id !== reminderId
                    );

                saveData();

                renderReminders();
                renderDashboardReminders();

                showToast(
                    "Reminder deleted."
                );
            }
        );
    }

    /* =========================================================
       REMINDER TIME ENGINE
    ========================================================= */

    function checkReminders() {
        if (!data || !Array.isArray(data.reminders)) {
            return;
        }

        const now = new Date();

        const currentDay = today();

        let changed = false;

        data.reminders.forEach(
            (reminder) => {
                if (reminder.completed) {
                    return;
                }

                if (reminder.date !== currentDay) {
                    return;
                }

                /*
                   If a time was specified,
                   wait until that time.
                */

                if (reminder.time) {
                    const due =
                        new Date(
                            `${reminder.date}T${reminder.time}:00`
                        );

                    if (
                        Number.isNaN(
                            due.getTime()
                        )
                    ) {
                        return;
                    }

                    if (now < due) {
                        return;
                    }
                }

                /*
                   Prevent the same reminder from
                   notifying repeatedly.
                */

                const occurrence =
                    `${reminder.date}|${
                        reminder.time || ""
                    }`;

                if (
                    reminder.lastNotified ===
                    occurrence
                ) {
                    return;
                }

                reminder.lastNotified =
                    occurrence;

                changed = true;

                createNotification(
                    `Reminder: ${reminder.title}`,
                    reminder.time
                        ? `Your reminder is due at ${reminder.time}.`
                        : "Your reminder is due."
                );

                sendBrowserNotification(
                    `ADAPT OS • ${reminder.title}`,
                    reminder.time
                        ? `Your reminder is due at ${reminder.time}.`
                        : "Your reminder is due."
                );

                showToast(
                    `Reminder: ${reminder.title}`,
                    "⏰"
                );

                /*
                   Repeating reminders move to
                   their next occurrence.
                */

                if (
                    reminder.repeat !== "none"
                ) {
                    moveToNextOccurrence(
                        reminder
                    );
                } else {
                    reminder.completed =
                        true;
                }
            }
        );

        if (changed) {
            saveData();

            renderReminders();
            renderDashboardReminders();
            updateNotifications();
        }
    }

    function moveToNextOccurrence(reminder) {
        /*
           Use noon instead of midnight to reduce
           daylight-saving edge cases.
        */

        const date = new Date(
            `${reminder.date}T12:00:00`
        );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return;
        }

        if (
            reminder.repeat === "daily"
        ) {
            date.setDate(
                date.getDate() + 1
            );
        }

        if (
            reminder.repeat === "weekly"
        ) {
            date.setDate(
                date.getDate() + 7
            );
        }

        if (
            reminder.repeat === "monthly"
        ) {
            date.setMonth(
                date.getMonth() + 1
            );
        }

        const local =
            new Date(
                date.getTime() -
                    date.getTimezoneOffset() *
                        60000
            );

        reminder.date =
            local.toISOString().slice(0, 10);

        reminder.lastNotified = "";
    }

    /* =========================================================
       NOTIFICATIONS
    ========================================================= */

    function createNotification(
        title,
        message
    ) {
        data.notifications.unshift({
            id: id("notification"),
            title,
            message,
            read: false,
            timestamp:
                new Date().toISOString()
        });

        data.notifications =
            data.notifications.slice(0, 100);

        saveData();

        updateNotifications();
    }

    function updateNotifications() {
        const unread =
            data.notifications.filter(
                (notification) =>
                    !notification.read
            ).length;

        if ($("notificationCount")) {
            $("notificationCount").textContent =
                unread;

            $("notificationCount").classList.toggle(
                "hidden",
                unread === 0
            );
        }

        const list =
            $("notificationList");

        if (!list) return;

        if (!data.notifications.length) {
            list.innerHTML = `
                <div class="empty-state">
                    <span>🔔</span>
                    <p>No notifications.</p>
                </div>
            `;

            return;
        }

        list.innerHTML =
            data.notifications
                .slice(0, 30)
                .map(
                    (notification) => `
                    <div class="notification-item ${
                        notification.read
                            ? "read"
                            : "unread"
                    }">

                        <span>🔔</span>

                        <div>

                            <strong>
                                ${escapeHTML(
                                    notification.title
                                )}
                            </strong>

                            <p>
                                ${escapeHTML(
                                    notification.message
                                )}
                            </p>

                            <small>
                                ${escapeHTML(
                                    formatDateTime(
                                        notification.timestamp
                                    )
                                )}
                            </small>

                        </div>

                    </div>
                `
                )
                .join("");
    }

    function sendBrowserNotification(
        title,
        message
    ) {
        if (
            !("Notification" in window)
        ) {
            return;
        }

        if (
            Notification.permission !==
            "granted"
        ) {
            return;
        }

        try {
            new Notification(
                title,
                {
                    body: message,
                    icon: data.profile.logoData || undefined
                }
            );
        } catch (error) {
            console.warn(
                "Browser notification failed:",
                error
            );
        }
    }

    function setupNotifications() {
        $("notificationButton")?.addEventListener(
            "click",
            (event) => {
                event.stopPropagation();

                const panel =
                    $("notificationPanel");

                if (!panel) return;

                panel.classList.toggle(
                    "hidden"
                );

                updateNotifications();
            }
        );

        $("markNotificationsRead")?.addEventListener(
            "click",
            () => {
                data.notifications.forEach(
                    (notification) => {
                        notification.read =
                            true;
                    }
                );

                saveData();

                updateNotifications();

                showToast(
                    "Notifications marked as read."
                );
            }
        );

        $("enableNotificationsButton")
            ?.addEventListener(
                "click",
                async () => {
                    if (
                        !(
                            "Notification" in
                            window
                        )
                    ) {
                        showToast(
                            "This browser does not support notifications.",
                            "⚠️"
                        );

                        return;
                    }

                    try {
                        const permission =
                            await Notification.requestPermission();

                        data.settings.notificationsEnabled =
                            permission ===
                            "granted";

                        saveData();

                        if (
                            permission ===
                            "granted"
                        ) {
                            showToast(
                                "Browser notifications enabled.",
                                "🔔"
                            );
                        } else {
                            showToast(
                                "Notification permission was not granted.",
                                "⚠️"
                            );
                        }
                    } catch (error) {
                        console.error(error);

                        showToast(
                            "Could not enable notifications.",
                            "⚠️"
                        );
                    }
                }
            );

        document.addEventListener(
            "click",
            (event) => {
                const panel =
                    $("notificationPanel");

                const button =
                    $("notificationButton");

                if (
                    panel &&
                    !panel.classList.contains(
                        "hidden"
                    ) &&
                    !panel.contains(
                        event.target
                    ) &&
                    !button?.contains(
                        event.target
                    )
                ) {
                    panel.classList.add(
                        "hidden"
                    );
                }
            }
        );
    }

    /* =========================================================
       LEARNING
    ========================================================= */

    const subjects = {
        Mathematics: [
            "📐",
            "Numbers & Operations",
            "Algebra",
            "Geometry",
            "Statistics"
        ],

        English: [
            "📖",
            "Grammar",
            "Comprehension",
            "Writing",
            "Literature"
        ],

        Science: [
            "🔬",
            "Biology",
            "Chemistry",
            "Physics",
            "Environment"
        ],

        "Social Studies": [
            "🌍",
            "Citizenship",
            "Geography",
            "Culture",
            "Development"
        ],

        Business: [
            "💼",
            "Entrepreneurship",
            "Marketing",
            "Management",
            "Finance"
        ],

        Accounting: [
            "📊",
            "Accounting Equation",
            "Double Entry",
            "Final Accounts",
            "Cash Book"
        ],

        Economics: [
            "📈",
            "Basic Concepts",
            "Demand & Supply",
            "Inflation",
            "National Economy"
        ],

        ICT: [
            "💻",
            "Computer Basics",
            "Web Development",
            "Data",
            "Digital Safety"
        ]
    };

    function setupLearning() {
        $$(".subject-card").forEach(
            (card) => {
                card.addEventListener(
                    "click",
                    () => {
                        openSubject(
                            card.dataset.subject
                        );
                    }
                );
            }
        );

        $("backToSubjects")
            ?.addEventListener(
                "click",
                () => {
                    $("learningContent")
                        ?.classList.add(
                            "hidden"
                        );

                    $("subjectsGrid")
                        ?.classList.remove(
                            "hidden"
                        );
                }
            );

        $("subjectSearch")
            ?.addEventListener(
                "input",
                (event) => {
                    const query =
                        event.target.value
                            .toLowerCase()
                            .trim();

                    $$(".subject-card").forEach(
                        (card) => {
                            card.style.display =
                                card.textContent
                                    .toLowerCase()
                                    .includes(
                                        query
                                    )
                                    ? ""
                                    : "none";
                        }
                    );
                }
            );
    }

    function openSubject(subjectName) {
        const subject =
            subjects[subjectName];

        const content =
            $("selectedSubjectContent");

        if (!subject || !content) {
            return;
        }

        content.innerHTML = `
            <div class="selected-subject-header">

                <span>
                    ${subject[0]}
                </span>

                <div>

                    <span class="page-label">
                        SUBJECT
                    </span>

                    <h2>
                        ${escapeHTML(
                            subjectName
                        )}
                    </h2>

                    <p>
                        Choose a topic to begin learning.
                    </p>

                </div>

            </div>

            <div class="topic-grid">

                ${subject
                    .slice(1)
                    .map(
                        (topic) => `
                        <article class="topic-card">

                            <span>📘</span>

                            <h3>
                                ${escapeHTML(
                                    topic
                                )}
                            </h3>

                            <p>
                                Study the main ideas and
                                practical concepts in
                                ${escapeHTML(
                                    topic
                                )}.
                            </p>

                            <button
                                class="secondary-button"
                                data-study-topic="${escapeHTML(
                                    topic
                                )}">
                                Study Topic
                            </button>

                        </article>
                    `
                    )
                    .join("")}

            </div>
        `;

        $("subjectsGrid")
            ?.classList.add("hidden");

        $("learningContent")
            ?.classList.remove("hidden");

        $$(
            "[data-study-topic]",
            content
        ).forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    addActivity(
                        `Started ${subjectName}: ${button.dataset.studyTopic}`,
                        "📚"
                    );

                    showToast(
                        `Study started: ${button.dataset.studyTopic}`,
                        "📚"
                    );
                }
            );
        });
    }

    /* =========================================================
       RESEARCH
    ========================================================= */

    function setupResearch() {
        $("researchButton")
            ?.addEventListener(
                "click",
                performResearch
            );

        $("researchInput")
            ?.addEventListener(
                "keydown",
                (event) => {
                    if (
                        event.key ===
                        "Enter"
                    ) {
                        performResearch();
                    }
                }
            );

        $$(".research-suggestion").forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    () => {
                        if (
                            $("researchInput")
                        ) {
                            $("researchInput").value =
                                button.textContent.trim();

                            performResearch();
                        }
                    }
                );
            }
        );
    }

    async function performResearch() {
        const input =
            $("researchInput");

        const output =
            $("researchResults");

        if (!input || !output) {
            return;
        }

        const query =
            input.value.trim();

        if (!query) {
            showToast(
                "Enter something to research.",
                "🔎"
            );

            return;
        }

        output.innerHTML = `
            <div class="research-welcome">

                <span>⏳</span>

                <h3>
                    Researching...
                </h3>

                <p>
                    Please wait.
                </p>

            </div>
        `;

        addActivity(
            `Research search: ${query}`,
            "🔎"
        );

        const localAnswers = {
            photosynthesis: [
                "Photosynthesis",
                "Photosynthesis is the process by which green plants use light energy to make food from carbon dioxide and water, releasing oxygen."
            ],

            inflation: [
                "Inflation",
                "Inflation is a sustained rise in the general level of prices of goods and services over time."
            ],

            accounting: [
                "Accounting",
                "Accounting is the systematic recording, classification, summarizing and interpretation of financial transactions."
            ],

            javascript: [
                "JavaScript",
                "JavaScript is a programming language commonly used to make websites and applications interactive."
            ]
        };

        const matchingKey =
            Object.keys(
                localAnswers
            ).find((key) =>
                query
                    .toLowerCase()
                    .includes(key)
            );

        if (matchingKey) {
            displayResearchResult(
                localAnswers[matchingKey][0],
                localAnswers[matchingKey][1],
                query
            );

            return;
        }

        try {
            const response =
                await fetch(
                    "https://en.wikipedia.org/api/rest_v1/page/summary/" +
                        encodeURIComponent(
                            query.replace(
                                /\s+/g,
                                "_"
                            )
                        )
                );

            if (!response.ok) {
                throw new Error(
                    "Research request failed"
                );
            }

            const result =
                await response.json();

            if (!result.extract) {
                throw new Error(
                    "No result"
                );
            }

            displayResearchResult(
                result.title || query,
                result.extract,
                query
            );
        } catch (error) {
            console.warn(
                "Research request failed:",
                error
            );

            output.innerHTML = `
                <div class="research-result-card">

                    <span>🔎</span>

                    <h3>
                        ${escapeHTML(
                            query
                        )}
                    </h3>

                    <p>
                        No online result could be
                        retrieved. Check your connection
                        or try another search.
                    </p>

                </div>
            `;
        }
    }

    function displayResearchResult(
        title,
        text,
        query
    ) {
        const output =
            $("researchResults");

        if (!output) return;

        output.innerHTML = `
            <article class="research-result-card">

                <span>🔎</span>

                <h3>
                    ${escapeHTML(title)}
                </h3>

                <p>
                    ${escapeHTML(text)}
                </p>

                <small>
                    Search:
                    ${escapeHTML(query)}
                </small>

            </article>
        `;
    }

    /* =========================================================
       INDEXED DB
    ========================================================= */

    let databasePromise = null;

    function openDatabase() {
        if (databasePromise) {
            return databasePromise;
        }

        databasePromise =
            new Promise(
                (resolve, reject) => {
                    if (
                        !("indexedDB" in window)
                    ) {
                        reject(
                            new Error(
                                "IndexedDB unavailable"
                            )
                        );

                        return;
                    }

                    const request =
                        indexedDB.open(
                            DB_NAME,
                            1
                        );

                    request.onupgradeneeded =
                        () => {
                            const db =
                                request.result;

                            if (
                                !db.objectStoreNames.contains(
                                    DB_STORE
                                )
                            ) {
                                db.createObjectStore(
                                    DB_STORE,
                                    {
                                        keyPath:
                                            "id"
                                    }
                                );
                            }
                        };

                    request.onsuccess = () => {
                        resolve(
                            request.result
                        );
                    };

                    request.onerror = () => {
                        reject(
                            request.error
                        );
                    };
                }
            );

        return databasePromise;
    }

    async function putFile(fileData) {
        const db =
            await openDatabase();

        return new Promise(
            (resolve, reject) => {
                const transaction =
                    db.transaction(
                        DB_STORE,
                        "readwrite"
                    );

                const store =
                    transaction.objectStore(
                        DB_STORE
                    );

                store.put(fileData);

                transaction.oncomplete =
                    () => resolve();

                transaction.onerror =
                    () =>
                        reject(
                            transaction.error
                        );
            }
        );
    }

    async function getAllFiles() {
        const db =
            await openDatabase();

        return new Promise(
            (resolve, reject) => {
                const transaction =
                    db.transaction(
                        DB_STORE,
                        "readonly"
                    );

                const store =
                    transaction.objectStore(
                        DB_STORE
                    );

                const request =
                    store.getAll();

                request.onsuccess =
                    () =>
                        resolve(
                            request.result
                        );

                request.onerror =
                    () =>
                        reject(
                            request.error
                        );
            }
        );
    }

    async function deleteFile(fileId) {
        const db =
            await openDatabase();

        return new Promise(
            (resolve, reject) => {
                const transaction =
                    db.transaction(
                        DB_STORE,
                        "readwrite"
                    );

                transaction
                    .objectStore(
                        DB_STORE
                    )
                    .delete(fileId);

                transaction.oncomplete =
                    () => resolve();

                transaction.onerror =
                    () =>
                        reject(
                            transaction.error
                        );
            }
        );
    }

    async function clearFiles() {
        const db =
            await openDatabase();

        return new Promise(
            (resolve, reject) => {
                const transaction =
                    db.transaction(
                        DB_STORE,
                        "readwrite"
                    );

                transaction
                    .objectStore(
                        DB_STORE
                    )
                    .clear();

                transaction.oncomplete =
                    () => resolve();

                transaction.onerror =
                    () =>
                        reject(
                            transaction.error
                        );
            }
        );
    }

    function getFileKind(type) {
        if (
            type &&
            type.startsWith("image/")
        ) {
            return "image";
        }

        if (
            type &&
            type.startsWith("video/")
        ) {
            return "video";
        }

        if (
            type &&
            type.startsWith("audio/")
        ) {
            return "audio";
        }

        return "document";
    }

    /* =========================================================
       FILE VAULT
    ========================================================= */

    function setupFiles() {
        $("uploadFileButton")
            ?.addEventListener(
                "click",
                () =>
                    $("fileInput")?.click()
            );

        $("fileInput")
            ?.addEventListener(
                "change",
                async (event) => {
                    await saveUploadedFiles(
                        event.target.files
                    );

                    event.target.value = "";
                }
            );

        const dropZone =
            $("fileDropZone");

        dropZone?.addEventListener(
            "click",
            () =>
                $("fileInput")?.click()
        );

        dropZone?.addEventListener(
            "dragover",
            (event) => {
                event.preventDefault();

                dropZone.classList.add(
                    "drag-over"
                );
            }
        );

        dropZone?.addEventListener(
            "dragleave",
            () => {
                dropZone.classList.remove(
                    "drag-over"
                );
            }
        );

        dropZone?.addEventListener(
            "drop",
            async (event) => {
                event.preventDefault();

                dropZone.classList.remove(
                    "drag-over"
                );

                await saveUploadedFiles(
                    event.dataTransfer.files
                );
            }
        );

        $("fileSearch")
            ?.addEventListener(
                "input",
                renderFiles
            );

        $("fileFilter")
            ?.addEventListener(
                "change",
                renderFiles
            );

        $("fileGrid")
            ?.addEventListener(
                "click",
                (event) => {
                    const preview =
                        event.target.closest(
                            "[data-file-preview]"
                        );

                    const deleteButton =
                        event.target.closest(
                            "[data-file-delete]"
                        );

                    if (preview) {
                        previewFile(
                            preview.dataset
                                .filePreview
                        );
                    }

                    if (deleteButton) {
                        confirmAction(
                            "Delete File?",
                            "Remove this file?",
                            async () => {
                                try {
                                    await deleteFile(
                                        deleteButton
                                            .dataset
                                            .fileDelete
                                    );

                                    await renderFiles();
                                    await renderDashboard();

                                    showToast(
                                        "File deleted."
                                    );
                                } catch (error) {
                                    console.error(
                                        error
                                    );

                                    showToast(
                                        "Could not delete file.",
                                        "⚠️"
                                    );
                                }
                            }
                        );
                    }
                }
            );
    }

    async function saveUploadedFiles(
        fileList
    ) {
        if (!fileList || !fileList.length) {
            return;
        }

        try {
            for (
                const file of Array.from(
                    fileList
                )
            ) {
                await putFile({
                    id: id("file"),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    kind: getFileKind(
                        file.type
                    ),
                    createdAt:
                        new Date().toISOString(),
                    blob: file
                });

                addActivity(
                    `File uploaded: ${file.name}`,
                    "📁"
                );
            }

            await renderFiles();
            await renderDashboard();

            showToast(
                `${fileList.length} file${
                    fileList.length === 1
                        ? ""
                        : "s"
                } uploaded.`,
                "📁"
            );
        } catch (error) {
            console.error(
                "File upload error:",
                error
            );

            showToast(
                "Could not save the file.",
                "⚠️"
            );
        }
    }

    async function renderFiles() {
        const grid =
            $("fileGrid");

        if (!grid) return;

        try {
            const files =
                await getAllFiles();

            const query =
                (
                    $("fileSearch")
                        ?.value || ""
                )
                    .toLowerCase()
                    .trim();

            const filter =
                $("fileFilter")
                    ?.value || "all";

            const filtered =
                files.filter(
                    (file) =>
                        file.name
                            .toLowerCase()
                            .includes(query) &&
                        (
                            filter ===
                                "all" ||
                            file.kind ===
                                filter
                        )
                );

            if (!filtered.length) {
                grid.innerHTML = `
                    <div class="empty-state large-empty">

                        <span>📂</span>

                        <h3>
                            ${
                                files.length
                                    ? "No matching files"
                                    : "Your vault is empty"
                            }
                        </h3>

                        <p>
                            ${
                                files.length
                                    ? "Try another search or filter."
                                    : "Upload your first file to get started."
                            }
                        </p>

                    </div>
                `;

                return;
            }

            grid.innerHTML =
                filtered
                    .map(
                        (file) => `
                        <div class="file-card">

                            <div class="file-card-icon">
                                ${
                                    file.kind ===
                                    "image"
                                        ? "🖼️"
                                        : file.kind ===
                                          "video"
                                        ? "🎬"
                                        : file.kind ===
                                          "audio"
                                        ? "🎵"
                                        : "📄"
                                }
                            </div>

                            <h3>
                                ${escapeHTML(
                                    file.name
                                )}
                            </h3>

                            <p>
                                ${formatBytes(
                                    file.size
                                )}
                            </p>

                            <small>
                                ${escapeHTML(
                                    formatDate(
                                        file.createdAt
                                    )
                                )}
                            </small>

                            <div class="file-card-actions">

                                <button
                                    class="secondary-button"
                                    data-file-preview="${escapeHTML(
                                        file.id
                                    )}">
                                    Preview
                                </button>

                                <button
                                    class="danger-button"
                                    data-file-delete="${escapeHTML(
                                        file.id
                                    )}">
                                    Delete
                                </button>

                            </div>

                        </div>
                    `
                    )
                    .join("");
        } catch (error) {
            console.error(
                "File rendering error:",
                error
            );

            grid.innerHTML = `
                <div class="empty-state">

                    <span>⚠️</span>

                    <p>
                        File storage is unavailable.
                    </p>

                </div>
            `;
        }
    }

    async function previewFile(fileId) {
        try {
            const files =
                await getAllFiles();

            const file =
                files.find(
                    (item) =>
                        item.id === fileId
                );

            if (!file) return;

            const content =
                $("filePreviewContent");

            if (!content) return;

            const url =
                URL.createObjectURL(
                    file.blob
                );

            if ($("previewFileName")) {
                $("previewFileName").textContent =
                    file.name;
            }

            if (
                file.kind === "image"
            ) {
                content.innerHTML = `
                    <img
                        src="${url}"
                        alt="${escapeHTML(
                            file.name
                        )}"
                        style="max-width:100%;height:auto;"
                    >
                `;
            } else if (
                file.kind === "video"
            ) {
                content.innerHTML = `
                    <video
                        controls
                        style="max-width:100%;width:100%;">
                        <source
                            src="${url}"
                            type="${escapeHTML(
                                file.type
                            )}">
                    </video>
                `;
            } else if (
                file.kind === "audio"
            ) {
                content.innerHTML = `
                    <audio
                        controls
                        style="width:100%;">
                        <source
                            src="${url}"
                            type="${escapeHTML(
                                file.type
                            )}">
                    </audio>
                `;
            } else if (
                file.type ===
                    "application/pdf" ||
                file.name
                    .toLowerCase()
                    .endsWith(".pdf")
            ) {
                content.innerHTML = `
                    <iframe
                        src="${url}"
                        style="
                            width:100%;
                            height:60vh;
                            border:0;
                        ">
                    </iframe>
                `;
            } else if (
                file.type.startsWith(
                    "text/"
                ) ||
                /\.(txt|csv)$/i.test(
                    file.name
                )
            ) {
                const text =
                    await file.blob.text();

                content.innerHTML = `
                    <pre
                        style="
                            white-space:pre-wrap;
                            max-height:60vh;
                            overflow:auto;
                        ">
${escapeHTML(text)}
                    </pre>
                `;
            } else {
                content.innerHTML = `
                    <div class="empty-state">

                        <span>📄</span>

                        <p>
                            This file cannot be
                            previewed here.
                        </p>

                        <a
                            class="primary-button"
                            href="${url}"
                            download="${escapeHTML(
                                file.name
                            )}">
                            Download File
                        </a>

                    </div>
                `;
            }

            openModal(
                "filePreviewModal"
            );
        } catch (error) {
            console.error(error);

            showToast(
                "Could not preview the file.",
                "⚠️"
            );
        }
    }

    /* =========================================================
       MEDIA
    ========================================================= */

    function setupMedia() {
        $("uploadMediaButton")
            ?.addEventListener(
                "click",
                () =>
                    $("mediaInput")?.click()
            );

        $("mediaInput")
            ?.addEventListener(
                "change",
                async (event) => {
                    try {
                        const files =
                            Array.from(
                                event.target.files ||
                                    []
                            );

                        for (
                            const file of files
                        ) {
                            if (
                                !file.type.startsWith(
                                    "image/"
                                ) &&
                                !file.type.startsWith(
                                    "video/"
                                )
                            ) {
                                continue;
                            }

                            await putFile({
                                id: id("media"),
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                kind: getFileKind(
                                    file.type
                                ),
                                media: true,
                                createdAt:
                                    new Date().toISOString(),
                                blob: file
                            });
                        }

                        await renderMedia();
                        await renderDashboard();

                        showToast(
                            "Media uploaded.",
                            "🖼️"
                        );
                    } catch (error) {
                        console.error(
                            error
                        );

                        showToast(
                            "Could not save media.",
                            "⚠️"
                        );
                    }

                    event.target.value = "";
                }
            );

        $("mediaGallery")
            ?.addEventListener(
                "click",
                (event) => {
                    const button =
                        event.target.closest(
                            "[data-media-delete]"
                        );

                    if (!button) return;

                    confirmAction(
                        "Delete Media?",
                        "Remove this media item?",
                        async () => {
                            try {
                                await deleteFile(
                                    button.dataset
                                        .mediaDelete
                                );

                                await renderMedia();
                                await renderDashboard();

                                showToast(
                                    "Media deleted."
                                );
                            } catch (error) {
                                console.error(
                                    error
                                );

                                showToast(
                                    "Could not delete media.",
                                    "⚠️"
                                );
                            }
                        }
                    );
                }
            );
    }

    async function renderMedia() {
        const gallery =
            $("mediaGallery");

        if (!gallery) return;

        try {
            const media =
                (
                    await getAllFiles()
                ).filter(
                    (file) => file.media
                );

            if (!media.length) {
                gallery.innerHTML = `
                    <div class="empty-state large-empty">

                        <span>🖼️</span>

                        <h3>
                            Your gallery is empty
                        </h3>

                        <p>
                            Upload photos or videos
                            to begin.
                        </p>

                    </div>
                `;

                return;
            }

            gallery.innerHTML = "";

            media.forEach((file) => {
                const url =
                    URL.createObjectURL(
                        file.blob
                    );

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "media-card";

                if (
                    file.kind === "image"
                ) {
                    card.innerHTML = `
                        <img
                            src="${url}"
                            alt="${escapeHTML(
                                file.name
                            )}">
                    `;
                } else {
                    card.innerHTML = `
                        <video controls>
                            <source
                                src="${url}"
                                type="${escapeHTML(
                                    file.type
                                )}">
                        </video>
                    `;
                }

                card.insertAdjacentHTML(
                    "beforeend",
                    `
                    <div class="media-card-info">

                        <strong>
                            ${escapeHTML(
                                file.name
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                formatDate(
                                    file.createdAt
                                )
                            )}
                        </small>

                        <button
                            class="danger-button"
                            data-media-delete="${escapeHTML(
                                file.id
                            )}">
                            Delete
                        </button>

                    </div>
                    `
                );

                gallery.appendChild(card);
            });
        } catch (error) {
            console.error(error);

            gallery.innerHTML = `
                <div class="empty-state">

                    <span>⚠️</span>

                    <p>
                        Media storage is unavailable.
                    </p>

                </div>
            `;
        }
    }

    /* =========================================================
       NOTES
    ========================================================= */

    function setupNotes() {
        $("newNoteButton")
            ?.addEventListener(
                "click",
                createNewNote
            );

        $("saveNoteButton")
            ?.addEventListener(
                "click",
                () => saveCurrentNote(
                    true
                )
            );

        $("deleteNoteButton")
            ?.addEventListener(
                "click",
                deleteCurrentNote
            );

        $("notesList")
            ?.addEventListener(
                "click",
                (event) => {
                    const button =
                        event.target.closest(
                            "[data-note]"
                        );

                    if (!button) return;

                    openNote(
                        button.dataset.note
                    );
                }
            );
    }

    function createNewNote() {
        const note = {
            id: id("note"),
            title: "Untitled Note",
            content: "",
            createdAt:
                new Date().toISOString(),
            updatedAt:
                new Date().toISOString()
        };

        data.notes.unshift(note);

        currentNoteId = note.id;

        saveData();

        renderNotes();
        openNote(note.id);

        addActivity(
            "New note created",
            "📝"
        );

        showToast(
            "New note created."
        );
    }

    function openNote(noteId) {
        const note =
            data.notes.find(
                (item) =>
                    item.id === noteId
            );

        if (!note) return;

        currentNoteId = noteId;

        if ($("noteTitle")) {
            $("noteTitle").value =
                note.title;
        }

        if ($("noteContent")) {
            $("noteContent").value =
                note.content;
        }

        $$(".note-list-item").forEach(
            (item) => {
                item.classList.toggle(
                    "active",
                    item.dataset.note ===
                        noteId
                );
            }
        );
    }

    function saveCurrentNote(
        showMessage = true
    ) {
        if (!currentNoteId) {
            showToast(
                "Create or select a note first.",
                "⚠️"
            );

            return;
        }

        const note =
            data.notes.find(
                (item) =>
                    item.id ===
                    currentNoteId
            );

        if (!note) return;

        note.title =
            $("noteTitle")
                ?.value.trim() ||
            "Untitled Note";

        note.content =
            $("noteContent")
                ?.value || "";

        note.updatedAt =
            new Date().toISOString();

        saveData();

        renderNotes();

        if (showMessage) {
            addActivity(
                `Note saved: ${note.title}`,
                "📝"
            );

            showToast(
                "Note saved."
            );
        }
    }

    function deleteCurrentNote() {
        if (!currentNoteId) {
            showToast(
                "Select a note first.",
                "⚠️"
            );

            return;
        }

        const note =
            data.notes.find(
                (item) =>
                    item.id ===
                    currentNoteId
            );

        if (!note) return;

        confirmAction(
            "Delete Note?",
            `Delete "${note.title}"?`,
            () => {
                data.notes =
                    data.notes.filter(
                        (item) =>
                            item.id !==
                            currentNoteId
                    );

                currentNoteId = null;

                saveData();

                if ($("noteTitle")) {
                    $("noteTitle").value =
                        "";
                }

                if ($("noteContent")) {
                    $("noteContent").value =
                        "";
                }

                renderNotes();

                showToast(
                    "Note deleted."
                );
            }
        );
    }

    function renderNotes() {
        const list =
            $("notesList");

        if (!list) return;

        if (!data.notes.length) {
            list.innerHTML = `
                <div class="empty-state">

                    <span>📝</span>

                    <p>
                        No notes yet.
                    </p>

                </div>
            `;

            return;
        }

        list.innerHTML =
            data.notes
                .map(
                    (note) => `
                    <button
                        class="note-list-item ${
                            note.id ===
                            currentNoteId
                                ? "active"
                                : ""
                        }"
                        data-note="${escapeHTML(
                            note.id
                        )}">

                        <strong>
                            ${escapeHTML(
                                note.title
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                formatDate(
                                    note.updatedAt
                                )
                            )}
                        </small>

                        <p>
                            ${escapeHTML(
                                (
                                    note.content ||
                                    ""
                                ).slice(0, 80)
                            )}
                        </p>

                    </button>
                `
                )
                .join("");
    }

    /* =========================================================
       TASKS
    ========================================================= */

    function setupTasks() {
        $("addTaskButton")
            ?.addEventListener(
                "click",
                addTask
            );

        $("taskInput")
            ?.addEventListener(
                "keydown",
                (event) => {
                    if (
                        event.key ===
                        "Enter"
                    ) {
                        addTask();
                    }
                }
            );

        $$(".task-filter").forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    () => {
                        taskFilter =
                            button.dataset
                                .filter;

                        $$(".task-filter")
                            .forEach(
                                (item) => {
                                    item.classList.toggle(
                                        "active",
                                        item.dataset
                                            .filter ===
                                            taskFilter
                                    );
                                }
                            );

                        renderTasks();
                    }
                );
            }
        );

        $("taskList")
            ?.addEventListener(
                "click",
                (event) => {
                    const toggle =
                        event.target.closest(
                            "[data-task-toggle]"
                        );

                    const remove =
                        event.target.closest(
                            "[data-task-delete]"
                        );

                    if (toggle) {
                        toggleTask(
                            toggle.dataset
                                .taskToggle
                        );
                    }

                    if (remove) {
                        deleteTask(
                            remove.dataset
                                .taskDelete
                        );
                    }
                }
            );
    }

    function addTask() {
        const input =
            $("taskInput");

        const title =
            input?.value.trim();

        if (!title) {
            showToast(
                "Enter a task first.",
                "⚠️"
            );

            return;
        }

        data.tasks.unshift({
            id: id("task"),
            title,
            completed: false,
            createdAt:
                new Date().toISOString()
        });

        if (input) {
            input.value = "";
        }

        saveData();

        addActivity(
            `Task added: ${title}`,
            "✓"
        );

        renderTasks();

        showToast(
            "Task added."
        );
    }

    function toggleTask(taskId) {
        const task =
            data.tasks.find(
                (item) =>
                    item.id === taskId
            );

        if (!task) return;

        task.completed =
            !task.completed;

        saveData();

        renderTasks();

        showToast(
            task.completed
                ? "Task completed."
                : "Task reopened."
        );
    }

    function deleteTask(taskId) {
        const task =
            data.tasks.find(
                (item) =>
                    item.id === taskId
            );

        if (!task) return;

        confirmAction(
            "Delete Task?",
            `Delete "${task.title}"?`,
            () => {
                data.tasks =
                    data.tasks.filter(
                        (item) =>
                            item.id !==
                            taskId
                    );

                saveData();

                renderTasks();

                showToast(
                    "Task deleted."
                );
            }
        );
    }

    function renderTasks() {
        const list =
            $("taskList");

        if (!list) return;

        let tasks =
            [...data.tasks];

        if (
            taskFilter ===
            "active"
        ) {
            tasks =
                tasks.filter(
                    (task) =>
                        !task.completed
                );
        }

        if (
            taskFilter ===
            "completed"
        ) {
            tasks =
                tasks.filter(
                    (task) =>
                        task.completed
                );
        }

        if (!tasks.length) {
            list.innerHTML = `
                <div class="empty-state">

                    <span>✓</span>

                    <p>
                        No ${
                            taskFilter ===
                            "all"
                                ? ""
                                : taskFilter + " "
                        }tasks yet.
                    </p>

                </div>
            `;

            return;
        }

        list.innerHTML =
            tasks
                .map(
                    (task) => `
                    <div class="task-item ${
                        task.completed
                            ? "completed"
                            : ""
                    }">

                        <button
                            class="task-check"
                            data-task-toggle="${escapeHTML(
                                task.id
                            )}">
                            ${
                                task.completed
                                    ? "✓"
                                    : ""
                            }
                        </button>

                        <div>

                            <strong>
                                ${escapeHTML(
                                    task.title
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    formatDate(
                                        task.createdAt
                                    )
                                )}
                            </small>

                        </div>

                        <button
                            class="danger-button"
                            data-task-delete="${escapeHTML(
                                task.id
                            )}">
                            Delete
                        </button>

                    </div>
                `
                )
                .join("");
    }

    /* =========================================================
       REPORTS
    ========================================================= */

    function setupReports() {
        $("financialReportButton")
            ?.addEventListener(
                "click",
                () =>
                    generateReport(
                        "financial"
                    )
            );

        $("fileReportButton")
            ?.addEventListener(
                "click",
                () =>
                    generateReport(
                        "files"
                    )
            );

        $("productivityReportButton")
            ?.addEventListener(
                "click",
                () =>
                    generateReport(
                        "productivity"
                    )
            );

        $("fullReportButton")
            ?.addEventListener(
                "click",
                () =>
                    generateReport(
                        "full"
                    )
            );

        $("copyReportButton")
            ?.addEventListener(
                "click",
                async () => {
                    const text =
                        $("reportText")
                            ?.textContent ||
                        "";

                    try {
                        await navigator.clipboard.writeText(
                            text
                        );

                        showToast(
                            "Report copied."
                        );
                    } catch (error) {
                        console.error(
                            error
                        );

                        showToast(
                            "Copy was blocked.",
                            "⚠️"
                        );
                    }
                }
            );
    }

    async function generateReport(
        type
    ) {
        const totals =
            calculateTotals();

        let report =
            `ADAPT OS — ${type.toUpperCase()} REPORT\n`;

        report +=
            `${"=".repeat(35)}\n`;

        report +=
            `Generated: ${new Date().toLocaleString()}\n\n`;

        if (
            type ===
            "financial"
        ) {
            report +=
                `Balance: ${money(
                    totals.balance
                )}\n`;

            report +=
                `Income: ${money(
                    totals.income
                )}\n`;

            report +=
                `Expenses: ${money(
                    totals.expenses
                )}\n`;

            report +=
                `Transactions: ${data.transactions.length}\n`;

            report +=
                `Accounts: ${data.accounts.length}`;
        }

        if (
            type ===
            "files"
        ) {
            let files = [];

            try {
                files =
                    await getAllFiles();
            } catch {}

            report +=
                `Files: ${files.length}\n`;

            report +=
                `Documents: ${
                    files.filter(
                        (file) =>
                            file.kind ===
                            "document"
                    ).length
                }\n`;

            report +=
                `Images: ${
                    files.filter(
                        (file) =>
                            file.kind ===
                            "image"
                    ).length
                }\n`;

            report +=
                `Videos: ${
                    files.filter(
                        (file) =>
                            file.kind ===
                            "video"
                    ).length
                }\n`;

            report +=
                `Audio: ${
                    files.filter(
                        (file) =>
                            file.kind ===
                            "audio"
                    ).length
                }`;
        }

        if (
            type ===
            "productivity"
        ) {
            report +=
                `Tasks: ${data.tasks.length}\n`;

            report +=
                `Completed tasks: ${
                    data.tasks.filter(
                        (task) =>
                            task.completed
                    ).length
                }\n`;

            report +=
                `Reminders: ${data.reminders.length}\n`;

            report +=
                `Completed reminders: ${
                    data.reminders.filter(
                        (reminder) =>
                            reminder.completed
                    ).length
                }\n`;

            report +=
                `Notes: ${data.notes.length}`;
        }

        if (
            type ===
            "full"
        ) {
            report +=
                `User: ${data.profile.name}\n`;

            report +=
                `Occupation: ${data.profile.occupation}\n`;

            report +=
                `Workspace: ${data.profile.organization}\n\n`;

            report +=
                `Balance: ${money(
                    totals.balance
                )}\n`;

            report +=
                `Income: ${money(
                    totals.income
                )}\n`;

            report +=
                `Expenses: ${money(
                    totals.expenses
                )}\n`;

            report +=
                `Tasks: ${data.tasks.length}\n`;

            report +=
                `Reminders: ${data.reminders.length}\n`;

            report +=
                `Notes: ${data.notes.length}`;
        }

        if ($("reportText")) {
            $("reportText").textContent =
                report;
        }

        $("reportOutput")
            ?.classList.remove(
                "hidden"
            );

        addActivity(
            `${type} report generated`,
            "📊"
        );

        showToast(
            "Report generated.",
            "📊"
        );
    }

    /* =========================================================
       GLOBAL SEARCH
    ========================================================= */

    function setupGlobalSearch() {
        $("globalSearch")
            ?.addEventListener(
                "keydown",
                (event) => {
                    if (
                        event.key !==
                        "Enter"
                    ) {
                        return;
                    }

                    const original =
                        event.target.value.trim();

                    const query =
                        original.toLowerCase();

                    if (!query) return;

                    const pageMap = {
                        dashboard: [
                            "dashboard",
                            "home"
                        ],

                        learning: [
                            "learning",
                            "study",
                            "subject",
                            "math",
                            "science"
                        ],

                        research: [
                            "research",
                            "search"
                        ],

                        files: [
                            "file",
                            "vault",
                            "document"
                        ],

                        finance: [
                            "finance",
                            "money",
                            "transaction",
                            "account"
                        ],

                        reminders: [
                            "reminder",
                            "event",
                            "alarm"
                        ],

                        media: [
                            "media",
                            "photo",
                            "video",
                            "gallery"
                        ],

                        notes: [
                            "note"
                        ],

                        tasks: [
                            "task",
                            "todo"
                        ],

                        reports: [
                            "report"
                        ],

                        editor: [
                            "profile",
                            "logo",
                            "appearance",
                            "customize"
                        ],

                        settings: [
                            "settings",
                            "notification",
                            "backup",
                            "data"
                        ]
                    };

                    const match =
                        Object.entries(
                            pageMap
                        ).find(
                            ([, keywords]) =>
                                keywords.some(
                                    (keyword) =>
                                        query.includes(
                                            keyword
                                        )
                                )
                        );

                    if (match) {
                        navigate(
                            match[0]
                        );

                        showToast(
                            `Opened ${match[0]}.`
                        );
                    } else {
                        navigate(
                            "research"
                        );

                        if (
                            $("researchInput")
                        ) {
                            $("researchInput").value =
                                original;
                        }

                        performResearch();
                    }
                }
            );
    }

    /* =========================================================
       MODALS
    ========================================================= */

    function openModal(idValue) {
        const modal =
            $(idValue);

        if (!modal) return;

        modal.classList.remove(
            "hidden"
        );

        modal.style.display = "";
    }

    function closeModal(idValue) {
        const modal =
            $(idValue);

        if (!modal) return;

        modal.classList.add(
            "hidden"
        );
    }

    function confirmAction(
        title,
        message,
        action
    ) {
        if (!$("confirmModal")) {
            if (
                window.confirm(
                    `${title}\n\n${message}`
                )
            ) {
                action();
            }

            return;
        }

        confirmationAction =
            action;

        if ($("confirmTitle")) {
            $("confirmTitle").textContent =
                title;
        }

        if ($("confirmMessage")) {
            $("confirmMessage").textContent =
                message;
        }

        openModal(
            "confirmModal"
        );
    }

    function setupModals() {
        $$("[data-close-modal]").forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    () => {
                        closeModal(
                            button.dataset
                                .closeModal
                        );
                    }
                );
            }
        );

        $$(".modal").forEach(
            (modal) => {
                modal.addEventListener(
                    "click",
                    (event) => {
                        if (
                            event.target ===
                            modal
                        ) {
                            closeModal(
                                modal.id
                            );
                        }
                    }
                );
            }
        );

        $("confirmCancel")
            ?.addEventListener(
                "click",
                () => {
                    confirmationAction =
                        null;

                    closeModal(
                        "confirmModal"
                    );
                }
            );

        $("confirmAction")
            ?.addEventListener(
                "click",
                async () => {
                    const action =
                        confirmationAction;

                    confirmationAction =
                        null;

                    closeModal(
                        "confirmModal"
                    );

                    if (!action) return;

                    try {
                        await action();
                    } catch (error) {
                        console.error(
                            "Confirmation action error:",
                            error
                        );
                    }
                }
            );

        document.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key ===
                    "Escape"
                ) {
                    $$(".modal").forEach(
                        (modal) =>
                            modal.classList.add(
                                "hidden"
                            )
                    );

                    $("notificationPanel")
                        ?.classList.add(
                            "hidden"
                        );

                    closeSidebar();
                }
            }
        );
    }

    /* =========================================================
       SETTINGS
    ========================================================= */

    function setupSettings() {
        $("exportDataButton")
            ?.addEventListener(
                "click",
                async () => {
                    let files = [];

                    try {
                        files =
                            await getAllFiles();
                    } catch {}

                    const backup = {
                        app: "ADAPT OS",
                        version: 3,
                        exportedAt:
                            new Date().toISOString(),

                        data,

                        files:
                            files.map(
                                (file) => ({
                                    name:
                                        file.name,
                                    size:
                                        file.size,
                                    type:
                                        file.type,
                                    kind:
                                        file.kind,
                                    createdAt:
                                        file.createdAt
                                })
                            )
                    };

                    const blob =
                        new Blob(
                            [
                                JSON.stringify(
                                    backup,
                                    null,
                                    2
                                )
                            ],
                            {
                                type:
                                    "application/json"
                            }
                        );

                    const url =
                        URL.createObjectURL(
                            blob
                        );

                    const link =
                        document.createElement(
                            "a"
                        );

                    link.href = url;

                    link.download =
                        `adapt-os-backup-${today()}.json`;

                    document.body.appendChild(
                        link
                    );

                    link.click();

                    link.remove();

                    URL.revokeObjectURL(
                        url
                    );

                    addActivity(
                        "Workspace exported",
                        "💾"
                    );

                    showToast(
                        "Backup exported.",
                        "💾"
                    );
                }
            );

        $("importDataButton")
            ?.addEventListener(
                "click",
                () =>
                    $("importDataInput")
                        ?.click()
            );

        $("importDataInput")
            ?.addEventListener(
                "change",
                async (event) => {
                    const file =
                        event.target.files?.[0];

                    if (!file) return;

                    try {
                        const backup =
                            JSON.parse(
                                await file.text()
                            );

                        if (
                            backup.app !==
                                "ADAPT OS" ||
                            !backup.data
                        ) {
                            throw new Error(
                                "Invalid backup"
                            );
                        }

                        confirmAction(
                            "Import Workspace?",
                            "This will replace the current locally saved workspace data.",
                            () => {
                                data = {
                                    ...clone(
                                        DEFAULT_DATA
                                    ),

                                    ...backup.data,

                                    profile: {
                                        ...DEFAULT_DATA.profile,
                                        ...(backup
                                            .data
                                            .profile ||
                                            {})
                                    },

                                    settings: {
                                        ...DEFAULT_DATA.settings,
                                        ...(backup
                                            .data
                                            .settings ||
                                            {})
                                    }
                                };

                                saveData();

                                applyProfile();
                                renderDashboard();
                                renderFinance();
                                renderReminders();
                                renderNotes();
                                renderTasks();
                                updateNotifications();

                                navigate(
                                    "dashboard"
                                );

                                showToast(
                                    "Workspace imported.",
                                    "📥"
                                );
                            }
                        );
                    } catch (error) {
                        console.error(
                            error
                        );

                        showToast(
                            "Invalid ADAPT OS backup.",
                            "⚠️"
                        );
                    }

                    event.target.value = "";
                }
            );

        $("clearDataButton")
            ?.addEventListener(
                "click",
                () => {
                    confirmAction(
                        "Clear Workspace?",
                        "All locally saved workspace data will be removed.",
                        async () => {
                            localStorage.removeItem(
                                APP_KEY
                            );

                            try {
                                await clearFiles();
                            } catch {}

                            data =
                                clone(
                                    DEFAULT_DATA
                                );

                            currentNoteId =
                                null;

                            applyProfile();
                            renderDashboard();
                            renderFinance();
                            renderReminders();
                            renderNotes();
                            renderTasks();
                            updateNotifications();

                            navigate(
                                "dashboard"
                            );

                            showToast(
                                "Workspace cleared.",
                                "✓"
                            );
                        }
                    );
                }
            );
    }

    /* =========================================================
       CLEAR ACTIVITY
    ========================================================= */

    function setupActivity() {
        $("clearActivityButton")
            ?.addEventListener(
                "click",
                () => {
                    data.activity = [];

                    saveData();

                    renderActivity();

                    showToast(
                        "Activity cleared."
                    );
                }
            );
    }

    /* =========================================================
       GLOBAL ERROR HANDLING
    ========================================================= */

    function setupErrorHandling() {
        window.addEventListener(
            "error",
            (event) => {
                console.error(
                    "ADAPT OS error:",
                    event.error ||
                        event.message
                );

                /*
                   Most importantly:
                   Never allow an error to leave
                   the loading screen permanently.
                */
                showApp();
            }
        );

        window.addEventListener(
            "unhandledrejection",
            (event) => {
                console.error(
                    "ADAPT OS promise error:",
                    event.reason
                );

                showApp();
            }
        );
    }

    /* =========================================================
       INITIALIZE EVERYTHING
    ========================================================= */

    async function initializeApp() {
        startLoadingScreen();

        try {
            /*
               Load saved information first.
            */

            data = loadData();

            /*
               Register every feature.
            */

            setupNavigation();

            setupMobileMenu();

            setupEditor();

            setupFinance();

            setupReminders();

            setupNotifications();

            setupLearning();

            setupResearch();

            setupFiles();

            setupMedia();

            setupNotes();

            setupTasks();

            setupReports();

            setupGlobalSearch();

            setupModals();

            setupSettings();

            setupActivity();

            setupErrorHandling();

            /*
               Apply saved appearance/profile.
            */

            applyProfile();

            loadEditor();

            /*
               Render everything.
            */

            await renderDashboard();

            renderFinance();

            renderReminders();

            renderNotes();

            renderTasks();

            await renderFiles();

            await renderMedia();

            updateNotifications();

            /*
               Restore previous page.
               If anything is wrong with the saved
               page, use dashboard.
            */

            const validPages = [
                "dashboard",
                "learning",
                "research",
                "files",
                "finance",
                "reminders",
                "media",
                "notes",
                "tasks",
                "reports",
                "editor",
                "settings"
            ];

            const savedPage =
                validPages.includes(
                    data.lastPage
                )
                    ? data.lastPage
                    : "dashboard";

            navigate(savedPage);

            /*
               Check reminders immediately.
            */

            checkReminders();

            /*
               Check reminders every 15 seconds.
               This allows a reminder to trigger
               shortly after its exact time.
            */

            clearInterval(
                reminderTimer
            );

            reminderTimer =
                setInterval(
                    checkReminders,
                    15000
                );

            /*
               Finally reveal the app.
            */

            showApp();
        } catch (error) {
            /*
               This is the final safety net.
               The application should NEVER stay
               on a blank loading screen.
            */

            console.error(
                "ADAPT OS startup error:",
                error
            );

            showApp();

            showToast(
                "ADAPT OS loaded with a feature warning.",
                "⚠️"
            );
        }
    }

    /* =========================================================
       START APPLICATION
    ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initializeApp,
            {
                once: true
            }
        );
    } else {
        initializeApp();
    }

})();
