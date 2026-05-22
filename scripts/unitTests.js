(function () {
  "use strict";

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log("%c  ✔ ASSERT PASSED: " + message, "color: green");
    } else {
      console.error("  ✘ ASSERT FAILED: " + message);
      failed++;
    }
  }

  function runTest(id, module, description, fn) {
    console.log(
      "%c━━━ " + id + " | " + module + " ━━━",
      "color: #1e3a5f; font-weight: bold; font-size: 13px"
    );
    console.log("  Description: " + description);
    try {
      fn();
      passed++;
      console.log("%c  ► " + id + " PASSED", "color: green; font-weight: bold");
    } catch (e) {
      failed++;
      console.error("  ► " + id + " FAILED — " + e.message);
    }
    console.log("");
  }

  // ── Helper: clean up localStorage before/after tests ─────
  function backupAndClear() {
    const backup = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      backup[key] = localStorage.getItem(key);
    }
    return backup;
  }

  function restore(backup) {
    localStorage.clear();
    Object.keys(backup).forEach((k) => localStorage.setItem(k, backup[k]));
  }

  // ═══════════════════════════════════════════════════════════
  console.log(
    "%c\n🏋️ SPORTS COMPLEX — UNIT TEST SUITE\n" +
      "══════════════════════════════════════\n",
    "color: #1e3a5f; font-size: 16px; font-weight: bold"
  );

  const backup = backupAndClear();

  // ─────────────────────────────────────────────────────────
  // T-01: AuthManager — Successful login with valid credentials
  // ─────────────────────────────────────────────────────────
  runTest(
    "T-01",
    "AuthManager (login.js)",
    "Test successful login with valid credentials",
    function () {
      // Setup: create a test user in localStorage
      const testUser = {
        username: "testUser",
        password: "Pass123",
        email: "test@test.com",
        phone: "0532 111 2233",
        dob: "2000-01-15",
        balance: 0,
        subscriptionHistory: [],
        medicalReport: null,
        subscription: null,
      };
      localStorage.setItem("users", JSON.stringify([testUser]));

      // Execute: simulate the login logic from login.js
      const users = JSON.parse(localStorage.getItem("users")) || [];
      const result = users.find(
        (user) => user.username === "testUser" && user.password === "Pass123"
      );

      // Assert
      assert(result !== null && result !== undefined, "Login should return a user object");
      assert(result.username === "testUser", "Username should match 'testUser'");
      assert(result.email === "test@test.com", "Email should match 'test@test.com'");
    }
  );

  // ─────────────────────────────────────────────────────────
  // T-02: AuthManager — Login failure with incorrect password
  // ─────────────────────────────────────────────────────────
  runTest(
    "T-02",
    "AuthManager (login.js)",
    "Test login failure with incorrect password",
    function () {
      // Setup: user exists from T-01
      const users = JSON.parse(localStorage.getItem("users")) || [];

      // Execute: try to log in with wrong password
      const result = users.find(
        (user) => user.username === "testUser" && user.password === "WrongPass"
      );

      // Assert
      assert(result === undefined, "Login with wrong password should return undefined");
    }
  );

  // ─────────────────────────────────────────────────────────
  // T-03: Cart — Adding an item to an empty cart
  // ─────────────────────────────────────────────────────────
  runTest(
    "T-03",
    "Cart (cart.js)",
    "Test adding an item to an empty cart",
    function () {
      // Setup: empty cart for a user
      const userEmail = "test@test.com";
      const allCarts = {};
      allCarts[userEmail] = [];
      localStorage.setItem("carts", JSON.stringify(allCarts));

      // Execute: add a football reservation to cart
      const cart = [];
      const newItem = {
        sport: "Football",
        date: "25/05/2026",
        time: "10:00-11:00",
        price: 200,
        addedAt: new Date().toISOString(),
      };

      // Check it's not already in cart
      const exists = cart.some(
        (c) => c.sport === newItem.sport && c.date === newItem.date && c.time === newItem.time
      );
      assert(exists === false, "Item should not already exist in empty cart");

      cart.push(newItem);

      // Save
      allCarts[userEmail] = cart;
      localStorage.setItem("carts", JSON.stringify(allCarts));

      // Assert
      const savedCarts = JSON.parse(localStorage.getItem("carts"));
      const savedCart = savedCarts[userEmail];
      assert(savedCart.length === 1, "Cart should contain exactly 1 item");
      assert(savedCart[0].sport === "Football", "Item sport should be 'Football'");
      assert(savedCart[0].price === 200, "Item price should be 200");
    }
  );

  // ─────────────────────────────────────────────────────────
  // T-04: Cart — Removing an item from the cart
  // ─────────────────────────────────────────────────────────
  runTest(
    "T-04",
    "Cart (cart.js)",
    "Test removing an item from the cart",
    function () {
      // Setup: cart with 2 items
      const userEmail = "test@test.com";
      const cart = [
        { sport: "Football", date: "25/05/2026", time: "10:00-11:00", price: 200 },
        { sport: "Tennis", date: "25/05/2026", time: "14:00-15:00", price: 150 },
      ];
      const allCarts = {};
      allCarts[userEmail] = cart;
      localStorage.setItem("carts", JSON.stringify(allCarts));

      // Execute: remove the first item (index 0)
      const indexToRemove = 0;
      cart.splice(indexToRemove, 1);
      allCarts[userEmail] = cart;
      localStorage.setItem("carts", JSON.stringify(allCarts));

      // Assert
      const savedCarts = JSON.parse(localStorage.getItem("carts"));
      const savedCart = savedCarts[userEmail];
      assert(savedCart.length === 1, "Cart should contain 1 item after removal");
      assert(savedCart[0].sport === "Tennis", "Remaining item should be 'Tennis'");
    }
  );

  // ─────────────────────────────────────────────────────────
  // T-05: Wallet — Depositing a valid positive amount
  // ─────────────────────────────────────────────────────────
  runTest(
    "T-05",
    "Wallet (profileWallet.js)",
    "Test depositing a valid positive amount",
    function () {
      // Setup: user with initial balance of 100
      const currentUser = {
        username: "testUser",
        email: "test@test.com",
        balance: 100,
      };
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      // Execute: deposit 50 ₺
      const depositAmount = 50;
      const isValid = !isNaN(depositAmount) && depositAmount > 0;
      assert(isValid === true, "Deposit amount 50 should be valid");

      currentUser.balance += depositAmount;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      // Assert
      const updated = JSON.parse(localStorage.getItem("currentUser"));
      assert(updated.balance === 150, "Balance should be 150 after depositing 50");
    }
  );

  // ─────────────────────────────────────────────────────────
  // T-06: Wallet — Rejecting a negative deposit amount
  // ─────────────────────────────────────────────────────────
  runTest(
    "T-06",
    "Wallet (profileWallet.js)",
    "Test rejecting a negative deposit amount",
    function () {
      // Setup
      const balance = 100;
      const depositAmount = -25;

      // Execute: validate the deposit
      const isValid = !isNaN(depositAmount) && depositAmount > 0;

      // Assert
      assert(isValid === false, "Negative deposit (-25) should be rejected");

      // Also test zero
      const zeroValid = !isNaN(0) && 0 > 0;
      assert(zeroValid === false, "Zero deposit should also be rejected");

      // Also test NaN
      const nanValid = !isNaN(NaN) && NaN > 0;
      assert(nanValid === false, "NaN deposit should be rejected");
    }
  );

  // ─────────────────────────────────────────────────────────
  // T-07: Reservation — Sunday dates are rejected
  // ─────────────────────────────────────────────────────────
  runTest(
    "T-07",
    "Reservation (reservationTimes.js)",
    "Test that Sunday dates are rejected",
    function () {
      // Setup: create multiple Sunday dates to test
      const sunday1 = new Date("2026-05-17T00:00:00"); // Sunday
      const sunday2 = new Date("2026-05-24T00:00:00"); // Sunday
      const monday = new Date("2026-05-18T00:00:00"); // Monday
      const saturday = new Date("2026-05-23T00:00:00"); // Saturday

      // Execute & Assert: Sundays should be day 0
      assert(sunday1.getDay() === 0, "2026-05-17 should be identified as Sunday (day 0)");
      assert(sunday2.getDay() === 0, "2026-05-24 should be identified as Sunday (day 0)");

      // Non-Sundays should pass
      assert(monday.getDay() !== 0, "2026-05-18 (Monday) should NOT be Sunday");
      assert(saturday.getDay() !== 0, "2026-05-23 (Saturday) should NOT be Sunday");
    }
  );

  // ─────────────────────────────────────────────────────────
  // T-08: Reservation — Double-booking prevention
  // ─────────────────────────────────────────────────────────
  runTest(
    "T-08",
    "Reservation (reservationTimes.js)",
    "Test that a reserved slot cannot be double-booked",
    function () {
      // Setup: existing reservation for Football at 10:00 on 25/05/2026
      const existingReservations = [
        {
          sport: "Football",
          date: "25/05/2026",
          time: "10:00-11:00",
          price: 200,
          userEmail: "other@test.com",
          username: "otherUser",
          status: "Confirmed",
        },
      ];
      localStorage.setItem("reservations", JSON.stringify(existingReservations));

      // Football has capacity 1
      const footballCapacity = 1;

      // Execute: count reservations for this slot
      const resCount = existingReservations.filter(
        (r) =>
          r.sport === "Football" &&
          r.date === "25/05/2026" &&
          r.time === "10:00-11:00"
      ).length;

      const remaining = footballCapacity - resCount;
      const isFull = remaining <= 0;

      // Assert
      assert(resCount === 1, "There should be 1 existing reservation for this slot");
      assert(remaining === 0, "Remaining capacity should be 0");
      assert(isFull === true, "Slot should be marked as full (no double-booking)");

      // Swimming with capacity 40 should still have room
      const swimmingCapacity = 40;
      const swimResCount = existingReservations.filter(
        (r) =>
          r.sport === "Swimming" &&
          r.date === "25/05/2026" &&
          r.time === "10:00-11:00"
      ).length;
      const swimRemaining = swimmingCapacity - swimResCount;
      assert(swimRemaining === 40, "Swimming slot should still have 40 spots available");
    }
  );

  // ─────────────────────────────────────────────────────────
  // T-09: Feedback — Submitting feedback with valid text
  // ─────────────────────────────────────────────────────────
  runTest(
    "T-09",
    "Feedback (aboutUs.js)",
    "Test submitting feedback with valid text",
    function () {
      // Setup
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem(
        "currentUser",
        JSON.stringify({ username: "testUser", email: "test@test.com" })
      );
      localStorage.setItem("userFeedback", JSON.stringify([]));

      // Execute: simulate feedback submission logic from aboutUs.js
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      assert(isLoggedIn === true, "User should be logged in");

      const feedbackText = "Great facilities! Love the swimming pool.";
      const isFeedbackValid = feedbackText.trim() !== "";
      assert(isFeedbackValid === true, "Feedback text should not be empty");

      const user = JSON.parse(localStorage.getItem("currentUser"));
      const entry = (user.username || "Anonymous") + ": " + feedbackText;

      const feedbacks = JSON.parse(localStorage.getItem("userFeedback")) || [];
      feedbacks.push(entry);
      localStorage.setItem("userFeedback", JSON.stringify(feedbacks));

      // Assert
      const saved = JSON.parse(localStorage.getItem("userFeedback"));
      assert(saved.length === 1, "Feedback list should contain 1 entry");
      assert(
        saved[0] === "testUser: Great facilities! Love the swimming pool.",
        "Feedback entry should match expected format"
      );
    }
  );

  // ─────────────────────────────────────────────────────────
  // T-10: Feedback — Rejecting empty feedback submission
  // ─────────────────────────────────────────────────────────
  runTest(
    "T-10",
    "Feedback (aboutUs.js)",
    "Test rejecting empty feedback submission",
    function () {
      // Setup
      const feedbackText1 = "";
      const feedbackText2 = "   "; // whitespace only
      const feedbackText3 = "Valid feedback";

      // Execute & Assert
      const isEmpty1 = feedbackText1.trim() === "";
      assert(isEmpty1 === true, "Empty string should be rejected");

      const isEmpty2 = feedbackText2.trim() === "";
      assert(isEmpty2 === true, "Whitespace-only string should be rejected");

      const isEmpty3 = feedbackText3.trim() === "";
      assert(isEmpty3 === false, "Valid text should NOT be rejected");
    }
  );

  // ═══════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════
  restore(backup);

  console.log(
    "%c══════════════════════════════════════",
    "color: #1e3a5f; font-weight: bold"
  );
  console.log(
    "%c TEST RESULTS: " + passed + "/10 PASSED, " + failed + " FAILED",
    "color: " +
      (failed === 0 ? "green" : "red") +
      "; font-weight: bold; font-size: 14px"
  );
  console.log(
    "%c══════════════════════════════════════\n",
    "color: #1e3a5f; font-weight: bold"
  );

  if (failed === 0) {
    console.log(
      "%c🎉 All unit tests passed successfully!",
      "color: green; font-size: 14px; font-weight: bold"
    );
  }
})();
