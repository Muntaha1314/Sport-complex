import { displayLoginLogout, showAfterLoginElement } from "./index.js";

function updateCurrentUser(updatedData) {
  let currentUser = JSON.parse(localStorage.getItem("currentUser"));
  let users = JSON.parse(localStorage.getItem("users")) || [];

  if (!currentUser) return;

  Object.assign(currentUser, updatedData);
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  users = users.map((user) =>
    user.email === currentUser.email ? currentUser : user
  );

  localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUser() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  return currentUser;
}

export {
  updateCurrentUser,
  getCurrentUser,
};
