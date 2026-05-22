function displaySigninUp() {
  document.getElementById("show-login").addEventListener("click", function () {
    document.getElementById("login-form").classList.remove("hidden");
    document.getElementById("signup-form").classList.add("hidden");
    this.classList.add("active");
    document.getElementById("show-signup").classList.remove("active");
  });

  document.getElementById("show-signup").addEventListener("click", function () {
    document.getElementById("signup-form").classList.remove("hidden");
    document.getElementById("login-form").classList.add("hidden");
    this.classList.add("active");
    document.getElementById("show-login").classList.remove("active");
  });
}

displaySigninUp();

function login() {
  document
    .querySelector("#login-form form")
    .addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent actual form submission

      const username = document.getElementById("login-username").value.trim();
      const password = document.getElementById("login-password").value;
      const isManager = document.getElementById("is-manager").checked;

      // Predefined system manager credentials
      const managerCredentials = {
        username: "admin",
        password: "admin123",
      };

      if (isManager) {
        // Validate manager login
        if (
          username === managerCredentials.username &&
          password === managerCredentials.password
        ) {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem(
            "currentUser",
            JSON.stringify({ username, role: "manager" })
          );
          window.location.href = "systemManager.html"; // Redirect to manager dashboard
        } else {
          document.querySelector(".incorrect-info-login").innerHTML =
            "Invalid manager credentials!";
        }
        return;
      }

      // Regular user login
      const users = JSON.parse(localStorage.getItem("users")) || [];
      let loggedInUser = users.find(
        (user) => user.username === username && user.password === password
      );

      if (loggedInUser) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", JSON.stringify(loggedInUser)); // Store current user
        window.location.href = "index.html"; // Redirect to main page
      } else {
        document.querySelector(".incorrect-info-login").innerHTML =
          "Invalid username or password!";
      }
    });
}

function signup() {
  document.addEventListener("DOMContentLoaded", function () {
    document
      .querySelector("#signup-form form")
      .addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent form from submitting normally

        // Get user inputs
        const username = document
          .getElementById("signup-username")
          .value.trim();
        const email = document.getElementById("signup-email").value.trim();
        const password = document.getElementById("signup-password").value;
        const confirmPassword = document.getElementById(
          "signup-confirm-password"
        ).value;

        // Validate fields
        if (!username || !email || !password || !confirmPassword) {
          alert("Please fill in all fields.");
          return;
        }

        if (password !== confirmPassword) {
          document.querySelector(".incorrect-info-signup").innerHTML =
            "Passwords do not match!";
          return;
        }

        // Get existing users from localStorage (or initialize empty array)
        let users = JSON.parse(localStorage.getItem("users")) || [];

        // Check if email is already registered
        if (users.some((user) => user.email === email)) {
          document.querySelector(".incorrect-info-signup").innerHTML =
            "This email is already registered! Try logging in.";
          return;
        }

        // Create new user object
        const phone = document.getElementById("signup-phone").value.trim();
        const dob   = document.getElementById("signup-dob").value;
        const newUser = {
          username,
          email,
          phone,
          dob,
          password,
          balance: 0,
          unsetReservations: [],
          confirmedReservations: [],
          subscriptionHistory: [],
          medicalReport: null,
          subscription: null,
        };

        // Save user to localStorage
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));

        alert("Sign-up successful! You can now log in.");

        // Redirect to login page
        window.location.href = "login.html";
      });
  });
}

signup();
login();
