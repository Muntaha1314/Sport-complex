// Handle Logout
function displayLoginLogout() {
  document.querySelector(".login-logout").addEventListener("click", function () {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
      const isConfirmed = confirm("Sign Out?");
      if (isConfirmed) {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("currentUser");
        window.location.href = "login.html";
      }
    }
  });
}

function showAfterLoginElement() {
  document.addEventListener("DOMContentLoaded", function () {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn === "true") {
      document.querySelectorAll(".show-after-login").forEach((el) => {
        el.style.display = "block";
      });
      const loginLogoutLink = document.querySelector(".login-logout-link");
      loginLogoutLink.textContent = "Logout";
      displayLoginLogout();
      loginLogoutLink.parentElement.href = "#";

      // Change hero CTA when logged in
      const cta = document.getElementById("hero-cta");
      if (cta) {
        cta.textContent = "Book a Session";
        cta.href = "reservationTimes.html";
      }
    } else {
      document.querySelectorAll(".show-after-login").forEach((el) => {
        el.style.display = "none";
      });
    }
  });
}
showAfterLoginElement();

export { displayLoginLogout, showAfterLoginElement };
