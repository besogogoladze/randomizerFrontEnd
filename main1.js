const api = "https://randomizer-rose.vercel.app/names";

const verifyForm = document.getElementById("verifyForm");
const verifySecretKeyForm = document.getElementById("verifySecretKeyForm");

let listData = [];

async function fetchNames() {
  try {
    const res = await fetch(api);
    if (!res.ok) throw new Error("Failed to fetch");
    listData = await res.json();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

fetchNames();

// ⭐ MAIN FORM — ENTER NAME
verifyForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("username").value.trim();
  const secretKey = document.getElementById("secretKey").value.trim();
  const resultBox = document.getElementById("result");

  resultBox.style.display = "none";

  if (!name) {
    showError("გთხოვთ შეიყვანოთ სახელი");
    return;
  }

  // Find user IF EXISTS IN DB
  const found = listData.find(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );

  // If this user exists AND they have a secret key → show secret key form
  if (found && found.secretKey && !secretKey) {
    verifyForm.style.display = "none";
    verifySecretKeyForm.style.display = "block";
    return;
  }

  // Otherwise continue to backend
  try {
    const res = await fetch(`${api}/pick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, secretKey: secretKey || "" }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.message?.includes("კოდი")) {
        showError("კოდი არასწორია!");
      } else if (data.list) {
        showError(
          `${data.message} <br><strong>${data.list.join(", ")}</strong>`
        );
      } else {
        showError(data.message || "Server error");
      }
      return;
    }

    // SUCCESS
    resultBox.style.display = "block";
    resultBox.innerHTML = `${data.message} <br/> ${data.secretKey}`;
  } catch (err) {
    showError(`Error: ${err.message}`);
  }
});

// ⭐ SECRET KEY FORM — USER ENTERS CODE
verifySecretKeyForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const secretKey = document.getElementById("secretKey").value.trim();
  const name = document.getElementById("username").value.trim().toLowerCase();

  const match = listData.find(
    (item) => item.name.toLowerCase() === name && item.secretKey === secretKey
  );

  if (!match) {
    showError("კოდი არასწორია!");
    return;
  }

  // Code is correct → return to main form
  verifySecretKeyForm.style.display = "none";
  verifyForm.style.display = "block";

  verifyForm.dispatchEvent(new Event("submit"));
});

// Helpers
function showError(msg) {
  const resultBox = document.getElementById("result");
  const resultSecretKey = document.getElementById("resultSecretKey");

  resultBox.style.display = "block";
  resultBox.innerHTML = `<span class="error">${msg}</span>`;

  resultSecretKey.style.display = "block";
  resultSecretKey.innerHTML = `<span class="error">${msg}</span>`;
}
