import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const homeButton = document.getElementById("homeButton");
const loginButton = document.getElementById("loginButton");

homeButton.addEventListener("click", () => {
  location.href = "index.html";
});

loginButton.addEventListener("click", async () => {
  const accountName = document.getElementById("accountName");
  const password = document.getElementById("password");

  // 入力チェック
  if (accountName.value === "" || password.value === "") {
    alert("未入力の項目があります");
    return;
  }

  // サインイン時と同じルールで email を生成
  const email = `${accountName.value}@example.com`;

  try {
    await signInWithEmailAndPassword(auth, email, password.value);
    alert("ログイン成功！");
    location.href = "mypage.html";
  } catch (error) {
    alert("ログインできませんでした\n" + "アカウント名かパスワード、またはその両方が間違っています");
  }
});
