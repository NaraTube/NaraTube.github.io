const loginButton = document.getElementById("login")
const signeIn = document.getElementById("signIn")


loginButton.addEventListener("click",
    () => {
         location.href = "login.html";
    });

signeIn.addEventListener("click",
    () => {
         location.href = "signIn.html";
    });

