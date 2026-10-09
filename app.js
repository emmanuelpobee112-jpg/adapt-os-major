/* ============================================================
   ADAPT OS — STUDENT EDITION
   MAIN JAVASCRIPT
   Version 1.0.0
   ============================================================ */

"use strict";

/* ============================================================
   1. APPLICATION DATA
   ============================================================ */

const STORAGE_KEY = "adaptOS_studentEdition_v1";

const DEFAULT_DATA = {
    profile: {
        name: "Student",
        classLevel: ""
    },

    subjects: [],

    assignments: [],

    notes: [],

    plannerEvents: [],

    results: [],

    notifications: [],

    settings: {
        theme: "dark",
        compact: false,
        assignmentNotifications: true,
        studyNotifications: true
    },

    focusSessions: [],

    files: [],

    activity: {}
};

let appData = loadData();


/* ============================================================
   2. GLOBAL STATE
   ============================================================ */

let currentPage = "dashboard";

let currentAssignmentFilter = "all";

let calendarDate = new Date();

let focusInterval = null;
let focusSecondsRemaining = 25 * 60;
let focusRunning = false;
let focusStartedAt = null;
let selectedFocusMinutes = 25;

let stopwatchInterval = null;
let stopwatchRunning = false;
let stopwatchSeconds = 0;

let currentAssessment = null;

let researchFiles = [];

let currentCodeTab = "html";


/* ============================================================
   3. DOM HELPERS
   ============================================================ */

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
}

function byId(id) {
    return document.getElementById(id);
}


/* ============================================================
   4. STORAGE
   ============================================================ */

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return JSON.parse(JSON.stringify(DEFAULT_DATA));
        }

        const parsed = JSON.parse(saved);

        return {
            ...JSON.parse(JSON.stringify(DEFAULT_DATA)),
            ...parsed,
            settings: {
                ...DEFAULT_DATA.settings,
                ...(parsed.settings || {})
            }
        };
    } catch (error) {
        console.error("ADAPT OS: Could not load data.", error);

        return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
}


function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (error) {
        console.error("ADAPT OS: Could not save data.", error);
        showToast("Your browser could not save the latest changes.", "error");
    }
}


/* ============================================================
   5. INITIALIZATION
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    initializeApplication();
});


function initializeApplication() {
    initializeNavigation();
    initializeModals();
    initializeDashboard();
    initializeSubjects();
    initializeAssignments();
    initializePractice();
    initializeResearch();
    initializeNotes();
    initializePlanner();
    initializeFocusMode();
    initializeToolbox();
    initializeCodeLab();
    initializeFileCenter();
    initializeAnalytics();
    initializeSettings();
    initializeSearch();
    initializeNotifications();
    initializeProfileMenu();

    applySettings();
    renderEverything();

    showPage("dashboard");
}


/* ============================================================
   6. RENDER EVERYTHING
   ============================================================ */

function renderEverything() {
    renderProfile();
    renderDashboard();
    renderSubjects();
    renderAssignments();
    renderPracticeSelectors();
    renderNotes();
    renderPlanner();
    renderCalendar();
    renderResults();
    renderAnalytics();
    renderNotifications();
    updateAssignmentBadge();
    updateDashboardStatistics();
}


/* ============================================================
   7. NAVIGATION
   ============================================================ */

function initializeNavigation() {

    $$("[data-page]").forEach(button => {
        button.addEventListener("click", () => {
            const page = button.dataset.page;

            if (page) {
                showPage(page);
            }
        });
    });


    $$("[data-page-link]").forEach(button => {
        button.addEventListener("click", () => {
            const page = button.dataset.pageLink;

            if (page) {
                showPage(page);
            }
        });
    });


    const menuToggle = byId("menuToggle");

    if (menuToggle) {
        menuToggle.addEventListener("click", openSidebar);
    }


    const sidebarClose = byId("sidebarClose");

    if (sidebarClose) {
        sidebarClose.addEventListener("click", closeSidebar);
    }


    const sidebarOverlay = byId("sidebarOverlay");

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeSidebar);
    }
}


function showPage(pageName) {

    const targetPage = document.querySelector(
        `[data-page-section="${pageName}"]`
    );

    if (!targetPage) {
        console.warn("ADAPT OS: Page not found:", pageName);
        return;
    }

    $$(".page").forEach(page => {
        page.classList.remove("active");
        page.style.display = "none";
    });

    targetPage.classList.add("active");
    targetPage.style.display = "block";

    currentPage = pageName;

    $$("[data-page]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    const pageNames = {
        dashboard: "Dashboard",
        subjects: "Subjects",
        assignments: "Assignments",
        practice: "Practice",
        exams: "Exams",
        results: "Results",
        research: "Research Lab",
        notes: "Notes",
        planner: "Planner",
        focus: "Focus Mode",
        tools: "Student Toolbox",
        code: "Code Lab",
        files: "File Center",
        analytics: "Analytics",
        settings: "Settings"
    };

    const currentPageName = byId("currentPageName");

    if (currentPageName) {
        currentPageName.textContent =
            pageNames[pageName] || pageName;
    }

    closeSidebar();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (pageName === "analytics") {
        renderAnalytics();
    }

    if (pageName === "planner") {
        renderCalendar();
    }

    if (pageName === "results") {
        renderResults();
    }
}


function openSidebar() {
    const sidebar = byId("sidebar");
    const overlay = byId("sidebarOverlay");

    if (sidebar) sidebar.classList.add("open");
    if (overlay) overlay.classList.add("open");
}


function closeSidebar() {
    const sidebar = byId("sidebar");
    const overlay = byId("sidebarOverlay");

    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
}


/* ============================================================
   8. MODALS
   ============================================================ */

function initializeModals() {

    $$("[data-close-modal]").forEach(button => {
        button.addEventListener("click", () => {
            closeModal(button.dataset.closeModal);
        });
    });


    $$(".modal-backdrop").forEach(backdrop => {
        backdrop.addEventListener("click", event => {
            const modal = event.target.closest(".modal");

            if (modal) {
                closeModal(modal.id);
            }
        });
    });


    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            $$(".modal").forEach(modal => {
                if (
                    modal.classList.contains("open") ||
                    modal.classList.contains("active")
                ) {
                    closeModal(modal.id);
                }
            });

            closeNotifications();
        }
    });
}


function openModal(id) {

    const modal = byId(id);

    if (!modal) return;

    modal.classList.add("open");
    modal.classList.add("active");

    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");
}


function closeModal(id) {

    const modal = byId(id);

    if (!modal) return;

    modal.classList.remove("open");
    modal.classList.remove("active");

    modal.setAttribute("aria-hidden", "true");

    if (!$(".modal.open")) {
        document.body.classList.remove("modal-open");
    }
}


/* ============================================================
   9. PROFILE
   ============================================================ */

function renderProfile() {

    const name =
        appData.profile.name?.trim() || "Student";

    const sidebarName = byId("sidebarUserName");
    const dashboardName = byId("dashboardUserName");
    const studentName = byId("studentName");
    const studentClass = byId("studentClass");

    if (sidebarName) {
        sidebarName.textContent = name;
    }

    if (dashboardName) {
        dashboardName.textContent = name;
    }

    if (studentName && document.activeElement !== studentName) {
        studentName.value =
            appData.profile.name === "Student"
                ? ""
                : appData.profile.name;
    }

    if (studentClass && document.activeElement !== studentClass) {
        studentClass.value = appData.profile.classLevel || "";
    }
}


/* ============================================================
   10. DASHBOARD
   ============================================================ */

function initializeDashboard() {

    renderDashboard();
}


function renderDashboard() {

    const planContainer = byId("todayStudyPlan");
    const deadlineContainer = byId("dashboardAssignments");
    const progressContainer = byId("dashboardProgress");

    if (planContainer) {

        const today = dateKey(new Date());

        const todayEvents = appData.plannerEvents
            .filter(event => event.date === today)
            .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

        if (!todayEvents.length) {

            planContainer.innerHTML = `
                <div class="empty-state small">
                    <div class="empty-icon">□</div>
                    <h4>Your study plan is empty</h4>
                    <p>Add your first study activity from the Planner.</p>
                </div>
            `;

        } else {

            planContainer.innerHTML = todayEvents
                .map(event => `
                    <div class="study-plan-item">
                        <div>
                            <strong>${escapeHTML(event.title)}</strong>
                            <small>
                                ${event.time ? escapeHTML(event.time) : "Any time"}
                            </small>
                        </div>
                        <span>${escapeHTML(event.type)}</span>
                    </div>
                `)
                .join("");
        }
    }


    if (deadlineContainer) {

        const upcoming = appData.assignments
            .filter(assignment => !assignment.completed)
            .sort(
                (a, b) =>
                    new Date(a.deadline) -
                    new Date(b.deadline)
            )
            .slice(0, 4);

        if (!upcoming.length) {

            deadlineContainer.innerHTML = `
                <div class="empty-state small">
                    <div class="empty-icon">✓</div>
                    <h4>No upcoming deadlines</h4>
                    <p>You're all caught up.</p>
                </div>
            `;

        } else {

            deadlineContainer.innerHTML = upcoming
                .map(assignment => `
                    <div class="deadline-item">
                        <div>
                            <strong>${escapeHTML(assignment.title)}</strong>
                            <small>${escapeHTML(assignment.subject)}</small>
                        </div>
                        <span>${formatDeadline(assignment.deadline)}</span>
                    </div>
                `)
                .join("");
        }
    }


    if (progressContainer) {

        if (!appData.subjects.length) {

            progressContainer.innerHTML = `
                <div class="empty-state small">
                    <div class="empty-icon">◒</div>
                    <h4>No subject progress yet</h4>
                    <p>Start learning to see your progress here.</p>
                </div>
            `;

        } else {

            progressContainer.innerHTML =
                appData.subjects.map(subject => {

                    const progress =
                        Number(subject.progress || 0);

                    return `
                        <div class="subject-progress-item">
                            <div class="progress-meta">
                                <span>${escapeHTML(subject.name)}</span>
                                <strong>${progress}%</strong>
                            </div>
                            <div class="progress-track">
                                <span
                                    class="progress-fill"
                                    style="width:${progress}%"
                                ></span>
                            </div>
                        </div>
                    `;
                }).join("");
        }
    }

    updateDashboardStatistics();
}


function updateDashboardStatistics() {

    const completedTasks =
        appData.assignments.filter(
            assignment => assignment.completed
        ).length;

    const studyMinutes =
        appData.focusSessions.reduce(
            (total, session) =>
                total + Number(session.minutes || 0),
            0
        );

    const scores =
        appData.results
            .map(result => Number(result.percentage))
            .filter(score => !Number.isNaN(score));

    const average =
        scores.length
            ? Math.round(
                scores.reduce((a, b) => a + b, 0) /
                scores.length
            )
            : 0;


    const statSubjects = byId("statSubjects");
    const statTasks = byId("statTasks");
    const statStudyHours = byId("statStudyHours");
    const statAverageScore = byId("statAverageScore");

    if (statSubjects) {
        statSubjects.textContent =
            appData.subjects.length;
    }

    if (statTasks) {
        statTasks.textContent =
            completedTasks;
    }

    if (statStudyHours) {
        statStudyHours.textContent =
            formatHours(studyMinutes);
    }

    if (statAverageScore) {
        statAverageScore.textContent =
            `${average}%`;
    }
}


/* ============================================================
   11. SUBJECTS
   ============================================================ */

function initializeSubjects() {

    const addButton = byId("addSubjectButton");
    const emptyButton = byId("emptyAddSubject");
    const form = byId("subjectForm");

    if (addButton) {
        addButton.addEventListener("click", () => {
            resetSubjectForm();
            openModal("subjectModal");
        });
    }

    if (emptyButton) {
        emptyButton.addEventListener("click", () => {
            resetSubjectForm();
            openModal("subjectModal");
        });
    }

    if (form) {
        form.addEventListener("submit", event => {
            event.preventDefault();
            createSubject();
        });
    }
}


function resetSubjectForm() {

    const form = byId("subjectForm");

    if (form) {
        form.reset();
    }
}


function createSubject() {

    const name =
        byId("subjectName")?.value.trim();

    const description =
        byId("subjectDescription")?.value.trim();

    const topicsText =
        byId("subjectTopics")?.value.trim();

    if (!name) {
        showToast("Please enter a subject name.", "error");
        return;
    }

    const exists = appData.subjects.some(
        subject =>
            subject.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
        showToast("That subject already exists.", "error");
        return;
    }

    const topics =
        topicsText
            ? topicsText
                .split("\n")
                .map(topic => topic.trim())
                .filter(Boolean)
            : [];

    appData.subjects.push({
        id: createId(),
        name,
        description,
        topics,
        progress: 0,
        createdAt: new Date().toISOString()
    });

    saveData();

    closeModal("subjectModal");

    renderEverything();

    showPage("subjects");

    showToast("Subject created successfully.", "success");
}


function renderSubjects() {

    const grid = byId("subjectGrid");

    if (!grid) return;

    if (!appData.subjects.length) {

        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">▣</div>
                <h3>No subjects yet</h3>
                <p>
                    Create your first subject to begin building
                    your learning workspace.
                </p>
                <button
                    class="primary-button"
                    id="emptyAddSubject"
                >
                    Create Subject
                </button>
            </div>
        `;

        const button = byId("emptyAddSubject");

        if (button) {
            button.addEventListener("click", () => {
                resetSubjectForm();
                openModal("subjectModal");
            });
        }

        return;
    }


    grid.innerHTML =
        appData.subjects.map(subject => {

            const topics =
                subject.topics || [];

            return `
                <article
                    class="subject-card"
                    data-subject-id="${subject.id}"
                >

                    <div class="subject-card-header">

                        <div class="subject-card-icon">
                            ▣
                        </div>

                        <div>
                            <h3>${escapeHTML(subject.name)}</h3>
                            <p>
                                ${escapeHTML(
                                    subject.description ||
                                    "No description added."
                                )}
                            </p>
                        </div>

                    </div>

                    <div class="subject-progress">

                        <div class="progress-meta">
                            <span>Progress</span>
                            <strong>${Number(subject.progress || 0)}%</strong>
                        </div>

                        <div class="progress-track">
                            <span
                                class="progress-fill"
                                style="width:${Number(subject.progress || 0)}%"
                            ></span>
                        </div>

                    </div>

                    <div class="subject-topics">

                        <strong>
                            ${topics.length} topic${topics.length === 1 ? "" : "s"}
                        </strong>

                        ${
                            topics.length
                                ? `
                                    <ul>
                                        ${topics.slice(0, 5)
                                            .map(topic =>
                                                `<li>${escapeHTML(topic)}</li>`
                                            )
                                            .join("")}
                                    </ul>
                                  `
                                : `<small>No topics added.</small>`
                        }

                    </div>

                    <div class="subject-card-actions">

                        <button
                            class="small-button"
                            data-subject-practice="${subject.id}"
                        >
                            Practice
                        </button>

                        <button
                            class="small-button danger"
                            data-delete-subject="${subject.id}"
                        >
                            Delete
                        </button>

                    </div>

                </article>
            `;
        }).join("");


    $$("[data-subject-practice]").forEach(button => {

        button.addEventListener("click", () => {

            const subjectId =
                button.dataset.subjectPractice;

            const subject =
                appData.subjects.find(
                    item => item.id === subjectId
                );

            if (!subject) return;

            showPage("practice");

            const select =
                byId("practiceSubject");

            if (select) {
                select.value = subject.id;
                populatePracticeTopics(subject.id);
            }
        });
    });


    $$("[data-delete-subject]").forEach(button => {

        button.addEventListener("click", () => {

            const id =
                button.dataset.deleteSubject;

            const subject =
                appData.subjects.find(
                    item => item.id === id
                );

            if (!subject) return;

            const confirmed =
                window.confirm(
                    `Delete "${subject.name}"?`
                );

            if (!confirmed) return;

            appData.subjects =
                appData.subjects.filter(
                    item => item.id !== id
                );

            saveData();

            renderEverything();

            showToast("Subject deleted.", "success");
        });
    });
}


/* ============================================================
   12. ASSIGNMENTS
   ============================================================ */

function initializeAssignments() {

    const addButton =
        byId("addAssignmentButton");

    const form =
        byId("assignmentForm");

    if (addButton) {

        addButton.addEventListener("click", () => {

            resetAssignmentForm();

            populateAssignmentSubjects();

            setDefaultAssignmentDeadline();

            openModal("assignmentModal");
        });
    }


    if (form) {

        form.addEventListener("submit", event => {

            event.preventDefault();

            createAssignment();
        });
    }


    $$("[data-assignment-filter]").forEach(button => {

        button.addEventListener("click", () => {

            currentAssignmentFilter =
                button.dataset.assignmentFilter;

            $$("[data-assignment-filter]").forEach(item => {
                item.classList.toggle(
                    "active",
                    item === button
                );
            });

            renderAssignments();
        });
    });
}


function resetAssignmentForm() {

    const form = byId("assignmentForm");

    if (form) {
        form.reset();
    }
}


function populateAssignmentSubjects() {

    const select =
        byId("assignmentSubject");

    if (!select) return;

    select.innerHTML = `
        <option value="">Select subject</option>
    `;

    appData.subjects.forEach(subject => {

        const option =
            document.createElement("option");

        option.value = subject.name;
        option.textContent = subject.name;

        select.appendChild(option);
    });
}


function setDefaultAssignmentDeadline() {

    const input =
        byId("assignmentDeadline");

    if (!input) return;

    const date =
        new Date(Date.now() + 24 * 60 * 60 * 1000);

    date.setSeconds(0, 0);

    input.value =
        toDateTimeLocalValue(date);
}


function createAssignment() {

    const title =
        byId("assignmentTitle")?.value.trim();

    const subject =
        byId("assignmentSubject")?.value;

    const priority =
        byId("assignmentPriority")?.value || "medium";

    const deadline =
        byId("assignmentDeadline")?.value;

    const description =
        byId("assignmentDescription")?.value.trim();

    if (!title || !subject || !deadline) {

        showToast(
            "Please complete the required assignment fields.",
            "error"
        );

        return;
    }

    appData.assignments.push({

        id: createId(),

        title,

        subject,

        priority,

        deadline,

        description,

        completed: false,

        createdAt: new Date().toISOString()
    });

    saveData();

    closeModal("assignmentModal");

    renderEverything();

    showPage("assignments");

    showToast(
        "Assignment added successfully.",
        "success"
    );
}


function renderAssignments() {

    const list =
        byId("assignmentList");

    if (!list) return;

    let assignments =
        [...appData.assignments];


    if (currentAssignmentFilter === "pending") {

        assignments =
            assignments.filter(
                assignment => !assignment.completed
            );
    }


    if (currentAssignmentFilter === "completed") {

        assignments =
            assignments.filter(
                assignment => assignment.completed
            );
    }


    if (currentAssignmentFilter === "overdue") {

        assignments =
            assignments.filter(
                assignment =>
                    !assignment.completed &&
                    new Date(assignment.deadline) < new Date()
            );
    }


    assignments.sort(
        (a, b) =>
            new Date(a.deadline) -
            new Date(b.deadline)
    );


    if (!assignments.length) {

        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✓</div>
                <h3>No assignments</h3>
                <p>
                    Add an assignment to start managing
                    your academic workload.
                </p>
            </div>
        `;

        return;
    }


    list.innerHTML =
        assignments.map(assignment => {

            const overdue =
                !assignment.completed &&
                new Date(assignment.deadline) < new Date();

            return `
                <div
                    class="assignment-item ${
                        assignment.completed
                            ? "completed"
                            : ""
                    }"
                    data-assignment-id="${assignment.id}"
                >

                    <label class="assignment-check">

                        <input
                            type="checkbox"
                            data-complete-assignment="${assignment.id}"
                            ${assignment.completed ? "checked" : ""}
                        >

                        <span></span>

                    </label>

                    <div class="assignment-info">

                        <strong>
                            ${escapeHTML(assignment.title)}
                        </strong>

                        <span>
                            ${escapeHTML(assignment.subject)}
                        </span>

                        <div class="assignment-meta">

                            <span class="priority ${assignment.priority}">
                                ${escapeHTML(
                                    assignment.priority.toUpperCase()
                                )}
                            </span>

                            <span class="deadline ${
                                overdue ? "overdue" : ""
                            }">
                                ${formatDeadline(assignment.deadline)}
                            </span>

                        </div>

                    </div>

                    <button
                        class="text-button delete-assignment"
                        data-delete-assignment="${assignment.id}"
                    >
                        Delete
                    </button>

                </div>
            `;
        }).join("");


    $$("[data-complete-assignment]").forEach(input => {

        input.addEventListener("change", () => {

            const id =
                input.dataset.completeAssignment;

            const assignment =
                appData.assignments.find(
                    item => item.id === id
                );

            if (!assignment) return;

            assignment.completed =
                input.checked;

            saveData();

            renderEverything();

            showToast(
                input.checked
                    ? "Assignment completed!"
                    : "Assignment marked as pending.",
                "success"
            );
        });
    });


    $$("[data-delete-assignment]").forEach(button => {

        button.addEventListener("click", () => {

            const id =
                button.dataset.deleteAssignment;

            appData.assignments =
                appData.assignments.filter(
                    assignment => assignment.id !== id
                );

            saveData();

            renderEverything();

            showToast(
                "Assignment deleted.",
                "success"
            );
        });
    });
}


function updateAssignmentBadge() {

    const badge =
        $(".nav-item[data-page='assignments'] .nav-badge");

    if (!badge) return;

    const pending =
        appData.assignments.filter(
            assignment => !assignment.completed
        ).length;

    badge.textContent = pending;

    badge.style.display =
        pending ? "inline-flex" : "none";
}


/* ============================================================
   13. PRACTICE
   ============================================================ */

/*
   Local question bank.

   These are real marked questions.
   More subjects/questions can be added later.
*/

const QUESTION_BANK = {

    Mathematics: {

        Algebra: [

            {
                question: "Solve: 2x + 6 = 14",
                options: ["2", "4", "6", "8"],
                answer: 1
            },

            {
                question: "If x = 5, what is 3x + 2?",
                options: ["12", "15", "17", "20"],
                answer: 2
            },

            {
                question: "What is the coefficient of x in 7x + 3?",
                options: ["3", "7", "10", "x"],
                answer: 1
            },

            {
                question: "Simplify: 4x + 3x",
                options: ["7", "7x", "12x", "x7"],
                answer: 1
            },

            {
                question: "If 5x = 25, what is x?",
                options: ["2", "4", "5", "10"],
                answer: 2
            }

        ],

        "Basic Mathematics": [

            {
                question: "What is 12 × 5?",
                options: ["50", "55", "60", "65"],
                answer: 2
            },

            {
                question: "What is 100 ÷ 4?",
                options: ["20", "25", "30", "40"],
                answer: 1
            },

            {
                question: "What is 15 + 27?",
                options: ["32", "40", "42", "52"],
                answer: 2
            },

            {
                question: "What is 50% of 80?",
                options: ["20", "30", "40", "50"],
                answer: 2
            },

            {
                question: "What is the square of 9?",
                options: ["18", "27", "72", "81"],
                answer: 3
            }

        ]
    },


    English: {

        Grammar: [

            {
                question: "Which word is a noun?",
                options: ["Quickly", "Beautiful", "Teacher", "Run"],
                answer: 2
            },

            {
                question: "Choose the correct sentence.",
                options: [
                    "She go to school.",
                    "She goes to school.",
                    "She going school.",
                    "She gone school."
                ],
                answer: 1
            },

            {
                question: "What is the opposite of 'ancient'?",
                options: ["Old", "Modern", "Past", "Historic"],
                answer: 1
            },

            {
                question: "Which word is an adjective?",
                options: ["Beautiful", "Run", "Quickly", "Teacher"],
                answer: 0
            },

            {
                question: "What punctuation mark normally ends a question?",
                options: [".", ",", "!", "?"],
                answer: 3
            }

        ]
    },


    "Integrated Science": {

        "General Science": [

            {
                question: "Which organ pumps blood around the human body?",
                options: ["Lung", "Heart", "Kidney", "Brain"],
                answer: 1
            },

            {
                question: "Which gas is most abundant in Earth's atmosphere?",
                options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
                answer: 2
            },

            {
                question: "What is the basic unit of life?",
                options: ["Tissue", "Cell", "Organ", "System"],
                answer: 1
            },

            {
                question: "Which force pulls objects toward Earth?",
                options: ["Friction", "Magnetism", "Gravity", "Pressure"],
                answer: 2
            },

            {
                question: "Water freezes at approximately what temperature?",
                options: ["0°C", "10°C", "50°C", "100°C"],
                answer: 0
            }

        ]
    }

};


function initializePractice() {

    const subjectSelect =
        byId("practiceSubject");

    const startButton =
        byId("startPracticeButton");

    if (subjectSelect) {

        subjectSelect.addEventListener(
            "change",
            () => {
                populatePracticeTopics(
                    subjectSelect.value
                );
            }
        );
    }


    if (startButton) {

        startButton.addEventListener(
            "click",
            startPractice
        );
    }


    byId("practiceTopic")?.addEventListener(
        "change",
        () => {}
    );


    byId("previousQuestion")?.addEventListener(
        "click",
        previousQuestion
    );

    byId("nextQuestion")?.addEventListener(
        "click",
        nextQuestion
    );
}


function renderPracticeSelectors() {

    const select =
        byId("practiceSubject");

    if (!select) return;

    const current =
        select.value;

    select.innerHTML = `
        <option value="">
            Select subject
        </option>
    `;

    appData.subjects.forEach(subject => {

        const option =
            document.createElement("option");

        option.value = subject.id;
        option.textContent = subject.name;

        select.appendChild(option);
    });

    if (
        current &&
        appData.subjects.some(
            subject => subject.id === current
        )
    ) {
        select.value = current;
    }

    populatePracticeTopics(select.value);
}


function populatePracticeTopics(subjectId) {

    const topicSelect =
        byId("practiceTopic");

    if (!topicSelect) return;

    topicSelect.innerHTML = `
        <option value="">
            Select topic
        </option>
    `;

    const subject =
        appData.subjects.find(
            item => item.id === subjectId
        );

    if (!subject) return;

    const topics =
        subject.topics || [];

    topics.forEach(topic => {

        const option =
            document.createElement("option");

        option.value = topic;
        option.textContent = topic;

        topicSelect.appendChild(option);
    });
}


function getQuestionsForSubject(subject, topic) {

    const bank =
        QUESTION_BANK[subject];

    if (!bank) return [];

    if (bank[topic]) {
        return [...bank[topic]];
    }

    const allQuestions =
        Object.values(bank).flat();

    return allQuestions;
}


function startPractice() {

    const subjectId =
        byId("practiceSubject")?.value;

    const topic =
        byId("practiceTopic")?.value;

    const count =
        Number(
            byId("practiceQuestionCount")?.value || 5
        );

    if (!subjectId) {

        showToast(
            "Please select a subject first.",
            "error"
        );

        return;
    }

    const subject =
        appData.subjects.find(
            item => item.id === subjectId
        );

    if (!subject) return;

    const questions =
        getQuestionsForSubject(
            subject.name,
            topic
        );

    if (!questions.length) {

        showToast(
            `There is no question bank for "${subject.name}" yet. Add a supported subject/topic or we'll add its question bank next.`,
            "error"
        );

        return;
    }

    const shuffled =
        [...questions].sort(
            () => Math.random() - 0.5
        );

    currentAssessment = {

        type: "Practice",

        title:
            `${subject.name}${topic ? ` — ${topic}` : ""}`,

        subject:
            subject.name,

        questions:
            shuffled.slice(
                0,
                Math.min(count, shuffled.length)
            ),

        currentIndex: 0,

        answers: [],

        startedAt: Date.now()
    };

    openAssessment();

    renderAssessmentQuestion();
}


function openAssessment() {

    openModal("assessmentModal");

    document.body.classList.add(
        "assessment-active"
    );
}


function closeAssessment() {

    closeModal("assessmentModal");

    document.body.classList.remove(
        "assessment-active"
    );

    currentAssessment = null;
}


function renderAssessmentQuestion() {

    if (!currentAssessment) return;

    const question =
        currentAssessment.questions[
            currentAssessment.currentIndex
        ];

    if (!question) return;


    const number =
        currentAssessment.currentIndex + 1;

    const total =
        currentAssessment.questions.length;


    const type =
        byId("assessmentType");

    const title =
        byId("assessmentTitle");

    const questionNumber =
        byId("assessmentQuestionNumber");

    const timer =
        byId("assessmentTimer");

    const progress =
        byId("assessmentProgressBar");

    const questionText =
        byId("questionText");

    const options =
        byId("answerOptions");


    if (type) {
        type.textContent =
            currentAssessment.type.toUpperCase();
    }

    if (title) {
        title.textContent =
            currentAssessment.title;
    }

    if (questionNumber) {
        questionNumber.textContent =
            `${number} / ${total}`;
    }

    if (timer) {

        const elapsed =
            Math.floor(
                (Date.now() -
                    currentAssessment.startedAt) /
                1000
            );

        timer.textContent =
            formatTime(elapsed);
    }

    if (progress) {

        progress.style.width =
            `${(number / total) * 100}%`;
    }

    if (questionText) {
        questionText.textContent =
            question.question;
    }


    if (options) {

        options.innerHTML =
            question.options.map(
                (option, index) => {

                    const selected =
                        currentAssessment.answers[
                            currentAssessment.currentIndex
                        ] === index;

                    return `
                        <button
                            type="button"
                            class="answer-option ${
                                selected ? "selected" : ""
                            }"
                            data-answer-index="${index}"
                        >
                            <span class="answer-letter">
                                ${String.fromCharCode(65 + index)}
                            </span>

                            <span>
                                ${escapeHTML(option)}
                            </span>
                        </button>
                    `;
                }
            ).join("");


        $$("[data-answer-index]").forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    currentAssessment.answers[
                        currentAssessment.currentIndex
                    ] = Number(
                        button.dataset.answerIndex
                    );

                    renderAssessmentQuestion();
                }
            );
        });
    }


    const previous =
        byId("previousQuestion");

    const next =
        byId("nextQuestion");


    if (previous) {

        previous.disabled =
            currentAssessment.currentIndex === 0;
    }


    if (next) {

        next.textContent =
            currentAssessment.currentIndex === total - 1
                ? "Finish ✓"
                : "Next →";
    }
}


function previousQuestion() {

    if (!currentAssessment) return;

    if (currentAssessment.currentIndex > 0) {

        currentAssessment.currentIndex--;

        renderAssessmentQuestion();
    }
}


function nextQuestion() {

    if (!currentAssessment) return;

    const total =
        currentAssessment.questions.length;

    if (
        currentAssessment.currentIndex <
        total - 1
    ) {

        currentAssessment.currentIndex++;

        renderAssessmentQuestion();

        return;
    }

    finishAssessment();
}


function finishAssessment() {

    if (!currentAssessment) return;

    const unanswered =
        currentAssessment.questions.filter(
            (_, index) =>
                typeof currentAssessment.answers[index] !==
                "number"
        ).length;


    if (unanswered > 0) {

        const proceed =
            window.confirm(
                `You have ${unanswered} unanswered question${
                    unanswered === 1 ? "" : "s"
                }. Finish anyway?`
            );

        if (!proceed) return;
    }


    let correct = 0;


    currentAssessment.questions.forEach(
        (question, index) => {

            if (
                currentAssessment.answers[index] ===
                question.answer
            ) {
                correct++;
            }
        }
    );


    const total =
        currentAssessment.questions.length;

    const percentage =
        Math.round(
            (correct / total) * 100
        );


    const result = {

        id: createId(),

        type: currentAssessment.type,

        title: currentAssessment.title,

        subject: currentAssessment.subject,

        correct,

        total,

        percentage,

        date: new Date().toISOString()
    };


    appData.results.push(result);


    if (!appData.activity[dateKey(new Date())]) {
        appData.activity[dateKey(new Date())] = 0;
    }

    appData.activity[dateKey(new Date())] += 1;


    saveData();

    showAssessmentResult(result);
}


function showAssessmentResult(result) {

    const modal =
        byId("assessmentModal");

    if (!modal) return;


    const card =
        modal.querySelector(".assessment-card");

    if (!card) return;


    card.innerHTML = `

        <header class="assessment-header">

            <div>
                <span class="panel-label">
                    ${escapeHTML(result.type.toUpperCase())}
                </span>

                <h3>
                    Assessment Complete
                </h3>
            </div>

        </header>


        <main class="assessment-body">

            <div class="question-card">

                <span class="question-label">
                    YOUR RESULT
                </span>

                <h2>
                    ${result.percentage}%
                </h2>

                <p>
                    You answered
                    <strong>${result.correct}</strong>
                    out of
                    <strong>${result.total}</strong>
                    questions correctly.
                </p>

                <div class="assessment-result-message">

                    ${
                        result.percentage >= 80
                            ? "Excellent work! Keep building your capacity."
                            : result.percentage >= 60
                                ? "Good work. Review the questions you missed and try again."
                                : "Keep practicing. Every attempt helps you improve."
                    }

                </div>

            </div>

        </main>


        <footer class="assessment-footer">

            <button
                class="secondary-button"
                id="closeAssessmentResult"
            >
                Close
            </button>

            <button
                class="primary-button"
                id="viewResultsAfterAssessment"
            >
                View Results →
            </button>

        </footer>
    `;


    byId("closeAssessmentResult")?.addEventListener(
        "click",
        () => {

            closeAssessment();

            renderEverything();
        }
    );


    byId("viewResultsAfterAssessment")?.addEventListener(
        "click",
        () => {

            closeAssessment();

            renderEverything();

            showPage("results");
        }
    );
}


/* ============================================================
   14. RESULTS
   ============================================================ */

function renderResults() {

    const averageElement =
        byId("resultsAverage");

    const examCountElement =
        byId("resultsExamCount");

    const questionCountElement =
        byId("resultsQuestionCount");

    const bestElement =
        byId("resultsBest");

    const scores =
        appData.results.map(
            result => Number(result.percentage)
        );

    const average =
        scores.length
            ? Math.round(
                scores.reduce((a, b) => a + b, 0) /
                scores.length
            )
            : 0;

    const best =
        scores.length
            ? Math.max(...scores)
            : 0;

    const questions =
        appData.results.reduce(
            (total, result) =>
                total + Number(result.total || 0),
            0
        );

    const exams =
        appData.results.filter(
            result => result.type === "Exam"
        ).length;


    if (averageElement) {
        averageElement.textContent =
            `${average}%`;
    }

    if (examCountElement) {
        examCountElement.textContent =
            exams;
    }

    if (questionCountElement) {
        questionCountElement.textContent =
            questions;
    }

    if (bestElement) {
        bestElement.textContent =
            `${best}%`;
    }


    const container =
        byId("resultsTable");

    if (!container) return;


    if (!appData.results.length) {

        container.innerHTML = `
            <div class="empty-state small">
                <div class="empty-icon">◒</div>
                <h4>No results yet</h4>
                <p>
                    Complete a practice session or exam
                    to see your results.
                </p>
            </div>
        `;

        return;
    }


    const sorted =
        [...appData.results].sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );


    container.innerHTML = `

        <table class="results-table">

            <thead>

                <tr>
                    <th>Assessment</th>
                    <th>Subject</th>
                    <th>Score</th>
                    <th>Correct</th>
                    <th>Date</th>
                </tr>

            </thead>

            <tbody>

                ${sorted.map(result => `

                    <tr>

                        <td>
                            ${escapeHTML(result.title)}
                        </td>

                        <td>
                            ${escapeHTML(result.subject || "-")}
                        </td>

                        <td>
                            <strong>
                                ${result.percentage}%
                            </strong>
                        </td>

                        <td>
                            ${result.correct}/${result.total}
                        </td>

                        <td>
                            ${formatDate(result.date)}
                        </td>

                    </tr>

                `).join("")}

            </tbody>

        </table>
    `;
}


/* ============================================================
   15. RESEARCH LAB
   ============================================================ */

function initializeResearch() {

    const researchButton =
        byId("researchButton");

    const input =
        byId("researchInput");

    const uploadButton =
        byId("uploadResearchButton");

    const fileInput =
        byId("researchFileInput");


    if (researchButton) {

        researchButton.addEventListener(
            "click",
            performResearch
        );
    }


    if (input) {

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    (event.ctrlKey || event.metaKey)
                ) {
                    performResearch();
                }
            }
        );
    }


    if (uploadButton && fileInput) {

        uploadButton.addEventListener(
            "click",
            () => fileInput.click()
        );


        fileInput.addEventListener(
            "change",
            event => {

                researchFiles =
                    Array.from(event.target.files || []);

                if (researchFiles.length) {

                    showToast(
                        `${researchFiles.length} document${
                            researchFiles.length === 1
                                ? ""
                                : "s"
                        } added.`,
                        "success"
                    );
                }
            }
        );
    }


    $$("[data-research-prompt]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const input =
                    byId("researchInput");

                if (!input) return;

                input.value =
                    button.dataset.researchPrompt;

                input.focus();
            }
        );
    });
}


function performResearch() {

    const input =
        byId("researchInput");

    const query =
        input?.value.trim();

    if (!query) {

        showToast(
            "Enter a research question first.",
            "error"
        );

        return;
    }


    const workspace =
        byId("researchWorkspace");

    if (!workspace) return;


    workspace.innerHTML = `

        <div class="research-answer">

            <span class="panel-label">
                RESEARCH QUERY
            </span>

            <h3>
                ${escapeHTML(query)}
            </h3>

            <p>
                ADAPT OS has prepared your research workspace.
            </p>


            <div class="research-research-actions">

                <button
                    class="primary-button"
                    id="searchWebButton"
                >
                    Search the Web →
                </button>

                <button
                    class="secondary-button"
                    id="searchWikipediaButton"
                >
                    Search Wikipedia
                </button>

                <button
                    class="secondary-button"
                    id="saveResearchButton"
                >
                    🔖 Save Research
                </button>

            </div>


            <div class="research-note">

                <strong>Important:</strong>

                <p>
                    The local ADAPT OS application can organize
                    your research, prepare searches and save your
                    work offline. Live web results require an
                    internet connection. A true AI research answer
                    requires an AI service/API; this app does not
                    pretend that local JavaScript is an AI model.
                </p>

            </div>

            ${
                researchFiles.length
                    ? `
                        <div class="research-files">

                            <strong>
                                Documents selected:
                            </strong>

                            <ul>
                                ${researchFiles.map(
                                    file =>
                                        `<li>${escapeHTML(file.name)}</li>`
                                ).join("")}
                            </ul>

                        </div>
                    `
                    : ""
            }

        </div>
    `;


    byId("searchWebButton")?.addEventListener(
        "click",
        () => {

            const url =
                `https://www.google.com/search?q=${
                    encodeURIComponent(query)
                }`;

            window.open(url, "_blank");
        }
    );


    byId("searchWikipediaButton")?.addEventListener(
        "click",
        () => {

            const url =
                `https://en.wikipedia.org/wiki/Special:Search?search=${
                    encodeURIComponent(query)
                }`;

            window.open(url, "_blank");
        }
    );


    byId("saveResearchButton")?.addEventListener(
        "click",
        () => {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        "adaptOS_savedResearch"
                    ) || "[]"
                );

            saved.unshift({

                id: createId(),

                query,

                date:
                    new Date().toISOString()

            });

            localStorage.setItem(
                "adaptOS_savedResearch",
                JSON.stringify(saved)
            );

            renderSavedResearch();

            showToast(
                "Research saved.",
                "success"
            );
        }
    );


    renderSavedResearch();
}


function renderSavedResearch() {

    const container =
        byId("savedResearchList");

    if (!container) return;


    const saved =
        JSON.parse(
            localStorage.getItem(
                "adaptOS_savedResearch"
            ) || "[]"
        );


    if (!saved.length) {

        container.innerHTML = `
            <div class="empty-state small">
                <div class="empty-icon">🔖</div>
                <h4>Nothing saved</h4>
                <p>Saved research will appear here.</p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        saved.map(item => `

            <div class="saved-research-item">

                <button
                    class="saved-research-open"
                    data-saved-query="${escapeAttribute(item.query)}"
                >
                    <strong>
                        ${escapeHTML(item.query)}
                    </strong>

                    <small>
                        ${formatDate(item.date)}
                    </small>
                </button>

                <button
                    class="text-button"
                    data-delete-research="${item.id}"
                >
                    ×
                </button>

            </div>

        `).join("");


    $$("[data-saved-query]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const input =
                    byId("researchInput");

                if (input) {
                    input.value =
                        button.dataset.savedQuery;
                }

                showPage("research");

                performResearch();
            }
        );
    });


    $$("[data-delete-research]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const id =
                    button.dataset.deleteResearch;

                const updated =
                    saved.filter(
                        item => item.id !== id
                    );

                localStorage.setItem(
                    "adaptOS_savedResearch",
                    JSON.stringify(updated)
                );

                renderSavedResearch();
            }
        );
    });
}


/* ============================================================
   16. NOTES
   ============================================================ */

function initializeNotes() {

    const newButton =
        byId("newNoteButton");

    const form =
        byId("noteForm");

    const search =
        byId("notesSearch");

    const category =
        byId("notesCategoryFilter");


    if (newButton) {

        newButton.addEventListener(
            "click",
            () => {

                form?.reset();

                openModal("noteModal");
            }
        );
    }


    if (form) {

        form.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                createNote();
            }
        );
    }


    search?.addEventListener(
        "input",
        renderNotes
    );

    category?.addEventListener(
        "change",
        renderNotes
    );
}


function createNote() {

    const title =
        byId("noteTitle")?.value.trim();

    const category =
        byId("noteCategory")?.value.trim() ||
        "General";

    const label =
        byId("noteColor")?.value ||
        "default";

    const content =
        byId("noteContent")?.value.trim();


    if (!title || !content) {

        showToast(
            "Please enter a title and note content.",
            "error"
        );

        return;
    }


    appData.notes.unshift({

        id: createId(),

        title,

        category,

        label,

        content,

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()
    });


    saveData();

    closeModal("noteModal");

    renderEverything();

    showToast(
        "Note saved successfully.",
        "success"
    );
}


function renderNotes() {

    const grid =
        byId("notesGrid");

    if (!grid) return;


    const search =
        byId("notesSearch")?.value
            .trim()
            .toLowerCase() || "";

    const category =
        byId("notesCategoryFilter")?.value ||
        "all";


    const categories =
        [
            ...new Set(
                appData.notes.map(
                    note => note.category
                )
            )
        ];


    const categoryFilter =
        byId("notesCategoryFilter");


    if (categoryFilter) {

        const current =
            categoryFilter.value;

        categoryFilter.innerHTML = `
            <option value="all">
                All Categories
            </option>
        `;

        categories.forEach(item => {

            const option =
                document.createElement("option");

            option.value = item;
            option.textContent = item;

            categoryFilter.appendChild(option);
        });

        if (
            categories.includes(current)
        ) {
            categoryFilter.value = current;
        }
    }


    let notes =
        appData.notes.filter(note => {

            const matchesSearch =
                !search ||
                note.title.toLowerCase().includes(search) ||
                note.content.toLowerCase().includes(search) ||
                note.category.toLowerCase().includes(search);

            const matchesCategory =
                category === "all" ||
                note.category === category;

            return matchesSearch && matchesCategory;
        });


    if (!notes.length) {

        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">▤</div>
                <h3>
                    ${
                        appData.notes.length
                            ? "No matching notes"
                            : "Your notebook is empty"
                    }
                </h3>
                <p>
                    ${
                        appData.notes.length
                            ? "Try another search or category."
                            : "Create your first note."
                    }
                </p>
            </div>
        `;

        return;
    }


    grid.innerHTML =
        notes.map(note => `

            <article class="note-card">

                <div class="note-card-header">

                    <span class="note-category">
                        ${escapeHTML(note.category)}
                    </span>

                    <button
                        class="text-button"
                        data-delete-note="${note.id}"
                    >
                        Delete
                    </button>

                </div>

                <h3>
                    ${escapeHTML(note.title)}
                </h3>

                <p>
                    ${escapeHTML(
                        truncate(note.content, 180)
                    )}
                </p>

                <small>
                    ${formatDate(note.updatedAt)}
                </small>

            </article>

        `).join("");


    $$("[data-delete-note]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const id =
                    button.dataset.deleteNote;

                appData.notes =
                    appData.notes.filter(
                        note => note.id !== id
                    );

                saveData();

                renderEverything();

                showToast(
                    "Note deleted.",
                    "success"
                );
            }
        );
    });
}


/* ============================================================
   17. PLANNER
   ============================================================ */

function initializePlanner() {

    byId("addPlannerEventButton")?.addEventListener(
        "click",
        () => {

            byId("plannerForm")?.reset();

            const dateInput =
                byId("plannerDate");

            if (dateInput) {
                dateInput.value =
                    dateKey(new Date());
            }

            openModal("plannerModal");
        }
    );


    byId("plannerForm")?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            createPlannerEvent();
        }
    );


    byId("previousMonth")?.addEventListener(
        "click",
        () => {

            calendarDate.setMonth(
                calendarDate.getMonth() - 1
            );

            renderCalendar();
        }
    );


    byId("nextMonth")?.addEventListener(
        "click",
        () => {

            calendarDate.setMonth(
                calendarDate.getMonth() + 1
            );

            renderCalendar();
        }
    );
}


function createPlannerEvent() {

    const title =
        byId("plannerTitle")?.value.trim();

    const date =
        byId("plannerDate")?.value;

    const time =
        byId("plannerTime")?.value;

    const type =
        byId("plannerType")?.value ||
        "study";


    if (!title || !date) {

        showToast(
            "Please enter an activity and date.",
            "error"
        );

        return;
    }


    appData.plannerEvents.push({

        id: createId(),

        title,

        date,

        time,

        type,

        createdAt:
            new Date().toISOString()
    });


    saveData();

    closeModal("plannerModal");

    renderEverything();

    showToast(
        "Activity added to your planner.",
        "success"
    );
}


function renderPlanner() {

    const list =
        byId("plannerEventList");

    if (!list) return;


    const events =
        [...appData.plannerEvents]
            .sort((a, b) => {

                const first =
                    `${a.date} ${a.time || "00:00"}`;

                const second =
                    `${b.date} ${b.time || "00:00"}`;

                return first.localeCompare(second);
            });


    if (!events.length) {

        list.innerHTML = `
            <div class="empty-state small">
                <div class="empty-icon">□</div>
                <h4>No scheduled activities</h4>
                <p>Add something to your planner.</p>
            </div>
        `;

        return;
    }


    list.innerHTML =
        events.map(event => `

            <div class="planner-event">

                <div class="planner-event-date">
                    <strong>
                        ${formatShortDate(event.date)}
                    </strong>

                    <small>
                        ${escapeHTML(event.time || "Any time")}
                    </small>
                </div>

                <div class="planner-event-info">

                    <strong>
                        ${escapeHTML(event.title)}
                    </strong>

                    <span>
                        ${escapeHTML(event.type)}
                    </span>

                </div>

                <button
                    class="text-button"
                    data-delete-event="${event.id}"
                >
                    Delete
                </button>

            </div>

        `).join("");


    $$("[data-delete-event]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const id =
                    button.dataset.deleteEvent;

                appData.plannerEvents =
                    appData.plannerEvents.filter(
                        event => event.id !== id
                    );

                saveData();

                renderEverything();

                showToast(
                    "Activity removed.",
                    "success"
                );
            }
        );
    });
}


function renderCalendar() {

    const grid =
        byId("calendarGrid");

    const heading =
        byId("calendarMonth");

    if (!grid || !heading) return;


    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    heading.textContent =
        calendarDate.toLocaleDateString(
            undefined,
            {
                month: "long",
                year: "numeric"
            }
        );


    const firstDay =
        new Date(year, month, 1).getDay();

    const daysInMonth =
        new Date(year, month + 1, 0).getDate();


    grid.innerHTML = "";


    for (let i = 0; i < firstDay; i++) {

        const blank =
            document.createElement("div");

        blank.className =
            "calendar-day empty";

        grid.appendChild(blank);
    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const cell =
            document.createElement("div");

        cell.className =
            "calendar-day";


        const key =
            dateKey(
                new Date(year, month, day)
            );


        if (
            key ===
            dateKey(new Date())
        ) {
            cell.classList.add("today");
        }


        const events =
            appData.plannerEvents.filter(
                event => event.date === key
            );


        cell.innerHTML = `

            <span class="calendar-day-number">
                ${day}
            </span>

            ${
                events
                    .slice(0, 3)
                    .map(event =>
                        `
                            <span class="calendar-event">
                                ${escapeHTML(event.title)}
                            </span>
                        `
                    )
                    .join("")
            }

        `;


        grid.appendChild(cell);
    }
}


/* ============================================================
   18. FOCUS MODE
   ============================================================ */

function initializeFocusMode() {

    byId("focusStart")?.addEventListener(
        "click",
        toggleFocus
    );


    byId("focusReset")?.addEventListener(
        "click",
        resetFocus
    );


    $$("[data-focus-minutes]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                if (focusRunning) {

                    showToast(
                        "Stop the current focus session before changing the timer.",
                        "error"
                    );

                    return;
                }


                selectedFocusMinutes =
                    Number(
                        button.dataset.focusMinutes
                    );

                focusSecondsRemaining =
                    selectedFocusMinutes * 60;


                $$("[data-focus-minutes]").forEach(
                    item => {
                        item.classList.toggle(
                            "active",
                            item === button
                        );
                    }
                );


                updateFocusDisplay();
            }
        );
    });


    updateFocusDisplay();
}


function toggleFocus() {

    if (focusRunning) {

        pauseFocus();

    } else {

        startFocus();
    }
}


function startFocus() {

    if (focusSecondsRemaining <= 0) {

        focusSecondsRemaining =
            selectedFocusMinutes * 60;
    }


    focusRunning = true;

    focusStartedAt = Date.now();

    const startButton =
        byId("focusStart");

    const status =
        byId("focusStatus");


    if (startButton) {
        startButton.textContent =
            "Pause Focus";
    }

    if (status) {
        status.textContent =
            "Focus session running";
    }


    clearInterval(focusInterval);


    focusInterval =
        setInterval(() => {

            focusSecondsRemaining--;

            updateFocusDisplay();


            if (focusSecondsRemaining <= 0) {

                finishFocus();
            }

        }, 1000);
}


function pauseFocus() {

    clearInterval(focusInterval);

    focusInterval = null;

    focusRunning = false;

    const button =
        byId("focusStart");

    const status =
        byId("focusStatus");

    if (button) {
        button.textContent =
            "Resume Focus";
    }

    if (status) {
        status.textContent =
            "Focus paused";
    }
}


function finishFocus() {

    clearInterval(focusInterval);

    focusInterval = null;

    focusRunning = false;


    appData.focusSessions.push({

        id: createId(),

        minutes:
            selectedFocusMinutes,

        date:
            new Date().toISOString()
    });


    const key =
        dateKey(new Date());

    appData.activity[key] =
        Number(appData.activity[key] || 0) +
        selectedFocusMinutes;


    saveData();


    focusSecondsRemaining =
        selectedFocusMinutes * 60;


    updateFocusDisplay();

    updateDashboardStatistics();

    renderAnalytics();


    const button =
        byId("focusStart");

    const status =
        byId("focusStatus");


    if (button) {
        button.textContent =
            "Start Focus";
    }

    if (status) {
        status.textContent =
            "Focus session complete!";
    }


    showToast(
        "Focus session complete. Great work!",
        "success"
    );
}


function resetFocus() {

    clearInterval(focusInterval);

    focusInterval = null;

    focusRunning = false;

    focusSecondsRemaining =
        selectedFocusMinutes * 60;

    updateFocusDisplay();


    const button =
        byId("focusStart");

    const status =
        byId("focusStatus");


    if (button) {
        button.textContent =
            "Start Focus";
    }

    if (status) {
        status.textContent =
            "Ready to focus";
    }
}


function updateFocusDisplay() {

    const timer =
        byId("focusTimer");

    if (!timer) return;

    timer.textContent =
        formatTime(focusSecondsRemaining);
}


/* ============================================================
   19. STUDENT TOOLBOX
   ============================================================ */

function initializeToolbox() {

    $$("[data-tool]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                openTool(
                    button.dataset.tool
                );
            }
        );
    });
}


function openTool(tool) {

    const title =
        byId("toolModalTitle");

    const workspace =
        byId("toolWorkspace");


    if (!title || !workspace) return;


    const tools = {

        calculator: {
            title: "Calculator",
            render: renderCalculator
        },

        "unit-converter": {
            title: "Unit Converter",
            render: renderUnitConverter
        },

        percentage: {
            title: "Percentage Calculator",
            render: renderPercentage
        },

        stopwatch: {
            title: "Stopwatch",
            render: renderStopwatch
        },

        "word-counter": {
            title: "Word Counter",
            render: renderWordCounter
        },

        "formula-reference": {
            title: "Formula Reference",
            render: renderFormulaReference
        },

        randomizer: {
            title: "Randomizer",
            render: renderRandomizer
        },

        "text-tools": {
            title: "Text Tools",
            render: renderTextTools
        }

    };


    const selected =
        tools[tool];


    if (!selected) return;


    title.textContent =
        selected.title;

    workspace.innerHTML = "";

    selected.render(workspace);

    openModal("toolModal");
}


/* ============================================================
   20. CALCULATOR
   ============================================================ */

function renderCalculator(workspace) {

    workspace.innerHTML = `

        <div class="tool-calculator">

            <input
                type="text"
                id="calculatorDisplay"
                placeholder="0"
                readonly
            >

            <div class="calculator-buttons">

                ${[
                    "7", "8", "9", "/",
                    "4", "5", "6", "*",
                    "1", "2", "3", "-",
                    "0", ".", "C", "+",
                    "(", ")", "%"
                ].map(value => `
                    <button
                        type="button"
                        data-calc="${value}"
                    >
                        ${value}
                    </button>
                `).join("")}

                <button
                    type="button"
                    class="primary-button"
                    data-calc-equals
                >
                    =
                </button>

            </div>

        </div>
    `;


    const display =
        byId("calculatorDisplay");


    $$("[data-calc]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const value =
                    button.dataset.calc;


                if (value === "C") {

                    display.value = "";

                    return;
                }


                display.value += value;
            }
        );
    });


    $("[data-calc-equals]")?.addEventListener(
        "click",
        () => {

            try {

                const expression =
                    display.value;


                if (
                    !/^[0-9+\-*/().%\s]+$/.test(
                        expression
                    )
                ) {
                    throw new Error();
                }


                const result =
                    Function(
                        `"use strict"; return (${expression})`
                    )();


                if (
                    typeof result !== "number" ||
                    !Number.isFinite(result)
                ) {
                    throw new Error();
                }


                display.value =
                    String(result);

            } catch {

                display.value =
                    "Error";
            }
        }
    );
}


/* ============================================================
   21. UNIT CONVERTER
   ============================================================ */

function renderUnitConverter(workspace) {

    workspace.innerHTML = `

        <div class="form-group">

            <label>
                Value
            </label>

            <input
                type="number"
                id="convertValue"
                placeholder="Enter value"
            >

        </div>


        <div class="form-group">

            <label>
                Conversion
            </label>

            <select id="conversionType">

                <option value="km-miles">
                    Kilometres → Miles
                </option>

                <option value="miles-km">
                    Miles → Kilometres
                </option>

                <option value="kg-lb">
                    Kilograms → Pounds
                </option>

                <option value="lb-kg">
                    Pounds → Kilograms
                </option>

                <option value="c-f">
                    Celsius → Fahrenheit
                </option>

                <option value="f-c">
                    Fahrenheit → Celsius
                </option>

                <option value="m-cm">
                    Metres → Centimetres
                </option>

                <option value="cm-m">
                    Centimetres → Metres
                </option>

            </select>

        </div>


        <button
            class="primary-button"
            id="convertButton"
        >
            Convert
        </button>


        <div
            class="tool-result"
            id="conversionResult"
        >
            Enter a value to begin.
        </div>
    `;


    byId("convertButton")?.addEventListener(
        "click",
        () => {

            const value =
                Number(
                    byId("convertValue").value
                );

            const type =
                byId("conversionType").value;


            if (Number.isNaN(value)) {

                showToast(
                    "Enter a valid number.",
                    "error"
                );

                return;
            }


            let result;


            switch (type) {

                case "km-miles":
                    result = value * 0.621371;
                    break;

                case "miles-km":
                    result = value * 1.609344;
                    break;

                case "kg-lb":
                    result = value * 2.2046226218;
                    break;

                case "lb-kg":
                    result = value * 0.45359237;
                    break;

                case "c-f":
                    result = (value * 9 / 5) + 32;
                    break;

                case "f-c":
                    result = (value - 32) * 5 / 9;
                    break;

                case "m-cm":
                    result = value * 100;
                    break;

                case "cm-m":
                    result = value / 100;
                    break;
            }


            byId("conversionResult").textContent =
                Number(result.toFixed(6));
        }
    );
}


/* ============================================================
   22. PERCENTAGE
   ============================================================ */

function renderPercentage(workspace) {

    workspace.innerHTML = `

        <div class="form-group">

            <label>
                Percentage
            </label>

            <input
                type="number"
                id="percentageValue"
                placeholder="e.g. 20"
            >

        </div>


        <div class="form-group">

            <label>
                Of
            </label>

            <input
                type="number"
                id="percentageOf"
                placeholder="e.g. 500"
            >

        </div>


        <button
            class="primary-button"
            id="percentageCalculate"
        >
            Calculate
        </button>


        <div
            class="tool-result"
            id="percentageResult"
        >
            Result will appear here.
        </div>
    `;


    byId("percentageCalculate")?.addEventListener(
        "click",
        () => {

            const percentage =
                Number(
                    byId("percentageValue").value
                );

            const value =
                Number(
                    byId("percentageOf").value
                );


            if (
                Number.isNaN(percentage) ||
                Number.isNaN(value)
            ) {

                showToast(
                    "Enter both numbers.",
                    "error"
                );

                return;
            }


            const result =
                (percentage / 100) * value;


            byId("percentageResult").textContent =
                `${percentage}% of ${value} = ${result}`;
        }
    );
}


/* ============================================================
   23. STOPWATCH
   ============================================================ */

function renderStopwatch(workspace) {

    workspace.innerHTML = `

        <div class="stopwatch-workspace">

            <div
                class="tool-result"
                id="stopwatchDisplay"
            >
                00:00:00
            </div>


            <div class="modal-actions">

                <button
                    class="secondary-button"
                    id="stopwatchReset"
                >
                    Reset
                </button>

                <button
                    class="primary-button"
                    id="stopwatchToggle"
                >
                    Start
                </button>

            </div>

        </div>
    `;


    stopwatchSeconds = 0;
    stopwatchRunning = false;

    clearInterval(stopwatchInterval);


    const display =
        byId("stopwatchDisplay");

    const toggle =
        byId("stopwatchToggle");


    toggle?.addEventListener(
        "click",
        () => {

            if (stopwatchRunning) {

                clearInterval(
                    stopwatchInterval
                );

                stopwatchRunning = false;

                toggle.textContent = "Start";

            } else {

                stopwatchRunning = true;

                toggle.textContent = "Pause";

                stopwatchInterval =
                    setInterval(() => {

                        stopwatchSeconds++;

                        display.textContent =
                            formatTime(
                                stopwatchSeconds
                            );

                    }, 1000);
            }
        }
    );


    byId("stopwatchReset")?.addEventListener(
        "click",
        () => {

            clearInterval(
                stopwatchInterval
            );

            stopwatchSeconds = 0;

            stopwatchRunning = false;

            display.textContent =
                "00:00:00";

            toggle.textContent =
                "Start";
        }
    );
}


/* ============================================================
   24. WORD COUNTER
   ============================================================ */

function renderWordCounter(workspace) {

    workspace.innerHTML = `

        <div class="form-group">

            <label>
                Enter or paste text
            </label>

            <textarea
                id="counterText"
                rows="8"
                placeholder="Type your text here..."
            ></textarea>

        </div>


        <div class="tool-result">

            <p>
                Words:
                <strong id="counterWords">0</strong>
            </p>

            <p>
                Characters:
                <strong id="counterCharacters">0</strong>
            </p>

            <p>
                Sentences:
                <strong id="counterSentences">0</strong>
            </p>

        </div>
    `;


    byId("counterText")?.addEventListener(
        "input",
        () => {

            const text =
                byId("counterText").value;


            const words =
                text.trim()
                    ? text.trim().split(/\s+/).length
                    : 0;


            const characters =
                text.length;


            const sentences =
                text.trim()
                    ? (
                        text.match(/[.!?]+/g) || []
                    ).length
                    : 0;


            byId("counterWords").textContent =
                words;

            byId("counterCharacters").textContent =
                characters;

            byId("counterSentences").textContent =
                sentences;
        }
    );
}


/* ============================================================
   25. FORMULA REFERENCE
   ============================================================ */

function renderFormulaReference(workspace) {

    workspace.innerHTML = `

        <div class="formula-list">

            <article>
                <strong>Speed</strong>
                <p>Speed = Distance ÷ Time</p>
            </article>

            <article>
                <strong>Density</strong>
                <p>Density = Mass ÷ Volume</p>
            </article>

            <article>
                <strong>Force</strong>
                <p>Force = Mass × Acceleration</p>
            </article>

            <article>
                <strong>Percentage</strong>
                <p>Percentage = (Part ÷ Whole) × 100</p>
            </article>

            <article>
                <strong>Area of a rectangle</strong>
                <p>Area = Length × Width</p>
            </article>

            <article>
                <strong>Area of a triangle</strong>
                <p>Area = ½ × Base × Height</p>
            </article>

            <article>
                <strong>Simple Interest</strong>
                <p>SI = (P × R × T) ÷ 100</p>
            </article>

            <article>
                <strong>Ohm's Law</strong>
                <p>V = I × R</p>
            </article>

        </div>
    `;
}


/* ============================================================
   26. RANDOMIZER
   ============================================================ */

function renderRandomizer(workspace) {

    workspace.innerHTML = `

        <div class="form-group">

            <label>
                Minimum
            </label>

            <input
                type="number"
                id="randomMin"
                value="1"
            >

        </div>


        <div class="form-group">

            <label>
                Maximum
            </label>

            <input
                type="number"
                id="randomMax"
                value="100"
            >

        </div>


        <button
            class="primary-button"
            id="generateRandom"
        >
            Generate
        </button>


        <div
            class="tool-result"
            id="randomResult"
        >
            —
        </div>
    `;


    byId("generateRandom")?.addEventListener(
        "click",
        () => {

            const min =
                Number(
                    byId("randomMin").value
                );

            const max =
                Number(
                    byId("randomMax").value
                );


            if (
                Number.isNaN(min) ||
                Number.isNaN(max) ||
                min > max
            ) {

                showToast(
                    "Enter a valid minimum and maximum.",
                    "error"
                );

                return;
            }


            const random =
                Math.floor(
                    Math.random() *
                    (max - min + 1)
                ) + min;


            byId("randomResult").textContent =
                random;
        }
    );
}


/* ============================================================
   27. TEXT TOOLS
   ============================================================ */

function renderTextTools(workspace) {

    workspace.innerHTML = `

        <div class="form-group">

            <label>
                Text
            </label>

            <textarea
                id="textToolInput"
                rows="8"
                placeholder="Enter text..."
            ></textarea>

        </div>


        <div class="modal-actions">

            <button
                class="secondary-button"
                id="uppercaseText"
            >
                UPPERCASE
            </button>

            <button
                class="secondary-button"
                id="lowercaseText"
            >
                lowercase
            </button>

            <button
                class="secondary-button"
                id="reverseText"
            >
                Reverse
            </button>

        </div>
    `;


    const input =
        byId("textToolInput");


    byId("uppercaseText")?.addEventListener(
        "click",
        () => {
            input.value =
                input.value.toUpperCase();
        }
    );


    byId("lowercaseText")?.addEventListener(
        "click",
        () => {
            input.value =
                input.value.toLowerCase();
        }
    );


    byId("reverseText")?.addEventListener(
        "click",
        () => {
            input.value =
                [...input.value]
                    .reverse()
                    .join("");
        }
    );
}


/* ============================================================
   28. CODE LAB
   ============================================================ */

function initializeCodeLab() {

    $$("[data-editor]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                switchCodeEditor(
                    button.dataset.editor
                );
            }
        );
    });


    byId("runCodeButton")?.addEventListener(
        "click",
        runCode
    );


    byId("refreshPreview")?.addEventListener(
        "click",
        runCode
    );


    const html =
        byId("htmlEditor");

    const css =
        byId("cssEditor");

    const js =
        byId("jsEditor");


    [html, css, js].forEach(editor => {

        editor?.addEventListener(
            "input",
            saveCodeDraft
        );
    });


    loadCodeDraft();

    runCode();
}


function switchCodeEditor(tab) {

    currentCodeTab = tab;


    $$("[data-editor]").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.editor === tab
        );
    });


    const editors = {

        html: byId("htmlEditor"),

        css: byId("cssEditor"),

        js: byId("jsEditor")
    };


    Object.entries(editors).forEach(
        ([name, editor]) => {

            if (!editor) return;

            editor.classList.toggle(
                "hidden",
                name !== tab
            );
        }
    );
}


function runCode() {

    const html =
        byId("htmlEditor")?.value || "";

    const css =
        byId("cssEditor")?.value || "";

    const js =
        byId("jsEditor")?.value || "";


    const preview =
        byId("codePreview");

    if (!preview) return;


    preview.srcdoc = `

        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <style>
                ${css}
            </style>

        </head>

        <body>

            ${html}

            <script>
                ${js.replace(
                    /<\/script/gi,
                    "<\\\\/script"
                )}
            <\/script>

        </body>

        </html>
    `;


    showToast(
        "Code preview updated.",
        "success"
    );
}


function saveCodeDraft() {

    const code = {

        html:
            byId("htmlEditor")?.value || "",

        css:
            byId("cssEditor")?.value || "",

        js:
            byId("jsEditor")?.value || ""
    };


    localStorage.setItem(
        "adaptOS_codeDraft",
        JSON.stringify(code)
    );
}


function loadCodeDraft() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    "adaptOS_codeDraft"
                ) || "null"
            );


        if (!saved) return;


        if (byId("htmlEditor") && saved.html) {
            byId("htmlEditor").value =
                saved.html;
        }

        if (byId("cssEditor") && saved.css) {
            byId("cssEditor").value =
                saved.css;
        }

        if (byId("jsEditor") && saved.js) {
            byId("jsEditor").value =
                saved.js;
        }

    } catch (error) {

        console.warn(
            "Could not load code draft."
        );
    }
}


/* ============================================================
   29. FILE CENTER
   ============================================================ */

function initializeFileCenter() {

    const choose =
        byId("chooseFilesButton");

    const input =
        byId("fileInput");

    const dropZone =
        byId("fileDropZone");


    choose?.addEventListener(
        "click",
        () => input?.click()
    );


    input?.addEventListener(
        "change",
        event => {

            handleSelectedFiles(
                Array.from(
                    event.target.files || []
                )
            );
        }
    );


    if (dropZone) {

        dropZone.addEventListener(
            "dragover",
            event => {

                event.preventDefault();

                dropZone.classList.add(
                    "dragging"
                );
            }
        );


        dropZone.addEventListener(
            "dragleave",
            () => {

                dropZone.classList.remove(
                    "dragging"
                );
            }
        );


        dropZone.addEventListener(
            "drop",
            event => {

                event.preventDefault();

                dropZone.classList.remove(
                    "dragging"
                );

                handleSelectedFiles(
                    Array.from(
                        event.dataTransfer.files || []
                    )
                );
            }
        );


        dropZone.addEventListener(
            "click",
            () => input?.click()
        );
    }
}


function handleSelectedFiles(files) {

    if (!files.length) return;


    files.forEach(file => {

        const alreadyExists =
            appData.files.some(
                item =>
                    item.name === file.name &&
                    item.size === file.size
            );


        if (!alreadyExists) {

            appData.files.push({

                id: createId(),

                name: file.name,

                size: file.size,

                type: file.type,

                lastModified:
                    file.lastModified,

                addedAt:
                    new Date().toISOString()
            });
        }
    });


    saveData();

    renderFileList();

    showToast(
        `${files.length} file${
            files.length === 1 ? "" : "s"
        } added.`,
        "success"
    );
}


function renderFileList() {

    const list =
        byId("fileList");

    if (!list) return;


    if (!appData.files.length) {

        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">▱</div>
                <h3>No files selected</h3>
                <p>
                    Your selected files will appear here.
                </p>
            </div>
        `;

        return;
    }


    list.innerHTML =
        appData.files.map(file => `

            <div class="file-item">

                <div class="file-icon">
                    📄
                </div>

                <div class="file-info">

                    <strong>
                        ${escapeHTML(file.name)}
                    </strong>

                    <small>
                        ${formatBytes(file.size)}
                    </small>

                </div>

                <button
                    class="text-button"
                    data-remove-file="${file.id}"
                >
                    Remove
                </button>

            </div>

        `).join("");


    $$("[data-remove-file]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const id =
                    button.dataset.removeFile;

                appData.files =
                    appData.files.filter(
                        file => file.id !== id
                    );

                saveData();

                renderFileList();

                showToast(
                    "File removed from File Center.",
                    "success"
                );
            }
        );
    });
}


/* ============================================================
   30. ANALYTICS
   ============================================================ */

function initializeAnalytics() {

    renderAnalytics();
}


function renderAnalytics() {

    const sessions =
        appData.focusSessions.length;

    const minutes =
        appData.focusSessions.reduce(
            (total, session) =>
                total + Number(session.minutes || 0),
            0
        );

    const completed =
        appData.assignments.filter(
            assignment => assignment.completed
        ).length;

    const scores =
        appData.results.map(
            result => Number(result.percentage)
        );

    const average =
        scores.length
            ? Math.round(
                scores.reduce((a, b) => a + b, 0) /
                scores.length
            )
            : 0;


    byId("analyticsSessions").textContent =
        sessions;

    byId("analyticsStudyTime").textContent =
        formatHours(minutes);

    byId("analyticsTasks").textContent =
        completed;

    byId("analyticsScore").textContent =
        `${average}%`;


    renderActivityChart();

    renderSubjectAnalytics();
}


function renderActivityChart() {

    const chart =
        byId("activityChart");

    if (!chart) return;


    const days = [];

    for (let i = 6; i >= 0; i--) {

        const date =
            new Date();

        date.setDate(
            date.getDate() - i
        );

        const key =
            dateKey(date);

        days.push({

            key,

            label:
                date.toLocaleDateString(
                    undefined,
                    {
                        weekday: "short"
                    }
                ),

            value:
                Number(
                    appData.activity[key] || 0
                )
        });
    }


    const maximum =
        Math.max(
            1,
            ...days.map(day => day.value)
        );


    chart.innerHTML = `

        <div class="activity-bars">

            ${days.map(day => `

                <div class="activity-bar-item">

                    <div class="activity-bar-track">

                        <span
                            class="activity-bar"
                            style="height:${
                                Math.max(
                                    4,
                                    (day.value / maximum) * 100
                                )
                            }%"
                            title="${day.value} minutes"
                        ></span>

                    </div>

                    <small>
                        ${day.label}
                    </small>

                </div>

            `).join("")}

        </div>
    `;
}


function renderSubjectAnalytics() {

    const container =
        byId("subjectAnalytics");

    if (!container) return;


    if (!appData.subjects.length) {

        container.innerHTML = `
            <div class="empty-state small">
                <div class="empty-icon">◒</div>
                <h4>No data yet</h4>
                <p>
                    Complete learning activities
                    to generate analytics.
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        appData.subjects.map(subject => `

            <div class="subject-analytics-item">

                <div class="progress-meta">

                    <span>
                        ${escapeHTML(subject.name)}
                    </span>

                    <strong>
                        ${Number(subject.progress || 0)}%
                    </strong>

                </div>

                <div class="progress-track">

                    <span
                        class="progress-fill"
                        style="width:${
                            Number(subject.progress || 0)
                        }%"
                    ></span>

                </div>

            </div>

        `).join("");
}


/* ============================================================
   31. SETTINGS
   ============================================================ */

function initializeSettings() {

    byId("themeSelect")?.addEventListener(
        "change",
        event => {

            appData.settings.theme =
                event.target.value;

            saveData();

            applySettings();
        }
    );


    byId("compactMode")?.addEventListener(
        "change",
        event => {

            appData.settings.compact =
                event.target.checked;

            saveData();

            applySettings();
        }
    );


    byId("assignmentNotifications")?.addEventListener(
        "change",
        event => {

            appData.settings.assignmentNotifications =
                event.target.checked;

            saveData();
        }
    );


    byId("studyNotifications")?.addEventListener(
        "change",
        event => {

            appData.settings.studyNotifications =
                event.target.checked;

            saveData();
        }
    );


    byId("saveProfileButton")?.addEventListener(
        "click",
        saveProfile
    );


    byId("exportDataButton")?.addEventListener(
        "click",
        exportData
    );


    byId("importDataButton")?.addEventListener(
        "click",
        () => {
            byId("importDataInput")?.click();
        }
    );


    byId("importDataInput")?.addEventListener(
        "change",
        importData
    );


    byId("clearDataButton")?.addEventListener(
        "click",
        clearApplicationData
    );


    $$("[data-settings-section]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const section =
                    button.dataset.settingsSection;

                showSettingsSection(section);
            }
        );
    });
}


function showSettingsSection(section) {

    $$("[data-settings-section]").forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.settingsSection === section
            );
        }
    );


    $$("[data-settings-content]").forEach(
        content => {

            content.classList.toggle(
                "active",
                content.dataset.settingsContent === section
            );
        }
    );
}


function applySettings() {

    const theme =
        appData.settings.theme;


    document.body.classList.remove(
        "light-theme"
    );


    if (theme === "light") {

        document.body.classList.add(
            "light-theme"
        );

    } else if (theme === "system") {

        if (
            window.matchMedia &&
            window.matchMedia(
                "(prefers-color-scheme: light)"
            ).matches
        ) {
            document.body.classList.add(
                "light-theme"
            );
        }
    }


    document.body.classList.toggle(
        "compact-mode",
        Boolean(
            appData.settings.compact
        )
    );


    const themeSelect =
        byId("themeSelect");

    const compact =
        byId("compactMode");

    const assignmentNotifications =
        byId("assignmentNotifications");

    const studyNotifications =
        byId("studyNotifications");


    if (themeSelect) {
        themeSelect.value =
            theme;
    }

    if (compact) {
        compact.checked =
            Boolean(
                appData.settings.compact
            );
    }

    if (assignmentNotifications) {
        assignmentNotifications.checked =
            Boolean(
                appData.settings.assignmentNotifications
            );
    }

    if (studyNotifications) {
        studyNotifications.checked =
            Boolean(
                appData.settings.studyNotifications
            );
    }
}


function saveProfile() {

    const name =
        byId("studentName")?.value.trim();

    const classLevel =
        byId("studentClass")?.value.trim();


    appData.profile.name =
        name || "Student";

    appData.profile.classLevel =
        classLevel || "";


    saveData();

    renderProfile();

    showToast(
        "Profile saved successfully.",
        "success"
    );
}


function exportData() {

    const data =
        JSON.stringify(
            appData,
            null,
            2
        );


    const blob =
        new Blob(
            [data],
            {
                type: "application/json"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        "adapt-os-data.json";


    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);


    showToast(
        "Your ADAPT OS data has been exported.",
        "success"
    );
}


function importData(event) {

    const file =
        event.target.files?.[0];

    if (!file) return;


    const reader =
        new FileReader();


    reader.onload = () => {

        try {

            const imported =
                JSON.parse(
                    reader.result
                );


            if (
                !imported ||
                typeof imported !== "object"
            ) {
                throw new Error();
            }


            appData = {

                ...JSON.parse(
                    JSON.stringify(DEFAULT_DATA)
                ),

                ...imported,

                settings: {

                    ...DEFAULT_DATA.settings,

                    ...(imported.settings || {})
                }
            };


            saveData();

            renderEverything();

            applySettings();


            showToast(
                "Data imported successfully.",
                "success"
            );

        } catch {

            showToast(
                "The selected file is not valid ADAPT OS data.",
                "error"
            );
        }
    };


    reader.readAsText(file);

    event.target.value = "";
}


function clearApplicationData() {

    const confirmed =
        window.confirm(
            "This will delete your locally stored ADAPT OS data. Continue?"
        );


    if (!confirmed) return;


    localStorage.removeItem(
        STORAGE_KEY
    );

    localStorage.removeItem(
        "adaptOS_savedResearch"
    );

    localStorage.removeItem(
        "adaptOS_codeDraft"
    );


    appData =
        JSON.parse(
            JSON.stringify(DEFAULT_DATA)
        );


    renderEverything();

    applySettings();

    showPage("dashboard");


    showToast(
        "Application data cleared.",
        "success"
    );
}


/* ============================================================
   32. SEARCH
   ============================================================ */

function initializeSearch() {

    byId("globalSearchButton")?.addEventListener(
        "click",
        () => {

            openModal("searchModal");

            setTimeout(
                () => {
                    byId("globalSearchInput")?.focus();
                },
                100
            );
        }
    );


    byId("globalSearchInput")?.addEventListener(
        "input",
        renderSearchResults
    );
}


function renderSearchResults() {

    const input =
        byId("globalSearchInput");

    const results =
        byId("globalSearchResults");

    if (!input || !results) return;


    const query =
        input.value.trim().toLowerCase();


    if (!query) {

        results.innerHTML = `
            <div class="empty-state small">
                <div class="empty-icon">⌕</div>
                <h4>Start searching</h4>
                <p>
                    Results will appear here.
                </p>
            </div>
        `;

        return;
    }


    const matches = [];


    appData.subjects.forEach(subject => {

        if (
            subject.name.toLowerCase().includes(query) ||
            (subject.description || "")
                .toLowerCase()
                .includes(query)
        ) {

            matches.push({

                type: "Subject",

                title: subject.name,

                description:
                    subject.description ||
                    "Subject",

                page: "subjects"
            });
        }
    });


    appData.assignments.forEach(assignment => {

        if (
            assignment.title
                .toLowerCase()
                .includes(query) ||
            assignment.subject
                .toLowerCase()
                .includes(query)
        ) {

            matches.push({

                type: "Assignment",

                title: assignment.title,

                description:
                    assignment.subject,

                page: "assignments"
            });
        }
    });


    appData.notes.forEach(note => {

        if (
            note.title
                .toLowerCase()
                .includes(query) ||
            note.content
                .toLowerCase()
                .includes(query)
        ) {

            matches.push({

                type: "Note",

                title: note.title,

                description:
                    truncate(note.content, 100),

                page: "notes"
            });
        }
    });


    if (!matches.length) {

        results.innerHTML = `
            <div class="empty-state small">
                <div class="empty-icon">⌕</div>
                <h4>No results found</h4>
                <p>
                    Try a different search.
                </p>
            </div>
        `;

        return;
    }


    results.innerHTML =
        matches.slice(0, 20).map(
            (match, index) => `

                <button
                    class="global-search-result"
                    data-search-page="${match.page}"
                >

                    <span>
                        ${escapeHTML(match.type)}
                    </span>

                    <strong>
                        ${escapeHTML(match.title)}
                    </strong>

                    <small>
                        ${escapeHTML(match.description)}
                    </small>

                </button>

            `
        ).join("");


    $$("[data-search-page]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const page =
                    button.dataset.searchPage;

                closeModal("searchModal");

                showPage(page);
            }
        );
    });
}


/* ============================================================
   33. NOTIFICATIONS
   ============================================================ */

function initializeNotifications() {

    byId("notificationButton")?.addEventListener(
        "click",
        toggleNotifications
    );


    byId("markNotificationsRead")?.addEventListener(
        "click",
        () => {

            appData.notifications =
                appData.notifications.map(
                    notification => ({
                        ...notification,
                        read: true
                    })
                );

            saveData();

            renderNotifications();

            showToast(
                "Notifications marked as read.",
                "success"
            );
        }
    );


    document.addEventListener(
        "click",
        event => {

            const panel =
                byId("notificationPanel");

            const button =
                byId("notificationButton");

            if (!panel || !button) return;


            if (
                panel.classList.contains("open") &&
                !panel.contains(event.target) &&
                !button.contains(event.target)
            ) {

                closeNotifications();
            }
        }
    );
}


function toggleNotifications() {

    const panel =
        byId("notificationPanel");

    if (!panel) return;


    if (panel.classList.contains("open")) {

        closeNotifications();

    } else {

        panel.classList.add("open");

        panel.setAttribute(
            "aria-hidden",
            "false"
        );
    }
}


function closeNotifications() {

    const panel =
        byId("notificationPanel");

    if (!panel) return;

    panel.classList.remove("open");

    panel.setAttribute(
        "aria-hidden",
        "true"
    );
}


function renderNotifications() {

    const list =
        byId("notificationList");

    if (!list) return;


    const notifications =
        [...appData.notifications]
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            );


    if (!notifications.length) {

        list.innerHTML = `
            <div class="empty-state small">
                <div class="empty-icon">♢</div>
                <h4>You're all caught up</h4>
                <p>
                    New notifications will appear here.
                </p>
            </div>
        `;

        return;
    }


    list.innerHTML =
        notifications.map(
            notification => `

                <div
                    class="notification-item ${
                        notification.read
                            ? ""
                            : "unread"
                    }"
                >

                    <div class="notification-icon">
                        !
                    </div>

                    <div class="notification-content">

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
                            ${formatDate(
                                notification.date
                            )}
                        </small>

                    </div>

                </div>

            `
        ).join("");


    const unread =
        notifications.filter(
            notification => !notification.read
        ).length;


    const dot =
        $(".notification-dot");

    if (dot) {
        dot.style.display =
            unread ? "block" : "none";
    }
}


/* ============================================================
   34. PROFILE MENU
   ============================================================ */

function initializeProfileMenu() {

    const profileButton =
        $(".profile-menu");

    const topAvatar =
        byId("topbarAvatar");


    profileButton?.addEventListener(
        "click",
        () => {
            showPage("settings");
            showSettingsSection("profile");
        }
    );


    topAvatar?.addEventListener(
        "click",
        () => {
            showPage("settings");
            showSettingsSection("profile");
        }
    );
}


/* ============================================================
   35. TOAST SYSTEM
   ============================================================ */

function showToast(message, type = "info") {

    const container =
        byId("toastContainer");

    if (!container) return;


    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;


    const icon =
        type === "success"
            ? "✓"
            : type === "error"
                ? "!"
                : "i";


    toast.innerHTML = `

        <span class="toast-icon">
            ${icon}
        </span>

        <span>
            ${escapeHTML(message)}
        </span>
    `;


    container.appendChild(toast);


    setTimeout(
        () => {

            toast.classList.add(
                "removing"
            );

            setTimeout(
                () => toast.remove(),
                300
            );

        },
        3500
    );
}


/* ============================================================
   36. UTILITY FUNCTIONS
   ============================================================ */

function createId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}


function dateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;
}


function toDateTimeLocalValue(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    const hours =
        String(
            date.getHours()
        ).padStart(2, "0");

    const minutes =
        String(
            date.getMinutes()
        ).padStart(2, "0");


    return `${year}-${month}-${day}T${hours}:${minutes}`;
}


function formatDate(value) {

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }


    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


function formatShortDate(value) {

    const date =
        new Date(
            `${value}T00:00:00`
        );

    if (Number.isNaN(date.getTime())) {
        return value;
    }


    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short"
        }
    );
}


function formatDeadline(value) {

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }


    const now =
        new Date();


    const difference =
        date.getTime() -
        now.getTime();


    if (difference < 0) {

        return `Overdue · ${formatDate(value)}`;
    }


    const days =
        Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        );


    if (days <= 1) {

        return "Due soon";
    }


    if (days < 7) {

        return `In ${days} days`;
    }


    return formatDate(value);
}


function formatHours(minutes) {

    minutes =
        Number(minutes || 0);


    if (minutes < 60) {

        return `${minutes}m`;
    }


    const hours =
        Math.floor(
            minutes / 60
        );

    const remaining =
        minutes % 60;


    if (!remaining) {

        return `${hours}h`;
    }


    return `${hours}h ${remaining}m`;
}


function formatTime(totalSeconds) {

    totalSeconds =
        Math.max(
            0,
            Math.floor(
                Number(totalSeconds || 0)
            )
        );


    const hours =
        Math.floor(
            totalSeconds / 3600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;


    if (hours > 0) {

        return [
            hours,
            minutes,
            seconds
        ]
            .map(
                value =>
                    String(value).padStart(2, "0")
            )
            .join(":");
    }


    return [
        minutes,
        seconds
    ]
        .map(
            value =>
                String(value).padStart(2, "0")
        )
        .join(":");
}


function formatBytes(bytes) {

    bytes =
        Number(bytes || 0);


    if (bytes === 0) {
        return "0 Bytes";
    }


    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        `${(
            bytes /
            Math.pow(1024, index)
        ).toFixed(index === 0 ? 0 : 1)} ${
            units[index] || "Bytes"
        }`
    );
}


function truncate(text, length) {

    if (!text) return "";

    if (text.length <= length) {
        return text;
    }

    return (
        text.substring(0, length) +
        "..."
    );
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

    return escapeHTML(value)
        .replace(/`/g, "&#096;");
}


/* ============================================================
   37. INITIAL DATA CHECK
   ============================================================ */

function checkDeadlines() {

    if (
        !appData.settings.assignmentNotifications
    ) {
        return;
    }


    const today =
        new Date();


    appData.assignments.forEach(
        assignment => {

            if (assignment.completed) {
                return;
            }


            const deadline =
                new Date(
                    assignment.deadline
                );


            if (
                Number.isNaN(
                    deadline.getTime()
                )
            ) {
                return;
            }


            const difference =
                deadline.getTime() -
                today.getTime();


            const day =
                1000 *
                60 *
                60 *
                24;


            if (
                difference >= 0 &&
                difference <= day
            ) {

                const exists =
                    appData.notifications.some(
                        notification =>
                            notification.assignmentId ===
                            assignment.id &&
                            notification.date.startsWith(
                                dateKey(today)
                            )
                    );


                if (!exists) {

                    appData.notifications.push({

                        id: createId(),

                        assignmentId:
                            assignment.id,

                        title:
                            "Assignment deadline",

                        message:
                            `${assignment.title} is due soon.`,

                        date:
                            new Date().toISOString(),

                        read: false
                    });
                }
            }
        }
    );


    saveData();

    renderNotifications();
}


/* ============================================================
   38. RUN INITIAL CHECK
   ============================================================ */

setTimeout(
    checkDeadlines,
    500
);


/* ============================================================
   END OF ADAPT OS JAVASCRIPT
   ============================================================ */