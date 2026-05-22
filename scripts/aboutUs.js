// aboutUs.js — Feedback submission (localStorage-based)
document.addEventListener("DOMContentLoaded", function () {
  var submitBtn = document.getElementById("submit-feedback-btn");
  if (!submitBtn) return;

  submitBtn.addEventListener("click", function () {
    var isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn !== "true") {
      alert("Please log in to submit feedback!");
      window.location.href = "login.html";
      return;
    }

    var feedbackText = document.getElementById("feedback").value.trim();
    if (!feedbackText) { alert("Please write your feedback before submitting."); return; }

    var user = JSON.parse(localStorage.getItem("currentUser")) || {};
    var entry = (user.username || "Anonymous") + ": " + feedbackText;

    var feedbacks = JSON.parse(localStorage.getItem("userFeedback")) || [];
    feedbacks.push(entry);
    localStorage.setItem("userFeedback", JSON.stringify(feedbacks));

    document.getElementById("feedback").value = "";
    var confirm = document.getElementById("feedback-confirm");
    if (confirm) { confirm.style.display = "block"; setTimeout(function(){ confirm.style.display = "none"; }, 3000); }
  });
});
