const api = "https://randomizer-rose.vercel.app";

document.getElementById("pickerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("username").value.trim().toLowerCase();
  const resultBox = document.getElementById("result");

  if (!name) {
    resultBox.style.display = "block";
    resultBox.innerHTML = `შეიყვანე შენი სახელი!`;
    return;
  }

  try {
    const res = await fetch(`${api}/names/pick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    resultBox.style.display = "block";

    if (!res.ok) {
      // Backend returned an error (400, 500, etc.)
      resultBox.innerHTML = `<span class="error">${data.message}</span>`;

      // If backend sent a list of valid names
      if (data.list) {
        resultBox.innerHTML += `<br>${data.list.join(", ")}`;
      }
      return;
    }

    // Success: show user and their pick
    resultBox.innerHTML = `${data.message}`;
  } catch (err) {
    // Network or unexpected errors
    resultBox.style.display = "block";
    resultBox.innerHTML = `<span class="error">Something went wrong: ${err.message}</span>`;
    console.error(err);
  }
});
