let firebaseInitialized = false;
let currentUser = null;

// spinner functions
function showSpinner() {
  const dialog = document.getElementById("changePasswordDialog");
  if (dialog && dialog.open) {
    dialog.close(); // temporarily close it to prevent it from overlapping
    dialog.setAttribute("data-reopen", "true"); // remember to reopen
  }

  document.getElementById("loadingSpinner").style.display = "flex";
}

function hideSpinner() {
  document.getElementById("loadingSpinner").style.display = "none";

  const dialog = document.getElementById("changePasswordDialog");
  if (dialog && dialog.getAttribute("data-reopen") === "true") {
    dialog.removeAttribute("data-reopen");
    dialog.showModal();
  }
}

// authentication
const firebaseConfig = {
  apiKey: "AIzaSyBBMSc7ePoc-aysDcbfkkBbcrSb71Fx3ME",
  authDomain: "admin-dashboard-calendar.firebaseapp.com",
  projectId: "admin-dashboard-calendar",
  storageBucket: "admin-dashboard-calendar.firebasestorage.app",
  messagingSenderId: "459425596022",
  appId: "1:459425596022:web:b879e3718f68f8232f5557",
  measurementId: "G-2CGQKZPBK1",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

firebase.auth().onAuthStateChanged(function (user) {
  firebaseInitialized = true;
  currentUser = user;
});

// welcomeing user email

document.addEventListener("DOMContentLoaded", () => {
  const userData = JSON.parse(localStorage.getItem("userData"));

  // Update welcome message if user data is found
  const welcomeEl = document.getElementById("welcomeMessage");
  if (userData && userData.email && welcomeEl) {
    welcomeEl.textContent = `Hello, ${userData.email}`;
    console.log(userData.email);
  }
});

// Optional: initialize analytics
if ("measurementId" in firebaseConfig) {
  firebase.analytics();
}

// AUTH PAGE - only if loginForm exists
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    showSpinner();
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        localStorage.clear();
        const user = userCredential.user;

        // Store user data in localStorage
        localStorage.setItem(
          "userData",
          JSON.stringify({
            email: user.email,
            uid: user.uid,
          })
        );
        // Redirect to calendar page on successful login
        window.location.href = "index.html";
      })
      .catch((error) => {
        const loginError = document.getElementById("loginError");
        // You can customize the error message based on error.code for better UX:
        if (
          error.code === "auth/wrong-password" ||
          error.code === "auth/user-not-found"
        ) {
          loginError.textContent = "Email or password is incorrect.";
        } else if (error.code === "auth/invalid-email") {
          loginError.textContent = "Invalid email format.";
        } else {
          loginError.textContent =
            "Login failed, Email or Password is invalid. ";
        }
      })
      .finally(() => {
        hideSpinner();
      });
  });

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginError = document.getElementById("loginError");

  emailInput.addEventListener("input", () => (loginError.textContent = ""));
  passwordInput.addEventListener("input", () => (loginError.textContent = ""));

  // password toggle
  window.togglePassword = function () {
    const passwordInput = document.getElementById("password");
    const toggleIcon = document.querySelector(".toggle-password");

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      toggleIcon.textContent = "🙈";
    } else {
      passwordInput.type = "password";
      toggleIcon.textContent = "👁️";
    }
  };
}

// logout button

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    showSpinner();
    firebase
      .auth()
      .signOut()
      .then(() => {
        localStorage.clear();
        window.location.href = "auth.html";
      })
      .catch((error) => {
        alert("Error signing out: " + error.message);
      })
      .finally(() => {
        hideSpinner();
      });
  });
}

// users dropdown functionality
document.addEventListener("DOMContentLoaded", () => {
  const dropdownToggle = document.querySelector(".dropdown-toggle");
  const dropdownMenu = document.querySelector(".dropdown-menu");

  if (dropdownToggle && dropdownMenu) {
    dropdownToggle.addEventListener("click", (e) => {
      e.preventDefault();
      dropdownToggle.classList.toggle("active");
      dropdownMenu.classList.toggle("show");
    });
  }
});

//active functionality for the dashboard list
const allLinks = document.querySelectorAll(".sidebar-nav a");

allLinks.forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();

    allLinks.forEach((l) => l.classList.remove("active"));

    this.classList.add("active");
  });
});

// dashboard 3rd party calendar
document.addEventListener("DOMContentLoaded", function () {
  const calendar = document.getElementById("calendar");
  const modal = document.getElementById("eventModal");
  const closeModal = document.getElementById("closeModal");
  const eventForm = document.getElementById("eventForm");

  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed

  // Calculate days in current, previous, and next months
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Weekday of first day of current month (0=Sun,...6=Sat)
  const firstDayWeekday = new Date(year, month, 1).getDay();

  // Total boxes in calendar grid (6 weeks * 7 days)
  const totalBoxes = 35;

  // Clear and add weekday headers
  calendar.innerHTML = `
    <div class="day-header">Sun</div>
    <div class="day-header">Mon</div>
    <div class="day-header">Tue</div>
    <div class="day-header">Wed</div>
    <div class="day-header">Thu</div>
    <div class="day-header">Fri</div>
    <div class="day-header">Sat</div>
  `;

  // Calculate how many days from previous month to show
  // These fill the empty boxes before day 1 of current month
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i;
    const prevDayBox = document.createElement("div");
    prevDayBox.classList.add("day", "disabled-day");
    prevDayBox.innerHTML = `<span class="day-number">${prevDay}</span>`;
    calendar.appendChild(prevDayBox);
  }

  // Add current month day boxes (active)
  for (let i = 1; i <= daysInMonth; i++) {
    const dayBox = document.createElement("div");
    dayBox.classList.add("day");
    dayBox.dataset.date = `${year}-${month + 1}-${i}`;
    dayBox.innerHTML = `<span class="day-number">${i}</span>`;

    dayBox.addEventListener("click", () => {
      document.getElementById("eventDate").value = dayBox.dataset.date;
      modal.style.display = "flex";
    });

    calendar.appendChild(dayBox);
  }

  // Calculate how many boxes are filled so far
  const filledBoxes = firstDayWeekday + daysInMonth;
  // Fill remaining boxes with next month days
  const nextDaysCount = totalBoxes - filledBoxes;
  for (let i = 1; i <= nextDaysCount; i++) {
    const nextDayBox = document.createElement("div");
    nextDayBox.classList.add("day", "disabled-day");
    nextDayBox.innerHTML = `<span class="day-number">${i}</span>`;
    calendar.appendChild(nextDayBox);
  }

  // Close modal handlers (close btn and outside click)
  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
    eventForm.reset();
  });

  modal.addEventListener("click", (e) => {
    const dialogBox = document.querySelector(".modal-content"); // or whatever inner box contains the form
    if (!dialogBox.contains(e.target)) {
      // mimic form submission logic
      const emoji = document.getElementById("emoji").value;
      const title = document.getElementById("title").value;
      const date = document.getElementById("eventDate").value;

      if (emoji && title && date) {
        const eventBtn = document.createElement("button");
        eventBtn.className = "event-btn";
        eventBtn.textContent = `${emoji} ${title}`;

        const targetDay = document.querySelector(`[data-date="${date}"]`);
        if (targetDay) {
          targetDay.appendChild(eventBtn);
        }
      }

      modal.style.display = "none";
      eventForm.reset();
    }
  });

  // Add event button on form submit
  eventForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const emoji = document.getElementById("emoji").value;
    const title = document.getElementById("title").value;
    const date = document.getElementById("eventDate").value;

    const eventBtn = document.createElement("button");
    eventBtn.className = "event-btn";
    eventBtn.textContent = `${emoji} ${title}`;

    const targetDay = document.querySelector(`[data-date="${date}"]`);
    if (targetDay) {
      targetDay.appendChild(eventBtn);
    }

    modal.style.display = "none";
    eventForm.reset();
  });
});

// Emoji Picker Logic
const emojiDisplay = document.getElementById("emojiDisplay");
const emojiPicker = document.getElementById("emojiPicker");
const emojiInput = document.getElementById("emoji");

emojiDisplay.addEventListener("click", () => {
  emojiPicker.style.display =
    emojiPicker.style.display === "block" ? "none" : "block";
});

emojiPicker.innerHTML = `
<span>🧠</span><span>📚</span><span>✍</span>
<span>😀</span><span>😃</span><span>😄</span><span>😁</span>
<span>😆</span><span>😅</span><span>😂</span><span>🤣</span>
<span>😊</span><span>😇</span><span>🙂</span><span>🙃</span>
<span>😉</span><span>😌</span><span>😍</span><span>🥰</span>
<span>😘</span><span>😗</span><span>😙</span><span>😚</span>
<span>😋</span><span>😛</span><span>😝</span><span>😜</span>
<span>🤪</span><span>🤨</span><span>🧐</span><span>🤓</span>
<span>😎</span><span>🤩</span><span>🥳</span><span>😏</span>
<span>😒</span><span>😞</span><span>😔</span><span>😟</span>
<span>😕</span><span>🙁</span><span>😣</span>
<span>😖</span><span>😫</span><span>😩</span><span>🥺</span>
<span>😢</span><span>😭</span><span>😤</span><span>😠</span>
<span>😡</span><span>🤬</span><span>🤯</span><span>😳</span>
<span>🥵</span><span>🥶</span><span>😱</span><span>😨</span>
<span>😰</span><span>😥</span><span>😓</span><span>🤗</span>
<span>🤔</span><span>🤭</span><span>🤫</span><span>🤥</span>
<span>😶</span><span>😐</span><span>😑</span><span>😬</span>
<span>🙄</span><span>😯</span><span>😦</span><span>😧</span>
<span>😮</span><span>😲</span><span>🥱</span><span>😴</span>
<span>🤤</span><span>😪</span><span>😵</span><span>🤐</span>
<span>🥴</span><span>🤢</span><span>🤮</span><span>🤧</span>
<span>😷</span><span>🤒</span><span>🤕</span><span>🤑</span>
<span>😈</span><span>👿</span><span>👹</span><span>👺</span>
<span>🤡</span><span>💩</span><span>👻</span><span>💀</span>
<span>☠</span><span>👽</span><span>👾</span><span>🤖</span>
<span>🎃</span><span>😺</span><span>😸</span><span>😹</span>
<span>😻</span><span>😼</span><span>😽</span><span>🙀</span>
<span>😿</span><span>😾</span><span>🐶</span><span>🐱</span>
<span>🐭</span><span>🐹</span><span>🐰</span><span>🦊</span>
<span>🐻</span><span>🐼</span><span>🐻‍❄️</span><span>🐨</span>
<span>🐯</span><span>🦁</span><span>🐮</span><span>🐷</span>
<span>🐽</span><span>🐸</span><span>🐵</span><span>🙈</span>
<span>🙉</span><span>🙊</span><span>🐒</span><span>🐔</span>
<span>🐧</span><span>🐦</span><span>🐤</span><span>🐣</span>
<span>🐥</span><span>🦆</span><span>🦅</span><span>🦉</span>
<span>🦇</span><span>🐺</span><span>🐗</span><span>🐴</span>
<span>🦄</span><span>🐝</span><span>🐛</span><span>🐌</span>
<span>🐞</span><span>🐜</span><span>🪰</span><span>🪱</span>
<span>🦋</span><span>🐢</span><span>🐍</span><span>🦎</span>
<span>🦂</span><span>🐙</span><span>🐚</span><span>🐠</span>
<span>🐟</span><span>🐬</span><span>🐳</span><span>🐋</span>
<span>🦈</span><span>🐊</span><span>🐅</span><span>🐆</span>
<span>🦓</span><span>🦍</span><span>🦧</span><span>🐘</span>
<span>🦛</span><span>🦏</span><span>🐪</span><span>🐫</span>
<span>🦙</span><span>🦒</span><span>🐃</span><span>🐂</span>
<span>🐄</span><span>🐎</span><span>🐖</span><span>🐏</span>
<span>🐑</span><span>🐐</span><span>🦌</span><span>🐕</span>
<span>🐩</span><span>🐈</span><span>🐓</span><span>🦃</span>
<span>🦤</span><span>🐇</span><span>🐁</span><span>🐀</span>
<span>🐿</span><span>🦔</span><span>🦥</span><span>🦦</span>
<span>🦨</span><span>🦘</span><span>🦡</span><span>🐾</span>
<span>🐉</span><span>🐲</span><span>🌵</span><span>🎄</span>
<span>🌲</span><span>🌳</span><span>🌴</span><span>🪵</span>
<span>🌱</span><span>🌿</span><span>☘</span><span>🍀</span>
<span>🎍</span><span>🎋</span><span>🍃</span><span>🍂</span>
<span>🍁</span><span>🍄</span><span>🌾</span><span>💐</span>
<span>🌷</span><span>🌹</span><span>🥀</span><span>🌺</span>
<span>🌸</span><span>🌼</span><span>🌻</span><span>🌞</span>
<span>🌝</span><span>🌛</span><span>🌜</span><span>🌚</span>
<span>🌕</span><span>🌖</span><span>🌗</span><span>🌘</span>
<span>🌑</span><span>🌒</span><span>🌓</span><span>🌔</span>
<span>🌙</span><span>🌎</span><span>🌍</span><span>🌏</span>
<span>💫</span><span>⭐</span><span>🌟</span><span>✨</span>
<span>⚡</span><span>🔥</span><span>💥</span><span>🌈</span>
<span>☀</span><span>🌤</span><span>⛅</span><span>🌥</span>
<span>🌦</span><span>🌧</span><span>⛈</span><span>🌩</span>
<span>🌨</span><span>❄</span><span>☃</span><span>⛄</span>
<span>🌬</span><span>💨</span><span>🌪</span><span>🌫</span>
<span>🌊</span><span>💧</span><span>💦</span><span>☔</span>
<span>☂</span><span>❤️</span<span>🧡</span><span>💛</span>
<span>💚</span><span>💙</span><span>💜</span><span>🤎</span>
<span>🖤</span><span>🤍</span><span>💔</span><span>❣️</span>
<span>💕</span><span>💞</span><span>💓</span><span>💗</span>
<span>💖</span><span>💘</span><span>💝</span><span>💟</span>
<span>💌</span><span>💤</span><span>💋</span><span>👩‍❤️‍👩</span>
<span>👨‍❤️‍👨</span><span>👩‍❤️‍👨</span>

`;

emojiPicker.addEventListener("click", (e) => {
  if (e.target.tagName === "SPAN") {
    emojiDisplay.textContent = e.target.textContent;
    emojiInput.value = e.target.textContent;
    emojiPicker.style.display = "none";
  }
});

// Close picker when clicking outside
document.addEventListener("click", (e) => {
  if (!emojiPicker.contains(e.target) && !emojiDisplay.contains(e.target)) {
    emojiPicker.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const todoContainer = document.getElementById("todoContainer");

  // Delegate button clicks
  todoContainer.addEventListener("click", (e) => {
    const target = e.target;

    // Add new todo-item
    if (target.classList.contains("add-todo-btn")) {
      const newItem = document.createElement("div");
      newItem.className = "todo-item";
      newItem.innerHTML = `
          <input type="checkbox" class="todo-checkbox" />
          <input type="text" class="todo-input" placeholder="Enter a task..." />
          <button type="button" class="add-todo-btn">➕</button>
          <button type="button" class="remove-todo-btn">➖</button>
        `;
      todoContainer.appendChild(newItem);
    }

    // Remove todo-item
    if (target.classList.contains("remove-todo-btn")) {
      event.stopPropagation();
      const item = target.closest(".todo-item");
      if (todoContainer.children.length > 1) {
        item.remove();
      }
    }
  });
});

const textarea = document.getElementById("notes");

if (textarea) {
  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  });
}

const dialog = document.getElementById("changePasswordDialog");
const passwordChangeError = document.getElementById("passwordChangeError");

// Open the dialog
document
  .getElementById("changePasswordAction")
  .addEventListener("click", () => {
    resetPasswordModal();
    dialog.showModal();
  });

// Submit password change
document
  .getElementById("submitPasswordChange")
  .addEventListener("click", async () => {
    const oldPassword = document.getElementById("currentPasswordInput").value;
    const newPassword = document.getElementById("newPasswordInput").value;
    const confirmPassword = document.getElementById(
      "confirmNewPasswordInput"
    ).value;

    passwordChangeError.style.color = "red";
    passwordChangeError.textContent = "";
    showSpinner();

    if (newPassword !== confirmPassword) {
      passwordChangeError.textContent = "New passwords do not match.";
      hideSpinner();
      return;
    }
    if (oldPassword === confirmPassword || oldPassword === newPassword) {
      passwordChangeError.textContent = "You need to enter a new password.";
      hideSpinner();
      return;
    }
    if (!firebaseInitialized) {
      passwordChangeError.textContent =
        "Please wait, authentication is initializing...";
      hideSpinner();
      return;
    }

    if (!currentUser) {
      passwordChangeError.textContent = "You are not signed in.";
      hideSpinner();
      return;
    }

    try {
      const credential = firebase.auth.EmailAuthProvider.credential(
        currentUser.email,
        oldPassword
      );

      await currentUser.reauthenticateWithCredential(credential);
      await currentUser.updatePassword(newPassword);

      passwordChangeError.style.color = "green";
      passwordChangeError.textContent = "Password updated successfully.";

      // Close and reset after a short delay
      setTimeout(() => {
        dialog.close();
        resetPasswordModal();
      }, 1200);
    } catch (error) {
      console.error("Password change error:", error);

      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        passwordChangeError.textContent = "Your current password is wrong.";
      } else if (error.code === "auth/user-mismatch") {
        passwordChangeError.textContent =
          "Something went wrong. Please try again.";
      } else {
        passwordChangeError.textContent =
          "An error occurred. Please try again.";
      }
    } finally {
      hideSpinner();
    }
  });

// Cancel button resets and closes the modal
document
  .getElementById("cancelPasswordChange")
  .addEventListener("click", () => {
    dialog.close();
    resetPasswordModal();
  });

// Reset all modal fields
function resetPasswordModal() {
  document.getElementById("currentPasswordInput").value = "";
  document.getElementById("newPasswordInput").value = "";
  document.getElementById("confirmNewPasswordInput").value = "";
  passwordChangeError.textContent = "";
}
