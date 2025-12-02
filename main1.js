const api = "https://randomizer-rose.vercel.app/names";

const verifyForm = document.getElementById("verifyForm");
const verifySecretKeyForm = document.getElementById("verifySecretKeyForm");

const usernameInput = document.getElementById("username");
const secretKeyInput = document.getElementById("secretKey");
const resultBox = document.getElementById("result");
const resultSecretKey = document.getElementById("resultSecretKey");

let listData = [];
let pendingName = null; // <- store the name that needs key verification

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

// MAIN FORM — ENTER NAME
verifyForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Read current values
  const name = usernameInput.value.trim();
  const secretKey = secretKeyInput.value.trim();

  // hide results
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
  // (only when no secretKey entered yet)
  if (found && found.secretKey && !secretKey) {
    // set pendingName so verification is bound to this name
    pendingName = found.name; // keep original casing from DB
    // lock the username so it can't be changed while verifying
    usernameInput.value = pendingName;
    usernameInput.setAttribute("readonly", "readonly");

    // show secret key form
    verifyForm.style.display = "none";
    verifySecretKeyForm.style.display = "block";

    // clear any previous secret input or messages
    secretKeyInput.value = "";
    resultSecretKey.style.display = "none";

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

    // SUCCESS — show result
    resultBox.style.display = "block";
    resultBox.innerHTML = `${data.message} <br/> ${data.secretKey || ""}`;

    // cleanup: clear secret & pendingName, unlock username
    pendingName = null;
    secretKeyInput.value = "";
    usernameInput.removeAttribute("readonly");
  } catch (err) {
    showError(`Error: ${err.message}`);
  }
});

// SECRET KEY FORM — USER ENTERS CODE
verifySecretKeyForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const secretKey = secretKeyInput.value.trim();

  // If for some reason pendingName is missing, block (safety)
  if (!pendingName) {
    showError("ასინქრონული შეცდომა — სცადეთ თავიდან");
    // restore UI
    verifySecretKeyForm.style.display = "none";
    verifyForm.style.display = "block";
    usernameInput.removeAttribute("readonly");
    return;
  }

  // Match against the stored pendingName + secret key
  const match = listData.find(
    (item) =>
      item.name.toLowerCase() === pendingName.toLowerCase() &&
      item.secretKey === secretKey
  );

  if (!match) {
    // wrong code: clear secret input to avoid reuse
    secretKeyInput.value = "";
    showError("კოდი არასწორია!");
    return;
  }

  // success — we've verified the secret for pendingName
  // prepare to re-submit to main handler but ensure the name and secretKey are set
  // ensure username contains pendingName (readonly) and secretKey still present
  usernameInput.value = pendingName;
  usernameInput.setAttribute("readonly", "readonly");

  // hide secret form, show main form
  verifySecretKeyForm.style.display = "none";
  verifyForm.style.display = "block";

  // Dispatch submit programmatically, but to be safe, give the main handler the secretKey
  // The main handler will send both name and secretKey to backend
  verifyForm.dispatchEvent(new Event("submit"));
});

// Helpers
function showError(msg) {
  resultBox.style.display = "block";
  resultBox.innerHTML = `<span class="error">${msg}</span>`;

  resultSecretKey.style.display = "block";
  resultSecretKey.innerHTML = `<span class="error">${msg}</span>`;
}
